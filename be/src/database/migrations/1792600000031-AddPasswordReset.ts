import { MigrationInterface, QueryRunner } from 'typeorm';

// SG-06 · R6
export class AddPasswordReset1792600000031 implements MigrationInterface {
  name = 'AddPasswordReset1792600000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."auth_token_kind_enum" ADD VALUE IF NOT EXISTS 'RESET_PASSWORD'`,
    );
    await queryRunner.query(`ALTER TABLE "auth_tokens" DROP CONSTRAINT "CK_auth_tokens_target"`);
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" ADD CONSTRAINT "CK_auth_tokens_target" CHECK (("kind"::text IN ('VERIFY_EMAIL', 'RESET_PASSWORD') AND "user_id" IS NOT NULL) OR ("kind"::text = 'TRACK_APPLICATION' AND "application_id" IS NOT NULL))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "auth_tokens" WHERE "kind"::text = 'RESET_PASSWORD'`);
    await queryRunner.query(`ALTER TABLE "auth_tokens" DROP CONSTRAINT "CK_auth_tokens_target"`);
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" ADD CONSTRAINT "CK_auth_tokens_target" CHECK (("kind" = 'VERIFY_EMAIL' AND "user_id" IS NOT NULL) OR ("kind" = 'TRACK_APPLICATION' AND "application_id" IS NOT NULL))`,
    );
  }
}
