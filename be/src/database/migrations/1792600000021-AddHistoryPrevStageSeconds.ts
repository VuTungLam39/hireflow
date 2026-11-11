import { MigrationInterface, QueryRunner } from 'typeorm';

// F1 · BR-REP-01: số giây ở bước trước, ghi sẵn để báo cáo phễu khỏi tính LEAD() trên toàn bảng lịch sử
export class AddHistoryPrevStageSeconds1792600000021 implements MigrationInterface {
  name = 'AddHistoryPrevStageSeconds1792600000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "application_status_history" ADD "prev_stage_seconds" integer`,
    );
    await queryRunner.query(
      `UPDATE "application_status_history" h SET "prev_stage_seconds" = x.secs
       FROM (
         SELECT "id", GREATEST(0, floor(extract(epoch FROM "changed_at" - LAG("changed_at")
                  OVER (PARTITION BY "application_id" ORDER BY "changed_at", "id"))))::int AS secs
         FROM "application_status_history"
       ) x
       WHERE h."id" = x."id" AND x.secs IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_status_history" ADD CONSTRAINT "CK_application_status_history_prev_stage_seconds"
       CHECK ("prev_stage_seconds" IS NULL OR "prev_stage_seconds" >= 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "application_status_history" DROP CONSTRAINT "CK_application_status_history_prev_stage_seconds"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_status_history" DROP COLUMN "prev_stage_seconds"`,
    );
  }
}
