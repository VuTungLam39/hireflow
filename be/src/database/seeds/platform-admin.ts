import bcrypt from 'bcryptjs';
import type { EntityManager } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { User } from '../../modules/users/entities/user.entity.js';

export const DEMO_PLATFORM_ADMIN_EMAIL = 'platform@example.com';

// MVP 3 · BR-ACC-01: Quản trị sàn chỉ tạo bằng seed/CLI; đã có thì giữ nguyên mật khẩu
export async function ensurePlatformAdmin(
  manager: EntityManager,
  email: string,
  password: string,
): Promise<'created' | 'exists'> {
  const normalized = email.trim().toLowerCase();
  const existing = await manager.findOne(User, { where: { email: normalized }, withDeleted: true });
  if (existing) {
    if (existing.role !== Role.PlatformAdmin) {
      throw new Error(`${normalized} already belongs to a company account`);
    }
    await manager.update(User, existing.id, { isActive: true, deletedAt: null });
    return 'exists';
  }
  await manager.insert(User, {
    email: normalized,
    fullName: 'Quản trị sàn',
    role: Role.PlatformAdmin,
    organizationId: null,
    departmentId: null,
    passwordHash: await bcrypt.hash(password, 10),
  });
  return 'created';
}
