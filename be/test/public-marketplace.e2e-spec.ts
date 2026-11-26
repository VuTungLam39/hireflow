import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/common/enums/role.enum.js';
import { vnToday } from '../src/common/utils/vn-date.js';
import { makeDocx, SAMPLE_CV } from '../src/modules/ai/testing/cv-fixtures.js';
import { CompanyProfile } from '../src/modules/company/entities/company-profile.entity.js';
import { MediaFile, MediaKind } from '../src/modules/company/entities/media-file.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
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

interface Item {
  id: string;
  title: string;
  company: { name: string; slug: string; logoUrl: string | null };
}

// MVP 3 · US-22, US-23, US-24 · BR-ORG-04 · KH mục 8.1
describe('Public marketplace (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const orgA = randomUUID();
  const orgB = randomUUID();
  const slugA = `cho-lanh-${run}`;
  const slugB = `cho-duyet-${run}`;
  const jobsA: string[] = [];
  let jobB = '';
  let deptA = '';
  const logoKey = `media/${'a'.repeat(56)}${run}.png`;

  const server = () => app.getHttpServer();
  const get = (path: string) => request(server()).get(`/api/v1${path}`);
  const list = async (qs: string) =>
    (await get(`/public/jobs?limit=100&${qs}`).expect(200)).body.data as Item[];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    await ds.getRepository(Organization).insert([
      { id: orgA, name: `Chợ Lành ${run}`, slug: slugA, status: OrganizationStatus.Active },
      { id: orgB, name: `Chờ duyệt ${run}`, slug: slugB, status: OrganizationStatus.Pending },
    ]);
    const [deptRowA, deptRowB] = await ds
      .getRepository(Department)
      .save([
        withOrg({ name: `Cửa hàng ${run}`, code: `MA_${run}`.toUpperCase() }, orgA),
        withOrg({ name: `Kho ${run}`, code: `MB_${run}`.toUpperCase() }, orgB),
      ]);
    deptA = deptRowA.id;
    const [hrA, hrB] = await ds
      .getRepository(User)
      .save([
        withOrg(
          { email: `mk-a-${run}@example.com`, fullName: 'HR A', role: Role.Hr, passwordHash: 'x' },
          orgA,
        ),
        withOrg(
          { email: `mk-b-${run}@example.com`, fullName: 'HR B', role: Role.Hr, passwordHash: 'x' },
          orgB,
        ),
      ]);
    const media = await ds.getRepository(MediaFile).save(
      withOrg(
        {
          kind: MediaKind.Logo,
          storageKey: logoKey,
          mime: 'image/png',
          sizeBytes: 10,
          width: 256,
          height: 256,
          sha256: 'a'.repeat(64),
          createdBy: hrA.id,
        },
        orgA,
      ),
    );
    await ds.getRepository(CompanyProfile).insert({
      organizationId: orgA,
      name: `Chợ Lành ${run}`,
      tagline: 'Thực phẩm sạch mỗi ngày',
      about: 'Chuỗi cửa hàng thực phẩm sạch.',
      industries: ['Bán lẻ'],
      logoMediaId: media.id,
    });
    const job = (
      title: string,
      org: string,
      dept: string,
      by: string,
      location: string,
      jd: string,
    ) =>
      withOrg(
        {
          title,
          departmentId: dept,
          status: JobStatus.Open,
          location,
          jdText: jd,
          createdBy: by,
          publishedAt: new Date(),
        },
        org,
      );
    const saved = await ds
      .getRepository(Job)
      .save([
        job(`Quản lý cửa hàng ${run}`, orgA, deptA, hrA.id, 'Hà Nội', 'Vận hành cửa hàng bán lẻ.'),
        job(`Nhân viên kho ${run}`, orgA, deptA, hrA.id, 'Đà Nẵng', 'Kiểm kê và nhập hàng.'),
        job(`Thu ngân ${run}`, orgA, deptA, hrA.id, 'Hồ Chí Minh', 'Thanh toán, máy POS.'),
        job(`Giao hàng ${run}`, orgA, deptA, hrA.id, 'Hà Nội', 'Giao đơn nội thành.'),
        job(`Kế toán ${run}`, orgA, deptA, hrA.id, 'Hà Nội', 'Sổ sách và báo cáo thuế.'),
        job(`Nhân viên kho B ${run}`, orgB, deptRowB.id, hrB.id, 'Hà Nội', 'Kiểm kê.'),
      ]);
    jobsA.push(...saved.slice(0, 5).map((j) => j.id));
    jobB = saved[5].id;
    await ds.getRepository(JobRequirement).save(
      saved.map((j) => ({
        jobId: j.id,
        jdVersion: 1,
        position: 0,
        label: 'Giao tiếp',
        type: RequirementType.Must,
        weight: 1,
        keywords: ['giao tiếp'],
      })),
    );
  });

  afterAll(async () => {
    await ds.getRepository(JobRequirement).delete({ jobId: In([...jobsA, jobB]) });
    await ds.getRepository(Job).delete({ organizationId: In([orgA, orgB]) });
    await ds.getRepository(CompanyProfile).delete({ organizationId: orgA });
    await ds.getRepository(MediaFile).delete({ organizationId: orgA });
    await ds.getRepository(User).delete({ organizationId: In([orgA, orgB]) });
    await ds.getRepository(Department).delete({ organizationId: In([orgA, orgB]) });
    await ds.getRepository(Organization).delete({ id: In([orgA, orgB]) });
    await app.close();
  });

  it('BR-ORG-04: only jobs of ACTIVE companies are public, each with its company', async () => {
    const items = await list(`search=${run}`);
    expect(items.map((i) => i.id).sort()).toEqual([...jobsA].sort());
    expect(items[0].company).toEqual({
      name: `Chợ Lành ${run}`,
      slug: slugA,
      logoUrl: `/public/${logoKey}`,
      tagline: 'Thực phẩm sạch mỗi ngày',
    });
    await get(`/public/jobs/${jobB}`).expect(404);
    await request(server())
      .post(`/api/v1/public/jobs/${jobB}/apply`)
      .field('fullName', 'Ứng viên Thử')
      .field('email', `mk-cand-${run}@example.com`)
      .field('phone', '0912345678')
      .field('consent', 'true')
      .attach('cv', await makeDocx(SAMPLE_CV), {
        filename: 'cv.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      .expect(404);
  });

  it('US-22: filters by company and location, and searches the JD and location without marks', async () => {
    expect(await list(`company=${slugB}`)).toEqual([]);
    expect((await list(`company=${slugA}`)).length).toBe(5);
    const hanoi = await list(`company=${slugA}&location=ha%20noi`);
    expect(hanoi.map((i) => i.title).sort()).toEqual(
      [`Giao hàng ${run}`, `Kế toán ${run}`, `Quản lý cửa hàng ${run}`].sort(),
    );
    const byJd = await list(`company=${slugA}&search=may%20pos`);
    expect(byJd.map((i) => i.title)).toEqual([`Thu ngân ${run}`]);
    const byLocation = await list(`company=${slugA}&search=da%20nang`);
    expect(byLocation.map((i) => i.title)).toEqual([`Nhân viên kho ${run}`]);
    await get('/public/jobs?company=Not_A_Slug').expect(400);
  });

  it('KH 8.1: departments are listed per company only', async () => {
    expect((await get('/public/jobs/departments').expect(200)).body.data).toEqual([]);
    const res = await get(`/public/jobs/departments?company=${slugA}`).expect(200);
    expect(res.body.data).toEqual([{ id: deptA, name: `Cửa hàng ${run}`, count: 5 }]);
  });

  it('US-24: a job shows its company and up to 4 other open jobs of that company', async () => {
    const res = await get(`/public/jobs/${jobsA[0]}`).expect(200);
    expect(res.body.data.company).toMatchObject({
      slug: slugA,
      tagline: 'Thực phẩm sạch mỗi ngày',
    });
    const others = res.body.data.otherJobs as Item[];
    expect(others).toHaveLength(4);
    expect(others.map((o) => o.id)).not.toContain(jobsA[0]);
    expect(others.every((o) => o.company.slug === slugA)).toBe(true);
  });

  describe('DL-17: the detail page of an ended job stays 30 days', () => {
    const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
    const { Open, Closed, Draft } = JobStatus;
    let id = '';

    beforeAll(async () => {
      const { createdBy } = await ds.getRepository(Job).findOneByOrFail({ id: jobsA[0] });
      const saved = await ds.getRepository(Job).save(
        withOrg(
          {
            title: `Tin DL17 ${run}`,
            departmentId: deptA,
            status: Draft,
            location: 'Hà Nội',
            jdText: 'Tin thử.',
            createdBy,
            publishedAt: new Date(),
          },
          orgA,
        ),
      );
      id = saved.id;
    });

    afterAll(async () => {
      await ds.getRepository(Job).delete({ id });
    });

    const set = (status: JobStatus, deadlineAgo: number | null, closedAgo: number | null) =>
      ds.getRepository(Job).update(id, {
        status,
        deadline: deadlineAgo === null ? null : vnToday(daysAgo(deadlineAgo)),
        closedAt: closedAgo === null ? null : daysAgo(closedAgo),
      });

    it.each([
      ['OPEN, deadline yesterday', Open, 1, null, 200],
      ['OPEN, deadline 31 days ago', Open, 31, null, 404],
      ['CLOSED yesterday', Closed, null, 1, 200],
      ['CLOSED 31 days ago', Closed, null, 31, 404],
      ['CLOSED without closed_at or deadline', Closed, null, null, 404],
      ['CLOSED without closed_at, deadline yesterday', Closed, 1, null, 200],
      ['CLOSED yesterday, deadline 40 days ago', Closed, 40, 1, 404],
      ['DRAFT, deadline yesterday', Draft, 1, null, 404],
    ])('%s', async (_name, status, deadlineAgo, closedAgo, code) => {
      await set(status, deadlineAgo, closedAgo);
      const res = await get(`/public/jobs/${id}`).expect(code);
      if (code === 200) expect(res.body.data.expired).toBe(true);
      else expect(res.body.code).toBe('NOT_FOUND');
      expect((await list(`company=${slugA}`)).map((j) => j.id)).not.toContain(id);
    });

    it('the window only widens reading: no apply, nothing once the company is suspended', async () => {
      await set(Closed, null, 1);
      await request(server())
        .post(`/api/v1/public/jobs/${id}/apply`)
        .field('fullName', 'Ứng viên Thử')
        .field('email', `dl17-${run}@example.com`)
        .field('phone', '0912345678')
        .field('consent', 'true')
        .attach('cv', await makeDocx(SAMPLE_CV), {
          filename: 'cv.docx',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })
        .expect(404);
      const orgs = ds.getRepository(Organization);
      await orgs.update(orgA, { status: OrganizationStatus.Suspended });
      try {
        await get(`/public/jobs/${id}`).expect(404);
      } finally {
        await orgs.update(orgA, { status: OrganizationStatus.Active });
      }
    });
  });

  it('US-23: the directory lists ACTIVE companies with a complete page; a company page has its jobs', async () => {
    const dir = await get(
      `/public/companies?search=${encodeURIComponent(`cho lanh ${run}`)}`,
    ).expect(200);
    expect(dir.body.data).toEqual([
      {
        slug: slugA,
        name: `Chợ Lành ${run}`,
        tagline: 'Thực phẩm sạch mỗi ngày',
        industries: ['Bán lẻ'],
        logoUrl: `/public/${logoKey}`,
        openJobs: 5,
      },
    ]);
    expect(
      (await get(`/public/companies?search=${encodeURIComponent(`cho duyet ${run}`)}`)).body.data,
    ).toEqual([]);

    const page = await get(`/public/companies/${slugA}`).expect(200);
    expect(page.body.data).toMatchObject({ slug: slugA, name: `Chợ Lành ${run}`, openJobs: 5 });
    expect(page.body.data.jobs).toHaveLength(5);
    await get(`/public/companies/${slugB}`).expect(404);
    await get(`/public/companies/khong-ton-tai-${run}`).expect(404);
  });
});
