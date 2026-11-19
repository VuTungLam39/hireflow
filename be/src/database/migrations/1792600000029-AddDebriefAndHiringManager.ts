import { MigrationInterface, QueryRunner } from 'typeorm';

// MVP 3.1 · F-INT-05, F-JOB-12, BR-RANK-02
export class AddDebriefAndHiringManager1792600000029 implements MigrationInterface {
  name = 'AddDebriefAndHiringManager1792600000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."feedback_recommendation_enum" AS ENUM('STRONG_NO', 'NO', 'YES', 'STRONG_YES')`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_feedbacks" ADD "recommendation" "public"."feedback_recommendation_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "jobs" ADD "hiring_manager_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_hiring_manager_id" ON "jobs" ("hiring_manager_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_hiring_manager_id" FOREIGN KEY ("hiring_manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "ranking_weights" ("user_id" uuid NOT NULL, "job_id" uuid NOT NULL, "jd_version" integer NOT NULL, "weights" jsonb NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_ranking_weights_weights" CHECK (jsonb_typeof("weights") = 'object'), CONSTRAINT "PK_ranking_weights" PRIMARY KEY ("user_id", "job_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_weights" ADD CONSTRAINT "FK_ranking_weights_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_weights" ADD CONSTRAINT "FK_ranking_weights_job_id" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ranking_weights"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_hiring_manager_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_jobs_hiring_manager_id"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "hiring_manager_id"`);
    await queryRunner.query(`ALTER TABLE "interview_feedbacks" DROP COLUMN "recommendation"`);
    await queryRunner.query(`DROP TYPE "public"."feedback_recommendation_enum"`);
  }
}
