import { MigrationInterface, QueryRunner } from 'typeorm';

// F-FILE-02 · BR-FILE-04 · Database Design 4.7
export class AddCvTextEntered1792600000013 implements MigrationInterface {
  name = 'AddCvTextEntered1792600000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cv_files" ADD "text_entered_at" TIMESTAMP WITH TIME ZONE, ADD "text_entered_by" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "cv_files" ADD CONSTRAINT "CK_cv_files_text_entered" CHECK ("text_entered_at" IS NULL OR ("text" IS NOT NULL AND "parse_status" = 'PARSED'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "cv_files" ADD CONSTRAINT "FK_cv_files_text_entered_by" FOREIGN KEY ("text_entered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cv_files" DROP CONSTRAINT "FK_cv_files_text_entered_by"`);
    await queryRunner.query(`ALTER TABLE "cv_files" DROP CONSTRAINT "CK_cv_files_text_entered"`);
    await queryRunner.query(
      `ALTER TABLE "cv_files" DROP COLUMN "text_entered_by", DROP COLUMN "text_entered_at"`,
    );
  }
}
