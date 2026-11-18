import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import type { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AiStatus } from '../src/common/enums/ai-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { nextVnMidnight } from '../src/modules/ai/ai-quota.service.js';
import { AiUsage } from '../src/modules/ai/entities/ai-usage.entity.js';
import { jobId, QUEUE } from '../src/modules/ai/pipeline/queues.js';
import { makeDocx, SAMPLE_CV } from '../src/modules/ai/testing/cv-fixtures.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { AuditLog } from '../src/modules/audit/entities/audit-log.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { CvFile } from '../src/modules/files/entities/cv-file.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import {
  Organization,
  OrganizationStatus,
} from '../src/modules/organizations/entities/organization.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';
import { withOrg } from './fixtures.js';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface Detail {
  id: string;
  aiStatus: AiStatus;
  aiWaitingUntil: string | null;
  cv: { fileId: string } | null;
}

// MVP 3 · BR-AI-11, US-25 · KH mục 11: hạn mức 1 → hồ sơ thứ 2 bị hoãn; chat thứ 2 bị 429
describe('AI quota per organization (e2e)', { timeout: 60_000 }, () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const orgId = randomUUID();
  const password = 'Password123';
  const emails = { hr: `q-hr-${run}@example.com`, root: `q-root-${run}@example.com` };
  const tokens = { hr: '', root: '' };
  let job = '';

  const server = () => app.getHttpServer();
  const as = (who: keyof typeof tokens, req: request.Test) =>
    req.set('Authorization', `Bearer ${tokens[who]}`);
  const detail = async (id: string) =>
    (await as('hr', request(server()).get(`/api/v1/applications/${id}`)).expect(200)).body
      .data as Detail;
  const waitFor = async (id: string, done: (d: Detail) => boolean) => {
    const until = Date.now() + 30_000;
    let last: Detail | undefined;
    while (Date.now() < until) {
      last = await detail(id);
      if (done(last)) return last;
      await new Promise((r) => setTimeout(r, 150));
    }
    throw new Error(`Timed out waiting for ${id}: ${JSON.stringify(last)}`);
  };
  const upload = async (n: number) => {
    const res = await as('hr', request(server()).post(`/api/v1/jobs/${job}/applications`))
      .field('fullName', `Ứng viên hạn mức ${n}`)
      .field('email', `q-cand-${n}-${run}@example.com`)
      .field('consentConfirmed', 'true')
      .attach('cv', await makeDocx([...SAMPLE_CV, `Mã hồ sơ ${run}-${n}`]), {
        filename: 'cv.docx',
        contentType: DOCX,
      })
      .expect(201);
    return res.body.data as Detail;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    await ds.getRepository(Organization).insert({
      id: orgId,
      name: `Công ty hạn mức ${run}`,
      slug: `quota-${run}`,
      status: OrganizationStatus.Active,
      aiDailyScoreLimit: 1,
      aiDailyChatLimit: 1,
    });
    const passwordHash = await bcrypt.hash(password, 4);
    const dep = await ds
      .getRepository(Department)
      .save(withOrg({ name: `Hạn mức ${run}`, code: `Q_${run}`.toUpperCase() }, orgId));
    const [hr] = await ds.getRepository(User).save([
      withOrg({ email: emails.hr, fullName: 'HR hạn mức', role: Role.Hr, passwordHash }, orgId),
      {
        email: emails.root,
        fullName: 'Quản trị sàn',
        role: Role.PlatformAdmin,
        organizationId: null,
        passwordHash,
      },
    ]);
    const saved = await ds.getRepository(Job).save(
      withOrg(
        {
          title: `Backend NestJS ${run}`,
          departmentId: dep.id,
          status: JobStatus.Open,
          location: 'Hà Nội',
          jdText: 'Xây dựng API NestJS, PostgreSQL, Redis cho hệ thống tuyển dụng nhiều công ty.',
          createdBy: hr.id,
          publishedAt: new Date(),
        },
        orgId,
      ),
    );
    job = saved.id;
    await ds.getRepository(JobRequirement).save({
      jobId: job,
      jdVersion: 1,
      position: 0,
      label: 'NestJS',
      type: RequirementType.Must,
      weight: 2,
      keywords: ['nestjs'],
    });
    for (const who of Object.keys(tokens) as (keyof typeof tokens)[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    const apps = await ds.getRepository(Application).findBy({ organizationId: orgId });
    const queue = app.get<Queue>(getQueueToken(QUEUE.extract));
    for (const a of apps) {
      if (a.cvFileId) await queue.remove(jobId.extract(a.cvFileId, 'v4')).catch(() => undefined);
    }
    await ds.query(`DELETE FROM application_status_history WHERE application_id = ANY($1)`, [
      apps.map((a) => a.id),
    ]);
    await ds.getRepository(Application).delete({ organizationId: orgId });
    await ds.query(
      `DELETE FROM cv_profiles WHERE cv_file_id IN (SELECT id FROM cv_files WHERE organization_id = $1)`,
      [orgId],
    );
    await ds.query(`DELETE FROM cv_chunks WHERE organization_id = $1`, [orgId]);
    await ds.getRepository(CvFile).delete({ organizationId: orgId });
    await ds.getRepository(Candidate).delete({ organizationId: orgId });
    await ds.getRepository(JobRequirement).delete({ jobId: job });
    await ds.getRepository(Job).delete({ organizationId: orgId });
    await ds.getRepository(AuditLog).delete({ organizationId: orgId });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ organizationId: orgId });
    await ds.getRepository(AiUsage).delete({ organizationId: orgId });
    await ds.getRepository(Organization).delete({ id: orgId });
    await app.close();
  });

  it('BR-AI-11: the CV over the daily limit waits until 00:00 Vietnam time, still PENDING', async () => {
    const first = await upload(1);
    await waitFor(first.id, (d) => d.aiStatus === AiStatus.Done);

    const second = await upload(2);
    const waiting = await waitFor(second.id, (d) => !!d.aiWaitingUntil);
    expect(waiting.aiStatus).toBe(AiStatus.Pending);
    expect(new Date(waiting.aiWaitingUntil!).toISOString()).toBe(nextVnMidnight().toISOString());

    const queued = await app
      .get<Queue>(getQueueToken(QUEUE.extract))
      .getJob(jobId.extract(waiting.cv!.fileId, process.env.AI_PROMPT_VERSION ?? 'v4'));
    expect(await queued!.getState()).toBe('delayed');
    expect(queued!.attemptsMade).toBe(0);

    // Lượt bị trả lại, không cộng dồn khi hết hạn mức
    const usage = await ds
      .getRepository(AiUsage)
      .findOneByOrFail({ organizationId: orgId, kind: 'CV' as never });
    expect(usage.count).toBe(1);
  });

  it('BR-AI-11: the second chat of the day is 429 AI_QUOTA_EXCEEDED, so are the other AI helpers', async () => {
    const first = await as('hr', request(server()).post('/api/v1/ai/chat')).send({
      question: 'Ai biết NestJS?',
    });
    expect(first.status).toBe(200);
    const second = await as('hr', request(server()).post('/api/v1/ai/chat'))
      .send({ question: 'Ai biết NestJS?' })
      .expect(429);
    expect(second.body.code).toBe('AI_QUOTA_EXCEEDED');
    const suggest = await as(
      'hr',
      request(server()).post(`/api/v1/jobs/${job}/requirements/suggest`),
    ).expect(429);
    expect(suggest.body.code).toBe('AI_QUOTA_EXCEEDED');
  });

  it('F-PLAT-02: the platform admin sees 7 days of usage and raises the limits', async () => {
    const before = await as(
      'root',
      request(server()).get(`/api/v1/platform/organizations/${orgId}`),
    ).expect(200);
    expect(before.body.data.aiUsage).toHaveLength(7);
    expect(before.body.data.aiUsage[0]).toMatchObject({ cv: 1, chat: 1 });

    await as('root', request(server()).patch(`/api/v1/platform/organizations/${orgId}/ai-limits`))
      .send({ aiDailyScoreLimit: -1, aiDailyChatLimit: 5 })
      .expect(400);
    const res = await as(
      'root',
      request(server()).patch(`/api/v1/platform/organizations/${orgId}/ai-limits`),
    )
      .send({ aiDailyScoreLimit: 10, aiDailyChatLimit: 5 })
      .expect(200);
    expect(res.body.data).toMatchObject({ aiDailyScoreLimit: 10, aiDailyChatLimit: 5 });
    expect(
      await ds
        .getRepository(AuditLog)
        .existsBy({ organizationId: orgId, action: 'ORG_AI_LIMITS_UPDATED' as never }),
    ).toBe(true);

    // Hạn mức mới áp dụng ngay trên tiến trình này
    await as('hr', request(server()).post(`/api/v1/jobs/${job}/requirements/suggest`)).expect(200);
    await as('hr', request(server()).patch(`/api/v1/platform/organizations/${orgId}/ai-limits`))
      .send({ aiDailyScoreLimit: 10, aiDailyChatLimit: 5 })
      .expect(403);
  });
});
