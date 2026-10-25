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
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { Job } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// BE-11 · API Contract 4.4 · BR-JOB-01 → 07
describe('Jobs (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    admin: `j-admin-${run}@example.com`,
    hr: `j-hr-${run}@example.com`,
    hmA: `j-hma-${run}@example.com`,
    hmB: `j-hmb-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const dep = { a: '', b: '' };
  const jobIds: string[] = [];
  const candidateIds: string[] = [];
  let jobA = '';
  let jobB = '';

  const server = () => app.getHttpServer();
  const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);
  const jd = 'Mô tả công việc đủ dài để vượt qua giới hạn năm mươi ký tự của hợp đồng API.';
  const jobBody = (departmentId: string, title = `Backend NestJS ${run}`) => ({
    title,
    departmentId,
    location: 'Hà Nội',
    jdText: jd,
  });
  const requirements = [
    {
      label: 'NestJS',
      type: 'MUST',
      weight: 3,
      minYears: 2,
      keywords: ['NestJS', ' Nest.JS ', 'nestjs'],
    },
    { label: 'Docker', type: 'NICE', weight: 1, minYears: null, keywords: ['Docker'] },
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const [a, b] = await ds.getRepository(Department).save([
      { name: `Jobs A ${run}`, code: `JA_${run}`.toUpperCase() },
      { name: `Jobs B ${run}`, code: `JB_${run}`.toUpperCase() },
    ]);
    dep.a = a.id;
    dep.b = b.id;

    const passwordHash = await bcrypt.hash(password, 4);
    await ds.getRepository(User).save([
      { email: emails.admin, fullName: 'J Admin', role: Role.Admin, passwordHash },
      { email: emails.hr, fullName: 'J HR', role: Role.Hr, passwordHash },
      {
        email: emails.hmA,
        fullName: 'J HM A',
        role: Role.HiringManager,
        departmentId: a.id,
        passwordHash,
      },
      {
        email: emails.hmB,
        fullName: 'J HM B',
        role: Role.HiringManager,
        departmentId: b.id,
        passwordHash,
      },
    ]);
    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    await ds.getRepository(Application).delete({ jobId: In(jobIds) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(Job).delete({ id: In(jobIds) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: In([dep.a, dep.b]) });
    await app.close();
  });

  describe('create and edit', () => {
    it('HR creates a DRAFT job without requirements (BR-JOB-01)', async () => {
      const res = await as('hr', request(server()).post('/api/v1/jobs'))
        .send(jobBody(dep.a))
        .expect(201);
      expect(res.body.data).toMatchObject({
        status: 'DRAFT',
        jdVersion: 1,
        requirements: [],
        applicationCount: 0,
        pipeline: { new: 0, inProgress: 0, hired: 0, closed: 0 },
        department: { id: dep.a, name: `Jobs A ${run}` },
        publishedAt: null,
      });
      jobA = res.body.data.id;
      jobIds.push(jobA);
    });

    it('validates the body and the department', async () => {
      const bad = await as('hr', request(server()).post('/api/v1/jobs'))
        .send({ ...jobBody(dep.a), title: 'Ngắn', jdText: 'quá ngắn' })
        .expect(400);
      expect(bad.body.errors.map((e: { field: string }) => e.field).sort()).toEqual([
        'jdText',
        'title',
      ]);

      const unknown = await as('hr', request(server()).post('/api/v1/jobs'))
        .send(jobBody(randomUUID()))
        .expect(400);
      expect(unknown.body.errors).toEqual([expect.objectContaining({ field: 'departmentId' })]);
    });

    it('a hiring manager cannot create or edit jobs', async () => {
      await as('hmA', request(server()).post('/api/v1/jobs')).send(jobBody(dep.a)).expect(403);
      await as('hmA', request(server()).patch(`/api/v1/jobs/${jobA}`))
        .send({ location: 'X' })
        .expect(403);
    });

    it('HR edits the JD', async () => {
      const res = await as('hr', request(server()).patch(`/api/v1/jobs/${jobA}`))
        .send({ location: 'Remote' })
        .expect(200);
      expect(res.body.data.location).toBe('Remote');
    });
  });

  describe('requirements and publish', () => {
    it('cannot publish without requirements (BR-JOB-02)', async () => {
      const res = await as('hr', request(server()).patch(`/api/v1/jobs/${jobA}/publish`)).expect(
        409,
      );
      expect(res.body.code).toBe('JOB_NOT_PUBLISHABLE');
    });

    it('rejects invalid requirements (BR-JOB-05)', async () => {
      const res = await as('hr', request(server()).put(`/api/v1/jobs/${jobA}/requirements`))
        .send({ requirements: [{ ...requirements[0], weight: 4 }] })
        .expect(400);
      expect(res.body.errors).toEqual([
        expect.objectContaining({ field: 'requirements.0.weight' }),
      ]);
      await as('hr', request(server()).put(`/api/v1/jobs/${jobA}/requirements`))
        .send({ requirements: [] })
        .expect(400);
    });

    it('saving requirements creates a new version and normalizes keywords (BR-JOB-06)', async () => {
      const saved = await as('hr', request(server()).put(`/api/v1/jobs/${jobA}/requirements`))
        .send({ requirements })
        .expect(202);
      expect(saved.body.data).toEqual({ jdVersion: 2 });

      const job = await as('hr', request(server()).get(`/api/v1/jobs/${jobA}`)).expect(200);
      expect(job.body.data.jdVersion).toBe(2);
      expect(job.body.data.requirements).toEqual([
        expect.objectContaining({ label: 'NestJS', minYears: 2, keywords: ['nestjs', 'nest.js'] }),
        expect.objectContaining({ label: 'Docker', minYears: null, keywords: ['docker'] }),
      ]);
    });

    it('keeps old versions when saving again (Database Design D7)', async () => {
      await as('hr', request(server()).put(`/api/v1/jobs/${jobA}/requirements`))
        .send({ requirements: [requirements[0]] })
        .expect(202);
      const rows = await ds.query(
        'SELECT jd_version, count(*)::int AS n FROM job_requirements WHERE job_id = $1 GROUP BY 1 ORDER BY 1',
        [jobA],
      );
      expect(rows).toEqual([
        { jd_version: 2, n: 2 },
        { jd_version: 3, n: 1 },
      ]);
    });

    it('publishes once (BR-JOB-02)', async () => {
      const res = await as('hr', request(server()).patch(`/api/v1/jobs/${jobA}/publish`)).expect(
        200,
      );
      expect(res.body.data.status).toBe('OPEN');
      expect(res.body.data.publishedAt).toBeTruthy();
      await as('hr', request(server()).patch(`/api/v1/jobs/${jobA}/publish`)).expect(409);
    });

    it('AI suggestion is not available until the LLM provider exists', async () => {
      const res = await as(
        'hr',
        request(server()).post(`/api/v1/jobs/${jobA}/requirements/suggest`),
      ).expect(503);
      expect(res.body.code).toBe('AI_UNAVAILABLE');
    });
  });

  describe('list, scope and ranking', () => {
    beforeAll(async () => {
      const res = await as('hr', request(server()).post('/api/v1/jobs'))
        .send(jobBody(dep.b, `Sales B2B ${run}`))
        .expect(201);
      jobB = res.body.data.id;
      jobIds.push(jobB);

      const candidates = await ds.getRepository(Candidate).save(
        [1, 2, 3].map((n) => ({
          fullName: `Ứng viên ${n} ${run}`,
          email: `j-c${n}-${run}@example.com`,
          consentAt: new Date(),
          consentVersion: 'v1',
        })),
      );
      candidateIds.push(...candidates.map((c) => c.id));
      const [reqNest] = await ds.query(
        'SELECT id FROM job_requirements WHERE job_id = $1 AND jd_version = 3',
        [jobA],
      );
      await ds.getRepository(Application).save([
        {
          jobId: jobA,
          candidateId: candidates[0].id,
          status: ApplicationStatus.Interview,
          aiStatus: AiStatus.Done,
          score: 100,
          scoreBreakdown: [
            {
              requirementId: reqNest.id,
              match: 1,
              evidence: 'NestJS 3 năm',
              rejectedEvidence: null,
            },
          ],
        },
        { jobId: jobA, candidateId: candidates[1].id, status: ApplicationStatus.New },
        {
          jobId: jobA,
          candidateId: candidates[2].id,
          status: ApplicationStatus.Rejected,
          aiStatus: AiStatus.Done,
          score: 0,
          scoreBreakdown: [],
        },
      ]);
    });

    const titles = async (who: Who, query = '') => {
      const res = await as(who, request(server()).get(`/api/v1/jobs?search=${run}${query}`)).expect(
        200,
      );
      return res.body.data.map((j: { id: string }) => j.id).sort();
    };

    it('HR sees every job; a hiring manager only their department (BR-ACC-07)', async () => {
      expect(await titles('hr')).toEqual([jobA, jobB].sort());
      expect(await titles('hmA')).toEqual([jobA]);
      expect(await titles('hmB')).toEqual([jobB]);
    });

    it('filters by status and department, and whitelists sortBy', async () => {
      expect(await titles('hr', '&status=DRAFT')).toEqual([jobB]);
      expect(await titles('hr', `&departmentId=${dep.a}`)).toEqual([jobA]);
      await as('hr', request(server()).get('/api/v1/jobs?sortBy=jd_text')).expect(400);
    });

    it('returns the pipeline counted in one query (Kickoff 14)', async () => {
      const res = await as(
        'hr',
        request(server()).get(`/api/v1/jobs?search=${run}&departmentId=${dep.a}`),
      ).expect(200);
      expect(res.body.data[0]).toMatchObject({
        applicationCount: 3,
        pipeline: { new: 1, inProgress: 1, hired: 0, closed: 1 },
      });
    });

    it('a detail or ranking outside the scope is 404', async () => {
      await as('hmA', request(server()).get(`/api/v1/jobs/${jobB}`)).expect(404);
      await as('hmB', request(server()).get(`/api/v1/jobs/${jobA}/ranking`)).expect(404);
    });

    it('ranking returns match levels for scored applications only (US-05)', async () => {
      const res = await as('hmA', request(server()).get(`/api/v1/jobs/${jobA}/ranking`)).expect(
        200,
      );
      const { job, requirements: reqs, items } = res.body.data;
      expect(job).toMatchObject({ id: jobA, jdVersion: 3 });
      expect(reqs).toHaveLength(1);
      expect(items).toHaveLength(3);
      expect(items[0]).toMatchObject({
        aiStatus: 'DONE',
        matches: [{ requirementId: reqs[0].id, match: 1 }],
      });
      expect(items.find((i: { status: string }) => i.status === 'NEW').matches).toEqual([]);
    });
  });

  describe('delete, close and department rules', () => {
    it('cannot delete a job that is not a DRAFT without applications (BR-JOB-04)', async () => {
      const res = await as('hr', request(server()).delete(`/api/v1/jobs/${jobA}`)).expect(409);
      expect(res.body.code).toBe('JOB_NOT_DELETABLE');
    });

    it('deletes an empty DRAFT job', async () => {
      const res = await as('hr', request(server()).post('/api/v1/jobs'))
        .send(jobBody(dep.b, `Nháp xoá ${run}`))
        .expect(201);
      jobIds.push(res.body.data.id);
      await as('hr', request(server()).delete(`/api/v1/jobs/${res.body.data.id}`)).expect(200);
      await as('hr', request(server()).get(`/api/v1/jobs/${res.body.data.id}`)).expect(404);
    });

    it('closes an OPEN job; a CLOSED job cannot be closed, edited or get new requirements', async () => {
      const closed = await as('hr', request(server()).patch(`/api/v1/jobs/${jobA}/close`)).expect(
        200,
      );
      expect(closed.body.data.status).toBe('CLOSED');

      const again = await as('hr', request(server()).patch(`/api/v1/jobs/${jobA}/close`)).expect(
        409,
      );
      expect(again.body.code).toBe('JOB_NOT_CLOSABLE');
      const edit = await as('hr', request(server()).patch(`/api/v1/jobs/${jobA}`))
        .send({ location: 'Đà Nẵng' })
        .expect(409);
      expect(edit.body.code).toBe('JOB_NOT_EDITABLE');
      await as('hr', request(server()).put(`/api/v1/jobs/${jobA}/requirements`))
        .send({ requirements })
        .expect(409);
      await as('hr', request(server()).patch(`/api/v1/jobs/${jobA}/publish`)).expect(409);
    });

    it('counts jobs per department and blocks deleting a department with jobs (BR-ACC-08)', async () => {
      const list = await as(
        'admin',
        request(server()).get(`/api/v1/departments?search=JA_${run}`),
      ).expect(200);
      expect(list.body.data[0].jobCount).toBe(1);
      const res = await as(
        'admin',
        request(server()).delete(`/api/v1/departments/${dep.a}`),
      ).expect(409);
      expect(res.body.code).toBe('DEPARTMENT_IN_USE');
    });
  });
});
