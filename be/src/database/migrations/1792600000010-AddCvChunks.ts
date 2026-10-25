import { MigrationInterface, QueryRunner } from 'typeorm';

// Database Design 4.9, 5.2, 8
export class AddCvChunks1792600000010 implements MigrationInterface {
  name = 'AddCvChunks1792600000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await queryRunner.query(
      `CREATE TABLE "cv_chunks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cv_file_id" uuid NOT NULL, "section" character varying(20) NOT NULL, "position" smallint NOT NULL, "content" text NOT NULL, "token_count" smallint NOT NULL, "embedding_model" character varying(100) NOT NULL, "embedding" vector(1024) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_cv_chunks_section" CHECK ("section" IN ('summary', 'experience', 'skills', 'projects', 'education', 'other')), CONSTRAINT "PK_cv_chunks_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_cv_chunks_cv_file_id_position" ON "cv_chunks" ("cv_file_id", "position")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cv_chunks_embedding" ON "cv_chunks" USING hnsw ("embedding" vector_cosine_ops)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cv_chunks" ADD CONSTRAINT "FK_cv_chunks_cv_file_id" FOREIGN KEY ("cv_file_id") REFERENCES "cv_files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cv_chunks" DROP CONSTRAINT "FK_cv_chunks_cv_file_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cv_chunks_embedding"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_cv_chunks_cv_file_id_position"`);
    await queryRunner.query(`DROP TABLE "cv_chunks"`);
  }
}
