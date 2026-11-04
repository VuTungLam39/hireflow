import { MigrationInterface, QueryRunner } from 'typeorm';

// BR-JOB-08 · Mở rộng MVP 2 (rà soát sau E2): migration 17 gán mặc định ONSITE + NEGOTIABLE
// cho mọi tin cũ, nên tin ghi "Remote" vẫn hiện "Tại văn phòng" và mọi tin hiện "Thoả thuận"
// dù HR chưa từng chọn. Chỉ sửa dòng còn giữ giá trị mặc định, không đè lựa chọn của HR.
export class BackfillJobDetails1792600000019 implements MigrationInterface {
  name = 'BackfillJobDetails1792600000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "jobs" SET "work_mode" = 'REMOTE'
       WHERE "work_mode" = 'ONSITE'
         AND (f_unaccent(lower("location")) LIKE '%remote%' OR f_unaccent(lower("location")) LIKE '%tu xa%')`,
    );
    await queryRunner.query(
      `UPDATE "jobs" SET "work_mode" = 'HYBRID'
       WHERE "work_mode" = 'ONSITE' AND f_unaccent(lower("location")) LIKE '%hybrid%'`,
    );
    await queryRunner.query(
      `UPDATE "jobs" SET "salary_visibility" = 'HIDDEN'
       WHERE "salary_visibility" = 'NEGOTIABLE' AND "salary_min" IS NULL AND "salary_max" IS NULL`,
    );
  }

  public async down(): Promise<void> {
    // Dữ liệu suy ra từ địa điểm, không khôi phục được giá trị mặc định cũ (và cũng không cần)
  }
}
