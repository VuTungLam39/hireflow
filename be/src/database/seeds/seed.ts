import bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum.js';
import { Department } from '../../modules/departments/entities/department.entity.js';
import { User } from '../../modules/users/entities/user.entity.js';
import dataSource from '../data-source.js';

const DEPARTMENTS = [
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
  console.log(`Mật khẩu mọi tài khoản demo: SEED_ADMIN_PASSWORD`);

  await dataSource.destroy();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
