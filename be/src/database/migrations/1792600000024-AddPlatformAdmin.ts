import { MigrationInterface, QueryRunner } from 'typeorm';

// MVP 3 · BR-TEN-04: ALTER TYPE ... ADD VALUE không dùng được giá trị mới trong cùng transaction
export class AddPlatformAdmin1792600000024 implements MigrationInterface {
  name = 'AddPlatformAdmin1792600000024';
  transaction = false as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'platform_admin'`,
    );
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "organization_id" DROP NOT NULL`);
      // BR-ACC-09: chỉ người tự đăng ký công ty phải xác minh (gán NULL tường minh)
      await queryRunner.query(
        `ALTER TABLE "users" ALTER COLUMN "email_verified_at" SET DEFAULT now()`,
      );
      await queryRunner.query(
        `ALTER TABLE "users" ADD CONSTRAINT "CK_users_platform_admin_organization" CHECK (("role" = 'platform_admin') = ("organization_id" IS NULL))`,
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `DELETE FROM "refresh_tokens" WHERE "user_id" IN (SELECT "id" FROM "users" WHERE "role" = 'platform_admin')`,
      );
      await queryRunner.query(`DELETE FROM "users" WHERE "role" = 'platform_admin'`);
      await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email_verified_at" DROP DEFAULT`);
      await queryRunner.query(
        `ALTER TABLE "users" DROP CONSTRAINT "CK_users_platform_admin_organization"`,
      );
      await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "organization_id" SET NOT NULL`);
      await queryRunner.query(
        `ALTER TABLE "users" DROP CONSTRAINT "CK_users_hiring_manager_department"`,
      );
      await queryRunner.query(
        `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
      );
      await queryRunner.query(
        `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'hr', 'hiring_manager', 'interviewer')`,
      );
      await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
      await queryRunner.query(
        `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::text::"public"."users_role_enum"`,
      );
      await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'hr'`);
      await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
      await queryRunner.query(
        `ALTER TABLE "users" ADD CONSTRAINT "CK_users_hiring_manager_department" CHECK ("role" <> 'hiring_manager' OR "department_id" IS NOT NULL)`,
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }
}
