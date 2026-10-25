import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCvProfiles1792600000008 implements MigrationInterface {
  name = 'AddCvProfiles1792600000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cv_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cv_file_id" uuid NOT NULL, "data" jsonb NOT NULL, "model" character varying(100) NOT NULL, "prompt_version" character varying(20) NOT NULL, "input_tokens" integer NOT NULL, "output_tokens" integer NOT NULL, "cost_usd" numeric(10,6) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_cv_profiles_tokens" CHECK ("input_tokens" >= 0 AND "output_tokens" >= 0), CONSTRAINT "CK_cv_profiles_data" CHECK (jsonb_typeof("data") = 'object'), CONSTRAINT "PK_4e2aad944618b569c46754dafec" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_cv_profiles_cv_file_id_prompt_version" ON "cv_profiles" ("cv_file_id", "prompt_version") `,
    );
    await queryRunner.query(
      `ALTER TABLE "cv_profiles" ADD CONSTRAINT "FK_cv_profiles_cv_file_id" FOREIGN KEY ("cv_file_id") REFERENCES "cv_files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cv_profiles" DROP CONSTRAINT "FK_cv_profiles_cv_file_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_cv_profiles_cv_file_id_prompt_version"`);
    await queryRunner.query(`DROP TABLE "cv_profiles"`);
  }
}
