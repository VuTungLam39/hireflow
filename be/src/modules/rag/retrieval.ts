import { DataSource } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import type { CvSection } from './cv-chunks.js';

type ScopeUser = Pick<AuthUser, 'role' | 'departmentId'>;

export interface RetrievedRow {
  chunkId: string;
  candidateId: string;
  candidateName: string;
  applicationId: string;
  section: CvSection;
  content: string;
}

// Database Design Q8
export const CHAT_TOP_K = 8;
// F-SEARCH-01: mỗi nhánh lấy 20 đoạn, gộp bằng Reciprocal Rank Fusion 1 / (60 + hạng)
export const RRF_CANDIDATES = 20;
export const RRF_K = 60;

/** vector: chỉ ngữ nghĩa (đối chứng khi đo); keyword: chỉ full-text; hybrid: cả hai */
export type RetrievalMode = 'hybrid' | 'vector' | 'keyword';

export const toVector = (values: number[]) =>
  `[${values.map((v) => Number(v.toPrecision(7))).join(',')}]`;

// Kickoff 8.5 · F-SEARCH-01 · BR-ACC-07: vector và full-text cùng phạm vi quyền, gộp bằng RRF
export function retrieveChunks(
  dataSource: DataSource,
  input: {
    vector: number[];
    keywords: string;
    embeddingModel: string;
    user: ScopeUser;
    mode?: RetrievalMode;
    topK?: number;
  },
): Promise<RetrievedRow[]> {
  const { vector, keywords, user } = input;
  const mode = input.mode ?? 'hybrid';
  const params: unknown[] = [
    toVector(vector),
    input.embeddingModel,
    input.topK ?? CHAT_TOP_K,
    mode === 'vector' ? '' : keywords,
    RRF_CANDIDATES,
    RRF_K,
  ];
  let scope = '';
  if (user.role === Role.HiringManager) {
    params.push(user.departmentId);
    scope = `AND j.department_id = $${params.length}`;
  }
  const readable = (alias: string) => `
    JOIN cv_files cf ON cf.id = ${alias}.cv_file_id AND cf.deleted_at IS NULL
    JOIN candidates c ON c.id = cf.candidate_id AND c.deleted_at IS NULL AND c.anonymized_at IS NULL
    CROSS JOIN LATERAL (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id AND j.deleted_at IS NULL
      WHERE a.cv_file_id = ${alias}.cv_file_id AND a.deleted_at IS NULL ${scope}
      ORDER BY a.created_at DESC
      LIMIT 1
    ) app`;
  const vectorBranch =
    mode === 'keyword'
      ? `SELECT NULL::uuid AS id, NULL::bigint AS rank WHERE $1::vector IS NULL`
      : `SELECT id, row_number() OVER (ORDER BY distance) AS rank FROM (
           SELECT ch.id, ch.embedding <=> $1::vector AS distance
           FROM cv_chunks ch ${readable('ch')}
           WHERE ch.embedding_model = $2
           ORDER BY distance
           LIMIT $5
         ) v`;
  return dataSource.transaction(async (manager) => {
    await manager.query(`SET LOCAL hnsw.iterative_scan = relaxed_order`);
    return manager.query<RetrievedRow[]>(
      `WITH terms AS (
         SELECT DISTINCT lexeme, to_tsquery('simple', quote_literal(lexeme)) AS query
         FROM unnest(to_tsvector('simple', f_unaccent(lower($4))))
         WHERE $4 <> ''
       ),
       weights AS (
         SELECT t.query, power(ln((n.total + 1) / (1 + (
           SELECT count(*) FROM cv_chunks ch WHERE ch.embedding_model = $2 AND ch.search_vector @@ t.query
         ))), 2) AS w
         FROM terms t,
           (SELECT greatest(reltuples, 1000)::float AS total FROM pg_class WHERE oid = 'cv_chunks'::regclass) n
       ),
       vec AS (${vectorBranch}),
       fts AS (
         SELECT id, row_number() OVER (ORDER BY score DESC, id) AS rank FROM (
           SELECT ch.id, sum(w.w) AS score
           FROM weights w
           JOIN cv_chunks ch ON ch.search_vector @@ w.query ${readable('ch')}
           WHERE ch.embedding_model = $2
           GROUP BY ch.id
           ORDER BY score DESC, ch.id
           LIMIT $5
         ) f
       ),
       fused AS (
         SELECT id, sum(1.0 / ($6 + rank)) AS score
         FROM (SELECT * FROM vec UNION ALL SELECT * FROM fts) u
         GROUP BY id
         ORDER BY score DESC, id
         LIMIT $3
       )
       SELECT ch.id AS "chunkId", cf.candidate_id AS "candidateId", c.full_name AS "candidateName",
              app.id AS "applicationId", ch.section, ch.content
       FROM fused
       JOIN cv_chunks ch ON ch.id = fused.id ${readable('ch')}
       ORDER BY fused.score DESC, ch.id`,
      params,
    );
  });
}
