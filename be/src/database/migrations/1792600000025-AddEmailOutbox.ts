import { MigrationInterface, QueryRunner } from 'typeorm';

// MVP 3 · BR-NOTI-02
export class AddEmailOutbox1792600000025 implements MigrationInterface {
  name = 'AddEmailOutbox1792600000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."email_outbox_status_enum" AS ENUM('PENDING', 'SENT', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "email_outbox" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid, "to" character varying(255) NOT NULL, "template" character varying(50) NOT NULL, "payload" jsonb NOT NULL DEFAULT '{}', "status" "public"."email_outbox_status_enum" NOT NULL DEFAULT 'PENDING', "attempts" smallint NOT NULL DEFAULT '0', "last_error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sent_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CK_email_outbox_payload" CHECK (jsonb_typeof("payload") = 'object'), CONSTRAINT "PK_b6fbfc201f705fbf1ac87bd7197" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_outbox_organization_id" ON "email_outbox" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_outbox_pending" ON "email_outbox" ("status", "created_at") WHERE "status" = 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_outbox" ADD CONSTRAINT "FK_email_outbox_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "email_outbox"`);
    await queryRunner.query(`DROP TYPE "public"."email_outbox_status_enum"`);
  }
}
