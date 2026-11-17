import dataSource from '../src/database/data-source.js';
import { DEFAULT_ORGANIZATION_ID } from '../src/modules/organizations/entities/organization.entity.js';

// BR-AI-11: DB test dùng lại giữa các lần chạy; xoá lượt đã đếm để không chạm hạn mức của công ty mặc định
export async function setup() {
  await dataSource.initialize();
  try {
    await dataSource.query(`DELETE FROM ai_usage WHERE organization_id = $1`, [
      DEFAULT_ORGANIZATION_ID,
    ]);
  } finally {
    await dataSource.destroy();
  }
}
