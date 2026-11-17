import { MigrationInterface, QueryRunner } from 'typeorm';

// MVP 3 · BR-ACC-09, BR-APP-14
export class AddEmailVerification1792600000023 implements MigrationInterface {
  name = 'AddEmailVerification1792600000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "email_verified_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`UPDATE "users" SET "email_verified_at" = now()`);
    await queryRunner.query(
      `CREATE TYPE "public"."auth_token_kind_enum" AS ENUM('VERIFY_EMAIL', 'TRACK_APPLICATION')`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "kind" "public"."auth_token_kind_enum" NOT NULL, "token_hash" character(64) NOT NULL, "user_id" uuid, "application_id" uuid, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_auth_tokens_target" CHECK (("kind" = 'VERIFY_EMAIL' AND "user_id" IS NOT NULL) OR ("kind" = 'TRACK_APPLICATION' AND "application_id" IS NOT NULL)), CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_auth_tokens_token_hash" ON "auth_tokens" ("token_hash") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_auth_tokens_user_id" ON "auth_tokens" ("user_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_auth_tokens_application_id" ON "auth_tokens" ("application_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_auth_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_auth_tokens_application_id" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_tokens"`);
    await queryRunner.query(`DROP TYPE "public"."auth_token_kind_enum"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified_at"`);
  }
}
