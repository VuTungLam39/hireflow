import { MigrationInterface, QueryRunner } from 'typeorm';

// MVP 3 · BR-AI-11
export class AddAiUsage1792600000026 implements MigrationInterface {
  name = 'AddAiUsage1792600000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."ai_usage_kind_enum" AS ENUM('CV', 'CHAT')`);
    await queryRunner.query(
      `CREATE TABLE "ai_usage" ("organization_id" uuid NOT NULL, "day" date NOT NULL, "kind" "public"."ai_usage_kind_enum" NOT NULL, "count" integer NOT NULL DEFAULT '0', CONSTRAINT "CK_ai_usage_count" CHECK ("count" >= 0), CONSTRAINT "PK_ai_usage" PRIMARY KEY ("organization_id", "day", "kind"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage" ADD CONSTRAINT "FK_ai_usage_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD "ai_waiting_until" TIMESTAMP WITH TIME ZONE`,
    );
    // KH MVP 3 · Q5: công ty demo 1.000 lượt đọc CV, 300 lượt hỏi mỗi ngày
    await queryRunner.query(
      `UPDATE "organizations" SET "ai_daily_score_limit" = 1000, "ai_daily_chat_limit" = 300 WHERE "id" = '00000000-0000-4000-8000-000000000001'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "ai_waiting_until"`);
    await queryRunner.query(`DROP TABLE "ai_usage"`);
    await queryRunner.query(`DROP TYPE "public"."ai_usage_kind_enum"`);
  }
}
