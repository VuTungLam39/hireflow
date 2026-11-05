import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/common/enums/role.enum.js';
import { AuditLog } from '../src/modules/audit/entities/audit-log.entity.js';
import { CompanyProfile } from '../src/modules/company/entities/company-profile.entity.js';
import { MediaFile } from '../src/modules/company/entities/media-file.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// Mở rộng MVP 2 – E3 · F-ORG-01, F-PUB-06, F-FILE-03 · BR-ORG-01, 02 · BR-MEDIA-01, 02
describe('Company profile and public media (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    hr: `c-hr-${run}@example.com`,
    hm: `c-hm-${run}@example.com`,
    iv: `c-iv-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  let depId = '';
  let saved: { profiles: CompanyProfile[]; media: MediaFile[] } = { profiles: [], media: [] };

  const server = () => app.getHttpServer();
  const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);
  const put = (body: Record<string, unknown>, who: Who = 'hr') =>
    as(who, request(server()).put('/api/v1/company')).send(body);
  const upload = (kind: string, file: Buffer, name = 'anh.png', alt?: string) => {
    const req = as('hr', request(server()).post('/api/v1/company/media')).field('kind', kind);
    if (alt !== undefined) req.field('alt', alt);
    return req.attach('file', file, { filename: name, contentType: 'image/png' });
  };

  /** PNG chỉ có header, đủ cho magic bytes và kích thước; seed làm mỗi ảnh khác nhau */
  const png = (w: number, h: number, seed = 0) => {
    const buf = Buffer.alloc(40);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
    buf.writeUInt32BE(13, 8);
    buf.write('IHDR', 12, 'latin1');
    buf.writeUInt32BE(w, 16);
    buf.writeUInt32BE(h, 20);
    buf.writeUInt32BE(seed, 36);
    return buf;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    // Hồ sơ công ty là một dòng duy nhất: chụp lại để trả nguyên trạng sau khi test
    saved = {
      profiles: await ds.getRepository(CompanyProfile).find(),
      media: await ds.getRepository(MediaFile).find({ withDeleted: true }),
    };
    await ds.query('DELETE FROM media_files');
    await ds.query('DELETE FROM company_profile');

    const dep = await ds
      .getRepository(Department)
      .save({ name: `Company ${run}`, code: `CO_${run}`.toUpperCase() });
    depId = dep.id;
    const passwordHash = await bcrypt.hash(password, 4);
    await ds.getRepository(User).save([
      { email: emails.hr, fullName: 'C HR', role: Role.Hr, passwordHash },
      {
        email: emails.hm,
        fullName: 'C HM',
        role: Role.HiringManager,
        departmentId: dep.id,
        passwordHash,
      },
      { email: emails.iv, fullName: 'C IV', role: Role.Interviewer, passwordHash },
    ]);
    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    await ds.query('DELETE FROM media_files');
    await ds.query('DELETE FROM company_profile');
    if (saved.media.length) await ds.getRepository(MediaFile).save(saved.media);
    if (saved.profiles.length) await ds.getRepository(CompanyProfile).save(saved.profiles);
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: depId });
    await app.close();
  });

  it('BR-ORG-01: only Admin and HR manage the profile; the public page is hidden until it is complete', async () => {
    for (const who of ['hm', 'iv'] as const) {
      await as(who, request(server()).get('/api/v1/company')).expect(403);
      await put({ name: 'X' }, who).expect(403);
    }
    const res = await request(server()).get('/api/v1/public/company').expect(404);
    expect(res.body.code).toBe('COMPANY_PROFILE_INCOMPLETE');
  });

  it('reading the profile, publicly or internally, never writes to the database', async () => {
    await request(server()).get('/api/v1/public/company').expect(404);
    const internal = await as('hr', request(server()).get('/api/v1/company')).expect(200);
    expect(internal.body.data).toMatchObject({ name: '', logo: null, complete: false });
    expect(await ds.getRepository(CompanyProfile).count()).toBe(0);
  });

  it('HR saves the profile block by block; untouched fields stay, milestones come back in year order', async () => {
    await put({
      name: `  Công ty ${run}  `,
      about: 'Chúng tôi xây phần mềm tuyển dụng cho doanh nghiệp Việt Nam.',
      sizeRange: '51-200',
      foundedYear: 2016,
      website: 'https://hireflow.example.com',
      benefits: [{ title: 'Bảo hiểm sức khoẻ', description: 'Cho cả gia đình' }],
      offices: [{ name: 'Hà Nội', address: 'Tầng 12, 54 Liễu Giai, Ba Đình', mapUrl: '' }],
      milestones: [
        { year: 2021, title: 'Mở văn phòng Đà Nẵng', description: '' },
        { year: 2016, title: 'Thành lập', description: 'Ba người, một căn phòng' },
      ],
    }).expect(200);
    const res = await put({ tagline: 'Tuyển đúng người, nhanh hơn' }).expect(200);
    expect(res.body.data).toMatchObject({
      name: `Công ty ${run}`,
      tagline: 'Tuyển đúng người, nhanh hơn',
      sizeRange: '51-200',
      offices: [{ name: 'Hà Nội', mapUrl: null }],
      milestones: [{ year: 2016 }, { year: 2021 }],
      logo: null,
      complete: false,
    });
    const audit = await ds
      .getRepository(AuditLog)
      .findOneBy({ action: 'COMPANY_PROFILE_UPDATED' as never });
    expect(audit).toBeTruthy();
  });

  it.each([
    [{ website: 'http://insecure.example.com' }, 'website'],
    [{ socials: { facebook: 'javascript:alert(1)' } }, 'socials.facebook'],
    [
      { offices: [{ name: 'HN', address: 'Hà Nội, Việt Nam', mapUrl: 'data:text/html,x' }] },
      'offices.0.mapUrl',
    ],
    [
      { benefits: Array.from({ length: 13 }, (_, i) => ({ title: `Ý ${i}`, description: '' })) },
      'benefits',
    ],
    [{ foundedYear: 1500 }, 'foundedYear'],
  ])('BR-ORG-02: rejects %o', async (body, field) => {
    const res = await put(body).expect(400);
    expect(res.body.errors).toEqual([expect.objectContaining({ field })]);
  });

  it('BR-MEDIA-01: rejects SVG and files that only pretend to be images', async () => {
    const svg = await upload(
      'LOGO',
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      'logo.svg',
    ).expect(400);
    expect(svg.body.code).toBe('MEDIA_TYPE_NOT_ALLOWED');
    const fake = await upload('LOGO', Buffer.from('MZ not an image at all'), 'logo.png').expect(
      400,
    );
    expect(fake.body.code).toBe('MEDIA_TYPE_NOT_ALLOWED');
    const huge = await upload('COVER', png(5000, 1000)).expect(400);
    expect(huge.body.code).toBe('MEDIA_TOO_LARGE');
  });

  it('a logo completes the profile; the public page and the image are served without login', async () => {
    const logo = await upload('LOGO', png(256, 256, 1)).expect(201);
    expect(logo.body.data).toMatchObject({ kind: 'LOGO', width: 256, height: 256 });
    expect(logo.body.data.url).toMatch(/^\/public\/media\/[0-9a-f]{64}\.png$/);

    const company = await request(server()).get('/api/v1/public/company').expect(200);
    expect(company.body.data).toMatchObject({
      name: `Công ty ${run}`,
      logo: { url: logo.body.data.url },
      openJobs: expect.any(Number),
    });
    expect(company.body.data).not.toHaveProperty('updatedAt');

    const image = await request(server()).get(`/api/v1${logo.body.data.url}`).expect(200);
    expect(image.headers['content-type']).toBe('image/png');
    expect(image.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(image.headers['x-content-type-options']).toBe('nosniff');
  });

  it('BR-MEDIA-02: the public media route serves only active media keys, never CV paths', async () => {
    for (const path of [
      `/api/v1/public/media/${'a'.repeat(64)}.png`,
      `/api/v1/public/media/${'a'.repeat(64)}.svg`,
      '/api/v1/public/media/..%2Fcv%2F2026%2F10%2Fcv.pdf',
      '/api/v1/public/media/cv.pdf',
    ]) {
      await request(server()).get(path).expect(404);
    }
  });

  it('replacing the logo retires the old image; removing it hides the public page again', async () => {
    const first = (await ds.getRepository(MediaFile).findOneByOrFail({ kind: 'LOGO' as never }))
      .storageKey;
    const second = await upload('LOGO', png(300, 300, 2)).expect(201);
    await request(server())
      .get(`/api/v1/public/media/${first.slice('media/'.length)}`)
      .expect(404);
    await as('hr', request(server()).delete(`/api/v1/company/media/${second.body.data.id}`)).expect(
      200,
    );
    const res = await request(server()).get('/api/v1/public/company').expect(404);
    expect(res.body.code).toBe('COMPANY_PROFILE_INCOMPLETE');
  });

  it('the gallery needs alt text and holds at most 8 images', async () => {
    const noAlt = await upload('GALLERY', png(800, 600, 10)).expect(400);
    expect(noAlt.body.errors).toEqual([expect.objectContaining({ field: 'alt' })]);
    for (let i = 0; i < 7; i++) {
      const res = await upload(
        'GALLERY',
        png(800, 600, 20 + i),
        'anh.png',
        `Văn phòng ${i}`,
      ).expect(201);
      expect(res.body.data.position).toBe(i);
    }
    // Còn đúng 1 chỗ: nhiều lần tải cùng lúc thì chỉ một lần được nhận
    const race = await Promise.all(
      [40, 41, 42, 43].map((seed) =>
        upload('GALLERY', png(800, 600, seed), `${seed}.png`, `Tải song song ${seed}`),
      ),
    );
    expect(race.map((r) => r.status).sort()).toEqual([201, 409, 409, 409]);
    expect(await ds.getRepository(MediaFile).countBy({ kind: 'GALLERY' as never })).toBe(8);
    const full = await upload('GALLERY', png(800, 600, 99), 'anh.png', 'Một ảnh nữa').expect(409);
    expect(full.body.code).toBe('GALLERY_FULL');

    const gallery = (await as('hr', request(server()).get('/api/v1/company')).expect(200)).body.data
      .gallery;
    const moved = await as('hr', request(server()).patch(`/api/v1/company/media/${gallery[0].id}`))
      .send({ alt: 'Phòng họp lớn', position: 9 })
      .expect(200);
    expect(moved.body.data).toMatchObject({ alt: 'Phòng họp lớn', position: 9 });
  });
});
