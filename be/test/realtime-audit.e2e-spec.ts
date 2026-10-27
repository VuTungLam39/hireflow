import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { makeDocx, SAMPLE_CV } from '../src/modules/ai/testing/cv-fixtures.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { AuditAction, AuditLog } from '../src/modules/audit/entities/audit-log.entity.js';
import { Notification } from '../src/modules/notifications/entities/notification.entity.js';
import { NotificationsService } from '../src/modules/notifications/notifications.service.js';
import { RefreshTokensService } from '../src/modules/refresh-tokens/refresh-tokens.service.js';
import { AiStatus } from '../src/common/enums/ai-status.enum.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { DashboardCache } from '../src/modules/dashboard/dashboard-cache.service.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { CvFile } from '../src/modules/files/entities/cv-file.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface StreamEvent {
  event: string;
  data: Record<string, unknown>;
}

// MVP 2 · F-NOTI-01 (US-12), F-AUDIT-01 (FR-AUDIT), cache dashboard (Kickoff 14)
describe('Dashboard cache, realtime notifications, audit log (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let base = '';
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    admin: `rt-admin-${run}@example.com`,
    hr: `rt-hr-${run}@example.com`,
    hr2: `rt-hr2-${run}@example.com`,
    hmA: `rt-hma-${run}@example.com`,
    hmB: `rt-hmb-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const userIds = {} as Record<Who, string>;
  const ids = { depA: '', depB: '', job: '', app: '', candidate: '' };
  const streams: { close: () => void }[] = [];

  const server = () => app.getHttpServer();
  const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);

  const openStream = async (who: Who) => {
    const controller = new AbortController();
    const res = await fetch(`${base}/api/v1/notifications/stream`, {
      headers: { Authorization: `Bearer ${tokens[who]}` },
      signal: controller.signal,
    });
    const events: StreamEvent[] = [];
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    void (async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) return;
          buffer += decoder.decode(value, { stream: true });
          let cut: number;
          while ((cut = buffer.indexOf('\n\n')) >= 0) {
            const block = buffer.slice(0, cut);
            buffer = buffer.slice(cut + 2);
            const event = /^event: (.+)$/m.exec(block)?.[1];
            const data = /^data: (.+)$/m.exec(block)?.[1];
            if (event && data) events.push({ event, data: JSON.parse(data) });
          }
        }
      } catch {
        return;
      }
    })();
    const stream = {
      status: res.status,
      type: res.headers.get('content-type'),
      events,
      close: () => controller.abort(),
    };
    streams.push(stream);
    return stream;
  };
  const until = async <T>(get: () => T | undefined, timeoutMs = 20_000): Promise<T> => {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const value = get();
      if (value !== undefined) return value;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error('Timed out');
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.listen(0, '127.0.0.1');
    base = `http://127.0.0.1:${(server().address() as AddressInfo).port}`;
    ds = app.get(DataSource);

    const [depA, depB] = await ds.getRepository(Department).save([
      { name: `RT A ${run}`, code: `RTA_${run}`.toUpperCase() },
      { name: `RT B ${run}`, code: `RTB_${run}`.toUpperCase() },
    ]);
    const passwordHash = await bcrypt.hash(password, 4);
    const users = await ds.getRepository(User).save([
      { email: emails.admin, fullName: 'RT Admin', role: Role.Admin, passwordHash },
      { email: emails.hr, fullName: 'RT HR', role: Role.Hr, passwordHash },
      { email: emails.hr2, fullName: 'RT HR 2', role: Role.Hr, passwordHash },
      {
        email: emails.hmA,
        fullName: 'RT HM A',
        role: Role.HiringManager,
        departmentId: depA.id,
        passwordHash,
      },
      {
        email: emails.hmB,
        fullName: 'RT HM B',
        role: Role.HiringManager,
        departmentId: depB.id,
        passwordHash,
      },
    ]);
    for (const u of users) {
      const who = (Object.keys(emails) as Who[]).find((k) => emails[k] === u.email)!;
      userIds[who] = u.id;
    }
    const job = await ds.getRepository(Job).save({
      title: `Backend RT ${run}`,
      departmentId: depA.id,
      status: JobStatus.Open,
      location: 'Hà Nội',
      jdText: 'JD',
      jdVersion: 1,
      createdBy: userIds.hr,
      publishedAt: new Date(),
    });
    await ds.getRepository(JobRequirement).save({
      jobId: job.id,
      jdVersion: 1,
      position: 1,
      label: 'NestJS',
      type: RequirementType.Must,
      weight: 3,
      minYears: 2,
      keywords: ['nestjs'],
    });
    Object.assign(ids, { depA: depA.id, depB: depB.id, job: job.id });

    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    for (const s of streams) s.close();
    const appIds = (await ds.getRepository(Application).findBy({ jobId: ids.job })).map(
      (a) => a.id,
    );
    const candidateIds = ids.candidate ? [ids.candidate] : [];
    await ds.getRepository(AuditLog).delete({
      entityId: In([...appIds, ...Object.values(userIds), ...candidateIds]),
    });
    await ds.getRepository(Application).delete({ jobId: ids.job });
    await ds.getRepository(CvFile).delete({ candidateId: In(candidateIds) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(JobRequirement).delete({ jobId: ids.job });
    await ds.getRepository(Job).delete({ id: ids.job });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: In([ids.depA, ids.depB]) });
    await app.close();
  });

  describe('realtime notifications (F-NOTI-01)', () => {
    it('US-12, BR-NOTI-01: a scored CV notifies the job owner and the department manager live; others only see what their scope allows', async () => {
      const hr = await openStream('hr');
      const hr2 = await openStream('hr2');
      const hmA = await openStream('hmA');
      const hmB = await openStream('hmB');
      expect(hr.status).toBe(200);
      expect(hr.type).toContain('text/event-stream');
      await until(() => (hmB.events.some((e) => e.event === 'ready') ? true : undefined));

      const upload = await as('hr', request(server()).post(`/api/v1/jobs/${ids.job}/applications`))
        .field('fullName', `Ứng viên RT ${run}`)
        .field('email', `rt-c-${run}@example.com`)
        .field('consentConfirmed', 'true')
        .attach('cv', await makeDocx(SAMPLE_CV), { filename: 'cv.docx', contentType: DOCX })
        .expect(201);
      ids.app = upload.body.data.id;
      ids.candidate = upload.body.data.candidate.id;

      const forHr = await until(() => hr.events.find((e) => e.event === 'notification'));
      expect(forHr.data).toMatchObject({
        unreadCount: 1,
        notification: {
          type: 'CV_SCORED',
          readAt: null,
          application: {
            id: ids.app,
            candidateName: `Ứng viên RT ${run}`,
            jobId: ids.job,
            jobTitle: `Backend RT ${run}`,
            score: expect.any(Number),
          },
        },
      });
      await until(() => hmA.events.find((e) => e.event === 'notification'));

      const done = (e: StreamEvent) =>
        e.event === 'application' && e.data.applicationId === ids.app && e.data.aiStatus === 'DONE';
      await until(() => hr2.events.find(done));
      expect(hr2.events.some((e) => e.event === 'notification')).toBe(false);
      expect(hmB.events.some((e) => e.event === 'application' || e.event === 'notification')).toBe(
        false,
      );
    });

    it('lists my notifications, marks one or all as read; another user cannot touch them', async () => {
      const list = await as('hr', request(server()).get('/api/v1/notifications')).expect(200);
      expect(list.body.data).toHaveLength(1);
      expect(list.body.meta).toMatchObject({ hasNextPage: false });
      const id = list.body.data[0].id as string;

      await as('hr2', request(server()).patch(`/api/v1/notifications/${id}/read`)).expect(404);
      const read = await as(
        'hr',
        request(server()).patch(`/api/v1/notifications/${id}/read`),
      ).expect(200);
      expect(read.body.data).toEqual({ unreadCount: 0 });

      const count = await as('hmA', request(server()).get('/api/v1/notifications/unread-count'));
      expect(count.body.data).toEqual({ unreadCount: 1 });
      await as('hmA', request(server()).patch('/api/v1/notifications/read-all')).expect(200);
      const after = await as('hmA', request(server()).get('/api/v1/notifications/unread-count'));
      expect(after.body.data).toEqual({ unreadCount: 0 });
    });

    it('BR-NOTI-01: when the job owner is no longer active, every active HR is notified instead', async () => {
      await ds.getRepository(User).update(userIds.hr, { isActive: false });
      try {
        const before = await ds.getRepository(Notification).countBy({ userId: userIds.hr2 });
        await app.get(NotificationsService).notifyAiFinished(ids.app, AiStatus.Done);
        expect(await ds.getRepository(Notification).countBy({ userId: userIds.hr2 })).toBe(
          before + 1,
        );
        expect(await ds.getRepository(Notification).countBy({ userId: userIds.hmB })).toBe(0);
      } finally {
        await ds.getRepository(User).update(userIds.hr, { isActive: true });
      }
    });

    it('the stream needs a valid token', async () => {
      const res = await fetch(`${base}/api/v1/notifications/stream`);
      expect(res.status).toBe(401);
    });
  });

  describe('dashboard cache', () => {
    it('serves repeated reads from Redis, per scope, and drops the cache when an application changes', async () => {
      const cache = app.get(DashboardCache);
      const summary = async (who: Who) =>
        (await as(who, request(server()).get('/api/v1/dashboard/summary')).expect(200)).body.data;

      const first = await summary('hmA');
      const hits = cache.stats.hits;
      expect(await summary('hmA')).toEqual(first);
      expect(cache.stats.hits).toBe(hits + 1);
      expect((await summary('hmB')).totals.applications).toBe(0);
      expect(first.totals.applications).toBe(1);

      await as('hr', request(server()).patch(`/api/v1/applications/${ids.app}/status`))
        .send({ status: ApplicationStatus.Screening })
        .expect(200);
      const after = await summary('hmA');
      expect(after.byStatus).toMatchObject({ NEW: 0, SCREENING: 1 });
    });
  });

  describe('audit log (F-AUDIT-01)', () => {
    it('records status changes with actor, IP and request id; only Admin can read', async () => {
      await as('hr', request(server()).patch(`/api/v1/applications/${ids.app}/status`))
        .set('X-Request-Id', `rt-${run}`)
        .send({ status: ApplicationStatus.Rejected, reason: 'Chưa đủ kinh nghiệm' })
        .expect(200);

      await as('hr', request(server()).get(`/api/v1/audit-logs?entityId=${ids.app}`)).expect(403);
      const res = await as(
        'admin',
        request(server()).get(
          `/api/v1/audit-logs?entityId=${ids.app}&action=APPLICATION_STATUS_CHANGED`,
        ),
      ).expect(200);
      expect(res.body.data[0]).toMatchObject({
        action: 'APPLICATION_STATUS_CHANGED',
        entity: 'application',
        entityId: ids.app,
        metadata: { from: 'SCREENING', to: 'REJECTED', reason: 'Chưa đủ kinh nghiệm' },
        requestId: `rt-${run}`,
        ip: expect.any(String),
        actor: { id: userIds.hr, fullName: 'RT HR', email: emails.hr },
      });
      expect(res.body.data).toHaveLength(2);

      await as('hr', request(server()).patch(`/api/v1/applications/${ids.app}/reopen`))
        .send({ reason: 'Xét lại' })
        .expect(200);
      const reopened = await as(
        'admin',
        request(server()).get(`/api/v1/audit-logs?entityId=${ids.app}&limit=1`),
      ).expect(200);
      expect(reopened.body.data[0].metadata).toMatchObject({
        from: 'REJECTED',
        to: 'SCREENING',
        reopen: true,
      });
      expect(reopened.body.meta).toMatchObject({
        hasNextPage: true,
        nextCursor: expect.any(String),
      });
    });

    it('records CV views and permission changes', async () => {
      const detail = await as(
        'hmA',
        request(server()).get(`/api/v1/applications/${ids.app}`),
      ).expect(200);
      const fileId = detail.body.data.cv.fileId as string;
      await as('hmA', request(server()).get(`/api/v1/files/${fileId}/url`)).expect(200);
      const views = await as(
        'admin',
        request(server()).get(`/api/v1/audit-logs?action=CV_VIEWED&actorId=${userIds.hmA}`),
      ).expect(200);
      expect(views.body.data[0]).toMatchObject({ entity: 'cv_file', entityId: fileId });

      await as('admin', request(server()).patch(`/api/v1/users/${userIds.hr2}`))
        .send({ role: Role.HiringManager, departmentId: ids.depB })
        .expect(200);
      const changed = await as(
        'admin',
        request(server()).get(`/api/v1/audit-logs?entity=user&entityId=${userIds.hr2}`),
      ).expect(200);
      expect(changed.body.data[0]).toMatchObject({
        action: 'USER_UPDATED',
        actor: { id: userIds.admin },
        metadata: {
          roleFrom: Role.Hr,
          roleTo: Role.HiringManager,
          departmentFrom: null,
          departmentTo: ids.depB,
        },
      });
    });

    it('BR-AUDIT-01: reusing a revoked refresh token is recorded as a security event', async () => {
      const tokens = app.get(RefreshTokensService);
      const first = await tokens.issue(userIds.hr2, { userAgent: 'e2e', ip: '127.0.0.1' });
      await tokens.rotate(first);
      await expect(
        tokens.rotate(first, { userAgent: 'attacker', ip: '203.0.113.9' }),
      ).rejects.toThrow();
      const row = await ds.getRepository(AuditLog).findOneByOrFail({
        action: AuditAction.TokenReuseDetected,
        entityId: userIds.hr2,
      });
      expect(row).toMatchObject({
        actorId: null,
        entity: 'user',
        metadata: { userAgent: 'attacker' },
      });
    });

    it('the database refuses to edit an audit row', async () => {
      const row = await ds.getRepository(AuditLog).findOneByOrFail({ entityId: ids.app });
      await expect(ds.getRepository(AuditLog).update(row.id, { metadata: {} })).rejects.toThrow(
        /append-only/,
      );
    });
  });
});
