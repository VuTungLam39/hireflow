import { MigrationInterface, QueryRunner } from 'typeorm';

// F-AUDIT-01 · FR-AUDIT · Database Design 9
export class AddAuditLogs1792600000015 implements MigrationInterface {
  name = 'AddAuditLogs1792600000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actor_id" uuid, "action" character varying(50) NOT NULL, "entity" character varying(30) NOT NULL, "entity_id" uuid, "metadata" jsonb NOT NULL DEFAULT '{}', "ip" inet, "request_id" character varying(64), "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_audit_logs_metadata" CHECK (jsonb_typeof("metadata") = 'object'), CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_created_at_id" ON "audit_logs" ("created_at", "id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_entity_entity_id" ON "audit_logs" ("entity", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_actor_id_created_at" ON "audit_logs" ("actor_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE FUNCTION "audit_logs_append_only"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END $$`,
    );
    await queryRunner.query(
      `CREATE TRIGGER "TRG_audit_logs_append_only" BEFORE UPDATE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION "audit_logs_append_only"()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP FUNCTION "audit_logs_append_only"()`);
  }
}
