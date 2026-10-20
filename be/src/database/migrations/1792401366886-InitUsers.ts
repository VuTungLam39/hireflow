import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitUsers1792401366886 implements MigrationInterface {
  name = 'InitUsers1792401366886';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "full_name" character varying(100) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "is_active" boolean NOT NULL DEFAULT true, "refresh_token_hash" character varying(255), "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email" ON "users" ("email") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
