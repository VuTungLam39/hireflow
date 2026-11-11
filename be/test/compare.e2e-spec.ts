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
import { InterviewFeedback } from '../src/modules/interviews/entities/interview-feedback.entity.js';
import { Interview } from '../src/modules/interviews/entities/interview.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// F3 · BR-APP-13: so sánh ứng viên
describe('Compare applications (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    hr: `c-hr-${run}@example.com`,
    hmB: `c-hmb-${run}@example.com`,
    iv: `c-iv-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const ids = { depA: '', depB: '', job: '', otherJob: '', r1: '', r2: '' };
  const apps = { scored: '', stale: '', unscored: '', other: '' };
  const candidates: string[] = [];

  const server = () => app.getHttpServer();
  const compare = (who: Who, jobId: string, list: string[]) =>
    request(server())
      .get(`/api/v1/jobs/${jobId}/applications/compare?ids=${list.join(',')}`)
      .set('Authorization', `Bearer ${tokens[who]}`);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const [depA, depB] = await ds.getRepository(Department).save([
      { name: `So sánh A ${run}`, code: `CA_${run}`.toUpperCase() },
      { name: `So sánh B ${run}`, code: `CB_${run}`.toUpperCase() },
    ]);
    ids.depA = depA.id;
    ids.depB = depB.id;
    const passwordHash = await bcrypt.hash(password, 4);
    const [hr, , iv] = await ds.getRepository(User).save([
      { email: emails.hr, fullName: 'C HR', role: Role.Hr, passwordHash },
      {
        email: emails.hmB,
        fullName: 'C HM B',
        role: Role.HiringManager,
        departmentId: depB.id,
        passwordHash,
      },
      { email: emails.iv, fullName: 'C IV', role: Role.Interviewer, passwordHash },
    ]);
    const job = (departmentId: string) => ({
      title: `So sánh ${run}`,
      departmentId,
      status: JobStatus.Open,
      location: 'Hà Nội',
      jdText: `JD ${run}`,
      jdVersion: 2,
      createdBy: hr.id,
      publishedAt: new Date(),
    });
    const [main, other] = await ds.getRepository(Job).save([job(depA.id), job(depB.id)]);
    ids.job = main.id;
    ids.otherJob = other.id;
    const [r1, r2] = await ds.getRepository(JobRequirement).save(
      ['NestJS', 'React'].map((label, position) => ({
        jobId: main.id,
        jdVersion: 2,
        position,
        label,
        type: RequirementType.Must,
        weight: 3,
        keywords: [label.toLowerCase()],
      })),
    );
    ids.r1 = r1.id;
    ids.r2 = r2.id;

    const make = async (key: keyof typeof apps, jobId: string, scoredJdVersion: number | null) => {
      const c = await ds.getRepository(Candidate).save({
        fullName: `Ứng viên ${key} ${run}`,
        email: `c-${key}-${run}@example.com`,
        consentAt: new Date(),
        consentVersion: 'v1',
      });
      candidates.push(c.id);
      const a = await ds.getRepository(Application).save({
        jobId,
        candidateId: c.id,
        cvFileId: null,
        status: ApplicationStatus.Interview,
        aiStatus: scoredJdVersion ? AiStatus.Done : AiStatus.Pending,
        score: scoredJdVersion ? 80 : null,
        scoreBreakdown: scoredJdVersion
          ? [{ requirementId: r1.id, match: 1, evidence: '3 năm NestJS', rejectedEvidence: null }]
          : null,
        scoredJdVersion,
      });
      apps[key] = a.id;
    };
    await make('scored', main.id, 2);
    await make('stale', main.id, 1);
    await make('unscored', main.id, null);
    await make('other', other.id, null);

    const interview = await ds.getRepository(Interview).save({
      applicationId: apps.scored,
      round: 1,
      scheduledAt: new Date(Date.now() - 3_600_000),
      location: 'Phòng họp',
      createdBy: hr.id,
    });
    await ds.getRepository(InterviewFeedback).save({
      interviewId: interview.id,
      authorId: iv.id,
      overall: 4,
      ratings: [{ requirementId: r1.id, label: 'NestJS', score: 5 }],
      comment: null,
      submittedAt: new Date(),
      editableUntil: new Date(Date.now() + 86_400_000),
    });

    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    await ds.getRepository(Application).delete({ jobId: In([ids.job, ids.otherJob]) });
    await ds.getRepository(Candidate).delete({ id: In(candidates) });
    await ds.getRepository(JobRequirement).delete({ jobId: ids.job });
    await ds.getRepository(Job).delete({ id: In([ids.job, ids.otherJob]) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: In([ids.depA, ids.depB]) });
    await app.close();
  });

  it('puts 2–3 applications side by side with evidence and interview scores', async () => {
    const res = await compare('hr', ids.job, [apps.stale, apps.scored, apps.unscored]).expect(200);
    const data = res.body.data;
    expect(data.job).toEqual({ id: ids.job, title: `So sánh ${run}`, jdVersion: 2 });
    expect(data.requirements.map((r: { label: string }) => r.label)).toEqual(['NestJS', 'React']);
    expect(data.applications.map((a: { id: string }) => a.id)).toEqual([
      apps.stale,
      apps.scored,
      apps.unscored,
    ]);
    const [stale, scored, unscored] = data.applications;
    expect(scored).toMatchObject({ score: 80, stale: false });
    expect(scored.criteria).toEqual([
      { requirementId: ids.r1, match: 1, evidence: '3 năm NestJS', interviewAvg: 5 },
      { requirementId: ids.r2, match: null, evidence: null, interviewAvg: null },
    ]);
    expect(scored.interviews).toEqual({ feedbackCount: 1, avgOverall: 4 });
    // chấm theo JD phiên bản 1, JD hiện là phiên bản 2
    expect(stale.stale).toBe(true);
    expect(unscored).toMatchObject({ score: null, stale: false });
  });

  it('rejects selections that are too small, too big, duplicated or from another job', async () => {
    await compare('hr', ids.job, [apps.scored]).expect(400);
    await compare('hr', ids.job, [apps.scored, apps.scored]).expect(400);
    const four = [apps.scored, apps.stale, apps.unscored, randomUUID()];
    expect((await compare('hr', ids.job, four).expect(400)).body.code).toBe('VALIDATION_FAILED');
    const mixed = await compare('hr', ids.job, [apps.scored, apps.other]).expect(400);
    expect(mixed.body.code).toBe('COMPARE_INVALID_SELECTION');
  });

  it("hides another department's job and blocks interviewers (BR-INT-02)", async () => {
    await compare('hmB', ids.job, [apps.scored, apps.stale]).expect(404);
    const blind = await compare('iv', ids.job, [apps.scored, apps.stale]).expect(403);
    expect(blind.body.code).toBe('FORBIDDEN');
  });
});
