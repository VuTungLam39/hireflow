import { INestApplication, NotFoundException, RequestMethod, Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js';
// @ts-expect-error — class-transformer không xuất type cho storage nội bộ
import { defaultMetadataStorage } from 'class-transformer/cjs/storage.js';
import { getMetadataStorage } from 'class-validator';
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
import { ApplicationsService } from '../src/modules/applications/applications.service.js';
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
import { JobInterviewStage } from '../src/modules/jobs/entities/job-interview-stage.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { Offer } from '../src/modules/offers/entities/offer.entity.js';
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
    offer: '',
    hm: '',
    stage: '',
    criterion: '',
    requirement: '',
    hrEmail: `x-hr-${run}@example.com`,
    candidateEmail: `x-cand-${run}@example.com`,
  };
  const orgA = randomUUID();
  const orgB = randomUUID();
  const inA = <T>(value: T): T => withOrg(value, orgA);
  const adminB = `x-admin-b-${run}@example.com`;
  let tokenB = '';
  let tokenIvB = '';
  const b = {
    admin: '',
    dept: '',
    hm: '',
    interviewer: '',
    job: '',
    emptyJob: '',
    app: '',
    bulkApp: '',
    stage: '',
    criterion: '',
    requirement: '',
    pastInterview: '',
    futureInterview: '',
  };

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
    const requirementA = await ds.getRepository(JobRequirement).save({
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
    // MVP 3.1 · F-OFFER-01
    const offer = await ds.getRepository(Offer).save(
      inA({
        applicationId: application.id,
        salaryAmount: 20_000_000,
        startDate: '2099-01-15',
        respondBy: '2099-01-01',
        createdBy: hr.id,
      }),
    );
    const hmA = await ds.getRepository(User).save(
      inA({
        email: `x-hm-${run}@example.com`,
        fullName: 'Cross HM A',
        role: Role.HiringManager,
        departmentId: dept.id,
        passwordHash,
      }),
    );
    const criterionA = randomUUID();
    const stageA = await ds.getRepository(JobInterviewStage).save({
      jobId: job.id,
      position: 1,
      name: 'Vòng A',
      criteria: [{ id: criterionA, label: 'Tiêu chí A' }],
    });
    Object.assign(a, {
      hm: hmA.id,
      stage: stageA.id,
      criterion: criterionA,
      requirement: requirementA.id,
      offer: offer.id,
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
    const inB = <T>(value: T): T => withOrg(value, orgB);
    const deptB = await ds
      .getRepository(Department)
      .save(inB({ name: `Cross B ${run}`, code: `XB_${run}`.toUpperCase() }));
    const [adminUserB, hmB, ivB] = await ds.getRepository(User).save(
      inB<Partial<User>[]>([
        {
          email: adminB,
          fullName: 'Admin B',
          role: Role.Admin,
          passwordHash,
          emailVerifiedAt: new Date(),
        },
        {
          email: `x-hm-b-${run}@example.com`,
          fullName: 'HM B',
          role: Role.HiringManager,
          departmentId: deptB.id,
          passwordHash,
        },
        {
          email: `x-iv-b-${run}@example.com`,
          fullName: 'IV B',
          role: Role.Interviewer,
          passwordHash,
          emailVerifiedAt: new Date(),
        },
      ]),
    );
    const jobB = await ds.getRepository(Job).save(
      inB({
        title: `Cross job B ${run}`,
        departmentId: deptB.id,
        status: JobStatus.Open,
        location: 'HCM',
        jdText: 'JD',
        createdBy: adminUserB.id,
        publishedAt: new Date(),
      }),
    );
    // SG-01 · R1
    const emptyJobB = await ds.getRepository(Job).save(
      inB({
        title: `Cross empty job B ${run}`,
        departmentId: deptB.id,
        status: JobStatus.Draft,
        location: 'HCM',
        jdText: 'JD',
        createdBy: adminUserB.id,
      }),
    );
    const requirementB = await ds.getRepository(JobRequirement).save({
      jobId: jobB.id,
      jdVersion: 1,
      position: 0,
      label: 'API',
      type: RequirementType.Must,
      weight: 2,
      keywords: ['api'],
    });
    const criterionB = randomUUID();
    const stageB = await ds.getRepository(JobInterviewStage).save({
      jobId: jobB.id,
      position: 1,
      name: 'Vòng 1',
      criteria: [{ id: criterionB, label: 'API' }],
    });
    const candB = await ds.getRepository(Candidate).save(
      inB({
        fullName: 'Cand B',
        email: `x-cand-b-${run}@example.com`,
        consentAt: new Date(),
        consentVersion: 'v2',
      }),
    );
    const appB = await ds
      .getRepository(Application)
      .save(inB({ jobId: jobB.id, candidateId: candB.id, status: ApplicationStatus.Interview }));
    const candB2 = await ds.getRepository(Candidate).save(
      inB({
        fullName: 'Cand B2',
        email: `x-cand-b2-${run}@example.com`,
        consentAt: new Date(),
        consentVersion: 'v2',
      }),
    );
    const bulkAppB = await ds
      .getRepository(Application)
      .save(inB({ jobId: jobB.id, candidateId: candB2.id, status: ApplicationStatus.New }));
    const [pastIv, futureIv] = await ds.getRepository(Interview).save(
      inB<Partial<Interview>[]>([
        {
          applicationId: appB.id,
          round: 1,
          scheduledAt: new Date(Date.now() - 3_600_000),
          durationMinutes: 30,
          location: 'B',
          createdBy: adminUserB.id,
        },
        {
          applicationId: appB.id,
          round: 2,
          scheduledAt: new Date(Date.now() + 10 * 86_400_000),
          durationMinutes: 30,
          location: 'B',
          createdBy: adminUserB.id,
        },
      ]),
    );
    await ds.getRepository(InterviewAssignee).save([
      { interviewId: pastIv.id, userId: ivB.id },
      { interviewId: futureIv.id, userId: ivB.id },
    ]);
    Object.assign(b, {
      admin: adminUserB.id,
      dept: deptB.id,
      hm: hmB.id,
      interviewer: ivB.id,
      job: jobB.id,
      emptyJob: emptyJobB.id,
      app: appB.id,
      bulkApp: bulkAppB.id,
      stage: stageB.id,
      criterion: criterionB,
      requirement: requirementB.id,
      pastInterview: pastIv.id,
      futureInterview: futureIv.id,
    });
    const login = (email: string) =>
      request(server()).post('/api/v1/auth/login').send({ email, password }).expect(200);
    tokenB = (await login(adminB)).body.data.tokens.accessToken;
    tokenIvB = (await login(`x-iv-b-${run}@example.com`)).body.data.tokens.accessToken;
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
    // SG-01 · R1
    for (const table of [
      'interviews',
      'applications',
      'candidates',
      'jobs',
      'users',
      'departments',
    ]) {
      await ds
        .query(`DELETE FROM ${table} WHERE organization_id = $1`, [orgB])
        .catch(() => undefined);
    }
    await ds
      .getRepository(User)
      .delete({ email: `x-hm-${run}@example.com` })
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

  // SG-01 · R1
  const bodyIdFields = (dto: Type | undefined, prefix = '', seen = new Set<Type>()): string[] => {
    if (!dto || seen.has(dto)) return [];
    seen.add(dto);
    const out: string[] = [];
    const metas = getMetadataStorage().getTargetValidationMetadatas(dto, '', true, false);
    for (const prop of new Set(metas.map((m) => m.propertyName))) {
      if (/^ids?$|Ids?$/.test(prop)) out.push(prefix + prop);
      const nested = defaultMetadataStorage.findTypeMetadata(dto, prop)?.typeFunction() as
        Type | undefined;
      if (nested) out.push(...bodyIdFields(nested, `${prefix}${prop}[].`, seen));
    }
    return out;
  };

  const bodyRoutes = () => {
    const out: { key: string; fields: string[] }[] = [];
    for (const { metatype } of app.get(DiscoveryService).getControllers()) {
      if (!metatype) continue;
      const controller = metatype as Type;
      const proto = controller.prototype as Record<string, unknown>;
      for (const route of routes().filter((r) => r.controller === controller.name)) {
        if (route.verb === 'get') continue;
        const types = Reflect.getMetadata('design:paramtypes', proto, route.handler) as Type[];
        const args = (Reflect.getMetadata(ROUTE_ARGS_METADATA, controller, route.handler) ??
          {}) as Record<string, { index: number }>;
        const body = Object.entries(args).find(
          ([k]) => Number(k.split(':')[0]) === RouteParamtypes.BODY,
        );
        const fields = body ? bodyIdFields(types?.[body[1].index]) : [];
        if (fields.length) out.push({ key: `${route.verb.toUpperCase()} ${route.path}`, fields });
      }
    }
    return out;
  };

  // SG-01 · R1
  interface BodyCase {
    url: () => string;
    body: (ids: Ids) => object;
    as?: () => string;
    rejected?: (res: request.Response) => boolean;
  }
  type Ids = Record<
    'dept' | 'hm' | 'interviewer' | 'app' | 'stage' | 'criterion' | 'requirement',
    string
  >;
  const idsA = (): Ids => ({
    dept: a.dept,
    hm: a.hm,
    interviewer: a.interviewer,
    app: a.app,
    stage: a.stage,
    criterion: a.criterion,
    requirement: a.requirement,
  });
  const idsB = (): Ids => ({
    dept: b.dept,
    hm: b.hm,
    interviewer: b.interviewer,
    app: b.bulkApp,
    stage: b.stage,
    criterion: b.criterion,
    requirement: b.requirement,
  });
  const soon = () =>
    new Date(Date.now() + 3 * 86_400_000 + Math.random() * 86_400_000).toISOString();
  const bodyCases: Record<string, BodyCase> = {
    'POST /jobs': {
      url: () => '/jobs',
      body: (ids) => ({
        title: `Sweep ${run}`,
        departmentId: ids.dept,
        location: 'HN',
        jdText: 'Mô tả công việc cho bước quét SG-01, đủ dài để qua kiểm tra độ dài tối thiểu.',
      }),
    },
    'PATCH /jobs/:id': {
      url: () => `/jobs/${b.emptyJob}`,
      body: (ids) => ({ departmentId: ids.dept }),
    },
    'PATCH /jobs/:id/hiring-manager': {
      url: () => `/jobs/${b.job}/hiring-manager`,
      body: (ids) => ({ userId: ids.hm }),
    },
    'PUT /jobs/:id/interview-stages': {
      url: () => `/jobs/${b.job}/interview-stages`,
      body: (ids) => ({
        stages: [
          { id: ids.stage, name: 'Vòng 1', criteria: [{ id: ids.criterion, label: 'API' }] },
        ],
      }),
    },
    'POST /applications/bulk-status': {
      url: () => '/applications/bulk-status',
      body: (ids) => ({
        ids: [ids.app],
        status: 'REJECTED',
        reasonCode: 'SKILL_GAP',
        reason: 'quét',
      }),
      rejected: (res) => res.body.data.succeeded.length === 0,
    },
    'POST /users': {
      url: () => '/users',
      body: (ids) => ({
        email: `sweep-${randomUUID().slice(0, 8)}@example.com`,
        password,
        fullName: 'Sweep HM',
        role: Role.HiringManager,
        departmentId: ids.dept,
      }),
    },
    'PATCH /users/:id': {
      url: () => `/users/${b.hm}`,
      body: (ids) => ({ departmentId: ids.dept }),
    },
    'PATCH /interviews/:id': {
      url: () => `/interviews/${b.futureInterview}`,
      body: (ids) => ({ interviewerIds: [ids.interviewer], scheduledAt: soon() }),
    },
    'PUT /interviews/:id/feedback': {
      url: () => `/interviews/${b.pastInterview}/feedback`,
      as: () => tokenIvB,
      body: (ids) => ({
        overall: 4,
        recommendation: 'YES',
        ratings: [{ requirementId: ids.requirement, score: 4 }],
      }),
    },
    'POST /applications/:applicationId/interviews': {
      url: () => `/applications/${b.app}/interviews`,
      body: (ids) => ({
        scheduledAt: soon(),
        durationMinutes: 30,
        location: 'Phòng B',
        interviewerIds: [ids.interviewer],
        stageId: ids.stage,
      }),
    },
  };

  const onIdField = (res: request.Response, fields: string[]) => {
    const names = fields.map((f) => f.split('[].')[0]);
    const errors = (res.body as { errors?: { field?: string }[] }).errors ?? [];
    return errors.some((e) => names.some((n) => e.field?.split('.')[0] === n));
  };

  it('every route taking ids in the body refuses ids of another organization (SG-01 sweep)', async () => {
    const found = bodyRoutes();
    const uncovered = found.map((r) => r.key).filter((k) => !bodyCases[k]);
    const leaks: string[] = [];
    const brokenControls: string[] = [];
    for (const { key, fields } of found) {
      const c = bodyCases[key];
      if (!c) continue;
      const verb = key.split(' ')[0].toLowerCase() as 'post' | 'put' | 'patch';
      const send = (ids: Ids) =>
        request(server())
          [verb](`/api/v1${c.url()}`)
          .set('Authorization', `Bearer ${c.as?.() ?? tokenB}`)
          .send(c.body(ids));
      const attack = await send(idsA());
      const refused = c.rejected
        ? attack.status === 200 && c.rejected(attack)
        : attack.status === 404 || (attack.status === 400 && onIdField(attack, fields));
      if (!refused)
        leaks.push(`${key} → ${attack.status} ${JSON.stringify(attack.body).slice(0, 160)}`);
      const control = await send(idsB());
      const ok = control.status < 300 && (!c.rejected || !c.rejected(control));
      if (!ok)
        brokenControls.push(
          `${key} → ${control.status} ${JSON.stringify(control.body).slice(0, 160)}`,
        );
    }
    expect(found.length).toBeGreaterThanOrEqual(10);
    expect(uncovered).toEqual([]);
    expect(leaks).toEqual([]);
    expect(brokenControls).toEqual([]);
  });

  // SG-01 · R1
  it('transition() cannot move an application of another organization even if called directly', async () => {
    const service = app.get(ApplicationsService) as unknown as {
      transition: (id: string, to: ApplicationStatus, why: object, user: object) => Promise<void>;
    };
    const userB = { id: b.admin, role: Role.Admin, departmentId: null, organizationId: orgB };
    await expect(
      service.transition(a.app2, ApplicationStatus.Screening, {}, userB),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect((await ds.getRepository(Application).findOneByOrFail({ id: a.app2 })).status).toBe(
      ApplicationStatus.Interview,
    );
  });

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
      ApplicationOffersController: { applicationId: a.app },
      OffersController: { id: a.offer },
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
      // SG-02 · R2, ADR-0002
      const allowed = route.verb === 'get' ? [404] : [400, 404];
      const permissionDenied = res.status === 403 && res.body?.code === 'FORBIDDEN';
      if (!allowed.includes(res.status) && !permissionDenied) {
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

  // SG-01 · R1, ADR-0002
  it('bulk-status treats ids of another organization as not found and writes nothing', async () => {
    const res = await asB(request(server()).post('/api/v1/applications/bulk-status'))
      .send({ ids: [a.app, a.app2], status: 'REJECTED', reasonCode: 'SKILL_GAP', reason: 'x' })
      .expect(200);
    const missing = randomUUID();
    const ghost = await asB(request(server()).post('/api/v1/applications/bulk-status'))
      .send({ ids: [missing], status: 'REJECTED', reasonCode: 'SKILL_GAP', reason: 'x' })
      .expect(200);
    expect(res.body.data.succeeded).toEqual([]);
    expect(res.body.data.failed).toEqual(
      [a.app, a.app2].sort().map((id) => ({ id, code: 'NOT_FOUND' })),
    );
    expect(ghost.body.data.failed).toEqual([{ id: missing, code: 'NOT_FOUND' }]);
    const apps = await ds.getRepository(Application).findBy({ id: In([a.app, a.app2]) });
    expect(apps.map((x) => x.status)).toEqual([
      ApplicationStatus.Interview,
      ApplicationStatus.Interview,
    ]);
    expect(
      await ds.getRepository(AuditLog).countBy({
        action: AuditAction.ApplicationStatusChanged,
        entityId: In([a.app, a.app2]),
      }),
    ).toBe(0);
  });

  // SG-02 · R2, ADR-0002
  it('writes on an application of another organization look exactly like a missing id', async () => {
    const calls: [string, string, object][] = [
      ['patch', 'status', { status: 'SCREENING' }],
      ['post', 'notes', { content: 'x' }],
      ['post', 'rescore', {}],
    ];
    for (const [verb, action, body] of calls) {
      const send = (id: string) =>
        asB(
          request(server())[verb as 'patch' | 'post'](`/api/v1/applications/${id}/${action}`),
        ).send(body);
      const foreign = await send(a.app);
      const missing = await send(randomUUID());
      expect([action, foreign.status, foreign.body.code]).toEqual([action, 404, 'NOT_FOUND']);
      expect(foreign.body.message).toBe(missing.body.message);
    }
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
