import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ApplicationSource } from '../src/common/enums/application-source.enum.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { AuditLog } from '../src/modules/audit/entities/audit-log.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// Giới hạn nhỏ để kiểm được cả nhánh vượt giới hạn và nhánh đọc nhiều lô với ít dữ liệu
vi.mock('../src/modules/applications/application-export.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/applications/application-export.js')>()),
  EXPORT_MAX_ROWS: 3,
  EXPORT_BATCH: 2,
}));

// E6 · BR-APP-11 · BR-ACC-07
describe('Applications CSV export (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    hr: `x-hr-${run}@example.com`,
    hmA: `x-hma-${run}@example.com`,
    interviewer: `x-iv-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const ids = { depA: '', depB: '', jobA: '', jobB: '', hr: '' };
  const candidateIds: string[] = [];

  const server = () => app.getHttpServer();
  const exportAs = (who: Who, query = '') =>
    request(server())
      .get(`/api/v1/applications/export?search=${run}${query}`)
      .set('Authorization', `Bearer ${tokens[who]}`)
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => done(null, Buffer.concat(chunks)));
      });
  const linesOf = (body: Buffer) =>
    body
      .toString('utf8')
      .replace(/^\uFEFF/, '')
      .trimEnd()
      .split('\r\n');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const [depA, depB] = await ds.getRepository(Department).save([
      { name: `Xuất A ${run}`, code: `XA_${run}`.toUpperCase() },
      { name: `Xuất B ${run}`, code: `XB_${run}`.toUpperCase() },
    ]);
    const passwordHash = await bcrypt.hash(password, 4);
    const [hr] = await ds.getRepository(User).save([
      { email: emails.hr, fullName: 'X HR', role: Role.Hr, passwordHash },
      {
        email: emails.hmA,
        fullName: 'Trưởng phòng A',
        role: Role.HiringManager,
        departmentId: depA.id,
        passwordHash,
      },
      { email: emails.interviewer, fullName: 'X PV', role: Role.Interviewer, passwordHash },
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
      .save([job(depA.id, `Backend ${run}`), job(depB.id, `Kế toán ${run}`)]);
    const candidates = await ds.getRepository(Candidate).save(
      [
        `Phạm Văn Một ${run}`,
        `=HYPERLINK("http://x") ${run}`,
        `Lê Thị "Ba" ${run}`,
        `Ngô Bốn ${run}`,
      ].map((fullName, i) => ({
        fullName,
        email: `x-c${i + 1}-${run}@example.com`,
        phone: i === 0 ? '0912345678' : null,
        consentAt: new Date(),
        consentVersion: 'v1',
      })),
    );
    candidateIds.push(...candidates.map((c) => c.id));
    const at = (iso: string) => new Date(`${iso}+07:00`);
    await ds.getRepository(Application).save([
      {
        jobId: jobA.id,
        candidateId: candidates[0].id,
        status: ApplicationStatus.Interview,
        score: 82,
        source: ApplicationSource.HrUpload,
        createdAt: at('2026-11-01T09:15:00'),
      },
      {
        jobId: jobA.id,
        candidateId: candidates[1].id,
        status: ApplicationStatus.New,
        createdAt: at('2026-11-02T10:00:00'),
      },
      {
        jobId: jobA.id,
        candidateId: candidates[2].id,
        status: ApplicationStatus.Screening,
        score: 55,
        createdAt: at('2026-11-03T11:00:00'),
      },
      {
        jobId: jobB.id,
        candidateId: candidates[3].id,
        status: ApplicationStatus.New,
        createdAt: at('2026-11-04T12:00:00'),
      },
    ]);
    Object.assign(ids, { depA: depA.id, depB: depB.id, jobA: jobA.id, jobB: jobB.id, hr: hr.id });

    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    const userIds = (await ds.getRepository(User).findBy({ email: In(Object.values(emails)) })).map(
      (u) => u.id,
    );
    await ds
      .query(`DELETE FROM audit_logs WHERE actor_id = ANY($1)`, [userIds])
      .catch(() => undefined);
    await ds.getRepository(Application).delete({ jobId: In([ids.jobA, ids.jobB]) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(Job).delete({ id: In([ids.jobA, ids.jobB]) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: In([ids.depA, ids.depB]) });
    await app.close();
  });

  it('streams a UTF-8 CSV with BOM, Vietnamese labels and the current sort, across batches', async () => {
    const res = await exportAs('hr', `&jobId=${ids.jobA}&sortBy=createdAt&order=ASC`).expect(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toMatch(
      /^attachment; filename="ho-so-ung-tuyen-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect(res.headers['x-total-count']).toBe('3');
    expect([...(res.body as Buffer).subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);

    const lines = linesOf(res.body);
    expect(lines[0]).toBe(
      '"Họ tên","Email","Số điện thoại","Vị trí","Phòng ban","Trạng thái","Điểm","Nguồn","Ngày nộp"',
    );
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBe(
      `"Phạm Văn Một ${run}","x-c1-${run}@example.com","0912 345 678","Backend ${run}","Xuất A ${run}","Phỏng vấn","82","HR tải hộ","01/11/2026 09:15"`,
    );
    // CSV injection: ô bắt đầu bằng "=" có dấu ' phía trước
    expect(lines[2]).toMatch(/^"'=HYPERLINK\(""http:\/\/x""\) /);
    expect(lines[3]).toContain(`"Lê Thị ""Ba"" ${run}"`);
  });

  it('BR-ACC-07: a Hiring Manager only exports their own department', async () => {
    const lines = linesOf((await exportAs('hmA').expect(200)).body);
    expect(lines).toHaveLength(4);
    expect(lines.slice(1).every((l) => l.includes(`"Xuất A ${run}"`))).toBe(true);
  });

  it('applies the list filters', async () => {
    const lines = linesOf((await exportAs('hr', '&status=SCREENING').expect(200)).body);
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"Sàng lọc"');
  });

  it('BR-INT-02: interviewers cannot export', async () => {
    const res = await exportAs('interviewer').expect(403);
    expect(JSON.parse(res.body.toString()).code).toBe('FORBIDDEN');
  });

  it('refuses more rows than the limit instead of cutting the file short', async () => {
    const res = await exportAs('hr').expect(400);
    expect(JSON.parse(res.body.toString()).code).toBe('EXPORT_TOO_LARGE');
  });

  it('BR-APP-11: every export is written to the audit log with filters and row count', async () => {
    await exportAs('hr', '&status=NEW').expect(200);
    const [log] = await ds.getRepository(AuditLog).find({
      where: { actorId: ids.hr, action: 'APPLICATIONS_EXPORTED' as AuditLog['action'] },
      order: { createdAt: 'DESC' },
      take: 1,
    });
    expect(log).toMatchObject({ entity: 'application', entityId: null });
    expect(log.metadata).toEqual({ rows: 2, filters: `status=NEW&search=${run}` });
  });
});
