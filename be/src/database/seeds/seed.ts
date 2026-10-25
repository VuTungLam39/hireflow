import { fakerVI } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum.js';
import { Department } from '../../modules/departments/entities/department.entity.js';
import { Job, JobStatus } from '../../modules/jobs/entities/job.entity.js';
import { User } from '../../modules/users/entities/user.entity.js';
import dataSource from '../data-source.js';
import type { TRACKS } from './factories.js';
import { seedCandidates, seedJobs } from './seed-data.js';

const DEPARTMENTS: { code: keyof typeof TRACKS; name: string }[] = [
  { code: 'ENG', name: 'Kỹ thuật' },
  { code: 'SALES', name: 'Kinh doanh' },
  { code: 'MKT', name: 'Marketing' },
];

const DEMO_USERS: { email: string; fullName: string; role: Role; department?: string }[] = [
  { email: 'hr@hireflow.dev', fullName: 'Nguyễn Thu Hà', role: Role.Hr },
  {
    email: 'hm.eng@hireflow.dev',
    fullName: 'Trần Đức Long',
    role: Role.HiringManager,
    department: 'ENG',
  },
  {
    email: 'hm.sales@hireflow.dev',
    fullName: 'Phạm Ngọc Lan',
    role: Role.HiringManager,
    department: 'SALES',
  },
];

async function seed() {
  await dataSource.initialize();
  const departments = dataSource.getRepository(Department);
  const users = dataSource.getRepository(User);

  const departmentIds = new Map<string, string>();
  for (const item of DEPARTMENTS) {
    const found =
      (await departments.findOneBy({ code: item.code })) ??
      (await departments.save(departments.create(item)));
    departmentIds.set(item.code, found.id);
  }

  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
  const passwordHash = await bcrypt.hash(password, 10);
  const accounts = [
    {
      email: (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase(),
      fullName: 'Quản trị viên',
      role: Role.Admin,
    },
    ...DEMO_USERS,
  ];

  for (const { department, ...account } of accounts) {
    if (await users.existsBy({ email: account.email })) {
      console.log(`skip  ${account.email}`);
      continue;
    }
    await users.save(
      users.create({
        ...account,
        passwordHash,
        departmentId: department ? departmentIds.get(department)! : null,
      }),
    );
    console.log(`added ${account.email} (${account.role})`);
  }
  console.log('Mật khẩu mọi tài khoản demo: SEED_ADMIN_PASSWORD');

  if (await dataSource.getRepository(Job).exists()) {
    console.log('skip  jobs, candidates, applications (đã có)');
  } else {
    await seedDemoData(departmentIds);
  }

  await dataSource.destroy();
}

async function seedDemoData(departmentIds: Map<string, string>) {
  fakerVI.seed(7);
  const users = await dataSource.getRepository(User).find();
  const managerIds = new Map<string, string[]>();
  for (const u of users) {
    if (u.role !== Role.HiringManager || !u.departmentId) continue;
    managerIds.set(u.departmentId, [...(managerIds.get(u.departmentId) ?? []), u.id]);
  }
  const ctx = {
    departments: DEPARTMENTS.map((d) => ({ id: departmentIds.get(d.code)!, track: d.code })),
    hrIds: users.filter((u) => u.role === Role.Hr).map((u) => u.id),
    managerIds,
    adminId: users.find((u) => u.role === Role.Admin)!.id,
  };

  const jobs = await seedJobs(dataSource, fakerVI, ctx, 8, (i) =>
    i === 7 ? JobStatus.Draft : i === 5 ? JobStatus.Closed : JobStatus.Open,
  );
  const result = await seedCandidates(dataSource, fakerVI, ctx, jobs, {
    candidates: 90,
    appsPerCandidate: (i) => (i < 30 ? 2 : 1),
  });
  console.log(
    `added ${jobs.length} jobs, 90 candidates, ${result.applications} applications, ${result.history} history`,
  );
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
