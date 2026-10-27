import { MigrationInterface, QueryRunner } from 'typeorm';

// F-NOTI-01 · US-12 · Database Design 9
export class AddNotifications1792600000014 implements MigrationInterface {
  name = 'AddNotifications1792600000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type_enum" AS ENUM('CV_SCORED', 'CV_FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."notification_type_enum" NOT NULL, "application_id" uuid, "read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_notifications" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id_read_at_created_at" ON "notifications" ("user_id", "read_at", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_application_id" ON "notifications" ("application_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_application_id" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
  }
}
