# HireFlow

**Hệ thống quản lý tuyển dụng (ATS) với AI sàng lọc CV có bằng chứng.**

HR đăng tin tuyển dụng, ứng viên nộp CV, hệ thống tự đọc CV và xếp hạng ứng viên theo mô tả công việc (JD). Mỗi điểm số đi kèm **trích dẫn nguyên văn từ CV** làm bằng chứng, và code kiểm tra trích dẫn đó có thật trong CV. HR chỉnh trọng số tiêu chí thì bảng xếp hạng đổi ngay, không tốn thêm lần gọi LLM nào.

> Dự án thực tập tại NCC (10/2026). **MVP 1 đã đủ tính năng** (53/53 feature, mốc M4 ngày 26/10/2026); MVP 2 đang làm, hạn hoàn thiện cả hai bản là **01/11/2026**. Xem [Trạng thái](#trạng-thái) và [Kịch bản demo](#kịch-bản-demo-15-phút).

---

## Mục lục

- [Vì sao có HireFlow](#vì-sao-có-hireflow)
- [Tính năng](#tính-năng)
- [Trạng thái](#trạng-thái)
- [Kiến trúc](#kiến-trúc)
- [Công nghệ](#công-nghệ)
- [Cấu trúc repo](#cấu-trúc-repo)
- [Chạy trên máy](#chạy-trên-máy)
- [Kịch bản demo (15 phút)](#kịch-bản-demo-15-phút)
- [Deploy](#deploy)
- [Kiểm thử và chất lượng code](#kiểm-thử-và-chất-lượng-code)
- [Xác thực và bảo mật](#xác-thực-và-bảo-mật)
- [API](#api)
- [Quy trình phát triển](#quy-trình-phát-triển)
- [Lộ trình](#lộ-trình)
- [Lỗi thường gặp](#lỗi-thường-gặp)

---

## Vì sao có HireFlow

HR thường nhận hàng trăm CV cho mỗi vị trí qua email, Zalo hay file rời rạc. Theo dõi trạng thái ứng viên khó, tìm lại hồ sơ cũ khó, sàng lọc thủ công tốn thời gian và thiếu nhất quán. Các công cụ "AI chấm CV" hiện có thường chỉ trả về một con số không giải thích được, nên HR không tin dùng.

HireFlow xử lý ba vấn đề của cách "gửi CV cho LLM rồi nhận điểm 0–100":

| Vấn đề của LLM chấm thẳng | Cách HireFlow giải quyết |
| --- | --- |
| **Hộp đen:** không giải thích được vì sao điểm là 78 | Điểm là tổng các tiêu chí khớp. Mỗi tiêu chí có đoạn trích nguyên văn từ CV |
| **AI bịa:** có thể nói ứng viên "có 3 năm React" dù CV không ghi | Code kiểm tra đoạn trích có tồn tại thật trong text CV. Không tìm thấy thì loại bằng chứng đó và gắn cờ |
| **Không ổn định, tốn tiền:** chấm lại ra điểm khác, đổi tiêu chí lại phải gọi LLM | LLM chỉ trích xuất dữ liệu một lần cho mỗi CV (cache theo hash file). Điểm tính bằng công thức, nên đổi trọng số thì xếp hạng lại ngay mà không tốn token |

**Nguyên tắc:** AI chỉ gợi ý, người quyết định. Hệ thống không tự loại ứng viên; ứng viên thiếu tiêu chí bắt buộc chỉ bị gắn cờ để HR lọc.

### Luồng sàng lọc

1. HR dán JD → LLM tách thành các tiêu chí (bắt buộc / cộng điểm, trọng số, số năm tối thiểu).
2. HR sửa danh sách tiêu chí rồi publish job.
3. Ứng viên nộp CV ở trang công khai.
4. Mỗi CV được LLM trích xuất **một lần** thành hồ sơ có cấu trúc (kỹ năng, kinh nghiệm, dự án, học vấn), mỗi mục kèm trích dẫn.
5. Code đối chiếu tiêu chí với hồ sơ, kiểm tra trích dẫn, rồi tính điểm:

   ```
   Điểm = 100 × Σ(trọng số × mức khớp) / Σ trọng số
   mức khớp = 1 (khớp, đủ số năm) | 0,5 (có kỹ năng, thiếu số năm) | 0 (không có)
   ```

---

## Tính năng

### MVP 1 (xong 26/10/2026)

- **Tuyển dụng:** CRUD phòng ban, job (DRAFT / OPEN / CLOSED), ứng viên, hồ sơ ứng tuyển (application).
- **Pipeline trạng thái:** `NEW → SCREENING → INTERVIEW → OFFER → HIRED`, có thể `REJECTED` (bắt buộc lý do) hoặc `WITHDRAWN`. Lịch sử ghi trong cùng transaction.
- **Nộp CV công khai:** PDF/DOCX tối đa 5MB, kiểm cả mime và magic bytes, chống nộp trùng, có ô đồng ý xử lý dữ liệu, giới hạn tần suất.
- **AI Screening có bằng chứng:** tách JD thành tiêu chí, trích xuất CV thành JSON có validate schema, điểm kèm trích dẫn, kiểm tra trích dẫn bằng code.
- **Xếp hạng lại tức thì:** kéo thanh trọng số, bảng xếp hạng cập nhật dưới 100ms trên trình duyệt.
- **Chat AI tìm ứng viên (RAG):** câu trả lời stream, mỗi ý có trích dẫn tới đoạn CV, lọc theo quyền người hỏi.
- **Phân quyền:** RBAC + phạm vi theo phòng ban (Hiring Manager chỉ thấy phòng mình), áp dụng cả cho RAG và link tải CV.
- **Tối ưu truy vấn:** danh sách 200.000 application, p95 dưới 300ms; báo cáo N+1 và index có số liệu trước/sau.
- **Giao diện responsive** từ 360px, kiểm cho 3 role ở 360/768/1280px.
- **Kho ứng viên, HR tải CV hộ, ẩn danh ứng viên** theo yêu cầu (Nghị định 13/2023).
- **Hàng đợi AI cho Admin:** xem hồ sơ chấm lỗi hoặc kẹt, chạy lại.

### MVP 2 (đến 01/11/2026)

Đã làm: **gợi ý ứng viên cũ khi đăng tin** (tối đa 10 người từ 50 điểm, mỗi tiêu chí kèm đoạn trích đã kiểm; mời vào tin bằng một thao tác, không gọi LLM) · mở lại hồ sơ đã kết thúc (về Sàng lọc CV, bắt buộc lý do) · nhập text CV thủ công cho CV ảnh scan · job định kỳ tự ẩn danh ứng viên hết hạn lưu CV và dọn refresh token hết hạn · **thông báo realtime (SSE)** khi CV chấm xong hoặc lỗi, chuông thông báo, thay việc hỏi lại mỗi 3 giây · **nhật ký kiểm toán** (xem CV, đổi trạng thái, ẩn danh, đổi quyền; chỉ ghi thêm) · cache Redis cho dashboard (230 ms → 10 ms) · bộ đánh giá chất lượng AI (10 CV × 2 JD) · prerender trang job công khai · cấu hình deploy (Vercel + Render + Neon + R2) + CI.

Còn lại: phỏng vấn và phiếu đánh giá (role Interviewer) · deploy thật · hybrid search (full-text + vector, bỏ đầu tiên nếu trễ).

### Không nằm trong phạm vi

Tự động loại ứng viên · lương, ký offer điện tử · SSO, mobile app · tích hợp job board (LinkedIn, TopCV) · OCR CV dạng ảnh scan.

---

## Trạng thái

Cập nhật 27/10/2026. Chi tiết từng feature: tài liệu "Danh mục Feature theo Actor" (thư mục `docs/`, không đưa lên git).

| Phần | Trạng thái | Minh chứng |
| --- | --- | --- |
| Auth JWT + refresh token xoay vòng, quản lý user, phòng ban, RBAC + phạm vi phòng ban (3 role) | Xong | E2E cho từng role |
| Job + tiêu chí có phiên bản, kho ứng viên, hồ sơ, pipeline trạng thái + lịch sử, ghi chú, HR tải CV hộ, ẩn danh | Xong | E2E theo mã quy tắc BR-xx |
| Upload CV lên S3 (RustFS khi dev), presigned URL, trang nộp CV công khai | Xong | E2E giả mime, quá 5MB, nộp trùng, honeypot, 429 |
| Pipeline AI qua BullMQ: đọc CV → trích xuất (LLM) + embedding → chấm điểm có bằng chứng | Xong | [be/docs/ai-eval.md](be/docs/ai-eval.md): 90/90 ô tiêu chí đúng, 100% bằng chứng hiển thị có thật |
| Bảng xếp hạng + thanh trọng số (< 100 ms với 1.107 hồ sơ) | Xong | [fe/docs/rendering.md](fe/docs/rendering.md) mục 6 (React Profiler) |
| Chat AI (RAG) stream SSE, trích dẫn, lọc theo quyền | Xong | E2E Hiring Manager không nhận đoạn CV phòng khác |
| Tối ưu query 200k hồ sơ (p95 < 300 ms, không N+1) | Xong | [be/docs/perf-report.md](be/docs/perf-report.md) |
| Hàng đợi AI cho Admin, health check DB + Redis + storage | Xong | – |
| Rate limit theo người dùng và theo tài khoản, `npm audit` trong CI, coverage service lõi | Xong | Coverage 92,6% (mục tiêu 70%) |
| Prerender trang job công khai (SSG + hydrate), tài liệu rendering | Xong | [fe/docs/rendering.md](fe/docs/rendering.md) |
| `docker compose up` chạy toàn hệ thống, kiểm giao diện 3 role × 3 độ rộng | Xong | [fe/docs/qa-responsive.md](fe/docs/qa-responsive.md) |
| Cấu hình deploy Vercel + Render + Neon + R2 | Xong phần code, chưa deploy thật | Mục [Deploy](#deploy) |
| Gợi ý ứng viên cũ khi đăng tin, mời vào tin (US-10) | Xong | E2E `be/test/matching.e2e-spec.ts`; tin nháp demo “Fullstack Developer (NestJS + React)” |
| Mở lại hồ sơ đã kết thúc, nhập text CV thủ công, tự ẩn danh khi hết hạn lưu, dọn token (D5) | Xong | E2E `be/test/data-lifecycle.e2e-spec.ts`, `ai-pipeline.e2e-spec.ts` (CV scan → nhập text → có điểm) |
| Cache dashboard, thông báo realtime (SSE), nhật ký kiểm toán (D6) | Xong | E2E `be/test/realtime-audit.e2e-spec.ts`; số đo cache ở [perf-report.md](be/docs/perf-report.md) mục 3.5 |
| MVP 2 còn lại: phỏng vấn, deploy thật | Đang làm (28–30/10) | – |

---

## Kiến trúc

```
[React + Vite] ──HTTPS──▶ [NestJS API] ──▶ [PostgreSQL 18 + pgvector]
CSR; trang job công khai             │
prerender lúc build                  ├──▶ [Redis]        BullMQ (queue), cache dashboard, pub/sub thông báo SSE
                                     ├──▶ [RustFS / S3]  file CV
                                     └──▶ [LlmProvider]  LLM + embedding (API hoặc Ollama)
                                     ▼
                              [BullMQ workers]
                  parse-cv · extract-cv · embed-cv · score
                  match-job · maintenance (02:00 ẩn danh CV hết hạn, 02:30 dọn token)
```

**Pipeline xử lý CV (event-driven):**

```
cv.uploaded ──▶ parse-cv   trích text PDF/DOCX, chia đoạn theo phần CV
                    │
          ┌─────────┴─────────┐   (song song)
          ▼                   ▼
     extract-cv           embed-cv
     LLM → hồ sơ JSON     embedding từng đoạn
          │
          ▼
        score     đối chiếu tiêu chí, kiểm tra bằng chứng, lưu điểm
```

Chấm điểm không phụ thuộc embedding, nên embedding lỗi không chặn việc chấm. Job được đưa vào queue sau khi transaction commit, có `jobId` idempotent, retry 3 lần với backoff mũ.

**Quyết định kiến trúc chính:**

| Quyết định | Lý do |
| --- | --- |
| Modular monolith, không dùng microservice | Đủ cho một người trong 2 tháng; ranh giới module vẫn rõ để tách sau |
| PostgreSQL thay vì MySQL | pgvector + JSONB + full-text trong một DB, không cần vector DB riêng |
| Việc nặng (parse, LLM, embedding) chạy qua queue | API không bị chặn, retry được |
| LLM chỉ trích xuất một lần; điểm tính bằng công thức | Điểm ổn định, rẻ, giải thích được |
| Frontend CSR bằng Vite, không dùng Next.js; prerender riêng trang job công khai | Ứng dụng chủ yếu sau đăng nhập; chỉ 2 trang công khai cần SEO, prerender lúc build rẻ hơn đổi framework ([rendering.md](fe/docs/rendering.md)) |
| Server state (TanStack Query) tách khỏi client state (Zustand) | Tránh trùng nguồn dữ liệu, dễ cache và invalidate |

---

## Công nghệ

| Lớp | Lựa chọn |
| --- | --- |
| Backend | NestJS 12 (ESM, TypeScript strict), TypeORM, class-validator, Passport JWT, Swagger |
| Database | PostgreSQL 18 + pgvector 0.8 (image `pgvector/pgvector:0.8.7-pg18-trixie`) |
| Queue / cache | Redis + BullMQ |
| Lưu trữ file | RustFS khi dev (thay MinIO đã ngừng phát hành image), S3 tương thích khi deploy (Cloudflare R2) |
| AI | Qua interface `LlmProvider`, thứ tự dự phòng cấu hình được: Gemini → Groq → Ollama (đều miễn phí); embedding Gemini hoặc Ollama bge-m3, 1024 chiều; LLM giả cho test và CI |
| Frontend | React 19, Vite 8, TypeScript 7, React Router 8, TanStack Query 5, Zustand 5, React Hook Form + Zod 4, Axios, Tailwind CSS 4 |
| Test | Vitest, Supertest, Testing Library |
| Chất lượng code | oxlint, Prettier, TypeScript strict |
| Hạ tầng | Dev: Docker Compose. Deploy: Vercel (FE), Render (API + Redis), Neon (PostgreSQL), Cloudflare R2 (file CV); CI bằng GitHub Actions |

---

## Cấu trúc repo

```
hireflow/
├── be/                     # Backend NestJS – xem be/README.md
│   ├── src/
│   │   ├── config/         # Cấu hình theo nhóm + validate biến môi trường
│   │   ├── common/         # Decorator, guard, interceptor, filter, DTO dùng chung
│   │   ├── database/       # data-source, migrations, seeds
│   │   └── modules/        # auth, users, departments, jobs, candidates, applications, files, public, ai, rag, matching, maintenance, dashboard, health
│   ├── test/               # E2E test
│   ├── docs/               # perf-report.md, ai-eval.md
│   └── docker-compose.yml  # Postgres, Redis, RustFS, API, web
├── fe/                     # Frontend React + Vite – xem fe/README.md
│   ├── docs/               # rendering.md, qa-responsive.md
│   ├── scripts/            # prerender.mjs, perf/ (đo Lighthouse, Profiler), qa/
│   └── src/
│       ├── app/            # providers, layouts
│       ├── routes/         # router, guards, paths
│       ├── features/       # mỗi nghiệp vụ một module: api, hooks, components, pages, schemas
│       ├── components/     # ui (primitive), shared (composite)
│       ├── prerender/      # render trang công khai lúc build, hydrate ở client
│       ├── lib/            # api-client, query-client, errors, profiler
│       └── stores/         # Zustand store
├── docker-compose.yml      # include be/docker-compose.yml: chạy toàn hệ thống từ gốc repo
└── render.yaml             # Blueprint deploy Render
```

Frontend chia code theo tính năng và chỉ cho import một chiều giữa các tầng: `app/routes → features → components → lib`. Feature khác chỉ được import qua `index.ts`; oxlint chặn import sâu vào bên trong feature.

---

## Chạy trên máy

### Cách 1: một lệnh, chỉ cần Docker

Chạy toàn bộ hệ thống (PostgreSQL + pgvector, Redis, RustFS, API, giao diện web), không cần cài Node:

```bash
git clone https://github.com/VuTungLam39/hireflow.git
cd hireflow
docker compose up -d --build                                    # lần đầu khoảng 1–2 phút
docker compose exec api node dist/database/seeds/seed.js        # dữ liệu demo
```

Mở http://localhost:8080 và đăng nhập bằng [tài khoản demo](#4-đăng-nhập). Container API tự chạy migration khi khởi động.

- Mặc định dùng **LLM giả** (điểm và gợi ý tiêu chí có thật nhưng do code giả lập sinh ra). Muốn dùng AI thật: tạo `be/.env` từ `be/.env.example`, điền `LLM_PROVIDERS=gemini,groq`, `GEMINI_API_KEY`, `EMBEDDING_PROVIDER=gemini` rồi `docker compose up -d api`.
- Đổi cổng bằng `WEB_PORT`, `API_HOST_PORT` (mặc định 8080 và 3000).
- Giao diện trong container là bản build chạy CSR; prerender trang công khai chỉ chạy khi build có API (xem [rendering.md](fe/docs/rendering.md)).
- Dừng: `docker compose down` (giữ dữ liệu), `docker compose down -v` (xoá cả dữ liệu).

### Cách 2: chạy để phát triển

#### Yêu cầu

- **Node.js ≥ 22**
- **Docker Desktop** cho PostgreSQL 18 + pgvector, Redis, RustFS (hoặc tự cài; PostgreSQL cần extension pgvector)
- Git

#### 1. Lấy code

```bash
git clone https://github.com/VuTungLam39/hireflow.git
cd hireflow
```

#### 2. Backend

```bash
cd be
npm ci
cp .env.example .env        # đặt DB_PORT=5433 nếu dùng infra:up; đổi JWT_ACCESS_SECRET (≥ 32 ký tự); AI thật thì điền khoá Gemini/Groq
npm run infra:up            # PostgreSQL (cổng 5433), Redis, RustFS bằng Docker
npm run migration:run       # tạo bảng
npm run seed                # dữ liệu demo: phòng ban, user 3 role, job, hồ sơ có CV thật
npm run start:dev           # http://localhost:3000
```

Tạo JWT secret ngẫu nhiên:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

#### 3. Frontend

Mở terminal khác:

```bash
cd fe
npm ci
cp .env.example .env
npm run dev                 # http://localhost:5173
```

Khi chạy dev, mọi request tới `/api/...` được Vite chuyển tiếp sang backend, nên không phải cấu hình CORS và cookie đăng nhập hoạt động như cùng một trang.

#### 4. Đăng nhập

Mở http://localhost:5173 (cách 2) hoặc http://localhost:8080 (cách 1). Mọi tài khoản seed có mật khẩu `Admin@123` (đổi bằng `SEED_ADMIN_PASSWORD`):

| Role | Email | Thấy gì |
| --- | --- | --- |
| Admin | `admin@example.com` | Toàn hệ thống, quản lý user, phòng ban, hàng đợi AI |
| HR | `hr@hireflow.dev` | Mọi job, hồ sơ, ứng viên; đổi trạng thái, chấm lại |
| Hiring Manager | `hm.eng@hireflow.dev` | Chỉ phòng "Phát triển phần mềm"; duyệt hoặc từ chối ở bước OFFER |

**Không dùng các tài khoản này ở môi trường thật.**

#### Địa chỉ hữu ích

| Địa chỉ | Nội dung |
| --- | --- |
| http://localhost:5173 | Giao diện web (cách 2) |
| http://localhost:8080 | Giao diện web (cách 1, Nginx chuyển `/api` sang API) |
| http://localhost:3000/api/v1 | REST API |
| http://localhost:3000/api/docs | Swagger (tắt ở production) |
| http://localhost:3000/api/health | Health check: DB, Redis, kho file |

---

## Kịch bản demo (15 phút)

Theo Kickoff 22.2. Chuẩn bị: hệ thống chạy với AI thật (Gemini) để bước 1 và 6 có kết quả có nghĩa; mở sẵn 2 cửa sổ trình duyệt (một cửa sổ ẩn danh cho Hiring Manager).

| # | Phút | Người dùng | Thao tác | Điểm cần chỉ ra |
| --- | --- | --- | --- | --- |
| 1 | 0–2 | HR `hr@hireflow.dev` | Tin tuyển dụng → Tạo job → dán JD → Lưu → "AI gợi ý từ JD" → sửa một tiêu chí → Lưu tiêu chí → Đăng tin | AI chỉ gợi ý (BR-JOB-05), HR quyết định; job hiện ngay ở `/jobs` |
| 2 | 2–4 | Ứng viên (không đăng nhập) | Mở `/jobs` → chọn job vừa đăng → nộp CV (PDF/DOCX) | Trang công khai không lộ trọng số, từ khoá; sau khi nộp không lộ điểm (BR-APP-07) |
| 3 | 4–6 | HR | Bảng hồ sơ → mở hồ sơ vừa nộp: trạng thái AI từ "Chờ xử lý" sang "Đang chấm" rồi có điểm | Pipeline BullMQ: đọc CV → trích xuất + embedding → chấm điểm; mỗi tiêu chí có trích dẫn, bấm vào để xem đúng đoạn trong CV |
| 4 | 6–7 | HR | Mở hồ sơ **Lê Văn Thắng** (job Senior Java Developer) | Một bằng chứng bị loại vì không có trong CV, cờ "Có bằng chứng bị loại" (BR-AI-03); xem thêm `be/docs/ai-eval.md` |
| 5 | 7–9 | HR | Tin tuyển dụng → Xếp hạng của "Backend Developer (NestJS)" → kéo thanh trọng số | Xếp hạng đổi ngay, không gọi LLM; số liệu Profiler ở [rendering.md](fe/docs/rendering.md) mục 6 |
| 6 | 9–11 | HR | Bảng hồ sơ: lọc theo trạng thái, khoảng điểm, cờ "thiếu tiêu chí bắt buộc", sắp xếp, phân trang | Bộ lọc nằm trên URL; số liệu 200k hồ sơ ở [perf-report.md](be/docs/perf-report.md) (số query không đổi theo số dòng, p95 < 300 ms) |
| 7 | 11–12 | HR | Trợ lý AI → hỏi "Ai từng làm với Kafka hoặc microservices?" | Trả lời stream, mỗi ý có trích dẫn mở đúng đoạn CV; thiếu dữ liệu thì nói không đủ thông tin |
| 8 | 12–14 | Hiring Manager `hm.eng@hireflow.dev` | Dashboard, Bảng hồ sơ chỉ thấy phòng "Phát triển phần mềm"; hỏi lại câu ở bước 7; mở hồ sơ **Phạm Quang Huy** (OFFER) → Duyệt nhận việc | Phạm vi phòng ban áp dụng cả cho chat AI (BR-ACC-07); HR không tự chuyển HIRED (BR-STS-04) |
| 9 | 14–15 | – | Mở `/jobs` với "View source" (hoặc tắt JavaScript) | HTML đã có nội dung nhờ prerender; trang nội bộ là CSR – lý do ở [rendering.md](fe/docs/rendering.md) |

Dự phòng khi không có mạng hoặc hết hạn mức AI: đặt `LLM_PROVIDERS=fake` để bước 1, 3 vẫn chạy (kết quả giả lập); bước 4, 5, 6, 8, 9 dùng dữ liệu seed nên không phụ thuộc AI.

---

## Deploy

Frontend chạy trên **Vercel**, API và worker chạy trên **Render**. Tất cả đều dùng gói miễn phí.

```
Trình duyệt ──► Vercel (hireflow.vercel.app)
                 ├─ /*      → file tĩnh của fe/dist
                 └─ /api/*  → chuyển tiếp sang Render ──► hireflow-api (NestJS + 4 worker BullMQ)
                                                           ├─ Neon            PostgreSQL + pgvector
                                                           ├─ Render Key Value Redis cho BullMQ
                                                           ├─ Cloudflare R2   file CV (S3)
                                                           └─ Gemini / Groq   LLM + embedding
```

FE và API dùng chung domain Vercel, vì cookie refresh token đặt `SameSite=Strict`. Gọi thẳng `*.onrender.com` từ trình duyệt thì sẽ không đăng nhập lại được sau khi tải lại trang.

Các file cấu hình: [`render.yaml`](render.yaml) (Blueprint của Render) và [`fe/vercel.json`](fe/vercel.json) (rewrite `/api` và fallback SPA).

### Giới hạn gói miễn phí

| Dịch vụ | Giới hạn | Ảnh hưởng |
| --- | --- | --- |
| Render web (free) | 512 MB RAM, 0,1 CPU. Ngủ sau 15 phút không có request, mở lại mất khoảng 1 phút | Lúc ngủ, worker cũng dừng: CV vừa nộp chỉ được xử lý khi API thức dậy. Xem bước 7 |
| Render Key Value (free) | 25 MB, **không lưu xuống đĩa** | Redis khởi động lại thì job đang chờ trong hàng đợi bị mất |
| Neon (free) | 0,5 GB, tự tạm dừng khi không dùng | Truy vấn đầu tiên sau khi tạm dừng chậm hơn một chút |
| Cloudflare R2 | 10 GB, không tính phí tải xuống | Phải thêm phương thức thanh toán mới bật được R2 |
| Vercel (Hobby) | Chỉ dùng cho mục đích phi thương mại | Đủ cho demo và thực tập |

### 1. Neon (database)

1. Tạo project ở https://console.neon.tech, chọn region **AWS Asia Pacific (Singapore)** cho gần Render.
2. Tạo database `hireflow`.
3. Bấm **Connect**, **tắt Connection pooling** rồi copy chuỗi kết nối. Chuỗi đúng không có `-pooler` trong host. Migration của TypeORM cần kết nối trực tiếp. Chuỗi có dạng:
   ```
   postgresql://<user>:<password>@ep-xxx.ap-southeast-1.aws.neon.tech/hireflow?sslmode=require
   ```
4. Không cần bật extension bằng tay: migration tự chạy `CREATE EXTENSION` cho `vector`, `pg_trgm`, `unaccent`, và Neon hỗ trợ cả ba.

### 2. Cloudflare R2 (file CV)

1. Vào Cloudflare dashboard, mở **R2 Object Storage** và tạo bucket `hireflow-cv` (location: Asia-Pacific). **Không** bật public access, vì API trả file qua presigned URL.
2. Vào **R2 → Manage API tokens → Create API token**, chọn quyền **Object Read & Write**, giới hạn trong bucket `hireflow-cv`.
3. Ghi lại **Access Key ID**, **Secret Access Key** và endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

### 3. Render (API + Redis)

1. Ở https://dashboard.render.com, chọn **New → Blueprint** rồi chọn repo này. Render đọc `render.yaml` và tạo 2 dịch vụ: `hireflow-api` (Docker, region Singapore) và `hireflow-redis`.
2. Điền các biến Render hỏi (những biến `sync: false`):

   | Biến | Giá trị |
   | --- | --- |
   | `DATABASE_URL` | Chuỗi kết nối Neon ở bước 1 |
   | `S3_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
   | `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Token R2 ở bước 2 |
   | `GEMINI_API_KEY`, `GEMINI_MODEL` | Key ở https://aistudio.google.com |
   | `GROQ_API_KEY`, `GROQ_MODEL` | Key ở https://console.groq.com (dự phòng khi Gemini lỗi) |
   | `CORS_ORIGINS` | **Bắt buộc** (thiếu thì API không khởi động): domain Vercel dự kiến, ví dụ `https://hireflow.vercel.app`; nhiều domain ngăn cách bằng dấu phẩy |

   Các biến còn lại đã có sẵn trong `render.yaml`. `JWT_ACCESS_SECRET` do Render tự sinh, còn `REDIS_URL` lấy từ `hireflow-redis` qua mạng nội bộ.
3. Mỗi lần khởi động, container chạy `typeorm migration:run` rồi mới bật server (xem `be/Dockerfile`).
4. Mở `https://hireflow-api.onrender.com/api/health`. Ba mục `database`, `redis`, `storage` đều phải là `up`.

> Nếu tên `hireflow-api` đã có người dùng, Render sẽ thêm hậu tố vào URL. Khi đó sửa `destination` trong `fe/vercel.json` cho khớp.

### 4. Tạo dữ liệu ban đầu (seed)

Gói free của Render không có shell, nên chạy seed từ máy mình, trỏ thẳng vào Neon và R2. Biến đặt trong shell được ưu tiên hơn `be/.env`.

```powershell
cd be
$env:DATABASE_URL = "postgresql://...neon.tech/hireflow?sslmode=require"
$env:DB_SSL = "true"
$env:STORAGE_DRIVER = "s3"
$env:S3_ENDPOINT = "https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
$env:S3_REGION = "auto"
$env:S3_ACCESS_KEY = "..."
$env:S3_SECRET_KEY = "..."
$env:SEED_ADMIN_PASSWORD = "<mật khẩu mạnh>"
npm run seed
```

Không dùng `--reset` trên database thật.

### 5. Vercel (frontend)

1. Ở https://vercel.com/new, import repo và đặt **Root Directory = `fe`**. Vercel tự nhận Vite; build command và output đã khai báo trong `fe/vercel.json`.
2. Đặt biến môi trường `PRERENDER_API_URL=https://hireflow-api.onrender.com/api/v1` để build dựng sẵn trang job công khai (F-PUB-04, xem [rendering.md](fe/docs/rendering.md)). Không đặt thì trang công khai chạy CSR như các trang khác. `VITE_API_URL` để mặc định `/api/v1`, Vercel chuyển tiếp `/api/*` sang Render.
3. Deploy xong, nếu domain Vercel khác giá trị đã điền thì sửa `CORS_ORIGINS` trên Render cho khớp.
4. Tạo Deploy Hook để trang công khai được build lại khi HR đăng, đóng hoặc sửa job: Vercel → Project Settings → Git → **Deploy Hooks** → tạo hook cho nhánh `main` → copy URL vào biến `PRERENDER_DEPLOY_HOOK_URL` của `hireflow-api` trên Render. Các thay đổi trong 30 giây được gộp thành một lần build.
5. Mở domain Vercel và đăng nhập bằng tài khoản seed. Tải lại trang (F5) để kiểm tra phiên đăng nhập vẫn còn. Mở `/jobs` → View source để thấy HTML đã có danh sách job.

### 6. Kiểm tra `TRUST_PROXY`

Rate limit dựa vào IP người dùng (`req.ip`). Request đi qua 2 lớp: Vercel ghi IP thật vào `X-Forwarded-For`, rồi Render nối thêm IP của Vercel. Vì vậy `render.yaml` đặt sẵn `TRUST_PROXY=2`. Kiểm tra lại như sau:

1. Trên Render, đặt `DEBUG_CLIENT_IP=true` (service tự deploy lại).
2. Mở `https://<domain-vercel>/api/health/ip` và so `ip` với IP thật của bạn (xem ở https://api.ipify.org).
3. Nếu khác, nhìn mảng `ips` (danh sách IP từ người dùng đến Render), tăng hoặc giảm `TRUST_PROXY` cho tới khi `ip` đúng.
4. Đặt lại `DEBUG_CLIENT_IP=false`. Khi tắt, route trả 404.

### 7. Giữ API không ngủ (tuỳ chọn)

Tạo một job miễn phí ở https://cron-job.org gọi `https://<domain-vercel>/api/health` mỗi 10 phút. Render free có 750 giờ mỗi tháng, đủ cho một service chạy cả tháng. Nếu có ngân sách, nâng `hireflow-api` lên gói Starter (7$/tháng) để bỏ hẳn chế độ ngủ.

### Deploy tự động

- **Render:** deploy lại `hireflow-api` mỗi khi có commit mới trên `main` (`autoDeployTrigger: commit`, `rootDir: be`, nên chỉ sửa trong `be/` mới deploy lại).
- **Vercel:** deploy production từ `main`, mỗi PR có một preview riêng. Preview cũng gọi API production qua rewrite.

### Biến môi trường theo dịch vụ

| Nơi đặt | Biến |
| --- | --- |
| Render `hireflow-api` | `NODE_ENV`, `CORS_ORIGINS`, `TRUST_PROXY`, `DEBUG_CLIENT_IP`, `DATABASE_URL`, `DB_SSL`, `REDIS_URL`, `JWT_*`, `STORAGE_DRIVER`, `S3_*`, `LLM_PROVIDERS`, `GEMINI_*`, `GROQ_*`, `EMBEDDING_*`, `CV_RETENTION_MONTHS`, `PRERENDER_DEPLOY_HOOK_URL` |
| Render `hireflow-redis` | Không có. `maxmemoryPolicy: noeviction` để BullMQ không bị mất key |
| Vercel | `PRERENDER_API_URL` (tuỳ chọn, nên đặt). URL API cho rewrite nằm trong `fe/vercel.json` |
| Máy local khi seed | Xem bước 4 |

---

## Kiểm thử và chất lượng code

Chạy trong từng thư mục `be/` và `fe/`:

| Lệnh | Mô tả |
| --- | --- |
| `npm run lint` | oxlint |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm test` | Unit test (Vitest) |
| `npm run format:check` / `npm run format` | Kiểm tra / tự sửa format (Prettier) |
| `npm run test:e2e` | **Chỉ backend:** E2E với DB thật trong `be/.env` (cần chạy migration trước) |
| `npm run build` | Build bản production |

Trước khi mở PR, cả bốn lệnh `lint`, `typecheck`, `test`, `build` phải chạy được ở cả hai thư mục.

**Kết quả hiện tại (27/10/2026):**

- Backend: 311 unit test, 203 E2E (PostgreSQL + pgvector, Redis thật); coverage service lõi 92,7% (mục tiêu 70%, CI báo lỗi nếu tụt dưới).
- Frontend: 94 test, gồm test hydrate trang dựng sẵn và virtualization bảng xếp hạng; contract test FE ↔ BE.
- E2E phân quyền cho từng role, gồm cả chat RAG và link tải CV; tên test bắt đầu bằng mã quy tắc (ví dụ `BR-STS-02: …`).
- Ca bắt buộc: sai quyền / sai phạm vi, chuyển trạng thái sai luồng, upload giả mime, nộp trùng, LLM trả sai schema, bằng chứng bịa bị loại, job queue lỗi và retry.
- CI dùng LLM giả để test không tốn tiền; `npm audit` chặn lỗ hổng mức high.

**Báo cáo đo đạc:**

| Báo cáo | Nội dung |
| --- | --- |
| [be/docs/perf-report.md](be/docs/perf-report.md) | Tối ưu query trên 200k hồ sơ: N+1, index, phân trang cursor, số liệu trước/sau |
| [be/docs/ai-eval.md](be/docs/ai-eval.md) | Chất lượng AI: 10 CV × 2 JD có đáp án, tỉ lệ tiêu chí đúng, bằng chứng có thật, token; thời gian từ lúc nộp CV đến khi có điểm (G2, p95 10–31 s) |
| [fe/docs/rendering.md](fe/docs/rendering.md) | CSR/SSR/SSG/ISR, prerender, Lighthouse, waterfall loader, React Profiler bảng xếp hạng |
| [fe/docs/qa-responsive.md](fe/docs/qa-responsive.md) | Kiểm giao diện 3 role × 360/768/1280px trên hệ thống chạy bằng compose |

---

## Xác thực và bảo mật

**Luồng đăng nhập:**

| Token | Thời hạn | Nơi lưu |
| --- | --- | --- |
| Access token | 15 phút | Bộ nhớ của frontend (không lưu localStorage) |
| Refresh token | 7 ngày | Cookie `refresh_token`: httpOnly, SameSite=Strict, Secure ở production, chỉ gửi tới `/api/v1/auth` |

1. Đăng nhập: API trả access token trong body và đặt refresh token vào cookie.
2. Access token hết hạn: frontend gọi `POST /auth/refresh` (cookie tự gửi kèm), nhận token mới rồi gửi lại request. Refresh token **xoay vòng** mỗi lần dùng; token cũ bị từ chối.
3. Tải lại trang: frontend tự khôi phục phiên từ cookie trước khi hiển thị trang cần đăng nhập.
4. Đăng xuất: API thu hồi token và xoá cookie.

**Các biện pháp khác:** mật khẩu băm bằng bcrypt; refresh token chỉ lưu hash (SHA-256) trong DB; `helmet`; CORS whitelist; rate limit (đăng nhập 5 lần/phút); validation whitelist cho mọi request; kiểm tra biến môi trường lúc khởi động. Tài khoản nội bộ do Admin tạo; endpoint đăng ký sẽ bị gỡ khi có đủ role.

**Dữ liệu cá nhân** (theo Nghị định 13/2023/NĐ-CP): ứng viên phải đồng ý khi nộp CV; email và số điện thoại được che trước khi gửi cho LLM; hỗ trợ xoá / ẩn danh theo yêu cầu; thời hạn lưu CV cấu hình được (`CV_RETENTION_MONTHS`, mặc định 12 tháng); job định kỳ tự ẩn danh ứng viên quá hạn lúc 02:00 mỗi ngày. Dự án chỉ dùng CV mẫu tự soạn, không dùng CV thật của người khác.

**Nội dung CV được coi là dữ liệu, không phải chỉ dẫn** cho LLM (chống prompt injection, kể cả chữ ẩn trong PDF). Không dùng giới tính, tuổi, quốc tịch, tôn giáo, tình trạng hôn nhân hay ảnh làm tiêu chí chấm điểm.

---

## API

Prefix `/api/v1`, REST + JSON. Tài liệu đầy đủ ở Swagger: http://localhost:3000/api/docs.

**Response thành công:**

```json
{ "success": true, "statusCode": 200, "message": "Success", "data": {}, "meta": {}, "timestamp": "..." }
```

`meta` chỉ có ở danh sách phân trang: `{ page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage }`.

**Response lỗi:**

```json
{ "success": false, "statusCode": 400, "message": "Validation failed",
  "errors": [{ "field": "email", "messages": ["email must be an email"] }], "path": "...", "timestamp": "..." }
```

**Endpoint hiện có:**

| Method | Route | Quyền |
| --- | --- | --- |
| POST | `/auth/login` | Công khai |
| POST | `/auth/refresh` | Công khai (đọc refresh token từ cookie) |
| POST | `/auth/logout` | Đã đăng nhập |
| GET | `/auth/me` | Đã đăng nhập |
| POST | `/auth/register` | Công khai (sẽ gỡ) |
| GET, POST | `/users` | Admin |
| GET, PATCH, DELETE | `/users/:id` | Admin (DELETE là xoá mềm) |
| GET | `/api/health` | Công khai (không có `/v1`) |

---

## Quy trình phát triển

- **Nhánh:** `main` luôn chạy được. Làm việc trên nhánh `feature/<mã>-<mô-tả>` hoặc `fix/<mã>-<mô-tả>`, rồi mở Pull Request vào `main`.
- **Commit:** theo [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- **Definition of Done:** đã review; có test; Swagger cập nhật; migration chạy được từ DB trống; không lỗi lint/typecheck; tài liệu liên quan đã sửa.
- **Database:** mọi thay đổi schema phải qua migration (`npm run migration:generate`); `DB_SYNCHRONIZE` luôn tắt.
- **Backend dùng ESM:** import file nội bộ phải có đuôi `.js`, ví dụ `import { UsersService } from './users.service.js'`.
- **Frontend:** import qua alias `@/`; feature khác chỉ import qua `@/features/<tên>`.

**Checklist cho PR frontend:**

- [ ] Đã tìm trong `components/ui` và `components/shared` trước khi tạo component mới.
- [ ] State đặt đúng loại: dữ liệu server dùng TanStack Query, bộ lọc và phân trang lưu trên URL, form dùng React Hook Form.
- [ ] Không fetch trong `useEffect`; effect có cleanup.
- [ ] Mỗi màn hình có đủ 4 trạng thái: loading, empty, error, success.
- [ ] Dùng được ở độ rộng 360px.

---

## Lộ trình

Ngày 26/10/2026 lịch được rút lại: hoàn thiện cả MVP 1 và MVP 2 trước **01/11/2026** (Kickoff ghi 13/11 và ~11/12 là lịch cũ). Chỉ có **một buổi demo duy nhất ngày 01/11**, nên ngừng thêm tính năng từ cuối ngày 30/10 và dành 31/10 để tập demo.

| Ngày | Nội dung | Trạng thái |
| --- | --- | --- |
| 19–25/10 | Toàn bộ tính năng MVP 1: nền tảng, ATS lõi, AI Screening, RAG, tối ưu query, hàng đợi AI, bộ đánh giá AI | Xong |
| 26/10 (D2, D3) | Siết MVP 1 (rate limit, quyền, audit, coverage); cấu hình deploy; prerender trang công khai; virtualization + Profiler; rendering.md; compose toàn hệ thống; README + kịch bản demo; kiểm giao diện; đồng bộ tài liệu | **Mốc M4: MVP 1 hoàn chỉnh** |
| 26/10 (D4) | Đặc tả US-10 và BR-MATCH-01 → 04; gợi ý ứng viên cũ + mời vào tin | Xong (sớm 2 ngày) |
| 27/10 (D5) | Job định kỳ tự ẩn danh khi hết hạn lưu, dọn token; mở lại hồ sơ đã kết thúc; nhập text CV thủ công | Xong |
| 27/10 (D6) | Cache dashboard; thông báo realtime (SSE); nhật ký kiểm toán (kéo lên từ 28–29/10 vì chưa có tài khoản deploy) | Xong |
| 28/10 | Deploy thật (Vercel + Render + Neon + R2), backup và thử khôi phục | |
| 29/10 | ai-eval 30 CV | |
| 30/10 | Phỏng vấn + role Interviewer; load test k6. Ngừng thêm tính năng cuối ngày | |
| 31/10 | Kịch bản demo gộp MVP 1 + 2, tập demo trên bản deploy, báo cáo cuối kỳ, sửa lỗi | |
| 01/11 | Buổi demo duy nhất | **Phát hành MVP 2** |

Hybrid search chỉ làm nếu đi trước lịch. Nếu trễ: bỏ hybrid search trước, sau đó đến module phỏng vấn; luôn giữ gợi ý ứng viên cũ, deploy và bộ đánh giá AI (Kickoff 20.3).

---

## Lỗi thường gặp

| Lỗi | Cách xử lý |
| --- | --- |
| `npm install <package>` báo `Cannot read properties of null (reading 'edgesOut')` | Lỗi của npm 10. Dùng `npx npm@11 install <package>` |
| Backend không chạy, báo `Invalid environment variables` | So `be/.env` với `be/.env.example`; JWT secret phải có tối thiểu 32 ký tự |
| `migration:run` không kết nối được DB | Kiểm tra PostgreSQL đang chạy (`npm run infra:up` nếu dùng Docker) và thông tin `DB_*` trong `be/.env` (Postgres trong Docker ở cổng 5433) |
| Đăng nhập xong, tải lại trang thì bị đăng xuất | Mở frontend qua `http://localhost:5173` (dev server có proxy). Nếu frontend và API khác domain, thêm domain frontend vào `CORS_ORIGINS` và bật HTTPS để cookie hoạt động |
| Cổng 3000 hoặc 5173 đang bị dùng | Đổi `PORT` trong `be/.env`; với frontend chạy `npm run dev -- --port 5174` (và cập nhật `CORS_ORIGINS`) |
| `/api/health` trên Render báo `database` down | Kiểm tra `DATABASE_URL` là chuỗi **không** có `-pooler` và `DB_SSL=true` |
| Trên Vercel, `/api/...` trả 404 hoặc 502 | `destination` trong `fe/vercel.json` phải khớp URL thật của `hireflow-api`; API có thể đang ngủ, đợi khoảng 1 phút rồi thử lại |
| CV nộp lên Render bị kẹt ở trạng thái chờ | API vừa ngủ hoặc Redis free vừa khởi động lại. Xem [Deploy, bước 7](#7-giữ-api-không-ngủ-tuỳ-chọn) |
