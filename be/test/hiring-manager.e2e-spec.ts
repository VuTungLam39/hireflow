import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AiStatus } from '../src/common/enums/ai-status.enum.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { FeedbackRecommendation } from '../src/common/enums/feedback-recommendation.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { CvFile } from '../src/modules/files/entities/cv-file.entity.js';
import { InterviewAssignee } from '../src/modules/interviews/entities/interview-assignee.entity.js';
import { InterviewFeedback } from '../src/modules/interviews/entities/interview-feedback.entity.js';
import { Interview, InterviewStatus } from '../src/modules/interviews/entities/interview.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';
import { withOrg } from './fixtures.js';

// MVP 3.1 · F-JOB-12, BR-JOB-12, F-INT-05, BR-INT-07, BR-RANK-02
describe(
  'Hiring manager per job, debrief, personal ranking weights (e2e)',
  { timeout: 30_000 },
  () => {
    let app: INestApplication;
    let ds: DataSource;
    const run = randomUUID().slice(0, 8);
    const password = 'Password123';
    const emails = {
      hr: `hm-hr-${run}@example.com`,
      hmA: `hm-a-${run}@example.com`,
      hmB: `hm-b-${run}@example.com`,
      iv: `hm-iv-${run}@example.com`,
    };
    type Who = keyof typeof emails;
    const tokens = {} as Record<Who, string>;
    const userIds = {} as Record<Who, string>;
    const ids = {
      depA: '',
      depB: '',
      job: '',
      app: '',
      candidate: '',
      interview: '',
      reqs: [] as string[],
    };

    const server = () => app.getHttpServer();
    const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);
    const get = (who: Who, path: string) => as(who, request(server()).get(`/api/v1${path}`));
    const assign = (userId: string | null) =>
      as('hr', request(server()).patch(`/api/v1/jobs/${ids.job}/hiring-manager`)).send({ userId });

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
      app = moduleRef.createNestApplication();
      setupApp(app);
      await app.init();
      ds = app.get(DataSource);

      const [depA, depB] = await ds.getRepository(Department).save(
        withOrg([
          { name: `HM A ${run}`, code: `HMA_${run}`.toUpperCase() },
          { name: `HM B ${run}`, code: `HMB_${run}`.toUpperCase() },
        ]),
      );
      Object.assign(ids, { depA: depA.id, depB: depB.id });
      const passwordHash = await bcrypt.hash(password, 4);
      const roles: Record<Who, [Role, string | null]> = {
        hr: [Role.Hr, null],
        hmA: [Role.HiringManager, depA.id],
        hmB: [Role.HiringManager, depB.id],
        iv: [Role.Interviewer, null],
      };
      for (const who of Object.keys(emails) as Who[]) {
        const [role, departmentId] = roles[who];
        const u = await ds.getRepository(User).save(
          withOrg({
            email: emails[who],
            fullName: `HM ${who}`,
            role,
            departmentId,
            passwordHash,
          }),
        );
        userIds[who] = u.id;
      }
      const job = await ds.getRepository(Job).save(
        withOrg({
          title: `Tin phòng A ${run}`,
          departmentId: depA.id,
          status: JobStatus.Open,
          location: 'Hà Nội',
          jdText: 'JD',
          jdVersion: 1,
          createdBy: userIds.hr,
          publishedAt: new Date(),
        }),
      );
      ids.job = job.id;
      const reqs = await ds.getRepository(JobRequirement).save(
        ['NestJS', 'SQL'].map((label, i) => ({
          jobId: job.id,
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
      const c = await ds.getRepository(Candidate).save(
        withOrg({
          fullName: `Ứng viên HM ${run}`,
          email: `hm-c-${run}@example.com`,
          consentAt: new Date(),
          consentVersion: 'v1',
        }),
      );
      ids.candidate = c.id;
      const cv = await ds.getRepository(CvFile).save(
        withOrg({
          candidateId: c.id,
          storageKey: `cv/test/${run}-hm.pdf`,
          originalName: 'hm.pdf',
          mime: 'application/pdf',
          sizeBytes: 100,
          sha256: randomUUID().replace(/-/g, '').padEnd(64, '0'),
          text: 'NestJS',
        }),
      );
      const a = await ds.getRepository(Application).save(
        withOrg({
          jobId: job.id,
          candidateId: c.id,
          cvFileId: cv.id,
          status: ApplicationStatus.Interview,
          aiStatus: AiStatus.Done,
          score: 80,
          scoreBreakdown: [],
        }),
      );
      ids.app = a.id;
      const iv = await ds.getRepository(Interview).save(
        withOrg({
          applicationId: a.id,
          round: 1,
          scheduledAt: new Date(Date.now() - 3_600_000),
          durationMinutes: 60,
          location: 'Phòng 1',
          status: InterviewStatus.Completed,
          createdBy: userIds.hr,
        }),
      );
      ids.interview = iv.id;
      await ds.getRepository(InterviewAssignee).insert({ interviewId: iv.id, userId: userIds.iv });
      await ds.getRepository(InterviewFeedback).insert({
        interviewId: iv.id,
        authorId: userIds.iv,
        overall: 4,
        ratings: reqs.map((r) => ({ requirementId: r.id, label: r.label, score: 4 })),
        comment: 'Ổn',
        recommendation: FeedbackRecommendation.Yes,
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
      await ds.getRepository(Application).delete({ jobId: ids.job });
      await ds.getRepository(CvFile).delete({ candidateId: ids.candidate });
      await ds.getRepository(Candidate).delete({ id: ids.candidate });
      await ds.getRepository(JobRequirement).delete({ jobId: ids.job });
      await ds.getRepository(Job).delete({ id: ids.job });
      await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
      await ds.getRepository(Department).delete({ id: In([ids.depA, ids.depB]) });
      await app.close();
    });

    describe('hiring manager per job (F-JOB-12, BR-JOB-12)', () => {
      const sees = async (who: Who) => {
        const [job, application, list, candidates, jobs] = await Promise.all([
          get(who, `/jobs/${ids.job}`),
          get(who, `/applications/${ids.app}`),
          get(who, `/applications?search=${run}`),
          get(who, `/candidates?search=${run}`),
          get(who, `/jobs?search=${run}`),
        ]);
        return {
          job: job.status,
          application: application.status,
          list: list.body.data.length,
          candidates: candidates.body.data.length,
          jobs: jobs.body.data.length,
        };
      };

      it('a manager of another department sees nothing of the job before it is assigned', async () => {
        expect(await sees('hmB')).toEqual({
          job: 404,
          application: 404,
          list: 0,
          candidates: 0,
          jobs: 0,
        });
        expect(await sees('hmA')).toEqual({
          job: 200,
          application: 200,
          list: 1,
          candidates: 1,
          jobs: 1,
        });
      });

      it('HR lists the active hiring managers of the company to pick from', async () => {
        const res = await get('hr', '/jobs/hiring-managers').expect(200);
        const mine = res.body.data.filter((u: { id: string }) =>
          [userIds.hmA, userIds.hmB].includes(u.id),
        );
        expect(mine).toHaveLength(2);
        expect(res.body.data.some((u: { id: string }) => u.id === userIds.iv)).toBe(false);
        await get('hmA', '/jobs/hiring-managers').expect(403);
      });

      it('only an active hiring manager of the company can be assigned; HM cannot assign', async () => {
        const bad = await assign(userIds.iv).expect(400);
        expect(bad.body.errors[0].field).toBe('userId');
        await assign('not-a-uuid').expect(400);
        await as('hmA', request(server()).patch(`/api/v1/jobs/${ids.job}/hiring-manager`))
          .send({ userId: userIds.hmA })
          .expect(403);
      });

      it('once assigned, the other-department manager sees exactly that job and its applications', async () => {
        const res = await assign(userIds.hmB).expect(200);
        expect(res.body.data.hiringManager).toEqual({ id: userIds.hmB, fullName: 'HM hmB' });
        expect(await sees('hmB')).toEqual({
          job: 200,
          application: 200,
          list: 1,
          candidates: 1,
          jobs: 1,
        });
        const debrief = await get('hmB', `/applications/${ids.app}/interviews/debrief`).expect(200);
        expect(debrief.body.data.feedbackCount).toBe(1);
      });

      it('unassigning removes the access again', async () => {
        const res = await assign(null).expect(200);
        expect(res.body.data.hiringManager).toBeNull();
        expect(await sees('hmB')).toEqual({
          job: 404,
          application: 404,
          list: 0,
          candidates: 0,
          jobs: 0,
        });
      });
    });

    describe('debrief (F-INT-05, BR-INT-07)', () => {
      it('HR sees averages and recommendations per round; interviewers are refused', async () => {
        const res = await get('hr', `/applications/${ids.app}/interviews/debrief`).expect(200);
        expect(res.body.data).toMatchObject({
          feedbackCount: 1,
          overallAvg: 4,
          recommendations: { YES: 1, NO: 0, STRONG_YES: 0, STRONG_NO: 0, NONE: 0 },
          groups: [
            {
              stage: null,
              round: 1,
              interviews: 1,
              expectedFeedbacks: 1,
              feedbackCount: 1,
              criteria: [
                { label: 'NestJS', avg: 4, n: 1 },
                { label: 'SQL', avg: 4, n: 1 },
              ],
              feedbacks: [{ author: { fullName: 'HM iv' }, recommendation: 'YES', comment: 'Ổn' }],
            },
          ],
        });
        await get('iv', `/applications/${ids.app}/interviews/debrief`).expect(403);
      });
    });

    describe('personal ranking weights (BR-RANK-02)', () => {
      const url = () => `/api/v1/jobs/${ids.job}/ranking-weights`;
      const put = (who: Who, body: object) => as(who, request(server()).put(url())).send(body);

      it('a manager saves weights for themselves; others and the job score are untouched', async () => {
        expect(
          (await get('hmA', `/jobs/${ids.job}/ranking-weights`).expect(200)).body.data,
        ).toBeNull();
        const weights = { [ids.reqs[0]]: 3, [ids.reqs[1]]: 1 };
        await put('hmA', { jdVersion: 2, weights }).expect(409);
        await put('hmA', { jdVersion: 1, weights: { [ids.reqs[0]]: 3 } }).expect(400);
        await put('hmA', { jdVersion: 1, weights: { ...weights, [ids.reqs[1]]: 5 } }).expect(400);
        await put('hmA', { jdVersion: 1, weights }).expect(200);

        const mine = await get('hmA', `/jobs/${ids.job}/ranking-weights`).expect(200);
        expect(mine.body.data).toMatchObject({ jdVersion: 1, weights });
        expect(
          (await get('hr', `/jobs/${ids.job}/ranking-weights`).expect(200)).body.data,
        ).toBeNull();
        await get('hmB', `/jobs/${ids.job}/ranking-weights`).expect(404);
      });

      it('saved weights expire when the job criteria get a new version', async () => {
        await as('hr', request(server()).put(`/api/v1/jobs/${ids.job}/requirements`))
          .send({
            requirements: [{ label: 'NestJS', type: 'MUST', weight: 2, keywords: ['nestjs'] }],
          })
          .expect(202);
        expect(
          (await get('hmA', `/jobs/${ids.job}/ranking-weights`).expect(200)).body.data,
        ).toBeNull();
      });
    });
  },
);
