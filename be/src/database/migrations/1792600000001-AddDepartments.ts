import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartments1792600000001 implements MigrationInterface {
  name = 'AddDepartments1792600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "departments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(100) NOT NULL, "code" character varying(20) NOT NULL, CONSTRAINT "CK_departments_code" CHECK ("code" ~ '^[A-Z0-9_]{2,20}$'), CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_departments_name" ON "departments" ("name") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_departments_code" ON "departments" ("code") WHERE "deleted_at" IS NULL`,
    );

    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "password" TO "password_hash"`);
    await queryRunner.query(
      `UPDATE "users" SET "email" = lower("email") WHERE "email" <> lower("email")`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "department_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_users_department_id" ON "users" ("department_id")`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CK_users_email_lower" CHECK ("email" = lower("email"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CK_users_hiring_manager_department" CHECK ("role" <> 'hiring_manager' OR "department_id" IS NOT NULL)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_department_id"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CK_users_hiring_manager_department"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "CK_users_email_lower"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_department_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "department_id"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "password_hash" TO "password"`);

    await queryRunner.query(`DROP INDEX "public"."UQ_departments_code"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_departments_name"`);
    await queryRunner.query(`DROP TABLE "departments"`);
  }
}
