import { MigrationInterface, QueryRunner } from 'typeorm';

// F-SEARCH-01 · US-13 · Mở rộng MVP 2 – E1: full-text không dấu trên đoạn CV, gộp với vector bằng RRF
export class AddCvChunkSearch1792600000020 implements MigrationInterface {
  name = 'AddCvChunkSearch1792600000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cv_chunks" ADD "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, f_unaccent(lower("content")))) STORED`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cv_chunks_search_vector" ON "cv_chunks" USING GIN ("search_vector")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_cv_chunks_search_vector"`);
    await queryRunner.query(`ALTER TABLE "cv_chunks" DROP COLUMN "search_vector"`);
  }
}
