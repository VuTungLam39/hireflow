# HireFlow

**Hệ thống quản lý tuyển dụng (ATS) với AI sàng lọc CV có bằng chứng.**

HR đăng tin tuyển dụng, ứng viên nộp CV, hệ thống tự đọc CV và xếp hạng ứng viên theo mô tả công việc (JD). Mỗi điểm số đi kèm **trích dẫn nguyên văn từ CV** làm bằng chứng, và code kiểm tra trích dẫn đó có thật trong CV. HR chỉnh trọng số tiêu chí thì bảng xếp hạng đổi ngay, không tốn thêm lần gọi LLM nào.

> Dự án thực tập tại NCC (10/2026 – 12/2026). Đang ở giai đoạn **MVP 1, tuần 1**. Xem [Trạng thái](#trạng-thái) để biết phần nào đã chạy được.

---

## Mục lục

- [Vì sao có HireFlow](#vì-sao-có-hireflow)
- [Tính năng](#tính-năng)
- [Trạng thái](#trạng-thái)
- [Kiến trúc](#kiến-trúc)
- [Công nghệ](#công-nghệ)
- [Cấu trúc repo](#cấu-trúc-repo)
- [Chạy trên máy](#chạy-trên-máy)
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

### MVP 1 (19/10 – 13/11/2026)

- **Tuyển dụng:** CRUD phòng ban, job (DRAFT / OPEN / CLOSED), ứng viên, hồ sơ ứng tuyển (application).
- **Pipeline trạng thái:** `NEW → SCREENING → INTERVIEW → OFFER → HIRED`, có thể `REJECTED` (bắt buộc lý do) hoặc `WITHDRAWN`. Lịch sử ghi trong cùng transaction.
- **Nộp CV công khai:** PDF/DOCX tối đa 5MB, kiểm cả mime và magic bytes, chống nộp trùng, có ô đồng ý xử lý dữ liệu, giới hạn tần suất.
- **AI Screening có bằng chứng:** tách JD thành tiêu chí, trích xuất CV thành JSON có validate schema, điểm kèm trích dẫn, kiểm tra trích dẫn bằng code.
- **Xếp hạng lại tức thì:** kéo thanh trọng số, bảng xếp hạng cập nhật dưới 100ms trên trình duyệt.
- **Chat AI tìm ứng viên (RAG):** câu trả lời stream, mỗi ý có trích dẫn tới đoạn CV, lọc theo quyền người hỏi.
- **Phân quyền:** RBAC + phạm vi theo phòng ban (Hiring Manager chỉ thấy phòng mình), áp dụng cả cho RAG và link tải CV.
- **Tối ưu truy vấn:** danh sách 200.000 application, p95 dưới 300ms; báo cáo N+1 và index có số liệu trước/sau.
- **Giao diện responsive** từ 360px.

### MVP 2 (16/11 – ~11/12/2026)

Gợi ý ứng viên cũ khi publish job mới · hybrid search (full-text + vector) · phỏng vấn và phiếu đánh giá (role Interviewer) · thông báo realtime (SSE) · bộ đánh giá chất lượng AI · cache Redis · audit log · prerender trang công khai · deploy có HTTPS + CI/CD.

### Không nằm trong phạm vi

Tự động loại ứng viên · lương, ký offer điện tử · SSO, mobile app · tích hợp job board (LinkedIn, TopCV) · OCR CV dạng ảnh scan.

---

## Trạng thái

| Phần | Trạng thái |
| --- | --- |
| Khung backend: config + validate env, TypeORM + migration, format response/lỗi thống nhất, Swagger, health check, Docker | Xong |
| Xác thực: JWT access token + refresh token xoay vòng trong cookie httpOnly | Xong |
| Quản lý user (Admin), guard theo role | Xong |
| Khung frontend: routing lazy, TanStack Query, guard, form + Zod, bộ component UI cơ bản | Xong |
| Màn đăng nhập, quản lý user | Xong |
| Phân quyền theo permission + phạm vi phòng ban; role HR, Hiring Manager | Tuần 1 |
| Phòng ban, job, ứng viên, application, pipeline trạng thái | Tuần 1–2 |
| Upload CV (MinIO), queue (BullMQ), LLM trích xuất + chấm điểm | Tuần 3 |
| pgvector + chat RAG, bảng xếp hạng + thanh trọng số | Tuần 4 |

---

## Kiến trúc

```
[React + Vite (CSR)] ──HTTPS──▶ [NestJS API] ──▶ [PostgreSQL + pgvector]
                                     │
                                     ├──▶ [Redis]        BullMQ (queue), cache (MVP 2)
                                     ├──▶ [MinIO / S3]   file CV
                                     └──▶ [LlmProvider]  LLM + embedding (API hoặc Ollama)
                                     ▼
                              [BullMQ workers]
                  parse-cv · extract-cv · embed-cv · score
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
| Frontend CSR bằng Vite, không dùng Next.js | Ứng dụng chủ yếu sau đăng nhập; trang công khai sẽ prerender ở MVP 2 |
| Server state (TanStack Query) tách khỏi client state (Zustand) | Tránh trùng nguồn dữ liệu, dễ cache và invalidate |

---

## Công nghệ

| Lớp | Lựa chọn |
| --- | --- |
| Backend | NestJS 12 (ESM, TypeScript strict), TypeORM, class-validator, Passport JWT, Swagger |
| Database | PostgreSQL 17 (+ pgvector từ tuần 3) |
| Queue / cache | Redis + BullMQ (tuần 3) |
| Lưu trữ file | MinIO (dev), S3 tương thích (prod) (tuần 3) |
| AI | Qua interface `LlmProvider`: LLM (Claude / OpenAI) và embedding đa ngôn ngữ; dự phòng Ollama |
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
│   │   └── modules/        # auth, users, health (sắp có: departments, jobs, candidates, applications, files, ai, rag...)
│   ├── test/               # E2E test
│   └── docker-compose.yml
└── fe/                     # Frontend React + Vite – xem fe/README.md
    └── src/
        ├── app/            # providers, layouts
        ├── routes/         # router, guards, paths
        ├── features/       # mỗi nghiệp vụ một module: api, hooks, components, pages, schemas
        ├── components/     # ui (primitive), shared (composite)
        ├── lib/            # api-client, query-client, errors
        └── stores/         # Zustand store
```

Frontend chia code theo tính năng và chỉ cho import một chiều giữa các tầng: `app/routes → features → components → lib`. Feature khác chỉ được import qua `index.ts`; oxlint chặn import sâu vào bên trong feature.

---

## Chạy trên máy

### Yêu cầu

- **Node.js ≥ 22**
- **PostgreSQL 17**: cài sẵn trên máy, hoặc chạy bằng Docker (cần Docker Desktop)
- Git

### 1. Lấy code

```bash
git clone https://github.com/VuTungLam39/hireflow.git
cd hireflow
```

### 2. Backend

```bash
cd be
npm ci
cp .env.example .env        # sửa thông tin DB; đổi 2 JWT secret (tối thiểu 32 ký tự)
npm run db:up               # (tuỳ chọn) bật PostgreSQL bằng Docker
npm run migration:run       # tạo bảng
npm run seed                # tạo tài khoản admin
npm run start:dev           # http://localhost:3000
```

Tạo JWT secret ngẫu nhiên:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Frontend

Mở terminal khác:

```bash
cd fe
npm ci
cp .env.example .env
npm run dev                 # http://localhost:5173
```

Khi chạy dev, mọi request tới `/api/...` được Vite chuyển tiếp sang backend, nên không phải cấu hình CORS và cookie đăng nhập hoạt động như cùng một trang.

### 4. Đăng nhập

Mở http://localhost:5173 và đăng nhập bằng tài khoản admin vừa seed:

| Email | Mật khẩu |
| --- | --- |
| `admin@example.com` | `Admin@123` |

Đổi giá trị `SEED_ADMIN_EMAIL` và `SEED_ADMIN_PASSWORD` trong `be/.env` nếu muốn. **Không dùng tài khoản mặc định này ở môi trường thật.**

### Địa chỉ hữu ích

| Địa chỉ | Nội dung |
| --- | --- |
| http://localhost:5173 | Giao diện web |
| http://localhost:3000/api/v1 | REST API |
| http://localhost:3000/api/docs | Swagger (tắt ở production) |
| http://localhost:3000/api/health | Health check |

### Chạy backend bằng Docker

```bash
cd be
docker compose --profile app up -d --build   # PostgreSQL + API, tự chạy migration
```

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
   | `CORS_ORIGINS` | Domain Vercel, ví dụ `https://hireflow.vercel.app` (điền sau bước 5 cũng được) |

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
2. Không cần biến môi trường: `VITE_API_URL` mặc định là `/api/v1`, và Vercel chuyển tiếp `/api/*` sang Render.
3. Deploy xong, quay lại Render và đặt `CORS_ORIGINS` bằng domain Vercel.
4. Mở domain Vercel và đăng nhập bằng tài khoản seed. Tải lại trang (F5) để kiểm tra phiên đăng nhập vẫn còn.

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
| Render `hireflow-api` | `NODE_ENV`, `CORS_ORIGINS`, `TRUST_PROXY`, `DEBUG_CLIENT_IP`, `DATABASE_URL`, `DB_SSL`, `REDIS_URL`, `JWT_*`, `STORAGE_DRIVER`, `S3_*`, `LLM_PROVIDERS`, `GEMINI_*`, `GROQ_*`, `EMBEDDING_*`, `CV_RETENTION_MONTHS` |
| Render `hireflow-redis` | Không có. `maxmemoryPolicy: noeviction` để BullMQ không bị mất key |
| Vercel | Không có (`fe/vercel.json` đã chứa URL API) |
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

**Mục tiêu kiểm thử của dự án:**

- Coverage từ 70% cho service lõi của backend.
- E2E phân quyền cho từng role, gồm cả chat RAG và link tải CV.
- Ca bắt buộc: sai quyền / sai phạm vi, chuyển trạng thái sai luồng, upload giả mime, nộp trùng, LLM trả sai schema, bằng chứng bịa bị loại, job queue lỗi và retry.
- CI dùng LLM giả (mock) để test không tốn tiền.

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

**Dữ liệu cá nhân** (theo Nghị định 13/2023/NĐ-CP): ứng viên phải đồng ý khi nộp CV; email và số điện thoại được che trước khi gửi cho LLM; hỗ trợ xoá / ẩn danh theo yêu cầu; thời hạn lưu CV cấu hình được. Dự án chỉ dùng CV mẫu tự soạn, không dùng CV thật của người khác.

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

| Tuần | Nội dung | Mốc |
| --- | --- | --- |
| 1 (19–23/10) | Schema + migration + seed 200k application; permission + phạm vi phòng ban; CRUD phòng ban, job, ứng viên | 3 role đăng nhập, mỗi role thấy dữ liệu khác nhau |
| 2 (26–30/10) | DataTable, bộ lọc trên URL, responsive; danh sách application; case study N+1 + index; pipeline trạng thái | ATS dùng được, có báo cáo hiệu năng |
| 3 (2–6/11) | MinIO + trang nộp CV; BullMQ + parse PDF/DOCX; LLM tách JD, trích xuất CV; công thức điểm + kiểm tra bằng chứng | Nộp CV xong tự có điểm kèm bằng chứng |
| 4 (9–13/11) | Bảng xếp hạng + thanh trọng số; embedding + pgvector + chat có trích dẫn; tài liệu rendering; test, Docker Compose | **Phát hành MVP 1** |
| 5–8 (16/11–11/12) | Gợi ý ứng viên cũ, hybrid search, phỏng vấn, thông báo realtime, đánh giá AI, deploy + CI/CD, load test | **Phát hành MVP 2** |

---

## Lỗi thường gặp

| Lỗi | Cách xử lý |
| --- | --- |
| `npm install <package>` báo `Cannot read properties of null (reading 'edgesOut')` | Lỗi của npm 10. Dùng `npx npm@11 install <package>` |
| Backend không chạy, báo `Invalid environment variables` | So `be/.env` với `be/.env.example`; JWT secret phải có tối thiểu 32 ký tự |
| `migration:run` không kết nối được DB | Kiểm tra PostgreSQL đang chạy (`npm run db:up` nếu dùng Docker) và thông tin `DB_*` trong `be/.env` |
| Đăng nhập xong, tải lại trang thì bị đăng xuất | Mở frontend qua `http://localhost:5173` (dev server có proxy). Nếu frontend và API khác domain, thêm domain frontend vào `CORS_ORIGINS` và bật HTTPS để cookie hoạt động |
| Cổng 3000 hoặc 5173 đang bị dùng | Đổi `PORT` trong `be/.env`; với frontend chạy `npm run dev -- --port 5174` (và cập nhật `CORS_ORIGINS`) |
| `/api/health` trên Render báo `database` down | Kiểm tra `DATABASE_URL` là chuỗi **không** có `-pooler` và `DB_SSL=true` |
| Trên Vercel, `/api/...` trả 404 hoặc 502 | `destination` trong `fe/vercel.json` phải khớp URL thật của `hireflow-api`; API có thể đang ngủ, đợi khoảng 1 phút rồi thử lại |
| CV nộp lên Render bị kẹt ở trạng thái chờ | API vừa ngủ hoặc Redis free vừa khởi động lại. Xem [Deploy, bước 7](#7-giữ-api-không-ngủ-tuỳ-chọn) |
