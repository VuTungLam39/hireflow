import type { Faker } from '@faker-js/faker';
import type { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { AiStatus } from '../../common/enums/ai-status.enum.js';
import { ApplicationSource } from '../../common/enums/application-source.enum.js';
import { ApplicationStatusHistory } from '../../modules/applications/entities/application-status-history.entity.js';
import { Application } from '../../modules/applications/entities/application.entity.js';
import { Candidate } from '../../modules/candidates/entities/candidate.entity.js';
import { CvFile, CvParseStatus } from '../../modules/files/entities/cv-file.entity.js';
import { JobRequirement } from '../../modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../../modules/jobs/entities/job.entity.js';
import {
  cvTextOf,
  emailOf,
  fakeSha256,
  historyOf,
  jdTextOf,
  phoneOf,
  pickAiStatus,
  pickSource,
  pickStatus,
  scoreOf,
  type SeedRequirement,
  TRACKS,
} from './factories.js';

const DAY = 86_400_000;

// Backend Architecture 8.3
export const BATCH = 5_000;
const MAX_PARAMS = 65_535;

export interface SeedContext {
  departments: { id: string; track: keyof typeof TRACKS }[];
  hrIds: string[];
  managerIds: Map<string, string[]>;
  adminId: string;
}

export interface SeededJob {
  id: string;
  departmentId: string;
  status: JobStatus;
  publishedAt: Date | null;
  closedAt: Date | null;
  requirements: SeedRequirement[];
}

export async function insertBatches<T extends ObjectLiteral>(
  dataSource: DataSource,
  entity: EntityTarget<T>,
  rows: Partial<T>[],
): Promise<void> {
  const columns = dataSource.getMetadata(entity).columns.length;
  const size = Math.min(BATCH, Math.floor(MAX_PARAMS / columns));
  for (let i = 0; i < rows.length; i += size) {
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(entity)
      .values(rows.slice(i, i + size) as T[])
      .updateEntity(false)
      .execute();
  }
}

export async function seedJobs(
  dataSource: DataSource,
  f: Faker,
  ctx: SeedContext,
  count: number,
  statusOf: (index: number) => JobStatus,
): Promise<SeededJob[]> {
  const jobs: Partial<Job>[] = [];
  const requirements: Partial<JobRequirement>[] = [];
  const seeded: SeededJob[] = [];
  const perDepartment = new Map<string, number>();

  for (let i = 0; i < count; i++) {
    const department = ctx.departments[i % ctx.departments.length];
    const templates = TRACKS[department.track];
    const n = perDepartment.get(department.id) ?? 0;
    perDepartment.set(department.id, n + 1);
    const template = templates[n % templates.length];
    const round = Math.floor(n / templates.length);

    const status = statusOf(i);
    const createdAt = f.date.between({
      from: Date.now() - 400 * DAY,
      to: Date.now() - 60 * DAY,
    });
    const publishedAt = status === JobStatus.Draft ? null : new Date(createdAt.getTime() + DAY);
    const closedAt =
      status === JobStatus.Closed
        ? new Date(createdAt.getTime() + f.number.int({ min: 30, max: 50 }) * DAY)
        : null;
    const id = f.string.uuid();

    jobs.push({
      id,
      title: round ? `${template.title} – đợt ${round + 1}` : template.title,
      departmentId: department.id,
      status,
      location: template.location,
      jdText: jdTextOf(template),
      jdVersion: 1,
      createdBy: f.helpers.arrayElement(ctx.hrIds),
      publishedAt,
      closedAt,
      createdAt,
      updatedAt: closedAt ?? publishedAt ?? createdAt,
    });

    const reqs = template.requirements.map(
      ([label, type, weight, minYears, keywords], position) => {
        const req = { id: f.string.uuid(), label, type, weight, minYears };
        requirements.push({
          ...req,
          jobId: id,
          jdVersion: 1,
          position: position + 1,
          keywords,
          createdAt,
        });
        return req;
      },
    );
    seeded.push({
      id,
      departmentId: department.id,
      status,
      publishedAt,
      closedAt,
      requirements: reqs,
    });
  }

  await insertBatches(dataSource, Job, jobs);
  await insertBatches(dataSource, JobRequirement, requirements);
  return seeded;
}

export async function seedCandidates(
  dataSource: DataSource,
  f: Faker,
  ctx: SeedContext,
  jobs: SeededJob[],
  opts: {
    candidates: number;
    appsPerCandidate: (index: number) => number;
    chunk?: number;
    onChunk?: (done: number) => void;
  },
): Promise<{ applications: number; history: number }> {
  const open = jobs.filter((j) => j.status !== JobStatus.Draft);
  const chunk = opts.chunk ?? BATCH;
  let applicationsTotal = 0;
  let historyTotal = 0;

  for (let start = 0; start < opts.candidates; start += chunk) {
    const candidates: Partial<Candidate>[] = [];
    const cvFiles: Partial<CvFile>[] = [];
    const applications: Partial<Application>[] = [];
    const history: Partial<ApplicationStatusHistory>[] = [];

    for (let index = start; index < Math.min(start + chunk, opts.candidates); index++) {
      const fullName = f.person.fullName();
      const candidateId = f.string.uuid();
      const cvFileId = f.string.uuid();
      const picked = f.helpers.arrayElements(
        open,
        Math.min(opts.appsPerCandidate(index), open.length),
      );
      const cvLines: string[] = [];
      let firstAppliedAt = Date.now();

      for (const job of picked) {
        const from = job.publishedAt!.getTime();
        const to = Math.min(job.closedAt?.getTime() ?? Date.now(), Date.now());
        const createdAt = f.date.between({ from, to });
        firstAppliedAt = Math.min(firstAppliedAt, createdAt.getTime());

        const status = pickStatus(f);
        const aiStatus = pickAiStatus(f, status);
        const source = pickSource(f);
        const scored = aiStatus === AiStatus.Done ? scoreOf(f, job.requirements) : null;
        if (scored) cvLines.push(...scored.lines);

        const applicationId = f.string.uuid();
        const steps = historyOf(f, status, createdAt);
        const managers = ctx.managerIds.get(job.departmentId) ?? [ctx.adminId];
        for (const [i, step] of steps.entries()) {
          history.push({
            id: f.string.uuid(),
            applicationId,
            fromStatus: step.fromStatus,
            toStatus: step.toStatus,
            reason: step.reason,
            changedBy:
              i === 0
                ? source === ApplicationSource.HrUpload
                  ? f.helpers.arrayElement(ctx.hrIds)
                  : null
                : step.byManager
                  ? f.helpers.arrayElement(managers)
                  : f.helpers.arrayElement(ctx.hrIds),
            changedAt: step.changedAt,
          });
        }

        applications.push({
          id: applicationId,
          jobId: job.id,
          candidateId,
          cvFileId,
          source,
          status,
          statusChangedAt: steps.at(-1)!.changedAt,
          aiStatus,
          aiError: aiStatus === AiStatus.Failed ? 'File scan, không có lớp text' : null,
          score: scored?.score ?? null,
          scoreBreakdown: scored?.breakdown ?? null,
          flags: scored?.flags ?? [],
          scoredJdVersion: scored ? 1 : null,
          scoredAt: scored ? new Date(createdAt.getTime() + 60_000) : null,
          createdAt,
          updatedAt: steps.at(-1)!.changedAt,
        });
      }

      const joinedAt = new Date(firstAppliedAt);
      candidates.push({
        id: candidateId,
        fullName,
        email: emailOf(fullName, index),
        phone: f.datatype.boolean({ probability: 0.9 }) ? phoneOf(f) : null,
        consentAt: joinedAt,
        consentVersion: 'v1',
        createdAt: joinedAt,
        updatedAt: joinedAt,
      });
      cvFiles.push({
        id: cvFileId,
        candidateId,
        storageKey: `cv/${joinedAt.getFullYear()}/${String(joinedAt.getMonth() + 1).padStart(2, '0')}/${cvFileId}.pdf`,
        originalName: `CV_${fullName.replace(/\s+/g, '_')}.pdf`,
        mime: 'application/pdf',
        sizeBytes: f.number.int({ min: 40_000, max: 900_000 }),
        sha256: fakeSha256(cvFileId),
        parseStatus: CvParseStatus.Parsed,
        text: cvTextOf(fullName, cvLines),
        createdAt: joinedAt,
        updatedAt: joinedAt,
      });
    }

    await insertBatches(dataSource, Candidate, candidates);
    await insertBatches(dataSource, CvFile, cvFiles);
    await insertBatches(dataSource, Application, applications);
    await insertBatches(dataSource, ApplicationStatusHistory, history);
    applicationsTotal += applications.length;
    historyTotal += history.length;
    opts.onChunk?.(Math.min(start + chunk, opts.candidates));
  }

  return { applications: applicationsTotal, history: historyTotal };
}
