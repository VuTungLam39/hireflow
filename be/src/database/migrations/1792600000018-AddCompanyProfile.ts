import { MigrationInterface, QueryRunner } from 'typeorm';

// F-ORG-01, F-FILE-03 · BR-ORG-01, BR-MEDIA-01, BR-MEDIA-02 · Mở rộng MVP 2 (E3)
export class AddCompanyProfile1792600000018 implements MigrationInterface {
  name = 'AddCompanyProfile1792600000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."company_profile_size_range_enum" AS ENUM('1-50', '51-200', '201-500', '501-1000', '1000+')`,
    );
    await queryRunner.query(
      `CREATE TABLE "company_profile" ("id" smallint NOT NULL, "name" character varying(150) NOT NULL DEFAULT '', "tagline" character varying(200) NOT NULL DEFAULT '', "about" text NOT NULL DEFAULT '', "size_range" "public"."company_profile_size_range_enum", "industries" text array NOT NULL DEFAULT '{}', "founded_year" smallint, "website" character varying(300), "socials" jsonb NOT NULL DEFAULT '{}', "logo_media_id" uuid, "cover_media_id" uuid, "benefits" jsonb NOT NULL DEFAULT '[]', "offices" jsonb NOT NULL DEFAULT '[]', "milestones" jsonb NOT NULL DEFAULT '[]', "updated_by" uuid, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_company_profile_founded_year" CHECK ("founded_year" IS NULL OR "founded_year" BETWEEN 1800 AND 2100), CONSTRAINT "CK_company_profile_singleton" CHECK ("id" = 1), CONSTRAINT "PK_company_profile" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_files_kind_enum" AS ENUM('LOGO', 'COVER', 'GALLERY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "media_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "kind" "public"."media_files_kind_enum" NOT NULL, "storage_key" character varying(200) NOT NULL, "mime" character varying(50) NOT NULL, "size_bytes" integer NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "sha256" character(64) NOT NULL, "alt_text" character varying(200) NOT NULL DEFAULT '', "position" smallint NOT NULL DEFAULT '0', "created_by" uuid NOT NULL, CONSTRAINT "CK_media_files_dimensions" CHECK ("width" BETWEEN 1 AND 4096 AND "height" BETWEEN 1 AND 4096), CONSTRAINT "CK_media_files_size" CHECK ("size_bytes" > 0 AND "size_bytes" <= 3145728), CONSTRAINT "PK_media_files" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_files_kind_position" ON "media_files" ("kind", "position") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_media_files_kind_position"`);
    await queryRunner.query(`DROP TABLE "media_files"`);
    await queryRunner.query(`DROP TYPE "public"."media_files_kind_enum"`);
    await queryRunner.query(`DROP TABLE "company_profile"`);
    await queryRunner.query(`DROP TYPE "public"."company_profile_size_range_enum"`);
  }
}
