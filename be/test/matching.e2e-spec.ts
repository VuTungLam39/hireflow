import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AiStatus } from '../src/common/enums/ai-status.enum.js';
import { ApplicationSource } from '../src/common/enums/application-source.enum.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { ScoreFlag } from '../src/common/enums/score-flag.enum.js';
import { aiConfig } from '../src/config/ai.config.js';
import { LLM_PROVIDER } from '../src/modules/ai/ai.types.js';
import { CvProfile } from '../src/modules/ai/entities/cv-profile.entity.js';
import { FakeLlmProvider } from '../src/modules/ai/providers/fake.llm.js';
import { ApplicationStatusHistory } from '../src/modules/applications/entities/application-status-history.entity.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { CvFile, CvParseStatus } from '../src/modules/files/entities/cv-file.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

interface MatchesView {
  computedAt: string | null;
  computedJdVersion: number | null;
  pending: boolean;
  items: {
    candidate: { id: string; fullName: string };
    score: number;
    flags: ScoreFlag[];
    reasons: { label: string; match: number; evidence: string | null }[];
    invitedAt: string | null;
    applicationId: string | null;
  }[];
}

// F-MATCH-01, F-MATCH-02 · US-10 · BR-MATCH-01 → 04 · API Contract 4.4
describe('Matching old candidates (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = { hr: `m-hr-${run}@example.com`, hm: `m-hm-${run}@example.com` };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const ids = { dep: '', hr: '', oldJob: '', otherJob: '', job: '' };
  const cand: Record<string, string> = {};
  const llm = new FakeLlmProvider();

  const server = () => app.getHttpServer();
  const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);
  const matches = async (who: Who = 'hr') =>
    (await as(who, request(server()).get(`/api/v1/jobs/${ids.job}/matches`)).expect(200)).body
      .data as MatchesView;
  const invite = (who: Who, candidateId: string) =>
    as(who, request(server()).post(`/api/v1/jobs/${ids.job}/matches/${candidateId}/invite`));

  const waitFor = async <T>(read: () => Promise<T>, done: (v: T) => boolean) => {
    const until = Date.now() + 20_000;
    let last: T | undefined;
    while (Date.now() < until) {
      last = await read();
      if (done(last)) return last;
      await new Promise((r) => setTimeout(r, 150));
    }
    throw new Error(`Timed out: ${JSON.stringify(last)}`);
  };
  const tag = (skill: string) => `${skill}${run}`;
  const kw = (skill: string) => tag(skill).toLowerCase();
  const monthsAgo = (n: number) => new Date(Date.now() - n * 30.5 * 86_400_000);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LLM_PROVIDER)
      .useValue(llm)
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);
    const promptVersion = app.get<{ promptVersion: string }>(aiConfig.KEY).promptVersion;

    const dep = await ds
      .getRepository(Department)
      .save({ name: `Match ${run}`, code: `M_${run}`.toUpperCase() });
    const passwordHash = await bcrypt.hash(password, 4);
    const [hr] = await ds.getRepository(User).save([
      { email: emails.hr, fullName: 'M HR', role: Role.Hr, passwordHash },
      {
        email: emails.hm,
        fullName: 'M HM',
        role: Role.HiringManager,
        departmentId: dep.id,
        passwordHash,
      },
    ]);
    const jobOf = (title: string, status: JobStatus) => ({
      title: `${title} ${run}`,
      departmentId: dep.id,
      status,
      location: 'Hà Nội',
      jdText: 'JD',
      createdBy: hr.id,
      publishedAt: status === JobStatus.Draft ? null : new Date(),
    });
    const [oldJob, otherJob, job] = await ds
      .getRepository(Job)
      .save([
        jobOf('Old', JobStatus.Closed),
        jobOf('Other', JobStatus.Open),
        jobOf('New', JobStatus.Draft),
      ]);
    await ds.getRepository(JobRequirement).save(
      [
        ['NestJS', RequirementType.Must, 3, 2, [kw('NestJS')]],
        ['PostgreSQL', RequirementType.Must, 2, null, [kw('PostgreSQL')]],
        ['Docker', RequirementType.Nice, 1, null, [kw('Docker')]],
      ].map(([label, type, weight, minYears, keywords], i) => ({
        jobId: job.id,
        jdVersion: 1,
        position: i + 1,
        label: label as string,
        type: type as RequirementType,
        weight: weight as number,
        minYears: minYears as number | null,
        keywords: keywords as string[],
      })),
    );
    Object.assign(ids, {
      dep: dep.id,
      hr: hr.id,
      oldJob: oldJob.id,
      otherJob: otherJob.id,
      job: job.id,
    });

    const people: {
      key: string;
      skills: [string, number][];
      appliedMonthsAgo: number;
      anonymized?: boolean;
      appliedToNewJob?: boolean;
      recentInvite?: boolean;
    }[] = [
      {
        key: 'strong',
        skills: [
          ['NestJS', 3],
          ['PostgreSQL', 2],
        ],
        appliedMonthsAgo: 2,
      },
      {
        key: 'half',
        skills: [
          ['PostgreSQL', 1],
          ['Docker', 1],
        ],
        appliedMonthsAgo: 1,
      },
      { key: 'weak', skills: [['Docker', 4]], appliedMonthsAgo: 1 },
      {
        key: 'expired',
        skills: [
          ['NestJS', 5],
          ['PostgreSQL', 5],
        ],
        appliedMonthsAgo: 13,
      },
      {
        key: 'inviteOnly',
        skills: [
          ['NestJS', 5],
          ['PostgreSQL', 5],
        ],
        appliedMonthsAgo: 13,
        recentInvite: true,
      },
      {
        key: 'anon',
        skills: [
          ['NestJS', 5],
          ['PostgreSQL', 5],
        ],
        appliedMonthsAgo: 1,
        anonymized: true,
      },
      {
        key: 'applied',
        skills: [
          ['NestJS', 5],
          ['PostgreSQL', 5],
        ],
        appliedMonthsAgo: 1,
        appliedToNewJob: true,
      },
    ];
    for (const p of people) {
      const c = await ds.getRepository(Candidate).save({
        fullName: `Match ${p.key} ${run}`,
        email: `m-${p.key.toLowerCase()}-${run}@example.com`,
        phone: '0912345678',
        consentAt: new Date(),
        consentVersion: 'v1',
        anonymizedAt: p.anonymized ? new Date() : null,
      });
      cand[p.key] = c.id;
      const lines = p.skills.map(
        ([name, years]) => `${years} năm làm ${tag(name)} tại công ty ${p.key}`,
      );
      const cv = await ds.getRepository(CvFile).save({
        candidateId: c.id,
        storageKey: `cv/test/${run}-${p.key}.pdf`,
        originalName: 'cv.pdf',
        mime: 'application/pdf',
        sizeBytes: 1000,
        sha256: randomUUID().replace(/-/g, '').padEnd(64, '0'),
        parseStatus: CvParseStatus.Parsed,
        text: lines.join('\n'),
      });
      await ds.getRepository(CvProfile).save({
        cvFileId: cv.id,
        data: {
          skills: p.skills.map(([name, years], i) => ({
            name: tag(name),
            years,
            evidence: lines[i],
          })),
          experiences: [],
          education: [],
          summary: '',
        },
        model: 'fake',
        promptVersion,
        inputTokens: 0,
        outputTokens: 0,
      });
      const own = await ds.getRepository(Application).save({
        jobId: oldJob.id,
        candidateId: c.id,
        cvFileId: cv.id,
        source: ApplicationSource.PublicForm,
        status: ApplicationStatus.Rejected,
      });
      await ds.query(`UPDATE applications SET created_at = $2 WHERE id = $1`, [
        own.id,
        monthsAgo(p.appliedMonthsAgo),
      ]);
      if (p.recentInvite) {
        await ds.getRepository(Application).save({
          jobId: otherJob.id,
          candidateId: c.id,
          cvFileId: cv.id,
          source: ApplicationSource.MatchInvite,
        });
      }
      if (p.appliedToNewJob) {
        await ds
          .getRepository(Application)
          .save({ jobId: job.id, candidateId: c.id, cvFileId: cv.id });
      }
    }

    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  }, 30_000);

  afterAll(async () => {
    const candidateIds = Object.values(cand);
    const jobIds = [ids.oldJob, ids.otherJob, ids.job];
    const apps = await ds.getRepository(Application).findBy({ jobId: In(jobIds) });
    await ds
      .getRepository(ApplicationStatusHistory)
      .delete({ applicationId: In(apps.map((a) => a.id)) });
    await ds.query(`DELETE FROM job_matches WHERE job_id = ANY($1)`, [jobIds]);
    await ds.getRepository(Application).delete({ jobId: In(jobIds) });
    await ds.getRepository(CvFile).delete({ candidateId: In(candidateIds) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(JobRequirement).delete({ jobId: In(jobIds) });
    await ds.getRepository(Job).delete({ id: In(jobIds) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: ids.dep });
    await app.close();
  }, 30_000);

  it('a DRAFT job has no suggestions yet', async () => {
    expect(await matches()).toMatchObject({ computedAt: null, pending: false, items: [] });
  });

  it('BR-MATCH-01, BR-MATCH-02: publishing finds past candidates scoring ≥ 50, with verified reasons', async () => {
    await as('hr', request(server()).patch(`/api/v1/jobs/${ids.job}/publish`)).expect(200);
    const view = await waitFor(matches, (v) => v.computedJdVersion === 1);
    expect(view.pending).toBe(false);
    expect(view.items.map((i) => [i.candidate.id, i.score])).toEqual([
      [cand.strong, 83],
      [cand.half, 50],
    ]);
    const [strong, half] = view.items;
    expect(strong.reasons.map((r) => [r.label, r.match])).toEqual([
      ['NestJS', 1],
      ['PostgreSQL', 1],
      ['Docker', 0],
    ]);
    expect(strong.reasons[0].evidence).toBe(`3 năm làm ${tag('NestJS')} tại công ty strong`);
    expect(half.flags).toEqual([ScoreFlag.MissingMust]);
    expect(strong).toMatchObject({ invitedAt: null, applicationId: null });
  });

  it('BR-MATCH-01, BR-MATCH-04: skips anonymized, expired, already-applied candidates; invites do not extend retention', async () => {
    const found = (await matches()).items.map((i) => i.candidate.id);
    for (const key of ['weak', 'expired', 'inviteOnly', 'anon', 'applied']) {
      expect(found).not.toContain(cand[key]);
    }
  });

  it('an OPEN job published before this feature gets suggestions on first view', async () => {
    const read = async () =>
      (await as('hr', request(server()).get(`/api/v1/jobs/${ids.otherJob}/matches`)).expect(200))
        .body.data as MatchesView;
    expect((await read()).pending).toBe(true);
    const view = await waitFor(read, (v) => v.computedJdVersion === 1);
    expect(view).toMatchObject({ pending: false, items: [] });
  });

  it('only Admin and HR see and invite suggestions', async () => {
    await as('hm', request(server()).get(`/api/v1/jobs/${ids.job}/matches`)).expect(403);
    await invite('hm', cand.strong).expect(403);
  });

  it('BR-MATCH-03: one action creates a MATCH_INVITE application in NEW, scored without calling the LLM', async () => {
    const res = await invite('hr', cand.strong).expect(201);
    const created = res.body.data as { id: string; source: string; status: string };
    expect(created).toMatchObject({ source: ApplicationSource.MatchInvite, status: 'NEW' });

    const done = await waitFor(
      async () =>
        (await as('hr', request(server()).get(`/api/v1/applications/${created.id}`)).expect(200))
          .body.data as { aiStatus: AiStatus; score: number | null },
      (d) => d.aiStatus === AiStatus.Done,
    );
    expect(done.score).toBe(83);
    expect(llm.calls.filter((c) => c.task === 'extract-cv')).toHaveLength(0);

    const history = await ds
      .getRepository(ApplicationStatusHistory)
      .findBy({ applicationId: created.id });
    expect(history).toMatchObject([{ fromStatus: null, toStatus: 'NEW', changedBy: ids.hr }]);

    const strong = (await matches()).items.find((i) => i.candidate.id === cand.strong)!;
    expect(strong).toMatchObject({ applicationId: created.id, invitedAt: expect.any(String) });
  });

  it('BR-MATCH-03: inviting twice is 409 APPLICATION_DUPLICATED; unknown candidate is 404', async () => {
    const again = await invite('hr', cand.strong).expect(409);
    expect(again.body.code).toBe('APPLICATION_DUPLICATED');
    await invite('hr', randomUUID()).expect(404);
  });

  it('BR-MATCH-01: saving requirements on an OPEN job recomputes suggestions and keeps invited ones', async () => {
    await as('hr', request(server()).put(`/api/v1/jobs/${ids.job}/requirements`))
      .send({
        requirements: [
          {
            label: 'PostgreSQL',
            type: 'MUST',
            weight: 2,
            minYears: null,
            keywords: [kw('PostgreSQL')],
          },
          { label: 'Docker', type: 'NICE', weight: 1, minYears: null, keywords: [kw('Docker')] },
        ],
      })
      .expect(202);
    const view = await waitFor(matches, (v) => v.computedJdVersion === 2);
    const byId = new Map(view.items.map((i) => [i.candidate.id, i]));
    expect(byId.get(cand.half)?.score).toBe(100);
    expect(byId.has(cand.weak)).toBe(false);
    expect(byId.get(cand.strong)?.invitedAt).toEqual(expect.any(String));
  });

  it('BR-MATCH-03: a closed job cannot invite (409 JOB_NOT_OPEN)', async () => {
    await as('hr', request(server()).patch(`/api/v1/jobs/${ids.job}/close`)).expect(200);
    const res = await invite('hr', cand.half).expect(409);
    expect(res.body.code).toBe('JOB_NOT_OPEN');
  });
});
