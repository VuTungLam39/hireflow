# NCC Intern Project – Backend

API backend viết bằng **NestJS 12** (ESM) + **PostgreSQL** + **TypeORM**.

## Tính năng có sẵn

| Nhóm | Chi tiết |
| --- | --- |
| Cấu hình | `@nestjs/config`, validate biến môi trường khi khởi động (`src/config/env.validation.ts`) |
| Database | TypeORM + PostgreSQL, đặt tên cột snake_case, migration, seed dữ liệu mẫu |
| Xác thực | JWT access token (trả trong body) + refresh token trong cookie httpOnly, SameSite=Strict (có rotation, lưu hash trong DB), đăng ký / đăng nhập / đăng xuất |
| Phân quyền | Guard toàn cục: mọi route cần đăng nhập trừ khi gắn `@Public()`; giới hạn role bằng `@Roles(Role.Admin)` |
| Response | Format chuẩn cho mọi response thành công/lỗi, tự tách `meta` khi phân trang |
| Validate | `class-validator`, lỗi trả về dạng `[{ field, messages }]` |
| Bảo mật | `helmet`, CORS, rate limit (`@nestjs/throttler`, login giới hạn 5 lần/phút) |
| Tài liệu | Swagger tại `/api/docs` (tắt ở production) |
| Khác | Health check (`/api/health`), log request, API versioning (`/api/v1/...`), Docker |

## Bắt đầu nhanh

Yêu cầu: Node.js >= 22, PostgreSQL (cài sẵn hoặc chạy bằng Docker).

```bash
npm ci                     # cài dependency theo package-lock
cp .env.example .env       # sau đó sửa thông tin DB và JWT secret
npm run infra:up           # (tuỳ chọn) bật Postgres + pgvector, Redis, RustFS bằng Docker
npm run migration:run      # tạo bảng
npm run seed               # dữ liệu mẫu tự nhiên: 20 phòng ban, 20 user, 20 job, 27 ứng viên, 31 hồ sơ (mật khẩu Admin@123)
npm run start:dev          # chạy dev, tự reload
```

- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/docs
- Health: http://localhost:3000/api/health

## Scripts

| Lệnh | Mô tả |
| --- | --- |
| `npm run start:dev` | Chạy dev (watch) |
| `npm run build` / `npm run start:prod` | Build và chạy bản production |
| `npm run lint` / `npm run format` / `npm run typecheck` | Kiểm tra code |
| `npm test` | Unit test (Vitest, file `*.spec.ts` trong `src/`) |
| `npm run test:e2e` | E2E test với DB thật trong `.env` (file `test/*.e2e-spec.ts`) |
| `npm run test:cov` + `npm run test:e2e:cov` + `npm run coverage:report` | Đo coverage service lõi, gộp unit và e2e; báo lỗi nếu dưới 70% (Kickoff G4). CI chạy cả ba |
| `npm run migration:generate -- src/database/migrations/<Ten>` | Sinh migration từ thay đổi entity |
| `npm run migration:create -- src/database/migrations/<Ten>` | Tạo migration rỗng |
| `npm run migration:run` / `migration:revert` / `migration:show` | Chạy / hoàn tác / xem migration |
| `npm run seed` | Seed dữ liệu mẫu vào DB trống; `npm run seed -- --reset` xoá dữ liệu nghiệp vụ (job, ứng viên, hồ sơ, CV) rồi seed lại. Không chạy `--reset` khi `NODE_ENV=production` |
| `npm run seed:perf` | 200.000 hồ sơ để đo hiệu năng; chỉ chạy trên DB tên `*_perf` |
| `npm run perf -- <nhãn>` | Đo p95, số query mỗi request và EXPLAIN ANALYZE trên DB perf, ghi `docs/perf/<nhãn>.md`. Kết quả tối ưu: `docs/perf-report.md` |
| `npm run ai:eval` | Đánh giá chất lượng AI: 10 CV mẫu × 2 JD qua LLM thật (theo `.env`), ghi báo cáo vào `docs/ai-eval/`. Tổng hợp kết quả: `docs/ai-eval.md` |
| `npm run infra:up` / `npm run infra:down` | Bật / tắt Postgres (pgvector), Redis, RustFS bằng Docker |

> Các lệnh migration chạy trên code đã build (`dist/`), script đã tự `npm run build` trước.

### Dữ liệu mẫu (`npm run seed`)

Nội dung nằm ở `src/database/seeds/demo/`: `org.ts` (phòng ban, user, phiên đăng nhập), `jobs.ts`, `candidates.ts`, `applications.ts`. Seed chạy bằng chính code nghiệp vụ nên dữ liệu luôn nhất quán:

- CV là file DOCX thật, lưu qua `StorageService` (local hoặc S3 theo `STORAGE_DRIVER`); text CV lấy bằng `extractCvText`, nên xem và tải CV được như hồ sơ thật.
- Điểm và bằng chứng tính bằng `scoreApplication`; seed báo lỗi nếu bằng chứng không có trong CV. Một ứng viên có bằng chứng "AI bịa" để thấy cờ `UNVERIFIED_EVIDENCE`.
- Luồng trạng thái kiểm bằng `assertTransition`; OFFER → HIRED chỉ do Hiring Manager đúng phòng; mốc thời gian khớp ngày đăng và đóng job.
- Có đủ tình huống: job nháp, đang mở, đã đóng; tiêu chí 2 phiên bản; CV đang chờ xử lý, CV scan lỗi; ứng viên nộp nhiều job, dùng lại CV, đã ẩn danh; HR tải CV hộ.
- Hồ sơ trích xuất (`cv_profiles`) ghi model `seed`, 0 token, để không lẫn vào số liệu chi phí AI.

## Cấu trúc thư mục

```
src/
├── main.ts                 # Điểm khởi động
├── setup-app.ts            # Cấu hình chung (prefix, versioning, pipe, helmet, cors, swagger)
├── app.module.ts           # Module gốc + guard/interceptor/filter toàn cục
├── config/                 # Cấu hình theo nhóm (app, database, jwt) + validate env
├── common/
│   ├── constants/          # Hằng số dùng chung
│   ├── decorators/         # @Public, @Roles, @CurrentUser, @ResponseMessage
│   ├── dto/                # PaginationQueryDto, PaginatedResult
│   ├── entities/           # AbstractEntity (id uuid, createdAt, updatedAt, deletedAt)
│   ├── enums/              # Role, SortOrder
│   ├── filters/            # AllExceptionsFilter – format lỗi thống nhất
│   ├── guards/             # JwtAuthGuard, PermissionsGuard, rate limit theo user / tài khoản
│   ├── interceptors/       # TransformInterceptor, LoggingInterceptor
│   ├── interfaces/         # ApiResponse, JwtPayload, AuthUser
│   └── utils/              # ValidationPipe tuỳ biến
├── database/
│   ├── data-source.ts      # DataSource cho TypeORM CLI
│   ├── migrations/
│   └── seeds/
└── modules/
    ├── auth/               # login, refresh, logout, me, đổi mật khẩu; refresh-cookie.ts đặt/xoá cookie
    ├── users/              # CRUD user (Admin)
    └── health/
test/                       # E2E test
```

## Format response

Thành công:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [],
  "meta": { "page": 1, "limit": 10, "totalItems": 25, "totalPages": 3, "hasNextPage": true, "hasPreviousPage": false },
  "timestamp": "2026-10-19T09:00:00.000Z"
}
```

`meta` chỉ có khi service trả về `PaginatedResult`. Đổi `message` bằng `@ResponseMessage('...')`.

Lỗi:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "email", "messages": ["email must be an email"] }],
  "path": "/api/v1/auth/register",
  "timestamp": "2026-10-19T09:00:00.000Z"
}
```

## API hiện có

| Method | Route | Quyền |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/auth/refresh` | Public (đọc refresh token từ cookie `refresh_token`) |
| POST | `/api/v1/auth/logout` | Đã đăng nhập |
| GET | `/api/v1/auth/me` | Đã đăng nhập |
| GET / POST | `/api/v1/users` | Admin |
| GET / PATCH / DELETE | `/api/v1/users/:id` | Admin (DELETE là xoá mềm) |
| GET | `/api/health` | Public |

## Thêm một module mới

1. Sinh code: `npx nest g resource modules/<ten> --no-spec` (chọn REST API).
2. Entity kế thừa `AbstractEntity`, đặt trong `modules/<ten>/entities/<ten>.entity.ts`.
3. Đăng ký entity bằng `TypeOrmModule.forFeature([...])` trong module.
4. Sinh migration: `npm run migration:generate -- src/database/migrations/Create<Ten>` rồi `npm run migration:run`.
5. Route mặc định yêu cầu đăng nhập; thêm `@Public()` hoặc `@Roles(...)` khi cần.

Lưu ý: dự án dùng **ESM**, nên import file nội bộ phải có đuôi `.js`, ví dụ `import { UsersService } from './users.service.js';`.

## Docker

```bash
npm run infra:up                            # Postgres + pgvector, Redis, RustFS
docker compose --profile app up -d --build  # bật thêm API (tự chạy migration)
```

| Dịch vụ | Image | Cổng máy | Ghi chú |
|---|---|---|---|
| Postgres | `pgvector/pgvector:0.8.7-pg18-trixie` | `POSTGRES_HOST_PORT` (5433) | Dùng: đặt `DB_PORT=5433` trong `.env` rồi `npm run migration:run` |
| Redis | `redis:7-alpine` | `REDIS_PORT` (6379) | Hàng đợi BullMQ, AOF bật, `noeviction` |
| RustFS | `rustfs/rustfs:1.0.3` | 9000 (S3), 9001 (console) | Object storage S3-compatible thay MinIO; bật bằng `STORAGE_DRIVER=s3`, bucket tự tạo khi khởi động |

Cổng Postgres trong Docker để 5433 để không trùng Postgres cài sẵn trên máy (5432).

## CI

`.github/workflows/ci.yml` chạy trên mỗi PR và push vào `main`: BE (format, lint, typecheck, unit test, build, kiểm tra compose), BE e2e (Postgres + pgvector, migration từ DB trống), FE (format, lint, typecheck, test, build).

## Lỗi thường gặp

- **`npm install <package>` báo `Cannot read properties of null (reading 'edgesOut')`**: lỗi của npm 10. Dùng `npx npm@11 install <package>` thay thế.
- **Server không khởi động, báo `Invalid environment variables`**: kiểm tra `.env` theo `.env.example` (JWT secret cần tối thiểu 32 ký tự).
