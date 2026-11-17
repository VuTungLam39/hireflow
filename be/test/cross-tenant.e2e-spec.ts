import { INestApplication, RequestMethod, Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { DiscoveryModule, DiscoveryService, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { IS_PUBLIC_KEY } from '../src/common/constants/index.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import {
  AuditAction,
  AuditEntity,
  AuditLog,
} from '../src/modules/audit/entities/audit-log.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { MediaFile, MediaKind } from '../src/modules/company/entities/media-file.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { CvFile } from '../src/modules/files/entities/cv-file.entity.js';
import { InterviewAssignee } from '../src/modules/interviews/entities/interview-assignee.entity.js';
import { Interview } from '../src/modules/interviews/entities/interview.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { Notification } from '../src/modules/notifications/entities/notification.entity.js';
import {
  Organization,
  OrganizationStatus,
} from '../src/modules/organizations/entities/organization.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';
import { withOrg } from './fixtures.js';

const VERB: Record<number, 'get' | 'post' | 'put' | 'patch' | 'delete'> = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.DELETE]: 'delete',
};

// MVP 3 · US-21, BR-TEN-01 → 04
describe('Cross-tenant isolation (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const a = {
    dept: '',
    hr: '',
    interviewer: '',
    job: '',
    candidate: '',
    cv: '',
    app: '',
    app2: '',
    interview: '',
    media: '',
    notification: '',
    hrEmail: `x-hr-${run}@example.com`,
    candidateEmail: `x-cand-${run}@example.com`,
  };
  const orgA = randomUUID();
  const orgB = randomUUID();
  const inA = <T>(value: T): T => withOrg(value, orgA);
  const adminB = `x-admin-b-${run}@example.com`;
  let tokenB = '';

  const server = () => app.getHttpServer();
  const asB = (req: request.Test) => req.set('Authorization', `Bearer ${tokenB}`);
  const footprint = () =>
    [a.dept, a.hr, a.job, a.candidate, a.cv, a.app, a.interview, a.media, a.notification].concat([
      a.hrEmail,
      a.candidateEmail,
    ]);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DiscoveryModule],
    }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);
    const passwordHash = await bcrypt.hash(password, 4);
    await ds.getRepository(Organization).insert({
      id: orgA,
      name: `Công ty A ${run}`,
      slug: `cross-a-${run}`,
      status: OrganizationStatus.Active,
    });

    const dept = await ds
      .getRepository(Department)
      .save(inA({ name: `Cross A ${run}`, code: `XA_${run}`.toUpperCase() }));
    const [hr, interviewer] = await ds.getRepository(User).save(
      inA([
        { email: a.hrEmail, fullName: 'Cross HR A', role: Role.Hr, passwordHash },
        {
          email: `x-iv-${run}@example.com`,
          fullName: 'Cross IV A',
          role: Role.Interviewer,
          passwordHash,
        },
      ]),
    );
    const job = await ds.getRepository(Job).save(
      inA({
        title: `Cross job A ${run}`,
        departmentId: dept.id,
        status: JobStatus.Open,
        location: 'Hà Nội',
        jdText: 'JD',
        createdBy: hr.id,
        publishedAt: new Date(),
      }),
    );
    await ds.getRepository(JobRequirement).save({
      jobId: job.id,
      jdVersion: 1,
      position: 0,
      label: 'NestJS',
      type: RequirementType.Must,
      weight: 2,
      keywords: ['nestjs'],
    });
    const candidate = await ds.getRepository(Candidate).save(
      inA({
        fullName: 'Cross Candidate A',
        email: a.candidateEmail,
        consentAt: new Date(),
        consentVersion: 'v2',
      }),
    );
    const cv = await ds.getRepository(CvFile).save(
      inA({
        candidateId: candidate.id,
        storageKey: `cv/test/cross-${run}.pdf`,
        originalName: 'cv.pdf',
        mime: 'application/pdf',
        sizeBytes: 100,
        sha256: 'c'.repeat(64),
        text: '3 năm NestJS',
      }),
    );
    const application = await ds.getRepository(Application).save(
      inA({
        jobId: job.id,
        candidateId: candidate.id,
        cvFileId: cv.id,
        status: ApplicationStatus.Interview,
      }),
    );
    const candidate2 = await ds.getRepository(Candidate).save(
      inA({
        fullName: 'Cross Candidate A2',
        email: `x-cand2-${run}@example.com`,
        consentAt: new Date(),
        consentVersion: 'v2',
      }),
    );
    const application2 = await ds.getRepository(Application).save(
      inA({
        jobId: job.id,
        candidateId: candidate2.id,
        status: ApplicationStatus.Interview,
      }),
    );
    const interview = await ds.getRepository(Interview).save(
      inA({
        applicationId: application.id,
        round: 1,
        scheduledAt: new Date(Date.now() + 86_400_000),
        durationMinutes: 60,
        location: 'Phòng họp',
        createdBy: hr.id,
      }),
    );
    await ds
      .getRepository(InterviewAssignee)
      .save({ interviewId: interview.id, userId: interviewer.id });
    const media = await ds.getRepository(MediaFile).save(
      inA({
        kind: MediaKind.Gallery,
        storageKey: `media/${'d'.repeat(64)}.png`,
        mime: 'image/png',
        sizeBytes: 10,
        width: 1,
        height: 1,
        sha256: 'd'.repeat(64),
        altText: 'Ảnh công ty A',
        position: 0,
        createdBy: hr.id,
      }),
    );
    const notification = await ds.getRepository(Notification).save({
      userId: hr.id,
      type: 'CV_SCORED',
      applicationId: application.id,
    } as Partial<Notification>);
    await ds.getRepository(AuditLog).insert(
      inA({
        actorId: hr.id,
        action: AuditAction.CvViewed,
        entity: AuditEntity.CvFile,
        entityId: cv.id,
        metadata: {},
      }),
    );
    Object.assign(a, {
      dept: dept.id,
      hr: hr.id,
      interviewer: interviewer.id,
      job: job.id,
      candidate: candidate.id,
      cv: cv.id,
      app: application.id,
      app2: application2.id,
      interview: interview.id,
      media: media.id,
      notification: notification.id,
    });

    await ds.getRepository(Organization).insert({
      id: orgB,
      name: `Công ty B ${run}`,
      slug: `cross-b-${run}`,
      status: OrganizationStatus.Active,
    });
    await ds.getRepository(User).save({
      organizationId: orgB,
      email: adminB,
      fullName: 'Admin B',
      role: Role.Admin,
      passwordHash,
      emailVerifiedAt: new Date(),
    });
    const res = await request(server())
      .post('/api/v1/auth/login')
      .send({ email: adminB, password })
      .expect(200);
    tokenB = res.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await ds
      .getRepository(Notification)
      .delete({ id: a.notification })
      .catch(() => undefined);
    await ds
      .getRepository(Interview)
      .delete({ id: a.interview })
      .catch(() => undefined);
    await ds
      .getRepository(Application)
      .delete({ id: In([a.app, a.app2]) })
      .catch(() => undefined);
    await ds
      .getRepository(CvFile)
      .delete({ id: a.cv })
      .catch(() => undefined);
    await ds
      .getRepository(Candidate)
      .delete({ id: a.candidate })
      .catch(() => undefined);
    await ds
      .getRepository(MediaFile)
      .delete({ id: a.media })
      .catch(() => undefined);
    await ds
      .getRepository(Job)
      .delete({ id: a.job })
      .catch(() => undefined);
    await ds
      .getRepository(User)
      .delete({ email: In([a.hrEmail, `x-iv-${run}@example.com`, adminB]) })
      .catch(() => undefined);
    await ds
      .getRepository(Department)
      .delete({ id: a.dept })
      .catch(() => undefined);
    await app.close();
  });

  interface Route {
    controller: string;
    handler: string;
    verb: (typeof VERB)[number];
    path: string;
  }

  const routes = (): Route[] => {
    const reflector = app.get(Reflector);
    const out: Route[] = [];
    for (const { metatype } of app.get(DiscoveryService).getControllers()) {
      if (!metatype) continue;
      const controller = metatype as Type;
      const base = [Reflect.getMetadata(PATH_METADATA, controller) as string | string[]].flat()[0];
      const proto = controller.prototype as Record<string, unknown>;
      for (const name of Object.getOwnPropertyNames(proto)) {
        const handler = proto[name];
        if (name === 'constructor' || typeof handler !== 'function') continue;
        if (!Reflect.hasMetadata(PATH_METADATA, handler)) continue;
        if (reflector.getAllAndOverride(IS_PUBLIC_KEY, [handler, controller])) continue;
        const sub = [Reflect.getMetadata(PATH_METADATA, handler) as string | string[]].flat()[0];
        const method = Reflect.getMetadata(METHOD_METADATA, handler) as number;
        const path = `/${[base, sub].filter((p) => p && p !== '/').join('/')}`.replace(/\/+/g, '/');
        out.push({ controller: controller.name, handler: name, verb: VERB[method], path });
      }
    }
    return out;
  };

  // BR-TEN-02
  const idFor = (route: Route, param: string): string | undefined => {
    const byController: Record<string, Record<string, string>> = {
      ApplicationsController: { id: a.app },
      JobApplicationsController: { jobId: a.job },
      CandidatesController: { id: a.candidate },
      CompanyController: { id: a.media },
      DepartmentsController: { id: a.dept },
      FilesController: { fileId: a.cv },
      InterviewsController: { id: a.interview },
      ApplicationInterviewsController: { applicationId: a.app },
      JobsController: { id: a.job },
      MatchingController: { id: a.job, candidateId: a.candidate },
      NotificationsController: { id: a.notification },
      UsersController: { id: a.hr },
      AdminJobsController: { applicationId: a.app },
      PlatformController: { id: orgA },
    };
    return byController[route.controller]?.[param];
  };

  const queryFor: Record<string, string> = {
    '/jobs/:jobId/applications/compare': '?ids=APP1,APP2',
  };

  it('every route with an id refuses ids of another organization (US-21)', async () => {
    const all = routes();
    const withParams = all.filter((r) => r.path.includes(':'));
    const missing: string[] = [];
    const leaks: string[] = [];
    for (const route of withParams) {
      let url = `/api/v1${route.path}${queryFor[route.path] ?? ''}`;
      let ok = true;
      for (const [, param] of route.path.matchAll(/:(\w+)/g)) {
        const id = idFor(route, param);
        if (!id) {
          missing.push(`${route.controller}.${route.handler} :${param}`);
          ok = false;
          break;
        }
        url = url.replace(`:${param}`, id);
      }
      url = url.replace('APP1', a.app).replace('APP2', a.app2);
      if (!ok) continue;
      const res = await asB(request(server())[route.verb](url)).send({});
      const allowed = route.verb === 'get' ? [403, 404] : [400, 403, 404];
      if (!allowed.includes(res.status)) {
        leaks.push(`${route.verb.toUpperCase()} ${route.path} → ${res.status}`);
      }
    }
    expect(withParams.length).toBeGreaterThan(30);
    expect(missing).toEqual([]);
    expect(leaks).toEqual([]);
  });

  it('lists, dashboards, exports and searches show nothing of another organization (BR-TEN-02, 03)', async () => {
    const query: Record<string, string> = {
      '/applications': `jobId=${a.job}&limit=100`,
      '/applications/export': `jobId=${a.job}`,
      '/applications/compare': `ids=${a.app},${a.app2}`,
      '/candidates': `search=${encodeURIComponent(a.candidateEmail)}`,
      '/jobs': `departmentId=${a.dept}`,
      '/users': `search=${encodeURIComponent(a.hrEmail)}`,
      '/departments': `search=${encodeURIComponent(`Cross A ${run}`)}`,
      '/audit-logs': `entity=${AuditEntity.CvFile}`,
      '/dashboard/funnel': `jobId=${a.job}`,
      '/ai/cv-search': 'q=nestjs',
    };
    const lists = routes().filter(
      (r) => r.verb === 'get' && !r.path.includes(':') && !r.path.endsWith('/stream'),
    );
    const leaks: string[] = [];
    for (const route of lists) {
      const qs = query[route.path] ? `?${query[route.path]}` : '';
      const res = await asB(request(server()).get(`/api/v1${route.path}${qs}`));
      const body = res.text ?? JSON.stringify(res.body);
      const found = footprint().filter((v) => v && body.includes(v));
      if (res.status < 300 && found.length)
        leaks.push(`GET ${route.path} shows ${found.join(', ')}`);
      const total = (res.body as { meta?: { totalItems?: number } })?.meta?.totalItems ?? 0;
      if (res.status < 300 && query[route.path] && total > 0) {
        leaks.push(`GET ${route.path} counts ${total} rows of another organization`);
      }
    }
    expect(lists.length).toBeGreaterThan(15);
    expect(leaks).toEqual([]);
  });

  it('the data of organization A is untouched after every call of organization B', async () => {
    const job = await ds.getRepository(Job).findOneByOrFail({ id: a.job });
    const application = await ds.getRepository(Application).findOneByOrFail({ id: a.app });
    const candidate = await ds.getRepository(Candidate).findOneByOrFail({ id: a.candidate });
    expect(job.status).toBe(JobStatus.Open);
    expect(job.deletedAt).toBeNull();
    expect(application.status).toBe(ApplicationStatus.Interview);
    expect(candidate.anonymizedAt).toBeNull();
    expect(await ds.getRepository(Department).existsBy({ id: a.dept })).toBe(true);
    expect(await ds.getRepository(User).findOneByOrFail({ id: a.hr })).toMatchObject({
      isActive: true,
      deletedAt: null,
    });
  });
});
