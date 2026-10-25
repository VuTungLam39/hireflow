import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobs1792600000004 implements MigrationInterface {
  name = 'AddJobs1792600000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_status_enum" AS ENUM('DRAFT', 'OPEN', 'CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "title" character varying(200) NOT NULL, "department_id" uuid NOT NULL, "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'DRAFT', "location" character varying(100) NOT NULL, "jd_text" text NOT NULL, "jd_version" integer NOT NULL DEFAULT '1', "created_by" uuid NOT NULL, "published_at" TIMESTAMP WITH TIME ZONE, "closed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CK_jobs_published_at" CHECK ("status" = 'DRAFT' OR "published_at" IS NOT NULL), CONSTRAINT "CK_jobs_jd_version" CHECK ("jd_version" >= 1), CONSTRAINT "CK_jobs_title_length" CHECK (length("title") >= 5), CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_jobs_department_id" ON "jobs" ("department_id")`);
    await queryRunner.query(`CREATE TYPE "public"."requirement_type_enum" AS ENUM('MUST', 'NICE')`);
    await queryRunner.query(
      `CREATE TABLE "job_requirements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "job_id" uuid NOT NULL, "jd_version" integer NOT NULL, "position" smallint NOT NULL, "label" character varying(100) NOT NULL, "type" "public"."requirement_type_enum" NOT NULL, "weight" smallint NOT NULL, "min_years" numeric(3,1), "keywords" text array NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_job_requirements_keywords" CHECK (cardinality("keywords") >= 1), CONSTRAINT "CK_job_requirements_min_years" CHECK ("min_years" BETWEEN 0 AND 30), CONSTRAINT "CK_job_requirements_weight" CHECK ("weight" BETWEEN 1 AND 3), CONSTRAINT "PK_9c77d4e7d897cd3e0c88717d574" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_job_requirements_job_id_jd_version_position" ON "job_requirements" ("job_id", "jd_version", "position")`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_requirements" ADD CONSTRAINT "FK_job_requirements_job_id" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_requirements" DROP CONSTRAINT "FK_job_requirements_job_id"`,
    );
    await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_created_by"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_department_id"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_job_requirements_job_id_jd_version_position"`);
    await queryRunner.query(`DROP TABLE "job_requirements"`);
    await queryRunner.query(`DROP TYPE "public"."requirement_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_jobs_department_id"`);
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
  }
}
