import { MigrationInterface, QueryRunner } from 'typeorm';

// MVP 3.1 · F-APP-13, BR-STS-03
export class AddRejectReasonCodes1792600000027 implements MigrationInterface {
  name = 'AddRejectReasonCodes1792600000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."reject_reason_code_enum" AS ENUM('SKILL_GAP', 'EXPERIENCE', 'CULTURE', 'SALARY', 'OTHER_CANDIDATE', 'CANDIDATE_DECLINED', 'NO_SHOW', 'OTHER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_status_history" ADD "reason_code" "public"."reject_reason_code_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_status_history" DROP CONSTRAINT "CK_application_status_history_reject_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_status_history" ADD CONSTRAINT "CK_application_status_history_reject_reason" CHECK ("to_status" <> 'REJECTED' OR "reason" IS NOT NULL OR "reason_code" IS NOT NULL)`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_status_history" ADD CONSTRAINT "CK_application_status_history_reason_code_other" CHECK ("reason_code" IS DISTINCT FROM 'OTHER' OR "reason" IS NOT NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "application_status_history" DROP CONSTRAINT "CK_application_status_history_reason_code_other"`,
    );
    await queryRunner.query(
      `UPDATE "application_status_history" SET "reason" = "reason_code"::text WHERE "to_status" = 'REJECTED' AND "reason" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_status_history" DROP CONSTRAINT "CK_application_status_history_reject_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_status_history" ADD CONSTRAINT "CK_application_status_history_reject_reason" CHECK ("to_status" <> 'REJECTED' OR "reason" IS NOT NULL)`,
    );
    await queryRunner.query(`ALTER TABLE "application_status_history" DROP COLUMN "reason_code"`);
    await queryRunner.query(`DROP TYPE "public"."reject_reason_code_enum"`);
  }
}
