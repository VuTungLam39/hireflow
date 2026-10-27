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
import { appConfig } from '../src/config/app.config.js';
import { AI_ERROR } from '../src/modules/ai/pipeline/errors.js';
import { ApplicationStatusHistory } from '../src/modules/applications/entities/application-status-history.entity.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { ANONYMIZED_NAME } from '../src/modules/candidates/candidates.service.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { CvFile, CvParseStatus } from '../src/modules/files/entities/cv-file.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { MaintenanceService } from '../src/modules/maintenance/maintenance.service.js';
import { MAINTENANCE_TASK } from '../src/modules/maintenance/maintenance.tasks.js';
import { JobMatch } from '../src/modules/matching/entities/job-match.entity.js';
import { RefreshToken } from '../src/modules/refresh-tokens/entities/refresh-token.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// D5 · F-APP-10, F-FILE-02, F-CAND-05, F-OPS-03 · BR-APP-05, BR-FILE-04, BR-DATA-04, BR-MATCH-04
describe('Data lifecycle (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let months = 12;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    admin: `dl-admin-${run}@example.com`,
    hr: `dl-hr-${run}@example.com`,
    hm: `dl-hm-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const ids = { dep: '', job: '', hr: '' };
  const candidateIds: string[] = [];

  const server = () => app.getHttpServer();
  const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);

  const candidate = async (name: string) => {
    const c = await ds.getRepository(Candidate).save({
      fullName: `${name} ${run}`,
      email: `dl-${name.toLowerCase()}-${run}@example.com`,
      phone: '0912345678',
      consentAt: new Date(),
      consentVersion: 'v1',
    });
    candidateIds.push(c.id);
    return c;
  };
  const cvFile = (candidateId: string, extra: Partial<CvFile> = {}) =>
    ds.getRepository(CvFile).save({
      candidateId,
      storageKey: `cv/test/${run}-${randomUUID()}.pdf`,
      originalName: 'cv.pdf',
      mime: 'application/pdf',
      sizeBytes: 100,
      sha256: randomUUID().replace(/-/g, '').padEnd(64, '0'),
      parseStatus: CvParseStatus.Parsed,
      text: 'NestJS 3 năm',
      ...extra,
    });
  const application = (candidateId: string, extra: Partial<Application> = {}) =>
    ds.getRepository(Application).save({
      jobId: ids.job,
      candidateId,
      status: ApplicationStatus.New,
      aiStatus: AiStatus.Done,
      score: 70,
      scoreBreakdown: [],
      ...extra,
    });
  const backdate = (table: 'candidates' | 'applications', id: string, monthsAgo: number) =>
    ds.query(`UPDATE ${table} SET created_at = now() - make_interval(months => $2) WHERE id = $1`, [
      id,
      monthsAgo,
    ]);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);
    months = app.get(appConfig.KEY).cvRetentionMonths;

    const dep = await ds
      .getRepository(Department)
      .save({ name: `DL ${run}`, code: `DL_${run}`.toUpperCase() });
    const passwordHash = await bcrypt.hash(password, 4);
    const [, hr] = await ds.getRepository(User).save([
      { email: emails.admin, fullName: 'DL Admin', role: Role.Admin, passwordHash },
      { email: emails.hr, fullName: 'DL HR', role: Role.Hr, passwordHash },
      {
        email: emails.hm,
        fullName: 'DL HM',
        role: Role.HiringManager,
        departmentId: dep.id,
        passwordHash,
      },
    ]);
    const job = await ds.getRepository(Job).save({
      title: `Job DL ${run}`,
      departmentId: dep.id,
      status: JobStatus.Open,
      location: 'Hà Nội',
      jdText: 'JD',
      jdVersion: 1,
      createdBy: hr.id,
      publishedAt: new Date(),
    });
    Object.assign(ids, { dep: dep.id, job: job.id, hr: hr.id });

    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    await ds.getRepository(JobMatch).delete({ jobId: ids.job });
    await ds.getRepository(Application).delete({ jobId: ids.job });
    await ds.getRepository(CvFile).delete({ candidateId: In(candidateIds) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(Job).delete({ id: ids.job });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: ids.dep });
    await app.close();
  });

  describe('reopen a closed application (F-APP-10)', () => {
    const reopen = (who: Who, id: string, body: object = { reason: 'Ứng viên quay lại' }) =>
      as(who, request(server()).patch(`/api/v1/applications/${id}/reopen`).send(body));

    it.each([ApplicationStatus.Rejected, ApplicationStatus.Withdrawn])(
      'BR-APP-05: HR reopens a %s application to SCREENING, keeps the score and records history',
      async (status) => {
        const c = await candidate(`Reopen${status}`);
        const a = await application(c.id, { status });

        const res = await reopen('hr', a.id, { reason: '  Xét lại cho vòng 2  ' }).expect(200);
        expect(res.body.data).toMatchObject({ status: ApplicationStatus.Screening, score: 70 });

        const history = await ds
          .getRepository(ApplicationStatusHistory)
          .findBy({ applicationId: a.id });
        expect(history).toEqual([
          expect.objectContaining({
            fromStatus: status,
            toStatus: ApplicationStatus.Screening,
            reason: 'Xét lại cho vòng 2',
            changedBy: ids.hr,
          }),
        ]);
      },
    );

    it('BR-APP-05: only REJECTED or WITHDRAWN can be reopened; a reason is required', async () => {
      const c = await candidate('ReopenRules');
      const hired = await application(c.id, { status: ApplicationStatus.Hired });
      const r1 = await reopen('hr', hired.id).expect(409);
      expect(r1.body.code).toBe('INVALID_STATUS_TRANSITION');

      const c2 = await candidate('ReopenReason');
      const rejected = await application(c2.id, { status: ApplicationStatus.Rejected });
      for (const body of [{}, { reason: '   ' }]) {
        const res = await reopen('hr', rejected.id, body).expect(400);
        expect(res.body.code).toBe('VALIDATION_FAILED');
      }
    });

    it('Hiring Manager cannot reopen; anonymized candidates cannot be reopened', async () => {
      const c = await candidate('ReopenHm');
      const a = await application(c.id, { status: ApplicationStatus.Rejected });
      await reopen('hm', a.id).expect(403);

      await as('admin', request(server()).post(`/api/v1/candidates/${c.id}/anonymize`)).expect(200);
      const res = await reopen('admin', a.id).expect(409);
      expect(res.body.code).toBe('CANDIDATE_ANONYMIZED');
    });
  });

  describe('enter CV text by hand (F-FILE-02)', () => {
    const text = 'Kinh nghiệm: 3 năm NestJS, PostgreSQL và Docker. '.repeat(4);
    const put = (who: Who, id: string, body: object = { text }) =>
      as(who, request(server()).put(`/api/v1/applications/${id}/cv-text`).send(body));

    it('BR-FILE-04: only for a CV that could not be read; validates length; Admin and HR only', async () => {
      const c = await candidate('Text');
      const readable = await cvFile(c.id);
      const ok = await application(c.id, { cvFileId: readable.id });
      expect((await put('hr', ok.id).expect(409)).body.code).toBe('CV_TEXT_NOT_EDITABLE');

      const c2 = await candidate('TextNoFile');
      const noFile = await application(c2.id);
      expect((await put('hr', noFile.id).expect(409)).body.code).toBe('CV_TEXT_NOT_EDITABLE');

      const c3 = await candidate('TextFailed');
      const scan = await cvFile(c3.id, {
        parseStatus: CvParseStatus.Failed,
        parseError: AI_ERROR.noText,
        text: null,
      });
      const failed = await application(c3.id, {
        cvFileId: scan.id,
        aiStatus: AiStatus.Failed,
        aiError: AI_ERROR.noText,
        score: null,
      });
      for (const body of [{}, { text: 'quá ngắn' }, { text: 'x'.repeat(50_001) }]) {
        expect((await put('hr', failed.id, body).expect(400)).body.code).toBe('VALIDATION_FAILED');
      }
      await put('hm', failed.id).expect(403);
      expect(await ds.getRepository(CvFile).findOneByOrFail({ id: scan.id })).toMatchObject({
        parseStatus: CvParseStatus.Failed,
        text: null,
        textEnteredAt: null,
      });
    });

    it('BR-FILE-04: saving the text reruns every failed application of the same file', async () => {
      const c = await candidate('TextShared');
      const scan = await cvFile(c.id, {
        parseStatus: CvParseStatus.Failed,
        parseError: AI_ERROR.noText,
        text: null,
      });
      const failed = await application(c.id, {
        cvFileId: scan.id,
        aiStatus: AiStatus.Failed,
        aiError: AI_ERROR.noText,
        score: null,
      });

      const res = await put('admin', failed.id).expect(200);
      expect(res.body.data.cv).toMatchObject({
        text: text.trim(),
        parseStatus: CvParseStatus.Parsed,
        textEnteredAt: expect.any(String),
      });
      const saved = await ds.getRepository(CvFile).findOneByOrFail({ id: scan.id });
      expect(saved).toMatchObject({ parseError: null, textEnteredBy: expect.any(String) });
      const after = await ds.getRepository(Application).findOneByOrFail({ id: failed.id });
      expect(after.aiStatus).not.toBe(AiStatus.Failed);
      expect(after.aiError).toBeNull();
    });

    it('BR-FILE-04: the database refuses entered text on a file that is not PARSED', async () => {
      const c = await candidate('TextCheck');
      const scan = await cvFile(c.id, { parseStatus: CvParseStatus.Failed, text: null });
      await expect(
        ds.getRepository(CvFile).update(scan.id, { textEnteredAt: new Date() }),
      ).rejects.toThrow(/CK_cv_files_text_entered/);
    });
  });

  describe('scheduled jobs', () => {
    it('BR-DATA-04, BR-MATCH-04: anonymizes candidates whose last own application is past retention', async () => {
      const expired = await candidate('Expired');
      const expiredCv = await cvFile(expired.id);
      const expiredApp = await application(expired.id, {
        cvFileId: expiredCv.id,
        status: ApplicationStatus.Rejected,
      });
      await backdate('applications', expiredApp.id, months + 1);
      await backdate('candidates', expired.id, months + 1);
      await ds.getRepository(JobMatch).save({
        jobId: ids.job,
        candidateId: expired.id,
        cvFileId: expiredCv.id,
        jdVersion: 1,
        score: 80,
        scoreBreakdown: [],
        lastAppliedAt: new Date(),
      });

      const invited = await candidate('InvitedOnly');
      const invitedOwn = await application(invited.id, { source: ApplicationSource.PublicForm });
      await backdate('applications', invitedOwn.id, months + 1);
      await backdate('candidates', invited.id, months + 1);
      const job2 = await ds.getRepository(Job).save({
        title: `Job DL 2 ${run}`,
        departmentId: ids.dep,
        status: JobStatus.Open,
        location: 'Hà Nội',
        jdText: 'JD',
        jdVersion: 1,
        createdBy: ids.hr,
        publishedAt: new Date(),
      });
      await application(invited.id, { jobId: job2.id, source: ApplicationSource.MatchInvite });

      const recent = await candidate('Recent');
      const recentApp = await application(recent.id);
      await backdate('applications', recentApp.id, months - 1);
      await backdate('candidates', recent.id, months + 6);

      const count = await app.get(MaintenanceService).run(MAINTENANCE_TASK.anonymizeExpired);
      expect(count).toBeGreaterThanOrEqual(2);

      const after = await ds
        .getRepository(Candidate)
        .findBy({ id: In([expired.id, invited.id, recent.id]) });
      const byId = new Map(after.map((c) => [c.id, c]));
      for (const id of [expired.id, invited.id]) {
        expect(byId.get(id)).toMatchObject({
          fullName: ANONYMIZED_NAME,
          email: `anon+${id}@invalid.local`,
          phone: null,
          anonymizedAt: expect.any(Date),
          anonymizedBy: null,
        });
      }
      expect(byId.get(recent.id)).toMatchObject({ anonymizedAt: null, phone: '0912345678' });

      expect(await ds.getRepository(CvFile).countBy({ candidateId: expired.id })).toBe(0);
      expect(await ds.getRepository(JobMatch).countBy({ candidateId: expired.id })).toBe(0);
      expect(
        await ds.getRepository(Application).findOneByOrFail({ id: expiredApp.id }),
      ).toMatchObject({ status: ApplicationStatus.Rejected, score: 70, scoreBreakdown: null });

      expect(await app.get(MaintenanceService).run(MAINTENANCE_TASK.anonymizeExpired)).toBe(0);
      await ds.getRepository(Application).delete({ jobId: job2.id });
      await ds.getRepository(Job).delete({ id: job2.id });
    });

    it('F-OPS-03: purges refresh tokens expired for more than 30 days only', async () => {
      const userId = ids.hr;
      const token = (daysAgo: number) => ({
        userId,
        familyId: randomUUID(),
        tokenHash: randomUUID().replace(/-/g, '').padEnd(64, 'f'),
        expiresAt: new Date(Date.now() - daysAgo * 86_400_000),
      });
      const [old, recent, alive] = await ds
        .getRepository(RefreshToken)
        .save([token(31), token(29), token(-7)]);

      const count = await app.get(MaintenanceService).run(MAINTENANCE_TASK.purgeTokens);
      expect(count).toBeGreaterThanOrEqual(1);
      const left = await ds
        .getRepository(RefreshToken)
        .findBy({ id: In([old.id, recent.id, alive.id]) });
      expect(left.map((t) => t.id).sort()).toEqual([recent.id, alive.id].sort());
    });
  });
});
