import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplications1792600000006 implements MigrationInterface {
  name = 'AddApplications1792600000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."application_source_enum" AS ENUM('PUBLIC_FORM', 'HR_UPLOAD')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."application_status_enum" AS ENUM('NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_status_enum" AS ENUM('PENDING', 'PROCESSING', 'DONE', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."score_flag_enum" AS ENUM('MISSING_MUST', 'UNVERIFIED_EVIDENCE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "job_id" uuid NOT NULL, "candidate_id" uuid NOT NULL, "cv_file_id" uuid, "source" "public"."application_source_enum" NOT NULL DEFAULT 'PUBLIC_FORM', "status" "public"."application_status_enum" NOT NULL DEFAULT 'NEW', "status_changed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ai_status" "public"."ai_status_enum" NOT NULL DEFAULT 'PENDING', "ai_error" text, "score" smallint, "score_breakdown" jsonb, "flags" "public"."score_flag_enum" array NOT NULL DEFAULT '{}', "scored_jd_version" integer, "scored_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CK_applications_done_has_score" CHECK ("ai_status" <> 'DONE' OR "score" IS NOT NULL), CONSTRAINT "CK_applications_score_breakdown" CHECK (jsonb_typeof("score_breakdown") = 'array'), CONSTRAINT "CK_applications_score" CHECK ("score" BETWEEN 0 AND 100), CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_applications_candidate_id" ON "applications" ("candidate_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_applications_cv_file_id" ON "applications" ("cv_file_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_applications_job_id_candidate_id" ON "applications" ("job_id", "candidate_id") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "application_status_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "application_id" uuid NOT NULL, "from_status" "public"."application_status_enum", "to_status" "public"."application_status_enum" NOT NULL, "reason" text, "changed_by" uuid, "changed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_application_status_history_reject_reason" CHECK ("to_status" <> 'REJECTED' OR "reason" IS NOT NULL), CONSTRAINT "PK_62f7e8a5533a7db21218f2e2434" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_application_status_history_application_id_changed_at" ON "application_status_history" ("application_id", "changed_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE TABLE "application_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "application_id" uuid NOT NULL, "author_id" uuid NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_application_notes_content_length" CHECK (length("content") BETWEEN 1 AND 2000), CONSTRAINT "PK_db708de5fa99541ad52a1f907de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_application_notes_application_id_created_at" ON "application_notes" ("application_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_applications_job_id" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_applications_candidate_id" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_applications_cv_file_id" FOREIGN KEY ("cv_file_id") REFERENCES "cv_files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_status_history" ADD CONSTRAINT "FK_application_status_history_application_id" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_status_history" ADD CONSTRAINT "FK_application_status_history_changed_by" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_notes" ADD CONSTRAINT "FK_application_notes_application_id" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_notes" ADD CONSTRAINT "FK_application_notes_author_id" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, fk] of [
      ['application_notes', 'FK_application_notes_author_id'],
      ['application_notes', 'FK_application_notes_application_id'],
      ['application_status_history', 'FK_application_status_history_changed_by'],
      ['application_status_history', 'FK_application_status_history_application_id'],
      ['applications', 'FK_applications_cv_file_id'],
      ['applications', 'FK_applications_candidate_id'],
      ['applications', 'FK_applications_job_id'],
    ]) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT "${fk}"`);
    }
    await queryRunner.query(
      `DROP INDEX "public"."IDX_application_notes_application_id_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "application_notes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_application_status_history_application_id_changed_at"`,
    );
    await queryRunner.query(`DROP TABLE "application_status_history"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_applications_job_id_candidate_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_applications_cv_file_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_applications_candidate_id"`);
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TYPE "public"."score_flag_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ai_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."application_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."application_source_enum"`);
  }
}
