import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AiStatus } from '../src/common/enums/ai-status.enum.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { QueryCounter } from '../src/database/perf/query-counter.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// Kickoff 6 "Không N+1" · Backend Architecture 16.1 · US-06
describe('Query count (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let counter: QueryCounter;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = { hr: `qc-hr-${run}@example.com`, hm: `qc-hm-${run}@example.com` };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const ids = { dep: '', bigJob: '', smallJob: '', candidates: [] as string[], app: '' };
  const MANY = 30;

  const queriesFor = async (who: Who, path: string) => {
    const { queries } = await counter.count(async () => {
      await request(app.getHttpServer())
        .get(`/api/v1${path}`)
        .set('Authorization', `Bearer ${tokens[who]}`)
        .expect(200);
    });
    return queries.length;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);
    counter = new QueryCounter(ds);

    const dep = await ds
      .getRepository(Department)
      .save({ name: `Đếm query ${run}`, code: `QC_${run}`.toUpperCase() });
    const passwordHash = await bcrypt.hash(password, 4);
    const [hr] = await ds.getRepository(User).save([
      { email: emails.hr, fullName: 'QC HR', role: Role.Hr, passwordHash },
      {
        email: emails.hm,
        fullName: 'QC HM',
        role: Role.HiringManager,
        departmentId: dep.id,
        passwordHash,
      },
    ]);
    const [bigJob, smallJob] = await ds.getRepository(Job).save(
      [`Job nhiều hồ sơ ${run}`, `Job ít hồ sơ ${run}`].map((title) => ({
        title,
        departmentId: dep.id,
        status: JobStatus.Open,
        location: 'Hà Nội',
        jdText: 'JD',
        jdVersion: 1,
        createdBy: hr.id,
        publishedAt: new Date(),
      })),
    );
    await ds.getRepository(JobRequirement).save(
      [bigJob, smallJob].map((job) => ({
        jobId: job.id,
        jdVersion: 1,
        position: 1,
        label: 'NestJS',
        type: RequirementType.Must,
        weight: 3,
        minYears: null,
        keywords: ['nestjs'],
      })),
    );
    const candidates = await ds.getRepository(Candidate).save(
      Array.from({ length: MANY }, (_, i) => ({
        fullName: `Ứng viên ${i} ${run}`,
        email: `qc-c${i}-${run}@example.com`,
        consentAt: new Date(),
        consentVersion: 'v1',
      })),
    );
    const apps = await ds.getRepository(Application).save(
      candidates.map((c, i) => ({
        jobId: i === 0 ? smallJob.id : bigJob.id,
        candidateId: c.id,
        status: ApplicationStatus.Screening,
        aiStatus: AiStatus.Done,
        score: 50 + (i % 50),
        scoreBreakdown: [],
        scoredJdVersion: 1,
      })),
    );
    Object.assign(ids, {
      dep: dep.id,
      bigJob: bigJob.id,
      smallJob: smallJob.id,
      candidates: candidates.map((c) => c.id),
      app: apps[1].id,
    });

    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    await ds.getRepository(Application).delete({ candidateId: In(ids.candidates) });
    await ds.getRepository(Candidate).delete({ id: In(ids.candidates) });
    await ds.getRepository(Job).delete({ id: In([ids.bigJob, ids.smallJob]) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: ids.dep });
    await app.close();
  });

  it.each([
    ['hr', `/applications?jobId={big}&limit=5`, `/applications?jobId={big}&limit=29`],
    ['hr', `/applications?search=${run}&limit=5`, `/applications?search=${run}&limit=30`],
    [
      'hr',
      `/applications?search=${run}&sortBy=score&order=DESC&limit=5`,
      `/applications?search=${run}&sortBy=score&order=DESC&limit=30`,
    ],
    ['hm', `/applications?jobId={big}&limit=5`, `/applications?jobId={big}&limit=29`],
    ['hr', `/candidates?search=${run}&limit=5`, `/candidates?search=${run}&limit=30`],
    ['hm', `/candidates?search=${run}&limit=5`, `/candidates?search=${run}&limit=30`],
    ['hr', `/jobs?search=${run}&limit=1`, `/jobs?search=${run}&limit=2`],
    ['hr', `/jobs/{small}/ranking`, `/jobs/{big}/ranking`],
    ['hm', `/jobs/{small}/ranking`, `/jobs/{big}/ranking`],
  ] as [Who, string, string][])(
    'US-06: %s %s uses the same number of queries as more rows',
    async (who, few, many) => {
      const fill = (path: string) =>
        path.replace('{big}', ids.bigJob).replace('{small}', ids.smallJob);
      const fewCount = await queriesFor(who, fill(few));
      const manyCount = await queriesFor(who, fill(many));
      expect(manyCount).toBe(fewCount);
      expect(fewCount).toBeLessThanOrEqual(5);
    },
  );

  it('Kickoff 14: dashboard is one aggregate query plus the auth lookup', async () => {
    expect(await queriesFor('hr', '/dashboard/summary')).toBeLessThanOrEqual(2);
    expect(await queriesFor('hm', '/dashboard/summary')).toBeLessThanOrEqual(2);
  });

  it('US-04: application detail uses a fixed number of queries', async () => {
    expect(await queriesFor('hr', `/applications/${ids.app}`)).toBeLessThanOrEqual(3);
  });
});
