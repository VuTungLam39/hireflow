import bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum.js';
import { User } from '../../modules/users/entities/user.entity.js';
import dataSource from '../data-source.js';

/** Tạo tài khoản admin mặc định nếu chưa có */
async function seed() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(User);

  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';

  if (await repo.existsBy({ email })) {
    console.log(`Admin ${email} already exists, skipping.`);
  } else {
    await repo.save(
      repo.create({
        email,
        password: await bcrypt.hash(password, 10),
        fullName: 'Administrator',
        role: Role.Admin,
      }),
    );
    console.log(`Created admin: ${email}`);
  }

  await dataSource.destroy();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
