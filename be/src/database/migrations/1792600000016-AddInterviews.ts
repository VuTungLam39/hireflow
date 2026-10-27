import { MigrationInterface, QueryRunner } from 'typeorm';

// F-INT-01 → 03 · US-11 · BR-INT-01 → 03 · Database Design 9
export class AddInterviews1792600000016 implements MigrationInterface {
  name = 'AddInterviews1792600000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'interviewer'`,
    );
    for (const value of [
      'INTERVIEW_ASSIGNED',
      'INTERVIEW_UPDATED',
      'INTERVIEW_CANCELLED',
      'FEEDBACK_SUBMITTED',
    ]) {
      await queryRunner.query(
        `ALTER TYPE "public"."notification_type_enum" ADD VALUE IF NOT EXISTS '${value}'`,
      );
    }
    await queryRunner.query(
      `CREATE TYPE "public"."interview_status_enum" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "interviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "application_id" uuid NOT NULL, "round" smallint NOT NULL, "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "duration_minutes" smallint NOT NULL DEFAULT 60, "location" character varying(500) NOT NULL, "status" "public"."interview_status_enum" NOT NULL DEFAULT 'SCHEDULED', "cancel_reason" text, "created_by" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_interviews_duration" CHECK ("duration_minutes" BETWEEN 15 AND 240), CONSTRAINT "CK_interviews_round" CHECK ("round" BETWEEN 1 AND 20), CONSTRAINT "CK_interviews_cancelled_has_reason" CHECK ("status" <> 'CANCELLED' OR ("cancel_reason" IS NOT NULL AND btrim("cancel_reason") <> '')), CONSTRAINT "PK_interviews" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_interviews_application_id" ON "interviews" ("application_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_interviews_scheduled_at" ON "interviews" ("scheduled_at")`,
    );
    await queryRunner.query(
      `CREATE TABLE "interview_assignees" ("interview_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_interview_assignees" PRIMARY KEY ("interview_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_interview_assignees_user_id" ON "interview_assignees" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE TABLE "interview_feedbacks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "interview_id" uuid NOT NULL, "author_id" uuid NOT NULL, "overall" smallint NOT NULL, "ratings" jsonb NOT NULL, "comment" text, "editable_until" TIMESTAMP WITH TIME ZONE NOT NULL, "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_interview_feedbacks_overall" CHECK ("overall" BETWEEN 1 AND 5), CONSTRAINT "CK_interview_feedbacks_ratings" CHECK (jsonb_typeof("ratings") = 'array'), CONSTRAINT "PK_interview_feedbacks" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_interview_feedbacks_interview_id_author_id" ON "interview_feedbacks" ("interview_id", "author_id")`,
    );
    await queryRunner.query(`ALTER TABLE "notifications" ADD "interview_id" uuid`);
    for (const [table, column, ref, onDelete] of FOREIGN_KEYS) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "FK_${table}_${column}" FOREIGN KEY ("${column}") REFERENCES "${ref}"("id") ON DELETE ${onDelete} ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_interview_id"`,
    );
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "interview_id"`);
    await queryRunner.query(`DROP TABLE "interview_feedbacks"`);
    await queryRunner.query(`DROP TABLE "interview_assignees"`);
    await queryRunner.query(`DROP TABLE "interviews"`);
    await queryRunner.query(`DROP TYPE "public"."interview_status_enum"`);

    await queryRunner.query(
      `DELETE FROM "notifications" WHERE "type"::text NOT IN ('CV_SCORED', 'CV_FAILED')`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type_enum" AS ENUM('CV_SCORED', 'CV_FAILED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notification_type_enum" USING "type"::text::"public"."notification_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);

    await queryRunner.query(
      `UPDATE "users" SET "is_active" = false, "role" = 'hr' WHERE "role" = 'interviewer'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'hr', 'hiring_manager')`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::text::"public"."users_role_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'hr'`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
  }
}

const FOREIGN_KEYS = [
  ['interviews', 'application_id', 'applications', 'CASCADE'],
  ['interviews', 'created_by', 'users', 'RESTRICT'],
  ['interview_assignees', 'interview_id', 'interviews', 'CASCADE'],
  ['interview_assignees', 'user_id', 'users', 'CASCADE'],
  ['interview_feedbacks', 'interview_id', 'interviews', 'CASCADE'],
  ['interview_feedbacks', 'author_id', 'users', 'CASCADE'],
  ['notifications', 'interview_id', 'interviews', 'CASCADE'],
] as const;
