# Kết quả đo: phase5-after

- Thời điểm: 2026-11-13T05:44:16.428Z
- Máy: 11th Gen Intel(R) Core(TM) i7-11850H @ 2.50GHz · 16 luồng · RAM 16 GB · Node v22.22.0
- DB: ncc_intern_perf; 50 request mỗi kịch bản, 5 request đồng thời, 10 request làm nóng
- Từ khoá tìm: "binh doan"

## Endpoint

| Kịch bản | Query/request | p50 (ms) | p95 (ms) | max (ms) | Query chậm nhất (EXPLAIN ANALYZE) |
|---|---|---|---|---|---|
| Bảng hồ sơ – mặc định (mới nhất) | 4 (limit 100: 4) | 55.2 | 112.7 | 149.3 | 24.297 ms · Index Only Scan applications (IDX_applications_created_at_id) |
| Bảng hồ sơ – sắp theo điểm | 4 | 51.3 | 73.1 | 114.2 | 23.175 ms · Index Only Scan applications (IDX_applications_created_at_id) |
| Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm | 4 | 30 | 46.5 | 47.5 | 0.369 ms · Bitmap Heap Scan applications, Seq Scan jobs, Index Scan candidates (PK_140681296bf033ab1eb95288abb) |
| Bảng hồ sơ – lọc cờ thiếu MUST | 4 | 60.8 | 80.6 | 82.9 | 33.202 ms · Bitmap Heap Scan applications |
| Bảng hồ sơ – tìm tên không dấu | 4 | 42.8 | 56.6 | 59.4 | 1.922 ms · Bitmap Heap Scan candidates, Index Scan applications (IDX_applications_candidate_id) |
| Bảng hồ sơ – trang sâu (OFFSET 150.000) | 4 | 47.8 | 66.4 | 85.8 | 26.731 ms · Index Only Scan applications (IDX_applications_created_at_id) |
| Bảng hồ sơ – Hiring Manager (scope phòng) | 4 (limit 100: 4) | 31.7 | 42.5 | 43.2 | 4.108 ms · Seq Scan jobs, Index Only Scan applications (IDX_applications_job_id_status_score) |
| Danh sách job kèm pipeline | 4 (limit 100: 4) | 31.4 | 42.8 | 45.4 | 4.806 ms · Index Only Scan applications (IDX_applications_job_id_status_score) |
| Xếp hạng job đông hồ sơ nhất | 4 | 253.1 | 336.6 | 346.7 | 16.728 ms · Seq Scan candidates, Bitmap Heap Scan applications |
| Chi tiết hồ sơ | 3 | 21.7 | 32.4 | 34.9 | 0.051 ms · Index Scan applications (PK_938c0a27255637bde919591888f), Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345), Index Scan candidates (PK_140681296bf033ab1eb95288abb), Index Scan cv_files (PK_89bdf76e79a74acd27e46e1be82) |
| Kho ứng viên – trang đầu | 4 (limit 100: 4) | 28 | 38.9 | 40.4 | 6.262 ms · Seq Scan candidates |
| Kho ứng viên – tìm không dấu | 4 | 25.3 | 29.1 | 30.5 | 1.087 ms · Bitmap Heap Scan candidates |
| Kho ứng viên – Hiring Manager | 4 | 41.1 | 52.5 | 58.7 | 18.212 ms · Seq Scan candidates, Seq Scan jobs, Index Only Scan applications (UQ_applications_job_id_candidate_id) |
| Dashboard – Admin | 2 | 22.6 | 33.5 | 34.5 | 209.102 ms · Seq Scan applications, Seq Scan jobs |
| Dashboard – Hiring Manager | 2 | 12.2 | 17.6 | 17.7 | 139.239 ms · Seq Scan applications, Seq Scan jobs |
| Phễu tuyển dụng 90 ngày – Admin | 2 | 17.9 | 21.4 | 21.5 | 555.832 ms · Seq Scan application_status_history, Seq Scan applications, Seq Scan jobs |
| Phễu tuyển dụng – job đông nhất | 3 | 21.2 | 40.7 | 41.5 | 7.15 ms · Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345), Bitmap Heap Scan applications, Index Scan application_status_history (IDX_application_status_history_application_id_changed_at) |
| So sánh 3 hồ sơ | 5 | 28.2 | 42.2 | 42.5 | 0.222 ms · Index Scan applications (PK_938c0a27255637bde919591888f), Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345), Index Scan candidates (PK_140681296bf033ab1eb95288abb) |
| Lịch phỏng vấn 30 ngày – Admin (1 trang 200) | 3 | 119.1 | 130.5 | 358.3 | 7.059 ms · Bitmap Heap Scan interviews, Seq Scan users, Seq Scan interview_feedbacks, Index Only Scan interview_assignees (PK_interview_assignees), Index Scan applications (PK_938c0a27255637bde919591888f), Index Scan candidates (PK_140681296bf033ab1eb95288abb), Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345) |
| Phỏng vấn tồn đọng – Admin (1 trang 200) | 3 | 119.1 | 168.3 | 168.6 | 1.98 ms · Bitmap Heap Scan interviews, Seq Scan users, Seq Scan interview_feedbacks, Index Only Scan interview_assignees (PK_interview_assignees), Index Scan applications (PK_938c0a27255637bde919591888f), Index Scan candidates (PK_140681296bf033ab1eb95288abb), Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345) |
| Lịch phỏng vấn – Interviewer | 3 | 27.4 | 35.2 | 38 | 1.26 ms · Bitmap Heap Scan interview_assignees, Bitmap Heap Scan interviews, Index Scan applications (PK_938c0a27255637bde919591888f), Index Scan interviews (IDX_interviews_application_id), Index Only Scan interview_assignees (PK_interview_assignees), Index Scan jobs (PK_cf0a6c42b72fcc7f7c237def345) |
| Bảng hồ sơ – Interviewer | 4 | 49.1 | 163.4 | 164.3 | 29.046 ms · Seq Scan interviews, Bitmap Heap Scan interview_assignees, Index Scan applications (PK_938c0a27255637bde919591888f), Seq Scan jobs |
| Thông báo – HR nhiều nhất | 3 | 35.2 | 44.4 | 45 | 11.17 ms · Bitmap Heap Scan notifications |
| Số thông báo chưa đọc – HR | 2 | 17.6 | 24.1 | 24.3 | 0.513 ms · Index Only Scan notifications (IDX_notifications_user_id_read_at_created_at) |
| Nhật ký kiểm toán – trang đầu | 2 | 24.7 | 32.6 | 33.5 | 0.114 ms · Index Scan users (PK_a3ffb1c0c8416b9fc6f907b7433) |
| Tin công khai – trang đầu | 2 | 17.7 | 22.1 | 23.8 | 0.236 ms · Seq Scan jobs, Seq Scan departments |

## Mô phỏng trước/sau (chạy thẳng trên DB, 30 lần)

| Bài toán | Cách làm | Số query | p50 (ms) | p95 (ms) |
|---|---|---|---|---|
| List hồ sơ 20 dòng | N+1: lấy ứng viên, job từng dòng | 41 | 43.2 | 53.4 |
| List hồ sơ 20 dòng | JOIN, chỉ chọn cột cần | 1 | 1.8 | 2.4 |
| Job kèm pipeline 20 job | Đếm từng job, từng nhóm | 80 | 97.5 | 119.9 |
| Job kèm pipeline 20 job | Một câu GROUP BY + COUNT FILTER | 1 | 5.5 | 7.1 |
| Dashboard | Nhiều query rời (tổng, từng trạng thái, từng job) | 210 | 301.4 | 368.4 |
| Dashboard | Một query tổng hợp theo job | 1 | 224.3 | 259.8 |
| Trang thứ 7.501 (20 dòng) | OFFSET 150.000 | 1 | 12.7 | 19.6 |
| Trang thứ 7.501 (20 dòng) | Cursor (created_at, id) | 1 | 1.1 | 1.5 |

## Kế hoạch thực thi

### Bảng hồ sơ – mặc định (mới nhất)

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" WHERE "app"."deleted_at" IS NULL
```

```
Finalize Aggregate  (cost=7898.30..7898.31 rows=1 width=4) (actual time=22.003..24.270 rows=1.00 loops=1)
  Buffers: shared hit=1212
  ->  Gather  (cost=7898.09..7898.30 rows=2 width=8) (actual time=21.898..24.258 rows=3.00 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        Buffers: shared hit=1212
        ->  Partial Aggregate  (cost=6898.09..6898.10 rows=1 width=8) (actual time=17.021..17.022 rows=1.00 loops=3)
              Buffers: shared hit=1212
              ->  Parallel Index Only Scan using "IDX_applications_created_at_id" on applications app  (cost=0.42..6689.75 rows=83333 width=0) (actual time=0.053..12.692 rows=66666.67 loops=3)
                    Heap Fetches: 0
                    Index Searches: 1
                    Buffers: shared hit=1212
Planning:
  Buffers: shared hit=1
Planning Time: 0.069 ms
Execution Time: 24.297 ms
```

### Bảng hồ sơ – sắp theo điểm

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" WHERE "app"."deleted_at" IS NULL
```

```
Finalize Aggregate  (cost=7898.30..7898.31 rows=1 width=4) (actual time=21.070..23.150 rows=1.00 loops=1)
  Buffers: shared hit=1212
  ->  Gather  (cost=7898.09..7898.30 rows=2 width=8) (actual time=20.966..23.141 rows=3.00 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        Buffers: shared hit=1212
        ->  Partial Aggregate  (cost=6898.09..6898.10 rows=1 width=8) (actual time=17.384..17.385 rows=1.00 loops=3)
              Buffers: shared hit=1212
              ->  Parallel Index Only Scan using "IDX_applications_created_at_id" on applications app  (cost=0.42..6689.75 rows=83333 width=0) (actual time=0.042..13.218 rows=66666.67 loops=3)
                    Heap Fetches: 0
                    Index Searches: 1
                    Buffers: shared hit=1212
Planning:
  Buffers: shared hit=1
Planning Time: 0.072 ms
Execution Time: 23.175 ms
```

### Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=104.40..348.51 rows=20 width=183) (actual time=0.193..0.339 rows=20.00 loops=1)
  Buffers: shared hit=151
  ->  Hash Join  (cost=104.11..182.36 rows=20 width=133) (actual time=0.171..0.204 rows=20.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=91
        ->  Bitmap Heap Scan on applications app  (cost=88.61..166.81 rows=20 width=82) (actual time=0.079..0.101 rows=20.00 loops=1)
              Recheck Cond: (id = ANY ('{f95fdb28-5c5b-4091-91da-c2cb6f86a406,ee680341-e4a4-42a1-b12a-2edfa3163466,e78f60ef-cb34-4ee2-9681-708c80e9f5b8,e64bdd44-a0b2-452e-963f-443d8b9bf3f9,e14ca354-8b31-453d-9ed0-8be737575f71,dd870b51-ab15-4908-bddc-bacf1b7f99f6,d7db15a9-f063-4664-b3b2-105f13e4a62e,ccde6f6b-74d2-4e95-8abf-941b037bb68f,ba4714ce-6910-4320-856c-60f32dcfd0f0,b99fc71d-d97d-41ee-bcba-c5b70b7a39f8,acd428fb-0389-4f83-b5bf-1c6d76d35f61,a8adc0bf-c3f1-4be9-b2ab-57a5f8dc801b,a138caaa-b36e-4d41-b92f-100a4c278b1a,8b57cf15-321c-4823-85d2-81de9f1ee47f,87dbd39d-5279-4d75-bd98-c1d345e75bc6,807ab025-332c-4974-a84f-638196611ff3,7eae2fb5-cd7f-4bc6-9b56-0fcc830d4550,74b5f5b6-9e90-4423-84bb-1b1bd257e807,6da5394d-f44e-4473-9971-f377bd0c1d0e,699f33e8-8be8-4f0b-810b-d67ca42a5837}'::uuid[]))
              Filter: (deleted_at IS NULL)
              Heap Blocks: exact=20
              Buffers: shared hit=80
              ->  Bitmap Index Scan on "PK_938c0a27255637bde919591888f"  (cost=0.00..88.55 rows=20 width=0) (actual time=0.071..0.072 rows=20.00 loops=1)
                    Index Cond: (id = ANY ('{f95fdb28-5c5b-4091-91da-c2cb6f86a406,ee680341-e4a4-42a1-b12a-2edfa3163466,e78f60ef-cb34-4ee2-9681-708c80e9f5b8,e64bdd44-a0b2-452e-963f-443d8b9bf3f9,e14ca354-8b31-453d-9ed0-8be737575f71,dd870b51-ab15-4908-bddc-bacf1b7f99f6,d7db15a9-f063-4664-b3b2-105f13e4a62e,ccde6f6b-74d2-4e95-8abf-941b037bb68f,ba4714ce-6910-4320-856c-60f32dcfd0f0,b99fc71d-d97d-41ee-bcba-c5b70b7a39f8,acd428fb-0389-4f83-b5bf-1c6d76d35f61,a8adc0bf-c3f1-4be9-b2ab-57a5f8dc801b,a138caaa-b36e-4d41-b92f-100a4c278b1a,8b57cf15-321c-4823-85d2-81de9f1ee47f,87dbd39d-5279-4d75-bd98-c1d345e75bc6,807ab025-332c-4974-a84f-638196611ff3,7eae2fb5-cd7f-4bc6-9b56-0fcc830d4550,74b5f5b6-9e90-4423-84bb-1b1bd257e807,6da5394d-f44e-4473-9971-f377bd0c1d0e,699f33e8-8be8-4f0b-810b-d67ca42a5837}'::uuid[]))
                    Index Searches: 20
                    Buffers: shared hit=60
        ->  Hash  (cost=13.00..13.00 rows=200 width=51) (actual time=0.084..0.084 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 25kB
              Buffers: shared hit=11
              ->  Seq Scan on jobs job  (cost=0.00..13.00 rows=200 width=51) (actual time=0.008..0.043 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=11
  ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=66) (actual time=0.006..0.006 rows=1.00 loops=20)
        Index Cond: (id = app.candidate_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 20
        Buffers: shared hit=60
Planning:
  Buffers: shared hit=21
Planning Time: 0.421 ms
Execution Time: 0.369 ms
```

### Bảng hồ sơ – lọc cờ thiếu MUST

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" WHERE ( "app"."flags" @> ARRAY['MISSING_MUST']::score_flag_enum[] ) AND ( "app"."deleted_at" IS NULL )
```

```
Aggregate  (cost=17658.78..17658.79 rows=1 width=4) (actual time=33.154..33.156 rows=1.00 loops=1)
  Buffers: shared hit=16139
  ->  Bitmap Heap Scan on applications app  (cost=409.79..17508.95 rows=59933 width=0) (actual time=7.805..30.341 rows=60174.00 loops=1)
        Recheck Cond: ((flags @> '{MISSING_MUST}'::score_flag_enum[]) AND (deleted_at IS NULL))
        Heap Blocks: exact=16125
        Buffers: shared hit=16139
        ->  Bitmap Index Scan on "IDX_applications_flags"  (cost=0.00..394.80 rows=59933 width=0) (actual time=4.746..4.747 rows=60174.00 loops=1)
              Index Cond: (flags @> '{MISSING_MUST}'::score_flag_enum[])
              Index Searches: 1
              Buffers: shared hit=14
Planning:
  Buffers: shared hit=1
Planning Time: 0.084 ms
Execution Time: 33.202 ms
```

### Bảng hồ sơ – tìm tên không dấu

```sql
SELECT "app"."id" AS "id" FROM "applications" "app" INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( (f_unaccent(lower("candidate"."full_name")) LIKE '%' || f_unaccent(lower($1)) || '%' OR "candidate"."email" LIKE '%' || lower($1) || '%') ) AND ( "app"."deleted_at" IS NULL ) ORDER BY "app"."created_at" DESC, "app"."id" DESC LIMIT 20 OFFSET 0
```

```
Limit  (cost=392.18..392.23 rows=20 width=24) (actual time=1.879..1.883 rows=20.00 loops=1)
  Buffers: shared hit=186
  ->  Sort  (cost=392.18..392.28 rows=40 width=24) (actual time=1.878..1.880 rows=20.00 loops=1)
        Sort Key: app.created_at DESC, app.id DESC
        Sort Method: top-N heapsort  Memory: 27kB
        Buffers: shared hit=186
        ->  Nested Loop  (cost=146.71..391.12 rows=40 width=24) (actual time=1.547..1.853 rows=76.00 loops=1)
              Buffers: shared hit=186
              ->  Bitmap Heap Scan on candidates candidate  (cost=146.29..185.82 rows=10 width=16) (actual time=1.534..1.686 rows=19.00 loops=1)
                    Recheck Cond: (((f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text) AND (deleted_at IS NULL)) OR (((email)::text ~~ '%binh doan%'::text) AND (deleted_at IS NULL)))
                    Rows Removed by Index Recheck: 14
                    Heap Blocks: exact=33
                    Buffers: shared hit=101
                    ->  BitmapOr  (cost=146.29..146.29 rows=10 width=0) (actual time=1.485..1.485 rows=0.00 loops=1)
                          Buffers: shared hit=68
                          ->  Bitmap Index Scan on "IDX_candidates_full_name_trgm"  (cost=0.00..77.23 rows=5 width=0) (actual time=0.793..0.793 rows=33.00 loops=1)
                                Index Cond: (f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text)
                                Index Searches: 1
                                Buffers: shared hit=34
                          ->  Bitmap Index Scan on "IDX_candidates_email_trgm"  (cost=0.00..69.05 rows=5 width=0) (actual time=0.689..0.689 rows=33.00 loops=1)
                                Index Cond: ((email)::text ~~ '%binh doan%'::text)
                                Index Searches: 1
                                Buffers: shared hit=34
              ->  Index Scan using "IDX_applications_candidate_id" on applications app  (cost=0.42..20.49 rows=4 width=40) (actual time=0.006..0.008 rows=4.00 loops=19)
                    Index Cond: (candidate_id = candidate.id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 19
                    Buffers: shared hit=85
Planning:
  Buffers: shared hit=19
Planning Time: 0.470 ms
Execution Time: 1.922 ms
```

### Bảng hồ sơ – trang sâu (OFFSET 150.000)

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" WHERE "app"."deleted_at" IS NULL
```

```
Finalize Aggregate  (cost=7898.30..7898.31 rows=1 width=4) (actual time=23.446..26.682 rows=1.00 loops=1)
  Buffers: shared hit=1212
  ->  Gather  (cost=7898.09..7898.30 rows=2 width=8) (actual time=23.327..26.672 rows=3.00 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        Buffers: shared hit=1212
        ->  Partial Aggregate  (cost=6898.09..6898.10 rows=1 width=8) (actual time=18.422..18.423 rows=1.00 loops=3)
              Buffers: shared hit=1212
              ->  Parallel Index Only Scan using "IDX_applications_created_at_id" on applications app  (cost=0.42..6689.75 rows=83333 width=0) (actual time=0.029..13.469 rows=66666.67 loops=3)
                    Heap Fetches: 0
                    Index Searches: 1
                    Buffers: shared hit=1212
Planning:
  Buffers: shared hit=1
Planning Time: 0.215 ms
Execution Time: 26.731 ms
```

### Bảng hồ sơ – Hiring Manager (scope phòng)

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE ( "job"."department_id" = $1 ) AND ( "app"."deleted_at" IS NULL )
```

```
Aggregate  (cost=1335.05..1335.06 rows=1 width=4) (actual time=4.081..4.081 rows=1.00 loops=1)
  Buffers: shared hit=236
  ->  Nested Loop  (cost=0.42..1285.05 rows=20000 width=0) (actual time=0.013..3.270 rows=21047.00 loops=1)
        Buffers: shared hit=236
        ->  Seq Scan on jobs job  (cost=0.00..13.50 rows=20 width=16) (actual time=0.004..0.030 rows=20.00 loops=1)
              Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
              Rows Removed by Filter: 180
              Buffers: shared hit=11
        ->  Index Only Scan using "IDX_applications_job_id_status_score" on applications app  (cost=0.42..53.05 rows=1053 width=16) (actual time=0.006..0.099 rows=1052.35 loops=20)
              Index Cond: (job_id = job.id)
              Heap Fetches: 0
              Index Searches: 20
              Buffers: shared hit=225
Planning:
  Buffers: shared hit=5
Planning Time: 0.155 ms
Execution Time: 4.108 ms
```

### Danh sách job kèm pipeline

```sql
SELECT "app"."job_id" AS "jobId", COUNT(*) FILTER (WHERE "app"."status" = 'NEW')::int AS "new", COUNT(*) FILTER (WHERE "app"."status" IN ('SCREENING', 'INTERVIEW', 'OFFER'))::int AS "inProgress", COUNT(*) FILTER (WHERE "app"."status" = 'HIRED')::int AS "hired", COUNT(*) FILTER (WHERE "app"."status" IN ('REJECTED', 'WITHDRAWN'))::int AS "closed" FROM "applications" "app" WHERE ( "app"."job_id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL ) GROUP BY "app"."job_id"
```

```
GroupAggregate  (cost=0.42..1558.63 rows=190 width=32) (actual time=0.447..4.757 rows=19.00 loops=1)
  Group Key: job_id
  Buffers: shared hit=214
  ->  Index Only Scan using "IDX_applications_job_id_status_score" on applications app  (cost=0.42..1058.24 rows=20909 width=20) (actual time=0.030..2.311 rows=20186.00 loops=1)
        Index Cond: (job_id = ANY ('{78851ec2-ca64-4db8-8917-33ae63adbd8c,59e2bc1d-d010-4588-94e5-048642df569b,bcf0abee-df80-4086-976e-5de77cb51424,900ed597-fffd-4e3d-bbf9-19a369552fc0,7542cf6f-d7a6-480b-90dd-3579494001cf,ae3f2119-c5f6-427a-bd79-4af0e84f7523,c4bcbde1-1c40-46d2-9a01-51ddc38248b1,90023c3f-ab3e-4adf-b21c-d95a43737fdf,87fa1737-7952-48da-a5ee-30bdfe98037a,a16c6f85-3551-457b-bab0-3a70cc81c9cc,bf67e8b4-7130-40f3-9ad8-2b9bcf95a1e1,9b5a43b8-a497-494b-bc44-abba6642b1fd,874f2944-6f09-4127-b845-14ff59e0cf12,21eed8a9-1905-4e4f-845a-c8e0e3e6da2e,e69ff7d4-523a-4836-b5fd-6e5af6a449f7,bb4e2e52-d0d4-4eba-a50d-2597321d0f31,0d26d3d7-5a55-4b43-bcc7-8b86f29eae54,85304a8f-6b78-4477-bbf5-0782cff3eb78,58003142-0e0b-42ee-aaa0-feea5e491e23,2ffe3acf-2c52-46c7-a8f6-956bf8c13804}'::uuid[]))
        Heap Fetches: 0
        Index Searches: 17
        Buffers: shared hit=214
Planning:
  Buffers: shared hit=1
Planning Time: 0.542 ms
Execution Time: 4.806 ms
```

### Xếp hạng job đông hồ sơ nhất

```sql
SELECT "app"."id" AS "app_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."score_breakdown" AS "app_score_breakdown", "app"."flags" AS "app_flags", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name" FROM "applications" "app" INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."job_id" = $1 ) AND ( "app"."deleted_at" IS NULL ) ORDER BY "app_score" DESC NULLS LAST, "app_id" ASC
```

```
Sort  (cost=5216.02..5218.64 rows=1045 width=569) (actual time=16.621..16.666 rows=1154.00 loops=1)
  Sort Key: app.score DESC NULLS LAST, app.id
  Sort Method: quicksort  Memory: 723kB
  Buffers: shared hit=2040
  ->  Hash Join  (cost=3366.20..5163.62 rows=1045 width=569) (actual time=2.404..15.432 rows=1154.00 loops=1)
        Hash Cond: (candidate.id = app.candidate_id)
        Buffers: shared hit=2040
        ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=34) (actual time=0.007..6.996 rows=50000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=912
        ->  Hash  (cost=3353.14..3353.14 rows=1045 width=551) (actual time=2.391..2.392 rows=1154.00 loops=1)
              Buckets: 2048  Batches: 1  Memory Usage: 684kB
              Buffers: shared hit=1128
              ->  Bitmap Heap Scan on applications app  (cost=44.52..3353.14 rows=1045 width=551) (actual time=0.401..1.838 rows=1154.00 loops=1)
                    Recheck Cond: ((job_id = '2ffe3acf-2c52-46c7-a8f6-956bf8c13804'::uuid) AND (deleted_at IS NULL))
                    Heap Blocks: exact=1118
                    Buffers: shared hit=1128
                    ->  Bitmap Index Scan on "IDX_applications_job_id_status_score"  (cost=0.00..44.26 rows=1045 width=0) (actual time=0.173..0.173 rows=1154.00 loops=1)
                          Index Cond: (job_id = '2ffe3acf-2c52-46c7-a8f6-956bf8c13804'::uuid)
                          Index Searches: 1
                          Buffers: shared hit=10
Planning:
  Buffers: shared hit=17
Planning Time: 0.541 ms
Execution Time: 16.728 ms
```

### Chi tiết hồ sơ

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."source" AS "app_source", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."ai_error" AS "app_ai_error", "app"."score" AS "app_score", "app"."score_breakdown" AS "app_score_breakdown", "app"."flags" AS "app_flags", "app"."scored_jd_version" AS "app_scored_jd_version", "job"."id" AS "job_id", "job"."title" AS "job_title", "job"."department_id" AS "job_department_id", "job"."jd_version" AS "job_jd_version", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "cvFile"."id" AS "cvFile_id", "cvFile"."original_name" AS "cvFile_original_name", "cvFile"."parse_status" AS "cvFile_parse_status", "cvFile"."text" AS "cvFile_text", "cvFile"."text_entered_at" AS "cvFile_text_entered_at" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL)  LEFT JOIN "cv_files" "cvFile" ON "cvFile"."id"="app"."cv_file_id" AND ("cvFile"."deleted_at" IS NULL) WHERE ( "app"."id" = $1 ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop Left Join  (cost=1.15..33.30 rows=1 width=1388) (actual time=0.023..0.025 rows=1.00 loops=1)
  Buffers: shared hit=12
  ->  Nested Loop  (cost=0.85..24.99 rows=1 width=764) (actual time=0.018..0.020 rows=1.00 loops=1)
        Buffers: shared hit=9
        ->  Nested Loop  (cost=0.56..16.68 rows=1 width=703) (actual time=0.013..0.015 rows=1.00 loops=1)
              Buffers: shared hit=6
              ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..8.44 rows=1 width=632) (actual time=0.009..0.009 rows=1.00 loops=1)
                    Index Cond: (id = '0000a052-1c96-4527-9b88-c1e941c31ece'::uuid)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 1
                    Buffers: shared hit=4
              ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..8.16 rows=1 width=71) (actual time=0.003..0.003 rows=1.00 loops=1)
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
Planning Time: 0.446 ms
Execution Time: 0.051 ms
```

### Kho ứng viên – trang đầu

```sql
SELECT COUNT(1) AS "cnt" FROM "candidates" "candidate" WHERE "candidate"."deleted_at" IS NULL
```

```
Aggregate  (cost=1537.00..1537.01 rows=1 width=8) (actual time=6.247..6.248 rows=1.00 loops=1)
  Buffers: shared hit=912
  ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=0) (actual time=0.006..4.079 rows=50000.00 loops=1)
        Filter: (deleted_at IS NULL)
        Buffers: shared hit=912
Planning:
  Buffers: shared hit=2
Planning Time: 0.062 ms
Execution Time: 6.262 ms
```

### Kho ứng viên – tìm không dấu

```sql
SELECT COUNT(1) AS "cnt" FROM "candidates" "candidate" WHERE ( (f_unaccent(lower("candidate"."full_name")) LIKE '%' || f_unaccent(lower($1)) || '%' OR "candidate"."email" LIKE '%' || lower($1) || '%') ) AND ( "candidate"."deleted_at" IS NULL )
```

```
Aggregate  (cost=185.85..185.86 rows=1 width=8) (actual time=1.068..1.068 rows=1.00 loops=1)
  Buffers: shared hit=101
  ->  Bitmap Heap Scan on candidates candidate  (cost=146.29..185.82 rows=10 width=0) (actual time=0.961..1.064 rows=19.00 loops=1)
        Recheck Cond: (((f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text) AND (deleted_at IS NULL)) OR (((email)::text ~~ '%binh doan%'::text) AND (deleted_at IS NULL)))
        Rows Removed by Index Recheck: 14
        Heap Blocks: exact=33
        Buffers: shared hit=101
        ->  BitmapOr  (cost=146.29..146.29 rows=10 width=0) (actual time=0.931..0.931 rows=0.00 loops=1)
              Buffers: shared hit=68
              ->  Bitmap Index Scan on "IDX_candidates_full_name_trgm"  (cost=0.00..77.23 rows=5 width=0) (actual time=0.483..0.483 rows=33.00 loops=1)
                    Index Cond: (f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text)
                    Index Searches: 1
                    Buffers: shared hit=34
              ->  Bitmap Index Scan on "IDX_candidates_email_trgm"  (cost=0.00..69.05 rows=5 width=0) (actual time=0.446..0.446 rows=33.00 loops=1)
                    Index Cond: ((email)::text ~~ '%binh doan%'::text)
                    Index Searches: 1
                    Buffers: shared hit=34
Planning:
  Buffers: shared hit=4
Planning Time: 0.152 ms
Execution Time: 1.087 ms
```

### Kho ứng viên – Hiring Manager

```sql
SELECT COUNT(1) AS "cnt" FROM "candidates" "candidate" WHERE ( EXISTS (SELECT 1 FROM "applications" "scope_app" INNER JOIN "jobs" "scope_job" ON "scope_job"."id" = "scope_app"."job_id" WHERE "scope_app"."candidate_id" = "candidate"."id" AND "scope_app"."deleted_at" IS NULL AND "scope_job"."deleted_at" IS NULL AND "scope_job"."department_id" = $1) ) AND ( "candidate"."deleted_at" IS NULL )
```

```
Aggregate  (cost=3350.00..3350.01 rows=1 width=8) (actual time=18.185..18.188 rows=1.00 loops=1)
  Buffers: shared hit=1142
  ->  Hash Semi Join  (cost=1535.05..3300.14 rows=19941 width=0) (actual time=7.921..17.475 rows=18075.00 loops=1)
        Hash Cond: (candidate.id = scope_app.candidate_id)
        Buffers: shared hit=1142
        ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=16) (actual time=0.005..3.883 rows=50000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=912
        ->  Hash  (cost=1285.05..1285.05 rows=20000 width=16) (actual time=7.904..7.906 rows=21047.00 loops=1)
              Buckets: 32768  Batches: 1  Memory Usage: 1243kB
              Buffers: shared hit=230
              ->  Nested Loop  (cost=0.42..1285.05 rows=20000 width=16) (actual time=0.013..4.257 rows=21047.00 loops=1)
                    Buffers: shared hit=230
                    ->  Seq Scan on jobs scope_job  (cost=0.00..13.50 rows=20 width=16) (actual time=0.002..0.052 rows=20.00 loops=1)
                          Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                          Rows Removed by Filter: 180
                          Buffers: shared hit=11
                    ->  Index Only Scan using "UQ_applications_job_id_candidate_id" on applications scope_app  (cost=0.42..53.05 rows=1053 width=32) (actual time=0.012..0.127 rows=1052.35 loops=20)
                          Index Cond: (job_id = scope_job.id)
                          Heap Fetches: 0
                          Index Searches: 20
                          Buffers: shared hit=219
Planning:
  Buffers: shared hit=21
Planning Time: 0.311 ms
Execution Time: 18.212 ms
```

### Dashboard – Admin

```sql
SELECT "job"."id" AS "jobId", "job"."title" AS "title", "job"."status" AS "status", COUNT("app"."id")::int AS "total", COUNT("app"."id") FILTER (WHERE "app"."ai_status" = 'PROCESSING')::int AS "processing", COALESCE(SUM("app"."score"), 0)::int AS "scoreSum", COUNT("app"."score")::int AS "scored", json_build_object('NEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'NEW'), 'SCREENING', COUNT("app"."id") FILTER (WHERE "app"."status" = 'SCREENING'), 'INTERVIEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'INTERVIEW'), 'OFFER', COUNT("app"."id") FILTER (WHERE "app"."status" = 'OFFER'), 'HIRED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'HIRED'), 'REJECTED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'REJECTED'), 'WITHDRAWN', COUNT("app"."id") FILTER (WHERE "app"."status" = 'WITHDRAWN')) AS "byStatus" FROM "jobs" "job" LEFT JOIN "applications" "app" ON  "app"."job_id" = "job"."id" AND "app"."deleted_at" IS NULL WHERE "job"."deleted_at" IS NULL GROUP BY "job"."id"
```

```
HashAggregate  (cost=28901.62..28906.12 rows=200 width=103) (actual time=208.542..209.034 rows=200.00 loops=1)
  Group Key: job.id
  Batches: 1  Memory Usage: 96kB
  Buffers: shared hit=12350 read=4011
  ->  Hash Right Join  (cost=15.50..18901.62 rows=200000 width=81) (actual time=0.503..152.813 rows=200010.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=12350 read=4011
        ->  Seq Scan on applications app  (cost=0.00..18350.00 rows=200000 width=42) (actual time=0.360..99.275 rows=200000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=12339 read=4011
        ->  Hash  (cost=13.00..13.00 rows=200 width=55) (actual time=0.134..0.135 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 26kB
              Buffers: shared hit=11
              ->  Seq Scan on jobs job  (cost=0.00..13.00 rows=200 width=55) (actual time=0.008..0.066 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=11
Planning:
  Buffers: shared hit=8
Planning Time: 0.342 ms
Execution Time: 209.102 ms
```

### Dashboard – Hiring Manager

```sql
SELECT "job"."id" AS "jobId", "job"."title" AS "title", "job"."status" AS "status", COUNT("app"."id")::int AS "total", COUNT("app"."id") FILTER (WHERE "app"."ai_status" = 'PROCESSING')::int AS "processing", COALESCE(SUM("app"."score"), 0)::int AS "scoreSum", COUNT("app"."score")::int AS "scored", json_build_object('NEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'NEW'), 'SCREENING', COUNT("app"."id") FILTER (WHERE "app"."status" = 'SCREENING'), 'INTERVIEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'INTERVIEW'), 'OFFER', COUNT("app"."id") FILTER (WHERE "app"."status" = 'OFFER'), 'HIRED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'HIRED'), 'REJECTED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'REJECTED'), 'WITHDRAWN', COUNT("app"."id") FILTER (WHERE "app"."status" = 'WITHDRAWN')) AS "byStatus" FROM "jobs" "job" LEFT JOIN "applications" "app" ON  "app"."job_id" = "job"."id" AND "app"."deleted_at" IS NULL WHERE ( "job"."department_id" = $1 ) AND ( "job"."deleted_at" IS NULL ) GROUP BY "job"."id"
```

```
HashAggregate  (cost=19899.88..19900.33 rows=20 width=103) (actual time=139.153..139.190 rows=20.00 loops=1)
  Group Key: job.id
  Batches: 1  Memory Usage: 32kB
  Buffers: shared hit=12536 read=3825
  ->  Hash Right Join  (cost=13.75..18899.88 rows=20000 width=81) (actual time=0.268..130.402 rows=21047.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=12536 read=3825
        ->  Seq Scan on applications app  (cost=0.00..18350.00 rows=200000 width=42) (actual time=0.211..104.385 rows=200000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=12525 read=3825
        ->  Hash  (cost=13.50..13.50 rows=20 width=55) (actual time=0.052..0.053 rows=20.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 10kB
              Buffers: shared hit=11
              ->  Seq Scan on jobs job  (cost=0.00..13.50 rows=20 width=55) (actual time=0.007..0.046 rows=20.00 loops=1)
                    Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                    Rows Removed by Filter: 180
                    Buffers: shared hit=11
Planning:
  Buffers: shared hit=8
Planning Time: 0.266 ms
Execution Time: 139.239 ms
```

### Phễu tuyển dụng 90 ngày – Admin

```sql
SELECT "h"."from_status" AS "fromStatus", "h"."to_status" AS "toStatus", "app"."source" AS "source", COUNT(*)::int AS "n", percentile_disc(0.5) WITHIN GROUP (ORDER BY "h"."prev_stage_seconds") AS "p50" FROM "application_status_history" "h" INNER JOIN "applications" "app" ON  "app"."id" = "h"."application_id" AND "app"."deleted_at" IS NULL  INNER JOIN "jobs" "job" ON  "job"."id" = "app"."job_id" AND "job"."deleted_at" IS NULL WHERE "app"."created_at" >= $1 AND "app"."created_at" < $2 GROUP BY "app"."source", "h"."from_status", "h"."to_status"
```

```
GroupAggregate  (cost=56454.21..59811.66 rows=56 width=20) (actual time=508.162..555.067 rows=26.00 loops=1)
  Group Key: app.source, h.from_status, h.to_status
  Buffers: shared hit=12818 read=9093, temp read=621 written=623
  ->  Sort  (cost=56454.21..57013.65 rows=223774 width=16) (actual time=496.346..526.704 rows=223671.00 loops=1)
        Sort Key: app.source, h.from_status, h.to_status
        Sort Method: external merge  Disk: 4968kB
        Buffers: shared hit=12818 read=9093, temp read=621 written=623
        ->  Hash Join  (cost=20530.12..32744.51 rows=223774 width=16) (actual time=167.793..417.451 rows=223671.00 loops=1)
              Hash Cond: (app.job_id = job.id)
              Buffers: shared hit=12818 read=9093
              ->  Hash Join  (cost=20514.62..32129.15 rows=223774 width=32) (actual time=167.560..373.675 rows=223671.00 loops=1)
                    Hash Cond: (h.application_id = app.id)
                    Buffers: shared hit=12807 read=9093
                    ->  Seq Scan on application_status_history h  (cost=0.00..10353.57 rows=480357 width=28) (actual time=0.255..49.586 rows=480357.00 loops=1)
                          Buffers: shared hit=94 read=5456
                    ->  Hash  (cost=19350.00..19350.00 rows=93170 width=36) (actual time=167.241..167.242 rows=93124.00 loops=1)
                          Buckets: 131072  Batches: 1  Memory Usage: 7209kB
                          Buffers: shared hit=12713 read=3637
                          ->  Seq Scan on applications app  (cost=0.00..19350.00 rows=93170 width=36) (actual time=0.215..129.778 rows=93124.00 loops=1)
                                Filter: ((deleted_at IS NULL) AND (created_at >= '2026-08-15 17:00:00+00'::timestamp with time zone) AND (created_at < '2026-11-13 17:00:00+00'::timestamp with time zone))
                                Rows Removed by Filter: 106876
                                Buffers: shared hit=12713 read=3637
              ->  Hash  (cost=13.00..13.00 rows=200 width=16) (actual time=0.074..0.075 rows=200.00 loops=1)
                    Buckets: 1024  Batches: 1  Memory Usage: 18kB
                    Buffers: shared hit=11
                    ->  Seq Scan on jobs job  (cost=0.00..13.00 rows=200 width=16) (actual time=0.006..0.052 rows=200.00 loops=1)
                          Filter: (deleted_at IS NULL)
                          Buffers: shared hit=11
Planning:
  Buffers: shared hit=21
Planning Time: 0.345 ms
Execution Time: 555.832 ms
```

### Phễu tuyển dụng – job đông nhất

```sql
SELECT "h"."from_status" AS "fromStatus", "h"."to_status" AS "toStatus", "app"."source" AS "source", COUNT(*)::int AS "n", percentile_disc(0.5) WITHIN GROUP (ORDER BY "h"."prev_stage_seconds") AS "p50" FROM "application_status_history" "h" INNER JOIN "applications" "app" ON  "app"."id" = "h"."application_id" AND "app"."deleted_at" IS NULL  INNER JOIN "jobs" "job" ON  "job"."id" = "app"."job_id" AND "job"."deleted_at" IS NULL WHERE "app"."created_at" >= $1 AND "app"."created_at" < $2 AND "app"."job_id" = $3 GROUP BY "app"."source", "h"."from_status", "h"."to_status"
```

```
GroupAggregate  (cost=10652.80..10671.19 rows=56 width=20) (actual time=6.784..7.097 rows=26.00 loops=1)
  Group Key: app.source, h.from_status, h.to_status
  Buffers: shared hit=5782
  ->  Sort  (cost=10652.80..10655.73 rows=1170 width=16) (actual time=6.643..6.752 rows=2810.00 loops=1)
        Sort Key: app.source, h.from_status, h.to_status
        Sort Method: quicksort  Memory: 175kB
        Buffers: shared hit=5775
        ->  Nested Loop  (cost=44.95..10593.18 rows=1170 width=16) (actual time=0.375..5.936 rows=2810.00 loops=1)
              Buffers: shared hit=5773
              ->  Nested Loop  (cost=44.52..3371.26 rows=487 width=20) (actual time=0.358..1.685 rows=1154.00 loops=1)
                    Buffers: shared hit=1130
                    ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..8.16 rows=1 width=16) (actual time=0.006..0.008 rows=1.00 loops=1)
                          Index Cond: (id = '2ffe3acf-2c52-46c7-a8f6-956bf8c13804'::uuid)
                          Filter: (deleted_at IS NULL)
                          Index Searches: 1
                          Buffers: shared hit=2
                    ->  Bitmap Heap Scan on applications app  (cost=44.38..3358.22 rows=487 width=36) (actual time=0.350..1.539 rows=1154.00 loops=1)
                          Recheck Cond: ((job_id = '2ffe3acf-2c52-46c7-a8f6-956bf8c13804'::uuid) AND (deleted_at IS NULL))
                          Filter: ((created_at >= '2026-08-15 17:00:00+00'::timestamp with time zone) AND (created_at < '2026-11-13 17:00:00+00'::timestamp with time zone))
                          Heap Blocks: exact=1118
                          Buffers: shared hit=1128
                          ->  Bitmap Index Scan on "IDX_applications_job_id_status_score"  (cost=0.00..44.26 rows=1045 width=0) (actual time=0.160..0.160 rows=1154.00 loops=1)
                                Index Cond: (job_id = '2ffe3acf-2c52-46c7-a8f6-956bf8c13804'::uuid)
                                Index Searches: 1
                                Buffers: shared hit=10
              ->  Index Scan using "IDX_application_status_history_application_id_changed_at" on application_status_history h  (cost=0.42..14.80 rows=3 width=28) (actual time=0.003..0.003 rows=2.44 loops=1154)
                    Index Cond: (application_id = app.id)
                    Index Searches: 1154
                    Buffers: shared hit=4643
Planning:
  Buffers: shared hit=81
Planning Time: 1.004 ms
Execution Time: 7.150 ms
```

### So sánh 3 hồ sơ

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."source" AS "app_source", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."score_breakdown" AS "app_score_breakdown", "app"."flags" AS "app_flags", "app"."scored_jd_version" AS "app_scored_jd_version", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."id" IN ($1, $2, $3) AND "app"."job_id" = $4 ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=0.85..41.80 rows=1 width=684) (actual time=0.040..0.178 rows=3.00 loops=1)
  Buffers: shared hit=27
  ->  Nested Loop  (cost=0.56..33.49 rows=1 width=634) (actual time=0.029..0.152 rows=3.00 loops=1)
        Buffers: shared hit=18
        ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..25.32 rows=1 width=583) (actual time=0.021..0.130 rows=3.00 loops=1)
              Index Cond: (id = ANY ('{3ecbbcdd-1bd2-43c5-a663-fc41560eddcb,50bf6f24-27c5-4e87-8c1c-349e9ac4d625,2be04de5-7fb6-431f-9388-6ce4ff35cced}'::uuid[]))
              Filter: ((deleted_at IS NULL) AND (job_id = '2ffe3acf-2c52-46c7-a8f6-956bf8c13804'::uuid))
              Index Searches: 3
              Buffers: shared hit=12
        ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..8.16 rows=1 width=51) (actual time=0.004..0.005 rows=1.00 loops=3)
              Index Cond: (id = '2ffe3acf-2c52-46c7-a8f6-956bf8c13804'::uuid)
              Filter: (deleted_at IS NULL)
              Index Searches: 3
              Buffers: shared hit=6
  ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=66) (actual time=0.006..0.006 rows=1.00 loops=3)
        Index Cond: (id = app.candidate_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 3
        Buffers: shared hit=9
Planning:
  Buffers: shared hit=17
Planning Time: 0.487 ms
Execution Time: 0.222 ms
```

### Lịch phỏng vấn 30 ngày – Admin (1 trang 200)

```sql
SELECT "iv"."id" AS "iv_id", "iv"."application_id" AS "iv_application_id", "iv"."round" AS "iv_round", "iv"."scheduled_at" AS "iv_scheduled_at", "iv"."duration_minutes" AS "iv_duration_minutes", "iv"."location" AS "iv_location", "iv"."status" AS "iv_status", "iv"."cancel_reason" AS "iv_cancel_reason", "iv"."created_by" AS "iv_created_by", "iv"."created_at" AS "iv_created_at", "iv"."updated_at" AS "iv_updated_at", "ia"."interview_id" AS "ia_interview_id", "ia"."user_id" AS "ia_user_id", "au"."id" AS "au_id", "au"."email" AS "au_email", "au"."full_name" AS "au_full_name", "fb"."id" AS "fb_id", "fb"."interview_id" AS "fb_interview_id", "fb"."author_id" AS "fb_author_id", "fb"."overall" AS "fb_overall", "fb"."ratings" AS "fb_ratings", "fb"."comment" AS "fb_comment", "fb"."editable_until" AS "fb_editable_until", "fb"."submitted_at" AS "fb_submitted_at", "fb"."updated_at" AS "fb_updated_at", "fa"."id" AS "fa_id", "fa"."full_name" AS "fa_full_name", "app"."id" AS "app_id", "app"."status" AS "app_status", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "job"."id" AS "job_id", "job"."title" AS "job_title" FROM "interviews" "iv" LEFT JOIN "interview_assignees" "ia" ON "ia"."interview_id"="iv"."id"  LEFT JOIN "users" "au" ON "au"."id"="ia"."user_id" AND ("au"."deleted_at" IS NULL)  LEFT JOIN "interview_feedbacks" "fb" ON "fb"."interview_id"="iv"."id"  LEFT JOIN "users" "fa" ON "fa"."id"="fb"."author_id" AND ("fa"."deleted_at" IS NULL)  LEFT JOIN "applications" "app" ON "app"."id"="iv"."application_id" AND ("app"."deleted_at" IS NULL)  LEFT JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL)  LEFT JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE "iv"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65, $66, $67, $68, $69, $70, $71, $72, $73, $74, $75, $76, $77, $78, $79, $80, $81, $82, $83, $84, $85, $86, $87, $88, $89, $90, $91, $92, $93, $94, $95, $96, $97, $98, $99, $100, $101, $102, $103, $104, $105, $106, $107, $108, $109, $110, $111, $112, $113, $114, $115, $116, $117, $118, $119, $120, $121, $122, $123, $124, $125, $126, $127, $128, $129, $130, $131, $132, $133, $134, $135, $136, $137, $138, $139, $140, $141, $142, $143, $144, $145, $146, $147, $148, $149, $150, $151, $152, $153, $154, $155, $156, $157, $158, $159, $160, $161, $162, $163, $164, $165, $166, $167, $168, $169, $170, $171, $172, $173, $174, $175, $176, $177, $178, $179, $180, $181, $182, $183, $184, $185, $186, $187, $188, $189, $190, $191, $192, $193, $194, $195, $196, $197, $198, $199, $200) ORDER BY "iv"."scheduled_at" ASC, "au_full_name" ASC
```

```
Sort  (cost=3308.53..3309.03 rows=200 width=493) (actual time=6.888..6.920 rows=200.00 loops=1)
  Sort Key: iv.scheduled_at, au.full_name
  Sort Method: quicksort  Memory: 89kB
  Buffers: shared hit=2860
  ->  Nested Loop Left Join  (cost=360.34..3300.89 rows=200 width=493) (actual time=0.865..6.444 rows=200.00 loops=1)
        Buffers: shared hit=2860
        ->  Nested Loop Left Join  (cost=360.19..3268.36 rows=200 width=458) (actual time=0.855..5.847 rows=200.00 loops=1)
              Buffers: shared hit=2460
              ->  Nested Loop Left Join  (cost=359.90..3202.13 rows=200 width=440) (actual time=0.843..4.414 rows=200.00 loops=1)
                    Buffers: shared hit=1860
                    ->  Hash Left Join  (cost=359.48..1586.63 rows=200 width=388) (actual time=0.826..2.691 rows=200.00 loops=1)
                          Hash Cond: (ia.user_id = au.id)
                          Buffers: shared hit=1060
                          ->  Nested Loop Left Join  (cost=356.36..1582.94 rows=200 width=338) (actual time=0.778..2.535 rows=200.00 loops=1)
                                Buffers: shared hit=1058
                                ->  Hash Left Join  (cost=355.94..846.44 rows=200 width=306) (actual time=0.756..1.351 rows=200.00 loops=1)
                                      Hash Cond: (iv.id = fb.interview_id)
                                      Buffers: shared hit=457
                                      ->  Bitmap Heap Scan on interviews iv  (cost=353.22..842.95 rows=200 width=134) (actual time=0.695..1.148 rows=200.00 loops=1)
                                            Recheck Cond: (id = ANY ('{5ce380ba-d391-4bd0-94ba-3ef681c830d0,23b27af1-c7bb-4439-87fe-3524c9699ed4,38b5c818-9ab0-4928-be63-5e2d06e6550e,a3c7edf1-421b-463d-b5e5-eed2195b733a,f02279a3-9dfb-4c59-b1c4-b9c6730a79ef,74b6ad27-5820-4015-9900-7fa5b74df4ba,ccb836d9-565e-469e-97df-f03afe10eea1,13dfb1da-9177-4be7-a82c-ade1292f2eda,dc66fd28-82c2-41f3-aceb-81459cea6565,f977f0c3-576a-475c-aa57-d87b33fa3c63,33482d29-ad15-4aaf-8da6-401f1f10838e,9a747762-4f6f-4744-8c11-6a7be8990a53,15597309-13f8-4ec9-9cef-848f986d92b7,ad7b1439-56e9-41cb-9da7-fdf7cc43ec6b,4255bdcd-b5d7-4355-86d2-0a31ff4692b1,cf749624-a2b5-471d-a577-06e3340ed6ae,b6314274-39ba-4297-bff2-cc252b3da0e1,d474c4db-1e08-44e6-9732-9cecc7cbb59f,7d3de631-c755-4443-bb41-2c23f799bc7d,a9daeb07-1a98-4e84-8a39-388f75658de3,2e7c67f1-98c2-46ea-a429-eba425c02078,7a1e629c-feab-4720-a002-2017e0602162,04d7af57-9db0-4ec8-adb1-bd468ba91634,46c146bf-ce61-4b9f-893a-c1a6c8c8e62b,b571aeb7-0959-48d4-af34-6b1b0af58f72,e4922d4b-a3fb-4be8-8030-dc76c04a7943,42fdffd3-9878-400e-b5db-b18e0fe9a6a6,b386c373-fcb0-4e0f-9e94-e391acff41b3,c68a9fc7-e89a-42f1-948b-d51a62abf1b8,ff2bf763-0204-43e6-bf3a-1096bf14a602,548b4199-69c9-4c33-8431-125963f345cb,1483be98-355e-4c80-b24a-9a86e703e8de,bb4b7ef2-2dca-45b2-bf40-3fbfa237f1d0,4f5099bd-bf2f-41ea-9751-9e8c7472487e,2d5a328d-3acc-4c9e-92ad-3dcd67961b36,a2efb411-cc9c-4b56-a48c-ea2b52ff0cad,5bfc0a42-13cc-4b44-a039-cd3dd628ec0a,dbd85365-68c5-468a-9ee3-1cde57157cb7,2c9e72fe-eb14-4a59-88b6-34570e4a411e,c4a1b56a-6a04-4d13-b109-f1d0e2cfe436,bdf8c526-ff89-4c9a-a100-8ac9d41f7a0b,075a8158-2ce3-4990-b5b0-9089bbb60b4b,abd223e1-bb8b-45c7-893a-3c4c2bb48cec,b64d35a1-df84-4c51-a488-f7f07654b388,ec6c6e5b-180e-4a89-b290-c3a7287db0e8,d43085c2-f8cf-4a74-b1f4-41589810e33a,194e3e16-2427-4520-bf53-85fc1e6aa3cb,c40b6f39-0360-4496-934c-641e5ada8181,593c72dd-93fa-4c5f-9121-b857d48ac677,9d3c59ae-80b1-4146-b43a-a14a31a2fc70,c4d62212-65ad-4042-b0c1-0726f42c05c2,8eed89a5-4c25-4388-ada7-85b3406c3676,63545b11-6045-422c-a1bc-911978decc42,967e080d-aab9-4b51-98f2-e9f5262e2b1b,b5763a61-2335-4e5f-aa2d-a9b63e7a86df,f6d422d7-c8cb-4f14-abf4-c77cda8b5ac5,a04ab4ab-4df1-41e1-b9d8-a60827700d75,5905c65c-eb78-426d-9ef1-6b51badf73b3,b198b4d0-a892-4c30-bb56-edce80d84be2,1bec6256-2228-42c0-b207-4f77b49b4ae7,490c48f8-3ad7-418d-bc07-3dd2292fe1aa,8d036614-9c23-4e5a-b166-214b443fb715,de62784c-0625-40df-8c39-75336c475eba,3d6abff4-cfa2-42b6-a650-b235ee98cf8a,c9b0dd63-6cd9-48c8-ae6f-9164d35c9089,0108d66e-c452-44e2-9f35-4d26ebd00226,1b06d5d2-3ef3-4127-b0d4-2cd73a375c05,3f23404c-2777-4517-a6ea-241b52591641,b6877898-4aa4-4bb0-adc4-2a5bd5beb6cf,cba34e4b-08c0-4328-a447-9365bc89625a,1d846357-07f4-4eab-bef9-4c894adeb3d7,1fd7e76d-4ea3-470b-8ffd-25a51f02e19d,619c3bf5-c5f3-41fb-92e2-6484e8acba0b,78133f84-afa1-4cf5-a6f5-ea7ddbbeb010,ad270a56-e8c6-4958-8cb2-f90ebbe28d80,1c7dc8a1-fb13-4eae-8a43-ba1957f9b0fe,801b8db2-1da2-4347-9e5a-bdefb8ef4bd7,97024787-46c6-4414-9018-db640792ebee,621b8141-9d10-488b-b216-119066a2d6f1,b56b3c9e-130d-4b16-94fe-8fcc89b9e2dd,5ae2da15-21e7-4e4c-846d-488bbbfb5645,3b986b45-b47d-4a47-8dbe-4a9f80b9d313,1e062239-e840-4fc2-896c-176fb8a42cab,8b856689-30da-4a3e-bb52-7b1e841fbd06,99c13510-8341-47e4-a312-4f8fca7e1bb5,0ac06514-bb98-4dde-ab6f-c1e9756eb747,7b57e8cd-d7cf-470f-82c6-cf4c5cf3e14f,5e06ef49-94be-40f5-999d-fc096d3cba82,8bd904c5-ba93-4bae-95b5-3414f7135d20,14510216-9780-400e-9ed4-56e31b8d9ce2,556efe21-6a53-4c59-9219-8045746339e5,d92dad0f-b792-4980-9365-03c00ba33081,8361ea3f-449e-4692-b982-02d11ccd818e,0ca00ab4-e7e6-464b-a218-b611bd7d8376,6ed73e91-4990-4e83-a8e4-7704fedcc3a4,9fbf057f-5037-436b-b6ad-ab967e835baf,ad7d52c2-15b0-4477-b893-987f4561411e,cb3537b4-cc51-42ef-9265-1026c04721f9,74435aa8-ca20-470a-9e94-232a8889878c,78b90a39-5173-4644-a5fb-d97b3d25bd81,f20d1570-b80d-4f41-963a-5723aa760236,d41036e6-528a-41aa-b796-f5c2d8f3fc77,901b8a6b-7f22-4270-bbd7-354e6d051c28,a085d5e6-2cfe-40da-9ac0-3ce6029cd2bb,01f3994b-61af-4b05-97cc-2f315063d00d,58502724-81ee-4b5a-9551-e29e56653826,4a4a719f-26b9-4d69-a83a-26a843a74ea9,3b5bc9af-418a-47e9-ac7a-c20a46e68356,11c81e4f-5aa0-46ef-bd23-5a568e9e8bfd,7fcff7ae-e32f-498f-8cd8-f08ad6185bde,9370082c-726a-42a7-8240-99c8c14ddd24,cbcfcbf5-698a-401c-b513-3dbb91fc4012,6edd535a-bbec-4602-b9b6-755e7b551fc9,d1d8e2a2-ea80-43bf-87c3-9fe09aff473e,1d3a79a8-e7d6-4c6b-91a6-1745446b9a95,245c4604-e639-4b4c-a6e8-734e0ef897ad,c00e9a56-943b-441c-afaa-e26dddfc0b83,64cb49c8-d8b5-4a00-bdcb-f6a664110ceb,57d560c8-7461-46ac-921e-7ef1de22c326,905b2cca-22fd-438a-98b3-90c880afa229,70856ed8-6dd0-4707-af6e-4d4fc3ea0478,7ea08cc8-6b28-4513-9302-7c929222896c,32a41509-aeed-4a11-adac-ce3d8198bd53,3a18184b-c432-4437-8e4b-e150b4cf21e7,2f611d03-29ec-4dab-884b-538b3cb555d9,5d387cdb-b973-47e7-a8fe-ea37ef7f2efc,d344a3b8-6f2f-4fab-98a1-a6ab17d3b675,041b105c-e097-44bd-9496-efb4df1b44a4,1552c4fd-09d4-4391-9eee-0468fd58b2f2,23f1bced-bd00-4e0a-b3bf-3046fcad90fd,05ede159-c247-4f6f-9d01-d9323cbe98f6,65bcc1ad-2769-448d-b92f-21c57544bbf4,4e79b00f-22cc-4853-83f5-d45f202ced17,58329aa0-fe33-467c-8274-c5a74e00aab3,45ebd270-e182-4dff-bde0-bd0763bfec84,ecee423c-e1ee-456c-af15-a113013bfbfb,2898f78a-ade1-4a27-a717-d8167139ea1b,1a2242e8-1fa9-4f55-b558-05d7987b2d75,7d35c902-7cdd-4417-bdf6-c604e1ff39f5,a1c2ea08-5326-4716-a3c1-5d5814321b22,822d0be0-ae3b-420c-a6c8-104f269162d2,874ce8da-9732-49ac-af09-d58b5bf2facc,64f6c444-7b01-4ec1-9a18-5960459f3624,1c437438-a62c-4f6f-8904-5c377911a5ed,b6b4ede4-66f7-4131-9f27-f559dbb6b7dd,c9465fa2-f470-488a-9fdc-185ac7f86d9c,e1f6fa08-f316-4591-b2e6-1225a6baa966,53f27348-b831-4173-96c0-64f7991d2138,4c08f90d-5fb8-4a52-aaa1-9198452343f5,ab5132cf-2cd4-4182-b5ed-a86070464858,bc3f8b03-dc00-4c41-9cad-6fb81538f59d,3f298723-5669-4a10-a840-4062f9a416b1,ef42fce8-cbd1-474e-9505-2f5630fb7b30,e0b7bb16-fb5c-4858-bbf6-e59215681ee8,dff54ade-148f-499b-a15b-fc11ee021a9e,6f7bc0fa-34fa-4650-a01c-aa20b6eccfa1,aba0d313-a62e-4d74-9a56-6c588143c3f1,17035bcc-4cff-4250-af03-af44538515ee,e8b091aa-0ab7-40a7-a902-40e6071e7f5f,f10a8587-5cc9-472f-8a61-8b03ff47f771,c730a103-2a91-4d69-8008-0dd40efe8b71,935be9c9-d685-4fe1-affc-3da0e2a4b552,80c4168e-3ba8-459c-85f9-bc8c95c683fe,550bc137-f08e-4a19-a4e2-ebafc41f0d29,37bfb5fd-2b7d-4c4a-a046-187d5de22c59,a7f84f99-9fda-4290-aba7-659f1e8fe899,9ca17dec-579c-4bd3-854c-1dfe69bd8ba1,9744ccc8-e019-48ec-86bd-f8ecd92671e2,e4586a71-5fcf-4c6e-86d0-98cd789e9f4c,35468a7a-34ea-4dc1-b85b-83836a21cb8b,19dadb39-e462-474f-812b-94e9ef57f7c3,a72452aa-f321-475d-972b-f0e6bd1aae1c,040a5368-e9f2-4f7d-9697-3f184fd8129d,a3e66223-7db8-4851-9602-a8a7505b8355,51bd8a6c-d865-4d73-80b2-a5f333496d90,43077b2d-cda4-435d-a9e7-a2aae4c34a79,d2929826-ac86-4ccd-9934-c1af5888463c,7cb2807d-eb92-4c7a-9bf2-363d0b580bdf,8921e4d3-7c0c-43aa-ab97-d538ad6c4c54,36621dc9-b95d-43e7-a72b-b51c140eab93,ad539fae-871a-4dce-b3db-96594d841f09,790417f6-4365-4574-b385-c1776b60a62c,d205a1c9-5ef8-478f-a13b-eccd72713a76,f5a25f1b-6f0f-4e40-b8e4-8e6f39e58e2b,17e36d78-3587-4351-97bd-a9c155692cad,770d13b5-6560-40e9-9a21-3796d01a26ea,4f0615a9-b090-4dd4-9f6a-2d0a60f7e086,bc7ba1c5-12c8-45a0-ac88-6d445292752a,f02c8d04-4221-430e-b171-ca8f95a46c2c,26ff597e-a90f-43c8-a950-c0a2770abdf6,582b028d-2199-4207-8b16-68f19a218051,44fcbe50-48e3-44d2-8e05-e594cfb06866,028c0df8-b62a-40d5-aaa4-029e3cb17f7f,b4e069d6-2fb1-47c0-aba2-f906e212f4c0,5b8be937-86c1-4341-aff1-53a3c5bb93cb,05867d32-e332-44c9-910f-360210a997f7,b5811e5e-9faa-43e2-b8db-ea3c8aa54c2b,3f90b6fb-10a7-480a-ba48-a3175f6e9342,edff1765-bb44-47b8-ac38-00dd7d8896f4,92b34aee-8ec0-4817-ac0d-bbea078a9822}'::uuid[]))
                                            Heap Blocks: exact=181
                                            Buffers: shared hit=457
                                            ->  Bitmap Index Scan on "PK_interviews"  (cost=0.00..352.67 rows=200 width=0) (actual time=0.664..0.665 rows=200.00 loops=1)
                                                  Index Cond: (id = ANY ('{5ce380ba-d391-4bd0-94ba-3ef681c830d0,23b27af1-c7bb-4439-87fe-3524c9699ed4,38b5c818-9ab0-4928-be63-5e2d06e6550e,a3c7edf1-421b-463d-b5e5-eed2195b733a,f02279a3-9dfb-4c59-b1c4-b9c6730a79ef,74b6ad27-5820-4015-9900-7fa5b74df4ba,ccb836d9-565e-469e-97df-f03afe10eea1,13dfb1da-9177-4be7-a82c-ade1292f2eda,dc66fd28-82c2-41f3-aceb-81459cea6565,f977f0c3-576a-475c-aa57-d87b33fa3c63,33482d29-ad15-4aaf-8da6-401f1f10838e,9a747762-4f6f-4744-8c11-6a7be8990a53,15597309-13f8-4ec9-9cef-848f986d92b7,ad7b1439-56e9-41cb-9da7-fdf7cc43ec6b,4255bdcd-b5d7-4355-86d2-0a31ff4692b1,cf749624-a2b5-471d-a577-06e3340ed6ae,b6314274-39ba-4297-bff2-cc252b3da0e1,d474c4db-1e08-44e6-9732-9cecc7cbb59f,7d3de631-c755-4443-bb41-2c23f799bc7d,a9daeb07-1a98-4e84-8a39-388f75658de3,2e7c67f1-98c2-46ea-a429-eba425c02078,7a1e629c-feab-4720-a002-2017e0602162,04d7af57-9db0-4ec8-adb1-bd468ba91634,46c146bf-ce61-4b9f-893a-c1a6c8c8e62b,b571aeb7-0959-48d4-af34-6b1b0af58f72,e4922d4b-a3fb-4be8-8030-dc76c04a7943,42fdffd3-9878-400e-b5db-b18e0fe9a6a6,b386c373-fcb0-4e0f-9e94-e391acff41b3,c68a9fc7-e89a-42f1-948b-d51a62abf1b8,ff2bf763-0204-43e6-bf3a-1096bf14a602,548b4199-69c9-4c33-8431-125963f345cb,1483be98-355e-4c80-b24a-9a86e703e8de,bb4b7ef2-2dca-45b2-bf40-3fbfa237f1d0,4f5099bd-bf2f-41ea-9751-9e8c7472487e,2d5a328d-3acc-4c9e-92ad-3dcd67961b36,a2efb411-cc9c-4b56-a48c-ea2b52ff0cad,5bfc0a42-13cc-4b44-a039-cd3dd628ec0a,dbd85365-68c5-468a-9ee3-1cde57157cb7,2c9e72fe-eb14-4a59-88b6-34570e4a411e,c4a1b56a-6a04-4d13-b109-f1d0e2cfe436,bdf8c526-ff89-4c9a-a100-8ac9d41f7a0b,075a8158-2ce3-4990-b5b0-9089bbb60b4b,abd223e1-bb8b-45c7-893a-3c4c2bb48cec,b64d35a1-df84-4c51-a488-f7f07654b388,ec6c6e5b-180e-4a89-b290-c3a7287db0e8,d43085c2-f8cf-4a74-b1f4-41589810e33a,194e3e16-2427-4520-bf53-85fc1e6aa3cb,c40b6f39-0360-4496-934c-641e5ada8181,593c72dd-93fa-4c5f-9121-b857d48ac677,9d3c59ae-80b1-4146-b43a-a14a31a2fc70,c4d62212-65ad-4042-b0c1-0726f42c05c2,8eed89a5-4c25-4388-ada7-85b3406c3676,63545b11-6045-422c-a1bc-911978decc42,967e080d-aab9-4b51-98f2-e9f5262e2b1b,b5763a61-2335-4e5f-aa2d-a9b63e7a86df,f6d422d7-c8cb-4f14-abf4-c77cda8b5ac5,a04ab4ab-4df1-41e1-b9d8-a60827700d75,5905c65c-eb78-426d-9ef1-6b51badf73b3,b198b4d0-a892-4c30-bb56-edce80d84be2,1bec6256-2228-42c0-b207-4f77b49b4ae7,490c48f8-3ad7-418d-bc07-3dd2292fe1aa,8d036614-9c23-4e5a-b166-214b443fb715,de62784c-0625-40df-8c39-75336c475eba,3d6abff4-cfa2-42b6-a650-b235ee98cf8a,c9b0dd63-6cd9-48c8-ae6f-9164d35c9089,0108d66e-c452-44e2-9f35-4d26ebd00226,1b06d5d2-3ef3-4127-b0d4-2cd73a375c05,3f23404c-2777-4517-a6ea-241b52591641,b6877898-4aa4-4bb0-adc4-2a5bd5beb6cf,cba34e4b-08c0-4328-a447-9365bc89625a,1d846357-07f4-4eab-bef9-4c894adeb3d7,1fd7e76d-4ea3-470b-8ffd-25a51f02e19d,619c3bf5-c5f3-41fb-92e2-6484e8acba0b,78133f84-afa1-4cf5-a6f5-ea7ddbbeb010,ad270a56-e8c6-4958-8cb2-f90ebbe28d80,1c7dc8a1-fb13-4eae-8a43-ba1957f9b0fe,801b8db2-1da2-4347-9e5a-bdefb8ef4bd7,97024787-46c6-4414-9018-db640792ebee,621b8141-9d10-488b-b216-119066a2d6f1,b56b3c9e-130d-4b16-94fe-8fcc89b9e2dd,5ae2da15-21e7-4e4c-846d-488bbbfb5645,3b986b45-b47d-4a47-8dbe-4a9f80b9d313,1e062239-e840-4fc2-896c-176fb8a42cab,8b856689-30da-4a3e-bb52-7b1e841fbd06,99c13510-8341-47e4-a312-4f8fca7e1bb5,0ac06514-bb98-4dde-ab6f-c1e9756eb747,7b57e8cd-d7cf-470f-82c6-cf4c5cf3e14f,5e06ef49-94be-40f5-999d-fc096d3cba82,8bd904c5-ba93-4bae-95b5-3414f7135d20,14510216-9780-400e-9ed4-56e31b8d9ce2,556efe21-6a53-4c59-9219-8045746339e5,d92dad0f-b792-4980-9365-03c00ba33081,8361ea3f-449e-4692-b982-02d11ccd818e,0ca00ab4-e7e6-464b-a218-b611bd7d8376,6ed73e91-4990-4e83-a8e4-7704fedcc3a4,9fbf057f-5037-436b-b6ad-ab967e835baf,ad7d52c2-15b0-4477-b893-987f4561411e,cb3537b4-cc51-42ef-9265-1026c04721f9,74435aa8-ca20-470a-9e94-232a8889878c,78b90a39-5173-4644-a5fb-d97b3d25bd81,f20d1570-b80d-4f41-963a-5723aa760236,d41036e6-528a-41aa-b796-f5c2d8f3fc77,901b8a6b-7f22-4270-bbd7-354e6d051c28,a085d5e6-2cfe-40da-9ac0-3ce6029cd2bb,01f3994b-61af-4b05-97cc-2f315063d00d,58502724-81ee-4b5a-9551-e29e56653826,4a4a719f-26b9-4d69-a83a-26a843a74ea9,3b5bc9af-418a-47e9-ac7a-c20a46e68356,11c81e4f-5aa0-46ef-bd23-5a568e9e8bfd,7fcff7ae-e32f-498f-8cd8-f08ad6185bde,9370082c-726a-42a7-8240-99c8c14ddd24,cbcfcbf5-698a-401c-b513-3dbb91fc4012,6edd535a-bbec-4602-b9b6-755e7b551fc9,d1d8e2a2-ea80-43bf-87c3-9fe09aff473e,1d3a79a8-e7d6-4c6b-91a6-1745446b9a95,245c4604-e639-4b4c-a6e8-734e0ef897ad,c00e9a56-943b-441c-afaa-e26dddfc0b83,64cb49c8-d8b5-4a00-bdcb-f6a664110ceb,57d560c8-7461-46ac-921e-7ef1de22c326,905b2cca-22fd-438a-98b3-90c880afa229,70856ed8-6dd0-4707-af6e-4d4fc3ea0478,7ea08cc8-6b28-4513-9302-7c929222896c,32a41509-aeed-4a11-adac-ce3d8198bd53,3a18184b-c432-4437-8e4b-e150b4cf21e7,2f611d03-29ec-4dab-884b-538b3cb555d9,5d387cdb-b973-47e7-a8fe-ea37ef7f2efc,d344a3b8-6f2f-4fab-98a1-a6ab17d3b675,041b105c-e097-44bd-9496-efb4df1b44a4,1552c4fd-09d4-4391-9eee-0468fd58b2f2,23f1bced-bd00-4e0a-b3bf-3046fcad90fd,05ede159-c247-4f6f-9d01-d9323cbe98f6,65bcc1ad-2769-448d-b92f-21c57544bbf4,4e79b00f-22cc-4853-83f5-d45f202ced17,58329aa0-fe33-467c-8274-c5a74e00aab3,45ebd270-e182-4dff-bde0-bd0763bfec84,ecee423c-e1ee-456c-af15-a113013bfbfb,2898f78a-ade1-4a27-a717-d8167139ea1b,1a2242e8-1fa9-4f55-b558-05d7987b2d75,7d35c902-7cdd-4417-bdf6-c604e1ff39f5,a1c2ea08-5326-4716-a3c1-5d5814321b22,822d0be0-ae3b-420c-a6c8-104f269162d2,874ce8da-9732-49ac-af09-d58b5bf2facc,64f6c444-7b01-4ec1-9a18-5960459f3624,1c437438-a62c-4f6f-8904-5c377911a5ed,b6b4ede4-66f7-4131-9f27-f559dbb6b7dd,c9465fa2-f470-488a-9fdc-185ac7f86d9c,e1f6fa08-f316-4591-b2e6-1225a6baa966,53f27348-b831-4173-96c0-64f7991d2138,4c08f90d-5fb8-4a52-aaa1-9198452343f5,ab5132cf-2cd4-4182-b5ed-a86070464858,bc3f8b03-dc00-4c41-9cad-6fb81538f59d,3f298723-5669-4a10-a840-4062f9a416b1,ef42fce8-cbd1-474e-9505-2f5630fb7b30,e0b7bb16-fb5c-4858-bbf6-e59215681ee8,dff54ade-148f-499b-a15b-fc11ee021a9e,6f7bc0fa-34fa-4650-a01c-aa20b6eccfa1,aba0d313-a62e-4d74-9a56-6c588143c3f1,17035bcc-4cff-4250-af03-af44538515ee,e8b091aa-0ab7-40a7-a902-40e6071e7f5f,f10a8587-5cc9-472f-8a61-8b03ff47f771,c730a103-2a91-4d69-8008-0dd40efe8b71,935be9c9-d685-4fe1-affc-3da0e2a4b552,80c4168e-3ba8-459c-85f9-bc8c95c683fe,550bc137-f08e-4a19-a4e2-ebafc41f0d29,37bfb5fd-2b7d-4c4a-a046-187d5de22c59,a7f84f99-9fda-4290-aba7-659f1e8fe899,9ca17dec-579c-4bd3-854c-1dfe69bd8ba1,9744ccc8-e019-48ec-86bd-f8ecd92671e2,e4586a71-5fcf-4c6e-86d0-98cd789e9f4c,35468a7a-34ea-4dc1-b85b-83836a21cb8b,19dadb39-e462-474f-812b-94e9ef57f7c3,a72452aa-f321-475d-972b-f0e6bd1aae1c,040a5368-e9f2-4f7d-9697-3f184fd8129d,a3e66223-7db8-4851-9602-a8a7505b8355,51bd8a6c-d865-4d73-80b2-a5f333496d90,43077b2d-cda4-435d-a9e7-a2aae4c34a79,d2929826-ac86-4ccd-9934-c1af5888463c,7cb2807d-eb92-4c7a-9bf2-363d0b580bdf,8921e4d3-7c0c-43aa-ab97-d538ad6c4c54,36621dc9-b95d-43e7-a72b-b51c140eab93,ad539fae-871a-4dce-b3db-96594d841f09,790417f6-4365-4574-b385-c1776b60a62c,d205a1c9-5ef8-478f-a13b-eccd72713a76,f5a25f1b-6f0f-4e40-b8e4-8e6f39e58e2b,17e36d78-3587-4351-97bd-a9c155692cad,770d13b5-6560-40e9-9a21-3796d01a26ea,4f0615a9-b090-4dd4-9f6a-2d0a60f7e086,bc7ba1c5-12c8-45a0-ac88-6d445292752a,f02c8d04-4221-430e-b171-ca8f95a46c2c,26ff597e-a90f-43c8-a950-c0a2770abdf6,582b028d-2199-4207-8b16-68f19a218051,44fcbe50-48e3-44d2-8e05-e594cfb06866,028c0df8-b62a-40d5-aaa4-029e3cb17f7f,b4e069d6-2fb1-47c0-aba2-f906e212f4c0,5b8be937-86c1-4341-aff1-53a3c5bb93cb,05867d32-e332-44c9-910f-360210a997f7,b5811e5e-9faa-43e2-b8db-ea3c8aa54c2b,3f90b6fb-10a7-480a-ba48-a3175f6e9342,edff1765-bb44-47b8-ac38-00dd7d8896f4,92b34aee-8ec0-4817-ac0d-bbea078a9822}'::uuid[]))
                                                  Index Searches: 138
                                                  Buffers: shared hit=276
                                      ->  Hash  (cost=2.71..2.71 rows=1 width=172) (actual time=0.048..0.051 rows=0.00 loops=1)
                                            Buckets: 1024  Batches: 1  Memory Usage: 8kB
                                            ->  Hash Right Join  (cost=0.01..2.71 rows=1 width=172) (actual time=0.048..0.051 rows=0.00 loops=1)
                                                  Hash Cond: (fa.id = fb.author_id)
                                                  ->  Seq Scan on users fa  (cost=0.00..2.50 rows=50 width=34) (never executed)
                                                        Filter: (deleted_at IS NULL)
                                                  ->  Hash  (cost=0.00..0.00 rows=1 width=138) (actual time=0.003..0.005 rows=0.00 loops=1)
                                                        Buckets: 1024  Batches: 1  Memory Usage: 8kB
                                                        ->  Seq Scan on interview_feedbacks fb  (cost=0.00..0.00 rows=1 width=138) (actual time=0.003..0.003 rows=0.00 loops=1)
                                ->  Index Only Scan using "PK_interview_assignees" on interview_assignees ia  (cost=0.41..3.67 rows=1 width=32) (actual time=0.005..0.005 rows=1.00 loops=200)
                                      Index Cond: (interview_id = iv.id)
                                      Heap Fetches: 0
                                      Index Searches: 200
                                      Buffers: shared hit=601
                          ->  Hash  (cost=2.50..2.50 rows=50 width=50) (actual time=0.041..0.042 rows=50.00 loops=1)
                                Buckets: 1024  Batches: 1  Memory Usage: 13kB
                                Buffers: shared hit=2
                                ->  Seq Scan on users au  (cost=0.00..2.50 rows=50 width=50) (actual time=0.006..0.021 rows=50.00 loops=1)
                                      Filter: (deleted_at IS NULL)
                                      Buffers: shared hit=2
                    ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..8.08 rows=1 width=52) (actual time=0.008..0.008 rows=1.00 loops=200)
                          Index Cond: (id = iv.application_id)
                          Filter: (deleted_at IS NULL)
                          Index Searches: 200
                          Buffers: shared hit=800
              ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..0.33 rows=1 width=34) (actual time=0.006..0.006 rows=1.00 loops=200)
                    Index Cond: (id = app.candidate_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 200
                    Buffers: shared hit=600
        ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..0.16 rows=1 width=51) (actual time=0.002..0.002 rows=1.00 loops=200)
              Index Cond: (id = app.job_id)
              Filter: (deleted_at IS NULL)
              Index Searches: 200
              Buffers: shared hit=400
Planning:
  Buffers: shared hit=67
Planning Time: 2.816 ms
Execution Time: 7.059 ms
```

### Phỏng vấn tồn đọng – Admin (1 trang 200)

```sql
SELECT "iv"."id" AS "iv_id", "iv"."application_id" AS "iv_application_id", "iv"."round" AS "iv_round", "iv"."scheduled_at" AS "iv_scheduled_at", "iv"."duration_minutes" AS "iv_duration_minutes", "iv"."location" AS "iv_location", "iv"."status" AS "iv_status", "iv"."cancel_reason" AS "iv_cancel_reason", "iv"."created_by" AS "iv_created_by", "iv"."created_at" AS "iv_created_at", "iv"."updated_at" AS "iv_updated_at", "ia"."interview_id" AS "ia_interview_id", "ia"."user_id" AS "ia_user_id", "au"."id" AS "au_id", "au"."email" AS "au_email", "au"."full_name" AS "au_full_name", "fb"."id" AS "fb_id", "fb"."interview_id" AS "fb_interview_id", "fb"."author_id" AS "fb_author_id", "fb"."overall" AS "fb_overall", "fb"."ratings" AS "fb_ratings", "fb"."comment" AS "fb_comment", "fb"."editable_until" AS "fb_editable_until", "fb"."submitted_at" AS "fb_submitted_at", "fb"."updated_at" AS "fb_updated_at", "fa"."id" AS "fa_id", "fa"."full_name" AS "fa_full_name", "app"."id" AS "app_id", "app"."status" AS "app_status", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "job"."id" AS "job_id", "job"."title" AS "job_title" FROM "interviews" "iv" LEFT JOIN "interview_assignees" "ia" ON "ia"."interview_id"="iv"."id"  LEFT JOIN "users" "au" ON "au"."id"="ia"."user_id" AND ("au"."deleted_at" IS NULL)  LEFT JOIN "interview_feedbacks" "fb" ON "fb"."interview_id"="iv"."id"  LEFT JOIN "users" "fa" ON "fa"."id"="fb"."author_id" AND ("fa"."deleted_at" IS NULL)  LEFT JOIN "applications" "app" ON "app"."id"="iv"."application_id" AND ("app"."deleted_at" IS NULL)  LEFT JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL)  LEFT JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE "iv"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65, $66, $67, $68, $69, $70, $71, $72, $73, $74, $75, $76, $77, $78, $79, $80, $81, $82, $83, $84, $85, $86, $87, $88, $89, $90, $91, $92, $93, $94, $95, $96, $97, $98, $99, $100, $101, $102, $103, $104, $105, $106, $107, $108, $109, $110, $111, $112, $113, $114, $115, $116, $117, $118, $119, $120, $121, $122, $123, $124, $125, $126, $127, $128, $129, $130, $131, $132, $133, $134, $135, $136, $137, $138, $139, $140, $141, $142, $143, $144, $145, $146, $147, $148, $149, $150, $151, $152, $153, $154, $155, $156, $157, $158, $159, $160, $161) ORDER BY "iv"."scheduled_at" ASC, "au_full_name" ASC
```

```
Sort  (cost=2792.31..2792.71 rows=161 width=493) (actual time=1.897..1.908 rows=161.00 loops=1)
  Sort Key: iv.scheduled_at, au.full_name
  Sort Method: quicksort  Memory: 76kB
  Buffers: shared hit=2325
  ->  Nested Loop Left Join  (cost=360.23..2786.41 rows=161 width=493) (actual time=0.375..1.792 rows=161.00 loops=1)
        Buffers: shared hit=2325
        ->  Nested Loop Left Join  (cost=360.09..2760.22 rows=161 width=458) (actual time=0.371..1.628 rows=161.00 loops=1)
              Buffers: shared hit=2003
              ->  Nested Loop Left Join  (cost=359.80..2706.91 rows=161 width=440) (actual time=0.365..1.266 rows=161.00 loops=1)
                    Buffers: shared hit=1520
                    ->  Hash Left Join  (cost=359.38..1392.47 rows=161 width=388) (actual time=0.359..0.843 rows=161.00 loops=1)
                          Hash Cond: (ia.user_id = au.id)
                          Buffers: shared hit=876
                          ->  Nested Loop Left Join  (cost=356.25..1388.89 rows=161 width=338) (actual time=0.340..0.789 rows=161.00 loops=1)
                                Buffers: shared hit=874
                                ->  Hash Left Join  (cost=355.84..777.65 rows=161 width=306) (actual time=0.332..0.480 rows=161.00 loops=1)
                                      Hash Cond: (iv.id = fb.interview_id)
                                      Buffers: shared hit=390
                                      ->  Bitmap Heap Scan on interviews iv  (cost=353.11..774.31 rows=161 width=134) (actual time=0.326..0.436 rows=161.00 loops=1)
                                            Recheck Cond: (id = ANY ('{23b27af1-c7bb-4439-87fe-3524c9699ed4,38b5c818-9ab0-4928-be63-5e2d06e6550e,a3c7edf1-421b-463d-b5e5-eed2195b733a,f02279a3-9dfb-4c59-b1c4-b9c6730a79ef,ccb836d9-565e-469e-97df-f03afe10eea1,13dfb1da-9177-4be7-a82c-ade1292f2eda,f977f0c3-576a-475c-aa57-d87b33fa3c63,33482d29-ad15-4aaf-8da6-401f1f10838e,9a747762-4f6f-4744-8c11-6a7be8990a53,4255bdcd-b5d7-4355-86d2-0a31ff4692b1,cf749624-a2b5-471d-a577-06e3340ed6ae,7d3de631-c755-4443-bb41-2c23f799bc7d,2e7c67f1-98c2-46ea-a429-eba425c02078,7a1e629c-feab-4720-a002-2017e0602162,04d7af57-9db0-4ec8-adb1-bd468ba91634,46c146bf-ce61-4b9f-893a-c1a6c8c8e62b,ff2bf763-0204-43e6-bf3a-1096bf14a602,548b4199-69c9-4c33-8431-125963f345cb,1483be98-355e-4c80-b24a-9a86e703e8de,4f5099bd-bf2f-41ea-9751-9e8c7472487e,a2efb411-cc9c-4b56-a48c-ea2b52ff0cad,dbd85365-68c5-468a-9ee3-1cde57157cb7,2c9e72fe-eb14-4a59-88b6-34570e4a411e,bdf8c526-ff89-4c9a-a100-8ac9d41f7a0b,b64d35a1-df84-4c51-a488-f7f07654b388,194e3e16-2427-4520-bf53-85fc1e6aa3cb,c40b6f39-0360-4496-934c-641e5ada8181,593c72dd-93fa-4c5f-9121-b857d48ac677,9d3c59ae-80b1-4146-b43a-a14a31a2fc70,c4d62212-65ad-4042-b0c1-0726f42c05c2,8eed89a5-4c25-4388-ada7-85b3406c3676,b5763a61-2335-4e5f-aa2d-a9b63e7a86df,f6d422d7-c8cb-4f14-abf4-c77cda8b5ac5,5905c65c-eb78-426d-9ef1-6b51badf73b3,8d036614-9c23-4e5a-b166-214b443fb715,de62784c-0625-40df-8c39-75336c475eba,0108d66e-c452-44e2-9f35-4d26ebd00226,3f23404c-2777-4517-a6ea-241b52591641,1d846357-07f4-4eab-bef9-4c894adeb3d7,619c3bf5-c5f3-41fb-92e2-6484e8acba0b,78133f84-afa1-4cf5-a6f5-ea7ddbbeb010,ad270a56-e8c6-4958-8cb2-f90ebbe28d80,97024787-46c6-4414-9018-db640792ebee,621b8141-9d10-488b-b216-119066a2d6f1,b56b3c9e-130d-4b16-94fe-8fcc89b9e2dd,3b986b45-b47d-4a47-8dbe-4a9f80b9d313,8b856689-30da-4a3e-bb52-7b1e841fbd06,0ac06514-bb98-4dde-ab6f-c1e9756eb747,14510216-9780-400e-9ed4-56e31b8d9ce2,556efe21-6a53-4c59-9219-8045746339e5,d92dad0f-b792-4980-9365-03c00ba33081,0ca00ab4-e7e6-464b-a218-b611bd7d8376,9fbf057f-5037-436b-b6ad-ab967e835baf,cb3537b4-cc51-42ef-9265-1026c04721f9,901b8a6b-7f22-4270-bbd7-354e6d051c28,a085d5e6-2cfe-40da-9ac0-3ce6029cd2bb,58502724-81ee-4b5a-9551-e29e56653826,3b5bc9af-418a-47e9-ac7a-c20a46e68356,6edd535a-bbec-4602-b9b6-755e7b551fc9,d1d8e2a2-ea80-43bf-87c3-9fe09aff473e,245c4604-e639-4b4c-a6e8-734e0ef897ad,57d560c8-7461-46ac-921e-7ef1de22c326,905b2cca-22fd-438a-98b3-90c880afa229,7ea08cc8-6b28-4513-9302-7c929222896c,32a41509-aeed-4a11-adac-ce3d8198bd53,5d387cdb-b973-47e7-a8fe-ea37ef7f2efc,d344a3b8-6f2f-4fab-98a1-a6ab17d3b675,1552c4fd-09d4-4391-9eee-0468fd58b2f2,23f1bced-bd00-4e0a-b3bf-3046fcad90fd,05ede159-c247-4f6f-9d01-d9323cbe98f6,65bcc1ad-2769-448d-b92f-21c57544bbf4,ecee423c-e1ee-456c-af15-a113013bfbfb,7d35c902-7cdd-4417-bdf6-c604e1ff39f5,a1c2ea08-5326-4716-a3c1-5d5814321b22,64f6c444-7b01-4ec1-9a18-5960459f3624,1c437438-a62c-4f6f-8904-5c377911a5ed,b6b4ede4-66f7-4131-9f27-f559dbb6b7dd,53f27348-b831-4173-96c0-64f7991d2138,4c08f90d-5fb8-4a52-aaa1-9198452343f5,ab5132cf-2cd4-4182-b5ed-a86070464858,3f298723-5669-4a10-a840-4062f9a416b1,6f7bc0fa-34fa-4650-a01c-aa20b6eccfa1,17035bcc-4cff-4250-af03-af44538515ee,e8b091aa-0ab7-40a7-a902-40e6071e7f5f,f10a8587-5cc9-472f-8a61-8b03ff47f771,c730a103-2a91-4d69-8008-0dd40efe8b71,80c4168e-3ba8-459c-85f9-bc8c95c683fe,550bc137-f08e-4a19-a4e2-ebafc41f0d29,9ca17dec-579c-4bd3-854c-1dfe69bd8ba1,9744ccc8-e019-48ec-86bd-f8ecd92671e2,19dadb39-e462-474f-812b-94e9ef57f7c3,a72452aa-f321-475d-972b-f0e6bd1aae1c,040a5368-e9f2-4f7d-9697-3f184fd8129d,a3e66223-7db8-4851-9602-a8a7505b8355,d2929826-ac86-4ccd-9934-c1af5888463c,7cb2807d-eb92-4c7a-9bf2-363d0b580bdf,36621dc9-b95d-43e7-a72b-b51c140eab93,ad539fae-871a-4dce-b3db-96594d841f09,790417f6-4365-4574-b385-c1776b60a62c,d205a1c9-5ef8-478f-a13b-eccd72713a76,f5a25f1b-6f0f-4e40-b8e4-8e6f39e58e2b,17e36d78-3587-4351-97bd-a9c155692cad,770d13b5-6560-40e9-9a21-3796d01a26ea,bc7ba1c5-12c8-45a0-ac88-6d445292752a,44fcbe50-48e3-44d2-8e05-e594cfb06866,028c0df8-b62a-40d5-aaa4-029e3cb17f7f,5b8be937-86c1-4341-aff1-53a3c5bb93cb,05867d32-e332-44c9-910f-360210a997f7,edff1765-bb44-47b8-ac38-00dd7d8896f4,d84c90ef-ac4c-4d69-bdfc-5f4a6bbb35b9,b96dcb05-557f-4394-b96d-485831c010cb,5c4e1459-40ce-4c08-aed0-05c357373542,de733076-2d7a-4854-9e10-6083ac00d082,1b0d587f-7bca-4c19-8cec-e01c9504fcc4,0736170d-996f-45a9-971b-078979ec8d2d,d10ee98a-c0d0-4d8b-b66b-4d49959a6c75,4a84c6c0-23b2-4a00-8ebb-7dd340e18d0f,ffc8d79c-14f3-4f42-892a-b49cd118b566,b625ad7d-0d5b-484a-b88d-6611dad2d26b,8b76f6b1-a7ee-42a0-b862-3b64824a96b5,aafe6c7b-8163-41bc-acb8-abbb3fb7ce55,1f295bf5-d76a-46b2-ba10-b1ca5c7e5279,f1a1c8b5-ed48-47e5-baac-ce132cba0a07,32501f38-b1fc-472c-a7ba-1915620d78dd,6251d7f1-6313-407a-a4f5-3c5101e3a793,9243c30e-4bf9-45b6-bdd6-0621c7bd0651,b91371ab-8212-486a-9887-2490053c183b,b09705f4-a2a6-4e85-992f-fbf62a078b89,caf9bcf2-1a44-499f-9ad4-b302f3c337ab,67e95168-63db-4b4b-9541-2f4e26fb1e16,06acc13e-f560-44a7-a165-83ef348cb1ec,b4c76495-b696-42de-a817-93c00f53d34e,6cc7fd4c-5752-45df-a944-3e8c2f722af2,7fc10229-84ca-48b9-8a82-824da22721c3,13926691-325c-4129-ad0a-bbc1c20ca310,92f1adcb-e889-47e0-b9c0-34a3a68722aa,152cd79f-3eed-4b63-8fbe-9512846ada14,65f1d6ae-dd6b-480e-9832-871a5d6be9b7,a2385802-872d-4106-9dab-b5f475f607f9,1d623576-eed8-4034-85b3-73cd2f939582,c6ccd5d4-8c9a-4b3d-b568-2efbf0d39116,0faad70c-c503-4b28-a8a2-72e99da3e589,7453f0c9-1624-487f-b441-da7f0c71ce94,dbf1304e-8a40-4fbd-a4bf-2a29a6e9f0ef,e5adf08d-da81-4c80-8054-4447d25fee86,95cf1022-9a1b-46d3-ab2a-34e3c6bc7882,0ee96717-729c-43b1-a205-06ab767221cc,4452e318-d0f5-43f1-a4e2-b16bcad6c03d,98405542-2528-4d97-a382-443eda8030cb,5b352672-c883-432b-a0ea-18d0f42591d6,dbd843a8-2bb5-472a-bcf9-ba7e71e20a78,a3ec25dd-b8b3-49d7-9ce1-13b357835cb6,d5b09802-2877-40d8-a71d-1c3db0860cc0,8d0252a9-5ca0-4cd5-a7cd-138a9a21e63b,8efa99f8-66c6-4aad-8f7e-c30d68f9928c,7ccb137c-f46e-4003-a47c-6a6ab4bbb31d,cc16c8e7-f8d6-49fa-93e0-0e2a6f7234f1,399a35a5-4e97-4769-a64d-9b1b4dba1cf9,050783b8-29b0-40ba-8e26-040f987d39cf,9ba84461-337a-4def-9a28-2d42c3bfa801,e4f3444c-33bc-4443-b354-f010f20a1647}'::uuid[]))
                                            Heap Blocks: exact=148
                                            Buffers: shared hit=390
                                            ->  Bitmap Index Scan on "PK_interviews"  (cost=0.00..352.67 rows=161 width=0) (actual time=0.310..0.310 rows=161.00 loops=1)
                                                  Index Cond: (id = ANY ('{23b27af1-c7bb-4439-87fe-3524c9699ed4,38b5c818-9ab0-4928-be63-5e2d06e6550e,a3c7edf1-421b-463d-b5e5-eed2195b733a,f02279a3-9dfb-4c59-b1c4-b9c6730a79ef,ccb836d9-565e-469e-97df-f03afe10eea1,13dfb1da-9177-4be7-a82c-ade1292f2eda,f977f0c3-576a-475c-aa57-d87b33fa3c63,33482d29-ad15-4aaf-8da6-401f1f10838e,9a747762-4f6f-4744-8c11-6a7be8990a53,4255bdcd-b5d7-4355-86d2-0a31ff4692b1,cf749624-a2b5-471d-a577-06e3340ed6ae,7d3de631-c755-4443-bb41-2c23f799bc7d,2e7c67f1-98c2-46ea-a429-eba425c02078,7a1e629c-feab-4720-a002-2017e0602162,04d7af57-9db0-4ec8-adb1-bd468ba91634,46c146bf-ce61-4b9f-893a-c1a6c8c8e62b,ff2bf763-0204-43e6-bf3a-1096bf14a602,548b4199-69c9-4c33-8431-125963f345cb,1483be98-355e-4c80-b24a-9a86e703e8de,4f5099bd-bf2f-41ea-9751-9e8c7472487e,a2efb411-cc9c-4b56-a48c-ea2b52ff0cad,dbd85365-68c5-468a-9ee3-1cde57157cb7,2c9e72fe-eb14-4a59-88b6-34570e4a411e,bdf8c526-ff89-4c9a-a100-8ac9d41f7a0b,b64d35a1-df84-4c51-a488-f7f07654b388,194e3e16-2427-4520-bf53-85fc1e6aa3cb,c40b6f39-0360-4496-934c-641e5ada8181,593c72dd-93fa-4c5f-9121-b857d48ac677,9d3c59ae-80b1-4146-b43a-a14a31a2fc70,c4d62212-65ad-4042-b0c1-0726f42c05c2,8eed89a5-4c25-4388-ada7-85b3406c3676,b5763a61-2335-4e5f-aa2d-a9b63e7a86df,f6d422d7-c8cb-4f14-abf4-c77cda8b5ac5,5905c65c-eb78-426d-9ef1-6b51badf73b3,8d036614-9c23-4e5a-b166-214b443fb715,de62784c-0625-40df-8c39-75336c475eba,0108d66e-c452-44e2-9f35-4d26ebd00226,3f23404c-2777-4517-a6ea-241b52591641,1d846357-07f4-4eab-bef9-4c894adeb3d7,619c3bf5-c5f3-41fb-92e2-6484e8acba0b,78133f84-afa1-4cf5-a6f5-ea7ddbbeb010,ad270a56-e8c6-4958-8cb2-f90ebbe28d80,97024787-46c6-4414-9018-db640792ebee,621b8141-9d10-488b-b216-119066a2d6f1,b56b3c9e-130d-4b16-94fe-8fcc89b9e2dd,3b986b45-b47d-4a47-8dbe-4a9f80b9d313,8b856689-30da-4a3e-bb52-7b1e841fbd06,0ac06514-bb98-4dde-ab6f-c1e9756eb747,14510216-9780-400e-9ed4-56e31b8d9ce2,556efe21-6a53-4c59-9219-8045746339e5,d92dad0f-b792-4980-9365-03c00ba33081,0ca00ab4-e7e6-464b-a218-b611bd7d8376,9fbf057f-5037-436b-b6ad-ab967e835baf,cb3537b4-cc51-42ef-9265-1026c04721f9,901b8a6b-7f22-4270-bbd7-354e6d051c28,a085d5e6-2cfe-40da-9ac0-3ce6029cd2bb,58502724-81ee-4b5a-9551-e29e56653826,3b5bc9af-418a-47e9-ac7a-c20a46e68356,6edd535a-bbec-4602-b9b6-755e7b551fc9,d1d8e2a2-ea80-43bf-87c3-9fe09aff473e,245c4604-e639-4b4c-a6e8-734e0ef897ad,57d560c8-7461-46ac-921e-7ef1de22c326,905b2cca-22fd-438a-98b3-90c880afa229,7ea08cc8-6b28-4513-9302-7c929222896c,32a41509-aeed-4a11-adac-ce3d8198bd53,5d387cdb-b973-47e7-a8fe-ea37ef7f2efc,d344a3b8-6f2f-4fab-98a1-a6ab17d3b675,1552c4fd-09d4-4391-9eee-0468fd58b2f2,23f1bced-bd00-4e0a-b3bf-3046fcad90fd,05ede159-c247-4f6f-9d01-d9323cbe98f6,65bcc1ad-2769-448d-b92f-21c57544bbf4,ecee423c-e1ee-456c-af15-a113013bfbfb,7d35c902-7cdd-4417-bdf6-c604e1ff39f5,a1c2ea08-5326-4716-a3c1-5d5814321b22,64f6c444-7b01-4ec1-9a18-5960459f3624,1c437438-a62c-4f6f-8904-5c377911a5ed,b6b4ede4-66f7-4131-9f27-f559dbb6b7dd,53f27348-b831-4173-96c0-64f7991d2138,4c08f90d-5fb8-4a52-aaa1-9198452343f5,ab5132cf-2cd4-4182-b5ed-a86070464858,3f298723-5669-4a10-a840-4062f9a416b1,6f7bc0fa-34fa-4650-a01c-aa20b6eccfa1,17035bcc-4cff-4250-af03-af44538515ee,e8b091aa-0ab7-40a7-a902-40e6071e7f5f,f10a8587-5cc9-472f-8a61-8b03ff47f771,c730a103-2a91-4d69-8008-0dd40efe8b71,80c4168e-3ba8-459c-85f9-bc8c95c683fe,550bc137-f08e-4a19-a4e2-ebafc41f0d29,9ca17dec-579c-4bd3-854c-1dfe69bd8ba1,9744ccc8-e019-48ec-86bd-f8ecd92671e2,19dadb39-e462-474f-812b-94e9ef57f7c3,a72452aa-f321-475d-972b-f0e6bd1aae1c,040a5368-e9f2-4f7d-9697-3f184fd8129d,a3e66223-7db8-4851-9602-a8a7505b8355,d2929826-ac86-4ccd-9934-c1af5888463c,7cb2807d-eb92-4c7a-9bf2-363d0b580bdf,36621dc9-b95d-43e7-a72b-b51c140eab93,ad539fae-871a-4dce-b3db-96594d841f09,790417f6-4365-4574-b385-c1776b60a62c,d205a1c9-5ef8-478f-a13b-eccd72713a76,f5a25f1b-6f0f-4e40-b8e4-8e6f39e58e2b,17e36d78-3587-4351-97bd-a9c155692cad,770d13b5-6560-40e9-9a21-3796d01a26ea,bc7ba1c5-12c8-45a0-ac88-6d445292752a,44fcbe50-48e3-44d2-8e05-e594cfb06866,028c0df8-b62a-40d5-aaa4-029e3cb17f7f,5b8be937-86c1-4341-aff1-53a3c5bb93cb,05867d32-e332-44c9-910f-360210a997f7,edff1765-bb44-47b8-ac38-00dd7d8896f4,d84c90ef-ac4c-4d69-bdfc-5f4a6bbb35b9,b96dcb05-557f-4394-b96d-485831c010cb,5c4e1459-40ce-4c08-aed0-05c357373542,de733076-2d7a-4854-9e10-6083ac00d082,1b0d587f-7bca-4c19-8cec-e01c9504fcc4,0736170d-996f-45a9-971b-078979ec8d2d,d10ee98a-c0d0-4d8b-b66b-4d49959a6c75,4a84c6c0-23b2-4a00-8ebb-7dd340e18d0f,ffc8d79c-14f3-4f42-892a-b49cd118b566,b625ad7d-0d5b-484a-b88d-6611dad2d26b,8b76f6b1-a7ee-42a0-b862-3b64824a96b5,aafe6c7b-8163-41bc-acb8-abbb3fb7ce55,1f295bf5-d76a-46b2-ba10-b1ca5c7e5279,f1a1c8b5-ed48-47e5-baac-ce132cba0a07,32501f38-b1fc-472c-a7ba-1915620d78dd,6251d7f1-6313-407a-a4f5-3c5101e3a793,9243c30e-4bf9-45b6-bdd6-0621c7bd0651,b91371ab-8212-486a-9887-2490053c183b,b09705f4-a2a6-4e85-992f-fbf62a078b89,caf9bcf2-1a44-499f-9ad4-b302f3c337ab,67e95168-63db-4b4b-9541-2f4e26fb1e16,06acc13e-f560-44a7-a165-83ef348cb1ec,b4c76495-b696-42de-a817-93c00f53d34e,6cc7fd4c-5752-45df-a944-3e8c2f722af2,7fc10229-84ca-48b9-8a82-824da22721c3,13926691-325c-4129-ad0a-bbc1c20ca310,92f1adcb-e889-47e0-b9c0-34a3a68722aa,152cd79f-3eed-4b63-8fbe-9512846ada14,65f1d6ae-dd6b-480e-9832-871a5d6be9b7,a2385802-872d-4106-9dab-b5f475f607f9,1d623576-eed8-4034-85b3-73cd2f939582,c6ccd5d4-8c9a-4b3d-b568-2efbf0d39116,0faad70c-c503-4b28-a8a2-72e99da3e589,7453f0c9-1624-487f-b441-da7f0c71ce94,dbf1304e-8a40-4fbd-a4bf-2a29a6e9f0ef,e5adf08d-da81-4c80-8054-4447d25fee86,95cf1022-9a1b-46d3-ab2a-34e3c6bc7882,0ee96717-729c-43b1-a205-06ab767221cc,4452e318-d0f5-43f1-a4e2-b16bcad6c03d,98405542-2528-4d97-a382-443eda8030cb,5b352672-c883-432b-a0ea-18d0f42591d6,dbd843a8-2bb5-472a-bcf9-ba7e71e20a78,a3ec25dd-b8b3-49d7-9ce1-13b357835cb6,d5b09802-2877-40d8-a71d-1c3db0860cc0,8d0252a9-5ca0-4cd5-a7cd-138a9a21e63b,8efa99f8-66c6-4aad-8f7e-c30d68f9928c,7ccb137c-f46e-4003-a47c-6a6ab4bbb31d,cc16c8e7-f8d6-49fa-93e0-0e2a6f7234f1,399a35a5-4e97-4769-a64d-9b1b4dba1cf9,050783b8-29b0-40ba-8e26-040f987d39cf,9ba84461-337a-4def-9a28-2d42c3bfa801,e4f3444c-33bc-4443-b354-f010f20a1647}'::uuid[]))
                                                  Index Searches: 121
                                                  Buffers: shared hit=242
                                      ->  Hash  (cost=2.71..2.71 rows=1 width=172) (actual time=0.004..0.005 rows=0.00 loops=1)
                                            Buckets: 1024  Batches: 1  Memory Usage: 8kB
                                            ->  Hash Right Join  (cost=0.01..2.71 rows=1 width=172) (actual time=0.004..0.004 rows=0.00 loops=1)
                                                  Hash Cond: (fa.id = fb.author_id)
                                                  ->  Seq Scan on users fa  (cost=0.00..2.50 rows=50 width=34) (never executed)
                                                        Filter: (deleted_at IS NULL)
                                                  ->  Hash  (cost=0.00..0.00 rows=1 width=138) (actual time=0.002..0.002 rows=0.00 loops=1)
                                                        Buckets: 1024  Batches: 1  Memory Usage: 8kB
                                                        ->  Seq Scan on interview_feedbacks fb  (cost=0.00..0.00 rows=1 width=138) (actual time=0.002..0.002 rows=0.00 loops=1)
                                ->  Index Only Scan using "PK_interview_assignees" on interview_assignees ia  (cost=0.41..3.79 rows=1 width=32) (actual time=0.002..0.002 rows=1.00 loops=161)
                                      Index Cond: (interview_id = iv.id)
                                      Heap Fetches: 0
                                      Index Searches: 161
                                      Buffers: shared hit=484
                          ->  Hash  (cost=2.50..2.50 rows=50 width=50) (actual time=0.017..0.017 rows=50.00 loops=1)
                                Buckets: 1024  Batches: 1  Memory Usage: 13kB
                                Buffers: shared hit=2
                                ->  Seq Scan on users au  (cost=0.00..2.50 rows=50 width=50) (actual time=0.003..0.009 rows=50.00 loops=1)
                                      Filter: (deleted_at IS NULL)
                                      Buffers: shared hit=2
                    ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..8.16 rows=1 width=52) (actual time=0.002..0.002 rows=1.00 loops=161)
                          Index Cond: (id = iv.application_id)
                          Filter: (deleted_at IS NULL)
                          Index Searches: 161
                          Buffers: shared hit=644
              ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..0.33 rows=1 width=34) (actual time=0.002..0.002 rows=1.00 loops=161)
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
Planning Time: 1.498 ms
Execution Time: 1.980 ms
```

### Lịch phỏng vấn – Interviewer

```sql
SELECT "iv"."id" AS "id", "iv"."scheduled_at" AS "scheduledAt" FROM "interviews" "iv" INNER JOIN "applications" "app" ON "app"."id"="iv"."application_id" AND ("app"."deleted_at" IS NULL)  INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE "iv"."scheduled_at" >= $1 AND "iv"."scheduled_at" < $2 AND "iv"."status" <> $3 AND "iv"."status" <> $3 AND "iv"."scheduled_at" <= now() AND ("iv"."status" = $4 OR "app"."status" = $5) AND EXISTS (SELECT 1 FROM interview_assignees ia WHERE ia.interview_id = "iv"."id" AND ia.user_id = $6) AND EXISTS (SELECT 1 FROM "interviews" "scope_iv" INNER JOIN "interview_assignees" "scope_ia" ON "scope_ia"."interview_id" = "scope_iv"."id" WHERE "scope_ia"."user_id" = $7 AND "scope_iv"."status" <> 'CANCELLED' AND "scope_iv"."application_id" = "app"."id") ORDER BY "iv"."scheduled_at" ASC, "iv"."id" ASC LIMIT 101
```

```
Limit  (cost=1215.74..1215.75 rows=1 width=24) (actual time=1.226..1.229 rows=7.00 loops=1)
  Buffers: shared hit=789
  ->  Sort  (cost=1215.74..1215.75 rows=1 width=24) (actual time=1.225..1.227 rows=7.00 loops=1)
        Sort Key: iv.scheduled_at, iv.id
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=789
        ->  Nested Loop  (cost=666.02..1215.73 rows=1 width=24) (actual time=0.539..1.222 rows=7.00 loops=1)
              Buffers: shared hit=789
              ->  Nested Loop Semi Join  (cost=665.88..1215.57 rows=1 width=40) (actual time=0.536..1.211 rows=7.00 loops=1)
                    Buffers: shared hit=775
                    ->  Nested Loop  (cost=665.17..1208.27 rows=9 width=72) (actual time=0.528..1.167 rows=7.00 loops=1)
                          Buffers: shared hit=732
                          ->  Hash Join  (cost=664.75..1089.03 rows=15 width=44) (actual time=0.520..1.107 rows=20.00 loops=1)
                                Hash Cond: (ia.interview_id = iv.id)
                                Buffers: shared hit=652
                                ->  Bitmap Heap Scan on interview_assignees ia  (cost=32.93..450.22 rows=2663 width=16) (actual time=0.095..0.581 rows=2722.00 loops=1)
                                      Recheck Cond: (user_id = '9a976d87-0566-4989-9cdb-f030ae3e0e51'::uuid)
                                      Heap Blocks: exact=384
                                      Buffers: shared hit=388
                                      ->  Bitmap Index Scan on "IDX_interview_assignees_user_id"  (cost=0.00..32.26 rows=2663 width=0) (actual time=0.059..0.059 rows=2722.00 loops=1)
                                            Index Cond: (user_id = '9a976d87-0566-4989-9cdb-f030ae3e0e51'::uuid)
                                            Index Searches: 1
                                            Buffers: shared hit=4
                                ->  Hash  (cost=628.25..628.25 rows=286 width=44) (actual time=0.347..0.348 rows=297.00 loops=1)
                                      Buckets: 1024  Batches: 1  Memory Usage: 31kB
                                      Buffers: shared hit=264
                                      ->  Bitmap Heap Scan on interviews iv  (cost=7.94..628.25 rows=286 width=44) (actual time=0.050..0.312 rows=297.00 loops=1)
                                            Recheck Cond: ((scheduled_at >= '2026-11-12 05:43:48.966+00'::timestamp with time zone) AND (scheduled_at < '2026-12-13 05:43:48.966+00'::timestamp with time zone) AND (scheduled_at <= now()))
                                            Filter: ((status <> 'CANCELLED'::interview_status_enum) AND (status <> 'CANCELLED'::interview_status_enum))
                                            Heap Blocks: exact=261
                                            Buffers: shared hit=264
                                            ->  Bitmap Index Scan on "IDX_interviews_scheduled_at"  (cost=0.00..7.87 rows=286 width=0) (actual time=0.026..0.026 rows=297.00 loops=1)
                                                  Index Cond: ((scheduled_at >= '2026-11-12 05:43:48.966+00'::timestamp with time zone) AND (scheduled_at < '2026-12-13 05:43:48.966+00'::timestamp with time zone) AND (scheduled_at <= now()))
                                                  Index Searches: 1
                                                  Buffers: shared hit=3
                          ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..7.94 rows=1 width=36) (actual time=0.003..0.003 rows=0.35 loops=20)
                                Index Cond: (id = iv.application_id)
                                Filter: ((deleted_at IS NULL) AND ((iv.status = 'SCHEDULED'::interview_status_enum) OR (status = 'INTERVIEW'::application_status_enum)))
                                Rows Removed by Filter: 1
                                Index Searches: 20
                                Buffers: shared hit=80
                    ->  Nested Loop  (cost=0.70..0.80 rows=1 width=16) (actual time=0.006..0.006 rows=1.00 loops=7)
                          Buffers: shared hit=43
                          ->  Index Scan using "IDX_interviews_application_id" on interviews scope_iv  (cost=0.29..0.33 rows=1 width=32) (actual time=0.003..0.003 rows=1.00 loops=7)
                                Index Cond: (application_id = app.id)
                                Filter: (status <> 'CANCELLED'::interview_status_enum)
                                Index Searches: 7
                                Buffers: shared hit=21
                          ->  Index Only Scan using "PK_interview_assignees" on interview_assignees scope_ia  (cost=0.41..0.47 rows=1 width=16) (actual time=0.002..0.002 rows=1.00 loops=7)
                                Index Cond: ((interview_id = scope_iv.id) AND (user_id = '9a976d87-0566-4989-9cdb-f030ae3e0e51'::uuid))
                                Heap Fetches: 0
                                Index Searches: 7
                                Buffers: shared hit=22
              ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..0.16 rows=1 width=16) (actual time=0.001..0.001 rows=1.00 loops=7)
                    Index Cond: (id = app.job_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 7
                    Buffers: shared hit=14
Planning:
  Buffers: shared hit=76
Planning Time: 1.217 ms
Execution Time: 1.260 ms
```

### Bảng hồ sơ – Interviewer

```sql
SELECT COUNT(*)::int AS "total" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL) WHERE ( EXISTS (SELECT 1 FROM "interviews" "scope_iv" INNER JOIN "interview_assignees" "scope_ia" ON "scope_ia"."interview_id" = "scope_iv"."id" WHERE "scope_ia"."user_id" = $1 AND "scope_iv"."status" <> 'CANCELLED' AND "scope_iv"."application_id" = "app"."id") ) AND ( "app"."deleted_at" IS NULL )
```

```
Aggregate  (cost=6956.26..6956.27 rows=1 width=4) (actual time=28.988..28.993 rows=1.00 loops=1)
  Buffers: shared hit=12235
  ->  Hash Join  (cost=2242.18..6949.60 rows=2663 width=0) (actual time=19.665..28.780 rows=2722.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=12235
        ->  Nested Loop  (cost=2226.68..6926.96 rows=2663 width=16) (actual time=19.580..28.211 rows=2722.00 loops=1)
              Buffers: shared hit=12224
              ->  HashAggregate  (cost=2226.26..2252.89 rows=2663 width=16) (actual time=19.562..19.896 rows=2722.00 loops=1)
                    Group Key: scope_iv.application_id
                    Batches: 1  Memory Usage: 217kB
                    Buffers: shared hit=1336
                    ->  Hash Join  (cost=483.50..2219.60 rows=2663 width=16) (actual time=1.391..18.628 rows=2722.00 loops=1)
                          Hash Cond: (scope_iv.id = scope_ia.interview_id)
                          Buffers: shared hit=1336
                          ->  Seq Scan on interviews scope_iv  (cost=0.00..1599.31 rows=52105 width=32) (actual time=0.004..10.232 rows=52105.00 loops=1)
                                Filter: (status <> 'CANCELLED'::interview_status_enum)
                                Buffers: shared hit=948
                          ->  Hash  (cost=450.22..450.22 rows=2663 width=16) (actual time=1.376..1.377 rows=2722.00 loops=1)
                                Buckets: 4096  Batches: 1  Memory Usage: 160kB
                                Buffers: shared hit=388
                                ->  Bitmap Heap Scan on interview_assignees scope_ia  (cost=32.93..450.22 rows=2663 width=16) (actual time=0.137..0.959 rows=2722.00 loops=1)
                                      Recheck Cond: (user_id = '9a976d87-0566-4989-9cdb-f030ae3e0e51'::uuid)
                                      Heap Blocks: exact=384
                                      Buffers: shared hit=388
                                      ->  Bitmap Index Scan on "IDX_interview_assignees_user_id"  (cost=0.00..32.26 rows=2663 width=0) (actual time=0.086..0.087 rows=2722.00 loops=1)
                                            Index Cond: (user_id = '9a976d87-0566-4989-9cdb-f030ae3e0e51'::uuid)
                                            Index Searches: 1
                                            Buffers: shared hit=4
              ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..1.77 rows=1 width=32) (actual time=0.003..0.003 rows=1.00 loops=2722)
                    Index Cond: (id = scope_iv.application_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 2722
                    Buffers: shared hit=10888
        ->  Hash  (cost=13.00..13.00 rows=200 width=16) (actual time=0.081..0.082 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 18kB
              Buffers: shared hit=11
              ->  Seq Scan on jobs job  (cost=0.00..13.00 rows=200 width=16) (actual time=0.007..0.052 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=11
Planning:
  Buffers: shared hit=33
Planning Time: 0.470 ms
Execution Time: 29.046 ms
```

### Thông báo – HR nhiều nhất

```sql
SELECT "n"."id" AS "n_id", "n"."created_at" AS "n_created_at" FROM "notifications" "n" WHERE "n"."user_id" = $1 ORDER BY "n_created_at" DESC, "n_id" DESC LIMIT 21
```

```
Limit  (cost=4679.95..4680.01 rows=21 width=24) (actual time=11.154..11.157 rows=21.00 loops=1)
  Buffers: shared hit=2677
  ->  Sort  (cost=4679.95..4750.89 rows=28373 width=24) (actual time=11.152..11.154 rows=21.00 loops=1)
        Sort Key: created_at DESC, id DESC
        Sort Method: top-N heapsort  Memory: 27kB
        Buffers: shared hit=2677
        ->  Bitmap Heap Scan on notifications n  (cost=1120.31..3914.97 rows=28373 width=24) (actual time=2.271..7.858 rows=28437.00 loops=1)
              Recheck Cond: (user_id = '011ab9f5-4d3f-40f0-be8f-18f8ab7a9e04'::uuid)
              Heap Blocks: exact=2440
              Buffers: shared hit=2677
              ->  Bitmap Index Scan on "IDX_notifications_user_id_read_at_created_at"  (cost=0.00..1113.22 rows=28373 width=0) (actual time=1.957..1.957 rows=28437.00 loops=1)
                    Index Cond: (user_id = '011ab9f5-4d3f-40f0-be8f-18f8ab7a9e04'::uuid)
                    Index Searches: 1
                    Buffers: shared hit=237
Planning Time: 0.052 ms
Execution Time: 11.170 ms
```

### Số thông báo chưa đọc – HR

```sql
SELECT COUNT(1) AS "cnt" FROM "notifications" "Notification" WHERE (("Notification"."user_id" = $1) AND ("Notification"."read_at" IS NULL))
```

```
Aggregate  (cost=156.57..156.58 rows=1 width=8) (actual time=0.501..0.502 rows=1.00 loops=1)
  Buffers: shared hit=23
  ->  Index Only Scan using "IDX_notifications_user_id_read_at_created_at" on notifications "Notification"  (cost=0.42..149.44 rows=2851 width=0) (actual time=0.013..0.388 rows=2861.00 loops=1)
        Index Cond: ((user_id = '011ab9f5-4d3f-40f0-be8f-18f8ab7a9e04'::uuid) AND (read_at IS NULL))
        Heap Fetches: 0
        Index Searches: 1
        Buffers: shared hit=23
Planning Time: 0.103 ms
Execution Time: 0.513 ms
```

### Nhật ký kiểm toán – trang đầu

```sql
SELECT "log"."id" AS "log_id", "log"."actor_id" AS "log_actor_id", "log"."action" AS "log_action", "log"."entity" AS "log_entity", "log"."entity_id" AS "log_entity_id", "log"."metadata" AS "log_metadata", "log"."ip" AS "log_ip", "log"."request_id" AS "log_request_id", "log"."created_at" AS "log_created_at", "actor"."id" AS "actor_id", "actor"."email" AS "actor_email", "actor"."full_name" AS "actor_full_name" FROM "audit_logs" "log" LEFT JOIN "users" "actor" ON  "actor"."id" = "log"."actor_id" AND "actor"."deleted_at" IS NULL ORDER BY "log"."created_at" DESC, "log"."id" DESC LIMIT 51
```

```
Limit  (cost=0.57..8.37 rows=51 width=364) (actual time=0.020..0.091 rows=51.00 loops=1)
  Buffers: shared hit=42
  ->  Nested Loop Left Join  (cost=0.57..42848.07 rows=280403 width=364) (actual time=0.019..0.085 rows=51.00 loops=1)
        Buffers: shared hit=42
        ->  Index Scan Backward using "IDX_audit_logs_created_at_id" on audit_logs log  (cost=0.42..35914.10 rows=280403 width=314) (actual time=0.008..0.025 rows=51.00 loops=1)
              Index Searches: 1
              Buffers: shared hit=16
        ->  Memoize  (cost=0.15..0.17 rows=1 width=50) (actual time=0.001..0.001 rows=1.00 loops=51)
              Cache Key: log.actor_id
              Cache Mode: logical
              Hits: 38  Misses: 13  Evictions: 0  Overflows: 0  Memory Usage: 3kB
              Buffers: shared hit=26
              ->  Index Scan using "PK_a3ffb1c0c8416b9fc6f907b7433" on users actor  (cost=0.14..0.16 rows=1 width=50) (actual time=0.001..0.001 rows=1.00 loops=13)
                    Index Cond: (id = log.actor_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 13
                    Buffers: shared hit=26
Planning:
  Buffers: shared hit=6
Planning Time: 0.493 ms
Execution Time: 0.114 ms
```

### Tin công khai – trang đầu

```sql
SELECT "job"."id" AS "job_id", "job"."title" AS "job_title", "job"."location" AS "job_location", "job"."jd_version" AS "job_jd_version", "job"."published_at" AS "job_published_at", "job"."salary_min" AS "job_salary_min", "job"."salary_max" AS "job_salary_max", "job"."salary_visibility" AS "job_salary_visibility", "job"."level" AS "job_level", "job"."employment_type" AS "job_employment_type", "job"."work_mode" AS "job_work_mode", "job"."headcount" AS "job_headcount", "job"."deadline" AS "job_deadline", "department"."id" AS "department_id", "department"."name" AS "department_name" FROM "jobs" "job" INNER JOIN "departments" "department" ON "department"."id"="job"."department_id" AND ("department"."deleted_at" IS NULL) WHERE ( "job"."status" = $1 AND ("job"."deadline" IS NULL OR "job"."deadline" >= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) ) AND ( "job"."deleted_at" IS NULL ) ORDER BY "job_published_at" DESC, "job_id" DESC LIMIT 20 OFFSET 0
```

```
Limit  (cost=22.19..22.24 rows=20 width=132) (actual time=0.212..0.215 rows=20.00 loops=1)
  Buffers: shared hit=12
  ->  Sort  (cost=22.19..22.64 rows=180 width=132) (actual time=0.211..0.213 rows=20.00 loops=1)
        Sort Key: job.published_at DESC, job.id DESC
        Sort Method: top-N heapsort  Memory: 34kB
        Buffers: shared hit=12
        ->  Hash Join  (cost=1.23..17.40 rows=180 width=132) (actual time=0.015..0.096 rows=180.00 loops=1)
              Hash Cond: (job.department_id = department.id)
              Buffers: shared hit=12
              ->  Seq Scan on jobs job  (cost=0.00..15.50 rows=180 width=119) (actual time=0.006..0.052 rows=180.00 loops=1)
                    Filter: ((deleted_at IS NULL) AND (status = 'OPEN'::jobs_status_enum) AND ((deadline IS NULL) OR (deadline >= ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh'::text))::date)))
                    Rows Removed by Filter: 20
                    Buffers: shared hit=11
              ->  Hash  (cost=1.10..1.10 rows=10 width=29) (actual time=0.006..0.006 rows=10.00 loops=1)
                    Buckets: 1024  Batches: 1  Memory Usage: 9kB
                    Buffers: shared hit=1
                    ->  Seq Scan on departments department  (cost=0.00..1.10 rows=10 width=29) (actual time=0.002..0.003 rows=10.00 loops=1)
                          Filter: (deleted_at IS NULL)
                          Buffers: shared hit=1
Planning:
  Buffers: shared hit=4
Planning Time: 0.193 ms
Execution Time: 0.236 ms
```
