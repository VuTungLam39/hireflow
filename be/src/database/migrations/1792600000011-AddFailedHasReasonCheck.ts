import { MigrationInterface, QueryRunner } from 'typeorm';

// BR-AI-07 · Database Design 4.10, 8
export class AddFailedHasReasonCheck1792600000011 implements MigrationInterface {
  name = 'AddFailedHasReasonCheck1792600000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "CK_applications_failed_has_reason" CHECK ("ai_status" <> 'FAILED' OR ("ai_error" IS NOT NULL AND btrim("ai_error") <> ''))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "CK_applications_failed_has_reason"`,
    );
  }
}
