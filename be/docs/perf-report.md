# Báo cáo tối ưu query – HireFlow (MVP 1, tuần 2)

Tài liệu này là phần "case study N+1 + index + perf-report" ở Kickoff mục 14 và mốc M2 (mục 20.1). Số liệu thô của từng lần đo nằm trong `docs/perf/`, gồm bảng tổng hợp, kế hoạch thực thi (EXPLAIN ANALYZE) của mọi kịch bản và file JSON.

## 1. Điều kiện đo

| Hạng mục | Giá trị |
|---|---|
| Máy | Intel Core i7-11850H (16 luồng), RAM 16 GB, Windows 11, Node 22.22 |
| DB | PostgreSQL 18.4 cài trên máy, database `ncc_intern_perf` |
| Dữ liệu | `npm run seed:perf`: 10 phòng ban, 30 user, 200 job, 50.000 ứng viên, **200.000 hồ sơ**, khoảng 600.000 dòng lịch sử |
| Cách đo | `npm run perf -- <nhãn>`: dựng app NestJS thật trong process, gọi HTTP, 10 request làm nóng, 50 request mỗi kịch bản, 5 request đồng thời |
| Đếm query | `QueryCounter` thay logger của TypeORM, đếm mọi câu SQL của một request (gồm cả câu kiểm tra user của JWT) |
| Mục tiêu | p95 < 300 ms với 200k hồ sơ; số query mỗi request không đổi khi số dòng tăng (Kickoff mục 6, US-06) |

Ba mốc đo:
- **Trước** (`docs/perf/before.md`): code tuần 1, chưa có index hiệu năng.
- **Sau sửa code** (`docs/perf/after-code.md`): đã đổi cách viết query, chưa thêm index.
- **Sau index** (`docs/perf/after.md`): thêm migration `AddPerformanceIndexes1792600000009` và chạy `VACUUM (ANALYZE)`.

Lưu ý: kết quả giữa các lần chạy dao động khoảng ±15% (máy dev, nhiều tiến trình khác). Nên so sánh theo cấp độ lớn, không so từng mili giây.

## 2. Tổng hợp p95 (ms)

| Kịch bản | Trước | Sau sửa code | Sau index | Query/request |
|---|---:|---:|---:|---|
| Bảng hồ sơ – mặc định (mới nhất) | 585 | 360 | **220** | 3 → 4 (limit 20 hay 100 như nhau) |
| Bảng hồ sơ – sắp theo điểm | 675 | 205 | **205** | 3 → 4 |
| Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm | 28 | 23 | **18** | 3 → 4 |
| Bảng hồ sơ – lọc cờ thiếu MUST | 463 | 216 | **96** | 3 → 4 |
| Bảng hồ sơ – tìm tên không dấu | 390 | 216 | **34** | 3 → 4 |
| Bảng hồ sơ – trang sâu (OFFSET 150.000) | 1.051 | 269 | **192** | 3 → 4 |
| Bảng hồ sơ – Hiring Manager | 332 | 232 | **17** | 3 → 4 |
| Danh sách job kèm pipeline | 232 | 182 | **21** | 5 → 4 |
| Xếp hạng job đông hồ sơ nhất (~1.050 hồ sơ) | 279 | 162 | **158** | 4 |
| Chi tiết hồ sơ | 16 | 14 | **14** | 3 |
| Kho ứng viên – trang đầu | 28 | 19 | **15** | 3 |
| Kho ứng viên – tìm không dấu | 217 | 188 | **15** | 3 |
| Kho ứng viên – Hiring Manager | 50 | 41 | **19** | 3 |
| Dashboard – Admin | 251 | 208 | **200** | 2 |
| Dashboard – Hiring Manager | 94 | 82 | **70** | 2 |

Sau tối ưu, cả 15 kịch bản đều đạt p95 < 300 ms. Trước tối ưu có 6 kịch bản vượt mục tiêu.

Bảng hồ sơ tăng từ 3 lên 4 query nhưng vẫn là hằng số: một câu lấy id của trang, một câu đếm, một câu lấy dữ liệu đầy đủ cho các id đó, cộng câu kiểm tra user của JWT. Đổi 1 query lấy 2–30 lần nhanh hơn.

## 3. Case study

### 3.1 N+1 khi lấy danh sách hồ sơ

- **Lỗi cố ý dựng lại:** lấy 20 hồ sơ, sau đó với mỗi dòng lấy ứng viên và job bằng một query riêng, tổng cộng 1 + 20 × 2 = 41 query.
- **Cách sửa:** JOIN `candidates`, `jobs`, chỉ select cột cần hiển thị. Service thật (`ApplicationsService.listQuery`) đã viết đúng cách này từ BE-13.

| Cách làm | Số query | p50 | p95 |
|---|---:|---:|---:|
| N+1 | 41 | 6,1 ms | 8,8 ms |
| JOIN | 1 | 1,0 ms | 2,3 ms |

Khi chưa có index, hai cách gần như bằng nhau (p95 khoảng 160–175 ms), vì cả hai cùng phải quét toàn bảng để sắp xếp. N+1 chỉ lộ rõ khi phần lấy dữ liệu chính đã nhanh. Đây là lý do phải sửa cả cách viết query lẫn index.

Ở cấp HTTP, test `test/query-count.e2e-spec.ts` khẳng định số query không đổi khi tăng `limit` hoặc tăng số hồ sơ trong job.

### 3.2 Danh sách job kèm số hồ sơ theo nhóm trạng thái

| Cách làm | Số query | p50 | p95 |
|---|---:|---:|---:|
| Đếm từng job, từng nhóm (20 job × 4 nhóm) | 80 | 16,0 ms | 20,9 ms |
| Một câu `GROUP BY job_id` + `COUNT(*) FILTER (WHERE …)` | 1 | 3,1 ms | 3,9 ms |

Sau khi có index bao phủ `IDX_applications_job_id_status_score` (job_id, status, score) INCLUDE (ai_status), câu đếm chạy **Index Only Scan**, không đọc bảng. Thêm vào đó, danh sách job đổi `skip/take` thành `offset/limit` (join phòng ban chỉ là nhiều-một), bỏ được câu "lấy id distinct" TypeORM tự sinh. Kết quả: p95 của endpoint giảm từ 232 ms xuống 21 ms.

### 3.3 Bảng xếp hạng và lọc theo điểm

- **Trước:** sắp theo `score` phải quét và sắp xếp 200k dòng (Seq Scan + Sort, khoảng 143 ms cho query chính).
- **Sau:** có `IDX_applications_score_id (score DESC NULLS LAST, id DESC)` cho bảng hồ sơ và `IDX_applications_job_id_status_score` cho lọc theo job, trạng thái và xếp hạng.

Lọc job + trạng thái + sắp theo điểm: 28 ms → 18 ms. Xếp hạng job đông nhất còn khoảng 158 ms. Thời gian chủ yếu nằm ở việc trả `score_breakdown` (JSON) của khoảng 1.050 hồ sơ, không phải ở query (8 ms). Phần này có chủ đích, để FE tự tính lại điểm khi kéo trọng số (US-05).

### 3.4 Phân trang trang sâu: OFFSET 150.000 và cursor

| Cách làm | p50 | p95 |
|---|---:|---:|
| `OFFSET 150000 LIMIT 20` (đã có index) | 7,9 ms | 8,9 ms |
| Cursor `(created_at, id) < (…)` | 0,2 ms | 0,4 ms |

- **Endpoint `GET /applications`:** API Contract quy định endpoint này dùng offset (bảng quản trị có số trang). Vì vậy cách sửa ở đây là **deferred join**: tìm 20 id của trang bằng index (Index Only Scan, không đọc bảng), sau đó mới JOIN ứng viên và job cho đúng 20 id. Trước đây Postgres JOIN cho cả 150.020 dòng rồi bỏ 150.000 dòng. p95: 1.051 ms → 192 ms.
- **Kho ứng viên (cuộn vô hạn):** dùng cursor như Kickoff 9.3, nhờ `IDX_candidates_created_at_id` nên trang nào cũng nhanh như trang đầu.

### 3.5 Dashboard

| Cách làm | Số query | p50 | p95 |
|---|---:|---:|---:|
| Nhiều query rời (tổng, 7 trạng thái, từng job) | 210 | 132,8 ms | 224,6 ms |
| Một query tổng hợp theo job (`LEFT JOIN` + `COUNT FILTER` + `json_build_object`) | 1 | 102,9 ms | 142,9 ms |

`GET /dashboard/summary` dùng một query duy nhất (cộng câu kiểm tra JWT). Tổng số, số theo trạng thái và số job đang mở được cộng từ kết quả theo job trên Node, nên không cần thêm query nào. Phần còn lại (khoảng 180 ms với Admin) là quét toàn bộ 200k hồ sơ. Kickoff đã xếp cache Redis cho dashboard vào MVP 2 (mục 2.2), và đó là bước tiếp theo nếu cần nhanh hơn.

#### Cache Redis (MVP 2, 27/10/2026)

Kết quả tính được lưu trong Redis theo phạm vi: một khoá cho Admin và HR (toàn hệ thống), mỗi phòng ban một khoá cho Hiring Manager, nên không lộ số liệu giữa các phòng. TTL 60 giây. Mỗi khi hồ sơ được tạo, đổi trạng thái, chấm xong hoặc lỗi, hoặc tin tuyển dụng được tạo, sửa, đăng, đóng, xoá, hệ thống tăng số phiên bản trong khoá, nên lần đọc sau tính lại ngay, không phải chờ hết TTL. Redis lỗi thì đọc thẳng DB, không trả lỗi cho người dùng.

Đo bằng `npm run perf:cache` trên 200.000 hồ sơ, 30 lượt mỗi kịch bản (ms, gồm cả HTTP và kiểm tra JWT):

| Người dùng | Chưa có cache p50 | p95 | Trúng cache p50 | p95 |
|---|---:|---:|---:|---:|
| Admin | 230,5 | 276 | **9,6** | **11,8** |
| Hiring Manager | 101,6 | 112,5 | **8,5** | **11** |

Trong lần chạy: 60 lượt trúng cache, 62 lượt phải tính (gồm 60 lượt đo "chưa có cache" và 2 lượt khởi động), 0 lỗi Redis. Trúng cache nhanh hơn khoảng 24 lần với Admin và 12 lần với Hiring Manager.

## 4. Thay đổi trong code

| Thay đổi | File |
|---|---|
| Bảng hồ sơ: tách câu lấy id trang, câu đếm `COUNT(*)` (chạy song song), sau đó lấy dữ liệu theo id; chỉ JOIN `jobs` khi là Hiring Manager, chỉ JOIN `candidates` khi có tìm kiếm | `src/modules/applications/applications.service.ts` |
| Bỏ `NULLS LAST` khi sắp theo `created_at` (cột NOT NULL): mệnh đề này làm Postgres không dùng được index sắp xếp | như trên |
| Danh sách job, trang công khai: `skip/take` → `offset/limit` | `src/modules/jobs/jobs.service.ts` |
| Dashboard một query | `src/modules/dashboard/dashboard.service.ts` |
| Migration index đợt 2 | `src/database/migrations/1792600000009-AddPerformanceIndexes.ts` |
| Seed perf chạy `VACUUM (ANALYZE)` để Index Only Scan không phải đọc lại bảng | `src/database/seeds/seed-perf.ts` |
| Script đo và bộ đếm query | `src/database/perf/perf-run.ts`, `src/database/perf/query-counter.ts` |
| Test đếm query | `test/query-count.e2e-spec.ts` |

## 5. Index đợt 2

| Index | Kích thước (200k hồ sơ) | Phục vụ |
|---|---:|---|
| `IDX_applications_created_at_id` (created_at DESC, id DESC) | 7,9 MB | Bảng hồ sơ mặc định, trang sâu, câu đếm (Index Only Scan) |
| `IDX_applications_score_id` (score DESC NULLS LAST, id DESC) | 8,0 MB | Sắp theo điểm |
| `IDX_applications_job_id_status_score` (job_id, status, score DESC NULLS LAST) INCLUDE (ai_status) | 9,7 MB | Lọc job + trạng thái, xếp hạng, pipeline của job, scope Hiring Manager |
| `IDX_applications_flags` GIN (flags) | 0,3 MB | Lọc cờ thiếu MUST: 463 → 96 ms |
| `IDX_candidates_created_at_id` (created_at DESC, id DESC) | 2,0 MB | Cursor kho ứng viên |
| `IDX_candidates_full_name_trgm` GIN trigram trên `f_unaccent(lower(full_name))` | 1,7 MB | Tìm tên không dấu: 390 → 34 ms (hồ sơ), 217 → 15 ms (kho ứng viên) |
| `IDX_candidates_email_trgm` GIN trigram trên email | 3,3 MB | Tìm theo email |

Mọi index đều là partial `WHERE deleted_at IS NULL`, khớp với điều kiện xoá mềm mà TypeORM tự thêm vào query. Entity khai báo các index này với `synchronize: false`, để `migration:generate` không sinh lệnh xoá chúng.

## 6. Giới hạn còn lại

- `COUNT(*)` toàn bảng 200k dòng (Index Only Scan song song) vẫn mất khoảng 50 ms. Dưới tải đồng thời, câu này chiếm phần lớn p95 khoảng 200 ms của bảng hồ sơ không lọc. Nếu cần nhanh hơn: ước lượng số dòng từ thống kê của Postgres, hoặc cache số đếm (MVP 2).
- Sắp theo điểm **tăng dần** chưa có index phù hợp, vì API luôn đưa hồ sơ chưa có điểm xuống cuối. Đây là trường hợp ít dùng nên chưa thêm.
- Dashboard Admin vẫn quét toàn bảng hồ sơ ở lượt đầu sau mỗi thay đổi (khoảng 230 ms); các lượt sau trong 60 giây đọc từ cache (khoảng 10 ms).

## 7. Cách chạy lại

```bash
cd be
# DB riêng cho đo, tên phải kết thúc bằng _perf (script tự từ chối DB khác)
DB_DATABASE=ncc_intern_perf npm run migration:run
DB_DATABASE=ncc_intern_perf npm run seed:perf
npm run perf -- after                          # ghi docs/perf/after.md
PERF_REQUESTS=200 PERF_CONCURRENCY=10 npm run perf -- after-heavy
DB_DATABASE=ncc_intern_perf npm run perf:cache  # cache dashboard: chưa có cache / trúng cache
```

## 8. Gợi ý ứng viên cũ (match-job, MVP 2)

Worker `match-job` chạy một lần mỗi khi đăng tin hoặc lưu tiêu chí lúc tin đang tuyển (BR-MATCH-01). Việc chạy nền, không nằm trên đường request, nên mục tiêu là vài giây chứ không phải 300 ms.

Cách làm: một câu SQL lấy CV gần nhất (có hồ sơ trích xuất theo phiên bản prompt hiện hành) của mỗi ứng viên còn trong hạn lưu, chưa ẩn danh, chưa nộp tin này, và có ít nhất một kỹ năng chứa từ khoá của tiêu chí (`LIKE ANY` trên `f_unaccent(lower(...))`). Sau đó chấm bằng chính hàm `scoreApplication()` của pipeline, không gọi LLM hay embedding. Lọc theo từ khoá không bỏ sót ai, vì ứng viên không chứa từ khoá nào thì điểm luôn bằng 0.

Đo trên DB `ncc_intern_perf` (50.000 ứng viên, 200.000 hồ sơ, thêm 50.000 hồ sơ trích xuất giả lập, mỗi CV 4 kỹ năng ngẫu nhiên trong 12 kỹ năng), tin với 3 từ khoá `nestjs`, `postgresql`, `docker`:

| Bước | Kết quả |
|---|---|
| Truy vấn kho ứng viên (`EXPLAIN ANALYZE`) | 1,6 s; 36.429 ứng viên khớp từ khoá, lấy 5.000 người nộp gần nhất |
| Kế hoạch | Quét song song `cv_files` và `cv_profiles` (hash join), lần nộp gần nhất lấy bằng `IDX_applications_candidate_id` (49.019 lượt, mỗi lượt khoảng 0,01 ms), loại người đã nộp tin bằng `UQ_applications_job_id_candidate_id` |

Giới hạn: khi hơn 5.000 ứng viên khớp từ khoá, worker chỉ chấm 5.000 người nộp gần nhất. Với quy mô dự án (vài trăm CV thật) giới hạn này không chạm tới. Nếu cần, có thể lọc trước bằng điểm thô trong SQL thay vì theo thời gian.

Tạo hồ sơ trích xuất giả lập để đo lại (chỉ chạy trên DB `_perf`):

```sql
INSERT INTO cv_profiles (cv_file_id, data, model, prompt_version, input_tokens, output_tokens)
SELECT cf.id,
  jsonb_build_object('skills', (SELECT jsonb_agg(jsonb_build_object('name', s, 'years', (random()*6)::int, 'evidence', 'perf'))
     FROM (SELECT s FROM unnest(ARRAY['NestJS','PostgreSQL','Docker','React','Java','Python','Kafka','Redis','AWS','Golang','Vue','Spring']) s
           ORDER BY random() + (cf.id::text < s)::int * 0 LIMIT 4) x),
   'experiences', '[]'::jsonb, 'education', '[]'::jsonb, 'summary', ''),
  'perf-synthetic', 'v3', 0, 0
FROM cv_files cf WHERE cf.text IS NOT NULL
ON CONFLICT DO NOTHING;
```
