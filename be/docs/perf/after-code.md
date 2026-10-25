# Kết quả đo: after-code

- Thời điểm: 2026-10-22T12:25:56.455Z
- Máy: 11th Gen Intel(R) Core(TM) i7-11850H @ 2.50GHz · 16 luồng · RAM 16 GB · Node v22.22.0
- DB: ncc_intern_perf; 50 request mỗi kịch bản, 5 request đồng thời, 10 request làm nóng
- Từ khoá tìm: "binh doan"

## Endpoint

| Kịch bản | Query/request | p50 (ms) | p95 (ms) | max (ms) | Query chính (EXPLAIN ANALYZE) |
|---|---|---|---|---|---|
| Bảng hồ sơ – mặc định (mới nhất) | 4 (limit 100: 4) | 123.2 | 360.4 | 377.8 | 0.254 ms · Bitmap Heap Scan applications, Seq Scan jobs |
| Bảng hồ sơ – sắp theo điểm | 4 | 130.3 | 204.7 | 236.7 | 0.177 ms · Bitmap Heap Scan applications, Seq Scan jobs |
| Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm | 4 | 19 | 23.1 | 24.5 | 0.163 ms · Bitmap Heap Scan applications, Seq Scan jobs |
| Bảng hồ sơ – lọc cờ thiếu MUST | 4 | 143.8 | 215.9 | 253.7 | 0.276 ms · Bitmap Heap Scan applications, Seq Scan jobs |
| Bảng hồ sơ – tìm tên không dấu | 4 | 200.1 | 215.8 | 220 | 0.159 ms · Bitmap Heap Scan applications, Seq Scan jobs |
| Bảng hồ sơ – trang sâu (OFFSET 150.000) | 4 | 228.2 | 268.9 | 298.2 | 0.202 ms · Bitmap Heap Scan applications, Seq Scan jobs |
| Bảng hồ sơ – Hiring Manager (scope phòng) | 4 (limit 100: 4) | 136.2 | 231.7 | 252.5 | 0.299 ms · Bitmap Heap Scan applications, Seq Scan jobs |
| Danh sách job kèm pipeline | 4 (limit 100: 4) | 118.7 | 182.1 | 284.4 | 0.181 ms · Seq Scan jobs, Seq Scan departments |
| Xếp hạng job đông hồ sơ nhất | 4 | 121.6 | 161.8 | 163.1 | 0.036 ms · Seq Scan departments |
| Chi tiết hồ sơ | 3 | 11.6 | 14.3 | 14.8 | 0.044 ms ·  |
| Kho ứng viên – trang đầu | 3 (limit 100: 3) | 15.8 | 19.2 | 19.6 | 6.24 ms · Seq Scan candidates |
| Kho ứng viên – tìm không dấu | 3 | 135 | 187.8 | 196.5 | 81.487 ms · Seq Scan candidates |
| Kho ứng viên – Hiring Manager | 3 | 31.4 | 41.4 | 45.5 | 20.152 ms · Seq Scan candidates, Seq Scan jobs |
| Dashboard – Admin | 2 | 164.4 | 208.4 | 212.9 | 120.439 ms · Seq Scan applications, Seq Scan jobs |
| Dashboard – Hiring Manager | 2 | 65.3 | 82.4 | 84.6 | 47.393 ms · Seq Scan applications, Seq Scan jobs |

## Mô phỏng trước/sau (chạy thẳng trên DB, 30 lần)

| Bài toán | Cách làm | Số query | p50 (ms) | p95 (ms) |
|---|---|---|---|---|
| List hồ sơ 20 dòng | N+1: lấy ứng viên, job từng dòng | 41 | 76.7 | 84.6 |
| List hồ sơ 20 dòng | JOIN, chỉ chọn cột cần | 1 | 118 | 138.3 |
| Job kèm pipeline 20 job | Đếm từng job, từng nhóm | 80 | 72.7 | 132.5 |
| Job kèm pipeline 20 job | Một câu GROUP BY + COUNT FILTER | 1 | 60.4 | 171.2 |
| Dashboard | Nhiều query rời (tổng, từng trạng thái, từng job) | 210 | 1064.7 | 1346 |
| Dashboard | Một query tổng hợp theo job | 1 | 100.7 | 131.9 |
| Trang thứ 7.501 (20 dòng) | OFFSET 150.000 | 1 | 104.1 | 126.6 |
| Trang thứ 7.501 (20 dòng) | Cursor (created_at, id) | 1 | 60.5 | 165.9 |

## Kế hoạch thực thi

### Bảng hồ sơ – mặc định (mới nhất)

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=103.40..347.51 rows=20 width=183) (actual time=0.138..0.216 rows=20.00 loops=1)
  Buffers: shared hit=150
  ->  Hash Join  (cost=103.11..181.36 rows=20 width=133) (actual time=0.129..0.156 rows=20.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=90
        ->  Bitmap Heap Scan on applications app  (cost=88.61..166.81 rows=20 width=82) (actual time=0.056..0.075 rows=20.00 loops=1)
              Recheck Cond: (id = ANY ('{64068cf8-3656-482f-8625-6caa780853ad,a40c9cd0-ef19-42b1-8ee8-3309f9d1eb7a,a93273f9-bb8e-456a-8e05-d1a244906bc5,f3d26f44-183d-4c88-bd2d-898470ec0d9f,9c596e53-92ad-4154-8652-df8c13591006,114bd256-ded6-4783-adc5-40f336323ce9,3ce992ce-8ab7-44c5-aa99-558f39512612,87fa4eee-095a-4908-878d-2555244e1d5e,0cc0ae0f-50bf-406e-b428-7844200bb7fe,45e4ff6b-ade0-4378-b551-39eb262c3d52,588504a1-e564-4e07-a94f-326b081ff9f5,2440f0f9-4cff-40e7-a1a6-3c8bae74a048,73ad4543-98e7-4d14-9e02-8df936fc8dbc,0f0307c4-0c39-4e37-8fdd-3a4e1829860c,9e6e5ade-33c8-409d-84ae-3279ebe92d69,d07c27d5-5bd6-4a53-a6d1-32a9287fdca7,35e93a64-b961-4522-bf62-4ccfb1360134,0fda221b-4612-4afb-8601-c97b7e8dbda2,572555b5-a6d5-4c1f-aa0d-83d662325071,210a5e2f-dcdf-442f-8414-4d5e0931fc63}'::uuid[]))
              Filter: (deleted_at IS NULL)
              Heap Blocks: exact=20
              Buffers: shared hit=80
              ->  Bitmap Index Scan on "PK_938c0a27255637bde919591888f"  (cost=0.00..88.55 rows=20 width=0) (actual time=0.049..0.049 rows=20.00 loops=1)
                    Index Cond: (id = ANY ('{64068cf8-3656-482f-8625-6caa780853ad,a40c9cd0-ef19-42b1-8ee8-3309f9d1eb7a,a93273f9-bb8e-456a-8e05-d1a244906bc5,f3d26f44-183d-4c88-bd2d-898470ec0d9f,9c596e53-92ad-4154-8652-df8c13591006,114bd256-ded6-4783-adc5-40f336323ce9,3ce992ce-8ab7-44c5-aa99-558f39512612,87fa4eee-095a-4908-878d-2555244e1d5e,0cc0ae0f-50bf-406e-b428-7844200bb7fe,45e4ff6b-ade0-4378-b551-39eb262c3d52,588504a1-e564-4e07-a94f-326b081ff9f5,2440f0f9-4cff-40e7-a1a6-3c8bae74a048,73ad4543-98e7-4d14-9e02-8df936fc8dbc,0f0307c4-0c39-4e37-8fdd-3a4e1829860c,9e6e5ade-33c8-409d-84ae-3279ebe92d69,d07c27d5-5bd6-4a53-a6d1-32a9287fdca7,35e93a64-b961-4522-bf62-4ccfb1360134,0fda221b-4612-4afb-8601-c97b7e8dbda2,572555b5-a6d5-4c1f-aa0d-83d662325071,210a5e2f-dcdf-442f-8414-4d5e0931fc63}'::uuid[]))
                    Index Searches: 20
                    Buffers: shared hit=60
        ->  Hash  (cost=12.00..12.00 rows=200 width=51) (actual time=0.067..0.067 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 25kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=51) (actual time=0.008..0.035 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=10
  ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=66) (actual time=0.003..0.003 rows=1.00 loops=20)
        Index Cond: (id = app.candidate_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 20
        Buffers: shared hit=60
Planning:
  Buffers: shared hit=19
Planning Time: 0.542 ms
Execution Time: 0.254 ms
```

### Bảng hồ sơ – sắp theo điểm

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=103.40..347.51 rows=20 width=183) (actual time=0.092..0.155 rows=20.00 loops=1)
  Buffers: shared hit=96
  ->  Hash Join  (cost=103.11..181.36 rows=20 width=133) (actual time=0.086..0.108 rows=20.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=36
        ->  Bitmap Heap Scan on applications app  (cost=88.61..166.81 rows=20 width=82) (actual time=0.023..0.039 rows=20.00 loops=1)
              Recheck Cond: (id = ANY ('{fffdc5b2-ca47-44b3-b7f3-0ca2196d8e12,fffc7ca1-226a-491c-98e4-477614a22ebe,fffc38b0-8943-4048-9c86-d5cdabb41989,fffaed98-e6a5-440f-a0e7-1c0d884ac64a,fffa3dfd-af8c-4455-a6a5-380b2845bac4,fff90af3-a80d-49b6-9bd1-48987f2c049d,fff77173-825f-4c92-92a6-a0bdb0c42a04,fff6d666-91c1-46b4-933e-cc03e4fc1708,fff546b2-dd33-455b-a4bd-e9fd94d937c5,fff24c10-4d61-48b1-8fdd-3873466f5b9f,fff12a27-480c-445d-8b4d-f2981a52aa5e,ffec7841-51c8-4c16-ae9c-e3804ebdb5ae,ffeafe12-78df-4bdf-a43f-8952f2c075dd,ffea0881-26bd-4b37-bd79-e9bfaf112123,ffe8c97a-e409-4d6a-b461-de845512fdea,ffe8a2a8-a014-4cbd-9ac3-2ced09bb6c9d,ffe8352f-6497-45c5-9dfb-bf2c01366abc,ffdd317e-fb71-44a7-8eb5-34b40d721763,ffdbeece-a4bc-4fb1-b56f-f86003f8fb30,ffd9b299-fd47-4302-8db4-50f35c7260b5}'::uuid[]))
              Filter: (deleted_at IS NULL)
              Heap Blocks: exact=20
              Buffers: shared hit=26
              ->  Bitmap Index Scan on "PK_938c0a27255637bde919591888f"  (cost=0.00..88.55 rows=20 width=0) (actual time=0.016..0.016 rows=20.00 loops=1)
                    Index Cond: (id = ANY ('{fffdc5b2-ca47-44b3-b7f3-0ca2196d8e12,fffc7ca1-226a-491c-98e4-477614a22ebe,fffc38b0-8943-4048-9c86-d5cdabb41989,fffaed98-e6a5-440f-a0e7-1c0d884ac64a,fffa3dfd-af8c-4455-a6a5-380b2845bac4,fff90af3-a80d-49b6-9bd1-48987f2c049d,fff77173-825f-4c92-92a6-a0bdb0c42a04,fff6d666-91c1-46b4-933e-cc03e4fc1708,fff546b2-dd33-455b-a4bd-e9fd94d937c5,fff24c10-4d61-48b1-8fdd-3873466f5b9f,fff12a27-480c-445d-8b4d-f2981a52aa5e,ffec7841-51c8-4c16-ae9c-e3804ebdb5ae,ffeafe12-78df-4bdf-a43f-8952f2c075dd,ffea0881-26bd-4b37-bd79-e9bfaf112123,ffe8c97a-e409-4d6a-b461-de845512fdea,ffe8a2a8-a014-4cbd-9ac3-2ced09bb6c9d,ffe8352f-6497-45c5-9dfb-bf2c01366abc,ffdd317e-fb71-44a7-8eb5-34b40d721763,ffdbeece-a4bc-4fb1-b56f-f86003f8fb30,ffd9b299-fd47-4302-8db4-50f35c7260b5}'::uuid[]))
                    Index Searches: 2
                    Buffers: shared hit=6
        ->  Hash  (cost=12.00..12.00 rows=200 width=51) (actual time=0.058..0.058 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 25kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=51) (actual time=0.008..0.032 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=10
  ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=66) (actual time=0.002..0.002 rows=1.00 loops=20)
        Index Cond: (id = app.candidate_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 20
        Buffers: shared hit=60
Planning:
  Buffers: shared hit=19
Planning Time: 0.417 ms
Execution Time: 0.177 ms
```

### Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=103.40..347.51 rows=20 width=183) (actual time=0.099..0.141 rows=20.00 loops=1)
  Buffers: shared hit=150
  ->  Hash Join  (cost=103.11..181.36 rows=20 width=133) (actual time=0.094..0.108 rows=20.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=90
        ->  Bitmap Heap Scan on applications app  (cost=88.61..166.81 rows=20 width=82) (actual time=0.039..0.047 rows=20.00 loops=1)
              Recheck Cond: (id = ANY ('{f95fdb28-5c5b-4091-91da-c2cb6f86a406,ee680341-e4a4-42a1-b12a-2edfa3163466,e78f60ef-cb34-4ee2-9681-708c80e9f5b8,e64bdd44-a0b2-452e-963f-443d8b9bf3f9,e14ca354-8b31-453d-9ed0-8be737575f71,dd870b51-ab15-4908-bddc-bacf1b7f99f6,d7db15a9-f063-4664-b3b2-105f13e4a62e,ccde6f6b-74d2-4e95-8abf-941b037bb68f,ba4714ce-6910-4320-856c-60f32dcfd0f0,b99fc71d-d97d-41ee-bcba-c5b70b7a39f8,acd428fb-0389-4f83-b5bf-1c6d76d35f61,a8adc0bf-c3f1-4be9-b2ab-57a5f8dc801b,a138caaa-b36e-4d41-b92f-100a4c278b1a,8b57cf15-321c-4823-85d2-81de9f1ee47f,87dbd39d-5279-4d75-bd98-c1d345e75bc6,807ab025-332c-4974-a84f-638196611ff3,7eae2fb5-cd7f-4bc6-9b56-0fcc830d4550,74b5f5b6-9e90-4423-84bb-1b1bd257e807,6da5394d-f44e-4473-9971-f377bd0c1d0e,699f33e8-8be8-4f0b-810b-d67ca42a5837}'::uuid[]))
              Filter: (deleted_at IS NULL)
              Heap Blocks: exact=20
              Buffers: shared hit=80
              ->  Bitmap Index Scan on "PK_938c0a27255637bde919591888f"  (cost=0.00..88.55 rows=20 width=0) (actual time=0.033..0.033 rows=20.00 loops=1)
                    Index Cond: (id = ANY ('{f95fdb28-5c5b-4091-91da-c2cb6f86a406,ee680341-e4a4-42a1-b12a-2edfa3163466,e78f60ef-cb34-4ee2-9681-708c80e9f5b8,e64bdd44-a0b2-452e-963f-443d8b9bf3f9,e14ca354-8b31-453d-9ed0-8be737575f71,dd870b51-ab15-4908-bddc-bacf1b7f99f6,d7db15a9-f063-4664-b3b2-105f13e4a62e,ccde6f6b-74d2-4e95-8abf-941b037bb68f,ba4714ce-6910-4320-856c-60f32dcfd0f0,b99fc71d-d97d-41ee-bcba-c5b70b7a39f8,acd428fb-0389-4f83-b5bf-1c6d76d35f61,a8adc0bf-c3f1-4be9-b2ab-57a5f8dc801b,a138caaa-b36e-4d41-b92f-100a4c278b1a,8b57cf15-321c-4823-85d2-81de9f1ee47f,87dbd39d-5279-4d75-bd98-c1d345e75bc6,807ab025-332c-4974-a84f-638196611ff3,7eae2fb5-cd7f-4bc6-9b56-0fcc830d4550,74b5f5b6-9e90-4423-84bb-1b1bd257e807,6da5394d-f44e-4473-9971-f377bd0c1d0e,699f33e8-8be8-4f0b-810b-d67ca42a5837}'::uuid[]))
                    Index Searches: 20
                    Buffers: shared hit=60
        ->  Hash  (cost=12.00..12.00 rows=200 width=51) (actual time=0.050..0.050 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 25kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=51) (actual time=0.006..0.028 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=10
  ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=66) (actual time=0.001..0.001 rows=1.00 loops=20)
        Index Cond: (id = app.candidate_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 20
        Buffers: shared hit=60
Planning:
  Buffers: shared hit=19
Planning Time: 0.347 ms
Execution Time: 0.163 ms
```

### Bảng hồ sơ – lọc cờ thiếu MUST

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=103.40..347.51 rows=20 width=183) (actual time=0.155..0.237 rows=20.00 loops=1)
  Buffers: shared hit=150
  ->  Hash Join  (cost=103.11..181.36 rows=20 width=133) (actual time=0.145..0.172 rows=20.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=90
        ->  Bitmap Heap Scan on applications app  (cost=88.61..166.81 rows=20 width=82) (actual time=0.065..0.082 rows=20.00 loops=1)
              Recheck Cond: (id = ANY ('{a40c9cd0-ef19-42b1-8ee8-3309f9d1eb7a,9c596e53-92ad-4154-8652-df8c13591006,45e4ff6b-ade0-4378-b551-39eb262c3d52,588504a1-e564-4e07-a94f-326b081ff9f5,73ad4543-98e7-4d14-9e02-8df936fc8dbc,0f0307c4-0c39-4e37-8fdd-3a4e1829860c,e82253a5-397e-407e-a26f-66a999d4aac7,55fb8731-bd05-4219-9773-d6bf1904ffe4,6f4e3649-a09f-4543-95aa-cccc34e8522d,40dac274-78ad-4b94-b533-4ae23509b240,994d3639-f256-4186-aebe-1713d93c2331,8b76d220-0c6b-4424-afbe-589da5e7f953,cbeb2025-0cab-4157-a9cf-1a24cf853ced,e5fc066d-fafa-4301-8baf-4d8ec9c1f1be,e01a43cc-7cc8-4954-8675-cd32f46e7589,1aa419de-b50a-4cbe-a3f9-c36cbefe6675,7a326e09-f0d5-49a4-8026-32ffe3a88af1,b0d7c1d4-101a-43d9-a740-9195b4fdb415,128ed71c-e738-4c64-a161-8112e8135145,aaab614f-550b-4cf5-876e-80e526c16e96}'::uuid[]))
              Filter: (deleted_at IS NULL)
              Heap Blocks: exact=20
              Buffers: shared hit=80
              ->  Bitmap Index Scan on "PK_938c0a27255637bde919591888f"  (cost=0.00..88.55 rows=20 width=0) (actual time=0.056..0.056 rows=20.00 loops=1)
                    Index Cond: (id = ANY ('{a40c9cd0-ef19-42b1-8ee8-3309f9d1eb7a,9c596e53-92ad-4154-8652-df8c13591006,45e4ff6b-ade0-4378-b551-39eb262c3d52,588504a1-e564-4e07-a94f-326b081ff9f5,73ad4543-98e7-4d14-9e02-8df936fc8dbc,0f0307c4-0c39-4e37-8fdd-3a4e1829860c,e82253a5-397e-407e-a26f-66a999d4aac7,55fb8731-bd05-4219-9773-d6bf1904ffe4,6f4e3649-a09f-4543-95aa-cccc34e8522d,40dac274-78ad-4b94-b533-4ae23509b240,994d3639-f256-4186-aebe-1713d93c2331,8b76d220-0c6b-4424-afbe-589da5e7f953,cbeb2025-0cab-4157-a9cf-1a24cf853ced,e5fc066d-fafa-4301-8baf-4d8ec9c1f1be,e01a43cc-7cc8-4954-8675-cd32f46e7589,1aa419de-b50a-4cbe-a3f9-c36cbefe6675,7a326e09-f0d5-49a4-8026-32ffe3a88af1,b0d7c1d4-101a-43d9-a740-9195b4fdb415,128ed71c-e738-4c64-a161-8112e8135145,aaab614f-550b-4cf5-876e-80e526c16e96}'::uuid[]))
                    Index Searches: 20
                    Buffers: shared hit=60
        ->  Hash  (cost=12.00..12.00 rows=200 width=51) (actual time=0.074..0.074 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 25kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=51) (actual time=0.009..0.040 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=10
  ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=66) (actual time=0.003..0.003 rows=1.00 loops=20)
        Index Cond: (id = app.candidate_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 20
        Buffers: shared hit=60
Planning:
  Buffers: shared hit=19
Planning Time: 0.383 ms
Execution Time: 0.276 ms
```

### Bảng hồ sơ – tìm tên không dấu

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=103.40..347.51 rows=20 width=183) (actual time=0.099..0.137 rows=20.00 loops=1)
  Buffers: shared hit=146
  ->  Hash Join  (cost=103.11..181.36 rows=20 width=133) (actual time=0.095..0.107 rows=20.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=86
        ->  Bitmap Heap Scan on applications app  (cost=88.61..166.81 rows=20 width=82) (actual time=0.042..0.050 rows=20.00 loops=1)
              Recheck Cond: (id = ANY ('{47fa2c04-4b3f-4ed7-aeea-aca0cc8ee846,4a73a307-6b9f-49be-895a-8956c02b6bb6,cd9b3075-dfb9-4912-ab4d-dc767cbb2941,1b4a5ce4-62fd-4584-9c7a-8e45cac287c4,f9f3615c-894b-4b61-972d-a7dd7f543f42,2ec2b1f7-69a9-415c-97c6-2bc9e699663a,7e20c46b-e85a-4f7f-8ee9-afb758dfe88e,629a4118-d301-4221-980c-ab1f49aa1086,6d7155e9-563f-46d5-960f-ae9f826c6fc2,02437bee-fd28-4e71-a987-ec12385d807d,7ec5ff30-7770-4d86-b359-a5b2cbb4069d,7016739c-8d6f-4cc9-98ce-930ce897e4f2,ca4737ee-5584-4af7-a25d-8e20b4567533,26184b48-719f-4c77-afec-2b9e574caa91,81e93c52-7110-4884-a99f-e1ad405331a1,cce2bff5-7bea-409c-b6eb-d17a0b15716d,a9e24c58-12af-40d2-ba18-7113a041944a,845d0a01-e5f9-4177-b721-db596b93a7bb,ac368661-0995-4843-8407-4f5aa73b1e0f,0000a052-1c96-4527-9b88-c1e941c31ece}'::uuid[]))
              Filter: (deleted_at IS NULL)
              Heap Blocks: exact=16
              Buffers: shared hit=76
              ->  Bitmap Index Scan on "PK_938c0a27255637bde919591888f"  (cost=0.00..88.55 rows=20 width=0) (actual time=0.036..0.036 rows=20.00 loops=1)
                    Index Cond: (id = ANY ('{47fa2c04-4b3f-4ed7-aeea-aca0cc8ee846,4a73a307-6b9f-49be-895a-8956c02b6bb6,cd9b3075-dfb9-4912-ab4d-dc767cbb2941,1b4a5ce4-62fd-4584-9c7a-8e45cac287c4,f9f3615c-894b-4b61-972d-a7dd7f543f42,2ec2b1f7-69a9-415c-97c6-2bc9e699663a,7e20c46b-e85a-4f7f-8ee9-afb758dfe88e,629a4118-d301-4221-980c-ab1f49aa1086,6d7155e9-563f-46d5-960f-ae9f826c6fc2,02437bee-fd28-4e71-a987-ec12385d807d,7ec5ff30-7770-4d86-b359-a5b2cbb4069d,7016739c-8d6f-4cc9-98ce-930ce897e4f2,ca4737ee-5584-4af7-a25d-8e20b4567533,26184b48-719f-4c77-afec-2b9e574caa91,81e93c52-7110-4884-a99f-e1ad405331a1,cce2bff5-7bea-409c-b6eb-d17a0b15716d,a9e24c58-12af-40d2-ba18-7113a041944a,845d0a01-e5f9-4177-b721-db596b93a7bb,ac368661-0995-4843-8407-4f5aa73b1e0f,0000a052-1c96-4527-9b88-c1e941c31ece}'::uuid[]))
                    Index Searches: 20
                    Buffers: shared hit=60
        ->  Hash  (cost=12.00..12.00 rows=200 width=51) (actual time=0.049..0.049 rows=200.00 loops=1)
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
  Buffers: shared hit=19
Planning Time: 0.254 ms
Execution Time: 0.159 ms
```

### Bảng hồ sơ – trang sâu (OFFSET 150.000)

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "app"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=103.40..347.51 rows=20 width=183) (actual time=0.118..0.180 rows=20.00 loops=1)
  Buffers: shared hit=147
  ->  Hash Join  (cost=103.11..181.36 rows=20 width=133) (actual time=0.111..0.130 rows=20.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=87
        ->  Bitmap Heap Scan on applications app  (cost=88.61..166.81 rows=20 width=82) (actual time=0.050..0.064 rows=20.00 loops=1)
              Recheck Cond: (id = ANY ('{e8f60c19-8de8-43a6-bbb2-ad90fdc1ffa4,89628ea4-3b46-40f3-8e22-bff033d3306c,b679c580-c607-4445-9cb1-919e6e37deea,6ccf7003-a5f8-4695-a60d-d9e746ae2409,eb02a5e7-e63a-4a94-a673-241c070dd3d7,38cfb106-fe9b-43ca-8d88-268d915b68ad,695e03c5-4ad3-41ac-a667-ad512f9c8dba,b1113d19-ce87-4290-94b5-3b9833422295,2b1f254d-d3e1-4fd5-b6af-38948ac0b8e7,96e5cd26-9260-4e23-a358-3e972a890248,777438f7-b76e-4aed-b69d-529c85165bcb,9b5e5011-6f47-410c-b989-5284e3945377,b39c54fe-47e9-4518-bb12-1e1d8dedb7d4,69700e0f-6054-41c1-8a03-bc1695863b14,642f7fe4-3f3f-4b44-9487-9365533dba4b,7c26ec90-bd19-44f0-adc1-f33cb1f65d0a,26724fb2-7cf9-42c2-9f10-24949d909bed,a9d20339-9e95-4829-80af-4a70ae650b6c,590acdb3-d356-4e32-a40e-a5088811241c,b1ddb8c6-3a5b-48a5-972b-49c73e58dfe2}'::uuid[]))
              Filter: (deleted_at IS NULL)
              Heap Blocks: exact=20
              Buffers: shared hit=77
              ->  Bitmap Index Scan on "PK_938c0a27255637bde919591888f"  (cost=0.00..88.55 rows=20 width=0) (actual time=0.044..0.044 rows=20.00 loops=1)
                    Index Cond: (id = ANY ('{e8f60c19-8de8-43a6-bbb2-ad90fdc1ffa4,89628ea4-3b46-40f3-8e22-bff033d3306c,b679c580-c607-4445-9cb1-919e6e37deea,6ccf7003-a5f8-4695-a60d-d9e746ae2409,eb02a5e7-e63a-4a94-a673-241c070dd3d7,38cfb106-fe9b-43ca-8d88-268d915b68ad,695e03c5-4ad3-41ac-a667-ad512f9c8dba,b1113d19-ce87-4290-94b5-3b9833422295,2b1f254d-d3e1-4fd5-b6af-38948ac0b8e7,96e5cd26-9260-4e23-a358-3e972a890248,777438f7-b76e-4aed-b69d-529c85165bcb,9b5e5011-6f47-410c-b989-5284e3945377,b39c54fe-47e9-4518-bb12-1e1d8dedb7d4,69700e0f-6054-41c1-8a03-bc1695863b14,642f7fe4-3f3f-4b44-9487-9365533dba4b,7c26ec90-bd19-44f0-adc1-f33cb1f65d0a,26724fb2-7cf9-42c2-9f10-24949d909bed,a9d20339-9e95-4829-80af-4a70ae650b6c,590acdb3-d356-4e32-a40e-a5088811241c,b1ddb8c6-3a5b-48a5-972b-49c73e58dfe2}'::uuid[]))
                    Index Searches: 19
                    Buffers: shared hit=57
        ->  Hash  (cost=12.00..12.00 rows=200 width=51) (actual time=0.056..0.056 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 25kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=51) (actual time=0.007..0.032 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=10
  ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=66) (actual time=0.002..0.002 rows=1.00 loops=20)
        Index Cond: (id = app.candidate_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 20
        Buffers: shared hit=60
Planning:
  Buffers: shared hit=19
Planning Time: 0.308 ms
Execution Time: 0.202 ms
```

### Bảng hồ sơ – Hiring Manager (scope phòng)

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."score" AS "app_score", "app"."flags" AS "app_flags", "job"."id" AS "job_id", "job"."title" AS "job_title", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL) WHERE ( "job"."department_id" = $1 AND "app"."id" IN ($2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=101.65..196.22 rows=2 width=183) (actual time=0.163..0.262 rows=20.00 loops=1)
  Buffers: shared hit=150
  ->  Hash Join  (cost=101.36..179.61 rows=2 width=133) (actual time=0.153..0.187 rows=20.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=90
        ->  Bitmap Heap Scan on applications app  (cost=88.61..166.81 rows=20 width=82) (actual time=0.095..0.120 rows=20.00 loops=1)
              Recheck Cond: (id = ANY ('{210a5e2f-dcdf-442f-8414-4d5e0931fc63,5771dea1-02cd-46c0-8100-37c20e37c58f,1e4a5796-ccb1-4d11-85bb-5edb5f290ccd,8b76d220-0c6b-4424-afbe-589da5e7f953,b8e9f28d-5ced-4ed1-a1a7-8a7c96f403f6,b0d7c1d4-101a-43d9-a740-9195b4fdb415,838c01d2-29c9-47e8-8599-992548ef2f45,e4bb65b5-915d-4e8b-b5ca-d967ee8226ca,8121a26b-f4f2-46d7-9b7e-0ccce7f53929,8e43612b-8052-438a-9f63-404a925b3975,549f3b60-e3d3-45fb-873d-adc0a187c6d6,016ea632-c9e4-4afa-bd10-3998d7d89d99,04a11099-c35f-4bd5-856b-0997752266d3,4a4f17d3-43c6-4d58-a648-7d4ce6354a1d,26a85e96-afe9-4a15-b43f-7343c321c020,ee327884-dc24-4817-a28f-aa905ae01ab7,a883bfb9-a77c-4657-892f-2bf27d5bfd46,cbc9eb33-e5ec-49d6-8fa3-731622aaaa19,06deffa7-22e2-47f3-86c3-bd2c352ff3b7,70162a26-4ab2-4f41-a727-c447893985c3}'::uuid[]))
              Filter: (deleted_at IS NULL)
              Heap Blocks: exact=20
              Buffers: shared hit=80
              ->  Bitmap Index Scan on "PK_938c0a27255637bde919591888f"  (cost=0.00..88.55 rows=20 width=0) (actual time=0.085..0.085 rows=20.00 loops=1)
                    Index Cond: (id = ANY ('{210a5e2f-dcdf-442f-8414-4d5e0931fc63,5771dea1-02cd-46c0-8100-37c20e37c58f,1e4a5796-ccb1-4d11-85bb-5edb5f290ccd,8b76d220-0c6b-4424-afbe-589da5e7f953,b8e9f28d-5ced-4ed1-a1a7-8a7c96f403f6,b0d7c1d4-101a-43d9-a740-9195b4fdb415,838c01d2-29c9-47e8-8599-992548ef2f45,e4bb65b5-915d-4e8b-b5ca-d967ee8226ca,8121a26b-f4f2-46d7-9b7e-0ccce7f53929,8e43612b-8052-438a-9f63-404a925b3975,549f3b60-e3d3-45fb-873d-adc0a187c6d6,016ea632-c9e4-4afa-bd10-3998d7d89d99,04a11099-c35f-4bd5-856b-0997752266d3,4a4f17d3-43c6-4d58-a648-7d4ce6354a1d,26a85e96-afe9-4a15-b43f-7343c321c020,ee327884-dc24-4817-a28f-aa905ae01ab7,a883bfb9-a77c-4657-892f-2bf27d5bfd46,cbc9eb33-e5ec-49d6-8fa3-731622aaaa19,06deffa7-22e2-47f3-86c3-bd2c352ff3b7,70162a26-4ab2-4f41-a727-c447893985c3}'::uuid[]))
                    Index Searches: 20
                    Buffers: shared hit=60
        ->  Hash  (cost=12.50..12.50 rows=20 width=51) (actual time=0.050..0.050 rows=20.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 10kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.50 rows=20 width=51) (actual time=0.012..0.042 rows=20.00 loops=1)
                    Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                    Rows Removed by Filter: 180
                    Buffers: shared hit=10
  ->  Index Scan using "PK_140681296bf033ab1eb95288abb" on candidates candidate  (cost=0.29..8.31 rows=1 width=66) (actual time=0.003..0.003 rows=1.00 loops=20)
        Index Cond: (id = app.candidate_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 20
        Buffers: shared hit=60
Planning:
  Buffers: shared hit=19
Planning Time: 0.435 ms
Execution Time: 0.299 ms
```

### Danh sách job kèm pipeline

```sql
SELECT "job"."id" AS "job_id", "job"."updated_at" AS "job_updated_at", "job"."deleted_at" AS "job_deleted_at", "job"."created_at" AS "job_created_at", "job"."title" AS "job_title", "job"."department_id" AS "job_department_id", "job"."status" AS "job_status", "job"."location" AS "job_location", "job"."jd_text" AS "job_jd_text", "job"."jd_version" AS "job_jd_version", "job"."created_by" AS "job_created_by", "job"."published_at" AS "job_published_at", "job"."closed_at" AS "job_closed_at", "department"."id" AS "department_id", "department"."name" AS "department_name" FROM "jobs" "job" INNER JOIN "departments" "department" ON "department"."id"="job"."department_id" AND ("department"."deleted_at" IS NULL) WHERE "job"."deleted_at" IS NULL ORDER BY "job"."created_at" DESC NULLS LAST, "job"."id" DESC LIMIT 20 OFFSET 0
```

```
Limit  (cost=19.29..19.34 rows=20 width=387) (actual time=0.155..0.158 rows=20.00 loops=1)
  Buffers: shared hit=11
  ->  Sort  (cost=19.29..19.79 rows=200 width=387) (actual time=0.154..0.156 rows=20.00 loops=1)
        Sort Key: job.created_at DESC NULLS LAST, job.id DESC
        Sort Method: top-N heapsort  Memory: 43kB
        Buffers: shared hit=11
        ->  Hash Join  (cost=1.23..13.97 rows=200 width=387) (actual time=0.019..0.094 rows=200.00 loops=1)
              Hash Cond: (job.department_id = department.id)
              Buffers: shared hit=11
              ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=358) (actual time=0.008..0.032 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=10
              ->  Hash  (cost=1.10..1.10 rows=10 width=29) (actual time=0.007..0.007 rows=10.00 loops=1)
                    Buckets: 1024  Batches: 1  Memory Usage: 9kB
                    Buffers: shared hit=1
                    ->  Seq Scan on departments department  (cost=0.00..1.10 rows=10 width=29) (actual time=0.003..0.005 rows=10.00 loops=1)
                          Filter: (deleted_at IS NULL)
                          Buffers: shared hit=1
Planning:
  Buffers: shared hit=4
Planning Time: 0.193 ms
Execution Time: 0.181 ms
```

### Xếp hạng job đông hồ sơ nhất

```sql
SELECT "job"."id" AS "job_id", "job"."updated_at" AS "job_updated_at", "job"."deleted_at" AS "job_deleted_at", "job"."created_at" AS "job_created_at", "job"."title" AS "job_title", "job"."department_id" AS "job_department_id", "job"."status" AS "job_status", "job"."location" AS "job_location", "job"."jd_text" AS "job_jd_text", "job"."jd_version" AS "job_jd_version", "job"."created_by" AS "job_created_by", "job"."published_at" AS "job_published_at", "job"."closed_at" AS "job_closed_at", "department"."id" AS "department_id", "department"."name" AS "department_name" FROM "jobs" "job" INNER JOIN "departments" "department" ON "department"."id"="job"."department_id" AND ("department"."deleted_at" IS NULL) WHERE ( "job"."id" = $1 ) AND ( "job"."deleted_at" IS NULL )
```

```
Nested Loop  (cost=0.14..9.39 rows=1 width=387) (actual time=0.018..0.018 rows=1.00 loops=1)
  Join Filter: (job.department_id = department.id)
  Rows Removed by Join Filter: 3
  Buffers: shared hit=3
  ->  Index Scan using "PK_cf0a6c42b72fcc7f7c237def345" on jobs job  (cost=0.14..8.16 rows=1 width=358) (actual time=0.008..0.008 rows=1.00 loops=1)
        Index Cond: (id = 'd748691f-65b5-4d7b-a1db-325f47069f8d'::uuid)
        Filter: (deleted_at IS NULL)
        Index Searches: 1
        Buffers: shared hit=2
  ->  Seq Scan on departments department  (cost=0.00..1.10 rows=10 width=29) (actual time=0.007..0.008 rows=4.00 loops=1)
        Filter: (deleted_at IS NULL)
        Buffers: shared hit=1
Planning:
  Buffers: shared hit=4
Planning Time: 0.181 ms
Execution Time: 0.036 ms
```

### Chi tiết hồ sơ

```sql
SELECT "app"."id" AS "app_id", "app"."created_at" AS "app_created_at", "app"."job_id" AS "app_job_id", "app"."source" AS "app_source", "app"."status" AS "app_status", "app"."ai_status" AS "app_ai_status", "app"."ai_error" AS "app_ai_error", "app"."score" AS "app_score", "app"."score_breakdown" AS "app_score_breakdown", "app"."flags" AS "app_flags", "app"."scored_jd_version" AS "app_scored_jd_version", "job"."id" AS "job_id", "job"."title" AS "job_title", "job"."department_id" AS "job_department_id", "job"."jd_version" AS "job_jd_version", "candidate"."id" AS "candidate_id", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "cvFile"."id" AS "cvFile_id", "cvFile"."original_name" AS "cvFile_original_name", "cvFile"."text" AS "cvFile_text" FROM "applications" "app" INNER JOIN "jobs" "job" ON "job"."id"="app"."job_id" AND ("job"."deleted_at" IS NULL)  INNER JOIN "candidates" "candidate" ON "candidate"."id"="app"."candidate_id" AND ("candidate"."deleted_at" IS NULL)  LEFT JOIN "cv_files" "cvFile" ON "cvFile"."id"="app"."cv_file_id" AND ("cvFile"."deleted_at" IS NULL) WHERE ( "app"."id" = $1 ) AND ( "app"."deleted_at" IS NULL )
```

```
Nested Loop Left Join  (cost=1.15..33.30 rows=1 width=1375) (actual time=0.019..0.020 rows=1.00 loops=1)
  Buffers: shared hit=12
  ->  Nested Loop  (cost=0.85..24.99 rows=1 width=764) (actual time=0.014..0.015 rows=1.00 loops=1)
        Buffers: shared hit=9
        ->  Nested Loop  (cost=0.56..16.68 rows=1 width=703) (actual time=0.010..0.011 rows=1.00 loops=1)
              Buffers: shared hit=6
              ->  Index Scan using "PK_938c0a27255637bde919591888f" on applications app  (cost=0.42..8.44 rows=1 width=632) (actual time=0.006..0.006 rows=1.00 loops=1)
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
  ->  Index Scan using "PK_89bdf76e79a74acd27e46e1be82" on cv_files "cvFile"  (cost=0.29..8.31 rows=1 width=627) (actual time=0.005..0.005 rows=1.00 loops=1)
        Index Cond: (id = app.cv_file_id)
        Filter: (deleted_at IS NULL)
        Index Searches: 1
        Buffers: shared hit=3
Planning:
  Buffers: shared hit=34
Planning Time: 0.341 ms
Execution Time: 0.044 ms
```

### Kho ứng viên – trang đầu

```sql
SELECT "candidate"."id" AS "candidate_id", "candidate"."updated_at" AS "candidate_updated_at", "candidate"."deleted_at" AS "candidate_deleted_at", "candidate"."created_at" AS "candidate_created_at", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "candidate"."consent_at" AS "candidate_consent_at", "candidate"."consent_version" AS "candidate_consent_version", "candidate"."anonymized_at" AS "candidate_anonymized_at", "candidate"."anonymized_by" AS "candidate_anonymized_by" FROM "candidates" "candidate" WHERE "candidate"."deleted_at" IS NULL ORDER BY "candidate"."created_at" DESC, "candidate"."id" DESC LIMIT 21
```

```
Limit  (cost=2760.08..2760.13 rows=21 width=136) (actual time=6.227..6.230 rows=21.00 loops=1)
  Buffers: shared hit=912
  ->  Sort  (cost=2760.08..2885.08 rows=50000 width=136) (actual time=6.227..6.228 rows=21.00 loops=1)
        Sort Key: created_at DESC, id DESC
        Sort Method: top-N heapsort  Memory: 33kB
        Buffers: shared hit=912
        ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=136) (actual time=0.005..3.181 rows=50000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=912
Planning Time: 0.048 ms
Execution Time: 6.240 ms
```

### Kho ứng viên – tìm không dấu

```sql
SELECT "candidate"."id" AS "candidate_id", "candidate"."updated_at" AS "candidate_updated_at", "candidate"."deleted_at" AS "candidate_deleted_at", "candidate"."created_at" AS "candidate_created_at", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "candidate"."consent_at" AS "candidate_consent_at", "candidate"."consent_version" AS "candidate_consent_version", "candidate"."anonymized_at" AS "candidate_anonymized_at", "candidate"."anonymized_by" AS "candidate_anonymized_by" FROM "candidates" "candidate" WHERE ( (f_unaccent(lower("candidate"."full_name")) LIKE '%' || f_unaccent(lower($1)) || '%' OR "candidate"."email" LIKE '%' || lower($1) || '%') ) AND ( "candidate"."deleted_at" IS NULL ) ORDER BY "candidate"."created_at" DESC, "candidate"."id" DESC LIMIT 21
```

```
Limit  (cost=14287.17..14287.19 rows=10 width=136) (actual time=81.470..81.473 rows=19.00 loops=1)
  Buffers: shared hit=912
  ->  Sort  (cost=14287.17..14287.19 rows=10 width=136) (actual time=81.469..81.471 rows=19.00 loops=1)
        Sort Key: created_at DESC, id DESC
        Sort Method: quicksort  Memory: 29kB
        Buffers: shared hit=912
        ->  Seq Scan on candidates candidate  (cost=0.00..14287.00 rows=10 width=136) (actual time=2.308..81.458 rows=19.00 loops=1)
              Filter: ((deleted_at IS NULL) AND ((f_unaccent(lower((full_name)::text)) ~~ '%binh doan%'::text) OR ((email)::text ~~ '%binh doan%'::text)))
              Rows Removed by Filter: 49981
              Buffers: shared hit=912
Planning Time: 0.147 ms
Execution Time: 81.487 ms
```

### Kho ứng viên – Hiring Manager

```sql
SELECT "candidate"."id" AS "candidate_id", "candidate"."updated_at" AS "candidate_updated_at", "candidate"."deleted_at" AS "candidate_deleted_at", "candidate"."created_at" AS "candidate_created_at", "candidate"."full_name" AS "candidate_full_name", "candidate"."email" AS "candidate_email", "candidate"."phone" AS "candidate_phone", "candidate"."consent_at" AS "candidate_consent_at", "candidate"."consent_version" AS "candidate_consent_version", "candidate"."anonymized_at" AS "candidate_anonymized_at", "candidate"."anonymized_by" AS "candidate_anonymized_by" FROM "candidates" "candidate" WHERE ( EXISTS (SELECT 1 FROM "applications" "scope_app" INNER JOIN "jobs" "scope_job" ON "scope_job"."id" = "scope_app"."job_id" WHERE "scope_app"."candidate_id" = "candidate"."id" AND "scope_app"."deleted_at" IS NULL AND "scope_job"."deleted_at" IS NULL AND "scope_job"."department_id" = $1) ) AND ( "candidate"."deleted_at" IS NULL ) ORDER BY "candidate"."created_at" DESC, "candidate"."id" DESC LIMIT 21
```

```
Limit  (cost=21413.80..21413.85 rows=21 width=136) (actual time=19.998..20.002 rows=21.00 loops=1)
  Buffers: shared hit=8412
  ->  Sort  (cost=21413.80..21463.78 rows=19992 width=136) (actual time=19.998..20.000 rows=21.00 loops=1)
        Sort Key: candidate.created_at DESC, candidate.id DESC
        Sort Method: top-N heapsort  Memory: 32kB
        Buffers: shared hit=8412
        ->  Hash Semi Join  (cost=19109.12..20874.78 rows=19992 width=136) (actual time=8.544..17.621 rows=18082.00 loops=1)
              Hash Cond: (candidate.id = scope_app.candidate_id)
              Buffers: shared hit=8412
              ->  Seq Scan on candidates candidate  (cost=0.00..1412.00 rows=50000 width=136) (actual time=0.006..3.429 rows=50000.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=912
              ->  Hash  (cost=18859.12..18859.12 rows=20000 width=16) (actual time=8.475..8.476 rows=21064.00 loops=1)
                    Buckets: 32768  Batches: 1  Memory Usage: 1244kB
                    Buffers: shared hit=7500
                    ->  Nested Loop  (cost=0.42..18859.12 rows=20000 width=16) (actual time=0.017..6.384 rows=21064.00 loops=1)
                          Buffers: shared hit=7500
                          ->  Seq Scan on jobs scope_job  (cost=0.00..12.50 rows=20 width=16) (actual time=0.003..0.024 rows=20.00 loops=1)
                                Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                                Rows Removed by Filter: 180
                                Buffers: shared hit=10
                          ->  Index Only Scan using "UQ_applications_job_id_candidate_id" on applications scope_app  (cost=0.42..931.80 rows=1053 width=32) (actual time=0.006..0.267 rows=1053.20 loops=20)
                                Index Cond: (job_id = scope_job.id)
                                Heap Fetches: 7277
                                Index Searches: 20
                                Buffers: shared hit=7490
Planning:
  Buffers: shared hit=34
Planning Time: 0.259 ms
Execution Time: 20.152 ms
```

### Dashboard – Admin

```sql
SELECT "job"."id" AS "jobId", "job"."title" AS "title", "job"."status" AS "status", COUNT("app"."id")::int AS "total", COUNT("app"."id") FILTER (WHERE "app"."ai_status" = 'PROCESSING')::int AS "processing", COALESCE(SUM("app"."score"), 0)::int AS "scoreSum", COUNT("app"."score")::int AS "scored", json_build_object('NEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'NEW'), 'SCREENING', COUNT("app"."id") FILTER (WHERE "app"."status" = 'SCREENING'), 'INTERVIEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'INTERVIEW'), 'OFFER', COUNT("app"."id") FILTER (WHERE "app"."status" = 'OFFER'), 'HIRED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'HIRED'), 'REJECTED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'REJECTED'), 'WITHDRAWN', COUNT("app"."id") FILTER (WHERE "app"."status" = 'WITHDRAWN')) AS "byStatus" FROM "jobs" "job" LEFT JOIN "applications" "app" ON  "app"."job_id" = "job"."id" AND "app"."deleted_at" IS NULL WHERE "job"."deleted_at" IS NULL GROUP BY "job"."id"
```

```
HashAggregate  (cost=28902.62..28907.12 rows=200 width=103) (actual time=120.065..120.381 rows=200.00 loops=1)
  Group Key: job.id
  Batches: 1  Memory Usage: 96kB
  Buffers: shared hit=16362
  ->  Hash Right Join  (cost=14.50..18902.62 rows=200000 width=81) (actual time=0.100..75.896 rows=200010.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=16362
        ->  Seq Scan on applications app  (cost=0.00..18352.00 rows=200000 width=42) (actual time=0.011..34.664 rows=200000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=16352
        ->  Hash  (cost=12.00..12.00 rows=200 width=55) (actual time=0.084..0.085 rows=200.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 26kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.00 rows=200 width=55) (actual time=0.011..0.051 rows=200.00 loops=1)
                    Filter: (deleted_at IS NULL)
                    Buffers: shared hit=10
Planning:
  Buffers: shared hit=4
Planning Time: 0.264 ms
Execution Time: 120.439 ms
```

### Dashboard – Hiring Manager

```sql
SELECT "job"."id" AS "jobId", "job"."title" AS "title", "job"."status" AS "status", COUNT("app"."id")::int AS "total", COUNT("app"."id") FILTER (WHERE "app"."ai_status" = 'PROCESSING')::int AS "processing", COALESCE(SUM("app"."score"), 0)::int AS "scoreSum", COUNT("app"."score")::int AS "scored", json_build_object('NEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'NEW'), 'SCREENING', COUNT("app"."id") FILTER (WHERE "app"."status" = 'SCREENING'), 'INTERVIEW', COUNT("app"."id") FILTER (WHERE "app"."status" = 'INTERVIEW'), 'OFFER', COUNT("app"."id") FILTER (WHERE "app"."status" = 'OFFER'), 'HIRED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'HIRED'), 'REJECTED', COUNT("app"."id") FILTER (WHERE "app"."status" = 'REJECTED'), 'WITHDRAWN', COUNT("app"."id") FILTER (WHERE "app"."status" = 'WITHDRAWN')) AS "byStatus" FROM "jobs" "job" LEFT JOIN "applications" "app" ON  "app"."job_id" = "job"."id" AND "app"."deleted_at" IS NULL WHERE ( "job"."department_id" = $1 ) AND ( "job"."deleted_at" IS NULL ) GROUP BY "job"."id"
```

```
HashAggregate  (cost=19900.88..19901.33 rows=20 width=103) (actual time=47.315..47.352 rows=20.00 loops=1)
  Group Key: job.id
  Batches: 1  Memory Usage: 32kB
  Buffers: shared hit=16362
  ->  Hash Right Join  (cost=12.75..18900.88 rows=20000 width=81) (actual time=0.047..43.070 rows=21064.00 loops=1)
        Hash Cond: (app.job_id = job.id)
        Buffers: shared hit=16362
        ->  Seq Scan on applications app  (cost=0.00..18352.00 rows=200000 width=42) (actual time=0.005..29.208 rows=200000.00 loops=1)
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=16352
        ->  Hash  (cost=12.50..12.50 rows=20 width=55) (actual time=0.036..0.036 rows=20.00 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 10kB
              Buffers: shared hit=10
              ->  Seq Scan on jobs job  (cost=0.00..12.50 rows=20 width=55) (actual time=0.009..0.032 rows=20.00 loops=1)
                    Filter: ((deleted_at IS NULL) AND (department_id = '5fb9220d-9b0f-4d32-a248-6492457c3890'::uuid))
                    Rows Removed by Filter: 180
                    Buffers: shared hit=10
Planning:
  Buffers: shared hit=4
Planning Time: 0.251 ms
Execution Time: 47.393 ms
```
