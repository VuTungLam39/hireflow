# Kết quả đo: phase5

- Thời điểm: 2026-11-13T05:19:18.575Z
- Máy: 11th Gen Intel(R) Core(TM) i7-11850H @ 2.50GHz · 16 luồng · RAM 16 GB · Node v22.22.0
- DB: ncc_intern_perf; 50 request mỗi kịch bản, 5 request đồng thời, 10 request làm nóng
- Từ khoá tìm: "binh doan"

## Endpoint

| Kịch bản | Query/request | p50 (ms) | p95 (ms) | max (ms) | Query chậm nhất (EXPLAIN ANALYZE) |
|---|---|---|---|---|---|
| Bảng hồ sơ – mặc định (mới nhất) | 4 (limit 100: 4) | 49.9 | 99.3 | 126.9 | 21.615 ms · Index Only Scan applications (IDX_applications_created_at_id) |
| Bảng hồ sơ – sắp theo điểm | 4 | 50.5 | 73.3 | 110.6 | 24.054 ms · Index Only Scan applications (IDX_applications_created_at_id) |
| Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm | 4 | 28.1 | 32.4 | 37.8 | 0.319 ms · Bitmap Heap Scan applications, Seq Scan jobs, Index Scan candidates (PK_140681296bf033ab1eb95288abb) |
| Bảng hồ sơ – lọc cờ thiếu MUST | 4 | 65 | 85.5 | 88.9 | 33.87 ms · Bitmap Heap Scan applications |
| Bảng hồ sơ – tìm tên không dấu | 4 | 37.2 | 44.9 | 48.2 | 2.29 ms · Bitmap Heap Scan candidates, Index Scan applications (IDX_applications_candidate_id) |
| Bảng hồ sơ – trang sâu (OFFSET 150.000) | 4 | 57 | 68.1 | 79.1 | 25.659 ms · Index Only Scan applications (IDX_applications_created_at_id) |
| Bảng hồ sơ – Hiring Manager (scope phòng) | 4 (limit 100: 4) | 45.5 | 53.9 | 65.8 | 6.388 ms · Seq Scan jobs, Index Only Scan applications (IDX_applications_job_id_status_score) |
| Danh sách job kèm pipeline | 4 (limit 100: 4) | 32.8 | 42.4 | 43.8 | 6.953 ms · Index Only Scan applications (IDX_applications_job_id_status_score) |
| Xếp hạng job đông hồ sơ nhất | 4 | 246 | 299.8 | 310.1 | 12.53 ms · Seq Scan candidates, Bitmap Heap Scan applications |
| Chi tiết hồ sơ | 3 | 25.2 | 32.3 | 34.5 | 0.059 ms · Index Scan applications (PK_938c0a27255637bde919591888f), Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345), Index Scan candidates (PK_140681296bf033ab1eb95288abb), Index Scan cv_files (PK_89bdf76e79a74acd27e46e1be82) |
| Kho ứng viên – trang đầu | 4 (limit 100: 4) | 31.2 | 42.3 | 44.8 | 8.086 ms · Seq Scan candidates |
| Kho ứng viên – tìm không dấu | 4 | 39.4 | 44.4 | 45.6 | 2.701 ms · Bitmap Heap Scan candidates |
| Kho ứng viên – Hiring Manager | 4 | 42.3 | 65.5 | 68.2 | 18.152 ms · Seq Scan candidates, Seq Scan jobs, Index Only Scan applications (UQ_applications_job_id_candidate_id) |
| Dashboard – Admin | 2 | 23.6 | 34.1 | 35.4 | 227.245 ms · Seq Scan applications, Seq Scan jobs |
| Dashboard – Hiring Manager | 2 | 12.8 | 22.1 | 22.5 | 114.409 ms · Seq Scan applications, Seq Scan jobs |
| Phễu tuyển dụng 90 ngày – Admin | 1 | 14.6 | 21.9 | 22.3 | 0.049 ms · Seq Scan departments, Seq Scan users |
| Phễu tuyển dụng – job đông nhất | 2 | 18.5 | 25 | 25.8 | 0.042 ms · Seq Scan departments, Seq Scan users |
| So sánh 3 hồ sơ | 5 | 36.9 | 50.2 | 52 | 0.059 ms · Index Scan applications (PK_938c0a27255637bde919591888f), Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345), Index Scan candidates (PK_140681296bf033ab1eb95288abb) |
| Lịch phỏng vấn 30 ngày – Admin | 3 | 311.4 | 377.5 | 378.7 | 12.775 ms · Seq Scan interview_assignees, Bitmap Heap Scan interviews, Seq Scan users, Seq Scan interview_feedbacks, Index Scan applications (PK_938c0a27255637bde919591888f), Index Scan candidates (PK_140681296bf033ab1eb95288abb), Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345) |
| Phỏng vấn tồn đọng – Admin | 3 | 102.4 | 111.4 | 115.7 | 3.213 ms · Bitmap Heap Scan interviews, Seq Scan users, Seq Scan interview_feedbacks, Index Only Scan interview_assignees (PK_interview_assignees), Index Scan applications (PK_938c0a27255637bde919591888f), Index Scan candidates (PK_140681296bf033ab1eb95288abb), Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345) |
| Lịch phỏng vấn – Interviewer | 3 | 29.6 | 44.2 | 46.7 | 2.223 ms · Bitmap Heap Scan interview_assignees, Bitmap Heap Scan interviews, Index Scan applications (PK_938c0a27255637bde919591888f), Index Scan interviews (IDX_interviews_application_id), Index Only Scan interview_assignees (PK_interview_assignees), Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345) |
| Bảng hồ sơ – Interviewer | 4 | 55.4 | 80.6 | 82.4 | 20.979 ms · Seq Scan interviews, Bitmap Heap Scan interview_assignees, Index Scan applications (PK_938c0a27255637bde919591888f), Seq Scan jobs |
| Thông báo – HR nhiều nhất | 3 | 40.3 | 47.1 | 48.7 | 15.056 ms · Bitmap Heap Scan notifications |
| Số thông báo chưa đọc – HR | 2 | 14.8 | 19.7 | 20.5 | 0.499 ms · Index Only Scan notifications (IDX_notifications_user_id_read_at_created_at) |
| Nhật ký kiểm toán – trang đầu | 2 | 21.4 | 36.4 | 36.5 | 0.162 ms · Index Scan users (PK_a3ffb1c0c8416b9fc6f907b7433) |
| Tin công khai – trang đầu | 2 | 15.4 | 22.8 | 23 | 0.195 ms · Seq Scan jobs, Seq Scan departments |

## Mô phỏng trước/sau (chạy thẳng trên DB, 30 lần)

| Bài toán | Cách làm | Số query | p50 (ms) | p95 (ms) |
|---|---|---|---|---|
| List hồ sơ 20 dòng | N+1: lấy ứng viên, job từng dòng | 41 | 35.4 | 44.9 |
| List hồ sơ 20 dòng | JOIN, chỉ chọn cột cần | 1 | 1.6 | 2.1 |
| Job kèm pipeline 20 job | Đếm từng job, từng nhóm | 80 | 87.7 | 110.2 |
| Job kèm pipeline 20 job | Một câu GROUP BY + COUNT FILTER | 1 | 4.1 | 6.1 |
| Dashboard | Nhiều query rời (tổng, từng trạng thái, từng job) | 210 | 313.8 | 365.6 |
| Dashboard | Một query tổng hợp theo job | 1 | 225.1 | 274.3 |
| Trang thứ 7.501 (20 dòng) | OFFSET 150.000 | 1 | 15.4 | 24.8 |
| Trang thứ 7.501 (20 dòng) | Cursor (created_at, id) | 1 | 1.1 | 1.4 |

## Kế hoạch thực thi

### Bảng hồ sơ – mặc định (mới nhất)

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" WHERE "app"."deleted_at" IS NULL
```

```
Finalize Aggregate  (cost=7898.30..7898.31 rows=1 width=4) (actual time=19.148..21.567 rows=1.00 loops=1)
  Buffers: shared hit=1212
  ->  Gather  (cost=7898.09..7898.30 rows=2 width=8) (actual time=18.921..21.555 rows=3.00 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        Buffers: shared hit=1212
        ->  Partial Aggregate  (cost=6898.09..6898.10 rows=1 width=8) (actual time=15.042..15.043 rows=1.00 loops=3)
              Buffers: shared hit=1212
              ->  Parallel Index Only Scan using "IDX_applications_created_at_id" on applications app  (cost=0.42..6689.75 rows=83333 width=0) (actual time=0.029..10.923 rows=66666.67 loops=3)
                    Heap Fetches: 0
                    Index Searches: 1
                    Buffers: shared hit=1212
Planning:
  Buffers: shared hit=1
Planning Time: 0.084 ms
Execution Time: 21.615 ms
```

### Bảng hồ sơ – sắp theo điểm

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" WHERE "app"."deleted_at" IS NULL
```

```
Finalize Aggregate  (cost=7898.30..7898.31 rows=1 width=4) (actual time=21.843..24.015 rows=1.00 loops=1)
  Buffers: shared hit=1212
  ->  Gather  (cost=7898.09..7898.30 rows=2 width=8) (actual time=21.766..24.007 rows=3.00 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        Buffers: shared hit=1212
        ->  Partial Aggregate  (cost=6898.09..6898.10 rows=1 width=8) (actual time=17.766..17.767 rows=1.00 loops=3)
              Buffers: shared hit=1212
              ->  Parallel Index Only Scan using "IDX_applications_created_at_id" on applications app  (cost=0.42..6689.75 rows=83333 width=0) (actual time=0.070..12.823 rows=66666.67 loops=3)
                    Heap Fetches: 0
                    Index Searches: 1
                    Buffers: shared hit=1212
Planning:
  Buffers: shared hit=1
Planning Time: 0.136 ms
Execution Time: 24.054 ms
```

### Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=104.40..348.51 rows=20 width=183) (actual time=0.198..0.288 rows=20.00 loops=1)
  Buffers: shared hit=151
  ->  Hash Join  (cost=104.11..182.36 rows=20 width=133) (actual time=0.166..0.191 rows=20.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=91
        ->  Bitmap Heap Scan on applications app  (cost=88.61..166.81 rows=20 width=82) (actual time=0.074..0.090 rows=20.00 loops=1)
              Recheck Cond: (id = ANY ('{f95fdb28-5c5b-4091-91da-c2cb6f86a406,ee680341-e4a4-42a1-b12a-2edfa3163466,e78f60ef-cb34-4ee2-9681-708c80e9f5b8,e64bdd44-a0b2-452e-963f-443d8b9bf3f9,e14ca354-8b31-453d-9ed0-8be737575f71,dd870b51-ab15-4908-bddc-bacf1b7f99f6,d7db15a9-f063-4664-b3b2-105f13e4a62e,ccde6f6b-74d2-4e95-8abf-941b037bb68f,ba4714ce-6910-4320-856c-60f32dcfd0f0,b99fc71d-d97d-41ee-bcba-c5b70b7a39f8,acd428fb-0389-4f83-b5bf-1c6d76d35f61,a8adc0bf-c3f1-4be9-b2ab-57a5f8dc801b,a138caaa-b36e-4d41-b92f-100a4c278b1a,8b57cf15-321c-4823-85d2-81de9f1ee47f,87dbd39d-5279-4d75-bd98-c1d345e75bc6,807ab025-332c-4974-a84f-638196611ff3,7eae2fb5-cd7f-4bc6-9b56-0fcc830d4550,74b5f5b6-9e90-4423-84bb-1b1bd257e807,6da5394d-f44e-4473-9971-f377bd0c1d0e,699f33e8-8be8-4f0b-810b-d67ca42a5837}'::uuid[]))
              Filter: (deleted_at IS NULL)
              Heap Blocks: exact=20
              Buffers: shared hit=80
              ->  Bitmap Index Scan on "PK_938c0a27255637bde919591888f"  (cost=0.00..88.55 rows=20 width=0) (actual time=0.067..0.068 rows=20.00 loops=1)
                    Index Cond: (id = ANY ('{f95fdb28-5c5b-4091-91da-c2cb6f86a406,ee680341-e4a4-42a1-b12a-2edfa3163466,e78f60ef-cb34-4ee2-9681-708c80e9f5b8,e64bdd44-a0b2-452e-963f-443d8b9bf3f9,e14ca354-8b31-453d-9ed0-8be737575f71,dd870b51-ab15-4908-bddc-bacf1b7f99f6,d7db15a9-f063-4664-b3b2-105f13e4a62e,ccde6f6b-74d2-4e95-8abf-941b037bb68f,ba4714ce-6910-4320-856c-60f32dcfd0f0,b99fc71d-d97d-41ee-bcba-c5b70b7a39f8,acd428fb-0389-4f83-b5bf-1c6d76d35f61,a8adc0bf-c3f1-4be9-b2ab-57a5f8dc801b,a138caaa-b36e-4d41-b92f-100a4c278b1a,8b57cf15-321c-4823-85d2-81de9f1ee47f,87dbd39d-5279-4d75-bd98-c1d345e75bc6,807ab025-332c-4974-a84f-638196611ff3,7eae2fb5-cd7f-4bc6-9b56-0fcc830d4550,74b5f5b6-9e90-4423-84bb-1b1bd257e807,6da5394d-f44e-4473-9971-f377bd0c1d0e,699f33e8-8be8-4f0b-810b-d67ca42a5837}'::uuid[]))
                    Index Searches: 20
                    Buffers: shared hit=60
        ->  Hash  (cost=13.00..13.00 rows=200 width=51) (actual time=0.088..0.088 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 25kB
              Buffers: shared hit=11
              ->  Seq Scan on jobs job  (cost=0.00..13.00 rows=200 width=51) (actual time=0.007..0.045 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=11
  ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=66) (actual time=0.004..0.004 rows=1.00 loops=20)
        Index Cond: (id = app.candidate_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 20
        Buffers: shared hit=60
Planning:
  Buffers: shared hit=21
Planning Time: 0.506 ms
Execution Time: 0.319 ms
```

### Bảng hồ sơ – lọc cờ thiếu MUST

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" WHERE ( "app"."flags" @> ARRAY['MISSING_MUST']::score_flag_enum[] ) AND ( "app"."deleted_at" IS NULL )
```

```
Aggregate  (cost=17658.78..17658.79 rows=1 width=4) (actual time=33.637..33.639 rows=1.00 loops=1)
  Buffers: shared hit=16139
  ->  Bitmap Heap Scan on applications app  (cost=409.79..17508.95 rows=59933 width=0) (actual time=8.870..30.655 rows=60174.00 loops=1)
        Recheck Cond: ((flags @> '{MISSING_MUST}'::score_flag_enum[]) AND (deleted_at IS NULL))
        Heap Blocks: exact=16125
        Buffers: shared hit=16139
        ->  Bitmap Index Scan on "IDX_applications_flags"  (cost=0.00..394.80 rows=59933 width=0) (actual time=7.107..7.108 rows=60174.00 loops=1)
              Index Cond: (flags @> '{MISSING_MUST}'::score_flag_enum[])
              Index Searches: 1
              Buffers: shared hit=14
Planning:
  Buffers: shared hit=1
Planning Time: 0.208 ms
Execution Time: 33.870 ms
```

### Bảng hồ sơ – tìm tên không dấu

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( (f_unaccent(lower("candidate"."full_name")) LIKE '%' || f_unaccent(lower($1)) || '%' OR "candidate"."email" LIKE '%' || lower($1) || '%') ) AND ( "app"."deleted_at" IS NULL )
```

```
Aggregate  (cost=391.22..391.23 rows=1 width=4) (actual time=2.255..2.256 rows=1.00 loops=1)
  Buffers: shared hit=186
  ->  Nested Loop  (cost=146.71..391.12 rows=40 width=0) (actual time=1.873..2.242 rows=76.00 loops=1)
        Buffers: shared hit=186
        ->  Bitmap Heap Scan on candidates candidate  (cost=146.29..185.82 rows=10 width=16) (actual time=1.799..1.976 rows=19.00 loops=1)
              Recheck Cond: (((f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text) AND (deleted_at IS NULL)) OR (((email)::text ~~ '%binh doan%'::text) AND (deleted_at IS NULL)))
              Rows Removed by Index Recheck: 14
              Heap Blocks: exact=33
              Buffers: shared hit=101
              ->  BitmapOr  (cost=146.29..146.29 rows=10 width=0) (actual time=1.745..1.746 rows=0.00 loops=1)
                    Buffers: shared hit=68
                    ->  Bitmap Index Scan on "IDX_candidates_full_name_trgm"  (cost=0.00..77.23 rows=5 width=0) (actual time=0.846..0.846 rows=33.00 loops=1)
                          Index Cond: (f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text)
                          Index Searches: 1
                          Buffers: shared hit=34
                    ->  Bitmap Index Scan on "IDX_candidates_email_trgm"  (cost=0.00..69.05 rows=5 width=0) (actual time=0.898..0.898 rows=33.00 loops=1)
                          Index Cond: ((email)::text ~~ '%binh doan%'::text)
                          Index Searches: 1
                          Buffers: shared hit=34
        ->  Index Scan using "IDX_applications_candidate_id" on applications app  (cost=0.42..20.49 rows=4 width=16) (actual time=0.011..0.013 rows=4.00 loops=19)
              Index Cond: (candidate_id = candidate.id)
              Filter: (deleted_at IS NULL)
              Index Searches: 19
              Buffers: shared hit=85
Planning:
  Buffers: shared hit=19
Planning Time: 0.374 ms
Execution Time: 2.290 ms
```

### Bảng hồ sơ – trang sâu (OFFSET 150.000)

```sql
SELECT "app"."id" AS "id" FROM "applications" "app" WHERE "app"."deleted_at" IS NULL ORDER BY "app"."created_at" DESC, "app"."id" DESC LIMIT 20 OFFSET 150000
```

```
Limit  (cost=5892.42..5893.21 rows=20 width=24) (actual time=25.633..25.638 rows=20.00 loops=1)
  Buffers: shared hit=896
  ->  Index Only Scan using "IDX_applications_created_at_id" on applications app  (cost=0.42..7856.42 rows=200000 width=24) (actual time=0.018..20.045 rows=150020.00 loops=1)
        Heap Fetches: 0
        Index Searches: 1
        Buffers: shared hit=896
Planning:
  Buffers: shared hit=1
Planning Time: 0.113 ms
Execution Time: 25.659 ms
```

### Bảng hồ sơ – Hiring Manager (scope phòng)

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE ( "job"."department_id" = $1 ) AND ( "app"."deleted_at" IS NULL )
```

```
Aggregate  (cost=1335.05..1335.06 rows=1 width=4) (actual time=6.362..6.363 rows=1.00 loops=1)
  Buffers: shared hit=236
  ->  Nested Loop  (cost=0.42..1285.05 rows=20000 width=0) (actual time=0.022..5.044 rows=21047.00 loops=1)
        Buffers: shared hit=236
        ->  Seq Scan on jobs job  (cost=0.00..13.50 rows=20 width=16) (actual time=0.008..0.043 rows=20.00 loops=1)
              Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
              Rows Removed by Filter: 180
              Buffers: shared hit=11
        ->  Index Only Scan using "IDX_applications_job_id_status_score" on applications app  (cost=0.42..53.05 rows=1053 width=16) (actual time=0.009..0.148 rows=1052.35 loops=20)
              Index Cond: (job_id = job.id)
              Heap Fetches: 0
              Index Searches: 20
              Buffers: shared hit=225
Planning:
  Buffers: shared hit=5
Planning Time: 0.375 ms
Execution Time: 6.388 ms
```

### Danh sách job kèm pipeline

```sql
SELECT "app"."job_id" AS "jobId", COUNT(*) FILTER (WHERE "app"."status" = 'NEW')::int AS "new", COUNT(*) FILTER (WHERE "app"."status" IN ('SCREENING', 'INTERVIEW', 'OFFER'))::int AS "inProgress", COUNT(*) FILTER (WHERE "app"."status" = 'HIRED')::int AS "hired", COUNT(*) FILTER (WHERE "app"."status" IN ('REJECTED', 'WITHDRAWN'))::int AS "closed" FROM "applications" "app" WHERE ( "app"."job_id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL ) GROUP BY "app"."job_id"
```

```
GroupAggregate  (cost=0.42..1558.63 rows=190 width=32) (actual time=0.474..6.930 rows=19.00 loops=1)
  Group Key: job_id
  Buffers: shared hit=214
  ->  Index Only Scan using "IDX_applications_job_id_status_score" on applications app  (cost=0.42..1058.24 rows=20909 width=20) (actual time=0.019..3.541 rows=20186.00 loops=1)
        Index Cond: (job_id = ANY ('{78851ec2-ca64-4db8-8917-33ae63adbd8c,59e2bc1d-d010-4588-94e5-048642df569b,bcf0abee-df80-4086-976e-5de77cb51424,900ed597-fffd-4e3d-bbf9-19a369552fc0,7542cf6f-d7a6-480b-90dd-3579494001cf,ae3f2119-c5f6-427a-bd79-4af0e84f7523,c4bcbde1-1c40-46d2-9a01-51ddc38248b1,90023c3f-ab3e-4adf-b21c-d95a43737fdf,87fa1737-7952-48da-a5ee-30bdfe98037a,a16c6f85-3551-457b-bab0-3a70cc81c9cc,bf67e8b4-7130-40f3-9ad8-2b9bcf95a1e1,9b5a43b8-a497-494b-bc44-abba6642b1fd,874f2944-6f09-4127-b845-14ff59e0cf12,21eed8a9-1905-4e4f-845a-c8e0e3e6da2e,e69ff7d4-523a-4836-b5fd-6e5af6a449f7,bb4e2e52-d0d4-4eba-a50d-2597321d0f31,0d26d3d7-5a55-4b43-bcc7-8b86f29eae54,85304a8f-6b78-4477-bbf5-0782cff3eb78,58003142-0e0b-42ee-aaa0-feea5e491e23,2ffe3acf-2c52-46c7-a8f6-956bf8c13804}'::uuid[]))
        Heap Fetches: 0
        Index Searches: 17
        Buffers: shared hit=214
Planning:
  Buffers: shared hit=1
Planning Time: 0.195 ms
Execution Time: 6.953 ms
```

### Xếp hạng job đông hồ sơ nhất

```sql
SELECT "app"."id" AS "app_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."score_breakdown" AS "app_score_breakdown", "app"."flags" AS "app_flags", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name" FROM "applications" "app" INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."job_id" = $1 ) AND ( "app"."deleted_at" IS NULL ) ORDER BY "app_score" DESC NULLS LAST, "app_id" ASC
```

```
Sort  (cost=5216.02..5218.64 rows=1045 width=569) (actual time=12.428..12.470 rows=1154.00 loops=1)
  Sort Key: app.score DESC NULLS LAST, app.id
  Sort Method: quicksort  Memory: 723kB
  Buffers: shared hit=2040
  ->  Hash Join  (cost=3366.20..5163.62 rows=1045 width=569) (actual time=2.433..11.788 rows=1154.00 loops=1)
        Hash Cond: (candidate.id = app.candidate_id)
        Buffers: shared hit=2040
        ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=34) (actual time=0.005..5.356 rows=50000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=912
        ->  Hash  (cost=3353.14..3353.14 rows=1045 width=551) (actual time=2.419..2.420 rows=1154.00 loops=1)
              Buckets: 2048  Batches: 1  Memory Usage: 684kB
              Buffers: shared hit=1128
              ->  Bitmap Heap Scan on applications app  (cost=44.52..3353.14 rows=1045 width=551) (actual time=0.229..1.842 rows=1154.00 loops=1)
                    Recheck Cond: ((job_id = '2ffe3acf-2c52-46c7-a8f6-956bf8c13804'::uuid) AND (deleted_at IS NULL))
                    Heap Blocks: exact=1118
                    Buffers: shared hit=1128
                    ->  Bitmap Index Scan on "IDX_applications_job_id_status_score"  (cost=0.00..44.26 rows=1045 width=0) (actual time=0.104..0.104 rows=1154.00 loops=1)
                          Index Cond: (job_id = '2ffe3acf-2c52-46c7-a8f6-956bf8c13804'::uuid)
                          Index Searches: 1
                          Buffers: shared hit=10
Planning:
  Buffers: shared hit=17
Planning Time: 0.395 ms
Execution Time: 12.530 ms
```

### Chi tiết hồ sơ

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."source" AS "app_source", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."ai_error" AS "app_ai_error", "app"."score" AS "app_score", "app"."score_breakdown" AS "app_score_breakdown", "app"."flags" AS "app_flags", "app"."scored_jd_version" AS "app_scored_jd_version", "job"."id" AS "job_id", "job"."title" AS "job_title", "job"."department_id" AS "job_department_id", "job"."jd_version" AS "job_jd_version", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "cvFile"."id" AS "cvFile_id", "cvFile"."original_name" AS "cvFile_original_name", "cvFile"."parse_status" AS "cvFile_parse_status", "cvFile"."text" AS "cvFile_text", "cvFile"."text_entered_at" AS "cvFile_text_entered_at" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL)  LEFT JOIN "cv_files" "cvFile" ON "cvFile"."id"="app"."cv_file_id" AND ("cvFile"."deleted_at" IS NULL) WHERE ( "app"."id" = $1 ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop Left Join  (cost=1.15..33.30 rows=1 width=1388) (actual time=0.026..0.028 rows=1.00 loops=1)
  Buffers: shared hit=12
  ->  Nested Loop  (cost=0.85..24.99 rows=1 width=764) (actual time=0.021..0.022 rows=1.00 loops=1)
        Buffers: shared hit=9
        ->  Nested Loop  (cost=0.56..16.68 rows=1 width=703) (actual time=0.015..0.016 rows=1.00 loops=1)
              Buffers: shared hit=6
              ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..8.44 rows=1 width=632) (actual time=0.009..0.010 rows=1.00 loops=1)
                    Index Cond: (id = '0000a052-1c96-4527-9b88-c1e941c31ece'::uuid)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 1
                    Buffers: shared hit=4
              ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..8.16 rows=1 width=71) (actual time=0.003..0.004 rows=1.00 loops=1)
                    Index Cond: (id = app.job_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 1
                    Buffers: shared hit=2
        ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=77) (actual time=0.004..0.004 rows=1.00 loops=1)
              Index Cond: (id = app.candidate_id)
              Filter: (deleted_at IS NULL)
              Index Searches: 1
              Buffers: shared hit=3
  ->  Index Scan using "PK_89bdf76e79a74acd27e46e1be82" on cv_files "cvFile"  (cost=0.29..8.31 rows=1 width=640) (actual time=0.004..0.004 rows=1.00 loops=1)
        Index Cond: (id = app.cv_file_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 1
        Buffers: shared hit=3
Planning:
  Buffers: shared hit=35
Planning Time: 0.566 ms
Execution Time: 0.059 ms
```

### Kho ứng viên – trang đầu

```sql
SELECT COUNT(1) AS "cnt" FROM "candidates" "candidate" WHERE "candidate"."deleted_at" IS NULL
```

```
Aggregate  (cost=1537.00..1537.01 rows=1 width=8) (actual time=8.071..8.072 rows=1.00 loops=1)
  Buffers: shared hit=912
  ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=0) (actual time=0.045..5.605 rows=50000.00 loops=1)
        Filter: (deleted_at IS NULL)
        Buffers: shared hit=912
Planning:
  Buffers: shared hit=2
Planning Time: 0.073 ms
Execution Time: 8.086 ms
```

### Kho ứng viên – tìm không dấu

```sql
SELECT COUNT(1) AS "cnt" FROM "candidates" "candidate" WHERE ( (f_unaccent(lower("candidate"."full_name")) LIKE '%' || f_unaccent(lower($1)) || '%' OR "candidate"."email" LIKE '%' || lower($1) || '%') ) AND ( "candidate"."deleted_at" IS NULL )
```

```
Aggregate  (cost=185.85..185.86 rows=1 width=8) (actual time=2.647..2.651 rows=1.00 loops=1)
  Buffers: shared hit=101
  ->  Bitmap Heap Scan on candidates candidate  (cost=146.29..185.82 rows=10 width=0) (actual time=2.327..2.635 rows=19.00 loops=1)
        Recheck Cond: (((f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text) AND (deleted_at IS NULL)) OR (((email)::text ~~ '%binh doan%'::text) AND (deleted_at IS NULL)))
        Rows Removed by Index Recheck: 14
        Heap Blocks: exact=33
        Buffers: shared hit=101
        ->  BitmapOr  (cost=146.29..146.29 rows=10 width=0) (actual time=2.235..2.238 rows=0.00 loops=1)
              Buffers: shared hit=68
              ->  Bitmap Index Scan on "IDX_candidates_full_name_trgm"  (cost=0.00..77.23 rows=5 width=0) (actual time=0.947..0.947 rows=33.00 loops=1)
                    Index Cond: (f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text)
                    Index Searches: 1
                    Buffers: shared hit=34
              ->  Bitmap Index Scan on "IDX_candidates_email_trgm"  (cost=0.00..69.05 rows=5 width=0) (actual time=1.287..1.287 rows=33.00 loops=1)
                    Index Cond: ((email)::text ~~ '%binh doan%'::text)
                    Index Searches: 1
                    Buffers: shared hit=34
Planning:
  Buffers: shared hit=4
Planning Time: 0.338 ms
Execution Time: 2.701 ms
```

### Kho ứng viên – Hiring Manager

```sql
SELECT COUNT(1) AS "cnt" FROM "candidates" "candidate" WHERE ( EXISTS (SELECT 1 FROM "applications" "scope_app" INNER JOIN "jobs" "scope_job" ON "scope_job"."id" = "scope_app"."job_id" WHERE "scope_app"."candidate_id" = "candidate"."id" AND "scope_app"."deleted_at" IS NULL AND "scope_job"."deleted_at" IS NULL AND "scope_job"."department_id" = $1) ) AND ( "candidate"."deleted_at" IS NULL )
```

```
Aggregate  (cost=3350.00..3350.01 rows=1 width=8) (actual time=18.113..18.115 rows=1.00 loops=1)
  Buffers: shared hit=1142
  ->  Hash Semi Join  (cost=1535.05..3300.14 rows=19941 width=0) (actual time=7.566..17.383 rows=18075.00 loops=1)
        Hash Cond: (candidate.id = scope_app.candidate_id)
        Buffers: shared hit=1142
        ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=16) (actual time=0.007..3.835 rows=50000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=912
        ->  Hash  (cost=1285.05..1285.05 rows=20000 width=16) (actual time=7.542..7.543 rows=21047.00 loops=1)
              Buckets: 32768  Batches: 1  Memory Usage: 1243kB
              Buffers: shared hit=230
              ->  Nested Loop  (cost=0.42..1285.05 rows=20000 width=16) (actual time=0.023..4.628 rows=21047.00 loops=1)
                    Buffers: shared hit=230
                    ->  Seq Scan on jobs scope_job  (cost=0.00..13.50 rows=20 width=16) (actual time=0.003..0.057 rows=20.00 loops=1)
                          Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                          Rows Removed by Filter: 180
                          Buffers: shared hit=11
                    ->  Index Only Scan using "UQ_applications_job_id_candidate_id" on applications scope_app  (cost=0.42..53.05 rows=1053 width=32) (actual time=0.010..0.149 rows=1052.35 loops=20)
                          Index Cond: (job_id = scope_job.id)
                          Heap Fetches: 0
                          Index Searches: 20
                          Buffers: shared hit=219
Planning:
  Buffers: shared hit=21
Planning Time: 0.426 ms
Execution Time: 18.152 ms
```

### Dashboard – Admin

```sql
SELECT "job"."id" AS "jobId", "job"."title" AS "title", "job"."status" AS "status", COUNT("app"."id")::int AS "total", COUNT("app"."id") FILTER (WHERE "app"."ai_status" = 'PROCESSING')::int AS "processing", COALESCE(SUM("app"."score"), 0)::int AS "scoreSum", COUNT("app"."score")::int AS "scored", json_build_object('NEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'NEW'), 'SCREENING', COUNT("app"."id") FILTER (WHERE "app"."status" = 'SCREENING'), 'INTERVIEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'INTERVIEW'), 'OFFER', COUNT("app"."id") FILTER (WHERE "app"."status" = 'OFFER'), 'HIRED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'HIRED'), 'REJECTED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'REJECTED'), 'WITHDRAWN', COUNT("app"."id") FILTER (WHERE "app"."status" = 'WITHDRAWN')) AS "byStatus" FROM "jobs" "job" LEFT JOIN "applications" "app" ON  "app"."job_id" = "job"."id" AND "app"."deleted_at" IS NULL WHERE "job"."deleted_at" IS NULL GROUP BY "job"."id"
```

```
HashAggregate  (cost=28901.62..28906.12 rows=200 width=103) (actual time=226.276..227.189 rows=200.00 loops=1)
  Group Key: job.id
  Batches: 1  Memory Usage: 96kB
  Buffers: shared hit=12384 read=3977
  ->  Hash Right Join  (cost=15.50..18901.62 rows=200000 width=81) (actual time=0.573..164.989 rows=200010.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=12384 read=3977
        ->  Seq Scan on applications app  (cost=0.00..18350.00 rows=200000 width=42) (actual time=0.476..107.399 rows=200000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=12373 read=3977
        ->  Hash  (cost=13.00..13.00 rows=200 width=55) (actual time=0.093..0.094 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 26kB
              Buffers: shared hit=11
              ->  Seq Scan on jobs job  (cost=0.00..13.00 rows=200 width=55) (actual time=0.005..0.063 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=11
Planning:
  Buffers: shared hit=8
Planning Time: 0.247 ms
Execution Time: 227.245 ms
```

### Dashboard – Hiring Manager

```sql
SELECT "job"."id" AS "jobId", "job"."title" AS "title", "job"."status" AS "status", COUNT("app"."id")::int AS "total", COUNT("app"."id") FILTER (WHERE "app"."ai_status" = 'PROCESSING')::int AS "processing", COALESCE(SUM("app"."score"), 0)::int AS "scoreSum", COUNT("app"."score")::int AS "scored", json_build_object('NEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'NEW'), 'SCREENING', COUNT("app"."id") FILTER (WHERE "app"."status" = 'SCREENING'), 'INTERVIEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'INTERVIEW'), 'OFFER', COUNT("app"."id") FILTER (WHERE "app"."status" = 'OFFER'), 'HIRED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'HIRED'), 'REJECTED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'REJECTED'), 'WITHDRAWN', COUNT("app"."id") FILTER (WHERE "app"."status" = 'WITHDRAWN')) AS "byStatus" FROM "jobs" "job" LEFT JOIN "applications" "app" ON  "app"."job_id" = "job"."id" AND "app"."deleted_at" IS NULL WHERE ( "job"."department_id" = $1 ) AND ( "job"."deleted_at" IS NULL ) GROUP BY "job"."id"
```

```
HashAggregate  (cost=19899.88..19900.33 rows=20 width=103) (actual time=114.323..114.368 rows=20.00 loops=1)
  Group Key: job.id
  Batches: 1  Memory Usage: 32kB
  Buffers: shared hit=12572 read=3789
  ->  Hash Right Join  (cost=13.75..18899.88 rows=20000 width=81) (actual time=0.233..107.451 rows=21047.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=12572 read=3789
        ->  Seq Scan on applications app  (cost=0.00..18350.00 rows=200000 width=42) (actual time=0.184..85.125 rows=200000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=12561 read=3789
        ->  Hash  (cost=13.50..13.50 rows=20 width=55) (actual time=0.045..0.046 rows=20.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 10kB
              Buffers: shared hit=11
              ->  Seq Scan on jobs job  (cost=0.00..13.50 rows=20 width=55) (actual time=0.006..0.039 rows=20.00 loops=1)
                    Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                    Rows Removed by Filter: 180
                    Buffers: shared hit=11
Planning:
  Buffers: shared hit=5
Planning Time: 0.215 ms
Execution Time: 114.409 ms
```

### Phễu tuyển dụng 90 ngày – Admin

```sql
SELECT "user"."id" AS "user_id", "user"."updated_at" AS "user_updated_at", "user"."deleted_at" AS "user_deleted_at", "user"."created_at" AS "user_created_at", "user"."email" AS "user_email", "user"."full_name" AS "user_full_name", "user"."role" AS "user_role", "user"."department_id" AS "user_department_id", "user"."is_active" AS "user_is_active", "user"."last_login_at" AS "user_last_login_at", "department"."id" AS "department_id", "department"."name" AS "department_name" FROM "users" "user" LEFT JOIN "departments" "department" ON "department"."id"="user"."department_id" AND ("department"."deleted_at" IS NULL) WHERE ( "user"."id" = $1 ) AND ( "user"."deleted_at" IS NULL )
```

```
Hash Right Join  (cost=2.64..3.76 rows=1 width=132) (actual time=0.028..0.030 rows=1.00 loops=1)
  Hash Cond: (department.id = "user".department_id)
  Buffers: shared hit=3
  ->  Seq Scan on departments department  (cost=0.00..1.10 rows=10 width=29) (actual time=0.007..0.008 rows=10.00 loops=1)
        Filter: (deleted_at IS NULL)
        Buffers: shared hit=1
  ->  Hash  (cost=2.62..2.62 rows=1 width=103) (actual time=0.016..0.016 rows=1.00 loops=1)
        Buckets: 1024  Batches: 1  Memory Usage: 9kB
        Buffers: shared hit=2
        ->  Seq Scan on users "user"  (cost=0.00..2.62 rows=1 width=103) (actual time=0.014..0.014 rows=1.00 loops=1)
              Filter: ((deleted_at IS NULL) AND (id = '710fdb62-248b-4a4f-9b89-635c0100db71'::uuid))
              Rows Removed by Filter: 49
              Buffers: shared hit=2
Planning:
  Buffers: shared hit=4
Planning Time: 0.172 ms
Execution Time: 0.049 ms
```

### Phễu tuyển dụng – job đông nhất

```sql
SELECT "user"."id" AS "user_id", "user"."updated_at" AS "user_updated_at", "user"."deleted_at" AS "user_deleted_at", "user"."created_at" AS "user_created_at", "user"."email" AS "user_email", "user"."full_name" AS "user_full_name", "user"."role" AS "user_role", "user"."department_id" AS "user_department_id", "user"."is_active" AS "user_is_active", "user"."last_login_at" AS "user_last_login_at", "department"."id" AS "department_id", "department"."name" AS "department_name" FROM "users" "user" LEFT JOIN "departments" "department" ON "department"."id"="user"."department_id" AND ("department"."deleted_at" IS NULL) WHERE ( "user"."id" = $1 ) AND ( "user"."deleted_at" IS NULL )
```

```
Hash Right Join  (cost=2.64..3.76 rows=1 width=132) (actual time=0.021..0.023 rows=1.00 loops=1)
  Hash Cond: (department.id = "user".department_id)
  Buffers: shared hit=3
  ->  Seq Scan on departments department  (cost=0.00..1.10 rows=10 width=29) (actual time=0.002..0.003 rows=10.00 loops=1)
        Filter: (deleted_at IS NULL)
        Buffers: shared hit=1
  ->  Hash  (cost=2.62..2.62 rows=1 width=103) (actual time=0.014..0.014 rows=1.00 loops=1)
        Buckets: 1024  Batches: 1  Memory Usage: 9kB
        Buffers: shared hit=2
        ->  Seq Scan on users "user"  (cost=0.00..2.62 rows=1 width=103) (actual time=0.012..0.012 rows=1.00 loops=1)
              Filter: ((deleted_at IS NULL) AND (id = '710fdb62-248b-4a4f-9b89-635c0100db71'::uuid))
              Rows Removed by Filter: 49
              Buffers: shared hit=2
Planning:
  Buffers: shared hit=4
Planning Time: 0.141 ms
Execution Time: 0.042 ms
```

### So sánh 3 hồ sơ

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."source" AS "app_source", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."score_breakdown" AS "app_score_breakdown", "app"."flags" AS "app_flags", "app"."scored_jd_version" AS "app_scored_jd_version", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."id" IN ($1, $2, $3) AND "app"."job_id" = $4 ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=0.85..41.80 rows=1 width=684) (actual time=0.021..0.041 rows=3.00 loops=1)
  Buffers: shared hit=27
  ->  Nested Loop  (cost=0.56..33.49 rows=1 width=634) (actual time=0.015..0.028 rows=3.00 loops=1)
        Buffers: shared hit=18
        ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..25.32 rows=1 width=583) (actual time=0.010..0.018 rows=3.00 loops=1)
              Index Cond: (id = ANY ('{3ecbbcdd-1bd2-43c5-a663-fc41560eddcb,50bf6f24-27c5-4e87-8c1c-349e9ac4d625,2be04de5-7fb6-431f-9388-6ce4ff35cced}'::uuid[]))
              Filter: ((deleted_at IS NULL) AND (job_id = '2ffe3acf-2c52-46c7-a8f6-956bf8c13804'::uuid))
              Index Searches: 3
              Buffers: shared hit=12
        ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..8.16 rows=1 width=51) (actual time=0.002..0.002 rows=1.00 loops=3)
              Index Cond: (id = '2ffe3acf-2c52-46c7-a8f6-956bf8c13804'::uuid)
              Filter: (deleted_at IS NULL)
              Index Searches: 3
              Buffers: shared hit=6
  ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=66) (actual time=0.003..0.003 rows=1.00 loops=3)
        Index Cond: (id = app.candidate_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 3
        Buffers: shared hit=9
Planning:
  Buffers: shared hit=17
Planning Time: 0.322 ms
Execution Time: 0.059 ms
```

### Lịch phỏng vấn 30 ngày – Admin

```sql
SELECT "iv"."id" AS "iv_id", "iv"."application_id" AS "iv_application_id", "iv"."round" AS "iv_round", "iv"."scheduled_at" AS "iv_scheduled_at", "iv"."duration_minutes" AS "iv_duration_minutes", "iv"."location" AS "iv_location", "iv"."status" AS "iv_status", "iv"."cancel_reason" AS "iv_cancel_reason", "iv"."created_by" AS "iv_created_by", "iv"."created_at" AS "iv_created_at", "iv"."updated_at" AS "iv_updated_at", "ia"."interview_id" AS "ia_interview_id", "ia"."user_id" AS "ia_user_id", "au"."id" AS "au_id", "au"."email" AS "au_email", "au"."full_name" AS "au_full_name", "fb"."id" AS "fb_id", "fb"."interview_id" AS "fb_interview_id", "fb"."author_id" AS "fb_author_id", "fb"."overall" AS "fb_overall", "fb"."ratings" AS "fb_ratings", "fb"."comment" AS "fb_comment", "fb"."editable_until" AS "fb_editable_until", "fb"."submitted_at" AS "fb_submitted_at", "fb"."updated_at" AS "fb_updated_at", "fa"."id" AS "fa_id", "fa"."full_name" AS "fa_full_name", "app"."id" AS "app_id", "app"."status" AS "app_status", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "job"."id" AS "job_id", "job"."title" AS "job_title" FROM "interviews" "iv" LEFT JOIN "interview_assignees" "ia" ON "ia"."interview_id"="iv"."id"  LEFT JOIN "users" "au" ON "au"."id"="ia"."user_id" AND ("au"."deleted_at" IS NULL)  LEFT JOIN "interview_feedbacks" "fb" ON "fb"."interview_id"="iv"."id"  LEFT JOIN "users" "fa" ON "fa"."id"="fb"."author_id" AND ("fa"."deleted_at" IS NULL)  LEFT JOIN "applications" "app" ON "app"."id"="iv"."application_id" AND ("app"."deleted_at" IS NULL)  LEFT JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL)  LEFT JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE "iv"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65, $66, $67, $68, $69, $70, $71, $72, $73, $74, $75, $76, $77, $78, $79, $80, $81, $82, $83, $84, $85, $86, $87, $88, $89, $90, $91, $92, $93, $94, $95, $96, $97, $98, $99, $100, $101, $102, $103, $104, $105, $106, $107, $108, $109, $110, $111, $112, $113, $114, $115, $116, $117, $118, $119, $120, $121, $122, $123, $124, $125, $126, $127, $128, $129, $130, $131, $132, $133, $134, $135, $136, $137, $138, $139, $140, $141, $142, $143, $144, $145, $146, $147, $148, $149, $150, $151, $152, $153, $154, $155, $156, $157, $158, $159, $160, $161, $162, $163, $164, $165, $166, $167, $168, $169, $170, $171, $172, $173, $174, $175, $176, $177, $178, $179, $180, $181, $182, $183, $184, $185, $186, $187, $188, $189, $190, $191, $192, $193, $194, $195, $196, $197, $198, $199, $200, $201, $202, $203, $204, $205, $206, $207, $208, $209, $210, $211, $212, $213, $214, $215, $216, $217, $218, $219, $220, $221, $222, $223, $224, $225, $226, $227, $228, $229, $230, $231, $232, $233, $234, $235, $236, $237, $238, $239, $240, $241, $242, $243, $244, $245, $246, $247, $248, $249, $250, $251, $252, $253, $254, $255, $256, $257, $258, $259, $260, $261, $262, $263, $264, $265, $266, $267, $268, $269, $270, $271, $272, $273, $274, $275, $276, $277, $278, $279, $280, $281, $282, $283, $284, $285, $286, $287, $288, $289, $290, $291, $292, $293, $294, $295, $296, $297, $298, $299, $300, $301, $302, $303, $304, $305, $306, $307, $308, $309, $310, $311, $312, $313, $314, $315, $316, $317, $318, $319, $320, $321, $322, $323, $324, $325, $326, $327, $328, $329, $330, $331, $332, $333, $334, $335, $336, $337, $338, $339, $340, $341, $342, $343, $344, $345, $346, $347, $348, $349, $350, $351, $352, $353, $354, $355, $356, $357, $358, $359, $360, $361, $362, $363, $364, $365, $366, $367, $368, $369, $370, $371, $372, $373, $374, $375, $376, $377, $378, $379, $380, $381, $382, $383, $384, $385, $386, $387, $388, $389, $390, $391, $392, $393, $394, $395, $396, $397, $398, $399, $400, $401, $402, $403, $404, $405, $406, $407, $408, $409, $410, $411, $412, $413, $414, $415, $416, $417, $418, $419, $420, $421, $422, $423, $424, $425, $426, $427, $428, $429, $430, $431, $432, $433, $434, $435, $436, $437, $438, $439, $440, $441, $442, $443, $444, $445, $446, $447, $448, $449, $450, $451, $452, $453, $454, $455, $456, $457, $458, $459, $460, $461, $462, $463, $464, $465, $466, $467, $468, $469, $470, $471, $472, $473, $474, $475, $476, $477, $478, $479, $480, $481, $482, $483, $484, $485, $486, $487, $488, $489, $490, $491, $492, $493, $494, $495, $496, $497, $498, $499, $500) ORDER BY "iv"."scheduled_at" ASC, "au_full_name" ASC
```

```
Sort  (cost=6275.28..6276.53 rows=500 width=493) (actual time=12.628..12.680 rows=500.00 loops=1)
  Sort Key: iv.scheduled_at, au.full_name
  Sort Method: quicksort  Memory: 186kB
  Buffers: shared hit=5042
  ->  Nested Loop Left Join  (cost=1192.80..6252.87 rows=500 width=493) (actual time=1.510..12.257 rows=500.00 loops=1)
        Buffers: shared hit=5042
        ->  Nested Loop Left Join  (cost=1192.65..6209.39 rows=500 width=458) (actual time=1.501..11.731 rows=500.00 loops=1)
              Buffers: shared hit=4734
              ->  Nested Loop Left Join  (cost=1192.36..6043.83 rows=500 width=440) (actual time=1.494..10.416 rows=500.00 loops=1)
                    Buffers: shared hit=3234
                    ->  Hash Left Join  (cost=1191.94..2237.08 rows=500 width=388) (actual time=1.482..8.386 rows=500.00 loops=1)
                          Hash Cond: (ia.user_id = au.id)
                          Buffers: shared hit=1234
                          ->  Hash Left Join  (cost=1188.81..2232.53 rows=500 width=338) (actual time=1.451..8.231 rows=500.00 loops=1)
                                Hash Cond: (iv.id = fb.interview_id)
                                Buffers: shared hit=1232
                                ->  Hash Right Join  (cost=1186.09..2227.93 rows=500 width=166) (actual time=1.444..8.110 rows=500.00 loops=1)
                                      Hash Cond: (ia.interview_id = iv.id)
                                      Buffers: shared hit=1232
                                      ->  Seq Scan on interview_assignees ia  (cost=0.00..905.05 rows=52105 width=32) (actual time=0.007..2.427 rows=52105.00 loops=1)
                                            Buffers: shared hit=384
                                      ->  Hash  (cost=1179.84..1179.84 rows=500 width=134) (actual time=1.419..1.421 rows=500.00 loops=1)
                                            Buckets: 1024  Batches: 1  Memory Usage: 83kB
                                            Buffers: shared hit=848
                                            ->  Bitmap Heap Scan on interviews iv  (cost=356.16..1179.84 rows=500 width=134) (actual time=0.795..1.311 rows=500.00 loops=1)
                                                  Recheck Cond: (id = ANY ('{181ef8fd-5ca4-485b-af5e-fba3a70aa3ed,aa5cafc3-6c36-48c2-b536-1f57ceb0f3ea,f02038d6-fbca-4855-8b85-15c882c7eb19,80a4cfbf-79d1-4209-afee-c10ec093d9d9,5ce380ba-d391-4bd0-94ba-3ef681c830d0,23b27af1-c7bb-4439-87fe-3524c9699ed4,38b5c818-9ab0-4928-be63-5e2d06e6550e,a3c7edf1-421b-463d-b5e5-eed2195b733a,f02279a3-9dfb-4c59-b1c4-b9c6730a79ef,74b6ad27-5820-4015-9900-7fa5b74df4ba,ccb836d9-565e-469e-97df-f03afe10eea1,13dfb1da-9177-4be7-a82c-ade1292f2eda,dc66fd28-82c2-41f3-aceb-81459cea6565,f977f0c3-576a-475c-aa57-d87b33fa3c63,33482d29-ad15-4aaf-8da6-401f1f10838e,9a747762-4f6f-4744-8c11-6a7be8990a53,15597309-13f8-4ec9-9cef-848f986d92b7,ad7b1439-56e9-41cb-9da7-fdf7cc43ec6b,4255bdcd-b5d7-4355-86d2-0a31ff4692b1,cf749624-a2b5-471d-a577-06e3340ed6ae,b6314274-39ba-4297-bff2-cc252b3da0e1,d474c4db-1e08-44e6-9732-9cecc7cbb59f,7d3de631-c755-4443-bb41-2c23f799bc7d,a9daeb07-1a98-4e84-8a39-388f75658de3,2e7c67f1-98c2-46ea-a429-eba425c02078,7a1e629c-feab-4720-a002-2017e0602162,04d7af57-9db0-4ec8-adb1-bd468ba91634,46c146bf-ce61-4b9f-893a-c1a6c8c8e62b,b571aeb7-0959-48d4-af34-6b1b0af58f72,e4922d4b-a3fb-4be8-8030-dc76c04a7943,42fdffd3-9878-400e-b5db-b18e0fe9a6a6,b386c373-fcb0-4e0f-9e94-e391acff41b3,c68a9fc7-e89a-42f1-948b-d51a62abf1b8,ff2bf763-0204-43e6-bf3a-1096bf14a602,548b4199-69c9-4c33-8431-125963f345cb,1483be98-355e-4c80-b24a-9a86e703e8de,bb4b7ef2-2dca-45b2-bf40-3fbfa237f1d0,4f5099bd-bf2f-41ea-9751-9e8c7472487e,2d5a328d-3acc-4c9e-92ad-3dcd67961b36,a2efb411-cc9c-4b56-a48c-ea2b52ff0cad,5bfc0a42-13cc-4b44-a039-cd3dd628ec0a,dbd85365-68c5-468a-9ee3-1cde57157cb7,2c9e72fe-eb14-4a59-88b6-34570e4a411e,c4a1b56a-6a04-4d13-b109-f1d0e2cfe436,bdf8c526-ff89-4c9a-a100-8ac9d41f7a0b,075a8158-2ce3-4990-b5b0-9089bbb60b4b,abd223e1-bb8b-45c7-893a-3c4c2bb48cec,b64d35a1-df84-4c51-a488-f7f07654b388,ec6c6e5b-180e-4a89-b290-c3a7287db0e8,d43085c2-f8cf-4a74-b1f4-41589810e33a,194e3e16-2427-4520-bf53-85fc1e6aa3cb,c40b6f39-0360-4496-934c-641e5ada8181,593c72dd-93fa-4c5f-9121-b857d48ac677,9d3c59ae-80b1-4146-b43a-a14a31a2fc70,c4d62212-65ad-4042-b0c1-0726f42c05c2,8eed89a5-4c25-4388-ada7-85b3406c3676,63545b11-6045-422c-a1bc-911978decc42,967e080d-aab9-4b51-98f2-e9f5262e2b1b,b5763a61-2335-4e5f-aa2d-a9b63e7a86df,f6d422d7-c8cb-4f14-abf4-c77cda8b5ac5,a04ab4ab-4df1-41e1-b9d8-a60827700d75,5905c65c-eb78-426d-9ef1-6b51badf73b3,b198b4d0-a892-4c30-bb56-edce80d84be2,1bec6256-2228-42c0-b207-4f77b49b4ae7,490c48f8-3ad7-418d-bc07-3dd2292fe1aa,8d036614-9c23-4e5a-b166-214b443fb715,de62784c-0625-40df-8c39-75336c475eba,3d6abff4-cfa2-42b6-a650-b235ee98cf8a,c9b0dd63-6cd9-48c8-ae6f-9164d35c9089,0108d66e-c452-44e2-9f35-4d26ebd00226,1b06d5d2-3ef3-4127-b0d4-2cd73a375c05,3f23404c-2777-4517-a6ea-241b52591641,b6877898-4aa4-4bb0-adc4-2a5bd5beb6cf,cba34e4b-08c0-4328-a447-9365bc89625a,1d846357-07f4-4eab-bef9-4c894adeb3d7,1fd7e76d-4ea3-470b-8ffd-25a51f02e19d,619c3bf5-c5f3-41fb-92e2-6484e8acba0b,78133f84-afa1-4cf5-a6f5-ea7ddbbeb010,ad270a56-e8c6-4958-8cb2-f90ebbe28d80,1c7dc8a1-fb13-4eae-8a43-ba1957f9b0fe,801b8db2-1da2-4347-9e5a-bdefb8ef4bd7,97024787-46c6-4414-9018-db640792ebee,621b8141-9d10-488b-b216-119066a2d6f1,b56b3c9e-130d-4b16-94fe-8fcc89b9e2dd,5ae2da15-21e7-4e4c-846d-488bbbfb5645,3b986b45-b47d-4a47-8dbe-4a9f80b9d313,1e062239-e840-4fc2-896c-176fb8a42cab,8b856689-30da-4a3e-bb52-7b1e841fbd06,99c13510-8341-47e4-a312-4f8fca7e1bb5,0ac06514-bb98-4dde-ab6f-c1e9756eb747,7b57e8cd-d7cf-470f-82c6-cf4c5cf3e14f,5e06ef49-94be-40f5-999d-fc096d3cba82,8bd904c5-ba93-4bae-95b5-3414f7135d20,14510216-9780-400e-9ed4-56e31b8d9ce2,556efe21-6a53-4c59-9219-8045746339e5,d92dad0f-b792-4980-9365-03c00ba33081,8361ea3f-449e-4692-b982-02d11ccd818e,0ca00ab4-e7e6-464b-a218-b611bd7d8376,6ed73e91-4990-4e83-a8e4-7704fedcc3a4,9fbf057f-5037-436b-b6ad-ab967e835baf,ad7d52c2-15b0-4477-b893-987f4561411e,cb3537b4-cc51-42ef-9265-1026c04721f9,74435aa8-ca20-470a-9e94-232a8889878c,78b90a39-5173-4644-a5fb-d97b3d25bd81,f20d1570-b80d-4f41-963a-5723aa760236,d41036e6-528a-41aa-b796-f5c2d8f3fc77,901b8a6b-7f22-4270-bbd7-354e6d051c28,a085d5e6-2cfe-40da-9ac0-3ce6029cd2bb,01f3994b-61af-4b05-97cc-2f315063d00d,58502724-81ee-4b5a-9551-e29e56653826,4a4a719f-26b9-4d69-a83a-26a843a74ea9,3b5bc9af-418a-47e9-ac7a-c20a46e68356,11c81e4f-5aa0-46ef-bd23-5a568e9e8bfd,7fcff7ae-e32f-498f-8cd8-f08ad6185bde,9370082c-726a-42a7-8240-99c8c14ddd24,cbcfcbf5-698a-401c-b513-3dbb91fc4012,6edd535a-bbec-4602-b9b6-755e7b551fc9,d1d8e2a2-ea80-43bf-87c3-9fe09aff473e,1d3a79a8-e7d6-4c6b-91a6-1745446b9a95,245c4604-e639-4b4c-a6e8-734e0ef897ad,c00e9a56-943b-441c-afaa-e26dddfc0b83,64cb49c8-d8b5-4a00-bdcb-f6a664110ceb,57d560c8-7461-46ac-921e-7ef1de22c326,905b2cca-22fd-438a-98b3-90c880afa229,70856ed8-6dd0-4707-af6e-4d4fc3ea0478,7ea08cc8-6b28-4513-9302-7c929222896c,32a41509-aeed-4a11-adac-ce3d8198bd53,3a18184b-c432-4437-8e4b-e150b4cf21e7,2f611d03-29ec-4dab-884b-538b3cb555d9,5d387cdb-b973-47e7-a8fe-ea37ef7f2efc,d344a3b8-6f2f-4fab-98a1-a6ab17d3b675,041b105c-e097-44bd-9496-efb4df1b44a4,1552c4fd-09d4-4391-9eee-0468fd58b2f2,23f1bced-bd00-4e0a-b3bf-3046fcad90fd,05ede159-c247-4f6f-9d01-d9323cbe98f6,65bcc1ad-2769-448d-b92f-21c57544bbf4,4e79b00f-22cc-4853-83f5-d45f202ced17,58329aa0-fe33-467c-8274-c5a74e00aab3,45ebd270-e182-4dff-bde0-bd0763bfec84,ecee423c-e1ee-456c-af15-a113013bfbfb,2898f78a-ade1-4a27-a717-d8167139ea1b,1a2242e8-1fa9-4f55-b558-05d7987b2d75,7d35c902-7cdd-4417-bdf6-c604e1ff39f5,a1c2ea08-5326-4716-a3c1-5d5814321b22,822d0be0-ae3b-420c-a6c8-104f269162d2,874ce8da-9732-49ac-af09-d58b5bf2facc,64f6c444-7b01-4ec1-9a18-5960459f3624,1c437438-a62c-4f6f-8904-5c377911a5ed,b6b4ede4-66f7-4131-9f27-f559dbb6b7dd,c9465fa2-f470-488a-9fdc-185ac7f86d9c,e1f6fa08-f316-4591-b2e6-1225a6baa966,53f27348-b831-4173-96c0-64f7991d2138,4c08f90d-5fb8-4a52-aaa1-9198452343f5,ab5132cf-2cd4-4182-b5ed-a86070464858,bc3f8b03-dc00-4c41-9cad-6fb81538f59d,3f298723-5669-4a10-a840-4062f9a416b1,ef42fce8-cbd1-474e-9505-2f5630fb7b30,e0b7bb16-fb5c-4858-bbf6-e59215681ee8,dff54ade-148f-499b-a15b-fc11ee021a9e,6f7bc0fa-34fa-4650-a01c-aa20b6eccfa1,aba0d313-a62e-4d74-9a56-6c588143c3f1,17035bcc-4cff-4250-af03-af44538515ee,e8b091aa-0ab7-40a7-a902-40e6071e7f5f,f10a8587-5cc9-472f-8a61-8b03ff47f771,c730a103-2a91-4d69-8008-0dd40efe8b71,935be9c9-d685-4fe1-affc-3da0e2a4b552,80c4168e-3ba8-459c-85f9-bc8c95c683fe,550bc137-f08e-4a19-a4e2-ebafc41f0d29,37bfb5fd-2b7d-4c4a-a046-187d5de22c59,a7f84f99-9fda-4290-aba7-659f1e8fe899,9ca17dec-579c-4bd3-854c-1dfe69bd8ba1,9744ccc8-e019-48ec-86bd-f8ecd92671e2,e4586a71-5fcf-4c6e-86d0-98cd789e9f4c,35468a7a-34ea-4dc1-b85b-83836a21cb8b,19dadb39-e462-474f-812b-94e9ef57f7c3,a72452aa-f321-475d-972b-f0e6bd1aae1c,040a5368-e9f2-4f7d-9697-3f184fd8129d,a3e66223-7db8-4851-9602-a8a7505b8355,51bd8a6c-d865-4d73-80b2-a5f333496d90,43077b2d-cda4-435d-a9e7-a2aae4c34a79,d2929826-ac86-4ccd-9934-c1af5888463c,7cb2807d-eb92-4c7a-9bf2-363d0b580bdf,8921e4d3-7c0c-43aa-ab97-d538ad6c4c54,36621dc9-b95d-43e7-a72b-b51c140eab93,ad539fae-871a-4dce-b3db-96594d841f09,790417f6-4365-4574-b385-c1776b60a62c,d205a1c9-5ef8-478f-a13b-eccd72713a76,f5a25f1b-6f0f-4e40-b8e4-8e6f39e58e2b,17e36d78-3587-4351-97bd-a9c155692cad,770d13b5-6560-40e9-9a21-3796d01a26ea,4f0615a9-b090-4dd4-9f6a-2d0a60f7e086,bc7ba1c5-12c8-45a0-ac88-6d445292752a,f02c8d04-4221-430e-b171-ca8f95a46c2c,26ff597e-a90f-43c8-a950-c0a2770abdf6,582b028d-2199-4207-8b16-68f19a218051,44fcbe50-48e3-44d2-8e05-e594cfb06866,028c0df8-b62a-40d5-aaa4-029e3cb17f7f,b4e069d6-2fb1-47c0-aba2-f906e212f4c0,5b8be937-86c1-4341-aff1-53a3c5bb93cb,05867d32-e332-44c9-910f-360210a997f7,b5811e5e-9faa-43e2-b8db-ea3c8aa54c2b,3f90b6fb-10a7-480a-ba48-a3175f6e9342,edff1765-bb44-47b8-ac38-00dd7d8896f4,92b34aee-8ec0-4817-ac0d-bbea078a9822,d84c90ef-ac4c-4d69-bdfc-5f4a6bbb35b9,b96dcb05-557f-4394-b96d-485831c010cb,5c4e1459-40ce-4c08-aed0-05c357373542,3cc002dd-5277-408c-9a79-8b126849b818,de733076-2d7a-4854-9e10-6083ac00d082,1b0d587f-7bca-4c19-8cec-e01c9504fcc4,0736170d-996f-45a9-971b-078979ec8d2d,d10ee98a-c0d0-4d8b-b66b-4d49959a6c75,4a84c6c0-23b2-4a00-8ebb-7dd340e18d0f,9bd3ad37-8fa9-42a8-8a3e-f2ee8d63f526,ffc8d79c-14f3-4f42-892a-b49cd118b566,b625ad7d-0d5b-484a-b88d-6611dad2d26b,a72c499d-443e-4cf7-93b1-b5f29ad81cfb,8b76f6b1-a7ee-42a0-b862-3b64824a96b5,77ef864f-b8b4-4740-b52c-7efde0a39583,e8781ec4-b3e6-4462-915f-d35fe61055f2,aafe6c7b-8163-41bc-acb8-abbb3fb7ce55,2ca19f22-5f16-4220-b680-e06fc505a880,1f295bf5-d76a-46b2-ba10-b1ca5c7e5279,786d036d-4fa6-44b4-9297-96f51c46f4d5,f1a1c8b5-ed48-47e5-baac-ce132cba0a07,fce34086-dbba-4928-bcc8-8d5b884e92d7,d14f4172-5129-41e2-96c9-29a1b79031da,32501f38-b1fc-472c-a7ba-1915620d78dd,2322d042-34bd-4f29-9aa0-4f1ba3e6a158,6251d7f1-6313-407a-a4f5-3c5101e3a793,9243c30e-4bf9-45b6-bdd6-0621c7bd0651,b91371ab-8212-486a-9887-2490053c183b,b7529eb1-748c-4f6d-b58a-a88c67d27bcc,c0c30552-e6f7-4efa-a3cc-19b203adde6d,35ef6540-504e-410b-a140-017c39dc60c8,b09705f4-a2a6-4e85-992f-fbf62a078b89,a6e77e38-c65c-40f7-ad15-149e10c5203d,8bfbc6e7-c693-4046-8f53-f65edc291ffe,de25cd1d-e404-48ad-a356-8a4061dc6c42,caf9bcf2-1a44-499f-9ad4-b302f3c337ab,dc074c94-ec2d-4c1d-9c72-dc4322a154a8,67e95168-63db-4b4b-9541-2f4e26fb1e16,06acc13e-f560-44a7-a165-83ef348cb1ec,8c722b0a-9c45-4586-8728-5932110eb41a,b4c76495-b696-42de-a817-93c00f53d34e,a1b56693-a53f-4907-a349-5b456abba16f,4827f942-c80e-42fd-9c40-e8b1f510cd4e,59de6f52-bfb4-40e9-af09-d51baa333e19,6cc7fd4c-5752-45df-a944-3e8c2f722af2,05a21e5d-9bf2-40c5-a8ba-755fa5265b8d,7fc10229-84ca-48b9-8a82-824da22721c3,fe3189cd-5cfa-4967-85d4-3112ce7a93b5,13926691-325c-4129-ad0a-bbc1c20ca310,fc42b91e-ebe5-4cc8-8373-8e565151e8a4,62b03610-5a27-4eb4-841d-ed532e22f14a,4ab18e65-4676-41a2-b33c-802014a25407,92f1adcb-e889-47e0-b9c0-34a3a68722aa,152cd79f-3eed-4b63-8fbe-9512846ada14,4cc2d775-7b61-4bac-8876-c447fd81a82c,36cdd96e-ad10-431d-b5b1-5bc2d34b33d9,e274b518-1e2a-4fdc-b700-ab0bc438a318,65f1d6ae-dd6b-480e-9832-871a5d6be9b7,a2385802-872d-4106-9dab-b5f475f607f9,7969e764-afda-475a-a85e-cdfa1042e92e,1d623576-eed8-4034-85b3-73cd2f939582,c6ccd5d4-8c9a-4b3d-b568-2efbf0d39116,0faad70c-c503-4b28-a8a2-72e99da3e589,46393b7e-5242-4388-9e76-a70687b3f6c1,d3a5eb3f-cc4a-4a42-a4ef-94bb95cd7692,7453f0c9-1624-487f-b441-da7f0c71ce94,dbf1304e-8a40-4fbd-a4bf-2a29a6e9f0ef,e5adf08d-da81-4c80-8054-4447d25fee86,5857fff1-b3cb-4dd7-9643-176204832b4d,a70be94f-a50b-4c56-bce6-27ae933109c5,95cf1022-9a1b-46d3-ab2a-34e3c6bc7882,0ee96717-729c-43b1-a205-06ab767221cc,4452e318-d0f5-43f1-a4e2-b16bcad6c03d,19114563-1ad3-4fb6-919b-c377815c07ed,98405542-2528-4d97-a382-443eda8030cb,5b352672-c883-432b-a0ea-18d0f42591d6,dbd843a8-2bb5-472a-bcf9-ba7e71e20a78,a3ec25dd-b8b3-49d7-9ce1-13b357835cb6,156f511e-49d9-49a7-9a8d-a51743271aa3,89200c44-4dbd-45b0-9081-184b0a61f52f,d5b09802-2877-40d8-a71d-1c3db0860cc0,6720033c-1769-47ea-96d6-853a4e39cc63,e78a4df2-476d-4918-835a-8482ac59e0c1,8d0252a9-5ca0-4cd5-a7cd-138a9a21e63b,8efa99f8-66c6-4aad-8f7e-c30d68f9928c,7ccb137c-f46e-4003-a47c-6a6ab4bbb31d,cc16c8e7-f8d6-49fa-93e0-0e2a6f7234f1,af4bb157-094b-414a-81bf-cf5662b3c336,399a35a5-4e97-4769-a64d-9b1b4dba1cf9,30e8e4b9-c864-4b93-b8ea-b999e694e247,050783b8-29b0-40ba-8e26-040f987d39cf,9ba84461-337a-4def-9a28-2d42c3bfa801,e4f3444c-33bc-4443-b354-f010f20a1647,db593a0e-732f-48b4-9c73-233b9906beed,44ee9b45-e659-42b2-a69c-6a9186e97bb7,079b701c-9af7-49c4-86dd-34ba83f62483,523f21b3-ef3e-418d-ae16-2db505333112,9771968b-d43b-4947-87d5-0f7a9b44a490,bf6602ec-1b1c-4199-bf1b-3f3b20d31cb6,0e7038ad-81ee-4a0f-bc33-648a5112cfe1,9010e4a0-6ec8-4deb-a97a-aad77b69b948,d60c5d08-5712-4abe-b0d8-0c36d1f7e301,c4c9beb6-7729-4a71-ada1-a741ca43bc43,1fb12437-5941-495f-985c-a4c4b579253b,434fb0f3-8b23-40ad-ae13-c1d0d0aff02e,f33fb973-306f-42b8-ae44-b9fc590bcd0a,6af14282-e4ab-43c1-99cc-e61d224ade88,b605606d-567a-4b05-875d-ad9c0556a757,c6c87691-b1a6-4439-924f-2c1729d57b1f,c332f977-1a23-4a1a-9a00-0d0e29ff67b1,fba66014-732c-4351-9d4c-20b128a7a1ce,66415388-56ac-4360-9538-4b911cd2058f,e282611c-2659-430d-b24b-43751d21a522,632441f1-5d02-4510-92b2-5b8b3eaa27bd,f43e4b34-f5be-46cf-a043-1adefc636249,7ba22106-19a5-4ab3-ab68-0942884a93c9,95f4d3eb-3c68-449f-986e-f1a830b45ac5,5db7ee63-7233-4061-b867-5d6e534853ce,56a6db8b-c685-4a24-bf54-d6f9b676e1c1,943ddc3f-b22e-4eb7-b815-e7b540a290e6,89cbceeb-2fcd-49b4-9e89-ff11aa2faf71,a2c34b9a-f407-48d0-a637-ac251145f9be,365ffd3a-779a-4743-8bb3-a6cb6429f677,590e4e16-2f30-42bb-8467-650f286e5be7,f861060e-a2c7-4707-8f49-a493d66f0f13,1ac85469-3fef-4852-9157-6d26e4f4c5ce,2e1c16b7-0a06-4a93-817f-e7b0be0d3cf4,05f8dd99-a597-4d4e-a254-d25cdd4f3b5b,04287f92-eed1-4b7d-9101-cc9c8115348e,16e595df-98dd-4fa0-83ec-b3053e053bd6,50d37e90-3c89-4a6f-a00a-2aa7d00eec38,e1f3deb7-16b7-4768-a133-7e6b47ce86df,b889efbe-0549-4098-89d3-99aed4ba5fd5,f23bb53a-33d1-45cb-86e8-495603b0997a,27195d60-9264-42e7-8f7e-44c871b09ff3,944ec2ab-6134-4213-8d65-2d6113557bdc,91e715ec-2ef7-44f9-938b-ace81ded6454,33ed3470-10ee-499c-8bb0-eb91f4d90d7d,bc0d2f92-1f71-4ddb-9723-676c4fb00594,d18fdbb0-030f-4fe5-834c-84d16189aa42,07211c5b-42c8-412f-b4ad-0be3623847e5,4e970a35-295c-4da5-8ef9-aee0ca0787f0,f7901302-111d-4fe1-b6ff-1812a75b85ce,dff91eb6-dd7e-4745-b4d9-4abe02e0612b,fd017d27-be9e-4ed3-89e9-b6c73cfa5580,a4a6ab4f-3809-42e6-a355-fbd1d503e5e6,69e4e0f6-1f1b-425f-b31c-72ac294bda70,3f2d1677-b484-4c66-907f-c62f272ee059,9ca3a1af-76f4-45c7-9cb2-fa03f898509b,a31daad0-017e-4f2f-9528-92b1c5678a71,725ebed8-7bed-4ad6-bb9e-fe0848190ab6,0e178e2d-5243-48b6-917a-d50bc8b79d36,b9e5abb5-e730-48ce-ba2a-4d93b41415dd,1d551c98-1abd-4297-b95f-ff2ed26fa87a,687963df-83ae-4612-9d68-1db273d93a31,56b61b54-5f5d-49ed-84f8-56cc6d6d5653,355f9cbd-229b-4d6d-af59-ae5d8f99ee61,096af9c8-120b-4437-a1c4-d67de995d34f,7b5ed15e-2bc6-47e5-9f11-deb2d788a58b,b43c4b1d-cf57-457a-8cc6-1d1dc4157c9c,e7d86276-800e-470d-9ca4-597b4b1ef611,f0c94c0a-0caf-4af2-8662-25b643d4a35f,a9b55757-43a1-480f-b240-d8b4647ec642,f7d212e7-7748-4bf0-b23e-47078c8b001c,130d8cae-71f0-403f-b4d4-c691218e0e10,765360f3-a673-4e3e-b33b-61ddf48d9b88,0fddcd8b-1ea0-46b5-b35f-4bb53e8e4917,e652f9d7-d9fd-48b1-8b8b-99c331581123,e6bf2425-16f8-4636-83bd-b423d0ef1c9d,395390a1-be35-4279-b1ce-e5bf69fc2bd9,91284ee7-7686-496d-830e-f91209fffed9,9b4ef0f1-e948-4bad-9b4e-e26697b428e0,cbf2e57a-2c69-4736-b3c9-16d91c69c963,2cf81fcf-f0c0-4072-8176-62918e87345b,53b615c2-522a-4ea3-bced-737e7f36756d,62b48a2c-d7c9-44e2-872b-723d336cb05d,40326cc8-642a-4dac-a14d-05014c8ebb65,03dd4721-5db3-4269-ab79-76425cd2f411,9042443a-23e8-479b-a588-364aad3c28a8,0b5c7a53-cb60-400d-86d2-e51637b806e9,cc020b53-5722-42ec-a9bf-fbacca02a8d8,eceed997-f858-4cc3-8135-b82c0c44c165,792ec61a-8041-4c56-af65-008f69224b9f,e3b99309-d2d8-4b55-b52d-394647d3aa70,0ccedb0c-c8a1-481c-baaf-66673ed25cfe,b9b430ef-f231-4ab5-ae4b-7c12f82b119f,4ff52fc1-3285-4c64-8581-78bfcfc4e732,44798063-cbaf-4ce6-ab42-51938b7fb5c6,650635fc-97f4-4593-820c-817431f25caf,8b62f75d-b716-4cf5-8e78-06679798179d,3672a566-ef65-449f-a39f-98f8c20336f1,583556bb-f141-47cc-aceb-fe690b0389c1,22eb6111-9a9a-40da-b53c-2d83c820cbbf,a8ff8ff7-8fd0-48d3-bccc-8ae490824bcf,c8e02d71-4b6d-4a29-940d-1b3323f42ad3,319454be-583e-4674-a6db-294f0ee1ebb4,a023b28a-b2ea-4ed2-b915-5b898eae6c2a,550de88e-cbc5-4a48-b6d0-70023e7d55f1,16941b60-131b-47d9-8da9-0693831b8ac6,6c39c879-681e-40e7-b20d-796dc2b749e2,c9468b90-e5a0-4c94-b5e4-5fdc23af9382,3317c2bb-5761-41c8-af65-667eb7d37f89,96617afe-6bc8-4ea8-9dd8-b455bdc6bf2f,578c8c8d-2409-458e-80c9-6f6e7056e691,c13d33ae-dfc0-47d5-bb6c-4e8c1bee40e9,c90b64cf-7285-4da5-b4d7-e1cb2f54e0d1,9dd101f3-350d-45b3-a4cb-7e28946e1f9b,11121dbc-4d07-4bbe-8bb5-353355057f62,d38e4862-25e9-42c0-a35f-185a3269bbf9,73109a71-ab0b-474b-ac3d-01c495cbe82c,1e003aed-43af-46d9-96ca-76503c5bd50f,773cf9a1-1975-487a-a192-bbe5fe0977af,001f51e6-8e16-4228-aa8b-062a18e85414,35a27e94-2c8c-470a-840b-cbb17dc49922,4d9fdd07-7f15-4221-9fbc-f3419a5f8db3,5771e521-07f6-43be-932a-0ba26f7e1524,10c2f9e1-1d0a-43e3-8423-e3c34b8d4143,d195296c-1f9a-495f-b046-ddd71ec17f26,ac99d3a9-84f1-4cbe-89bc-69acf7f3ca1c,b0d9efcf-50f7-4756-9010-a61fd61cf49b,d63c0235-ee35-4a4c-8b29-6e55b6dab3bb,fa69bb08-5655-463f-a436-4a02b8d320c2,87c31cdd-c36d-41d7-a422-8f71148a5c5f,ef8f601c-037d-4cd9-8c17-d050cc74c134,dcb1522c-f02b-491f-891e-ed9832ba33b1,c64e483f-f726-44f7-81de-ff2853e06019,af58fe4a-f848-40a1-9040-c73bb6a8a120,fc4a3d17-eb98-4b74-a65e-f522ef783a0a,86a209ec-8f26-45a7-801b-383aa9c4bffe,804e002d-b727-4813-b228-7ccce03f707c,ee8b2d83-b871-407c-b6a7-0e569834750e,a3588c42-ce26-473b-9c8f-30d5461d5432,c8afb491-35c1-4d29-bc41-c1d9dacaf674,c5d9e642-d7f6-4172-91a8-cdededb0924c,912f9181-5ee5-40d5-bfee-962f08451335,10dc18cd-acf3-42a7-8414-ee54e982fde2,37929a40-15a9-4f04-a077-8bd12b820c46,e0760026-d520-4e5c-89e8-880b3fa91977,ce28d296-614c-45fe-a40e-63f2471ae737,66b349a6-6b1a-476a-9098-1748d2d5b150,59431990-9815-4a28-9242-ae230cdad3d6,5a39e214-9eef-4620-8c11-d7c8229a14a3,796af57e-f050-470a-91e0-22e029fd51c8,82292d3c-bd90-4926-88a4-3a1dca8d247d,1e6a3452-2805-45c4-84f4-8816149665f4,9f308571-a350-4f0f-8801-303a6507b409,fd090cf0-6f33-4355-bb9c-982d88c831f2,3eb31978-5917-41d8-9604-7874b8f34ab5,d04af6e3-00be-43cd-9c74-9978dd5fa567,bb72b5c2-dbbf-42db-9484-45f2edc5a8d8,818b9402-8bc9-4c1c-8e8b-7f7c4a5ae895,88c27ee9-5fa5-4c24-8a0e-5fdc72663ae5,4defd250-94f2-4e0c-a32e-7c402591c571,48c2e51e-88ff-4b0c-9676-cf5747670207,db7673fb-87cd-490c-ad01-700f33e06943,558f3e99-385e-4f35-a2b2-55f96d198665,7e5d0262-b2c1-484c-91ed-c6dcdcbe8793,8414555a-be08-4222-a3a6-77b09b0b9053,51cb4d64-ff69-40df-b2fb-7f0b58a779c5,2ed3dad2-4e75-4b97-bfc6-eeba0925609c,202507eb-7d17-4d24-bbad-21a013160eb8,c48dd8e2-1617-43d8-9a74-6dba0aaab5dd,5b082fbc-adb5-4265-8df2-f68ec2521c4f,1fd96973-ba8a-4762-9652-c18486d4108b,407224b5-426d-4c4f-9b1b-ba8e8d5c3fd6,2dc6657c-0f8a-481a-a88f-1209f5494fff,800db7d1-48bb-40e6-8201-23d11051dcad,c8fec5eb-3cbe-4794-91f0-58d7679e9ea2,bdcde425-465e-44a5-872d-036f247f97c7,824069f8-76a3-4b04-859f-577c136473bb,02497d24-38b2-4118-ba86-6d04785b049b,575c495f-11b4-40cb-a2f0-83492983f991,d3c929a3-1755-4866-b7c6-923d0cecb674,56bdee16-1a83-4cd4-8948-614908c1ee96,6537b129-ae0a-47af-a97f-e5fd8aba9a84,586fa6e9-910e-463c-9851-c5c2f588778f,7bb6cdac-b3d7-44d5-adcf-c04516c6b54f,e1104c2d-e3ac-4a68-a79f-45cb5be6f250,7ffcc5f0-c161-49e9-9201-ea17eeed2a30,d4981eab-a793-46de-b610-5c9d5a6d2bfc,6e651465-b9e1-4826-a2c4-a74f7840cdf8,6a850410-200f-45bd-be0e-d8dddb1dec94,10e66c1c-3ff1-409e-94c1-cc897c6f2b7e,aecbdfc0-e0a2-4b88-b65e-23a7801a99de,a7c97a7b-2a0e-468d-8b01-a4d760390844,230f51ca-40fc-4ecd-97e2-1ea7fa20d6ab,9d7e2995-27f0-46ca-a37e-a3dcb69156e0,24bf28f8-a62f-4ae3-a9df-de0153278ed6,71a938ce-cf4c-4bb7-8eb2-5187a7e204e2,3f3ad79f-2e08-4fc5-99c9-53a884fd123d,fa573263-9c53-4e6a-b880-68d47fb21da9,04137526-846d-450f-bde1-840df13238b5,33b75222-46cc-40bf-aaff-f3a351db78d0,f81d9587-1b34-488a-ad84-dec445c9a4d0,a607c826-2c82-4160-8b6e-042462758598,7a4d0491-6b33-489c-b88d-2958449b10dd}'::uuid[]))
                                                  Heap Blocks: exact=392
                                                  Buffers: shared hit=848
                                                  ->  Bitmap Index Scan on "PK_interviews"  (cost=0.00..354.78 rows=500 width=0) (actual time=0.742..0.742 rows=500.00 loops=1)
                                                        Index Cond: (id = ANY ('{181ef8fd-5ca4-485b-af5e-fba3a70aa3ed,aa5cafc3-6c36-48c2-b536-1f57ceb0f3ea,f02038d6-fbca-4855-8b85-15c882c7eb19,80a4cfbf-79d1-4209-afee-c10ec093d9d9,5ce380ba-d391-4bd0-94ba-3ef681c830d0,23b27af1-c7bb-4439-87fe-3524c9699ed4,38b5c818-9ab0-4928-be63-5e2d06e6550e,a3c7edf1-421b-463d-b5e5-eed2195b733a,f02279a3-9dfb-4c59-b1c4-b9c6730a79ef,74b6ad27-5820-4015-9900-7fa5b74df4ba,ccb836d9-565e-469e-97df-f03afe10eea1,13dfb1da-9177-4be7-a82c-ade1292f2eda,dc66fd28-82c2-41f3-aceb-81459cea6565,f977f0c3-576a-475c-aa57-d87b33fa3c63,33482d29-ad15-4aaf-8da6-401f1f10838e,9a747762-4f6f-4744-8c11-6a7be8990a53,15597309-13f8-4ec9-9cef-848f986d92b7,ad7b1439-56e9-41cb-9da7-fdf7cc43ec6b,4255bdcd-b5d7-4355-86d2-0a31ff4692b1,cf749624-a2b5-471d-a577-06e3340ed6ae,b6314274-39ba-4297-bff2-cc252b3da0e1,d474c4db-1e08-44e6-9732-9cecc7cbb59f,7d3de631-c755-4443-bb41-2c23f799bc7d,a9daeb07-1a98-4e84-8a39-388f75658de3,2e7c67f1-98c2-46ea-a429-eba425c02078,7a1e629c-feab-4720-a002-2017e0602162,04d7af57-9db0-4ec8-adb1-bd468ba91634,46c146bf-ce61-4b9f-893a-c1a6c8c8e62b,b571aeb7-0959-48d4-af34-6b1b0af58f72,e4922d4b-a3fb-4be8-8030-dc76c04a7943,42fdffd3-9878-400e-b5db-b18e0fe9a6a6,b386c373-fcb0-4e0f-9e94-e391acff41b3,c68a9fc7-e89a-42f1-948b-d51a62abf1b8,ff2bf763-0204-43e6-bf3a-1096bf14a602,548b4199-69c9-4c33-8431-125963f345cb,1483be98-355e-4c80-b24a-9a86e703e8de,bb4b7ef2-2dca-45b2-bf40-3fbfa237f1d0,4f5099bd-bf2f-41ea-9751-9e8c7472487e,2d5a328d-3acc-4c9e-92ad-3dcd67961b36,a2efb411-cc9c-4b56-a48c-ea2b52ff0cad,5bfc0a42-13cc-4b44-a039-cd3dd628ec0a,dbd85365-68c5-468a-9ee3-1cde57157cb7,2c9e72fe-eb14-4a59-88b6-34570e4a411e,c4a1b56a-6a04-4d13-b109-f1d0e2cfe436,bdf8c526-ff89-4c9a-a100-8ac9d41f7a0b,075a8158-2ce3-4990-b5b0-9089bbb60b4b,abd223e1-bb8b-45c7-893a-3c4c2bb48cec,b64d35a1-df84-4c51-a488-f7f07654b388,ec6c6e5b-180e-4a89-b290-c3a7287db0e8,d43085c2-f8cf-4a74-b1f4-41589810e33a,194e3e16-2427-4520-bf53-85fc1e6aa3cb,c40b6f39-0360-4496-934c-641e5ada8181,593c72dd-93fa-4c5f-9121-b857d48ac677,9d3c59ae-80b1-4146-b43a-a14a31a2fc70,c4d62212-65ad-4042-b0c1-0726f42c05c2,8eed89a5-4c25-4388-ada7-85b3406c3676,63545b11-6045-422c-a1bc-911978decc42,967e080d-aab9-4b51-98f2-e9f5262e2b1b,b5763a61-2335-4e5f-aa2d-a9b63e7a86df,f6d422d7-c8cb-4f14-abf4-c77cda8b5ac5,a04ab4ab-4df1-41e1-b9d8-a60827700d75,5905c65c-eb78-426d-9ef1-6b51badf73b3,b198b4d0-a892-4c30-bb56-edce80d84be2,1bec6256-2228-42c0-b207-4f77b49b4ae7,490c48f8-3ad7-418d-bc07-3dd2292fe1aa,8d036614-9c23-4e5a-b166-214b443fb715,de62784c-0625-40df-8c39-75336c475eba,3d6abff4-cfa2-42b6-a650-b235ee98cf8a,c9b0dd63-6cd9-48c8-ae6f-9164d35c9089,0108d66e-c452-44e2-9f35-4d26ebd00226,1b06d5d2-3ef3-4127-b0d4-2cd73a375c05,3f23404c-2777-4517-a6ea-241b52591641,b6877898-4aa4-4bb0-adc4-2a5bd5beb6cf,cba34e4b-08c0-4328-a447-9365bc89625a,1d846357-07f4-4eab-bef9-4c894adeb3d7,1fd7e76d-4ea3-470b-8ffd-25a51f02e19d,619c3bf5-c5f3-41fb-92e2-6484e8acba0b,78133f84-afa1-4cf5-a6f5-ea7ddbbeb010,ad270a56-e8c6-4958-8cb2-f90ebbe28d80,1c7dc8a1-fb13-4eae-8a43-ba1957f9b0fe,801b8db2-1da2-4347-9e5a-bdefb8ef4bd7,97024787-46c6-4414-9018-db640792ebee,621b8141-9d10-488b-b216-119066a2d6f1,b56b3c9e-130d-4b16-94fe-8fcc89b9e2dd,5ae2da15-21e7-4e4c-846d-488bbbfb5645,3b986b45-b47d-4a47-8dbe-4a9f80b9d313,1e062239-e840-4fc2-896c-176fb8a42cab,8b856689-30da-4a3e-bb52-7b1e841fbd06,99c13510-8341-47e4-a312-4f8fca7e1bb5,0ac06514-bb98-4dde-ab6f-c1e9756eb747,7b57e8cd-d7cf-470f-82c6-cf4c5cf3e14f,5e06ef49-94be-40f5-999d-fc096d3cba82,8bd904c5-ba93-4bae-95b5-3414f7135d20,14510216-9780-400e-9ed4-56e31b8d9ce2,556efe21-6a53-4c59-9219-8045746339e5,d92dad0f-b792-4980-9365-03c00ba33081,8361ea3f-449e-4692-b982-02d11ccd818e,0ca00ab4-e7e6-464b-a218-b611bd7d8376,6ed73e91-4990-4e83-a8e4-7704fedcc3a4,9fbf057f-5037-436b-b6ad-ab967e835baf,ad7d52c2-15b0-4477-b893-987f4561411e,cb3537b4-cc51-42ef-9265-1026c04721f9,74435aa8-ca20-470a-9e94-232a8889878c,78b90a39-5173-4644-a5fb-d97b3d25bd81,f20d1570-b80d-4f41-963a-5723aa760236,d41036e6-528a-41aa-b796-f5c2d8f3fc77,901b8a6b-7f22-4270-bbd7-354e6d051c28,a085d5e6-2cfe-40da-9ac0-3ce6029cd2bb,01f3994b-61af-4b05-97cc-2f315063d00d,58502724-81ee-4b5a-9551-e29e56653826,4a4a719f-26b9-4d69-a83a-26a843a74ea9,3b5bc9af-418a-47e9-ac7a-c20a46e68356,11c81e4f-5aa0-46ef-bd23-5a568e9e8bfd,7fcff7ae-e32f-498f-8cd8-f08ad6185bde,9370082c-726a-42a7-8240-99c8c14ddd24,cbcfcbf5-698a-401c-b513-3dbb91fc4012,6edd535a-bbec-4602-b9b6-755e7b551fc9,d1d8e2a2-ea80-43bf-87c3-9fe09aff473e,1d3a79a8-e7d6-4c6b-91a6-1745446b9a95,245c4604-e639-4b4c-a6e8-734e0ef897ad,c00e9a56-943b-441c-afaa-e26dddfc0b83,64cb49c8-d8b5-4a00-bdcb-f6a664110ceb,57d560c8-7461-46ac-921e-7ef1de22c326,905b2cca-22fd-438a-98b3-90c880afa229,70856ed8-6dd0-4707-af6e-4d4fc3ea0478,7ea08cc8-6b28-4513-9302-7c929222896c,32a41509-aeed-4a11-adac-ce3d8198bd53,3a18184b-c432-4437-8e4b-e150b4cf21e7,2f611d03-29ec-4dab-884b-538b3cb555d9,5d387cdb-b973-47e7-a8fe-ea37ef7f2efc,d344a3b8-6f2f-4fab-98a1-a6ab17d3b675,041b105c-e097-44bd-9496-efb4df1b44a4,1552c4fd-09d4-4391-9eee-0468fd58b2f2,23f1bced-bd00-4e0a-b3bf-3046fcad90fd,05ede159-c247-4f6f-9d01-d9323cbe98f6,65bcc1ad-2769-448d-b92f-21c57544bbf4,4e79b00f-22cc-4853-83f5-d45f202ced17,58329aa0-fe33-467c-8274-c5a74e00aab3,45ebd270-e182-4dff-bde0-bd0763bfec84,ecee423c-e1ee-456c-af15-a113013bfbfb,2898f78a-ade1-4a27-a717-d8167139ea1b,1a2242e8-1fa9-4f55-b558-05d7987b2d75,7d35c902-7cdd-4417-bdf6-c604e1ff39f5,a1c2ea08-5326-4716-a3c1-5d5814321b22,822d0be0-ae3b-420c-a6c8-104f269162d2,874ce8da-9732-49ac-af09-d58b5bf2facc,64f6c444-7b01-4ec1-9a18-5960459f3624,1c437438-a62c-4f6f-8904-5c377911a5ed,b6b4ede4-66f7-4131-9f27-f559dbb6b7dd,c9465fa2-f470-488a-9fdc-185ac7f86d9c,e1f6fa08-f316-4591-b2e6-1225a6baa966,53f27348-b831-4173-96c0-64f7991d2138,4c08f90d-5fb8-4a52-aaa1-9198452343f5,ab5132cf-2cd4-4182-b5ed-a86070464858,bc3f8b03-dc00-4c41-9cad-6fb81538f59d,3f298723-5669-4a10-a840-4062f9a416b1,ef42fce8-cbd1-474e-9505-2f5630fb7b30,e0b7bb16-fb5c-4858-bbf6-e59215681ee8,dff54ade-148f-499b-a15b-fc11ee021a9e,6f7bc0fa-34fa-4650-a01c-aa20b6eccfa1,aba0d313-a62e-4d74-9a56-6c588143c3f1,17035bcc-4cff-4250-af03-af44538515ee,e8b091aa-0ab7-40a7-a902-40e6071e7f5f,f10a8587-5cc9-472f-8a61-8b03ff47f771,c730a103-2a91-4d69-8008-0dd40efe8b71,935be9c9-d685-4fe1-affc-3da0e2a4b552,80c4168e-3ba8-459c-85f9-bc8c95c683fe,550bc137-f08e-4a19-a4e2-ebafc41f0d29,37bfb5fd-2b7d-4c4a-a046-187d5de22c59,a7f84f99-9fda-4290-aba7-659f1e8fe899,9ca17dec-579c-4bd3-854c-1dfe69bd8ba1,9744ccc8-e019-48ec-86bd-f8ecd92671e2,e4586a71-5fcf-4c6e-86d0-98cd789e9f4c,35468a7a-34ea-4dc1-b85b-83836a21cb8b,19dadb39-e462-474f-812b-94e9ef57f7c3,a72452aa-f321-475d-972b-f0e6bd1aae1c,040a5368-e9f2-4f7d-9697-3f184fd8129d,a3e66223-7db8-4851-9602-a8a7505b8355,51bd8a6c-d865-4d73-80b2-a5f333496d90,43077b2d-cda4-435d-a9e7-a2aae4c34a79,d2929826-ac86-4ccd-9934-c1af5888463c,7cb2807d-eb92-4c7a-9bf2-363d0b580bdf,8921e4d3-7c0c-43aa-ab97-d538ad6c4c54,36621dc9-b95d-43e7-a72b-b51c140eab93,ad539fae-871a-4dce-b3db-96594d841f09,790417f6-4365-4574-b385-c1776b60a62c,d205a1c9-5ef8-478f-a13b-eccd72713a76,f5a25f1b-6f0f-4e40-b8e4-8e6f39e58e2b,17e36d78-3587-4351-97bd-a9c155692cad,770d13b5-6560-40e9-9a21-3796d01a26ea,4f0615a9-b090-4dd4-9f6a-2d0a60f7e086,bc7ba1c5-12c8-45a0-ac88-6d445292752a,f02c8d04-4221-430e-b171-ca8f95a46c2c,26ff597e-a90f-43c8-a950-c0a2770abdf6,582b028d-2199-4207-8b16-68f19a218051,44fcbe50-48e3-44d2-8e05-e594cfb06866,028c0df8-b62a-40d5-aaa4-029e3cb17f7f,b4e069d6-2fb1-47c0-aba2-f906e212f4c0,5b8be937-86c1-4341-aff1-53a3c5bb93cb,05867d32-e332-44c9-910f-360210a997f7,b5811e5e-9faa-43e2-b8db-ea3c8aa54c2b,3f90b6fb-10a7-480a-ba48-a3175f6e9342,edff1765-bb44-47b8-ac38-00dd7d8896f4,92b34aee-8ec0-4817-ac0d-bbea078a9822,d84c90ef-ac4c-4d69-bdfc-5f4a6bbb35b9,b96dcb05-557f-4394-b96d-485831c010cb,5c4e1459-40ce-4c08-aed0-05c357373542,3cc002dd-5277-408c-9a79-8b126849b818,de733076-2d7a-4854-9e10-6083ac00d082,1b0d587f-7bca-4c19-8cec-e01c9504fcc4,0736170d-996f-45a9-971b-078979ec8d2d,d10ee98a-c0d0-4d8b-b66b-4d49959a6c75,4a84c6c0-23b2-4a00-8ebb-7dd340e18d0f,9bd3ad37-8fa9-42a8-8a3e-f2ee8d63f526,ffc8d79c-14f3-4f42-892a-b49cd118b566,b625ad7d-0d5b-484a-b88d-6611dad2d26b,a72c499d-443e-4cf7-93b1-b5f29ad81cfb,8b76f6b1-a7ee-42a0-b862-3b64824a96b5,77ef864f-b8b4-4740-b52c-7efde0a39583,e8781ec4-b3e6-4462-915f-d35fe61055f2,aafe6c7b-8163-41bc-acb8-abbb3fb7ce55,2ca19f22-5f16-4220-b680-e06fc505a880,1f295bf5-d76a-46b2-ba10-b1ca5c7e5279,786d036d-4fa6-44b4-9297-96f51c46f4d5,f1a1c8b5-ed48-47e5-baac-ce132cba0a07,fce34086-dbba-4928-bcc8-8d5b884e92d7,d14f4172-5129-41e2-96c9-29a1b79031da,32501f38-b1fc-472c-a7ba-1915620d78dd,2322d042-34bd-4f29-9aa0-4f1ba3e6a158,6251d7f1-6313-407a-a4f5-3c5101e3a793,9243c30e-4bf9-45b6-bdd6-0621c7bd0651,b91371ab-8212-486a-9887-2490053c183b,b7529eb1-748c-4f6d-b58a-a88c67d27bcc,c0c30552-e6f7-4efa-a3cc-19b203adde6d,35ef6540-504e-410b-a140-017c39dc60c8,b09705f4-a2a6-4e85-992f-fbf62a078b89,a6e77e38-c65c-40f7-ad15-149e10c5203d,8bfbc6e7-c693-4046-8f53-f65edc291ffe,de25cd1d-e404-48ad-a356-8a4061dc6c42,caf9bcf2-1a44-499f-9ad4-b302f3c337ab,dc074c94-ec2d-4c1d-9c72-dc4322a154a8,67e95168-63db-4b4b-9541-2f4e26fb1e16,06acc13e-f560-44a7-a165-83ef348cb1ec,8c722b0a-9c45-4586-8728-5932110eb41a,b4c76495-b696-42de-a817-93c00f53d34e,a1b56693-a53f-4907-a349-5b456abba16f,4827f942-c80e-42fd-9c40-e8b1f510cd4e,59de6f52-bfb4-40e9-af09-d51baa333e19,6cc7fd4c-5752-45df-a944-3e8c2f722af2,05a21e5d-9bf2-40c5-a8ba-755fa5265b8d,7fc10229-84ca-48b9-8a82-824da22721c3,fe3189cd-5cfa-4967-85d4-3112ce7a93b5,13926691-325c-4129-ad0a-bbc1c20ca310,fc42b91e-ebe5-4cc8-8373-8e565151e8a4,62b03610-5a27-4eb4-841d-ed532e22f14a,4ab18e65-4676-41a2-b33c-802014a25407,92f1adcb-e889-47e0-b9c0-34a3a68722aa,152cd79f-3eed-4b63-8fbe-9512846ada14,4cc2d775-7b61-4bac-8876-c447fd81a82c,36cdd96e-ad10-431d-b5b1-5bc2d34b33d9,e274b518-1e2a-4fdc-b700-ab0bc438a318,65f1d6ae-dd6b-480e-9832-871a5d6be9b7,a2385802-872d-4106-9dab-b5f475f607f9,7969e764-afda-475a-a85e-cdfa1042e92e,1d623576-eed8-4034-85b3-73cd2f939582,c6ccd5d4-8c9a-4b3d-b568-2efbf0d39116,0faad70c-c503-4b28-a8a2-72e99da3e589,46393b7e-5242-4388-9e76-a70687b3f6c1,d3a5eb3f-cc4a-4a42-a4ef-94bb95cd7692,7453f0c9-1624-487f-b441-da7f0c71ce94,dbf1304e-8a40-4fbd-a4bf-2a29a6e9f0ef,e5adf08d-da81-4c80-8054-4447d25fee86,5857fff1-b3cb-4dd7-9643-176204832b4d,a70be94f-a50b-4c56-bce6-27ae933109c5,95cf1022-9a1b-46d3-ab2a-34e3c6bc7882,0ee96717-729c-43b1-a205-06ab767221cc,4452e318-d0f5-43f1-a4e2-b16bcad6c03d,19114563-1ad3-4fb6-919b-c377815c07ed,98405542-2528-4d97-a382-443eda8030cb,5b352672-c883-432b-a0ea-18d0f42591d6,dbd843a8-2bb5-472a-bcf9-ba7e71e20a78,a3ec25dd-b8b3-49d7-9ce1-13b357835cb6,156f511e-49d9-49a7-9a8d-a51743271aa3,89200c44-4dbd-45b0-9081-184b0a61f52f,d5b09802-2877-40d8-a71d-1c3db0860cc0,6720033c-1769-47ea-96d6-853a4e39cc63,e78a4df2-476d-4918-835a-8482ac59e0c1,8d0252a9-5ca0-4cd5-a7cd-138a9a21e63b,8efa99f8-66c6-4aad-8f7e-c30d68f9928c,7ccb137c-f46e-4003-a47c-6a6ab4bbb31d,cc16c8e7-f8d6-49fa-93e0-0e2a6f7234f1,af4bb157-094b-414a-81bf-cf5662b3c336,399a35a5-4e97-4769-a64d-9b1b4dba1cf9,30e8e4b9-c864-4b93-b8ea-b999e694e247,050783b8-29b0-40ba-8e26-040f987d39cf,9ba84461-337a-4def-9a28-2d42c3bfa801,e4f3444c-33bc-4443-b354-f010f20a1647,db593a0e-732f-48b4-9c73-233b9906beed,44ee9b45-e659-42b2-a69c-6a9186e97bb7,079b701c-9af7-49c4-86dd-34ba83f62483,523f21b3-ef3e-418d-ae16-2db505333112,9771968b-d43b-4947-87d5-0f7a9b44a490,bf6602ec-1b1c-4199-bf1b-3f3b20d31cb6,0e7038ad-81ee-4a0f-bc33-648a5112cfe1,9010e4a0-6ec8-4deb-a97a-aad77b69b948,d60c5d08-5712-4abe-b0d8-0c36d1f7e301,c4c9beb6-7729-4a71-ada1-a741ca43bc43,1fb12437-5941-495f-985c-a4c4b579253b,434fb0f3-8b23-40ad-ae13-c1d0d0aff02e,f33fb973-306f-42b8-ae44-b9fc590bcd0a,6af14282-e4ab-43c1-99cc-e61d224ade88,b605606d-567a-4b05-875d-ad9c0556a757,c6c87691-b1a6-4439-924f-2c1729d57b1f,c332f977-1a23-4a1a-9a00-0d0e29ff67b1,fba66014-732c-4351-9d4c-20b128a7a1ce,66415388-56ac-4360-9538-4b911cd2058f,e282611c-2659-430d-b24b-43751d21a522,632441f1-5d02-4510-92b2-5b8b3eaa27bd,f43e4b34-f5be-46cf-a043-1adefc636249,7ba22106-19a5-4ab3-ab68-0942884a93c9,95f4d3eb-3c68-449f-986e-f1a830b45ac5,5db7ee63-7233-4061-b867-5d6e534853ce,56a6db8b-c685-4a24-bf54-d6f9b676e1c1,943ddc3f-b22e-4eb7-b815-e7b540a290e6,89cbceeb-2fcd-49b4-9e89-ff11aa2faf71,a2c34b9a-f407-48d0-a637-ac251145f9be,365ffd3a-779a-4743-8bb3-a6cb6429f677,590e4e16-2f30-42bb-8467-650f286e5be7,f861060e-a2c7-4707-8f49-a493d66f0f13,1ac85469-3fef-4852-9157-6d26e4f4c5ce,2e1c16b7-0a06-4a93-817f-e7b0be0d3cf4,05f8dd99-a597-4d4e-a254-d25cdd4f3b5b,04287f92-eed1-4b7d-9101-cc9c8115348e,16e595df-98dd-4fa0-83ec-b3053e053bd6,50d37e90-3c89-4a6f-a00a-2aa7d00eec38,e1f3deb7-16b7-4768-a133-7e6b47ce86df,b889efbe-0549-4098-89d3-99aed4ba5fd5,f23bb53a-33d1-45cb-86e8-495603b0997a,27195d60-9264-42e7-8f7e-44c871b09ff3,944ec2ab-6134-4213-8d65-2d6113557bdc,91e715ec-2ef7-44f9-938b-ace81ded6454,33ed3470-10ee-499c-8bb0-eb91f4d90d7d,bc0d2f92-1f71-4ddb-9723-676c4fb00594,d18fdbb0-030f-4fe5-834c-84d16189aa42,07211c5b-42c8-412f-b4ad-0be3623847e5,4e970a35-295c-4da5-8ef9-aee0ca0787f0,f7901302-111d-4fe1-b6ff-1812a75b85ce,dff91eb6-dd7e-4745-b4d9-4abe02e0612b,fd017d27-be9e-4ed3-89e9-b6c73cfa5580,a4a6ab4f-3809-42e6-a355-fbd1d503e5e6,69e4e0f6-1f1b-425f-b31c-72ac294bda70,3f2d1677-b484-4c66-907f-c62f272ee059,9ca3a1af-76f4-45c7-9cb2-fa03f898509b,a31daad0-017e-4f2f-9528-92b1c5678a71,725ebed8-7bed-4ad6-bb9e-fe0848190ab6,0e178e2d-5243-48b6-917a-d50bc8b79d36,b9e5abb5-e730-48ce-ba2a-4d93b41415dd,1d551c98-1abd-4297-b95f-ff2ed26fa87a,687963df-83ae-4612-9d68-1db273d93a31,56b61b54-5f5d-49ed-84f8-56cc6d6d5653,355f9cbd-229b-4d6d-af59-ae5d8f99ee61,096af9c8-120b-4437-a1c4-d67de995d34f,7b5ed15e-2bc6-47e5-9f11-deb2d788a58b,b43c4b1d-cf57-457a-8cc6-1d1dc4157c9c,e7d86276-800e-470d-9ca4-597b4b1ef611,f0c94c0a-0caf-4af2-8662-25b643d4a35f,a9b55757-43a1-480f-b240-d8b4647ec642,f7d212e7-7748-4bf0-b23e-47078c8b001c,130d8cae-71f0-403f-b4d4-c691218e0e10,765360f3-a673-4e3e-b33b-61ddf48d9b88,0fddcd8b-1ea0-46b5-b35f-4bb53e8e4917,e652f9d7-d9fd-48b1-8b8b-99c331581123,e6bf2425-16f8-4636-83bd-b423d0ef1c9d,395390a1-be35-4279-b1ce-e5bf69fc2bd9,91284ee7-7686-496d-830e-f91209fffed9,9b4ef0f1-e948-4bad-9b4e-e26697b428e0,cbf2e57a-2c69-4736-b3c9-16d91c69c963,2cf81fcf-f0c0-4072-8176-62918e87345b,53b615c2-522a-4ea3-bced-737e7f36756d,62b48a2c-d7c9-44e2-872b-723d336cb05d,40326cc8-642a-4dac-a14d-05014c8ebb65,03dd4721-5db3-4269-ab79-76425cd2f411,9042443a-23e8-479b-a588-364aad3c28a8,0b5c7a53-cb60-400d-86d2-e51637b806e9,cc020b53-5722-42ec-a9bf-fbacca02a8d8,eceed997-f858-4cc3-8135-b82c0c44c165,792ec61a-8041-4c56-af65-008f69224b9f,e3b99309-d2d8-4b55-b52d-394647d3aa70,0ccedb0c-c8a1-481c-baaf-66673ed25cfe,b9b430ef-f231-4ab5-ae4b-7c12f82b119f,4ff52fc1-3285-4c64-8581-78bfcfc4e732,44798063-cbaf-4ce6-ab42-51938b7fb5c6,650635fc-97f4-4593-820c-817431f25caf,8b62f75d-b716-4cf5-8e78-06679798179d,3672a566-ef65-449f-a39f-98f8c20336f1,583556bb-f141-47cc-aceb-fe690b0389c1,22eb6111-9a9a-40da-b53c-2d83c820cbbf,a8ff8ff7-8fd0-48d3-bccc-8ae490824bcf,c8e02d71-4b6d-4a29-940d-1b3323f42ad3,319454be-583e-4674-a6db-294f0ee1ebb4,a023b28a-b2ea-4ed2-b915-5b898eae6c2a,550de88e-cbc5-4a48-b6d0-70023e7d55f1,16941b60-131b-47d9-8da9-0693831b8ac6,6c39c879-681e-40e7-b20d-796dc2b749e2,c9468b90-e5a0-4c94-b5e4-5fdc23af9382,3317c2bb-5761-41c8-af65-667eb7d37f89,96617afe-6bc8-4ea8-9dd8-b455bdc6bf2f,578c8c8d-2409-458e-80c9-6f6e7056e691,c13d33ae-dfc0-47d5-bb6c-4e8c1bee40e9,c90b64cf-7285-4da5-b4d7-e1cb2f54e0d1,9dd101f3-350d-45b3-a4cb-7e28946e1f9b,11121dbc-4d07-4bbe-8bb5-353355057f62,d38e4862-25e9-42c0-a35f-185a3269bbf9,73109a71-ab0b-474b-ac3d-01c495cbe82c,1e003aed-43af-46d9-96ca-76503c5bd50f,773cf9a1-1975-487a-a192-bbe5fe0977af,001f51e6-8e16-4228-aa8b-062a18e85414,35a27e94-2c8c-470a-840b-cbb17dc49922,4d9fdd07-7f15-4221-9fbc-f3419a5f8db3,5771e521-07f6-43be-932a-0ba26f7e1524,10c2f9e1-1d0a-43e3-8423-e3c34b8d4143,d195296c-1f9a-495f-b046-ddd71ec17f26,ac99d3a9-84f1-4cbe-89bc-69acf7f3ca1c,b0d9efcf-50f7-4756-9010-a61fd61cf49b,d63c0235-ee35-4a4c-8b29-6e55b6dab3bb,fa69bb08-5655-463f-a436-4a02b8d320c2,87c31cdd-c36d-41d7-a422-8f71148a5c5f,ef8f601c-037d-4cd9-8c17-d050cc74c134,dcb1522c-f02b-491f-891e-ed9832ba33b1,c64e483f-f726-44f7-81de-ff2853e06019,af58fe4a-f848-40a1-9040-c73bb6a8a120,fc4a3d17-eb98-4b74-a65e-f522ef783a0a,86a209ec-8f26-45a7-801b-383aa9c4bffe,804e002d-b727-4813-b228-7ccce03f707c,ee8b2d83-b871-407c-b6a7-0e569834750e,a3588c42-ce26-473b-9c8f-30d5461d5432,c8afb491-35c1-4d29-bc41-c1d9dacaf674,c5d9e642-d7f6-4172-91a8-cdededb0924c,912f9181-5ee5-40d5-bfee-962f08451335,10dc18cd-acf3-42a7-8414-ee54e982fde2,37929a40-15a9-4f04-a077-8bd12b820c46,e0760026-d520-4e5c-89e8-880b3fa91977,ce28d296-614c-45fe-a40e-63f2471ae737,66b349a6-6b1a-476a-9098-1748d2d5b150,59431990-9815-4a28-9242-ae230cdad3d6,5a39e214-9eef-4620-8c11-d7c8229a14a3,796af57e-f050-470a-91e0-22e029fd51c8,82292d3c-bd90-4926-88a4-3a1dca8d247d,1e6a3452-2805-45c4-84f4-8816149665f4,9f308571-a350-4f0f-8801-303a6507b409,fd090cf0-6f33-4355-bb9c-982d88c831f2,3eb31978-5917-41d8-9604-7874b8f34ab5,d04af6e3-00be-43cd-9c74-9978dd5fa567,bb72b5c2-dbbf-42db-9484-45f2edc5a8d8,818b9402-8bc9-4c1c-8e8b-7f7c4a5ae895,88c27ee9-5fa5-4c24-8a0e-5fdc72663ae5,4defd250-94f2-4e0c-a32e-7c402591c571,48c2e51e-88ff-4b0c-9676-cf5747670207,db7673fb-87cd-490c-ad01-700f33e06943,558f3e99-385e-4f35-a2b2-55f96d198665,7e5d0262-b2c1-484c-91ed-c6dcdcbe8793,8414555a-be08-4222-a3a6-77b09b0b9053,51cb4d64-ff69-40df-b2fb-7f0b58a779c5,2ed3dad2-4e75-4b97-bfc6-eeba0925609c,202507eb-7d17-4d24-bbad-21a013160eb8,c48dd8e2-1617-43d8-9a74-6dba0aaab5dd,5b082fbc-adb5-4265-8df2-f68ec2521c4f,1fd96973-ba8a-4762-9652-c18486d4108b,407224b5-426d-4c4f-9b1b-ba8e8d5c3fd6,2dc6657c-0f8a-481a-a88f-1209f5494fff,800db7d1-48bb-40e6-8201-23d11051dcad,c8fec5eb-3cbe-4794-91f0-58d7679e9ea2,bdcde425-465e-44a5-872d-036f247f97c7,824069f8-76a3-4b04-859f-577c136473bb,02497d24-38b2-4118-ba86-6d04785b049b,575c495f-11b4-40cb-a2f0-83492983f991,d3c929a3-1755-4866-b7c6-923d0cecb674,56bdee16-1a83-4cd4-8948-614908c1ee96,6537b129-ae0a-47af-a97f-e5fd8aba9a84,586fa6e9-910e-463c-9851-c5c2f588778f,7bb6cdac-b3d7-44d5-adcf-c04516c6b54f,e1104c2d-e3ac-4a68-a79f-45cb5be6f250,7ffcc5f0-c161-49e9-9201-ea17eeed2a30,d4981eab-a793-46de-b610-5c9d5a6d2bfc,6e651465-b9e1-4826-a2c4-a74f7840cdf8,6a850410-200f-45bd-be0e-d8dddb1dec94,10e66c1c-3ff1-409e-94c1-cc897c6f2b7e,aecbdfc0-e0a2-4b88-b65e-23a7801a99de,a7c97a7b-2a0e-468d-8b01-a4d760390844,230f51ca-40fc-4ecd-97e2-1ea7fa20d6ab,9d7e2995-27f0-46ca-a37e-a3dcb69156e0,24bf28f8-a62f-4ae3-a9df-de0153278ed6,71a938ce-cf4c-4bb7-8eb2-5187a7e204e2,3f3ad79f-2e08-4fc5-99c9-53a884fd123d,fa573263-9c53-4e6a-b880-68d47fb21da9,04137526-846d-450f-bde1-840df13238b5,33b75222-46cc-40bf-aaff-f3a351db78d0,f81d9587-1b34-488a-ad84-dec445c9a4d0,a607c826-2c82-4160-8b6e-042462758598,7a4d0491-6b33-489c-b88d-2958449b10dd}'::uuid[]))
                                                        Index Searches: 228
                                                        Buffers: shared hit=456
                                ->  Hash  (cost=2.71..2.71 rows=1 width=172) (actual time=0.004..0.005 rows=0.00 loops=1)
                                      Buckets: 1024  Batches: 1  Memory Usage: 8kB
                                      ->  Hash Right Join  (cost=0.01..2.71 rows=1 width=172) (actual time=0.004..0.005 rows=0.00 loops=1)
                                            Hash Cond: (fa.id = fb.author_id)
                                            ->  Seq Scan on users fa  (cost=0.00..2.50 rows=50 width=34) (never executed)
                                                  Filter: (deleted_at IS NULL)
                                            ->  Hash  (cost=0.00..0.00 rows=1 width=138) (actual time=0.002..0.003 rows=0.00 loops=1)
                                                  Buckets: 1024  Batches: 1  Memory Usage: 8kB
                                                  ->  Seq Scan on interview_feedbacks fb  (cost=0.00..0.00 rows=1 width=138) (actual time=0.002..0.002 rows=0.00 loops=1)
                          ->  Hash  (cost=2.50..2.50 rows=50 width=50) (actual time=0.027..0.027 rows=50.00 loops=1)
                                Buckets: 1024  Batches: 1  Memory Usage: 13kB
                                Buffers: shared hit=2
                                ->  Seq Scan on users au  (cost=0.00..2.50 rows=50 width=50) (actual time=0.007..0.015 rows=50.00 loops=1)
                                      Filter: (deleted_at IS NULL)
                                      Buffers: shared hit=2
                    ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..7.61 rows=1 width=52) (actual time=0.004..0.004 rows=1.00 loops=500)
                          Index Cond: (id = iv.application_id)
                          Filter: (deleted_at IS NULL)
                          Index Searches: 500
                          Buffers: shared hit=2000
              ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..0.33 rows=1 width=34) (actual time=0.002..0.002 rows=1.00 loops=500)
                    Index Cond: (id = app.candidate_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 500
                    Buffers: shared hit=1500
        ->  Memoize  (cost=0.15..0.17 rows=1 width=51) (actual time=0.001..0.001 rows=1.00 loops=500)
              Cache Key: app.job_id
              Cache Mode: logical
              Hits: 346  Misses: 154  Evictions: 0  Overflows: 0  Memory Usage: 25kB
              Buffers: shared hit=308
              ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..0.16 rows=1 width=51) (actual time=0.001..0.001 rows=1.00 loops=154)
                    Index Cond: (id = app.job_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 154
                    Buffers: shared hit=308
Planning:
  Buffers: shared hit=67
Planning Time: 2.136 ms
Execution Time: 12.775 ms
```

### Phỏng vấn tồn đọng – Admin

```sql
SELECT "iv"."id" AS "iv_id", "iv"."application_id" AS "iv_application_id", "iv"."round" AS "iv_round", "iv"."scheduled_at" AS "iv_scheduled_at", "iv"."duration_minutes" AS "iv_duration_minutes", "iv"."location" AS "iv_location", "iv"."status" AS "iv_status", "iv"."cancel_reason" AS "iv_cancel_reason", "iv"."created_by" AS "iv_created_by", "iv"."created_at" AS "iv_created_at", "iv"."updated_at" AS "iv_updated_at", "ia"."interview_id" AS "ia_interview_id", "ia"."user_id" AS "ia_user_id", "au"."id" AS "au_id", "au"."email" AS "au_email", "au"."full_name" AS "au_full_name", "fb"."id" AS "fb_id", "fb"."interview_id" AS "fb_interview_id", "fb"."author_id" AS "fb_author_id", "fb"."overall" AS "fb_overall", "fb"."ratings" AS "fb_ratings", "fb"."comment" AS "fb_comment", "fb"."editable_until" AS "fb_editable_until", "fb"."submitted_at" AS "fb_submitted_at", "fb"."updated_at" AS "fb_updated_at", "fa"."id" AS "fa_id", "fa"."full_name" AS "fa_full_name", "app"."id" AS "app_id", "app"."status" AS "app_status", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "job"."id" AS "job_id", "job"."title" AS "job_title" FROM "interviews" "iv" LEFT JOIN "interview_assignees" "ia" ON "ia"."interview_id"="iv"."id"  LEFT JOIN "users" "au" ON "au"."id"="ia"."user_id" AND ("au"."deleted_at" IS NULL)  LEFT JOIN "interview_feedbacks" "fb" ON "fb"."interview_id"="iv"."id"  LEFT JOIN "users" "fa" ON "fa"."id"="fb"."author_id" AND ("fa"."deleted_at" IS NULL)  LEFT JOIN "applications" "app" ON "app"."id"="iv"."application_id" AND ("app"."deleted_at" IS NULL)  LEFT JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL)  LEFT JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE "iv"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65, $66, $67, $68, $69, $70, $71, $72, $73, $74, $75, $76, $77, $78, $79, $80, $81, $82, $83, $84, $85, $86, $87, $88, $89, $90, $91, $92, $93, $94, $95, $96, $97, $98, $99, $100, $101, $102, $103, $104, $105, $106, $107, $108, $109, $110, $111, $112, $113, $114, $115, $116, $117, $118, $119, $120, $121, $122, $123, $124, $125, $126, $127, $128, $129, $130, $131, $132, $133, $134, $135, $136, $137, $138, $139, $140, $141, $142, $143, $144, $145, $146, $147, $148, $149, $150, $151, $152, $153, $154, $155, $156, $157, $158, $159, $160, $161) ORDER BY "iv"."scheduled_at" ASC, "au_full_name" ASC
```

```
Sort  (cost=2792.31..2792.71 rows=161 width=493) (actual time=3.105..3.118 rows=161.00 loops=1)
  Sort Key: iv.scheduled_at, au.full_name
  Sort Method: quicksort  Memory: 77kB
  Buffers: shared hit=2324
  ->  Nested Loop Left Join  (cost=360.23..2786.41 rows=161 width=493) (actual time=0.517..2.888 rows=161.00 loops=1)
        Buffers: shared hit=2324
        ->  Nested Loop Left Join  (cost=360.09..2760.22 rows=161 width=458) (actual time=0.512..2.615 rows=161.00 loops=1)
              Buffers: shared hit=2002
              ->  Nested Loop Left Join  (cost=359.80..2706.91 rows=161 width=440) (actual time=0.498..2.048 rows=161.00 loops=1)
                    Buffers: shared hit=1519
                    ->  Hash Left Join  (cost=359.38..1392.47 rows=161 width=388) (actual time=0.433..1.333 rows=161.00 loops=1)
                          Hash Cond: (ia.user_id = au.id)
                          Buffers: shared hit=875
                          ->  Nested Loop Left Join  (cost=356.25..1388.89 rows=161 width=338) (actual time=0.397..1.242 rows=161.00 loops=1)
                                Buffers: shared hit=873
                                ->  Hash Left Join  (cost=355.84..777.65 rows=161 width=306) (actual time=0.381..0.763 rows=161.00 loops=1)
                                      Hash Cond: (iv.id = fb.interview_id)
                                      Buffers: shared hit=389
                                      ->  Bitmap Heap Scan on interviews iv  (cost=353.11..774.31 rows=161 width=134) (actual time=0.359..0.668 rows=161.00 loops=1)
                                            Recheck Cond: (id = ANY ('{181ef8fd-5ca4-485b-af5e-fba3a70aa3ed,aa5cafc3-6c36-48c2-b536-1f57ceb0f3ea,80a4cfbf-79d1-4209-afee-c10ec093d9d9,23b27af1-c7bb-4439-87fe-3524c9699ed4,38b5c818-9ab0-4928-be63-5e2d06e6550e,a3c7edf1-421b-463d-b5e5-eed2195b733a,f02279a3-9dfb-4c59-b1c4-b9c6730a79ef,ccb836d9-565e-469e-97df-f03afe10eea1,13dfb1da-9177-4be7-a82c-ade1292f2eda,f977f0c3-576a-475c-aa57-d87b33fa3c63,33482d29-ad15-4aaf-8da6-401f1f10838e,9a747762-4f6f-4744-8c11-6a7be8990a53,4255bdcd-b5d7-4355-86d2-0a31ff4692b1,cf749624-a2b5-471d-a577-06e3340ed6ae,7d3de631-c755-4443-bb41-2c23f799bc7d,2e7c67f1-98c2-46ea-a429-eba425c02078,7a1e629c-feab-4720-a002-2017e0602162,04d7af57-9db0-4ec8-adb1-bd468ba91634,46c146bf-ce61-4b9f-893a-c1a6c8c8e62b,ff2bf763-0204-43e6-bf3a-1096bf14a602,548b4199-69c9-4c33-8431-125963f345cb,1483be98-355e-4c80-b24a-9a86e703e8de,4f5099bd-bf2f-41ea-9751-9e8c7472487e,a2efb411-cc9c-4b56-a48c-ea2b52ff0cad,dbd85365-68c5-468a-9ee3-1cde57157cb7,2c9e72fe-eb14-4a59-88b6-34570e4a411e,bdf8c526-ff89-4c9a-a100-8ac9d41f7a0b,b64d35a1-df84-4c51-a488-f7f07654b388,194e3e16-2427-4520-bf53-85fc1e6aa3cb,c40b6f39-0360-4496-934c-641e5ada8181,593c72dd-93fa-4c5f-9121-b857d48ac677,9d3c59ae-80b1-4146-b43a-a14a31a2fc70,c4d62212-65ad-4042-b0c1-0726f42c05c2,8eed89a5-4c25-4388-ada7-85b3406c3676,b5763a61-2335-4e5f-aa2d-a9b63e7a86df,f6d422d7-c8cb-4f14-abf4-c77cda8b5ac5,5905c65c-eb78-426d-9ef1-6b51badf73b3,8d036614-9c23-4e5a-b166-214b443fb715,de62784c-0625-40df-8c39-75336c475eba,0108d66e-c452-44e2-9f35-4d26ebd00226,3f23404c-2777-4517-a6ea-241b52591641,1d846357-07f4-4eab-bef9-4c894adeb3d7,619c3bf5-c5f3-41fb-92e2-6484e8acba0b,78133f84-afa1-4cf5-a6f5-ea7ddbbeb010,ad270a56-e8c6-4958-8cb2-f90ebbe28d80,97024787-46c6-4414-9018-db640792ebee,621b8141-9d10-488b-b216-119066a2d6f1,b56b3c9e-130d-4b16-94fe-8fcc89b9e2dd,3b986b45-b47d-4a47-8dbe-4a9f80b9d313,8b856689-30da-4a3e-bb52-7b1e841fbd06,0ac06514-bb98-4dde-ab6f-c1e9756eb747,14510216-9780-400e-9ed4-56e31b8d9ce2,556efe21-6a53-4c59-9219-8045746339e5,d92dad0f-b792-4980-9365-03c00ba33081,0ca00ab4-e7e6-464b-a218-b611bd7d8376,9fbf057f-5037-436b-b6ad-ab967e835baf,cb3537b4-cc51-42ef-9265-1026c04721f9,901b8a6b-7f22-4270-bbd7-354e6d051c28,a085d5e6-2cfe-40da-9ac0-3ce6029cd2bb,58502724-81ee-4b5a-9551-e29e56653826,3b5bc9af-418a-47e9-ac7a-c20a46e68356,6edd535a-bbec-4602-b9b6-755e7b551fc9,d1d8e2a2-ea80-43bf-87c3-9fe09aff473e,245c4604-e639-4b4c-a6e8-734e0ef897ad,57d560c8-7461-46ac-921e-7ef1de22c326,905b2cca-22fd-438a-98b3-90c880afa229,7ea08cc8-6b28-4513-9302-7c929222896c,32a41509-aeed-4a11-adac-ce3d8198bd53,5d387cdb-b973-47e7-a8fe-ea37ef7f2efc,d344a3b8-6f2f-4fab-98a1-a6ab17d3b675,1552c4fd-09d4-4391-9eee-0468fd58b2f2,23f1bced-bd00-4e0a-b3bf-3046fcad90fd,05ede159-c247-4f6f-9d01-d9323cbe98f6,65bcc1ad-2769-448d-b92f-21c57544bbf4,ecee423c-e1ee-456c-af15-a113013bfbfb,7d35c902-7cdd-4417-bdf6-c604e1ff39f5,a1c2ea08-5326-4716-a3c1-5d5814321b22,64f6c444-7b01-4ec1-9a18-5960459f3624,1c437438-a62c-4f6f-8904-5c377911a5ed,b6b4ede4-66f7-4131-9f27-f559dbb6b7dd,53f27348-b831-4173-96c0-64f7991d2138,4c08f90d-5fb8-4a52-aaa1-9198452343f5,ab5132cf-2cd4-4182-b5ed-a86070464858,3f298723-5669-4a10-a840-4062f9a416b1,6f7bc0fa-34fa-4650-a01c-aa20b6eccfa1,17035bcc-4cff-4250-af03-af44538515ee,e8b091aa-0ab7-40a7-a902-40e6071e7f5f,f10a8587-5cc9-472f-8a61-8b03ff47f771,c730a103-2a91-4d69-8008-0dd40efe8b71,80c4168e-3ba8-459c-85f9-bc8c95c683fe,550bc137-f08e-4a19-a4e2-ebafc41f0d29,9ca17dec-579c-4bd3-854c-1dfe69bd8ba1,9744ccc8-e019-48ec-86bd-f8ecd92671e2,19dadb39-e462-474f-812b-94e9ef57f7c3,a72452aa-f321-475d-972b-f0e6bd1aae1c,040a5368-e9f2-4f7d-9697-3f184fd8129d,a3e66223-7db8-4851-9602-a8a7505b8355,d2929826-ac86-4ccd-9934-c1af5888463c,7cb2807d-eb92-4c7a-9bf2-363d0b580bdf,36621dc9-b95d-43e7-a72b-b51c140eab93,ad539fae-871a-4dce-b3db-96594d841f09,790417f6-4365-4574-b385-c1776b60a62c,d205a1c9-5ef8-478f-a13b-eccd72713a76,f5a25f1b-6f0f-4e40-b8e4-8e6f39e58e2b,17e36d78-3587-4351-97bd-a9c155692cad,770d13b5-6560-40e9-9a21-3796d01a26ea,bc7ba1c5-12c8-45a0-ac88-6d445292752a,44fcbe50-48e3-44d2-8e05-e594cfb06866,028c0df8-b62a-40d5-aaa4-029e3cb17f7f,5b8be937-86c1-4341-aff1-53a3c5bb93cb,05867d32-e332-44c9-910f-360210a997f7,edff1765-bb44-47b8-ac38-00dd7d8896f4,d84c90ef-ac4c-4d69-bdfc-5f4a6bbb35b9,b96dcb05-557f-4394-b96d-485831c010cb,5c4e1459-40ce-4c08-aed0-05c357373542,de733076-2d7a-4854-9e10-6083ac00d082,1b0d587f-7bca-4c19-8cec-e01c9504fcc4,0736170d-996f-45a9-971b-078979ec8d2d,d10ee98a-c0d0-4d8b-b66b-4d49959a6c75,4a84c6c0-23b2-4a00-8ebb-7dd340e18d0f,ffc8d79c-14f3-4f42-892a-b49cd118b566,b625ad7d-0d5b-484a-b88d-6611dad2d26b,8b76f6b1-a7ee-42a0-b862-3b64824a96b5,aafe6c7b-8163-41bc-acb8-abbb3fb7ce55,1f295bf5-d76a-46b2-ba10-b1ca5c7e5279,f1a1c8b5-ed48-47e5-baac-ce132cba0a07,32501f38-b1fc-472c-a7ba-1915620d78dd,6251d7f1-6313-407a-a4f5-3c5101e3a793,9243c30e-4bf9-45b6-bdd6-0621c7bd0651,b91371ab-8212-486a-9887-2490053c183b,b09705f4-a2a6-4e85-992f-fbf62a078b89,caf9bcf2-1a44-499f-9ad4-b302f3c337ab,67e95168-63db-4b4b-9541-2f4e26fb1e16,06acc13e-f560-44a7-a165-83ef348cb1ec,b4c76495-b696-42de-a817-93c00f53d34e,6cc7fd4c-5752-45df-a944-3e8c2f722af2,7fc10229-84ca-48b9-8a82-824da22721c3,13926691-325c-4129-ad0a-bbc1c20ca310,92f1adcb-e889-47e0-b9c0-34a3a68722aa,152cd79f-3eed-4b63-8fbe-9512846ada14,65f1d6ae-dd6b-480e-9832-871a5d6be9b7,a2385802-872d-4106-9dab-b5f475f607f9,1d623576-eed8-4034-85b3-73cd2f939582,c6ccd5d4-8c9a-4b3d-b568-2efbf0d39116,0faad70c-c503-4b28-a8a2-72e99da3e589,7453f0c9-1624-487f-b441-da7f0c71ce94,dbf1304e-8a40-4fbd-a4bf-2a29a6e9f0ef,e5adf08d-da81-4c80-8054-4447d25fee86,95cf1022-9a1b-46d3-ab2a-34e3c6bc7882,0ee96717-729c-43b1-a205-06ab767221cc,4452e318-d0f5-43f1-a4e2-b16bcad6c03d,98405542-2528-4d97-a382-443eda8030cb,5b352672-c883-432b-a0ea-18d0f42591d6,dbd843a8-2bb5-472a-bcf9-ba7e71e20a78,a3ec25dd-b8b3-49d7-9ce1-13b357835cb6,d5b09802-2877-40d8-a71d-1c3db0860cc0,8d0252a9-5ca0-4cd5-a7cd-138a9a21e63b,8efa99f8-66c6-4aad-8f7e-c30d68f9928c,7ccb137c-f46e-4003-a47c-6a6ab4bbb31d,cc16c8e7-f8d6-49fa-93e0-0e2a6f7234f1,399a35a5-4e97-4769-a64d-9b1b4dba1cf9}'::uuid[]))
                                            Heap Blocks: exact=147
                                            Buffers: shared hit=389
                                            ->  Bitmap Index Scan on "PK_interviews"  (cost=0.00..352.67 rows=161 width=0) (actual time=0.334..0.334 rows=161.00 loops=1)
                                                  Index Cond: (id = ANY ('{181ef8fd-5ca4-485b-af5e-fba3a70aa3ed,aa5cafc3-6c36-48c2-b536-1f57ceb0f3ea,80a4cfbf-79d1-4209-afee-c10ec093d9d9,23b27af1-c7bb-4439-87fe-3524c9699ed4,38b5c818-9ab0-4928-be63-5e2d06e6550e,a3c7edf1-421b-463d-b5e5-eed2195b733a,f02279a3-9dfb-4c59-b1c4-b9c6730a79ef,ccb836d9-565e-469e-97df-f03afe10eea1,13dfb1da-9177-4be7-a82c-ade1292f2eda,f977f0c3-576a-475c-aa57-d87b33fa3c63,33482d29-ad15-4aaf-8da6-401f1f10838e,9a747762-4f6f-4744-8c11-6a7be8990a53,4255bdcd-b5d7-4355-86d2-0a31ff4692b1,cf749624-a2b5-471d-a577-06e3340ed6ae,7d3de631-c755-4443-bb41-2c23f799bc7d,2e7c67f1-98c2-46ea-a429-eba425c02078,7a1e629c-feab-4720-a002-2017e0602162,04d7af57-9db0-4ec8-adb1-bd468ba91634,46c146bf-ce61-4b9f-893a-c1a6c8c8e62b,ff2bf763-0204-43e6-bf3a-1096bf14a602,548b4199-69c9-4c33-8431-125963f345cb,1483be98-355e-4c80-b24a-9a86e703e8de,4f5099bd-bf2f-41ea-9751-9e8c7472487e,a2efb411-cc9c-4b56-a48c-ea2b52ff0cad,dbd85365-68c5-468a-9ee3-1cde57157cb7,2c9e72fe-eb14-4a59-88b6-34570e4a411e,bdf8c526-ff89-4c9a-a100-8ac9d41f7a0b,b64d35a1-df84-4c51-a488-f7f07654b388,194e3e16-2427-4520-bf53-85fc1e6aa3cb,c40b6f39-0360-4496-934c-641e5ada8181,593c72dd-93fa-4c5f-9121-b857d48ac677,9d3c59ae-80b1-4146-b43a-a14a31a2fc70,c4d62212-65ad-4042-b0c1-0726f42c05c2,8eed89a5-4c25-4388-ada7-85b3406c3676,b5763a61-2335-4e5f-aa2d-a9b63e7a86df,f6d422d7-c8cb-4f14-abf4-c77cda8b5ac5,5905c65c-eb78-426d-9ef1-6b51badf73b3,8d036614-9c23-4e5a-b166-214b443fb715,de62784c-0625-40df-8c39-75336c475eba,0108d66e-c452-44e2-9f35-4d26ebd00226,3f23404c-2777-4517-a6ea-241b52591641,1d846357-07f4-4eab-bef9-4c894adeb3d7,619c3bf5-c5f3-41fb-92e2-6484e8acba0b,78133f84-afa1-4cf5-a6f5-ea7ddbbeb010,ad270a56-e8c6-4958-8cb2-f90ebbe28d80,97024787-46c6-4414-9018-db640792ebee,621b8141-9d10-488b-b216-119066a2d6f1,b56b3c9e-130d-4b16-94fe-8fcc89b9e2dd,3b986b45-b47d-4a47-8dbe-4a9f80b9d313,8b856689-30da-4a3e-bb52-7b1e841fbd06,0ac06514-bb98-4dde-ab6f-c1e9756eb747,14510216-9780-400e-9ed4-56e31b8d9ce2,556efe21-6a53-4c59-9219-8045746339e5,d92dad0f-b792-4980-9365-03c00ba33081,0ca00ab4-e7e6-464b-a218-b611bd7d8376,9fbf057f-5037-436b-b6ad-ab967e835baf,cb3537b4-cc51-42ef-9265-1026c04721f9,901b8a6b-7f22-4270-bbd7-354e6d051c28,a085d5e6-2cfe-40da-9ac0-3ce6029cd2bb,58502724-81ee-4b5a-9551-e29e56653826,3b5bc9af-418a-47e9-ac7a-c20a46e68356,6edd535a-bbec-4602-b9b6-755e7b551fc9,d1d8e2a2-ea80-43bf-87c3-9fe09aff473e,245c4604-e639-4b4c-a6e8-734e0ef897ad,57d560c8-7461-46ac-921e-7ef1de22c326,905b2cca-22fd-438a-98b3-90c880afa229,7ea08cc8-6b28-4513-9302-7c929222896c,32a41509-aeed-4a11-adac-ce3d8198bd53,5d387cdb-b973-47e7-a8fe-ea37ef7f2efc,d344a3b8-6f2f-4fab-98a1-a6ab17d3b675,1552c4fd-09d4-4391-9eee-0468fd58b2f2,23f1bced-bd00-4e0a-b3bf-3046fcad90fd,05ede159-c247-4f6f-9d01-d9323cbe98f6,65bcc1ad-2769-448d-b92f-21c57544bbf4,ecee423c-e1ee-456c-af15-a113013bfbfb,7d35c902-7cdd-4417-bdf6-c604e1ff39f5,a1c2ea08-5326-4716-a3c1-5d5814321b22,64f6c444-7b01-4ec1-9a18-5960459f3624,1c437438-a62c-4f6f-8904-5c377911a5ed,b6b4ede4-66f7-4131-9f27-f559dbb6b7dd,53f27348-b831-4173-96c0-64f7991d2138,4c08f90d-5fb8-4a52-aaa1-9198452343f5,ab5132cf-2cd4-4182-b5ed-a86070464858,3f298723-5669-4a10-a840-4062f9a416b1,6f7bc0fa-34fa-4650-a01c-aa20b6eccfa1,17035bcc-4cff-4250-af03-af44538515ee,e8b091aa-0ab7-40a7-a902-40e6071e7f5f,f10a8587-5cc9-472f-8a61-8b03ff47f771,c730a103-2a91-4d69-8008-0dd40efe8b71,80c4168e-3ba8-459c-85f9-bc8c95c683fe,550bc137-f08e-4a19-a4e2-ebafc41f0d29,9ca17dec-579c-4bd3-854c-1dfe69bd8ba1,9744ccc8-e019-48ec-86bd-f8ecd92671e2,19dadb39-e462-474f-812b-94e9ef57f7c3,a72452aa-f321-475d-972b-f0e6bd1aae1c,040a5368-e9f2-4f7d-9697-3f184fd8129d,a3e66223-7db8-4851-9602-a8a7505b8355,d2929826-ac86-4ccd-9934-c1af5888463c,7cb2807d-eb92-4c7a-9bf2-363d0b580bdf,36621dc9-b95d-43e7-a72b-b51c140eab93,ad539fae-871a-4dce-b3db-96594d841f09,790417f6-4365-4574-b385-c1776b60a62c,d205a1c9-5ef8-478f-a13b-eccd72713a76,f5a25f1b-6f0f-4e40-b8e4-8e6f39e58e2b,17e36d78-3587-4351-97bd-a9c155692cad,770d13b5-6560-40e9-9a21-3796d01a26ea,bc7ba1c5-12c8-45a0-ac88-6d445292752a,44fcbe50-48e3-44d2-8e05-e594cfb06866,028c0df8-b62a-40d5-aaa4-029e3cb17f7f,5b8be937-86c1-4341-aff1-53a3c5bb93cb,05867d32-e332-44c9-910f-360210a997f7,edff1765-bb44-47b8-ac38-00dd7d8896f4,d84c90ef-ac4c-4d69-bdfc-5f4a6bbb35b9,b96dcb05-557f-4394-b96d-485831c010cb,5c4e1459-40ce-4c08-aed0-05c357373542,de733076-2d7a-4854-9e10-6083ac00d082,1b0d587f-7bca-4c19-8cec-e01c9504fcc4,0736170d-996f-45a9-971b-078979ec8d2d,d10ee98a-c0d0-4d8b-b66b-4d49959a6c75,4a84c6c0-23b2-4a00-8ebb-7dd340e18d0f,ffc8d79c-14f3-4f42-892a-b49cd118b566,b625ad7d-0d5b-484a-b88d-6611dad2d26b,8b76f6b1-a7ee-42a0-b862-3b64824a96b5,aafe6c7b-8163-41bc-acb8-abbb3fb7ce55,1f295bf5-d76a-46b2-ba10-b1ca5c7e5279,f1a1c8b5-ed48-47e5-baac-ce132cba0a07,32501f38-b1fc-472c-a7ba-1915620d78dd,6251d7f1-6313-407a-a4f5-3c5101e3a793,9243c30e-4bf9-45b6-bdd6-0621c7bd0651,b91371ab-8212-486a-9887-2490053c183b,b09705f4-a2a6-4e85-992f-fbf62a078b89,caf9bcf2-1a44-499f-9ad4-b302f3c337ab,67e95168-63db-4b4b-9541-2f4e26fb1e16,06acc13e-f560-44a7-a165-83ef348cb1ec,b4c76495-b696-42de-a817-93c00f53d34e,6cc7fd4c-5752-45df-a944-3e8c2f722af2,7fc10229-84ca-48b9-8a82-824da22721c3,13926691-325c-4129-ad0a-bbc1c20ca310,92f1adcb-e889-47e0-b9c0-34a3a68722aa,152cd79f-3eed-4b63-8fbe-9512846ada14,65f1d6ae-dd6b-480e-9832-871a5d6be9b7,a2385802-872d-4106-9dab-b5f475f607f9,1d623576-eed8-4034-85b3-73cd2f939582,c6ccd5d4-8c9a-4b3d-b568-2efbf0d39116,0faad70c-c503-4b28-a8a2-72e99da3e589,7453f0c9-1624-487f-b441-da7f0c71ce94,dbf1304e-8a40-4fbd-a4bf-2a29a6e9f0ef,e5adf08d-da81-4c80-8054-4447d25fee86,95cf1022-9a1b-46d3-ab2a-34e3c6bc7882,0ee96717-729c-43b1-a205-06ab767221cc,4452e318-d0f5-43f1-a4e2-b16bcad6c03d,98405542-2528-4d97-a382-443eda8030cb,5b352672-c883-432b-a0ea-18d0f42591d6,dbd843a8-2bb5-472a-bcf9-ba7e71e20a78,a3ec25dd-b8b3-49d7-9ce1-13b357835cb6,d5b09802-2877-40d8-a71d-1c3db0860cc0,8d0252a9-5ca0-4cd5-a7cd-138a9a21e63b,8efa99f8-66c6-4aad-8f7e-c30d68f9928c,7ccb137c-f46e-4003-a47c-6a6ab4bbb31d,cc16c8e7-f8d6-49fa-93e0-0e2a6f7234f1,399a35a5-4e97-4769-a64d-9b1b4dba1cf9}'::uuid[]))
                                                  Index Searches: 121
                                                  Buffers: shared hit=242
                                      ->  Hash  (cost=2.71..2.71 rows=1 width=172) (actual time=0.011..0.012 rows=0.00 loops=1)
                                            Buckets: 1024  Batches: 1  Memory Usage: 8kB
                                            ->  Hash Right Join  (cost=0.01..2.71 rows=1 width=172) (actual time=0.011..0.011 rows=0.00 loops=1)
                                                  Hash Cond: (fa.id = fb.author_id)
                                                  ->  Seq Scan on users fa  (cost=0.00..2.50 rows=50 width=34) (never executed)
                                                        Filter: (deleted_at IS NULL)
                                                  ->  Hash  (cost=0.00..0.00 rows=1 width=138) (actual time=0.002..0.003 rows=0.00 loops=1)
                                                        Buckets: 1024  Batches: 1  Memory Usage: 8kB
                                                        ->  Seq Scan on interview_feedbacks fb  (cost=0.00..0.00 rows=1 width=138) (actual time=0.002..0.002 rows=0.00 loops=1)
                                ->  Index Only Scan using "PK_interview_assignees" on interview_assignees ia  (cost=0.41..3.79 rows=1 width=32) (actual time=0.002..0.003 rows=1.00 loops=161)
                                      Index Cond: (interview_id = iv.id)
                                      Heap Fetches: 0
                                      Index Searches: 161
                                      Buffers: shared hit=484
                          ->  Hash  (cost=2.50..2.50 rows=50 width=50) (actual time=0.028..0.028 rows=50.00 loops=1)
                                Buckets: 1024  Batches: 1  Memory Usage: 13kB
                                Buffers: shared hit=2
                                ->  Seq Scan on users au  (cost=0.00..2.50 rows=50 width=50) (actual time=0.005..0.015 rows=50.00 loops=1)
                                      Filter: (deleted_at IS NULL)
                                      Buffers: shared hit=2
                    ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..8.16 rows=1 width=52) (actual time=0.004..0.004 rows=1.00 loops=161)
                          Index Cond: (id = iv.application_id)
                          Filter: (deleted_at IS NULL)
                          Index Searches: 161
                          Buffers: shared hit=644
              ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..0.33 rows=1 width=34) (actual time=0.003..0.003 rows=1.00 loops=161)
                    Index Cond: (id = app.candidate_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 161
                    Buffers: shared hit=483
        ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..0.16 rows=1 width=51) (actual time=0.001..0.001 rows=1.00 loops=161)
              Index Cond: (id = app.job_id)
              Filter: (deleted_at IS NULL)
              Index Searches: 161
              Buffers: shared hit=322
Planning:
  Buffers: shared hit=67
Planning Time: 1.928 ms
Execution Time: 3.213 ms
```

### Lịch phỏng vấn – Interviewer

```sql
SELECT "iv"."id" AS "id" FROM "interviews" "iv" INNER JOIN "applications" "app" ON "app"."id"="iv"."application_id" AND ("app"."deleted_at" IS NULL)  INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE "iv"."scheduled_at" >= $1 AND "iv"."scheduled_at" < $2 AND "iv"."status" <> $3 AND "iv"."status" <> $3 AND "iv"."scheduled_at" <= now() AND ("iv"."status" = $4 OR "app"."status" = $5) AND EXISTS (SELECT 1 FROM interview_assignees ia WHERE ia.interview_id = "iv"."id" AND ia.user_id = $6) AND EXISTS (SELECT 1 FROM "interviews" "scope_iv" INNER JOIN "interview_assignees" "scope_ia" ON "scope_ia"."interview_id" = "scope_iv"."id" WHERE "scope_ia"."user_id" = $7 AND "scope_iv"."status" <> 'CANCELLED' AND "scope_iv"."application_id" = "app"."id") ORDER BY "iv"."scheduled_at" ASC LIMIT 500
```

```
Limit  (cost=1213.97..1213.97 rows=1 width=24) (actual time=2.062..2.073 rows=7.00 loops=1)
  Buffers: shared hit=783
  ->  Sort  (cost=1213.97..1213.97 rows=1 width=24) (actual time=2.060..2.070 rows=7.00 loops=1)
        Sort Key: iv.scheduled_at
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=783
        ->  Nested Loop  (cost=664.28..1213.96 rows=1 width=24) (actual time=0.792..2.061 rows=7.00 loops=1)
              Buffers: shared hit=783
              ->  Nested Loop Semi Join  (cost=664.13..1213.80 rows=1 width=40) (actual time=0.788..2.044 rows=7.00 loops=1)
                    Buffers: shared hit=769
                    ->  Nested Loop  (cost=663.43..1206.49 rows=9 width=72) (actual time=0.775..1.984 rows=7.00 loops=1)
                          Buffers: shared hit=726
                          ->  Hash Join  (cost=663.01..1087.28 rows=15 width=44) (actual time=0.766..1.869 rows=19.00 loops=1)
                                Hash Cond: (ia.interview_id = iv.id)
                                Buffers: shared hit=650
                                ->  Bitmap Heap Scan on interview_assignees ia  (cost=32.93..450.22 rows=2663 width=16) (actual time=0.156..1.120 rows=2722.00 loops=1)
                                      Recheck Cond: (user_id = '9a976d87-0566-4989-9cdb-f030ae3e0e51'::uuid)
                                      Heap Blocks: exact=384
                                      Buffers: shared hit=388
                                      ->  Bitmap Index Scan on "IDX_interview_assignees_user_id"  (cost=0.00..32.26 rows=2663 width=0) (actual time=0.092..0.093 rows=2722.00 loops=1)
                                            Index Cond: (user_id = '9a976d87-0566-4989-9cdb-f030ae3e0e51'::uuid)
                                            Index Searches: 1
                                            Buffers: shared hit=4
                                ->  Hash  (cost=626.52..626.52 rows=285 width=44) (actual time=0.473..0.475 rows=293.00 loops=1)
                                      Buckets: 1024  Batches: 1  Memory Usage: 30kB
                                      Buffers: shared hit=262
                                      ->  Bitmap Heap Scan on interviews iv  (cost=7.93..626.52 rows=285 width=44) (actual time=0.068..0.426 rows=293.00 loops=1)
                                            Recheck Cond: ((scheduled_at >= '2026-11-12 05:18:52.467+00'::timestamp with time zone) AND (scheduled_at < '2026-12-13 05:18:52.467+00'::timestamp with time zone) AND (scheduled_at <= now()))
                                            Filter: ((status <> 'CANCELLED'::interview_status_enum) AND (status <> 'CANCELLED'::interview_status_enum))
                                            Heap Blocks: exact=259
                                            Buffers: shared hit=262
                                            ->  Bitmap Index Scan on "IDX_interviews_scheduled_at"  (cost=0.00..7.86 rows=285 width=0) (actual time=0.036..0.036 rows=293.00 loops=1)
                                                  Index Cond: ((scheduled_at >= '2026-11-12 05:18:52.467+00'::timestamp with time zone) AND (scheduled_at < '2026-12-13 05:18:52.467+00'::timestamp with time zone) AND (scheduled_at <= now()))
                                                  Index Searches: 1
                                                  Buffers: shared hit=3
                          ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..7.94 rows=1 width=36) (actual time=0.005..0.005 rows=0.37 loops=19)
                                Index Cond: (id = iv.application_id)
                                Filter: ((deleted_at IS NULL) AND ((iv.status = 'SCHEDULED'::interview_status_enum) OR (status = 'INTERVIEW'::application_status_enum)))
                                Rows Removed by Filter: 1
                                Index Searches: 19
                                Buffers: shared hit=76
                    ->  Nested Loop  (cost=0.70..0.80 rows=1 width=16) (actual time=0.008..0.008 rows=1.00 loops=7)
                          Buffers: shared hit=43
                          ->  Index Scan using "IDX_interviews_application_id" on interviews scope_iv  (cost=0.29..0.33 rows=1 width=32) (actual time=0.003..0.003 rows=1.00 loops=7)
                                Index Cond: (application_id = app.id)
                                Filter: (status <> 'CANCELLED'::interview_status_enum)
                                Index Searches: 7
                                Buffers: shared hit=21
                          ->  Index Only Scan using "PK_interview_assignees" on interview_assignees scope_ia  (cost=0.41..0.47 rows=1 width=16) (actual time=0.004..0.004 rows=1.00 loops=7)
                                Index Cond: ((interview_id = scope_iv.id) AND (user_id = '9a976d87-0566-4989-9cdb-f030ae3e0e51'::uuid))
                                Heap Fetches: 0
                                Index Searches: 7
                                Buffers: shared hit=22
              ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..0.16 rows=1 width=16) (actual time=0.002..0.002 rows=1.00 loops=7)
                    Index Cond: (id = app.job_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 7
                    Buffers: shared hit=14
Planning:
  Buffers: shared hit=76
Planning Time: 2.599 ms
Execution Time: 2.223 ms
```

### Bảng hồ sơ – Interviewer

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE ( EXISTS (SELECT 1 FROM "interviews" "scope_iv" INNER JOIN "interview_assignees" "scope_ia" ON "scope_ia"."interview_id" = "scope_iv"."id" WHERE "scope_ia"."user_id" = $1 AND "scope_iv"."status" <> 'CANCELLED' AND "scope_iv"."application_id" = "app"."id") ) AND ( "app"."deleted_at" IS NULL )
```

```
Aggregate  (cost=6956.26..6956.27 rows=1 width=4) (actual time=20.906..20.914 rows=1.00 loops=1)
  Buffers: shared hit=12235
  ->  Hash Join  (cost=2242.18..6949.60 rows=2663 width=0) (actual time=11.174..20.704 rows=2722.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=12235
        ->  Nested Loop  (cost=2226.68..6926.96 rows=2663 width=16) (actual time=11.090..20.082 rows=2722.00 loops=1)
              Buffers: shared hit=12224
              ->  HashAggregate  (cost=2226.26..2252.89 rows=2663 width=16) (actual time=11.058..11.451 rows=2722.00 loops=1)
                    Group Key: scope_iv.application_id
                    Batches: 1  Memory Usage: 217kB
                    Buffers: shared hit=1336
                    ->  Hash Join  (cost=483.50..2219.60 rows=2663 width=16) (actual time=1.183..10.412 rows=2722.00 loops=1)
                          Hash Cond: (scope_iv.id = scope_ia.interview_id)
                          Buffers: shared hit=1336
                          ->  Seq Scan on interviews scope_iv  (cost=0.00..1599.31 rows=52105 width=32) (actual time=0.004..5.335 rows=52105.00 loops=1)
                                Filter: (status <> 'CANCELLED'::interview_status_enum)
                                Buffers: shared hit=948
                          ->  Hash  (cost=450.22..450.22 rows=2663 width=16) (actual time=1.168..1.170 rows=2722.00 loops=1)
                                Buckets: 4096  Batches: 1  Memory Usage: 160kB
                                Buffers: shared hit=388
                                ->  Bitmap Heap Scan on interview_assignees scope_ia  (cost=32.93..450.22 rows=2663 width=16) (actual time=0.112..0.863 rows=2722.00 loops=1)
                                      Recheck Cond: (user_id = '9a976d87-0566-4989-9cdb-f030ae3e0e51'::uuid)
                                      Heap Blocks: exact=384
                                      Buffers: shared hit=388
                                      ->  Bitmap Index Scan on "IDX_interview_assignees_user_id"  (cost=0.00..32.26 rows=2663 width=0) (actual time=0.070..0.070 rows=2722.00 loops=1)
                                            Index Cond: (user_id = '9a976d87-0566-4989-9cdb-f030ae3e0e51'::uuid)
                                            Index Searches: 1
                                            Buffers: shared hit=4
              ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..1.77 rows=1 width=32) (actual time=0.003..0.003 rows=1.00 loops=2722)
                    Index Cond: (id = scope_iv.application_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 2722
                    Buffers: shared hit=10888
        ->  Hash  (cost=13.00..13.00 rows=200 width=16) (actual time=0.079..0.080 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 18kB
              Buffers: shared hit=11
              ->  Seq Scan on jobs job  (cost=0.00..13.00 rows=200 width=16) (actual time=0.015..0.057 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=11
Planning:
  Buffers: shared hit=33
Planning Time: 0.525 ms
Execution Time: 20.979 ms
```

### Thông báo – HR nhiều nhất

```sql
SELECT "n"."id" AS "n_id", "n"."created_at" AS "n_created_at" FROM "notifications" "n" WHERE "n"."user_id" = $1 ORDER BY "n_created_at" DESC, "n_id" DESC LIMIT 21
```

```
Limit  (cost=4679.95..4680.01 rows=21 width=24) (actual time=15.026..15.032 rows=21.00 loops=1)
  Buffers: shared hit=2677
  ->  Sort  (cost=4679.95..4750.89 rows=28373 width=24) (actual time=15.023..15.027 rows=21.00 loops=1)
        Sort Key: created_at DESC, id DESC
        Sort Method: top-N heapsort  Memory: 27kB
        Buffers: shared hit=2677
        ->  Bitmap Heap Scan on notifications n  (cost=1120.31..3914.97 rows=28373 width=24) (actual time=2.431..10.707 rows=28437.00 loops=1)
              Recheck Cond: (user_id = '011ab9f5-4d3f-40f0-be8f-18f8ab7a9e04'::uuid)
              Heap Blocks: exact=2440
              Buffers: shared hit=2677
              ->  Bitmap Index Scan on "IDX_notifications_user_id_read_at_created_at"  (cost=0.00..1113.22 rows=28373 width=0) (actual time=2.063..2.064 rows=28437.00 loops=1)
                    Index Cond: (user_id = '011ab9f5-4d3f-40f0-be8f-18f8ab7a9e04'::uuid)
                    Index Searches: 1
                    Buffers: shared hit=237
Planning Time: 0.091 ms
Execution Time: 15.056 ms
```

### Số thông báo chưa đọc – HR

```sql
SELECT COUNT(1) AS "cnt" FROM "notifications" "Notification" WHERE (("Notification"."user_id" = $1) AND ("Notification"."read_at" IS NULL))
```

```
Aggregate  (cost=156.57..156.58 rows=1 width=8) (actual time=0.485..0.485 rows=1.00 loops=1)
  Buffers: shared hit=23
  ->  Index Only Scan using "IDX_notifications_user_id_read_at_created_at" on notifications "Notification"  (cost=0.42..149.44 rows=2851 width=0) (actual time=0.013..0.318 rows=2861.00 loops=1)
        Index Cond: ((user_id = '011ab9f5-4d3f-40f0-be8f-18f8ab7a9e04'::uuid) AND (read_at IS NULL))
        Heap Fetches: 0
        Index Searches: 1
        Buffers: shared hit=23
Planning Time: 0.053 ms
Execution Time: 0.499 ms
```

### Nhật ký kiểm toán – trang đầu

```sql
SELECT "log"."id" AS "log_id", "log"."actor_id" AS "log_actor_id", "log"."action" AS "log_action", "log"."entity" AS "log_entity", "log"."entity_id" AS "log_entity_id", "log"."metadata" AS "log_metadata", "log"."ip" AS "log_ip", "log"."request_id" AS "log_request_id", "log"."created_at" AS "log_created_at", "actor"."id" AS "actor_id", "actor"."email" AS "actor_email", "actor"."full_name" AS "actor_full_name" FROM "audit_logs" "log" LEFT JOIN "users" "actor" ON  "actor"."id" = "log"."actor_id" AND "actor"."deleted_at" IS NULL ORDER BY "log"."created_at" DESC, "log"."id" DESC LIMIT 51
```

```
Limit  (cost=0.57..8.37 rows=51 width=364) (actual time=0.025..0.131 rows=51.00 loops=1)
  Buffers: shared hit=45
  ->  Nested Loop Left Join  (cost=0.57..42848.07 rows=280403 width=364) (actual time=0.024..0.123 rows=51.00 loops=1)
        Buffers: shared hit=45
        ->  Index Scan Backward using "IDX_audit_logs_created_at_id" on audit_logs log  (cost=0.42..35914.10 rows=280403 width=314) (actual time=0.009..0.032 rows=51.00 loops=1)
              Index Searches: 1
              Buffers: shared hit=19
        ->  Memoize  (cost=0.15..0.17 rows=1 width=50) (actual time=0.001..0.001 rows=1.00 loops=51)
              Cache Key: log.actor_id
              Cache Mode: logical
              Hits: 38  Misses: 13  Evictions: 0  Overflows: 0  Memory Usage: 3kB
              Buffers: shared hit=26
              ->  Index Scan using "PK_a3ffb1c0c8416b9fc6f907b7433" on users actor  (cost=0.14..0.16 rows=1 width=50) (actual time=0.002..0.002 rows=1.00 loops=13)
                    Index Cond: (id = log.actor_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 13
                    Buffers: shared hit=26
Planning:
  Buffers: shared hit=6
Planning Time: 0.241 ms
Execution Time: 0.162 ms
```

### Tin công khai – trang đầu

```sql
SELECT "job"."id" AS "job_id", "job"."title" AS "job_title", "job"."location" AS "job_location", "job"."jd_version" AS "job_jd_version", "job"."published_at" AS "job_published_at", "job"."salary_min" AS "job_salary_min", "job"."salary_max" AS "job_salary_max", "job"."salary_visibility" AS "job_salary_visibility", "job"."level" AS "job_level", "job"."employment_type" AS "job_employment_type", "job"."work_mode" AS "job_work_mode", "job"."headcount" AS "job_headcount", "job"."deadline" AS "job_deadline", "department"."id" AS "department_id", "department"."name" AS "department_name" FROM "jobs" "job" INNER JOIN "departments" "department" ON "department"."id"="job"."department_id" AND ("department"."deleted_at" IS NULL) WHERE ( "job"."status" = $1 AND ("job"."deadline" IS NULL OR "job"."deadline" >= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) ) AND ( "job"."deleted_at" IS NULL ) ORDER BY "job_published_at" DESC, "job_id" DESC LIMIT 20 OFFSET 0
```

```
Limit  (cost=22.19..22.24 rows=20 width=132) (actual time=0.173..0.176 rows=20.00 loops=1)
  Buffers: shared hit=12
  ->  Sort  (cost=22.19..22.64 rows=180 width=132) (actual time=0.172..0.174 rows=20.00 loops=1)
        Sort Key: job.published_at DESC, job.id DESC
        Sort Method: top-N heapsort  Memory: 34kB
        Buffers: shared hit=12
        ->  Hash Join  (cost=1.23..17.40 rows=180 width=132) (actual time=0.012..0.113 rows=180.00 loops=1)
              Hash Cond: (job.department_id = department.id)
              Buffers: shared hit=12
              ->  Seq Scan on jobs job  (cost=0.00..15.50 rows=180 width=119) (actual time=0.005..0.075 rows=180.00 loops=1)
                    Filter: ((deleted_at IS NULL) AND (status = 'OPEN'::jobs_status_enum) AND ((deadline IS NULL) OR (deadline >= ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh'::text))::date)))
                    Rows Removed by Filter: 20
                    Buffers: shared hit=11
              ->  Hash  (cost=1.10..1.10 rows=10 width=29) (actual time=0.005..0.005 rows=10.00 loops=1)
                    Buckets: 1024  Batches: 1  Memory Usage: 9kB
                    Buffers: shared hit=1
                    ->  Seq Scan on departments department  (cost=0.00..1.10 rows=10 width=29) (actual time=0.001..0.003 rows=10.00 loops=1)
                          Filter: (deleted_at IS NULL)
                          Buffers: shared hit=1
Planning:
  Buffers: shared hit=4
Planning Time: 0.236 ms
Execution Time: 0.195 ms
```
