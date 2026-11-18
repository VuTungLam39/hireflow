import { In } from 'typeorm';
import { MediaKind } from '../../modules/company/entities/media-file.entity.js';
import { Organization } from '../../modules/organizations/entities/organization.entity.js';
import dataSource from '../data-source.js';
import { checkSeedImage, demoId } from './demo/demo-seed.js';
import { tenantLogo } from './demo/images.js';
import { seedTenants, TENANTS } from './demo/tenants.js';
import { checkSeedTarget } from './seed-guard.js';
import { createStorage } from './seed-storage.js';

// MVP 3 · P5-3: thêm 2 công ty demo (dữ liệu giả) vào DB đã có dữ liệu, không xoá gì.
// Đã có thì bỏ qua; mật khẩu tài khoản demo lấy từ SEED_ADMIN_PASSWORD (DB từ xa bắt buộc mật khẩu mạnh).
async function main() {
  const { password } = checkSeedTarget({ env: process.env, argv: [] });
  await dataSource.initialize();
  const ids = TENANTS.map((t) => demoId(`org:${t.key}`));
  const existing = await dataSource.getRepository(Organization).countBy({ id: In(ids) });
  if (existing) {
    console.log(`Demo tenants already exist (${existing}/${ids.length}): nothing to do`);
    return;
  }
  const logos = new Map(
    TENANTS.map((t) => [t.key, checkSeedImage(tenantLogo(t.logoColor), MediaKind.Logo)]),
  );
  const storage = await createStorage();
  for (const logo of logos.values()) await storage.put(logo.key, logo.buffer, logo.mime);
  await dataSource.transaction((m) => seedTenants(m, password, demoId, logos));
  console.log(`Seeded ${TENANTS.map((t) => t.slug).join(', ')}`);
}

main()
  .catch((error) => {
    console.error('Seed tenants failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => (dataSource.isInitialized ? dataSource.destroy() : undefined));
