import { MigrationInterface, QueryRunner } from 'typeorm';

// MVP 3.1 · F-OFFER-01, BR-OFFER-01 → 05
export class AddOffers1792600000030 implements MigrationInterface {
  name = 'AddOffers1792600000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."offer_status_enum" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."offer_salary_period_enum" AS ENUM('MONTH', 'YEAR')`,
    );
    await queryRunner.query(
      `CREATE TABLE "offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "application_id" uuid NOT NULL, "status" "public"."offer_status_enum" NOT NULL DEFAULT 'DRAFT', "salary_amount" bigint NOT NULL, "salary_currency" character(3) NOT NULL DEFAULT 'VND', "salary_period" "public"."offer_salary_period_enum" NOT NULL DEFAULT 'MONTH', "start_date" date NOT NULL, "respond_by" date NOT NULL, "note" text, "created_by" uuid NOT NULL, "approved_by" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "sent_at" TIMESTAMP WITH TIME ZONE, "decided_at" TIMESTAMP WITH TIME ZONE, "status_reason" character varying(500), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_offers_salary_amount" CHECK ("salary_amount" > 0), CONSTRAINT "CK_offers_dates" CHECK ("respond_by" <= "start_date"), CONSTRAINT "PK_offers" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_offers_application_id_active" ON "offers" ("application_id") WHERE "status" NOT IN ('ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_offers_organization_id_status" ON "offers" ("organization_id", "status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" ADD CONSTRAINT "FK_offers_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" ADD CONSTRAINT "FK_offers_application_id" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" ADD CONSTRAINT "FK_offers_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" ADD CONSTRAINT "FK_offers_approved_by" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    for (const value of ['OFFER_PENDING_APPROVAL', 'OFFER_APPROVED', 'OFFER_RETURNED']) {
      await queryRunner.query(
        `ALTER TYPE "public"."notification_type_enum" ADD VALUE IF NOT EXISTS '${value}'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Giá trị đã thêm vào notification_type_enum không gỡ được an toàn; giữ lại
    await queryRunner.query(`DROP TABLE "offers"`);
    await queryRunner.query(`DROP TYPE "public"."offer_salary_period_enum"`);
    await queryRunner.query(`DROP TYPE "public"."offer_status_enum"`);
  }
}
