import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_ORG = '00000000-0000-4000-8000-000000000001';

const ROOT_TABLES = [
  'departments',
  'users',
  'candidates',
  'cv_files',
  'jobs',
  'applications',
  'interviews',
  'media_files',
  'audit_logs',
  'cv_chunks',
];
const PLAIN_INDEX = [
  'departments',
  'users',
  'cv_files',
  'interviews',
  'media_files',
  'audit_logs',
  'cv_chunks',
];
const CURSOR_INDEX = ['jobs', 'candidates', 'applications'];

// MVP 3 · BR-TEN-01, BR-ORG-04, BR-ORG-05, BR-CAND-01
export class AddOrganizations1792600000022 implements MigrationInterface {
  name = 'AddOrganizations1792600000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_status_enum" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "slug" character varying(80) NOT NULL, "tax_code" character varying(20), "website" character varying(255), "status" "public"."organizations_status_enum" NOT NULL DEFAULT 'PENDING', "status_reason" character varying(500), "approved_by" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "ai_daily_score_limit" integer NOT NULL DEFAULT '300', "ai_daily_chat_limit" integer NOT NULL DEFAULT '100', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_organizations_ai_limits" CHECK ("ai_daily_score_limit" >= 0 AND "ai_daily_chat_limit" >= 0), CONSTRAINT "CK_organizations_slug" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_organizations_slug" ON "organizations" ("slug") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_organizations_tax_code" ON "organizations" ("tax_code") `,
    );
    await queryRunner.query(
      `INSERT INTO "organizations" ("id", "name", "slug", "status", "approved_at", "ai_daily_score_limit", "ai_daily_chat_limit")
       VALUES ($1, COALESCE((SELECT NULLIF(btrim("name"), '') FROM "company_profile" WHERE "id" = 1), 'HireFlow Demo'),
               'hireflow-demo', 'ACTIVE', now(), 1000, 300)`,
      [DEFAULT_ORG],
    );

    for (const table of ROOT_TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD "organization_id" uuid`);
    }
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DISABLE TRIGGER "TRG_audit_logs_append_only"`,
    );
    for (const table of ROOT_TABLES.filter((t) => t !== 'cv_chunks')) {
      await queryRunner.query(`UPDATE "${table}" SET "organization_id" = $1`, [DEFAULT_ORG]);
    }
    await queryRunner.query(`ALTER TABLE "audit_logs" ENABLE TRIGGER "TRG_audit_logs_append_only"`);
    await queryRunner.query(
      `UPDATE "cv_chunks" ch SET "organization_id" = f."organization_id" FROM "cv_files" f WHERE f."id" = ch."cv_file_id"`,
    );
    for (const table of ROOT_TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "organization_id" SET NOT NULL`);
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "FK_${table}_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
      );
    }
    for (const table of PLAIN_INDEX) {
      await queryRunner.query(
        `CREATE INDEX "IDX_${table}_organization_id" ON "${table}" ("organization_id") `,
      );
    }
    for (const table of CURSOR_INDEX) {
      await queryRunner.query(
        `CREATE INDEX "IDX_${table}_organization_id_created_at_id" ON "${table}" ("organization_id", "created_at" DESC, "id" DESC) WHERE "deleted_at" IS NULL`,
      );
    }

    await queryRunner.query(`DROP INDEX "public"."UQ_departments_name"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_departments_code"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_candidates_email"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_departments_code" ON "departments" ("organization_id", "code") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_departments_name" ON "departments" ("organization_id", "name") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_candidates_email" ON "candidates" ("organization_id", "email") WHERE "deleted_at" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "company_profile" DROP CONSTRAINT "CK_company_profile_singleton"`,
    );
    await queryRunner.query(`ALTER TABLE "company_profile" DROP CONSTRAINT "PK_company_profile"`);
    await queryRunner.query(`ALTER TABLE "company_profile" ADD "organization_id" uuid`);
    await queryRunner.query(`UPDATE "company_profile" SET "organization_id" = $1`, [DEFAULT_ORG]);
    await queryRunner.query(`ALTER TABLE "company_profile" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "company_profile" ALTER COLUMN "organization_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_profile" ADD CONSTRAINT "PK_0ecb736fbd06448e18be828a849" PRIMARY KEY ("organization_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_profile" ADD CONSTRAINT "FK_company_profile_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company_profile" DROP CONSTRAINT "FK_company_profile_organization_id"`,
    );
    await queryRunner.query(`DELETE FROM "company_profile" WHERE "organization_id" <> $1`, [
      DEFAULT_ORG,
    ]);
    await queryRunner.query(
      `ALTER TABLE "company_profile" DROP CONSTRAINT "PK_0ecb736fbd06448e18be828a849"`,
    );
    await queryRunner.query(`ALTER TABLE "company_profile" ADD "id" smallint`);
    await queryRunner.query(`UPDATE "company_profile" SET "id" = 1`);
    await queryRunner.query(`ALTER TABLE "company_profile" ALTER COLUMN "id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "company_profile" DROP COLUMN "organization_id"`);
    await queryRunner.query(
      `ALTER TABLE "company_profile" ADD CONSTRAINT "PK_company_profile" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_profile" ADD CONSTRAINT "CK_company_profile_singleton" CHECK ("id" = 1)`,
    );

    await queryRunner.query(`DROP INDEX "public"."UQ_candidates_email"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_departments_name"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_departments_code"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_candidates_email" ON "candidates" ("email") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_departments_code" ON "departments" ("code") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_departments_name" ON "departments" ("name") WHERE "deleted_at" IS NULL`,
    );

    for (const table of CURSOR_INDEX) {
      await queryRunner.query(`DROP INDEX "public"."IDX_${table}_organization_id_created_at_id"`);
    }
    for (const table of PLAIN_INDEX) {
      await queryRunner.query(`DROP INDEX "public"."IDX_${table}_organization_id"`);
    }
    for (const table of [...ROOT_TABLES].reverse()) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT "FK_${table}_organization_id"`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "organization_id"`);
    }
    await queryRunner.query(`DROP INDEX "public"."UQ_organizations_tax_code"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_organizations_slug"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_status_enum"`);
  }
}
