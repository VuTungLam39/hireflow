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
import { CvFile } from '../src/modules/files/entities/cv-file.entity.js';
import { InterviewFeedback } from '../src/modules/interviews/entities/interview-feedback.entity.js';
import { Interview } from '../src/modules/interviews/entities/interview.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { Notification } from '../src/modules/notifications/entities/notification.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// D7 · F-INT-01 → 03 · US-11 · BR-INT-01 → 03
describe('Interviews (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    admin: `iv-admin-${run}@example.com`,
    hr: `iv-hr-${run}@example.com`,
    hm: `iv-hm-${run}@example.com`,
    ivA: `iv-a-${run}@example.com`,
    ivB: `iv-b-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const userIds = {} as Record<Who, string>;
  const ids = { dep: '', job: '', otherJob: '', reqs: [] as string[] };
  const apps = { a: '', b: '', screening: '', other: '' };
  const cvs = { a: '', other: '' };
  const candidates: string[] = [];

  const server = () => app.getHttpServer();
  const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);
  const inDays = (d: number, hour = 10) => {
    const t = new Date(Date.now() + d * 86_400_000);
    t.setUTCHours(hour, 0, 0, 0);
    return t.toISOString();
  };
  const schedule = (who: Who, appId: string, body: Record<string, unknown>) =>
    as(who, request(server()).post(`/api/v1/applications/${appId}/interviews`)).send({
      location: 'Phòng họp A',
      durationMinutes: 60,
      ...body,
    });
  const startNow = (interviewId: string) =>
    ds.getRepository(Interview).update(interviewId, { scheduledAt: new Date(Date.now() - 60_000) });
  const ratings = (score = 4) => ids.reqs.map((requirementId) => ({ requirementId, score }));
  const notificationsOf = (who: Who) =>
    ds
      .getRepository(Notification)
      .find({ where: { userId: userIds[who] }, order: { createdAt: 'ASC' } });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const dep = await ds
      .getRepository(Department)
      .save({ name: `IV ${run}`, code: `IV_${run}`.toUpperCase() });
    ids.dep = dep.id;
    const passwordHash = await bcrypt.hash(password, 4);
    const roles: Record<Who, Role> = {
      admin: Role.Admin,
      hr: Role.Hr,
      hm: Role.HiringManager,
      ivA: Role.Interviewer,
      ivB: Role.Interviewer,
    };
    for (const who of Object.keys(emails) as Who[]) {
      const u = await ds.getRepository(User).save({
        email: emails[who],
        fullName: `IV ${who}`,
        role: roles[who],
        departmentId: who === 'hm' ? dep.id : null,
        passwordHash,
      });
      userIds[who] = u.id;
    }
    const job = (title: string) => ({
      title: `${title} ${run}`,
      departmentId: dep.id,
      status: JobStatus.Open,
      location: 'Hà Nội',
      jdText: 'JD',
      jdVersion: 1,
      createdBy: userIds.hr,
      publishedAt: new Date(),
    });
    const [j1, j2] = await ds.getRepository(Job).save([job('Backend IV'), job('Khác IV')]);
    Object.assign(ids, { job: j1.id, otherJob: j2.id });
    const reqs = await ds.getRepository(JobRequirement).save(
      ['NestJS', 'PostgreSQL'].map((label, i) => ({
        jobId: j1.id,
        jdVersion: 1,
        position: i + 1,
        label,
        type: RequirementType.Must,
        weight: 2,
        minYears: null,
        keywords: [label.toLowerCase()],
      })),
    );
    ids.reqs = reqs.map((r) => r.id);

    const makeApp = async (key: string, jobId: string, status: ApplicationStatus) => {
      const c = await ds.getRepository(Candidate).save({
        fullName: `Ứng viên ${key} ${run}`,
        email: `iv-c-${key}-${run}@example.com`,
        consentAt: new Date(),
        consentVersion: 'v1',
      });
      candidates.push(c.id);
      const cv = await ds.getRepository(CvFile).save({
        candidateId: c.id,
        storageKey: `cv/test/${run}-${key}.pdf`,
        originalName: `${key}.pdf`,
        mime: 'application/pdf',
        sizeBytes: 100,
        sha256: randomUUID().replace(/-/g, '').padEnd(64, '0'),
        text: 'NestJS PostgreSQL',
      });
      const a = await ds.getRepository(Application).save({
        jobId,
        candidateId: c.id,
        cvFileId: cv.id,
        status,
        aiStatus: AiStatus.Done,
        score: 80,
        scoreBreakdown: [],
      });
      return { app: a.id, cv: cv.id };
    };
    const a = await makeApp('a', j1.id, ApplicationStatus.Interview);
    const b = await makeApp('b', j1.id, ApplicationStatus.Interview);
    const s = await makeApp('s', j1.id, ApplicationStatus.Screening);
    const o = await makeApp('o', j2.id, ApplicationStatus.Interview);
    Object.assign(apps, { a: a.app, b: b.app, screening: s.app, other: o.app });
    Object.assign(cvs, { a: a.cv, other: o.cv });

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
    await ds.getRepository(CvFile).delete({ candidateId: In(candidates) });
    await ds.getRepository(Candidate).delete({ id: In(candidates) });
    await ds.getRepository(JobRequirement).delete({ jobId: ids.job });
    await ds.getRepository(Job).delete({ id: In([ids.job, ids.otherJob]) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: ids.dep });
    await app.close();
  });

  let interviewA = '';

  describe('scheduling (F-INT-01, BR-INT-01)', () => {
    it('BR-INT-01: HR schedules an interview for an INTERVIEW application and the interviewers are notified', async () => {
      const res = await schedule('hr', apps.a, {
        scheduledAt: inDays(1),
        interviewerIds: [userIds.ivA, userIds.ivB],
      }).expect(201);
      interviewA = res.body.data.id;
      expect(res.body.data).toMatchObject({
        round: 1,
        status: 'SCHEDULED',
        location: 'Phòng họp A',
        application: { id: apps.a, job: { id: ids.job } },
      });
      expect(res.body.data.interviewers.map((i: { id: string }) => i.id).sort()).toEqual(
        [userIds.ivA, userIds.ivB].sort(),
      );
      const notes = await notificationsOf('ivA');
      expect(notes.at(-1)).toMatchObject({ type: 'INTERVIEW_ASSIGNED', interviewId: interviewA });
    });

    it('BR-INT-01: rejects wrong stage, past time, non-interviewers and double-booking; HM and interviewers cannot schedule', async () => {
      const wrongStage = await schedule('hr', apps.screening, {
        scheduledAt: inDays(1),
        interviewerIds: [userIds.ivA],
      }).expect(409);
      expect(wrongStage.body.code).toBe('INTERVIEW_NOT_ALLOWED');

      const past = await schedule('hr', apps.b, {
        scheduledAt: inDays(-1),
        interviewerIds: [userIds.ivA],
      }).expect(400);
      expect(past.body.errors[0].field).toBe('scheduledAt');

      const notInterviewer = await schedule('hr', apps.b, {
        scheduledAt: inDays(1, 14),
        interviewerIds: [userIds.hm],
      }).expect(400);
      expect(notInterviewer.body.errors[0].field).toBe('interviewerIds');

      const clash = await schedule('hr', apps.b, {
        scheduledAt: new Date(new Date(inDays(1)).getTime() + 30 * 60_000).toISOString(),
        interviewerIds: [userIds.ivB],
      }).expect(409);
      expect(clash.body.code).toBe('INTERVIEW_CONFLICT');
      expect(clash.body.errors[0].messages[0]).toContain('IV ivB');

      await schedule('hm', apps.b, {
        scheduledAt: inDays(2),
        interviewerIds: [userIds.ivA],
      }).expect(403);
      await schedule('ivA', apps.b, {
        scheduledAt: inDays(2),
        interviewerIds: [userIds.ivA],
      }).expect(403);
    });

    it('HR reschedules and swaps interviewers: the removed one is told it is cancelled, the new one is assigned', async () => {
      const res = await as('hr', request(server()).patch(`/api/v1/interviews/${interviewA}`))
        .send({ scheduledAt: inDays(1, 13), interviewerIds: [userIds.ivA] })
        .expect(200);
      expect(res.body.data.interviewers).toHaveLength(1);
      expect((await notificationsOf('ivB')).at(-1)).toMatchObject({ type: 'INTERVIEW_CANCELLED' });
      expect((await notificationsOf('ivA')).at(-1)).toMatchObject({ type: 'INTERVIEW_UPDATED' });
    });
  });

  describe('interviewer scope (F-INT-02, BR-INT-02)', () => {
    it('BR-INT-02: an interviewer sees only assigned applications, their CV and job', async () => {
      const list = await as('ivA', request(server()).get('/api/v1/applications?limit=100')).expect(
        200,
      );
      expect(list.body.data.map((a: { id: string }) => a.id)).toEqual([apps.a]);

      await as('ivA', request(server()).get(`/api/v1/applications/${apps.a}`)).expect(200);
      await as('ivA', request(server()).get(`/api/v1/applications/${apps.b}`)).expect(404);
      await as('ivA', request(server()).get(`/api/v1/applications/${apps.other}`)).expect(404);

      await as('ivA', request(server()).get(`/api/v1/files/${cvs.a}/url`)).expect(200);
      await as('ivA', request(server()).get(`/api/v1/files/${cvs.other}/url`)).expect(404);

      const jobs = await as('ivA', request(server()).get('/api/v1/jobs?limit=100')).expect(200);
      expect(jobs.body.data.map((j: { id: string }) => j.id)).toEqual([ids.job]);
      await as('ivA', request(server()).get(`/api/v1/jobs/${ids.otherJob}`)).expect(404);
      await as('ivA', request(server()).get(`/api/v1/jobs/${ids.job}/ranking`)).expect(404);

      await as('ivB', request(server()).get(`/api/v1/applications/${apps.a}`)).expect(404);
    });

    it('BR-INT-02: an interviewer assesses blind – no AI score, flags or evidence in lists, details or notifications', async () => {
      const detail = await as(
        'ivA',
        request(server()).get(`/api/v1/applications/${apps.a}`),
      ).expect(200);
      expect(detail.body.data).toMatchObject({
        score: null,
        flags: [],
        breakdown: [],
        scoredJdVersion: null,
      });
      expect(detail.body.data.requirements).toHaveLength(2);
      const list = await as(
        'ivA',
        request(server()).get('/api/v1/applications?sortBy=score&scoreMin=90'),
      ).expect(200);
      expect(list.body.data).toHaveLength(1);
      expect(list.body.data[0]).toMatchObject({ id: apps.a, score: null, flags: [] });
      const notes = await as('ivA', request(server()).get('/api/v1/notifications')).expect(200);
      for (const n of notes.body.data) expect(n.application.score).toBeNull();
      const hr = await as('hr', request(server()).get(`/api/v1/applications/${apps.a}`)).expect(
        200,
      );
      expect(hr.body.data.score).toBe(80);
    });

    it('BR-INT-02: no candidate pool, dashboard, AI chat, status changes or rescoring for interviewers', async () => {
      await as('ivA', request(server()).get('/api/v1/candidates')).expect(403);
      await as('ivA', request(server()).get('/api/v1/dashboard/summary')).expect(403);
      await as(
        'ivA',
        request(server()).post('/api/v1/ai/chat').send({ question: 'Ai biết NestJS?' }),
      ).expect(403);
      await as('ivA', request(server()).patch(`/api/v1/applications/${apps.a}/status`))
        .send({ status: 'OFFER' })
        .expect(403);
      await as('ivA', request(server()).post(`/api/v1/applications/${apps.a}/rescore`)).expect(403);
    });

    it('the calendar shows interviewers only their own interviews; HM sees the department', async () => {
      const mine = await as('ivA', request(server()).get('/api/v1/interviews')).expect(200);
      expect(mine.body.data.map((i: { id: string }) => i.id)).toEqual([interviewA]);
      const none = await as('ivB', request(server()).get('/api/v1/interviews')).expect(200);
      expect(none.body.data).toEqual([]);
      const hm = await as('hm', request(server()).get('/api/v1/interviews')).expect(200);
      expect(hm.body.data.map((i: { id: string }) => i.id)).toContain(interviewA);
    });
  });

  describe('feedback (F-INT-03, BR-INT-03)', () => {
    const put = (who: Who, body: Record<string, unknown>) =>
      as(who, request(server()).put(`/api/v1/interviews/${interviewA}/feedback`)).send(body);

    it('BR-INT-03: feedback opens at the start time, needs every criterion, and only from an assignee', async () => {
      const early = await put('ivA', { overall: 4, ratings: ratings() }).expect(409);
      expect(early.body.code).toBe('INTERVIEW_NOT_STARTED');
      await startNow(interviewA);

      const partial = await put('ivA', { overall: 4, ratings: ratings().slice(0, 1) }).expect(400);
      expect(partial.body.errors[0].field).toBe('ratings');
      await put('ivA', { overall: 6, ratings: ratings() }).expect(400);
      await put('ivB', { overall: 4, ratings: ratings() }).expect(404);
    });

    it('BR-INT-03: the assignee submits; the interview completes; HR is notified; edits allowed within 24 hours only', async () => {
      const res = await put('ivA', { overall: 4, ratings: ratings(4), comment: '  Tốt  ' }).expect(
        200,
      );
      expect(res.body.data).toMatchObject({
        overall: 4,
        comment: 'Tốt',
        ratings: [
          { label: 'NestJS', score: 4 },
          { label: 'PostgreSQL', score: 4 },
        ],
      });
      expect((await ds.getRepository(Interview).findOneByOrFail({ id: interviewA })).status).toBe(
        'COMPLETED',
      );
      expect((await notificationsOf('hr')).at(-1)).toMatchObject({ type: 'FEEDBACK_SUBMITTED' });

      await put('ivA', { overall: 5, ratings: ratings(5) }).expect(200);
      await ds
        .getRepository(InterviewFeedback)
        .update({ interviewId: interviewA }, { editableUntil: new Date(Date.now() - 1000) });
      const locked = await put('ivA', { overall: 3, ratings: ratings(3) }).expect(409);
      expect(locked.body.code).toBe('FEEDBACK_LOCKED');

      const edit = await as('hr', request(server()).patch(`/api/v1/interviews/${interviewA}`))
        .send({ location: 'Phòng B' })
        .expect(409);
      expect(edit.body.code).toBe('INTERVIEW_NOT_EDITABLE');
    });

    it('BR-INT-03: HR and the department manager read every feedback; an interviewer reads only their own', async () => {
      const second = await schedule('hr', apps.a, {
        scheduledAt: inDays(3),
        interviewerIds: [userIds.ivB],
      }).expect(201);
      expect(second.body.data.round).toBe(2);
      await startNow(second.body.data.id);
      await as('ivB', request(server()).put(`/api/v1/interviews/${second.body.data.id}/feedback`))
        .send({ overall: 2, ratings: ratings(2) })
        .expect(200);

      const forHr = await as(
        'hr',
        request(server()).get(`/api/v1/applications/${apps.a}/interviews`),
      ).expect(200);
      expect(forHr.body.data.flatMap((i: { feedbacks: unknown[] }) => i.feedbacks)).toHaveLength(2);
      const forHm = await as(
        'hm',
        request(server()).get(`/api/v1/applications/${apps.a}/interviews`),
      ).expect(200);
      expect(forHm.body.data).toHaveLength(2);

      const forB = await as(
        'ivB',
        request(server()).get(`/api/v1/applications/${apps.a}/interviews`),
      ).expect(200);
      expect(forB.body.data).toHaveLength(1);
      expect(forB.body.data[0].feedbacks).toHaveLength(1);
      expect(forB.body.data[0].feedbacks[0].author.id).toBe(userIds.ivB);
    });
  });

  describe('cancelling', () => {
    it('HR cancels with a reason; the interviewer is told and loses access', async () => {
      const res = await schedule('hr', apps.b, {
        scheduledAt: inDays(4),
        interviewerIds: [userIds.ivB],
      }).expect(201);
      const id = res.body.data.id as string;
      await as('ivB', request(server()).get(`/api/v1/applications/${apps.b}`)).expect(200);

      await as('hr', request(server()).patch(`/api/v1/interviews/${id}/cancel`))
        .send({})
        .expect(400);
      const cancelled = await as('hr', request(server()).patch(`/api/v1/interviews/${id}/cancel`))
        .send({ reason: 'Ứng viên xin dời' })
        .expect(200);
      expect(cancelled.body.data).toMatchObject({
        status: 'CANCELLED',
        cancelReason: 'Ứng viên xin dời',
      });
      expect((await notificationsOf('ivB')).at(-1)).toMatchObject({ type: 'INTERVIEW_CANCELLED' });
      await as('ivB', request(server()).get(`/api/v1/applications/${apps.b}`)).expect(404);
    });

    it('BR-INT-01: rejecting the application cancels its upcoming interviews', async () => {
      const res = await schedule('hr', apps.b, {
        scheduledAt: inDays(5),
        interviewerIds: [userIds.ivA],
      }).expect(201);
      await as('hr', request(server()).patch(`/api/v1/applications/${apps.b}/status`))
        .send({ status: 'REJECTED', reason: 'Không phù hợp' })
        .expect(200);
      await vi.waitFor(
        async () =>
          expect(
            (await ds.getRepository(Interview).findOneByOrFail({ id: res.body.data.id })).status,
          ).toBe('CANCELLED'),
        { timeout: 5000 },
      );
    });
  });

  it('Admin creates an interviewer account without a department', async () => {
    const email = `iv-new-${run}@example.com`;
    const res = await as('admin', request(server()).post('/api/v1/users'))
      .send({
        email,
        password: 'Password123',
        fullName: 'Người phỏng vấn mới',
        role: 'interviewer',
      })
      .expect(201);
    expect(res.body.data).toMatchObject({ role: 'interviewer', departmentId: null });
    const list = await as('hr', request(server()).get('/api/v1/interviews/interviewers')).expect(
      200,
    );
    expect(list.body.data.map((u: { email: string }) => u.email)).toContain(email);
    await ds.getRepository(User).delete({ email });
  });
});
