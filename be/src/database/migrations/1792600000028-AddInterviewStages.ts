import { MigrationInterface, QueryRunner } from 'typeorm';

// MVP 3.1 · F-INT-04, BR-INT-05
export class AddInterviewStages1792600000028 implements MigrationInterface {
  name = 'AddInterviewStages1792600000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "job_interview_stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "job_id" uuid NOT NULL, "position" smallint NOT NULL, "name" character varying(80) NOT NULL, "criteria" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_job_interview_stages_position" CHECK ("position" BETWEEN 1 AND 10), CONSTRAINT "CK_job_interview_stages_criteria" CHECK (jsonb_typeof("criteria") = 'array'), CONSTRAINT "PK_job_interview_stages" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_interview_stages" ADD CONSTRAINT "UQ_job_interview_stages_job_id_position" UNIQUE ("job_id", "position") DEFERRABLE INITIALLY DEFERRED`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_interview_stages" ADD CONSTRAINT "FK_job_interview_stages_job_id" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "interviews" ADD "stage_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_interviews_stage_id" ON "interviews" ("stage_id") `);
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD CONSTRAINT "FK_interviews_stage_id" FOREIGN KEY ("stage_id") REFERENCES "job_interview_stages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "interviews" DROP CONSTRAINT "FK_interviews_stage_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_interviews_stage_id"`);
    await queryRunner.query(`ALTER TABLE "interviews" DROP COLUMN "stage_id"`);
    await queryRunner.query(`DROP TABLE "job_interview_stages"`);
  }
}
