import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AiStatus } from '../src/common/enums/ai-status.enum.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { ScoreFlag } from '../src/common/enums/score-flag.enum.js';
import { ApplicationNote } from '../src/modules/applications/entities/application-note.entity.js';
import { ApplicationStatusHistory } from '../src/modules/applications/entities/application-status-history.entity.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { CvFile } from '../src/modules/files/entities/cv-file.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// BE-13 · API Contract 4.5 · US-04, 06, 07, 09, 15 · BR-STS-01 → 07, BR-APP-03, 08 → 10
describe('Applications (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    hr: `a-hr-${run}@example.com`,
    hmA: `a-hma-${run}@example.com`,
    hmB: `a-hmb-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const ids = {
    depA: '',
    depB: '',
    jobA: '',
    jobB: '',
    jobClosed: '',
    reqA: '',
    a1: '',
    a2: '',
    a3: '',
    c1: '',
    c2: '',
    c3: '',
    cv1: '',
  };
  const extraCandidates: string[] = [];

  const server = () => app.getHttpServer();
  const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);
  const list = (who: Who, query = '') =>
    as(who, request(server()).get(`/api/v1/applications?search=${run}${query}`));
  const idsOf = (res: request.Response) => res.body.data.map((a: { id: string }) => a.id);
  const pdf = (text = `CV ${run}`) => Buffer.from(`%PDF-1.7\n${text}`);
  const upload = (
    who: Who,
    jobId: string,
    fields: Record<string, string>,
    file?: { content: Buffer; type: string },
  ) => {
    const req = as(who, request(server()).post(`/api/v1/jobs/${jobId}/applications`));
    for (const [k, v] of Object.entries(fields)) req.field(k, v);
    if (file) req.attach('cv', file.content, { filename: 'cv.pdf', contentType: file.type });
    return req;
  };
  const vn = (iso: string) => new Date(`${iso}+07:00`);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const [depA, depB] = await ds.getRepository(Department).save([
      { name: `App A ${run}`, code: `AA_${run}`.toUpperCase() },
      { name: `App B ${run}`, code: `AB_${run}`.toUpperCase() },
    ]);
    const passwordHash = await bcrypt.hash(password, 4);
    const [hr] = await ds.getRepository(User).save([
      { email: emails.hr, fullName: 'A HR', role: Role.Hr, passwordHash },
      {
        email: emails.hmA,
        fullName: 'Trưởng phòng A',
        role: Role.HiringManager,
        departmentId: depA.id,
        passwordHash,
      },
      {
        email: emails.hmB,
        fullName: 'Trưởng phòng B',
        role: Role.HiringManager,
        departmentId: depB.id,
        passwordHash,
      },
    ]);
    const job = (departmentId: string, title: string, status = JobStatus.Open) => ({
      title,
      departmentId,
      status,
      location: 'Hà Nội',
      jdText: 'JD',
      jdVersion: 2,
      createdBy: hr.id,
      publishedAt: new Date(),
      closedAt: status === JobStatus.Closed ? new Date() : null,
    });
    const [jobA, jobB, jobClosed] = await ds
      .getRepository(Job)
      .save([
        job(depA.id, `Job A ${run}`),
        job(depB.id, `Job B ${run}`),
        job(depA.id, `Job đóng ${run}`, JobStatus.Closed),
      ]);
    const [reqA] = await ds.getRepository(JobRequirement).save([
      {
        jobId: jobA.id,
        jdVersion: 2,
        position: 1,
        label: 'NestJS',
        type: RequirementType.Must,
        weight: 3,
        minYears: 2,
        keywords: ['nestjs'],
      },
    ]);

    const [c1, c2, c3] = await ds.getRepository(Candidate).save(
      ['Phạm Văn Một', 'Lê Thị Hai', 'Ngô Ba'].map((name, i) => ({
        fullName: `${name} ${run}`,
        email: `a-c${i + 1}-${run}@example.com`,
        consentAt: new Date(),
        consentVersion: 'v1',
      })),
    );
    const cv1 = await ds.getRepository(CvFile).save({
      candidateId: c1.id,
      storageKey: `cv/test/${run}-c1.pdf`,
      originalName: 'CV_Mot.pdf',
      mime: 'application/pdf',
      sizeBytes: 100,
      sha256: 'b'.repeat(64),
      text: 'Phạm Văn Một – 3 năm NestJS',
    });
    const [a1, a2, a3] = await ds.getRepository(Application).save([
      {
        jobId: jobA.id,
        candidateId: c1.id,
        cvFileId: cv1.id,
        status: ApplicationStatus.New,
        aiStatus: AiStatus.Done,
        score: 80,
        flags: [ScoreFlag.MissingMust],
        scoredJdVersion: 2,
        scoreBreakdown: [
          { requirementId: reqA.id, match: 1, evidence: '3 năm NestJS', rejectedEvidence: null },
        ],
        createdAt: vn('2026-10-01T00:30:00'),
      },
      {
        jobId: jobA.id,
        candidateId: c2.id,
        status: ApplicationStatus.Offer,
        aiStatus: AiStatus.Done,
        score: 40,
        scoreBreakdown: [],
        createdAt: vn('2026-10-05T12:00:00'),
      },
      {
        jobId: jobB.id,
        candidateId: c3.id,
        status: ApplicationStatus.Screening,
        createdAt: vn('2026-10-10T23:59:00'),
      },
    ]);
    Object.assign(ids, {
      depA: depA.id,
      depB: depB.id,
      jobA: jobA.id,
      jobB: jobB.id,
      jobClosed: jobClosed.id,
      reqA: reqA.id,
      a1: a1.id,
      a2: a2.id,
      a3: a3.id,
      c1: c1.id,
      c2: c2.id,
      c3: c3.id,
      cv1: cv1.id,
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
    const jobIds = [ids.jobA, ids.jobB, ids.jobClosed];
    const candidateIds = [ids.c1, ids.c2, ids.c3, ...extraCandidates];
    const files = await ds.getRepository(CvFile).findBy({ candidateId: In(candidateIds) });
    for (const f of files) await rm(join(process.cwd(), 'storage', f.storageKey), { force: true });
    await ds.getRepository(Application).delete({ jobId: In(jobIds) });
    await ds.getRepository(CvFile).delete({ candidateId: In(candidateIds) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(Job).delete({ id: In(jobIds) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: In([ids.depA, ids.depB]) });
    await app.close();
  });

  describe('list (US-06)', () => {
    it('returns list items with candidate and job; HM sees only their department', async () => {
      const res = await list('hr').expect(200);
      expect(res.body.meta).toMatchObject({ page: 1, totalItems: 3 });
      expect(res.body.data[0]).toEqual({
        id: expect.any(String),
        status: expect.any(String),
        aiStatus: expect.any(String),
        score: expect.toBeOneOf([expect.any(Number), null]),
        flags: expect.any(Array),
        createdAt: expect.any(String),
        candidate: {
          id: expect.any(String),
          fullName: expect.any(String),
          email: expect.any(String),
        },
        job: { id: expect.any(String), title: expect.any(String) },
      });
      expect(idsOf(await list('hmA').expect(200)).sort()).toEqual([ids.a1, ids.a2].sort());
      expect(idsOf(await list('hmB').expect(200))).toEqual([ids.a3]);
    });

    it('sorts by score with unscored applications last in both directions', async () => {
      expect(idsOf(await list('hr', '&sortBy=score&order=DESC').expect(200))).toEqual([
        ids.a1,
        ids.a2,
        ids.a3,
      ]);
      expect(idsOf(await list('hr', '&sortBy=score&order=ASC').expect(200))).toEqual([
        ids.a2,
        ids.a1,
        ids.a3,
      ]);
    });

    it.each([
      ['&status=OFFER', ['a2']],
      ['&scoreMin=50', ['a1']],
      ['&scoreMax=50', ['a2']],
      ['&missingMust=true', ['a1']],
      ['&createdFrom=2026-10-01&createdTo=2026-10-01', ['a1']],
      ['&createdFrom=2026-10-02', ['a2', 'a3']],
      ['&createdTo=2026-10-10', ['a1', 'a2', 'a3']],
      ['&createdTo=2026-10-09', ['a1', 'a2']],
    ] as const)('filters %s', async (query, expected) => {
      const res = await list('hr', `${query}&sortBy=createdAt&order=ASC`).expect(200);
      expect(idsOf(res)).toEqual(expected.map((k) => ids[k]));
    });

    it('searches candidate names without accents', async () => {
      const res = await as(
        'hr',
        request(server()).get(
          `/api/v1/applications?search=${encodeURIComponent(`pham van mot ${run}`)}`,
        ),
      ).expect(200);
      expect(idsOf(res)).toEqual([ids.a1]);
    });

    it.each([
      'sortBy=email',
      'createdFrom=01-10-2026',
      'scoreMin=101',
      'missingMust=yes',
      'limit=101',
    ])('rejects %s', async (query) => {
      await as('hr', request(server()).get(`/api/v1/applications?${query}`)).expect(400);
    });
  });

  describe('detail (US-04)', () => {
    it('returns score, breakdown, current requirements and CV', async () => {
      const res = await as('hmA', request(server()).get(`/api/v1/applications/${ids.a1}`)).expect(
        200,
      );
      expect(res.body.data).toMatchObject({
        score: 80,
        flags: ['MISSING_MUST'],
        source: 'PUBLIC_FORM',
        scoredJdVersion: 2,
        aiError: null,
        candidate: { id: ids.c1, phone: null },
        job: { id: ids.jobA, jdVersion: 2, departmentId: ids.depA },
        requirements: [{ id: ids.reqA, label: 'NestJS', weight: 3, minYears: 2 }],
        breakdown: [{ requirementId: ids.reqA, match: 1, evidence: '3 năm NestJS' }],
        cv: { fileId: ids.cv1, fileName: 'CV_Mot.pdf', text: 'Phạm Văn Một – 3 năm NestJS' },
      });
    });

    it('is 404 outside the scope and cv is null without a file', async () => {
      await as('hmB', request(server()).get(`/api/v1/applications/${ids.a1}`)).expect(404);
      const res = await as('hr', request(server()).get(`/api/v1/applications/${ids.a3}`)).expect(
        200,
      );
      expect(res.body.data).toMatchObject({ cv: null, breakdown: [], score: null });
    });
  });

  describe('status flow (US-07)', () => {
    const change = (who: Who, id: string, body: object) =>
      as(who, request(server()).patch(`/api/v1/applications/${id}/status`)).send(body);

    it('BR-STS-01, BR-STS-06: moves one step and records history', async () => {
      const res = await change('hr', ids.a1, { status: 'SCREENING' }).expect(200);
      expect(res.body.data.status).toBe('SCREENING');
      const history = await as(
        'hr',
        request(server()).get(`/api/v1/applications/${ids.a1}/history`),
      ).expect(200);
      expect(history.body.data[0]).toMatchObject({
        fromStatus: 'NEW',
        toStatus: 'SCREENING',
        reason: null,
        changedBy: { fullName: 'A HR' },
      });
    });

    it('rejects skipping steps, HIRED via /status and rejecting without reason', async () => {
      expect((await change('hr', ids.a1, { status: 'OFFER' }).expect(409)).body.code).toBe(
        'INVALID_STATUS_TRANSITION',
      );
      expect((await change('hr', ids.a1, { status: 'HIRED' }).expect(409)).body.code).toBe(
        'INVALID_STATUS_TRANSITION',
      );
      const noReason = await change('hr', ids.a1, { status: 'REJECTED', reason: '  ' }).expect(400);
      expect(noReason.body).toMatchObject({
        code: 'REJECT_REASON_REQUIRED',
        errors: [{ field: 'reason' }],
      });
    });

    it('a hiring manager cannot change status (only approve offers)', async () => {
      await change('hmA', ids.a1, { status: 'INTERVIEW' }).expect(403);
    });

    it('two simultaneous changes: one wins, the other gets 409 (BR-STS-07)', async () => {
      const results = await Promise.all([
        change('hr', ids.a1, { status: 'INTERVIEW' }),
        change('hr', ids.a1, { status: 'INTERVIEW' }),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      const rows = await ds
        .getRepository(ApplicationStatusHistory)
        .countBy({ applicationId: ids.a1, toStatus: ApplicationStatus.Interview });
      expect(rows).toBe(1);
    });
  });

  describe('offer approval (US-09, BR-STS-04, 05)', () => {
    it('HR cannot hire; a manager of another department gets SCOPE_FORBIDDEN', async () => {
      await as('hr', request(server()).patch(`/api/v1/applications/${ids.a2}/hire`)).expect(403);
      const res = await as(
        'hmB',
        request(server()).patch(`/api/v1/applications/${ids.a2}/hire`),
      ).expect(403);
      expect(res.body.code).toBe('SCOPE_FORBIDDEN');
    });

    it('BR-STS-05: declining an offer needs a reason', async () => {
      const res = await as(
        'hmA',
        request(server()).patch(`/api/v1/applications/${ids.a2}/decline-offer`),
      )
        .send({})
        .expect(400);
      expect(res.body.code).toBe('REJECT_REASON_REQUIRED');
    });

    it('the department manager hires, once', async () => {
      const res = await as(
        'hmA',
        request(server()).patch(`/api/v1/applications/${ids.a2}/hire`),
      ).expect(200);
      expect(res.body.data.status).toBe('HIRED');
      await as('hmA', request(server()).patch(`/api/v1/applications/${ids.a2}/hire`)).expect(409);
      const history = await as(
        'hmA',
        request(server()).get(`/api/v1/applications/${ids.a2}/history`),
      ).expect(200);
      expect(history.body.data[0]).toMatchObject({
        fromStatus: 'OFFER',
        toStatus: 'HIRED',
        changedBy: { fullName: 'Trưởng phòng A' },
      });
    });

    it('BR-STS-05: decline-offer only works from OFFER', async () => {
      const res = await as(
        'hmB',
        request(server()).patch(`/api/v1/applications/${ids.a3}/decline-offer`),
      )
        .send({ reason: 'Lương' })
        .expect(409);
      expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('notes (BR-APP-09)', () => {
    it('anyone in scope adds notes; newest first', async () => {
      await as('hr', request(server()).post(`/api/v1/applications/${ids.a1}/notes`))
        .send({ content: 'Ghi chú 1' })
        .expect(201);
      const res = await as('hmA', request(server()).post(`/api/v1/applications/${ids.a1}/notes`))
        .send({ content: ' Ghi chú 2 ' })
        .expect(201);
      expect(res.body.data).toMatchObject({
        content: 'Ghi chú 2',
        author: { fullName: 'Trưởng phòng A' },
      });
      const notes = await as(
        'hr',
        request(server()).get(`/api/v1/applications/${ids.a1}/notes`),
      ).expect(200);
      expect(notes.body.data.map((n: { content: string }) => n.content)).toEqual([
        'Ghi chú 2',
        'Ghi chú 1',
      ]);
    });

    it('validates content and scope', async () => {
      await as('hr', request(server()).post(`/api/v1/applications/${ids.a1}/notes`))
        .send({ content: '   ' })
        .expect(400);
      await as('hr', request(server()).post(`/api/v1/applications/${ids.a1}/notes`))
        .send({ content: 'x'.repeat(2001) })
        .expect(400);
      const write = await as('hmB', request(server()).post(`/api/v1/applications/${ids.a1}/notes`))
        .send({ content: 'x' })
        .expect(403);
      expect(write.body.code).toBe('SCOPE_FORBIDDEN');
      await as('hmB', request(server()).get(`/api/v1/applications/${ids.a1}/notes`)).expect(404);
      expect(await ds.getRepository(ApplicationNote).countBy({ applicationId: ids.a1 })).toBe(2);
    });
  });

  it('BR-AI-08: rescore is accepted for HR (202) and forbidden for Hiring Manager', async () => {
    const res = await as('hr', request(server()).post(`/api/v1/applications/${ids.a1}/rescore`));
    expect(res.status).toBe(202);
    expect(res.body.data).toBeNull();
    await as('hmA', request(server()).post(`/api/v1/applications/${ids.a1}/rescore`)).expect(403);
  });

  describe('HR uploads a CV for a candidate (US-15, BR-APP-10)', () => {
    const email = `a-new-${run}@example.com`;
    const fields = { fullName: `Đỗ Thanh Tùng ${run}`, email, consentConfirmed: 'true' };
    const file = { content: pdf(), type: 'application/pdf' };

    it('creates a NEW application with source HR_UPLOAD and stores the file', async () => {
      const res = await upload('hr', ids.jobA, fields, file).expect(201);
      expect(res.body.data).toMatchObject({
        status: 'NEW',
        aiStatus: 'PENDING',
        source: 'HR_UPLOAD',
        score: null,
        candidate: { email, fullName: fields.fullName, phone: null },
        cv: { fileName: 'cv.pdf', text: null },
      });
      extraCandidates.push(res.body.data.candidate.id);

      const candidate = await ds.getRepository(Candidate).findOneByOrFail({ email });
      expect(candidate.consentVersion).toBe('HR_CONFIRMED');
      const cv = await ds.getRepository(CvFile).findOneByOrFail({ candidateId: candidate.id });
      expect(cv.storageKey).toMatch(/^cv\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.pdf$/);
      expect(existsSync(join(process.cwd(), 'storage', cv.storageKey))).toBe(true);

      const history = await as(
        'hr',
        request(server()).get(`/api/v1/applications/${res.body.data.id}/history`),
      ).expect(200);
      expect(history.body.data).toEqual([
        expect.objectContaining({
          fromStatus: null,
          toStatus: 'NEW',
          changedBy: expect.objectContaining({ fullName: 'A HR' }),
        }),
      ]);
    });

    it('blocks a second application to the same job (BR-APP-03)', async () => {
      const res = await upload('hr', ids.jobA, fields, file).expect(409);
      expect(res.body.code).toBe('APPLICATION_DUPLICATED');
    });

    it('another job: reuses the same CV and keeps the existing name, fills an empty phone (BR-CAND-02, BR-FILE-02)', async () => {
      const res = await upload(
        'hr',
        ids.jobB,
        { ...fields, fullName: 'Tên Khác', phone: '0987654321' },
        file,
      ).expect(201);
      expect(res.body.data.candidate).toMatchObject({
        fullName: fields.fullName,
        phone: '0987654321',
      });
      const candidate = await ds.getRepository(Candidate).findOneByOrFail({ email });
      expect(await ds.getRepository(CvFile).countBy({ candidateId: candidate.id })).toBe(1);
    });

    it.each([
      [
        'a closed job',
        () => upload('hr', ids.jobClosed, { ...fields, email: `x1-${run}@example.com` }, file),
        409,
        'JOB_NOT_OPEN',
      ],
      [
        'a fake PDF',
        () =>
          upload(
            'hr',
            ids.jobA,
            { ...fields, email: `x2-${run}@example.com` },
            { content: Buffer.from('MZ fake'), type: 'application/pdf' },
          ),
        400,
        'FILE_TYPE_NOT_ALLOWED',
      ],
      [
        'no consent',
        () =>
          upload(
            'hr',
            ids.jobA,
            { ...fields, email: `x3-${run}@example.com`, consentConfirmed: 'false' },
            file,
          ),
        400,
        'VALIDATION_FAILED',
      ],
      [
        'no file',
        () => upload('hr', ids.jobA, { ...fields, email: `x4-${run}@example.com` }),
        400,
        'VALIDATION_FAILED',
      ],
      [
        'a file over 5MB',
        () =>
          upload(
            'hr',
            ids.jobA,
            { ...fields, email: `x5-${run}@example.com` },
            {
              content: Buffer.concat([pdf(), Buffer.alloc(5 * 1024 * 1024)]),
              type: 'application/pdf',
            },
          ),
        413,
        'FILE_TOO_LARGE',
      ],
      [
        'a hiring manager',
        () => upload('hmA', ids.jobA, { ...fields, email: `x6-${run}@example.com` }, file),
        403,
        'FORBIDDEN',
      ],
    ] as const)('rejects %s', async (_name, send, status, code) => {
      const res = await send().expect(status);
      expect(res.body.code).toBe(code);
    });

    it('does not create candidates for rejected uploads', async () => {
      const leaked = await ds
        .getRepository(Candidate)
        .countBy({ email: In([1, 2, 3, 4, 5, 6].map((n) => `x${n}-${run}@example.com`)) });
      expect(leaked).toBe(0);
    });
  });
});
