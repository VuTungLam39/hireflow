# Kết quả đo: before

- Thời điểm: 2026-10-22T12:22:13.322Z
- Máy: 11th Gen Intel(R) Core(TM) i7-11850H @ 2.50GHz · 16 luồng · RAM 16 GB · Node v22.22.0
- DB: ncc_intern_perf; 50 request mỗi kịch bản, 5 request đồng thời, 10 request làm nóng
- Từ khoá tìm: "binh doan"

## Endpoint

| Kịch bản | Query/request | p50 (ms) | p95 (ms) | max (ms) | Query chính (EXPLAIN ANALYZE) |
|---|---|---|---|---|---|
| Bảng hồ sơ – mặc định (mới nhất) | 3 (limit 100: 3) | 491.3 | 584.7 | 628.3 | 149.333 ms · Seq Scan applications, Seq Scan jobs, Seq Scan candidates |
| Bảng hồ sơ – sắp theo điểm | 3 | 528.4 | 674.5 | 683.8 | 143.28 ms · Seq Scan applications, Seq Scan jobs, Seq Scan candidates |
| Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm | 3 | 16 | 28 | 33 | 1.36 ms · Bitmap Heap Scan applications |
| Bảng hồ sơ – lọc cờ thiếu MUST | 3 | 363.2 | 463 | 512.8 | 123.438 ms · Seq Scan applications, Seq Scan jobs |
| Bảng hồ sơ – tìm tên không dấu | 3 | 334.8 | 389.8 | 409.8 | 90.594 ms · Seq Scan jobs, Seq Scan candidates |
| Bảng hồ sơ – trang sâu (OFFSET 150.000) | 3 | 903.4 | 1050.7 | 1098.4 | 274.904 ms · Seq Scan applications, Seq Scan jobs, Seq Scan candidates |
| Bảng hồ sơ – Hiring Manager (scope phòng) | 3 (limit 100: 3) | 267.3 | 332.1 | 345.1 | 92.279 ms · Seq Scan applications, Seq Scan jobs |
| Danh sách job kèm pipeline | 5 (limit 100: 5) | 127.3 | 231.8 | 247.7 | 0.471 ms · Seq Scan jobs, Seq Scan departments |
| Xếp hạng job đông hồ sơ nhất | 4 | 162.9 | 279.2 | 283.5 | 0.065 ms · Seq Scan departments |
| Chi tiết hồ sơ | 3 | 13 | 15.9 | 18.2 | 0.034 ms ·  |
| Kho ứng viên – trang đầu | 3 (limit 100: 3) | 22.4 | 28.2 | 32.8 | 7.607 ms · Seq Scan candidates |
| Kho ứng viên – tìm không dấu | 3 | 177.8 | 217.2 | 221 | 102.001 ms · Seq Scan candidates |
| Kho ứng viên – Hiring Manager | 3 | 40.6 | 50.1 | 53 | 26.212 ms · Seq Scan candidates, Seq Scan jobs |
| Dashboard – Admin | 2 | 203.8 | 250.8 | 262.5 | 165.791 ms · Seq Scan applications, Seq Scan jobs |
| Dashboard – Hiring Manager | 2 | 76 | 93.8 | 95.4 | 76.049 ms · Seq Scan applications, Seq Scan jobs |

## Mô phỏng trước/sau (chạy thẳng trên DB, 30 lần)

| Bài toán | Cách làm | Số query | p50 (ms) | p95 (ms) |
|---|---|---|---|---|
| List hồ sơ 20 dòng | N+1: lấy ứng viên, job từng dòng | 41 | 83.1 | 173.8 |
| List hồ sơ 20 dòng | JOIN, chỉ chọn cột cần | 1 | 123 | 161.4 |
| Job kèm pipeline 20 job | Đếm từng job, từng nhóm | 80 | 96 | 135.3 |
| Job kèm pipeline 20 job | Một câu GROUP BY + COUNT FILTER | 1 | 68.4 | 159.3 |
| Dashboard | Nhiều query rời (tổng, từng trạng thái, từng job) | 210 | 1191.1 | 1523.1 |
| Dashboard | Một query tổng hợp theo job | 1 | 102.4 | 204.2 |
| Trang thứ 7.501 (20 dòng) | OFFSET 150.000 | 1 | 118.8 | 176.9 |
| Trang thứ 7.501 (20 dòng) | Cursor (created_at, id) | 1 | 74.2 | 163.5 |

## Kế hoạch thực thi

### Bảng hồ sơ – mặc định (mới nhất)

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE "app"."deleted_at" IS NULL ORDER BY "app_created_at" DESC NULLS LAST, "app_id" DESC LIMIT 20 OFFSET 0
```

```
Limit  (cost=22896.48..22898.81 rows=20 width=183) (actual time=140.758..148.765 rows=20.00 loops=1)
  Buffers: shared hit=17921 read=1229
  ->  Gather Merge  (cost=22896.48..46189.66 rows=199999 width=183) (actual time=140.757..148.762 rows=20.00 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        Buffers: shared hit=17921 read=1229
        ->  Sort  (cost=21896.45..22104.79 rows=83333 width=183) (actual time=97.692..97.695 rows=15.67 loops=3)
              Sort Key: app.created_at DESC NULLS LAST, app.id DESC
              Sort Method: top-N heapsort  Memory: 34kB
              Buffers: shared hit=17921 read=1229
              Worker 0:  Sort Method: top-N heapsort  Memory: 34kB
              Worker 1:  Sort Method: top-N heapsort  Memory: 34kB
              ->  Hash Join  (cost=2051.50..19678.99 rows=83333 width=183) (actual time=18.804..84.046 rows=66666.67 loops=3)
                    Hash Cond: (app.candidate_id = candidate.id)
                    Buffers: shared hit=17889 read=1229
                    ->  Hash Join  (cost=14.50..17423.22 rows=83333 width=133) (actual time=0.624..48.763 rows=66666.67 loops=3)
                          Hash Cond: (app.job_id = job.id)
                          Buffers: shared hit=15153 read=1229
                          ->  Parallel Seq Scan on applications app  (cost=0.00..17185.33 rows=83333 width=82) (actual time=0.154..25.208 rows=66666.67 loops=3)
                                Filter: (deleted_at IS NULL)
                                Buffers: shared hit=15123 read=1229
                          ->  Hash  (cost=12.00..12.00 rows=200 width=51) (actual time=0.452..0.453 rows=200.00 loops=3)
                                Buckets: 1024  Batches: 1  Memory Usage: 25kB
                                Buffers: shared hit=30
                                ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=51) (actual time=0.339..0.399 rows=200.00 loops=3)
                                      Filter: (deleted_at IS NULL)
                                      Buffers: shared hit=30
                    ->  Hash  (cost=1412.00..1412.00 rows=50000 width=66) (actual time=18.019..18.019 rows=50000.00 loops=3)
                          Buckets: 65536  Batches: 1  Memory Usage: 5312kB
                          Buffers: shared hit=2736
                          ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=66) (actual time=0.297..8.210 rows=50000.00 loops=3)
                                Filter: (deleted_at IS NULL)
                                Buffers: shared hit=2736
Planning:
  Buffers: shared hit=19
Planning Time: 0.405 ms
Execution Time: 149.333 ms
```

### Bảng hồ sơ – sắp theo điểm

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE "app"."deleted_at" IS NULL ORDER BY "app_score" DESC NULLS LAST, "app_id" DESC LIMIT 20 OFFSET 0
```

```
Limit  (cost=22896.48..22898.81 rows=20 width=183) (actual time=134.322..142.430 rows=20.00 loops=1)
  Buffers: shared hit=17849 read=1299
  ->  Gather Merge  (cost=22896.48..46189.66 rows=199999 width=183) (actual time=134.321..142.426 rows=20.00 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        Buffers: shared hit=17849 read=1299
        ->  Sort  (cost=21896.45..22104.79 rows=83333 width=183) (actual time=93.712..93.716 rows=17.00 loops=3)
              Sort Key: app.score DESC NULLS LAST, app.id DESC
              Sort Method: top-N heapsort  Memory: 33kB
              Buffers: shared hit=17849 read=1299
              Worker 0:  Sort Method: top-N heapsort  Memory: 33kB
              Worker 1:  Sort Method: top-N heapsort  Memory: 34kB
              ->  Hash Join  (cost=2051.50..19678.99 rows=83333 width=183) (actual time=20.253..80.230 rows=66666.67 loops=3)
                    Hash Cond: (app.candidate_id = candidate.id)
                    Buffers: shared hit=17819 read=1299
                    ->  Hash Join  (cost=14.50..17423.22 rows=83333 width=133) (actual time=0.511..44.686 rows=66666.67 loops=3)
                          Hash Cond: (app.job_id = job.id)
                          Buffers: shared hit=15083 read=1299
                          ->  Parallel Seq Scan on applications app  (cost=0.00..17185.33 rows=83333 width=82) (actual time=0.013..23.110 rows=66666.67 loops=3)
                                Filter: (deleted_at IS NULL)
                                Buffers: shared hit=15053 read=1299
                          ->  Hash  (cost=12.00..12.00 rows=200 width=51) (actual time=0.488..0.489 rows=200.00 loops=3)
                                Buckets: 1024  Batches: 1  Memory Usage: 25kB
                                Buffers: shared hit=30
                                ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=51) (actual time=0.409..0.454 rows=200.00 loops=3)
                                      Filter: (deleted_at IS NULL)
                                      Buffers: shared hit=30
                    ->  Hash  (cost=1412.00..1412.00 rows=50000 width=66) (actual time=19.640..19.640 rows=50000.00 loops=3)
                          Buckets: 65536  Batches: 1  Memory Usage: 5312kB
                          Buffers: shared hit=2736
                          ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=66) (actual time=0.374..8.779 rows=50000.00 loops=3)
                                Filter: (deleted_at IS NULL)
                                Buffers: shared hit=2736
Planning:
  Buffers: shared hit=19
Planning Time: 0.412 ms
Execution Time: 143.280 ms
```

### Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."job_id" = $1 AND "app"."status" = $2 ) AND ( "app"."deleted_at" IS NULL ) ORDER BY "app_score" DESC NULLS LAST, "app_id" DESC LIMIT 20 OFFSET 0
```

```
Limit  (cost=5096.08..5096.13 rows=20 width=183) (actual time=1.274..1.277 rows=20.00 loops=1)
  Buffers: shared hit=1922
  ->  Sort  (cost=5096.08..5096.73 rows=261 width=183) (actual time=1.273..1.275 rows=20.00 loops=1)
        Sort Key: app.score DESC NULLS LAST, app.id DESC
        Sort Method: top-N heapsort  Memory: 34kB
        Buffers: shared hit=1922
        ->  Nested Loop  (cost=44.80..5089.14 rows=261 width=183) (actual time=0.254..1.211 rows=264.00 loops=1)
              Buffers: shared hit=1922
              ->  Nested Loop  (cost=44.51..3380.88 rows=261 width=133) (actual time=0.250..0.801 rows=264.00 loops=1)
                    Buffers: shared hit=1130
                    ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..8.16 rows=1 width=51) (actual time=0.004..0.005 rows=1.00 loops=1)
                          Index Cond: (id = 'd748691f-65b5-4d7b-a1db-325f47069f8d'::uuid)
                          Filter: (deleted_at IS NULL)
                          Index Searches: 1
                          Buffers: shared hit=2
                    ->  Bitmap Heap Scan on applications app  (cost=44.36..3370.11 rows=261 width=82) (actual time=0.244..0.761 rows=264.00 loops=1)
                          Recheck Cond: ((job_id = 'd748691f-65b5-4d7b-a1db-325f47069f8d'::uuid) AND (deleted_at IS NULL))
                          Filter: (status = 'SCREENING'::application_status_enum)
                          Rows Removed by Filter: 887
                          Heap Blocks: exact=1117
                          Buffers: shared hit=1128
                          ->  Bitmap Index Scan on "UQ_applications_job_id_candidate_id"  (cost=0.00..44.30 rows=1050 width=0) (actual time=0.144..0.144 rows=1151.00 loops=1)
                                Index Cond: (job_id = 'd748691f-65b5-4d7b-a1db-325f47069f8d'::uuid)
                                Index Searches: 1
                                Buffers: shared hit=11
              ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..6.55 rows=1 width=66) (actual time=0.001..0.001 rows=1.00 loops=264)
                    Index Cond: (id = app.candidate_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 264
                    Buffers: shared hit=792
Planning:
  Buffers: shared hit=15
Planning Time: 0.283 ms
Execution Time: 1.360 ms
```

### Bảng hồ sơ – lọc cờ thiếu MUST

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."flags" @> ARRAY['MISSING_MUST']::score_flag_enum[] ) AND ( "app"."deleted_at" IS NULL ) ORDER BY "app_created_at" DESC NULLS LAST, "app_id" DESC LIMIT 20 OFFSET 0
```

```
Limit  (cost=20309.34..20317.06 rows=20 width=183) (actual time=105.773..112.027 rows=20.00 loops=1)
  Buffers: shared hit=15428 read=1294, temp read=494 written=710
  ->  Nested Loop  (cost=20309.34..43547.40 rows=60220 width=183) (actual time=105.771..112.022 rows=20.00 loops=1)
        Buffers: shared hit=15428 read=1294, temp read=494 written=710
        ->  Gather Merge  (cost=20309.04..27322.65 rows=60220 width=133) (actual time=105.489..111.670 rows=20.00 loops=1)
              Workers Planned: 2
              Workers Launched: 2
              Buffers: shared hit=15368 read=1294, temp read=494 written=710
              ->  Sort  (cost=19309.01..19371.74 rows=25092 width=133) (actual time=57.859..57.974 rows=259.33 loops=3)
                    Sort Key: app.created_at DESC NULLS LAST, app.id DESC
                    Sort Method: external merge  Disk: 5672kB
                    Buffers: shared hit=15368 read=1294, temp read=494 written=710
                    Worker 0:  Sort Method: quicksort  Memory: 2085kB
                    Worker 1:  Sort Method: quicksort  Memory: 2187kB
                    ->  Hash Join  (cost=14.50..17475.42 rows=25092 width=133) (actual time=0.778..46.591 rows=20064.33 loops=3)
                          Hash Cond: (app.job_id = job.id)
                          Buffers: shared hit=15336 read=1294
                          ->  Parallel Seq Scan on applications app  (cost=0.00..17393.67 rows=25092 width=82) (actual time=0.201..41.341 rows=20064.33 loops=3)
                                Filter: ((deleted_at IS NULL) AND (flags @> '{MISSING_MUST}'::score_flag_enum[]))
                                Rows Removed by Filter: 46602
                                Buffers: shared hit=15306 read=1294
                          ->  Hash  (cost=12.00..12.00 rows=200 width=51) (actual time=0.564..0.565 rows=200.00 loops=3)
                                Buckets: 1024  Batches: 1  Memory Usage: 25kB
                                Buffers: shared hit=30
                                ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=51) (actual time=0.439..0.507 rows=200.00 loops=3)
                                      Filter: (deleted_at IS NULL)
                                      Buffers: shared hit=30
        ->  Memoize  (cost=0.30..0.40 rows=1 width=66) (actual time=0.017..0.017 rows=1.00 loops=20)
              Cache Key: app.candidate_id
              Cache Mode: logical
              Hits: 0  Misses: 20  Evictions: 0  Overflows: 0  Memory Usage: 4kB
              Buffers: shared hit=60
              ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..0.39 rows=1 width=66) (actual time=0.004..0.004 rows=1.00 loops=20)
                    Index Cond: (id = app.candidate_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 20
                    Buffers: shared hit=60
Planning:
  Buffers: shared hit=19
Planning Time: 0.580 ms
Execution Time: 123.438 ms
```

### Bảng hồ sơ – tìm tên không dấu

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( (f_unaccent(lower("candidate"."full_name")) LIKE '%' || f_unaccent(lower($1)) || '%' OR "candidate"."email" LIKE '%' || lower($1) || '%') ) AND ( "app"."deleted_at" IS NULL ) ORDER BY "app_created_at" DESC NULLS LAST, "app_id" DESC LIMIT 20 OFFSET 0
```

```
Limit  (cost=14625.46..14625.51 rows=20 width=183) (actual time=90.565..90.568 rows=20.00 loops=1)
  Buffers: shared hit=1003
  ->  Sort  (cost=14625.46..14625.56 rows=40 width=183) (actual time=90.564..90.565 rows=20.00 loops=1)
        Sort Key: app.created_at DESC NULLS LAST, app.id DESC
        Sort Method: top-N heapsort  Memory: 33kB
        Buffers: shared hit=1003
        ->  Nested Loop  (cost=0.42..14624.40 rows=40 width=183) (actual time=2.044..90.538 rows=76.00 loops=1)
              Join Filter: (job.id = app.job_id)
              Rows Removed by Join Filter: 15124
              Buffers: shared hit=1003
              ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=51) (actual time=0.009..0.034 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=10
              ->  Materialize  (cost=0.42..14492.50 rows=40 width=132) (actual time=0.010..0.449 rows=76.00 loops=200)
                    Storage: Memory  Maximum Storage: 29kB
                    Buffers: shared hit=993
                    ->  Nested Loop  (cost=0.42..14492.30 rows=40 width=132) (actual time=2.028..89.329 rows=76.00 loops=1)
                          Buffers: shared hit=993
                          ->  Seq Scan on candidates candidate  (cost=0.00..14287.00 rows=10 width=66) (actual time=2.014..89.149 rows=19.00 loops=1)
                                Filter: ((deleted_at IS NULL) AND ((f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text) OR ((email)::text ~~ '%binh doan%'::text)))
                                Rows Removed by Filter: 49981
                                Buffers: shared hit=912
                          ->  Index Scan using "IDX_applications_candidate_id" on applications app  (cost=0.42..20.49 rows=4 width=82) (actual time=0.006..0.007 rows=4.00 loops=19)
                                Index Cond: (candidate_id = candidate.id)
                                Filter: (deleted_at IS NULL)
                                Index Searches: 19
                                Buffers: shared hit=81
Planning:
  Buffers: shared hit=19
Planning Time: 0.406 ms
Execution Time: 90.594 ms
```

### Bảng hồ sơ – trang sâu (OFFSET 150.000)

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE "app"."deleted_at" IS NULL ORDER BY "app_created_at" DESC NULLS LAST, "app_id" DESC LIMIT 20 OFFSET 150000
```

```
Limit  (cost=52366.04..52368.37 rows=20 width=183) (actual time=243.312..264.800 rows=20.00 loops=1)
  Buffers: shared hit=17852 read=1298, temp read=4418 written=4788
  ->  Gather Merge  (cost=34896.07..58189.25 rows=199999 width=183) (actual time=203.128..261.455 rows=150020.00 loops=1)
        Workers Planned: 2
        Workers Launched: 2
        Buffers: shared hit=17852 read=1298, temp read=4418 written=4788
        ->  Sort  (cost=33896.05..34104.38 rows=83333 width=183) (actual time=154.384..164.740 rows=50182.00 loops=3)
              Sort Key: app.created_at DESC NULLS LAST, app.id DESC
              Sort Method: external merge  Disk: 18520kB
              Buffers: shared hit=17852 read=1298, temp read=4418 written=4788
              Worker 0:  Sort Method: external merge  Disk: 9536kB
              Worker 1:  Sort Method: external merge  Disk: 10152kB
              ->  Hash Join  (cost=2051.50..19678.99 rows=83333 width=183) (actual time=24.150..100.758 rows=66666.67 loops=3)
                    Hash Cond: (app.candidate_id = candidate.id)
                    Buffers: shared hit=17820 read=1298
                    ->  Hash Join  (cost=14.50..17423.22 rows=83333 width=133) (actual time=0.510..58.690 rows=66666.67 loops=3)
                          Hash Cond: (app.job_id = job.id)
                          Buffers: shared hit=15084 read=1298
                          ->  Parallel Seq Scan on applications app  (cost=0.00..17185.33 rows=83333 width=82) (actual time=0.018..32.663 rows=66666.67 loops=3)
                                Filter: (deleted_at IS NULL)
                                Buffers: shared hit=15054 read=1298
                          ->  Hash  (cost=12.00..12.00 rows=200 width=51) (actual time=0.476..0.477 rows=200.00 loops=3)
                                Buckets: 1024  Batches: 1  Memory Usage: 25kB
                                Buffers: shared hit=30
                                ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=51) (actual time=0.349..0.420 rows=200.00 loops=3)
                                      Filter: (deleted_at IS NULL)
                                      Buffers: shared hit=30
                    ->  Hash  (cost=1412.00..1412.00 rows=50000 width=66) (actual time=23.466..23.467 rows=50000.00 loops=3)
                          Buckets: 65536  Batches: 1  Memory Usage: 5312kB
                          Buffers: shared hit=2736
                          ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=66) (actual time=0.281..10.256 rows=50000.00 loops=3)
                                Filter: (deleted_at IS NULL)
                                Buffers: shared hit=2736
Planning:
  Buffers: shared hit=19
Planning Time: 0.696 ms
Execution Time: 274.904 ms
```

### Bảng hồ sơ – Hiring Manager (scope phòng)

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "job"."department_id" = $1 ) AND ( "app"."deleted_at" IS NULL ) ORDER BY "app_created_at" DESC NULLS LAST, "app_id" DESC LIMIT 20 OFFSET 0
```

```
Limit  (cost=18964.46..18973.41 rows=20 width=183) (actual time=84.897..92.151 rows=20.00 loops=1)
  Buffers: shared hit=15250 read=1224
  ->  Nested Loop  (cost=18964.46..27919.49 rows=20000 width=183) (actual time=84.895..92.147 rows=20.00 loops=1)
        Buffers: shared hit=15250 read=1224
        ->  Gather Merge  (cost=18964.17..21293.49 rows=20000 width=133) (actual time=84.863..92.025 rows=20.00 loops=1)
              Workers Planned: 2
              Workers Launched: 2
              Buffers: shared hit=15190 read=1224
              ->  Sort  (cost=17964.14..17984.97 rows=8333 width=133) (actual time=38.034..38.067 rows=279.67 loops=3)
                    Sort Key: app.created_at DESC NULLS LAST, app.id DESC
                    Sort Method: quicksort  Memory: 3089kB
                    Buffers: shared hit=15190 read=1224
                    Worker 0:  Sort Method: quicksort  Memory: 343kB
                    Worker 1:  Sort Method: quicksort  Memory: 318kB
                    ->  Hash Join  (cost=12.75..17421.47 rows=8333 width=133) (actual time=0.451..35.277 rows=7021.33 loops=3)
                          Hash Cond: (app.job_id = job.id)
                          Buffers: shared hit=15158 read=1224
                          ->  Parallel Seq Scan on applications app  (cost=0.00..17185.33 rows=83333 width=82) (actual time=0.018..26.527 rows=66666.67 loops=3)
                                Filter: (deleted_at IS NULL)
                                Buffers: shared hit=15128 read=1224
                          ->  Hash  (cost=12.50..12.50 rows=20 width=51) (actual time=0.421..0.421 rows=20.00 loops=3)
                                Buckets: 1024  Batches: 1  Memory Usage: 10kB
                                Buffers: shared hit=30
                                ->  Seq Scan on jobs job  (cost=0.00..12.50 rows=20 width=51) (actual time=0.341..0.406 rows=20.00 loops=3)
                                      Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                                      Rows Removed by Filter: 180
                                      Buffers: shared hit=30
        ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..0.33 rows=1 width=66) (actual time=0.005..0.005 rows=1.00 loops=20)
              Index Cond: (id = app.candidate_id)
              Filter: (deleted_at IS NULL)
              Index Searches: 20
              Buffers: shared hit=60
Planning:
  Buffers: shared hit=19
Planning Time: 0.391 ms
Execution Time: 92.279 ms
```

### Danh sách job kèm pipeline

```sql
SELECT DISTINCT "distinctAlias"."job_id" AS "ids_job_id", "distinctAlias"."job_created_at", "distinctAlias"."job_id" FROM (SELECT "job"."id" AS "job_id", "job"."updated_at" AS "job_updated_at", "job"."deleted_at" AS "job_deleted_at", "job"."created_at" AS "job_created_at", "job"."title" AS "job_title", "job"."department_id" AS "job_department_id", "job"."status" AS "job_status", "job"."location" AS "job_location", "job"."jd_text" AS "job_jd_text", "job"."jd_version" AS "job_jd_version", "job"."created_by" AS "job_created_by", "job"."published_at" AS "job_published_at", "job"."closed_at" AS "job_closed_at", "department"."id" AS "department_id", "department"."name" AS "department_name" FROM "jobs" "job" INNER JOIN "departments" "department" ON "department"."id"="job"."department_id" AND ("department"."deleted_at" IS NULL) WHERE "job"."deleted_at" IS NULL) "distinctAlias" ORDER BY "distinctAlias"."job_created_at" DESC NULLS LAST, "distinctAlias"."job_id" DESC, "job_id" ASC LIMIT 20 OFFSET 0
```

```
Limit  (cost=21.62..21.77 rows=20 width=40) (actual time=0.209..0.215 rows=20.00 loops=1)
  Buffers: shared hit=11
  ->  Unique  (cost=21.62..23.12 rows=200 width=40) (actual time=0.207..0.211 rows=20.00 loops=1)
        Buffers: shared hit=11
        ->  Sort  (cost=21.62..22.12 rows=200 width=40) (actual time=0.207..0.207 rows=20.00 loops=1)
              Sort Key: job.created_at DESC NULLS LAST, job.id DESC
              Sort Method: quicksort  Memory: 35kB
              Buffers: shared hit=11
              ->  Hash Join  (cost=1.23..13.97 rows=200 width=40) (actual time=0.094..0.160 rows=200.00 loops=1)
                    Hash Cond: (job.department_id = department.id)
                    Buffers: shared hit=11
                    ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=40) (actual time=0.041..0.072 rows=200.00 loops=1)
                          Filter: (deleted_at IS NULL)
                          Buffers: shared hit=10
                    ->  Hash  (cost=1.10..1.10 rows=10 width=16) (actual time=0.042..0.042 rows=10.00 loops=1)
                          Buckets: 1024  Batches: 1  Memory Usage: 9kB
                          Buffers: shared hit=1
                          ->  Seq Scan on departments department  (cost=0.00..1.10 rows=10 width=16) (actual time=0.014..0.018 rows=10.00 loops=1)
                                Filter: (deleted_at IS NULL)
                                Buffers: shared hit=1
Planning:
  Buffers: shared hit=4
Planning Time: 0.261 ms
Execution Time: 0.471 ms
```

### Xếp hạng job đông hồ sơ nhất

```sql
SELECT "job"."id" AS "job_id", "job"."updated_at" AS "job_updated_at", "job"."deleted_at" AS "job_deleted_at", "job"."created_at" AS "job_created_at", "job"."title" AS "job_title", "job"."department_id" AS "job_department_id", "job"."status" AS "job_status", "job"."location" AS "job_location", "job"."jd_text" AS "job_jd_text", "job"."jd_version" AS "job_jd_version", "job"."created_by" AS "job_created_by", "job"."published_at" AS "job_published_at", "job"."closed_at" AS "job_closed_at", "department"."id" AS "department_id", "department"."name" AS "department_name" FROM "jobs" "job" INNER JOIN "departments" "department" ON "department"."id"="job"."department_id" AND ("department"."deleted_at" IS NULL) WHERE ( "job"."id" = $1 ) AND ( "job"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=0.14..9.39 rows=1 width=387) (actual time=0.024..0.025 rows=1.00 loops=1)
  Join Filter: (job.department_id = department.id)
  Rows Removed by Join Filter: 3
  Buffers: shared hit=3
  ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..8.16 rows=1 width=358) (actual time=0.008..0.009 rows=1.00 loops=1)
        Index Cond: (id = 'd748691f-65b5-4d7b-a1db-325f47069f8d'::uuid)
        Filter: (deleted_at IS NULL)
        Index Searches: 1
        Buffers: shared hit=2
  ->  Seq Scan on departments department  (cost=0.00..1.10 rows=10 width=29) (actual time=0.013..0.013 rows=4.00 loops=1)
        Filter: (deleted_at IS NULL)
        Buffers: shared hit=1
Planning:
  Buffers: shared hit=4
Planning Time: 0.334 ms
Execution Time: 0.065 ms
```

### Chi tiết hồ sơ

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."source" AS "app_source", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."ai_error" AS "app_ai_error", "app"."score" AS "app_score", "app"."score_breakdown" AS "app_score_breakdown", "app"."flags" AS "app_flags", "app"."scored_jd_version" AS "app_scored_jd_version", "job"."id" AS "job_id", "job"."title" AS "job_title", "job"."department_id" AS "job_department_id", "job"."jd_version" AS "job_jd_version", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "cvFile"."id" AS "cvFile_id", "cvFile"."original_name" AS "cvFile_original_name", "cvFile"."text" AS "cvFile_text" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL)  LEFT JOIN "cv_files" "cvFile" ON "cvFile"."id"="app"."cv_file_id" AND ("cvFile"."deleted_at" IS NULL) WHERE ( "app"."id" = $1 ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop Left Join  (cost=1.15..33.30 rows=1 width=1375) (actual time=0.011..0.012 rows=1.00 loops=1)
  Buffers: shared hit=12
  ->  Nested Loop  (cost=0.85..24.99 rows=1 width=764) (actual time=0.009..0.010 rows=1.00 loops=1)
        Buffers: shared hit=9
        ->  Nested Loop  (cost=0.56..16.68 rows=1 width=703) (actual time=0.007..0.007 rows=1.00 loops=1)
              Buffers: shared hit=6
              ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..8.44 rows=1 width=632) (actual time=0.003..0.004 rows=1.00 loops=1)
                    Index Cond: (id = '0000a052-1c96-4527-9b88-c1e941c31ece'::uuid)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 1
                    Buffers: shared hit=4
              ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..8.16 rows=1 width=71) (actual time=0.002..0.002 rows=1.00 loops=1)
                    Index Cond: (id = app.job_id)
                    Filter: (deleted_at IS NULL)
                    Index Searches: 1
                    Buffers: shared hit=2
        ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=77) (actual time=0.002..0.002 rows=1.00 loops=1)
              Index Cond: (id = app.candidate_id)
              Filter: (deleted_at IS NULL)
              Index Searches: 1
              Buffers: shared hit=3
  ->  Index Scan using "PK_89bdf76e79a74acd27e46e1be82" on cv_files "cvFile"  (cost=0.29..8.31 rows=1 width=627) (actual time=0.002..0.002 rows=1.00 loops=1)
        Index Cond: (id = app.cv_file_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 1
        Buffers: shared hit=3
Planning:
  Buffers: shared hit=34
Planning Time: 0.429 ms
Execution Time: 0.034 ms
```

### Kho ứng viên – trang đầu

```sql
SELECT "candidate"."id" AS "candidate_id", "candidate"."updated_at" AS "candidate_updated_at", "candidate"."deleted_at" AS "candidate_deleted_at", "candidate"."created_at" AS "candidate_created_at", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "candidate"."consent_at" AS "candidate_consent_at", "candidate"."consent_version" AS "candidate_consent_version", "candidate"."anonymized_at" AS "candidate_anonymized_at", "candidate"."anonymized_by" AS "candidate_anonymized_by" FROM "candidates" "candidate" WHERE "candidate"."deleted_at" IS NULL ORDER BY "candidate"."created_at" DESC, "candidate"."id" DESC LIMIT 21
```

```
Limit  (cost=2760.08..2760.13 rows=21 width=136) (actual time=7.586..7.588 rows=21.00 loops=1)
  Buffers: shared hit=912
  ->  Sort  (cost=2760.08..2885.08 rows=50000 width=136) (actual time=7.585..7.586 rows=21.00 loops=1)
        Sort Key: created_at DESC, id DESC
        Sort Method: top-N heapsort  Memory: 33kB
        Buffers: shared hit=912
        ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=136) (actual time=0.010..4.156 rows=50000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=912
Planning Time: 0.138 ms
Execution Time: 7.607 ms
```

### Kho ứng viên – tìm không dấu

```sql
SELECT "candidate"."id" AS "candidate_id", "candidate"."updated_at" AS "candidate_updated_at", "candidate"."deleted_at" AS "candidate_deleted_at", "candidate"."created_at" AS "candidate_created_at", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "candidate"."consent_at" AS "candidate_consent_at", "candidate"."consent_version" AS "candidate_consent_version", "candidate"."anonymized_at" AS "candidate_anonymized_at", "candidate"."anonymized_by" AS "candidate_anonymized_by" FROM "candidates" "candidate" WHERE ( (f_unaccent(lower("candidate"."full_name")) LIKE '%' || f_unaccent(lower($1)) || '%' OR "candidate"."email" LIKE '%' || lower($1) || '%') ) AND ( "candidate"."deleted_at" IS NULL ) ORDER BY "candidate"."created_at" DESC, "candidate"."id" DESC LIMIT 21
```

```
Limit  (cost=14287.17..14287.19 rows=10 width=136) (actual time=101.972..101.977 rows=19.00 loops=1)
  Buffers: shared hit=912
  ->  Sort  (cost=14287.17..14287.19 rows=10 width=136) (actual time=101.971..101.974 rows=19.00 loops=1)
        Sort Key: created_at DESC, id DESC
        Sort Method: quicksort  Memory: 29kB
        Buffers: shared hit=912
        ->  Seq Scan on candidates candidate  (cost=0.00..14287.00 rows=10 width=136) (actual time=2.677..101.936 rows=19.00 loops=1)
              Filter: ((deleted_at IS NULL) AND ((f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text) OR ((email)::text ~~ '%binh doan%'::text)))
              Rows Removed by Filter: 49981
              Buffers: shared hit=912
Planning Time: 0.182 ms
Execution Time: 102.001 ms
```

### Kho ứng viên – Hiring Manager

```sql
SELECT "candidate"."id" AS "candidate_id", "candidate"."updated_at" AS "candidate_updated_at", "candidate"."deleted_at" AS "candidate_deleted_at", "candidate"."created_at" AS "candidate_created_at", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "candidate"."consent_at" AS "candidate_consent_at", "candidate"."consent_version" AS "candidate_consent_version", "candidate"."anonymized_at" AS "candidate_anonymized_at", "candidate"."anonymized_by" AS "candidate_anonymized_by" FROM "candidates" "candidate" WHERE ( EXISTS (SELECT 1 FROM "applications" "scope_app" INNER JOIN "jobs" "scope_job" ON "scope_job"."id" = "scope_app"."job_id" WHERE "scope_app"."candidate_id" = "candidate"."id" AND "scope_app"."deleted_at" IS NULL AND "scope_job"."deleted_at" IS NULL AND "scope_job"."department_id" = $1) ) AND ( "candidate"."deleted_at" IS NULL ) ORDER BY "candidate"."created_at" DESC, "candidate"."id" DESC LIMIT 21
```

```
Limit  (cost=21413.80..21413.85 rows=21 width=136) (actual time=26.037..26.042 rows=21.00 loops=1)
  Buffers: shared hit=8412
  ->  Sort  (cost=21413.80..21463.78 rows=19992 width=136) (actual time=26.035..26.039 rows=21.00 loops=1)
        Sort Key: candidate.created_at DESC, candidate.id DESC
        Sort Method: top-N heapsort  Memory: 32kB
        Buffers: shared hit=8412
        ->  Hash Semi Join  (cost=19109.12..20874.78 rows=19992 width=136) (actual time=10.303..22.878 rows=18082.00 loops=1)
              Hash Cond: (candidate.id = scope_app.candidate_id)
              Buffers: shared hit=8412
              ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=136) (actual time=0.008..4.498 rows=50000.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=912
              ->  Hash  (cost=18859.12..18859.12 rows=20000 width=16) (actual time=10.232..10.233 rows=21064.00 loops=1)
                    Buckets: 32768  Batches: 1  Memory Usage: 1244kB
                    Buffers: shared hit=7500
                    ->  Nested Loop  (cost=0.42..18859.12 rows=20000 width=16) (actual time=0.028..7.276 rows=21064.00 loops=1)
                          Buffers: shared hit=7500
                          ->  Seq Scan on jobs scope_job  (cost=0.00..12.50 rows=20 width=16) (actual time=0.005..0.035 rows=20.00 loops=1)
                                Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                                Rows Removed by Filter: 180
                                Buffers: shared hit=10
                          ->  Index Only Scan using "UQ_applications_job_id_candidate_id" on applications scope_app  (cost=0.42..931.80 rows=1053 width=32) (actual time=0.007..0.307 rows=1053.20 loops=20)
                                Index Cond: (job_id = scope_job.id)
                                Heap Fetches: 7277
                                Index Searches: 20
                                Buffers: shared hit=7490
Planning:
  Buffers: shared hit=34
Planning Time: 0.306 ms
Execution Time: 26.212 ms
```

### Dashboard – Admin

```sql
SELECT "job"."id" AS "jobId", "job"."title" AS "title", "job"."status" AS "status", COUNT("app"."id")::int AS "total", COUNT("app"."id") FILTER (WHERE "app"."ai_status" = 'PROCESSING')::int AS "processing", COALESCE(SUM("app"."score"), 0)::int AS "scoreSum", COUNT("app"."score")::int AS "scored", json_build_object('NEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'NEW'), 'SCREENING', COUNT("app"."id") FILTER (WHERE "app"."status" = 'SCREENING'), 'INTERVIEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'INTERVIEW'), 'OFFER', COUNT("app"."id") FILTER (WHERE "app"."status" = 'OFFER'), 'HIRED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'HIRED'), 'REJECTED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'REJECTED'), 'WITHDRAWN', COUNT("app"."id") FILTER (WHERE "app"."status" = 'WITHDRAWN')) AS "byStatus" FROM "jobs" "job" LEFT JOIN "applications" "app" ON  "app"."job_id" = "job"."id" AND "app"."deleted_at" IS NULL WHERE "job"."deleted_at" IS NULL GROUP BY "job"."id"
```

```
HashAggregate  (cost=28902.62..28907.12 rows=200 width=103) (actual time=165.137..165.722 rows=200.00 loops=1)
  Group Key: job.id
  Batches: 1  Memory Usage: 96kB
  Buffers: shared hit=16362
  ->  Hash Right Join  (cost=14.50..18902.62 rows=200000 width=81) (actual time=0.097..111.664 rows=200010.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=16362
        ->  Seq Scan on applications app  (cost=0.00..18352.00 rows=200000 width=42) (actual time=0.011..56.180 rows=200000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=16352
        ->  Hash  (cost=12.00..12.00 rows=200 width=55) (actual time=0.082..0.082 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 26kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=55) (actual time=0.016..0.056 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=10
Planning:
  Buffers: shared hit=4
Planning Time: 0.293 ms
Execution Time: 165.791 ms
```

### Dashboard – Hiring Manager

```sql
SELECT "job"."id" AS "jobId", "job"."title" AS "title", "job"."status" AS "status", COUNT("app"."id")::int AS "total", COUNT("app"."id") FILTER (WHERE "app"."ai_status" = 'PROCESSING')::int AS "processing", COALESCE(SUM("app"."score"), 0)::int AS "scoreSum", COUNT("app"."score")::int AS "scored", json_build_object('NEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'NEW'), 'SCREENING', COUNT("app"."id") FILTER (WHERE "app"."status" = 'SCREENING'), 'INTERVIEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'INTERVIEW'), 'OFFER', COUNT("app"."id") FILTER (WHERE "app"."status" = 'OFFER'), 'HIRED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'HIRED'), 'REJECTED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'REJECTED'), 'WITHDRAWN', COUNT("app"."id") FILTER (WHERE "app"."status" = 'WITHDRAWN')) AS "byStatus" FROM "jobs" "job" LEFT JOIN "applications" "app" ON  "app"."job_id" = "job"."id" AND "app"."deleted_at" IS NULL WHERE ( "job"."department_id" = $1 ) AND ( "job"."deleted_at" IS NULL ) GROUP BY "job"."id"
```

```
HashAggregate  (cost=19900.88..19901.33 rows=20 width=103) (actual time=75.948..75.986 rows=20.00 loops=1)
  Group Key: job.id
  Batches: 1  Memory Usage: 32kB
  Buffers: shared hit=16362
  ->  Hash Right Join  (cost=12.75..18900.88 rows=20000 width=81) (actual time=0.100..69.529 rows=21064.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=16362
        ->  Seq Scan on applications app  (cost=0.00..18352.00 rows=200000 width=42) (actual time=0.012..47.491 rows=200000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=16352
        ->  Hash  (cost=12.50..12.50 rows=20 width=55) (actual time=0.082..0.083 rows=20.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 10kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.50 rows=20 width=55) (actual time=0.017..0.069 rows=20.00 loops=1)
                    Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                    Rows Removed by Filter: 180
                    Buffers: shared hit=10
Planning:
  Buffers: shared hit=4
Planning Time: 0.412 ms
Execution Time: 76.049 ms
```
