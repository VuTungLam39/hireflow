import { MigrationInterface, QueryRunner } from 'typeorm';

// F-MATCH-01, F-MATCH-02 · BR-MATCH-01 → 04 · Database Design 9
export class AddJobMatches1792600000012 implements MigrationInterface {
  name = 'AddJobMatches1792600000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."application_source_enum" ADD VALUE IF NOT EXISTS 'MATCH_INVITE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD "matched_at" TIMESTAMP WITH TIME ZONE, ADD "matched_jd_version" integer`,
    );
    await queryRunner.query(
      `CREATE TABLE "job_matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "job_id" uuid NOT NULL, "candidate_id" uuid NOT NULL, "cv_file_id" uuid, "jd_version" integer NOT NULL, "score" smallint NOT NULL, "score_breakdown" jsonb NOT NULL, "flags" "public"."score_flag_enum" array NOT NULL DEFAULT '{}', "last_applied_at" TIMESTAMP WITH TIME ZONE NOT NULL, "invited_at" TIMESTAMP WITH TIME ZONE, "invited_by" uuid, "application_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_job_matches_score" CHECK ("score" BETWEEN 0 AND 100), CONSTRAINT "CK_job_matches_score_breakdown" CHECK (jsonb_typeof("score_breakdown") = 'array'), CONSTRAINT "CK_job_matches_invited" CHECK (("invited_at" IS NULL) = ("invited_by" IS NULL)), CONSTRAINT "PK_job_matches" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_job_matches_job_id_candidate_id" ON "job_matches" ("job_id", "candidate_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_job_matches_candidate_id" ON "job_matches" ("candidate_id")`,
    );
    for (const [column, table, onDelete] of FOREIGN_KEYS) {
      await queryRunner.query(
        `ALTER TABLE "job_matches" ADD CONSTRAINT "FK_job_matches_${column}" FOREIGN KEY ("${column}") REFERENCES "${table}"("id") ON DELETE ${onDelete} ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "job_matches"`);
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN "matched_jd_version", DROP COLUMN "matched_at"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."application_source_enum" RENAME TO "application_source_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."application_source_enum" AS ENUM('PUBLIC_FORM', 'HR_UPLOAD')`,
    );
    await queryRunner.query(`ALTER TABLE "applications" ALTER COLUMN "source" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "applications" ALTER COLUMN "source" TYPE "public"."application_source_enum" USING "source"::text::"public"."application_source_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ALTER COLUMN "source" SET DEFAULT 'PUBLIC_FORM'`,
    );
    await queryRunner.query(`DROP TYPE "public"."application_source_enum_old"`);
  }
}

const FOREIGN_KEYS = [
  ['job_id', 'jobs', 'CASCADE'],
  ['candidate_id', 'candidates', 'CASCADE'],
  ['cv_file_id', 'cv_files', 'SET NULL'],
  ['invited_by', 'users', 'RESTRICT'],
  ['application_id', 'applications', 'SET NULL'],
] as const;
