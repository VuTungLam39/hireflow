import { MigrationInterface, QueryRunner } from 'typeorm';

// Kickoff 9.3, 14 · Database Design: index đợt 2 · docs/perf-report.md
export class AddPerformanceIndexes1792600000009 implements MigrationInterface {
  name = 'AddPerformanceIndexes1792600000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_applications_created_at_id" ON "applications" ("created_at" DESC, "id" DESC) WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_applications_score_id" ON "applications" ("score" DESC NULLS LAST, "id" DESC) WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_applications_job_id_status_score" ON "applications" ("job_id", "status", "score" DESC NULLS LAST) INCLUDE ("ai_status") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_applications_flags" ON "applications" USING GIN ("flags") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_candidates_created_at_id" ON "candidates" ("created_at" DESC, "id" DESC) WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_candidates_full_name_trgm" ON "candidates" USING GIN (f_unaccent(lower("full_name")) gin_trgm_ops) WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_candidates_email_trgm" ON "candidates" USING GIN ("email" gin_trgm_ops) WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const index of [
      'IDX_candidates_email_trgm',
      'IDX_candidates_full_name_trgm',
      'IDX_candidates_created_at_id',
      'IDX_applications_flags',
      'IDX_applications_job_id_status_score',
      'IDX_applications_score_id',
      'IDX_applications_created_at_id',
    ]) {
      await queryRunner.query(`DROP INDEX "public"."${index}"`);
    }
  }
}
