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
import { CvProfile } from '../src/modules/ai/entities/cv-profile.entity.js';
import { CvFile } from '../src/modules/files/entities/cv-file.entity.js';
import { RequirementType } from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { JobMatch } from '../src/modules/matching/entities/job-match.entity.js';
import { CV_CHUNK_DIMENSION, CvChunk } from '../src/modules/rag/entities/cv-chunk.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// BE-12 · API Contract 4.11 · US-14, US-16 · BR-CAND-01 → 03, BR-DATA-03
describe('Candidates (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    admin: `c-admin-${run}@example.com`,
    hr: `c-hr-${run}@example.com`,
    hmA: `c-hma-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const ids = { depA: '', depB: '', jobA: '', jobB: '', tung: '', dao: '', quan: '', cv: '' };

  const server = () => app.getHttpServer();
  const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);
  const list = (who: Who, query: string) =>
    as(who, request(server()).get(`/api/v1/candidates?${query}`));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const [depA, depB] = await ds.getRepository(Department).save([
      { name: `Cand A ${run}`, code: `CA_${run}`.toUpperCase() },
      { name: `Cand B ${run}`, code: `CB_${run}`.toUpperCase() },
    ]);
    const passwordHash = await bcrypt.hash(password, 4);
    const [, hr] = await ds.getRepository(User).save([
      { email: emails.admin, fullName: 'C Admin', role: Role.Admin, passwordHash },
      { email: emails.hr, fullName: 'C HR', role: Role.Hr, passwordHash },
      {
        email: emails.hmA,
        fullName: 'C HM',
        role: Role.HiringManager,
        departmentId: depA.id,
        passwordHash,
      },
    ]);
    const job = (departmentId: string, title: string) => ({
      title,
      departmentId,
      status: JobStatus.Open,
      location: 'Hà Nội',
      jdText: 'JD',
      createdBy: hr.id,
      publishedAt: new Date(),
    });
    const [jobA, jobB] = await ds
      .getRepository(Job)
      .save([job(depA.id, `Job A ${run}`), job(depB.id, `Job B ${run}`)]);

    const candidates = ds.getRepository(Candidate);
    const save = (fullName: string, n: number) =>
      candidates.save({
        fullName: `${fullName} ${run}`,
        email: `cand${n}-${run}@example.com`,
        phone: '0912345678',
        consentAt: new Date(),
        consentVersion: 'v1',
      });
    const tung = await save('Nguyễn Văn Tùng', 1);
    const dao = await save('Trần Thị Đào', 2);
    const quan = await save('Lê Minh Quân', 3);
    const cv = await ds.getRepository(CvFile).save({
      candidateId: quan.id,
      storageKey: `cv/test/${run}.pdf`,
      originalName: 'cv.pdf',
      mime: 'application/pdf',
      sizeBytes: 1000,
      sha256: 'a'.repeat(64),
      text: 'Lê Minh Quân – 3 năm NestJS',
    });
    await ds.getRepository(Application).save([
      { jobId: jobA.id, candidateId: tung.id, status: ApplicationStatus.New },
      { jobId: jobB.id, candidateId: dao.id, status: ApplicationStatus.Screening },
      {
        jobId: jobA.id,
        candidateId: quan.id,
        cvFileId: cv.id,
        status: ApplicationStatus.Interview,
        aiStatus: AiStatus.Done,
        score: 80,
        scoreBreakdown: [
          {
            requirementId: randomUUID(),
            match: 1,
            evidence: '3 năm NestJS',
            rejectedEvidence: null,
          },
        ],
      },
      { jobId: jobB.id, candidateId: quan.id, cvFileId: cv.id, status: ApplicationStatus.Offer },
    ]);
    await ds.getRepository(CvProfile).save({
      cvFileId: cv.id,
      data: {
        skills: [{ name: 'NestJS', years: 3, evidence: '3 năm NestJS' }],
        experiences: [],
        education: [],
        summary: '',
      },
      model: 'fake',
      promptVersion: 'test',
      inputTokens: 0,
      outputTokens: 0,
    });
    await ds.query(
      `INSERT INTO cv_chunks (cv_file_id, section, position, content, token_count, embedding_model, embedding)
       VALUES ($1, 'skills', 0, '3 năm NestJS', 4, 'fake', $2::vector)`,
      [cv.id, `[${Array.from({ length: CV_CHUNK_DIMENSION }, () => 0.01).join(',')}]`],
    );
    await ds.getRepository(JobMatch).save({
      jobId: jobB.id,
      candidateId: quan.id,
      cvFileId: cv.id,
      jdVersion: 1,
      score: 80,
      scoreBreakdown: [
        {
          requirementId: randomUUID(),
          label: 'NestJS',
          type: RequirementType.Must,
          match: 1,
          evidence: '3 năm NestJS',
        },
      ],
      lastAppliedAt: new Date(),
    });
    Object.assign(ids, {
      depA: depA.id,
      depB: depB.id,
      jobA: jobA.id,
      jobB: jobB.id,
      tung: tung.id,
      dao: dao.id,
      quan: quan.id,
      cv: cv.id,
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
    const candidateIds = [ids.tung, ids.dao, ids.quan];
    await ds.getRepository(Application).delete({ candidateId: In(candidateIds) });
    await ds.getRepository(CvFile).delete({ candidateId: In(candidateIds) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(Job).delete({ id: In([ids.jobA, ids.jobB]) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: In([ids.depA, ids.depB]) });
    await app.close();
  });

  describe('list with cursor', () => {
    it('pages without gaps or duplicates, newest first', async () => {
      const first = await list('hr', `search=${run}&limit=2`).expect(200);
      expect(first.body.meta).toMatchObject({ limit: 2, hasNextPage: true });
      expect(first.body.meta.nextCursor).toEqual(expect.any(String));

      const second = await list(
        'hr',
        `search=${run}&limit=2&cursor=${first.body.meta.nextCursor}`,
      ).expect(200);
      expect(second.body.meta).toEqual({ limit: 2, nextCursor: null, hasNextPage: false });

      const all = [...first.body.data, ...second.body.data].map((c: { id: string }) => c.id);
      expect(all).toEqual([ids.quan, ids.dao, ids.tung]);
    });

    it('rejects a forged cursor and a limit above 100', async () => {
      const bad = await list('hr', 'cursor=abc').expect(400);
      expect(bad.body.errors).toEqual([expect.objectContaining({ field: 'cursor' })]);
      await list('hr', 'limit=101').expect(400);
    });

    it('searches name without accents and email (US-14)', async () => {
      const byName = await list('hr', `search=${encodeURIComponent(`TUNG ${run}`)}`).expect(200);
      expect(byName.body.data.map((c: { id: string }) => c.id)).toEqual([ids.tung]);
      const accented = await list('hr', `search=${encodeURIComponent(`đào ${run}`)}`).expect(200);
      expect(accented.body.data.map((c: { id: string }) => c.id)).toEqual([ids.dao]);
      const byEmail = await list('hr', `search=cand3-${run}`).expect(200);
      expect(byEmail.body.data.map((c: { id: string }) => c.id)).toEqual([ids.quan]);
    });

    it('treats % and _ in the search as plain text', async () => {
      const res = await list('hr', `search=${encodeURIComponent(`%${run}`)}`).expect(200);
      expect(res.body.data).toEqual([]);
    });

    it('counts applications and the last application date', async () => {
      const res = await list('hr', `search=cand3-${run}`).expect(200);
      expect(res.body.data[0]).toMatchObject({ applicationCount: 2, anonymizedAt: null });
      expect(res.body.data[0].lastAppliedAt).toEqual(expect.any(String));
    });
  });

  describe('scope for a hiring manager (BR-CAND-03)', () => {
    it('lists only candidates who applied to their department, counting only those applications', async () => {
      const res = await list('hmA', `search=${run}`).expect(200);
      expect(res.body.data.map((c: { id: string }) => c.id)).toEqual([ids.quan, ids.tung]);
      expect(res.body.data[0].applicationCount).toBe(1);
    });

    it('a candidate outside the scope is 404; inside, only in-scope applications', async () => {
      await as('hmA', request(server()).get(`/api/v1/candidates/${ids.dao}`)).expect(404);
      const res = await as('hmA', request(server()).get(`/api/v1/candidates/${ids.quan}`)).expect(
        200,
      );
      expect(res.body.data.applications).toEqual([
        expect.objectContaining({
          job: { id: ids.jobA, title: `Job A ${run}` },
          status: 'INTERVIEW',
          score: 80,
        }),
      ]);
    });

    it('HR sees every application of the candidate', async () => {
      const res = await as('hr', request(server()).get(`/api/v1/candidates/${ids.quan}`)).expect(
        200,
      );
      expect(res.body.data.applications).toHaveLength(2);
      expect(res.body.data.applications[0]).toEqual(
        expect.objectContaining({ source: 'PUBLIC_FORM', job: expect.any(Object) }),
      );
    });
  });

  describe('update contact (BR-CAND-01)', () => {
    it('HR updates name and clears the phone; email cannot be changed', async () => {
      const res = await as('hr', request(server()).patch(`/api/v1/candidates/${ids.tung}`))
        .send({ fullName: `Nguyễn Văn Tùng (sửa) ${run}`, phone: null })
        .expect(200);
      expect(res.body.data).toMatchObject({
        fullName: `Nguyễn Văn Tùng (sửa) ${run}`,
        phone: null,
      });

      const email = await as('hr', request(server()).patch(`/api/v1/candidates/${ids.tung}`))
        .send({ email: 'khac@example.com' })
        .expect(400);
      expect(email.body.errors).toEqual([expect.objectContaining({ field: 'email' })]);
    });

    it('validates the phone format', async () => {
      const res = await as('hr', request(server()).patch(`/api/v1/candidates/${ids.tung}`))
        .send({ phone: '12345' })
        .expect(400);
      expect(res.body.errors).toEqual([expect.objectContaining({ field: 'phone' })]);
    });

    it('a hiring manager cannot edit candidates', async () => {
      await as('hmA', request(server()).patch(`/api/v1/candidates/${ids.tung}`))
        .send({ fullName: 'X Y' })
        .expect(403);
    });
  });

  describe('anonymize (US-16, BR-DATA-03)', () => {
    it('only Admin can anonymize', async () => {
      await as('hr', request(server()).post(`/api/v1/candidates/${ids.quan}/anonymize`)).expect(
        403,
      );
    });

    it('BR-DATA-03: removes contact, CV files, CV text, chunks, matches and evidence but keeps status, score and dashboard numbers', async () => {
      const dashboard = () =>
        as('hmA', request(server()).get('/api/v1/dashboard/summary')).expect(200);
      const before = (await dashboard()).body.data;
      const res = await as(
        'admin',
        request(server()).post(`/api/v1/candidates/${ids.quan}/anonymize`),
      ).expect(200);
      expect(res.body.data).toMatchObject({
        fullName: 'Ứng viên đã ẩn danh',
        email: `anon+${ids.quan}@invalid.local`,
        phone: null,
        anonymizedAt: expect.any(String),
      });

      expect(await ds.getRepository(CvFile).countBy({ candidateId: ids.quan })).toBe(0);
      expect(await ds.getRepository(CvProfile).countBy({ cvFileId: ids.cv })).toBe(0);
      expect(await ds.getRepository(CvChunk).countBy({ cvFileId: ids.cv })).toBe(0);
      expect(await ds.getRepository(JobMatch).countBy({ candidateId: ids.quan })).toBe(0);
      expect((await dashboard()).body.data).toEqual(before);
      const apps = await ds.getRepository(Application).find({
        where: { candidateId: ids.quan },
        order: { status: 'ASC' },
      });
      expect(apps.map((a) => [a.status, a.score, a.cvFileId, a.scoreBreakdown])).toEqual([
        ['INTERVIEW', 80, null, null],
        ['OFFER', null, null, null],
      ]);
      const saved = await ds.getRepository(Candidate).findOneByOrFail({ id: ids.quan });
      expect(saved.anonymizedBy).toEqual(expect.any(String));
    });

    it('cannot anonymize twice or edit afterwards; the candidate stays in the list', async () => {
      const again = await as(
        'admin',
        request(server()).post(`/api/v1/candidates/${ids.quan}/anonymize`),
      ).expect(409);
      expect(again.body.code).toBe('CANDIDATE_ANONYMIZED');
      const edit = await as('hr', request(server()).patch(`/api/v1/candidates/${ids.quan}`))
        .send({ fullName: 'Tên mới' })
        .expect(409);
      expect(edit.body.code).toBe('CANDIDATE_ANONYMIZED');

      const res = await list('hr', `search=${encodeURIComponent(`anon+${ids.quan}`)}`).expect(200);
      expect(res.body.data).toEqual([
        expect.objectContaining({ id: ids.quan, applicationCount: 2 }),
      ]);
    });
  });
});
