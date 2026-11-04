import { MigrationInterface, QueryRunner } from 'typeorm';

// F-JOB-10, F-JOB-11 · BR-JOB-08 → 10 · Mở rộng MVP 2 (E2)
export class AddJobDetails1792600000017 implements MigrationInterface {
  name = 'AddJobDetails1792600000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_salary_visibility_enum" AS ENUM('RANGE', 'NEGOTIABLE', 'HIDDEN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_level_enum" AS ENUM('INTERN', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'MANAGER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_employment_type_enum" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_work_mode_enum" AS ENUM('ONSITE', 'HYBRID', 'REMOTE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD "salary_min" integer, ADD "salary_max" integer, ADD "salary_visibility" "public"."jobs_salary_visibility_enum" NOT NULL DEFAULT 'NEGOTIABLE', ADD "level" "public"."jobs_level_enum", ADD "employment_type" "public"."jobs_employment_type_enum" NOT NULL DEFAULT 'FULL_TIME', ADD "work_mode" "public"."jobs_work_mode_enum" NOT NULL DEFAULT 'ONSITE', ADD "headcount" smallint NOT NULL DEFAULT 1, ADD "deadline" date, ADD "benefits" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "CK_jobs_salary_range" CHECK ("salary_min" IS NULL OR "salary_max" IS NULL OR "salary_min" <= "salary_max"), ADD CONSTRAINT "CK_jobs_salary_positive" CHECK (("salary_min" IS NULL OR "salary_min" > 0) AND ("salary_max" IS NULL OR "salary_max" > 0)), ADD CONSTRAINT "CK_jobs_headcount" CHECK ("headcount" BETWEEN 1 AND 999), ADD CONSTRAINT "CK_jobs_benefits_length" CHECK (length("benefits") <= 5000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "CK_jobs_benefits_length", DROP CONSTRAINT "CK_jobs_headcount", DROP CONSTRAINT "CK_jobs_salary_positive", DROP CONSTRAINT "CK_jobs_salary_range"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN "benefits", DROP COLUMN "deadline", DROP COLUMN "headcount", DROP COLUMN "work_mode", DROP COLUMN "employment_type", DROP COLUMN "level", DROP COLUMN "salary_visibility", DROP COLUMN "salary_max", DROP COLUMN "salary_min"`,
    );
    await queryRunner.query(`DROP TYPE "public"."jobs_work_mode_enum"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_employment_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_level_enum"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_salary_visibility_enum"`);
  }
}
