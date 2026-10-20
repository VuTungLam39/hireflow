import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/database.config.js';

/**
 * DataSource dùng cho TypeORM CLI (migration) và script seed.
 * Chạy trên code đã build trong dist/ – xem các script `migration:*` trong package.json.
 */
export default new DataSource(buildDataSourceOptions());
