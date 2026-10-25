# Kết quả đo: after

- Thời điểm: 2026-10-22T12:35:32.780Z
- Máy: 11th Gen Intel(R) Core(TM) i7-11850H @ 2.50GHz · 16 luồng · RAM 16 GB · Node v22.22.0
- DB: ncc_intern_perf; 50 request mỗi kịch bản, 5 request đồng thời, 10 request làm nóng
- Từ khoá tìm: "binh doan"

## Endpoint

| Kịch bản | Query/request | p50 (ms) | p95 (ms) | max (ms) | Query chậm nhất (EXPLAIN ANALYZE) |
|---|---|---|---|---|---|
| Bảng hồ sơ – mặc định (mới nhất) | 4 (limit 100: 4) | 89.8 | 220 | 327.3 | 52.51 ms · Index Only Scan applications (IDX_applications_created_at_id) |
| Bảng hồ sơ – sắp theo điểm | 4 | 94.1 | 204.5 | 251.1 | 51.847 ms · Index Only Scan applications (IDX_applications_created_at_id) |
| Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm | 4 | 15 | 18.2 | 18.7 | 0.173 ms · Bitmap Heap Scan applications, Seq Scan jobs, Index Scan candidates (PK_140681296bf033ab1eb95288abb) |
| Bảng hồ sơ – lọc cờ thiếu MUST | 4 | 38.3 | 96 | 97.2 | 18.871 ms · Bitmap Heap Scan applications |
| Bảng hồ sơ – tìm tên không dấu | 4 | 18.5 | 33.8 | 34 | 1.171 ms · Bitmap Heap Scan candidates, Index Scan applications (IDX_applications_candidate_id) |
| Bảng hồ sơ – trang sâu (OFFSET 150.000) | 4 | 90.1 | 191.8 | 209.3 | 54.674 ms · Index Only Scan applications (IDX_applications_created_at_id) |
| Bảng hồ sơ – Hiring Manager (scope phòng) | 4 (limit 100: 4) | 15.1 | 17.1 | 19.4 | 3.042 ms · Seq Scan jobs, Index Only Scan applications (IDX_applications_job_id_status_score) |
| Danh sách job kèm pipeline | 4 (limit 100: 4) | 18 | 21.4 | 23 | 3.287 ms · Index Only Scan applications (IDX_applications_job_id_status_score) |
| Xếp hạng job đông hồ sơ nhất | 4 | 121.8 | 158.4 | 163.9 | 7.994 ms · Seq Scan candidates, Bitmap Heap Scan applications |
| Chi tiết hồ sơ | 3 | 11.5 | 13.6 | 17.9 | 0.048 ms · Seq Scan departments, Seq Scan users |
| Kho ứng viên – trang đầu | 3 (limit 100: 3) | 10.8 | 15.2 | 15.8 | 0.236 ms · Bitmap Heap Scan applications, Seq Scan jobs |
| Kho ứng viên – tìm không dấu | 3 | 11.3 | 15.4 | 16 | 0.939 ms · Bitmap Heap Scan candidates |
| Kho ứng viên – Hiring Manager | 3 | 11.7 | 18.7 | 19.3 | 0.461 ms · Index Scan candidates (IDX_candidates_created_at_id), Index Scan applications (IDX_applications_candidate_id), Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345) |
| Dashboard – Admin | 2 | 174.8 | 200.2 | 209.9 | 178.994 ms · Seq Scan applications, Seq Scan jobs |
| Dashboard – Hiring Manager | 2 | 58.6 | 69.8 | 72 | 51.354 ms · Seq Scan applications, Seq Scan jobs |

## Mô phỏng trước/sau (chạy thẳng trên DB, 30 lần)

| Bài toán | Cách làm | Số query | p50 (ms) | p95 (ms) |
|---|---|---|---|---|
| List hồ sơ 20 dòng | N+1: lấy ứng viên, job từng dòng | 41 | 6.1 | 8.8 |
| List hồ sơ 20 dòng | JOIN, chỉ chọn cột cần | 1 | 1 | 2.3 |
| Job kèm pipeline 20 job | Đếm từng job, từng nhóm | 80 | 16 | 20.9 |
| Job kèm pipeline 20 job | Một câu GROUP BY + COUNT FILTER | 1 | 3.1 | 3.9 |
| Dashboard | Nhiều query rời (tổng, từng trạng thái, từng job) | 210 | 132.8 | 224.6 |
| Dashboard | Một query tổng hợp theo job | 1 | 102.9 | 142.9 |
| Trang thứ 7.501 (20 dòng) | OFFSET 150.000 | 1 | 7.9 | 8.9 |
| Trang thứ 7.501 (20 dòng) | Cursor (created_at, id) | 1 | 0.2 | 0.4 |

## Kế hoạch thực thi

### Bảng hồ sơ – mặc định (mới nhất)

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" WHERE "app"."deleted_at" IS NULL
```

```
Finalize Aggregate  (cost=7010.30..7010.31 rows=1 width=4) (actual time=49.041..52.483 rows=1.00 loops=1)
  Buffers: shared hit=989
  ->  Gather  (cost=7010.09..7010.30 rows=2 width=8) (actual time=21.106..52.457 rows=3.00 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        Buffers: shared hit=989
        ->  Partial Aggregate  (cost=6010.09..6010.10 rows=1 width=8) (actual time=6.937..6.938 rows=1.00 loops=3)
              Buffers: shared hit=989
              ->  Parallel Index Only Scan using "IDX_applications_created_at_id" on applications app  (cost=0.42..5801.75 rows=83333 width=0) (actual time=0.004..4.479 rows=66666.67 loops=3)
                    Heap Fetches: 0
                    Index Searches: 1
                    Buffers: shared hit=989
Planning:
  Buffers: shared hit=1
Planning Time: 0.070 ms
Execution Time: 52.510 ms
```

### Bảng hồ sơ – sắp theo điểm

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" WHERE "app"."deleted_at" IS NULL
```

```
Finalize Aggregate  (cost=7010.30..7010.31 rows=1 width=4) (actual time=48.030..51.831 rows=1.00 loops=1)
  Buffers: shared hit=989
  ->  Gather  (cost=7010.09..7010.30 rows=2 width=8) (actual time=24.764..51.821 rows=3.00 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        Buffers: shared hit=989
        ->  Partial Aggregate  (cost=6010.09..6010.10 rows=1 width=8) (actual time=8.188..8.189 rows=1.00 loops=3)
              Buffers: shared hit=989
              ->  Parallel Index Only Scan using "IDX_applications_created_at_id" on applications app  (cost=0.42..5801.75 rows=83333 width=0) (actual time=0.003..4.935 rows=66666.67 loops=3)
                    Heap Fetches: 0
                    Index Searches: 1
                    Buffers: shared hit=989
Planning:
  Buffers: shared hit=1
Planning Time: 0.053 ms
Execution Time: 51.847 ms
```

### Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=103.40..347.51 rows=20 width=183) (actual time=0.097..0.147 rows=20.00 loops=1)
  Buffers: shared hit=150
  ->  Hash Join  (cost=103.11..181.36 rows=20 width=133) (actual time=0.091..0.112 rows=20.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=90
        ->  Bitmap Heap Scan on applications app  (cost=88.61..166.81 rows=20 width=82) (actual time=0.034..0.042 rows=20.00 loops=1)
              Recheck Cond: (id = ANY ('{f95fdb28-5c5b-4091-91da-c2cb6f86a406,ee680341-e4a4-42a1-b12a-2edfa3163466,e78f60ef-cb34-4ee2-9681-708c80e9f5b8,e64bdd44-a0b2-452e-963f-443d8b9bf3f9,e14ca354-8b31-453d-9ed0-8be737575f71,dd870b51-ab15-4908-bddc-bacf1b7f99f6,d7db15a9-f063-4664-b3b2-105f13e4a62e,ccde6f6b-74d2-4e95-8abf-941b037bb68f,ba4714ce-6910-4320-856c-60f32dcfd0f0,b99fc71d-d97d-41ee-bcba-c5b70b7a39f8,acd428fb-0389-4f83-b5bf-1c6d76d35f61,a8adc0bf-c3f1-4be9-b2ab-57a5f8dc801b,a138caaa-b36e-4d41-b92f-100a4c278b1a,8b57cf15-321c-4823-85d2-81de9f1ee47f,87dbd39d-5279-4d75-bd98-c1d345e75bc6,807ab025-332c-4974-a84f-638196611ff3,7eae2fb5-cd7f-4bc6-9b56-0fcc830d4550,74b5f5b6-9e90-4423-84bb-1b1bd257e807,6da5394d-f44e-4473-9971-f377bd0c1d0e,699f33e8-8be8-4f0b-810b-d67ca42a5837}'::uuid[]))
              Filter: (deleted_at IS NULL)
              Heap Blocks: exact=20
              Buffers: shared hit=80
              ->  Bitmap Index Scan on "PK_938c0a27255637bde919591888f"  (cost=0.00..88.55 rows=20 width=0) (actual time=0.028..0.028 rows=20.00 loops=1)
                    Index Cond: (id = ANY ('{f95fdb28-5c5b-4091-91da-c2cb6f86a406,ee680341-e4a4-42a1-b12a-2edfa3163466,e78f60ef-cb34-4ee2-9681-708c80e9f5b8,e64bdd44-a0b2-452e-963f-443d8b9bf3f9,e14ca354-8b31-453d-9ed0-8be737575f71,dd870b51-ab15-4908-bddc-bacf1b7f99f6,d7db15a9-f063-4664-b3b2-105f13e4a62e,ccde6f6b-74d2-4e95-8abf-941b037bb68f,ba4714ce-6910-4320-856c-60f32dcfd0f0,b99fc71d-d97d-41ee-bcba-c5b70b7a39f8,acd428fb-0389-4f83-b5bf-1c6d76d35f61,a8adc0bf-c3f1-4be9-b2ab-57a5f8dc801b,a138caaa-b36e-4d41-b92f-100a4c278b1a,8b57cf15-321c-4823-85d2-81de9f1ee47f,87dbd39d-5279-4d75-bd98-c1d345e75bc6,807ab025-332c-4974-a84f-638196611ff3,7eae2fb5-cd7f-4bc6-9b56-0fcc830d4550,74b5f5b6-9e90-4423-84bb-1b1bd257e807,6da5394d-f44e-4473-9971-f377bd0c1d0e,699f33e8-8be8-4f0b-810b-d67ca42a5837}'::uuid[]))
                    Index Searches: 20
                    Buffers: shared hit=60
        ->  Hash  (cost=12.00..12.00 rows=200 width=51) (actual time=0.051..0.051 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 25kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=51) (actual time=0.006..0.027 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=10
  ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=66) (actual time=0.001..0.001 rows=1.00 loops=20)
        Index Cond: (id = app.candidate_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 20
        Buffers: shared hit=60
Planning:
  Buffers: shared hit=21
Planning Time: 0.318 ms
Execution Time: 0.173 ms
```

### Bảng hồ sơ – lọc cờ thiếu MUST

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" WHERE ( "app"."flags" @> ARRAY['MISSING_MUST']::score_flag_enum[] ) AND ( "app"."deleted_at" IS NULL )
```

```
Aggregate  (cost=17653.09..17653.10 rows=1 width=4) (actual time=18.801..18.802 rows=1.00 loops=1)
  Buffers: shared hit=16141
  ->  Bitmap Heap Scan on applications app  (cost=407.79..17504.20 rows=59553 width=0) (actual time=5.223..17.053 rows=60193.00 loops=1)
        Recheck Cond: ((flags @> '{MISSING_MUST}'::score_flag_enum[]) AND (deleted_at IS NULL))
        Heap Blocks: exact=16128
        Buffers: shared hit=16141
        ->  Bitmap Index Scan on "IDX_applications_flags"  (cost=0.00..392.90 rows=59553 width=0) (actual time=3.650..3.651 rows=60193.00 loops=1)
              Index Cond: (flags @> '{MISSING_MUST}'::score_flag_enum[])
              Index Searches: 1
              Buffers: shared hit=13
Planning:
  Buffers: shared hit=1
Planning Time: 0.064 ms
Execution Time: 18.871 ms
```

### Bảng hồ sơ – tìm tên không dấu

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( (f_unaccent(lower("candidate"."full_name")) LIKE '%' || f_unaccent(lower($1)) || '%' OR "candidate"."email" LIKE '%' || lower($1) || '%') ) AND ( "app"."deleted_at" IS NULL )
```

```
Aggregate  (cost=391.22..391.24 rows=1 width=4) (actual time=1.097..1.098 rows=1.00 loops=1)
  Buffers: shared hit=181
  ->  Nested Loop  (cost=146.71..391.12 rows=40 width=0) (actual time=0.941..1.091 rows=76.00 loops=1)
        Buffers: shared hit=181
        ->  Bitmap Heap Scan on candidates candidate  (cost=146.29..185.82 rows=10 width=16) (actual time=0.931..1.016 rows=19.00 loops=1)
              Recheck Cond: (((f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text) AND (deleted_at IS NULL)) OR (((email)::text ~~ '%binh doan%'::text) AND (deleted_at IS NULL)))
              Rows Removed by Index Recheck: 13
              Heap Blocks: exact=32
              Buffers: shared hit=100
              ->  BitmapOr  (cost=146.29..146.29 rows=10 width=0) (actual time=0.891..0.891 rows=0.00 loops=1)
                    Buffers: shared hit=68
                    ->  Bitmap Index Scan on "IDX_candidates_full_name_trgm"  (cost=0.00..77.23 rows=5 width=0) (actual time=0.430..0.430 rows=32.00 loops=1)
                          Index Cond: (f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text)
                          Index Searches: 1
                          Buffers: shared hit=34
                    ->  Bitmap Index Scan on "IDX_candidates_email_trgm"  (cost=0.00..69.05 rows=5 width=0) (actual time=0.461..0.461 rows=32.00 loops=1)
                          Index Cond: ((email)::text ~~ '%binh doan%'::text)
                          Index Searches: 1
                          Buffers: shared hit=34
        ->  Index Scan using "IDX_applications_candidate_id" on applications app  (cost=0.42..20.49 rows=4 width=16) (actual time=0.003..0.003 rows=4.00 loops=19)
              Index Cond: (candidate_id = candidate.id)
              Filter: (deleted_at IS NULL)
              Index Searches: 19
              Buffers: shared hit=81
Planning:
  Buffers: shared hit=19
Planning Time: 0.226 ms
Execution Time: 1.171 ms
```

### Bảng hồ sơ – trang sâu (OFFSET 150.000)

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" WHERE "app"."deleted_at" IS NULL
```

```
Finalize Aggregate  (cost=7010.30..7010.31 rows=1 width=4) (actual time=50.828..54.642 rows=1.00 loops=1)
  Buffers: shared hit=989
  ->  Gather  (cost=7010.09..7010.30 rows=2 width=8) (actual time=26.132..54.634 rows=3.00 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        Buffers: shared hit=989
        ->  Partial Aggregate  (cost=6010.09..6010.10 rows=1 width=8) (actual time=8.621..8.621 rows=1.00 loops=3)
              Buffers: shared hit=989
              ->  Parallel Index Only Scan using "IDX_applications_created_at_id" on applications app  (cost=0.42..5801.75 rows=83333 width=0) (actual time=0.008..5.495 rows=66666.67 loops=3)
                    Heap Fetches: 0
                    Index Searches: 1
                    Buffers: shared hit=989
Planning:
  Buffers: shared hit=1
Planning Time: 0.102 ms
Execution Time: 54.674 ms
```

### Bảng hồ sơ – Hiring Manager (scope phòng)

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE ( "job"."department_id" = $1 ) AND ( "app"."deleted_at" IS NULL )
```

```
Aggregate  (cost=1182.05..1182.06 rows=1 width=4) (actual time=3.027..3.027 rows=1.00 loops=1)
  Buffers: shared hit=197
  ->  Nested Loop  (cost=0.42..1132.05 rows=20000 width=0) (actual time=0.011..2.359 rows=21064.00 loops=1)
        Buffers: shared hit=197
        ->  Seq Scan on jobs job  (cost=0.00..12.50 rows=20 width=16) (actual time=0.005..0.029 rows=20.00 loops=1)
              Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
              Rows Removed by Filter: 180
              Buffers: shared hit=10
        ->  Index Only Scan using "IDX_applications_job_id_status_score" on applications app  (cost=0.42..45.45 rows=1053 width=16) (actual time=0.005..0.070 rows=1053.20 loops=20)
              Index Cond: (job_id = job.id)
              Heap Fetches: 0
              Index Searches: 20
              Buffers: shared hit=187
Planning:
  Buffers: shared hit=5
Planning Time: 0.126 ms
Execution Time: 3.042 ms
```

### Danh sách job kèm pipeline

```sql
SELECT "app"."job_id" AS "jobId", COUNT(*) FILTER (WHERE "app"."status" = 'NEW')::int AS "new", COUNT(*) FILTER (WHERE "app"."status" IN ('SCREENING', 'INTERVIEW', 'OFFER'))::int AS "inProgress", COUNT(*) FILTER (WHERE "app"."status" = 'HIRED')::int AS "hired", COUNT(*) FILTER (WHERE "app"."status" IN ('REJECTED', 'WITHDRAWN'))::int AS "closed" FROM "applications" "app" WHERE ( "app"."job_id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL ) GROUP BY "app"."job_id"
```

```
GroupAggregate  (cost=0.42..1409.69 rows=190 width=32) (actual time=0.176..3.260 rows=20.00 loops=1)
  Group Key: job_id
  Buffers: shared hit=203
  ->  Index Only Scan using "IDX_applications_job_id_status_score" on applications app  (cost=0.42..907.57 rows=20982 width=20) (actual time=0.008..1.272 rows=20839.00 loops=1)
        Index Cond: (job_id = ANY ('{b852e9d8-356f-40ff-af7f-603f08141d9e,4b16d598-af09-4d71-9852-d8ecb063e248,5c7ccadf-936c-4a20-9a47-b9123498312f,6f0ba382-d5a2-43fc-bf42-872b5259b782,c245acb8-c619-4fc9-8ae6-5fd5762f6e38,31a966c3-da67-44c8-859f-6e503630edb2,fa288890-bb19-49a1-9a48-cb19f2dbc44e,5c3825e2-a915-492c-bf32-7b408f66fbb9,9e0473be-65f7-475e-99cc-56d5cf9bcd60,4199a40f-4ab9-4549-9df1-2fbe39ba6094,95ae48f2-b9a5-45a3-b630-f6f293cc1e39,342b61d8-5547-458c-aa48-d118a3bae2c1,a6ac16d6-9925-4500-ad48-4f46dd2c7721,ec136277-f6cf-4e37-9565-d78f07c293d5,8e396c97-e639-4977-bfb1-3fbe4bb48a7d,4347559c-bd00-4c89-b04a-de88d88ece38,d6b63515-7f5e-4338-9a03-75b82e4bcf79,5800b743-a0c1-4367-855f-a06e41c99029,6d6da2a3-6203-4878-b3ab-5eab40dd15aa,ccef917c-001b-4851-bb54-a85a4c32cb21}'::uuid[]))
        Heap Fetches: 0
        Index Searches: 19
        Buffers: shared hit=203
Planning:
  Buffers: shared hit=1
Planning Time: 0.096 ms
Execution Time: 3.287 ms
```

### Xếp hạng job đông hồ sơ nhất

```sql
SELECT "app"."id" AS "app_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."score_breakdown" AS "app_score_breakdown", "app"."flags" AS "app_flags", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name" FROM "applications" "app" INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."job_id" = $1 ) AND ( "app"."deleted_at" IS NULL ) ORDER BY "app_score" DESC NULLS LAST, "app_id" ASC
```

```
Sort  (cost=5220.02..5222.64 rows=1049 width=568) (actual time=7.775..7.801 rows=1151.00 loops=1)
  Sort Key: app.score DESC NULLS LAST, app.id
  Sort Method: quicksort  Memory: 721kB
  Buffers: shared hit=2039
  ->  Hash Join  (cost=3369.89..5167.38 rows=1049 width=568) (actual time=1.552..7.262 rows=1151.00 loops=1)
        Hash Cond: (candidate.id = app.candidate_id)
        Buffers: shared hit=2039
        ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=34) (actual time=0.007..3.140 rows=50000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=912
        ->  Hash  (cost=3356.78..3356.78 rows=1049 width=550) (actual time=1.540..1.540 rows=1151.00 loops=1)
              Buckets: 2048  Batches: 1  Memory Usage: 683kB
              Buffers: shared hit=1127
              ->  Bitmap Heap Scan on applications app  (cost=36.55..3356.78 rows=1049 width=550) (actual time=0.218..1.140 rows=1151.00 loops=1)
                    Recheck Cond: ((job_id = 'd748691f-65b5-4d7b-a1db-325f47069f8d'::uuid) AND (deleted_at IS NULL))
                    Heap Blocks: exact=1117
                    Buffers: shared hit=1127
                    ->  Bitmap Index Scan on "IDX_applications_job_id_status_score"  (cost=0.00..36.29 rows=1049 width=0) (actual time=0.132..0.132 rows=1151.00 loops=1)
                          Index Cond: (job_id = 'd748691f-65b5-4d7b-a1db-325f47069f8d'::uuid)
                          Index Searches: 1
                          Buffers: shared hit=10
Planning:
  Buffers: shared hit=17
Planning Time: 0.201 ms
Execution Time: 7.994 ms
```

### Chi tiết hồ sơ

```sql
SELECT "user"."id" AS "user_id", "user"."updated_at" AS "user_updated_at", "user"."deleted_at" AS "user_deleted_at", "user"."created_at" AS "user_created_at", "user"."email" AS "user_email", "user"."full_name" AS "user_full_name", "user"."role" AS "user_role", "user"."department_id" AS "user_department_id", "user"."is_active" AS "user_is_active", "user"."last_login_at" AS "user_last_login_at", "department"."id" AS "department_id", "department"."name" AS "department_name" FROM "users" "user" LEFT JOIN "departments" "department" ON "department"."id"="user"."department_id" AND ("department"."deleted_at" IS NULL) WHERE ( "user"."id" = $1 ) AND ( "user"."deleted_at" IS NULL )
```

```
Hash Right Join  (cost=1.39..2.52 rows=1 width=132) (actual time=0.028..0.031 rows=1.00 loops=1)
  Hash Cond: (department.id = "user".department_id)
  Buffers: shared hit=2
  ->  Seq Scan on departments department  (cost=0.00..1.10 rows=10 width=29) (actual time=0.010..0.011 rows=10.00 loops=1)
        Filter: (deleted_at IS NULL)
        Buffers: shared hit=1
  ->  Hash  (cost=1.38..1.38 rows=1 width=103) (actual time=0.014..0.014 rows=1.00 loops=1)
        Buckets: 1024  Batches: 1  Memory Usage: 9kB
        Buffers: shared hit=1
        ->  Seq Scan on users "user"  (cost=0.00..1.38 rows=1 width=103) (actual time=0.011..0.012 rows=1.00 loops=1)
              Filter: ((deleted_at IS NULL) AND (id = '710fdb62-248b-4a4f-9b89-635c0100db71'::uuid))
              Rows Removed by Filter: 29
              Buffers: shared hit=1
Planning:
  Buffers: shared hit=4
Planning Time: 0.159 ms
Execution Time: 0.048 ms
```

### Kho ứng viên – trang đầu

```sql
SELECT "app"."candidate_id" AS "candidateId", COUNT(*)::int AS "count", MAX("app"."created_at") AS "lastAppliedAt" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE ( "app"."candidate_id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL ) GROUP BY "app"."candidate_id"
```

```
GroupAggregate  (cost=410.72..412.52 rows=80 width=28) (actual time=0.173..0.187 rows=20.00 loops=1)
  Group Key: app.candidate_id
  Buffers: shared hit=93
  ->  Sort  (cost=410.72..410.92 rows=80 width=24) (actual time=0.170..0.173 rows=80.00 loops=1)
        Sort Key: app.candidate_id
        Sort Method: quicksort  Memory: 28kB
        Buffers: shared hit=93
        ->  Hash Join  (cost=103.57..408.19 rows=80 width=24) (actual time=0.100..0.154 rows=80.00 loops=1)
              Hash Cond: (app.job_id = job.id)
              Buffers: shared hit=93
              ->  Bitmap Heap Scan on applications app  (cost=89.07..393.48 rows=80 width=40) (actual time=0.043..0.083 rows=80.00 loops=1)
                    Recheck Cond: (candidate_id = ANY ('{e85763e1-a038-4526-8846-7d2161e0eda8,f1cb7114-2285-43d2-995c-df6290b94b9e,3fb1a7f8-3f08-4d67-8c8d-ed57fb6a0bfc,fe7e46db-2992-4b78-9373-602cd2c49759,80e419a2-51ae-44d5-b81d-2291b08ba5f6,c26bb13e-683e-4272-b75a-5ff992a48aac,4970c061-e124-4fe8-9e8e-c3acb6a36394,d67f894e-f362-4361-8474-f1c21a693da0,c28cf811-bb1d-4016-a3d2-ab1509a2336b,ddad4a02-278b-45a6-8560-ae9979977975,e7dc2633-878d-4c6d-870b-70f02234b362,c582a302-e3a6-425c-ab28-f0397c97185c,db2b2b9e-51c5-4524-bb7b-12e542ba691d,987017e2-f547-458d-9d54-86839ec874ff,f052d4ea-8232-40a8-9e8e-50b88464c2de,41728713-5803-42fc-8532-00749885c425,14cbb5b0-55a8-4456-afa1-f2e221012048,e2935e2e-be77-4e98-96d8-5065bc9a0b3d,878a6295-7f39-4d6a-9437-c8d4de6ee1bc,2725e928-2dea-4921-a7f9-6dbfe27200be}'::uuid[]))
                    Filter: (deleted_at IS NULL)
                    Heap Blocks: exact=26
                    Buffers: shared hit=83
                    ->  Bitmap Index Scan on "IDX_applications_candidate_id"  (cost=0.00..89.00 rows=80 width=0) (actual time=0.035..0.035 rows=80.00 loops=1)
                          Index Cond: (candidate_id = ANY ('{e85763e1-a038-4526-8846-7d2161e0eda8,f1cb7114-2285-43d2-995c-df6290b94b9e,3fb1a7f8-3f08-4d67-8c8d-ed57fb6a0bfc,fe7e46db-2992-4b78-9373-602cd2c49759,80e419a2-51ae-44d5-b81d-2291b08ba5f6,c26bb13e-683e-4272-b75a-5ff992a48aac,4970c061-e124-4fe8-9e8e-c3acb6a36394,d67f894e-f362-4361-8474-f1c21a693da0,c28cf811-bb1d-4016-a3d2-ab1509a2336b,ddad4a02-278b-45a6-8560-ae9979977975,e7dc2633-878d-4c6d-870b-70f02234b362,c582a302-e3a6-425c-ab28-f0397c97185c,db2b2b9e-51c5-4524-bb7b-12e542ba691d,987017e2-f547-458d-9d54-86839ec874ff,f052d4ea-8232-40a8-9e8e-50b88464c2de,41728713-5803-42fc-8532-00749885c425,14cbb5b0-55a8-4456-afa1-f2e221012048,e2935e2e-be77-4e98-96d8-5065bc9a0b3d,878a6295-7f39-4d6a-9437-c8d4de6ee1bc,2725e928-2dea-4921-a7f9-6dbfe27200be}'::uuid[]))
                          Index Searches: 19
                          Buffers: shared hit=57
              ->  Hash  (cost=12.00..12.00 rows=200 width=16) (actual time=0.052..0.053 rows=200.00 loops=1)
                    Buckets: 1024  Batches: 1  Memory Usage: 18kB
                    Buffers: shared hit=10
                    ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=16) (actual time=0.008..0.032 rows=200.00 loops=1)
                          Filter: (deleted_at IS NULL)
                          Buffers: shared hit=10
Planning:
  Buffers: shared hit=5
Planning Time: 0.207 ms
Execution Time: 0.236 ms
```

### Kho ứng viên – tìm không dấu

```sql
SELECT "candidate"."id" AS "candidate_id", "candidate"."updated_at" AS "candidate_updated_at", "candidate"."deleted_at" AS "candidate_deleted_at", "candidate"."created_at" AS "candidate_created_at", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "candidate"."consent_at" AS "candidate_consent_at", "candidate"."consent_version" AS "candidate_consent_version", "candidate"."anonymized_at" AS "candidate_anonymized_at", "candidate"."anonymized_by" AS "candidate_anonymized_by" FROM "candidates" "candidate" WHERE ( (f_unaccent(lower("candidate"."full_name")) LIKE '%' || f_unaccent(lower($1)) || '%' OR "candidate"."email" LIKE '%' || lower($1) || '%') ) AND ( "candidate"."deleted_at" IS NULL ) ORDER BY "candidate"."created_at" DESC, "candidate"."id" DESC LIMIT 21
```

```
Limit  (cost=185.99..186.01 rows=10 width=136) (actual time=0.875..0.877 rows=19.00 loops=1)
  Buffers: shared hit=100
  ->  Sort  (cost=185.99..186.01 rows=10 width=136) (actual time=0.875..0.875 rows=19.00 loops=1)
        Sort Key: created_at DESC, id DESC
        Sort Method: quicksort  Memory: 29kB
        Buffers: shared hit=100
        ->  Bitmap Heap Scan on candidates candidate  (cost=146.29..185.82 rows=10 width=136) (actual time=0.791..0.870 rows=19.00 loops=1)
              Recheck Cond: (((f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text) AND (deleted_at IS NULL)) OR (((email)::text ~~ '%binh doan%'::text) AND (deleted_at IS NULL)))
              Rows Removed by Index Recheck: 13
              Heap Blocks: exact=32
              Buffers: shared hit=100
              ->  BitmapOr  (cost=146.29..146.29 rows=10 width=0) (actual time=0.770..0.770 rows=0.00 loops=1)
                    Buffers: shared hit=68
                    ->  Bitmap Index Scan on "IDX_candidates_full_name_trgm"  (cost=0.00..77.23 rows=5 width=0) (actual time=0.385..0.385 rows=32.00 loops=1)
                          Index Cond: (f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text)
                          Index Searches: 1
                          Buffers: shared hit=34
                    ->  Bitmap Index Scan on "IDX_candidates_email_trgm"  (cost=0.00..69.05 rows=5 width=0) (actual time=0.384..0.384 rows=32.00 loops=1)
                          Index Cond: ((email)::text ~~ '%binh doan%'::text)
                          Index Searches: 1
                          Buffers: shared hit=34
Planning:
  Buffers: shared hit=4
Planning Time: 0.118 ms
Execution Time: 0.939 ms
```

### Kho ứng viên – Hiring Manager

```sql
SELECT "candidate"."id" AS "candidate_id", "candidate"."updated_at" AS "candidate_updated_at", "candidate"."deleted_at" AS "candidate_deleted_at", "candidate"."created_at" AS "candidate_created_at", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "candidate"."consent_at" AS "candidate_consent_at", "candidate"."consent_version" AS "candidate_consent_version", "candidate"."anonymized_at" AS "candidate_anonymized_at", "candidate"."anonymized_by" AS "candidate_anonymized_by" FROM "candidates" "candidate" WHERE ( EXISTS (SELECT 1 FROM "applications" "scope_app" INNER JOIN "jobs" "scope_job" ON "scope_job"."id" = "scope_app"."job_id" WHERE "scope_app"."candidate_id" = "candidate"."id" AND "scope_app"."deleted_at" IS NULL AND "scope_job"."deleted_at" IS NULL AND "scope_job"."department_id" = $1) ) AND ( "candidate"."deleted_at" IS NULL ) ORDER BY "candidate"."created_at" DESC, "candidate"."id" DESC LIMIT 21
```

```
Limit  (cost=0.85..138.34 rows=21 width=136) (actual time=0.025..0.437 rows=21.00 loops=1)
  Buffers: shared hit=593
  ->  Nested Loop Semi Join  (cost=0.85..130938.57 rows=20000 width=136) (actual time=0.024..0.435 rows=21.00 loops=1)
        Buffers: shared hit=593
        ->  Index Scan using "IDX_candidates_created_at_id" on candidates candidate  (cost=0.29..5394.18 rows=50000 width=136) (actual time=0.008..0.044 rows=50.00 loops=1)
              Index Searches: 1
              Buffers: shared hit=52
        ->  Nested Loop  (cost=0.56..2.50 rows=1 width=16) (actual time=0.008..0.008 rows=0.42 loops=50)
              Buffers: shared hit=541
              ->  Index Scan using "IDX_applications_candidate_id" on applications scope_app  (cost=0.42..1.84 rows=4 width=32) (actual time=0.003..0.003 rows=3.28 loops=50)
                    Index Cond: (candidate_id = candidate.id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 50
                    Buffers: shared hit=213
              ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs scope_job  (cost=0.14..0.17 rows=1 width=16) (actual time=0.001..0.001 rows=0.13 loops=164)
                    Index Cond: (id = scope_app.job_id)
                    Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                    Rows Removed by Filter: 1
                    Index Searches: 164
                    Buffers: shared hit=328
Planning:
  Buffers: shared hit=35
Planning Time: 0.486 ms
Execution Time: 0.461 ms
```

### Dashboard – Admin

```sql
SELECT "job"."id" AS "jobId", "job"."title" AS "title", "job"."status" AS "status", COUNT("app"."id")::int AS "total", COUNT("app"."id") FILTER (WHERE "app"."ai_status" = 'PROCESSING')::int AS "processing", COALESCE(SUM("app"."score"), 0)::int AS "scoreSum", COUNT("app"."score")::int AS "scored", json_build_object('NEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'NEW'), 'SCREENING', COUNT("app"."id") FILTER (WHERE "app"."status" = 'SCREENING'), 'INTERVIEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'INTERVIEW'), 'OFFER', COUNT("app"."id") FILTER (WHERE "app"."status" = 'OFFER'), 'HIRED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'HIRED'), 'REJECTED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'REJECTED'), 'WITHDRAWN', COUNT("app"."id") FILTER (WHERE "app"."status" = 'WITHDRAWN')) AS "byStatus" FROM "jobs" "job" LEFT JOIN "applications" "app" ON  "app"."job_id" = "job"."id" AND "app"."deleted_at" IS NULL WHERE "job"."deleted_at" IS NULL GROUP BY "job"."id"
```

```
HashAggregate  (cost=28902.62..28907.12 rows=200 width=103) (actual time=178.516..178.898 rows=200.00 loops=1)
  Group Key: job.id
  Batches: 1  Memory Usage: 96kB
  Buffers: shared hit=16354 read=8
  ->  Hash Right Join  (cost=14.50..18902.62 rows=200000 width=81) (actual time=0.148..115.521 rows=200010.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=16354 read=8
        ->  Seq Scan on applications app  (cost=0.00..18352.00 rows=200000 width=42) (actual time=0.011..52.231 rows=200000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=16344 read=8
        ->  Hash  (cost=12.00..12.00 rows=200 width=55) (actual time=0.131..0.132 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 26kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=55) (actual time=0.013..0.076 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=10
Planning:
  Buffers: shared hit=5
Planning Time: 0.430 ms
Execution Time: 178.994 ms
```

### Dashboard – Hiring Manager

```sql
SELECT "job"."id" AS "jobId", "job"."title" AS "title", "job"."status" AS "status", COUNT("app"."id")::int AS "total", COUNT("app"."id") FILTER (WHERE "app"."ai_status" = 'PROCESSING')::int AS "processing", COALESCE(SUM("app"."score"), 0)::int AS "scoreSum", COUNT("app"."score")::int AS "scored", json_build_object('NEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'NEW'), 'SCREENING', COUNT("app"."id") FILTER (WHERE "app"."status" = 'SCREENING'), 'INTERVIEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'INTERVIEW'), 'OFFER', COUNT("app"."id") FILTER (WHERE "app"."status" = 'OFFER'), 'HIRED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'HIRED'), 'REJECTED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'REJECTED'), 'WITHDRAWN', COUNT("app"."id") FILTER (WHERE "app"."status" = 'WITHDRAWN')) AS "byStatus" FROM "jobs" "job" LEFT JOIN "applications" "app" ON  "app"."job_id" = "job"."id" AND "app"."deleted_at" IS NULL WHERE ( "job"."department_id" = $1 ) AND ( "job"."deleted_at" IS NULL ) GROUP BY "job"."id"
```

```
HashAggregate  (cost=19900.88..19901.33 rows=20 width=103) (actual time=51.291..51.321 rows=20.00 loops=1)
  Group Key: job.id
  Batches: 1  Memory Usage: 32kB
  Buffers: shared hit=16362
  ->  Hash Right Join  (cost=12.75..18900.88 rows=20000 width=81) (actual time=0.044..47.043 rows=21064.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=16362
        ->  Seq Scan on applications app  (cost=0.00..18352.00 rows=200000 width=42) (actual time=0.009..33.409 rows=200000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=16352
        ->  Hash  (cost=12.50..12.50 rows=20 width=55) (actual time=0.032..0.032 rows=20.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 10kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.50 rows=20 width=55) (actual time=0.006..0.029 rows=20.00 loops=1)
                    Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                    Rows Removed by Filter: 180
                    Buffers: shared hit=10
Planning:
  Buffers: shared hit=5
Planning Time: 0.203 ms
Execution Time: 51.354 ms
```
