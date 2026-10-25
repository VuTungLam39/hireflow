import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import { AiStatus } from '../../../common/enums/ai-status.enum.js';
import { ApplicationSource } from '../../../common/enums/application-source.enum.js';
import { ApplicationStatus } from '../../../common/enums/application-status.enum.js';
import { Role } from '../../../common/enums/role.enum.js';
import { normalizeKeywords, normalizeText } from '../../../common/utils/text.js';
import { CvParseError, extractCvText } from '../../../modules/ai/cv-parser.js';
import { CvProfile, type CvProfileData } from '../../../modules/ai/entities/cv-profile.entity.js';
import { AI_ERROR } from '../../../modules/ai/pipeline/cv-pipeline.service.js';
import { scoreApplication, type ScoreResult } from '../../../modules/ai/scoring.js';
import { makeDocx, makePdf } from '../../../modules/ai/testing/cv-fixtures.js';
import { assertTransition } from '../../../modules/applications/application-status.js';
import {
  HR_CONSENT_VERSION,
  PUBLIC_CONSENT_VERSION,
} from '../../../modules/applications/applications.service.js';
import { ApplicationNote } from '../../../modules/applications/entities/application-note.entity.js';
import { ApplicationStatusHistory } from '../../../modules/applications/entities/application-status-history.entity.js';
import { Application } from '../../../modules/applications/entities/application.entity.js';
import { ANONYMIZED_NAME } from '../../../modules/candidates/candidates.service.js';
import { Candidate } from '../../../modules/candidates/entities/candidate.entity.js';
import { Department } from '../../../modules/departments/entities/department.entity.js';
import {
  CV_MIME_TYPES,
  CvFile,
  CvParseStatus,
} from '../../../modules/files/entities/cv-file.entity.js';
import type { StorageService } from '../../../modules/files/storage/storage.service.js';
import { JobRequirement } from '../../../modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../../../modules/jobs/entities/job.entity.js';
import { RefreshToken } from '../../../modules/refresh-tokens/entities/refresh-token.entity.js';
import { User } from '../../../modules/users/entities/user.entity.js';
import { ANONYMIZED, APPLICATIONS, type DemoApplication } from './applications.js';
import { CANDIDATES, type DemoCandidate, type DemoCv } from './candidates.js';
import { JOBS, type DemoJob } from './jobs.js';
import { at, DEPARTMENTS, SESSIONS, USERS } from './org.js';

const [PDF_MIME, DOCX_MIME] = CV_MIME_TYPES;
const MINUTE = 60_000;
const DAY = 86_400_000;
const REFRESH_TTL = 7 * DAY;
const PROMPT_VERSION = process.env.AI_PROMPT_VERSION ?? 'v1';

export const demoId = (name: string) => {
  const h = createHash('sha256').update(`hireflow-demo:${name}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const BUSINESS_TABLES = [
  'application_notes',
  'application_status_history',
  'applications',
  'cv_profiles',
  'cv_files',
  'candidates',
  'job_requirements',
  'jobs',
];

interface BuiltCv {
  id: string;
  candidateId: string;
  def: DemoCv;
  buffer: Buffer;
  mime: string;
  text: string | null;
  parseStatus: CvParseStatus;
  parseError: string | null;
  uploadedAt: Date;
  storageKey: string;
  skills: CvProfileData['skills'];
}

export interface DemoSeedResult {
  [table: string]: number;
}

export async function seedDemo(
  dataSource: DataSource,
  storage: StorageService,
  options: { reset: boolean; password: string },
): Promise<DemoSeedResult> {
  const hasJobs = await dataSource.getRepository(Job).exists({ withDeleted: true });
  if (hasJobs && !options.reset) {
    throw new Error('Database already has jobs. Run with --reset to replace business data.');
  }

  const cvs = await buildCvs();
  const storedKeys: string[] = [];
  try {
    await dataSource.transaction(async (manager) => {
      if (options.reset) {
        await manager.query(
          `DELETE FROM ${BUSINESS_TABLES.map((t) => `"${t}"`).join('; DELETE FROM ')}`,
        );
      }
      const departmentIds = await seedDepartments(manager);
      const userIds = await seedUsers(manager, departmentIds, options.password);
      await seedSessions(manager, userIds);
      const jobs = await seedJobs(manager, departmentIds, userIds);
      const candidateIds = await seedCandidates(manager, userIds);
      for (const cv of cvs.values()) {
        if (cv.def.key.startsWith(`${ANONYMIZED.candidate}-`)) continue;
        await storage.put(cv.storageKey, cv.buffer, cv.mime);
        storedKeys.push(cv.storageKey);
      }
      await seedCvFiles(manager, cvs);
      await seedApplications(manager, { jobs, candidateIds, userIds, cvs });
    });
  } catch (error) {
    await Promise.allSettled(storedKeys.map((k) => storage.remove(k)));
    throw error;
  }
  return countRows(dataSource);
}

async function buildCvs(): Promise<Map<string, BuiltCv>> {
  const firstUse = new Map<string, DemoApplication>();
  for (const app of [...APPLICATIONS].sort((a, b) => a.appliedAt.localeCompare(b.appliedAt))) {
    if (!firstUse.has(app.cv)) firstUse.set(app.cv, app);
  }
  const built = new Map<string, BuiltCv>();
  for (const candidate of CANDIDATES) {
    for (const def of candidate.cvs) {
      const app = firstUse.get(def.key);
      if (!app) throw new Error(`CV ${def.key} is not used by any application`);
      const pending = APPLICATIONS.filter((a) => a.cv === def.key).every((a) => a.ai === 'PENDING');
      const buffer = def.scanned ? makePdf([]) : await makeDocx(paragraphsOf(candidate, def));
      const mime = def.scanned ? PDF_MIME : DOCX_MIME;
      const id = demoId(`cv:${def.key}`);
      const uploadedAt = at(app.appliedAt);
      const ext = def.scanned ? 'pdf' : 'docx';

      let text: string | null = null;
      let parseStatus = CvParseStatus.Pending;
      let parseError: string | null = null;
      if (!pending) {
        try {
          text = await extractCvText(buffer, mime);
          parseStatus = CvParseStatus.Parsed;
        } catch (error) {
          if (!(error instanceof CvParseError)) throw error;
          parseStatus = CvParseStatus.Failed;
          parseError = error.message;
        }
      }
      if (text) assertEvidence(def, text);

      built.set(def.key, {
        id,
        candidateId: demoId(`candidate:${candidate.key}`),
        def,
        buffer,
        mime,
        text,
        parseStatus,
        parseError,
        uploadedAt,
        storageKey: `cv/${uploadedAt.getFullYear()}/${String(uploadedAt.getMonth() + 1).padStart(2, '0')}/${id}.${ext}`,
        skills: [...def.skills, ...(def.hallucinated ?? [])].map(([name, years, evidence]) => ({
          name,
          years,
          evidence,
        })),
      });
    }
  }
  return built;
}

const formatPhone = (phone: string) => phone.replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');
const monthOf = (value: string) => `${value.slice(5, 7)}/${value.slice(0, 4)}`;
const headerOf = (e: DemoCv['experiences'][number]) =>
  `${e.title} – ${e.company} (${monthOf(e.from)} – ${e.to ? monthOf(e.to) : 'nay'})`;
const educationOf = (def: DemoCv) =>
  `${def.education.degree} – ${def.education.school} (tốt nghiệp ${def.education.year})`;

function paragraphsOf(candidate: DemoCandidate, def: DemoCv): string[] {
  return [
    candidate.fullName,
    def.headline,
    `Email: ${candidate.email} | Điện thoại: ${candidate.phone ? formatPhone(candidate.phone) : ''} | ${candidate.city}`,
    'MỤC TIÊU NGHỀ NGHIỆP',
    def.summary,
    'KINH NGHIỆM LÀM VIỆC',
    ...def.experiences.flatMap((e) => [headerOf(e), ...e.lines]),
    'KỸ NĂNG',
    ...def.skillLines,
    'HỌC VẤN',
    educationOf(def),
  ];
}

// BR-AI-03
function assertEvidence(def: DemoCv, text: string): void {
  const normalized = normalizeText(text);
  for (const [name, , evidence] of def.skills) {
    if (!normalized.includes(normalizeText(evidence))) {
      throw new Error(`CV ${def.key}: evidence for ${name} is not in the CV text`);
    }
  }
  for (const [name, , evidence] of def.hallucinated ?? []) {
    if (normalized.includes(normalizeText(evidence))) {
      throw new Error(`CV ${def.key}: hallucinated evidence for ${name} exists in the CV text`);
    }
  }
}

async function seedDepartments(manager: EntityManager): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const [index, d] of DEPARTMENTS.entries()) {
    const existing = await manager.findOne(Department, {
      where: { code: d.code },
      withDeleted: true,
    });
    if (existing) {
      await manager.update(Department, existing.id, { name: d.name, deletedAt: null });
      ids.set(d.code, existing.id);
      continue;
    }
    const id = demoId(`department:${d.code}`);
    const createdAt = new Date(at('2026-06-01 08:00').getTime() + index * MINUTE);
    await manager.insert(Department, { id, ...d, createdAt, updatedAt: createdAt });
    ids.set(d.code, id);
  }
  return ids;
}

async function seedUsers(
  manager: EntityManager,
  departmentIds: Map<string, string>,
  password: string,
): Promise<Map<string, string>> {
  const passwordHash = await bcrypt.hash(password, 10);
  const ids = new Map<string, string>();
  for (const u of USERS) {
    const departmentId = u.department ? departmentIds.get(u.department)! : null;
    const existing = await manager.findOne(User, { where: { email: u.email }, withDeleted: true });
    const profile = {
      fullName: u.fullName,
      role: u.role,
      departmentId,
      isActive: u.isActive ?? true,
      lastLoginAt: u.lastLoginAt ? at(u.lastLoginAt) : null,
      deletedAt: null,
    };
    if (existing) {
      await manager.update(User, existing.id, profile);
      ids.set(u.key, existing.id);
      continue;
    }
    const id = demoId(`user:${u.key}`);
    await manager.insert(User, {
      id,
      email: u.email,
      passwordHash,
      ...profile,
      createdAt: at(u.createdAt),
      updatedAt: at(u.createdAt),
    });
    ids.set(u.key, id);
  }
  return ids;
}

// Backend Architecture 10.5
async function seedSessions(manager: EntityManager, userIds: Map<string, string>): Promise<void> {
  const families = SESSIONS.map((_, i) => demoId(`session:${i}`));
  await manager
    .createQueryBuilder()
    .delete()
    .from(RefreshToken)
    .where('family_id IN (:...families)', { families })
    .execute();
  const rows: Partial<RefreshToken>[] = [];
  for (const [i, s] of SESSIONS.entries()) {
    const first = at(s.startedAt);
    const rotated = new Date(first.getTime() + 16 * MINUTE);
    const ended = new Date(rotated.getTime() + 3 * 60 * MINUTE);
    const base = {
      userId: userIds.get(s.user)!,
      familyId: families[i],
      userAgent: s.userAgent,
      ip: s.ip,
    };
    rows.push(
      {
        ...base,
        tokenHash: createHash('sha256').update(randomBytes(32)).digest('hex'),
        createdAt: first,
        expiresAt: new Date(first.getTime() + REFRESH_TTL),
        revokedAt: rotated,
      },
      {
        ...base,
        tokenHash: createHash('sha256').update(randomBytes(32)).digest('hex'),
        createdAt: rotated,
        expiresAt: new Date(rotated.getTime() + REFRESH_TTL),
        revokedAt: s.end === 'logout' ? ended : null,
      },
    );
  }
  await manager.insert(RefreshToken, rows);
}

interface SeededJob {
  id: string;
  def: DemoJob;
  departmentId: string;
  jdVersion: number;
  requirements: (JobRequirement & { id: string })[];
}

async function seedJobs(
  manager: EntityManager,
  departmentIds: Map<string, string>,
  userIds: Map<string, string>,
): Promise<Map<string, SeededJob>> {
  const jobs = new Map<string, SeededJob>();
  for (const def of JOBS) {
    const id = demoId(`job:${def.key}`);
    const jdVersion = Math.max(def.versions.length, 1);
    const departmentId = departmentIds.get(def.department)!;
    const lastSaved = def.versions.at(-1)?.savedAt;
    const updatedAt =
      def.closedAt ?? [def.publishedAt, lastSaved].filter(Boolean).sort().at(-1) ?? def.createdAt;
    await manager.insert(Job, {
      id,
      title: def.title,
      departmentId,
      status: def.status,
      location: def.location,
      jdText: def.jd.join('\n\n'),
      jdVersion,
      createdBy: userIds.get(def.createdBy)!,
      publishedAt: def.publishedAt ? at(def.publishedAt) : null,
      closedAt: def.closedAt ? at(def.closedAt) : null,
      createdAt: at(def.createdAt),
      updatedAt: at(updatedAt),
    });

    let current: SeededJob['requirements'] = [];
    for (const [v, version] of def.versions.entries()) {
      const rows = version.requirements.map(([label, type, weight, minYears, keywords], position) =>
        manager.create(JobRequirement, {
          id: demoId(`requirement:${def.key}:v${v + 1}:${position}`),
          jobId: id,
          jdVersion: v + 1,
          position: position + 1,
          label,
          type,
          weight,
          minYears,
          keywords: normalizeKeywords(keywords),
          createdAt: at(version.savedAt),
        }),
      );
      await manager.insert(JobRequirement, rows);
      current = rows as SeededJob['requirements'];
    }
    if (def.status !== JobStatus.Draft && !current.length) {
      throw new Error(`Job ${def.key} is published without requirements (BR-JOB-02)`);
    }
    jobs.set(def.key, { id, def, departmentId, jdVersion, requirements: current });
  }
  return jobs;
}

async function seedCandidates(
  manager: EntityManager,
  userIds: Map<string, string>,
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const c of CANDIDATES) {
    const apps = APPLICATIONS.filter((a) => a.candidate === c.key).sort((a, b) =>
      a.appliedAt.localeCompare(b.appliedAt),
    );
    if (!apps.length) throw new Error(`Candidate ${c.key} has no application`);
    const id = demoId(`candidate:${c.key}`);
    const joinedAt = at(apps[0].appliedAt);
    const anonymized = c.key === ANONYMIZED.candidate;
    await manager.insert(Candidate, {
      id,
      fullName: anonymized ? ANONYMIZED_NAME : c.fullName,
      email: anonymized ? `anon+${id}@invalid.local` : c.email,
      phone: anonymized ? null : c.phone,
      consentAt: joinedAt,
      consentVersion:
        apps[0].source === ApplicationSource.HrUpload ? HR_CONSENT_VERSION : PUBLIC_CONSENT_VERSION,
      anonymizedAt: anonymized ? at(ANONYMIZED.at) : null,
      anonymizedBy: anonymized ? userIds.get(ANONYMIZED.by)! : null,
      createdAt: joinedAt,
      updatedAt: anonymized ? at(ANONYMIZED.at) : joinedAt,
    });
    ids.set(c.key, id);
  }
  return ids;
}

async function seedCvFiles(manager: EntityManager, cvs: Map<string, BuiltCv>): Promise<void> {
  for (const cv of cvs.values()) {
    if (cv.def.key.startsWith(`${ANONYMIZED.candidate}-`)) continue;
    await manager.insert(CvFile, {
      id: cv.id,
      candidateId: cv.candidateId,
      storageKey: cv.storageKey,
      originalName: cv.def.fileName,
      mime: cv.mime,
      sizeBytes: cv.buffer.length,
      sha256: createHash('sha256').update(cv.buffer).digest('hex'),
      parseStatus: cv.parseStatus,
      parseError: cv.parseError,
      text: cv.text,
      createdAt: cv.uploadedAt,
      updatedAt: new Date(cv.uploadedAt.getTime() + (cv.text || cv.parseError ? 20_000 : 0)),
    });
    if (cv.parseStatus !== CvParseStatus.Parsed) continue;
    await manager.insert(CvProfile, {
      cvFileId: cv.id,
      data: profileOf(cv),
      model: 'seed',
      promptVersion: PROMPT_VERSION,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      createdAt: new Date(cv.uploadedAt.getTime() + 35_000),
    });
  }
}

function profileOf(cv: BuiltCv): CvProfileData {
  const { def } = cv;
  return {
    skills: cv.skills,
    experiences: def.experiences.map((e) => ({
      title: e.title,
      company: e.company,
      from: e.from,
      to: e.to,
      evidence: headerOf(e),
    })),
    education: [
      {
        school: def.education.school,
        degree: def.education.degree,
        year: def.education.year,
        evidence: educationOf(def),
      },
    ],
    summary: def.summary,
  };
}

async function seedApplications(
  manager: EntityManager,
  ctx: {
    jobs: Map<string, SeededJob>;
    candidateIds: Map<string, string>;
    userIds: Map<string, string>;
    cvs: Map<string, BuiltCv>;
  },
): Promise<void> {
  const managers = new Map(
    USERS.filter((u) => u.role === Role.HiringManager).map((u) => [u.key, u.department]),
  );

  for (const [index, def] of APPLICATIONS.entries()) {
    const job = ctx.jobs.get(def.job)!;
    const cv = ctx.cvs.get(def.cv)!;
    const id = demoId(`application:${def.candidate}:${def.job}`);
    const appliedAt = at(def.appliedAt);
    const anonymized = def.candidate === ANONYMIZED.candidate;
    if (job.def.status === JobStatus.Draft)
      throw new Error(`Application ${index} targets a draft job`);
    if (job.def.publishedAt && appliedAt < at(job.def.publishedAt)) {
      throw new Error(`Application ${index} was submitted before the job was published`);
    }
    if (job.def.closedAt && appliedAt > at(job.def.closedAt)) {
      throw new Error(`Application ${index} was submitted after the job was closed (BR-JOB-03)`);
    }

    // BR-STS-01 → 07
    const history: Partial<ApplicationStatusHistory>[] = [
      {
        id: demoId(`history:${index}:0`),
        applicationId: id,
        fromStatus: null,
        toStatus: ApplicationStatus.New,
        reason: null,
        changedBy: def.uploadedBy ? ctx.userIds.get(def.uploadedBy)! : null,
        changedAt: appliedAt,
      },
    ];
    let status = ApplicationStatus.New;
    let changedAt = appliedAt;
    for (const [step, [to, when, by, reason]] of def.steps.entries()) {
      assertTransition(status, to, reason);
      const stepAt = at(when);
      if (stepAt <= changedAt)
        throw new Error(`Application ${index}: step ${step} goes back in time`);
      const approver =
        to === ApplicationStatus.Hired ||
        (to === ApplicationStatus.Rejected && status === ApplicationStatus.Offer);
      if (approver && by !== 'admin' && managers.get(by) !== job.def.department) {
        throw new Error(
          `Application ${index}: ${by} cannot approve or decline the offer (BR-STS-04, 05)`,
        );
      }
      if (!approver && managers.has(by)) {
        throw new Error(`Application ${index}: hiring manager ${by} cannot move ${status} → ${to}`);
      }
      history.push({
        id: demoId(`history:${index}:${step + 1}`),
        applicationId: id,
        fromStatus: status,
        toStatus: to,
        reason: reason ?? null,
        changedBy: ctx.userIds.get(by)!,
        changedAt: stepAt,
      });
      status = to;
      changedAt = stepAt;
    }

    let scored: ScoreResult | null = null;
    if (def.ai === 'DONE') {
      if (!cv.text) throw new Error(`Application ${index}: CV ${def.cv} has no text to score`);
      scored = scoreApplication(job.requirements, cv.skills, cv.text);
    }
    const scoredAt = new Date(appliedAt.getTime() + 45_000);

    await manager.insert(Application, {
      id,
      jobId: job.id,
      candidateId: ctx.candidateIds.get(def.candidate)!,
      cvFileId: anonymized ? null : cv.id,
      source: def.source,
      status,
      statusChangedAt: changedAt,
      aiStatus:
        def.ai === 'DONE'
          ? AiStatus.Done
          : def.ai === 'FAILED'
            ? AiStatus.Failed
            : AiStatus.Pending,
      aiError: def.ai === 'FAILED' ? AI_ERROR.noText : null,
      score: scored?.score ?? null,
      scoreBreakdown: anonymized ? null : (scored?.breakdown ?? null),
      flags: scored?.flags ?? [],
      scoredJdVersion: scored ? job.jdVersion : null,
      scoredAt: scored ? scoredAt : null,
      createdAt: appliedAt,
      updatedAt: changedAt > scoredAt || !scored ? changedAt : scoredAt,
    });
    await manager.insert(ApplicationStatusHistory, history);

    for (const [n, [by, when, content]] of def.notes.entries()) {
      const author = USERS.find((u) => u.key === by)!;
      if (author.role === Role.HiringManager && author.department !== job.def.department) {
        throw new Error(`Application ${index}: ${by} is outside the job's department (BR-ACC-07)`);
      }
      if (at(when) < appliedAt)
        throw new Error(`Application ${index}: note ${n} predates the application`);
      await manager.insert(ApplicationNote, {
        id: demoId(`note:${index}:${n}`),
        applicationId: id,
        authorId: ctx.userIds.get(by)!,
        content,
        createdAt: at(when),
        updatedAt: at(when),
      });
    }
  }
}

async function countRows(dataSource: DataSource): Promise<DemoSeedResult> {
  const tables = ['departments', 'users', 'refresh_tokens', ...[...BUSINESS_TABLES].reverse()];
  const result: DemoSeedResult = {};
  for (const table of tables) {
    const [row] = await dataSource.query(`SELECT COUNT(*)::int AS n FROM "${table}"`);
    result[table] = row.n;
  }
  return result;
}
