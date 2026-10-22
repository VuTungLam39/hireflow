# NCC Intern Project – Backend

API backend viết bằng **NestJS 12** (ESM) + **PostgreSQL** + **TypeORM**.

## Tính năng có sẵn

| Nhóm | Chi tiết |
| --- | --- |
| Cấu hình | `@nestjs/config`, validate biến môi trường khi khởi động (`src/config/env.validation.ts`) |
| Database | TypeORM + PostgreSQL, đặt tên cột snake_case, migration, seed admin |
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
npm run db:up              # (tuỳ chọn) bật PostgreSQL bằng Docker
npm run migration:run      # tạo bảng
npm run seed               # tạo tài khoản admin (admin@example.com / Admin@123)
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
| `npm run migration:generate -- src/database/migrations/<Ten>` | Sinh migration từ thay đổi entity |
| `npm run migration:create -- src/database/migrations/<Ten>` | Tạo migration rỗng |
| `npm run migration:run` / `migration:revert` / `migration:show` | Chạy / hoàn tác / xem migration |
| `npm run seed` | Chạy seed |
| `npm run db:up` / `npm run db:down` | Bật / tắt PostgreSQL bằng Docker |

> Các lệnh migration chạy trên code đã build (`dist/`), script đã tự `npm run build` trước.

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
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── interceptors/       # TransformInterceptor, LoggingInterceptor
│   ├── interfaces/         # ApiResponse, JwtPayload, AuthUser
│   └── utils/              # ValidationPipe tuỳ biến
├── database/
│   ├── data-source.ts      # DataSource cho TypeORM CLI
│   ├── migrations/
│   └── seeds/
└── modules/
    ├── auth/               # register, login, refresh, logout, me; refresh-cookie.ts đặt/xoá cookie
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
npm run db:up                               # chỉ bật PostgreSQL
docker compose --profile app up -d --build  # bật cả PostgreSQL và API (tự chạy migration)
```

## Lỗi thường gặp

- **`npm install <package>` báo `Cannot read properties of null (reading 'edgesOut')`**: lỗi của npm 10. Dùng `npx npm@11 install <package>` thay thế.
- **Server không khởi động, báo `Invalid environment variables`**: kiểm tra `.env` theo `.env.example` (JWT secret cần tối thiểu 32 ký tự).
