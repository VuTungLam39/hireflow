import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/common/enums/role.enum.js';
import { applyCandidateScope, applyDepartmentScope } from '../src/common/utils/department-scope.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';

// BR-ACC-07, BR-CAND-03
describe('Department scope on real data (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const ids = { depA: '', depB: '', jobA: '', jobB: '', c1: '', c2: '', c3: '', creator: '' };
  const appIds: string[] = [];

  const hr = { role: Role.Hr, departmentId: null };
  const admin = { role: Role.Admin, departmentId: null };
  const hmA = () => ({ role: Role.HiringManager, departmentId: ids.depA });
  const hmB = () => ({ role: Role.HiringManager, departmentId: ids.depB });
  const hmNone = { role: Role.HiringManager, departmentId: null };
  type ScopeUser = typeof hr | ReturnType<typeof hmA>;

  const jobsFor = async (user: ScopeUser) => {
    const qb = ds
      .getRepository(Job)
      .createQueryBuilder('job')
      .where('job.id IN (:...ids)', { ids: [ids.jobA, ids.jobB] });
    return (await applyDepartmentScope(qb, user, 'job.departmentId').getMany())
      .map((j) => j.id)
      .sort();
  };

  const applicationsFor = async (user: ScopeUser) => {
    const qb = ds
      .getRepository(Application)
      .createQueryBuilder('app')
      .innerJoin('app.job', 'job')
      .where('app.id IN (:...ids)', { ids: appIds });
    return (await applyDepartmentScope(qb, user, 'job.departmentId').getMany()).length;
  };

  const candidatesFor = async (user: ScopeUser) => {
    const qb = ds
      .getRepository(Candidate)
      .createQueryBuilder('candidate')
      .where('candidate.id IN (:...ids)', { ids: [ids.c1, ids.c2, ids.c3] });
    return (await applyCandidateScope(qb, user, '"candidate"."id"').getMany())
      .map((c) => c.id)
      .sort();
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    ds = app.get(DataSource);

    const [depA, depB] = await ds.getRepository(Department).save([
      { name: `Scope A ${run}`, code: `SA_${run}`.toUpperCase() },
      { name: `Scope B ${run}`, code: `SB_${run}`.toUpperCase() },
    ]);
    const creator = await ds.getRepository(User).save({
      email: `scope-${run}@example.com`,
      fullName: 'Scope HR',
      role: Role.Hr,
      passwordHash: 'x',
    });
    const job = (departmentId: string, title: string) => ({
      title,
      departmentId,
      status: JobStatus.Open,
      location: 'Hà Nội',
      jdText: 'JD',
      createdBy: creator.id,
      publishedAt: new Date(),
    });
    const [jobA, jobB] = await ds
      .getRepository(Job)
      .save([job(depA.id, `Job A ${run}`), job(depB.id, `Job B ${run}`)]);
    const candidate = (n: number) => ({
      fullName: `Ứng viên ${n}`,
      email: `scope-c${n}-${run}@example.com`,
      consentAt: new Date(),
      consentVersion: 'v1',
    });
    const [c1, c2, c3] = await ds
      .getRepository(Candidate)
      .save([candidate(1), candidate(2), candidate(3)]);
    Object.assign(ids, {
      depA: depA.id,
      depB: depB.id,
      jobA: jobA.id,
      jobB: jobB.id,
      c1: c1.id,
      c2: c2.id,
      c3: c3.id,
      creator: creator.id,
    });

    const apps = await ds.getRepository(Application).save([
      { jobId: jobA.id, candidateId: c1.id },
      { jobId: jobB.id, candidateId: c2.id },
      { jobId: jobA.id, candidateId: c3.id },
      { jobId: jobB.id, candidateId: c3.id },
    ]);
    appIds.push(...apps.map((a) => a.id));
  });

  afterAll(async () => {
    await ds.getRepository(Application).delete({ id: In(appIds) });
    await ds.getRepository(Candidate).delete({ id: In([ids.c1, ids.c2, ids.c3]) });
    await ds.getRepository(Job).delete({ id: In([ids.jobA, ids.jobB]) });
    await ds.getRepository(User).delete({ id: ids.creator });
    await ds.getRepository(Department).delete({ id: In([ids.depA, ids.depB]) });
    await app.close();
  });

  it('jobs: admin and HR see all, a hiring manager only their department', async () => {
    expect(await jobsFor(admin)).toEqual([ids.jobA, ids.jobB].sort());
    expect(await jobsFor(hr)).toEqual([ids.jobA, ids.jobB].sort());
    expect(await jobsFor(hmA())).toEqual([ids.jobA]);
    expect(await jobsFor(hmB())).toEqual([ids.jobB]);
    expect(await jobsFor(hmNone)).toEqual([]);
  });

  it('applications are scoped through the job join', async () => {
    expect(await applicationsFor(hr)).toBe(4);
    expect(await applicationsFor(hmA())).toBe(2);
    expect(await applicationsFor(hmB())).toBe(2);
    expect(await applicationsFor(hmNone)).toBe(0);
  });

  it('candidates are visible to a hiring manager only if they applied to that department', async () => {
    expect(await candidatesFor(hr)).toEqual([ids.c1, ids.c2, ids.c3].sort());
    expect(await candidatesFor(hmA())).toEqual([ids.c1, ids.c3].sort());
    expect(await candidatesFor(hmB())).toEqual([ids.c2, ids.c3].sort());
    expect(await candidatesFor(hmNone)).toEqual([]);
  });

  it('a detail lookup outside the scope finds nothing (→ 404)', async () => {
    const qb = ds
      .getRepository(Job)
      .createQueryBuilder('job')
      .where('job.id = :id', { id: ids.jobB });
    expect(await applyDepartmentScope(qb, hmA(), 'job.departmentId').getOne()).toBeNull();
  });

  it('soft-deleted applications do not leak a candidate into the scope', async () => {
    await ds.getRepository(Application).softDelete({ jobId: ids.jobA, candidateId: ids.c1 });
    try {
      expect(await candidatesFor(hmA())).toEqual([ids.c3]);
    } finally {
      await ds.getRepository(Application).restore({ jobId: ids.jobA, candidateId: ids.c1 });
    }
  });
});
