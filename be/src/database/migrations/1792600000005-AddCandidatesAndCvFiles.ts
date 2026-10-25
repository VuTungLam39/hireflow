import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCandidatesAndCvFiles1792600000005 implements MigrationInterface {
  name = 'AddCandidatesAndCvFiles1792600000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "candidates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "full_name" character varying(150) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20), "consent_at" TIMESTAMP WITH TIME ZONE NOT NULL, "consent_version" character varying(20) NOT NULL, "anonymized_at" TIMESTAMP WITH TIME ZONE, "anonymized_by" uuid, CONSTRAINT "CK_candidates_email_lower" CHECK ("email" = lower("email")), CONSTRAINT "PK_140681296bf033ab1eb95288abb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_candidates_email" ON "candidates" ("email") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cv_parse_status_enum" AS ENUM('PENDING', 'PARSED', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cv_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "candidate_id" uuid NOT NULL, "storage_key" character varying(255) NOT NULL, "original_name" character varying(255) NOT NULL, "mime" character varying(100) NOT NULL, "size_bytes" integer NOT NULL, "sha256" character(64) NOT NULL, "parse_status" "public"."cv_parse_status_enum" NOT NULL DEFAULT 'PENDING', "parse_error" text, "text" text, CONSTRAINT "CK_cv_files_size_bytes" CHECK ("size_bytes" BETWEEN 1 AND 5242880), CONSTRAINT "CK_cv_files_mime" CHECK ("mime" IN ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')), CONSTRAINT "PK_89bdf76e79a74acd27e46e1be82" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_cv_files_storage_key" ON "cv_files" ("storage_key")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_cv_files_candidate_id_sha256" ON "cv_files" ("candidate_id", "sha256") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" ADD CONSTRAINT "FK_candidates_anonymized_by" FOREIGN KEY ("anonymized_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cv_files" ADD CONSTRAINT "FK_cv_files_candidate_id" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cv_files" DROP CONSTRAINT "FK_cv_files_candidate_id"`);
    await queryRunner.query(
      `ALTER TABLE "candidates" DROP CONSTRAINT "FK_candidates_anonymized_by"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_cv_files_candidate_id_sha256"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_cv_files_storage_key"`);
    await queryRunner.query(`DROP TABLE "cv_files"`);
    await queryRunner.query(`DROP TYPE "public"."cv_parse_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_candidates_email"`);
    await queryRunner.query(`DROP TABLE "candidates"`);
  }
}
