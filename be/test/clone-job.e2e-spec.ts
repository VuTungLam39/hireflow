import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus, WorkMode } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// F4: nhân bản tin
describe('Clone job (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = { hr: `j-hr-${run}@example.com`, hm: `j-hm-${run}@example.com` };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const ids = { dep: '', src: '', candidate: '' };
  const created: string[] = [];

  const server = () => app.getHttpServer();
  const clone = (who: Who, id: string) =>
    request(server())
      .post(`/api/v1/jobs/${id}/clone`)
      .set('Authorization', `Bearer ${tokens[who]}`);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const dep = await ds
      .getRepository(Department)
      .save({ name: `Nhân bản ${run}`, code: `JC_${run}`.toUpperCase() });
    ids.dep = dep.id;
    const passwordHash = await bcrypt.hash(password, 4);
    const [hr] = await ds.getRepository(User).save([
      { email: emails.hr, fullName: 'J HR', role: Role.Hr, passwordHash },
      {
        email: emails.hm,
        fullName: 'J HM',
        role: Role.HiringManager,
        departmentId: dep.id,
        passwordHash,
      },
    ]);
    const src = await ds.getRepository(Job).save({
      title: `Backend ${run}`,
      departmentId: dep.id,
      status: JobStatus.Closed,
      location: 'Đà Nẵng',
      jdText: `JD gốc ${run}`,
      jdVersion: 3,
      createdBy: hr.id,
      publishedAt: new Date(),
      closedAt: new Date(),
      salaryMin: 15_000_000,
      salaryMax: 25_000_000,
      workMode: WorkMode.Hybrid,
      headcount: 2,
      deadline: '2026-10-31',
      benefits: 'Bảo hiểm sức khoẻ',
    });
    ids.src = src.id;
    // phiên bản cũ (2) và mới nhất (3): chỉ phiên bản 3 được copy
    await ds.getRepository(JobRequirement).save([
      {
        jobId: src.id,
        jdVersion: 2,
        position: 0,
        label: 'Java',
        type: RequirementType.Must,
        weight: 3,
        keywords: ['java'],
      },
      {
        jobId: src.id,
        jdVersion: 3,
        position: 1,
        label: 'React',
        type: RequirementType.Nice,
        weight: 1,
        keywords: ['react'],
      },
      {
        jobId: src.id,
        jdVersion: 3,
        position: 0,
        label: 'NestJS',
        type: RequirementType.Must,
        weight: 3,
        minYears: 2,
        keywords: ['nestjs', 'nest'],
      },
    ]);
    const c = await ds.getRepository(Candidate).save({
      fullName: `Ứng viên ${run}`,
      email: `j-c-${run}@example.com`,
      consentAt: new Date(),
      consentVersion: 'v1',
    });
    ids.candidate = c.id;
    await ds
      .getRepository(Application)
      .save({ jobId: src.id, candidateId: c.id, cvFileId: null, status: ApplicationStatus.New });

    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    const jobIds = [ids.src, ...created];
    await ds.getRepository(Application).delete({ jobId: In(jobIds) });
    await ds.getRepository(Candidate).delete({ id: ids.candidate });
    await ds.getRepository(JobRequirement).delete({ jobId: In(jobIds) });
    await ds.getRepository(Job).delete({ id: In(jobIds) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: ids.dep });
    await app.close();
  });

  it('creates a draft with the JD, structured fields and latest criteria, without applications', async () => {
    const res = await clone('hr', ids.src).expect(201);
    const id = res.body.data.id;
    created.push(id);

    const job = await ds.getRepository(Job).findOneByOrFail({ id });
    expect(job).toMatchObject({
      title: `Backend ${run} (bản sao)`,
      status: JobStatus.Draft,
      jdText: `JD gốc ${run}`,
      jdVersion: 1,
      salaryMin: 15_000_000,
      salaryMax: 25_000_000,
      workMode: WorkMode.Hybrid,
      headcount: 2,
      benefits: 'Bảo hiểm sức khoẻ',
      deadline: null,
      publishedAt: null,
      closedAt: null,
    });
    const reqs = await ds
      .getRepository(JobRequirement)
      .find({ where: { jobId: id }, order: { position: 'ASC' } });
    expect(reqs.map((r) => [r.jdVersion, r.position, r.label, r.minYears, r.keywords])).toEqual([
      [1, 0, 'NestJS', 2, ['nestjs', 'nest']],
      [1, 1, 'React', null, ['react']],
    ]);
    expect(await ds.getRepository(Application).countBy({ jobId: id })).toBe(0);
  });

  it('keeps the title within 200 characters', async () => {
    await ds.getRepository(Job).update(ids.src, { title: 'T'.repeat(200) });
    const res = await clone('hr', ids.src).expect(201);
    created.push(res.body.data.id);
    expect(res.body.data.title).toHaveLength(200);
    expect(res.body.data.title.endsWith(' (bản sao)')).toBe(true);
  });

  it('rejects hiring managers and unknown jobs', async () => {
    await clone('hm', ids.src).expect(403);
    await clone('hr', randomUUID()).expect(404);
  });
});
