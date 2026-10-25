# NCC Intern Project – Frontend

Giao diện web viết bằng **React 19 + TypeScript + Vite**, kết nối với backend NestJS trong thư mục `../be`.

## Công nghệ

| Mục đích | Thư viện |
| --- | --- |
| Build / dev server | Vite 8 |
| Routing | React Router 8 (lazy load từng trang, loader tải trước dữ liệu) |
| Gọi API & cache dữ liệu | Axios + TanStack Query |
| State toàn cục (phiên, UI shell, trọng số nháp) | Zustand (chỉ giữ trong bộ nhớ) |
| Form & validate | React Hook Form + Zod |
| Giao diện | Tailwind CSS 4, thông báo bằng Sonner |
| API giả khi chưa có backend | MSW (Mock Service Worker) |
| Test | Vitest + Testing Library |
| Lint / format | oxlint, Prettier |

## Bắt đầu nhanh

Yêu cầu: Node.js >= 22.

```bash
npm ci
cp .env.example .env
npm run dev          # http://localhost:5173
```

### Dữ liệu: luôn từ backend thật

FE không còn chế độ API giả: mọi màn hình gọi backend ở `http://localhost:3000`, dữ liệu lấy từ PostgreSQL. Vite **proxy** mọi request `/api/...` sang backend, nên không phải cấu hình CORS.

1. Chạy backend và seed dữ liệu mẫu (xem `../be/README.md`): `npm run migration:run`, sau đó `npm run seed` (hoặc `npm run seed -- --reset` để thay dữ liệu cũ).
2. `npm run dev` rồi đăng nhập. Khi chạy dev, trang đăng nhập có nút điền nhanh tài khoản seed (mật khẩu chung `Admin@123`):

| Email | Vai trò | Thấy gì |
| --- | --- | --- |
| `admin@example.com` | Admin | Tất cả, thêm Người dùng và Phòng ban |
| `hr@hireflow.dev` | HR | Mọi job và hồ sơ; tạo job, đổi trạng thái, chấm lại |
| `hm.eng@hireflow.dev` | Hiring Manager | Chỉ phòng Phát triển phần mềm; duyệt OFFER → HIRED |
| `hm.sales@hireflow.dev` | Hiring Manager | Chỉ phòng Kinh doanh |
| `phuoc.le@hireflow.dev` | Hiring Manager | Chỉ phòng Phát triển Mobile |

Chat AI trả "AI chưa sẵn sàng" (503 `AI_UNAVAILABLE`) cho tới khi backend có RAG (tuần 4).

### API giả chỉ dùng trong test

`src/test/msw/` là API giả (MSW) theo API Contract, **chỉ** được import trong test: test component (`*.test.tsx`) và contract test. Code của app không import thư mục này, nên bundle production không chứa dữ liệu giả.

### Contract test FE ↔ BE

```bash
npm run test:contract   # cần backend đang chạy; CONTRACT_API_URL mặc định http://localhost:3000/api/v1
```

Gọi cùng các hàm API của feature vào mock và backend thật rồi so cấu trúc dữ liệu: báo lỗi khi BE thiếu field hoặc sai kiểu so với mock, in danh sách field BE trả thêm. Có tạo một job nháp rồi xoá ngay. Không chạy trong `npm test` và CI.

## Scripts

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Chạy dev server |
| `npm run build` | Type-check và build ra `dist/` |
| `npm run preview` | Chạy thử bản build |
| `npm run typecheck` / `npm run lint` / `npm run format` | Kiểm tra code |
| `npm test` / `npm run test:watch` | Chạy test |

## Cấu trúc thư mục

```
src/
├── main.tsx                 # Khởi động: tạo router, render app
├── app/
│   ├── providers.tsx        # QueryClient, Toaster, Devtools
│   └── layouts/             # MainLayout (sidebar theo quyền), AuthLayout, PublicLayout
├── config/env.ts            # Đọc & kiểm tra biến môi trường
├── lib/
│   ├── api-client.ts        # Axios: gắn token, tự refresh token khi 401
│   ├── permissions.ts       # Chuỗi permission + bảng role → permission (khớp BE)
│   ├── errors.ts            # Message lỗi theo mã (error-codes.ts), gắn lỗi validate vào form
│   ├── sse.ts               # Tách sự kiện SSE cho chat stream
│   ├── query-client.ts      # Cấu hình TanStack Query
│   └── utils.ts             # cn(), định dạng ngày, dung lượng file
├── stores/                  # auth.store (phiên, chỉ trong bộ nhớ), ui.store (sidebar)
├── types/                   # Kiểu dùng chung khớp backend: api.ts, user.ts
├── hooks/                   # useDebounce, useListParams (bộ lọc trên URL), usePermission, useStream
├── components/
│   ├── ui/                  # Primitive: Button, Input, Select, Textarea, Dialog, Badge, Tabs, Skeleton...
│   └── shared/              # Composite: DataTable, FilterBar, ConfirmDialog, FileUploader, Can, PageHeader...
├── routes/                  # router.tsx (lazy + loader), guards.tsx (PermissionRoute), paths.ts
├── pages/                   # Trang chung: 404, 403, Error
├── test/                    # setup.ts; msw/ (API giả chỉ dùng trong test); contract/ (FE ↔ BE)
└── features/                # Mỗi feature: api / hooks / components / pages / schemas / constants / index.ts
    ├── auth/                # Đăng nhập, phiên
    ├── users/, departments/ # Quản trị (Admin)
    ├── jobs/                # Danh sách, tạo/sửa job, trình chỉnh tiêu chí + AI gợi ý
    ├── applications/        # Bảng hồ sơ có lọc; chi tiết: điểm, bằng chứng, CV, trạng thái, lịch sử, ghi chú
    ├── ranking/             # Bảng xếp hạng + thanh trọng số (công thức điểm ở lib/score.ts)
    ├── ai-chat/             # Chat tìm ứng viên, stream, trích dẫn
    ├── dashboard/           # Tổng quan
    └── public-jobs/         # Trang tuyển dụng công khai + form nộp CV
```

## Luồng xác thực

1. Đăng nhập: backend trả `accessToken` trong body và đặt refresh token vào cookie httpOnly. Frontend lưu `user` + `accessToken` vào store, **chỉ trong bộ nhớ** (không dùng localStorage, để script độc không đọc được).
2. Mỗi request tự gắn `Authorization: Bearer <accessToken>`.
3. Khi API trả `401`, axios tự gọi `/auth/refresh` (cookie tự gửi kèm) để lấy token mới rồi gửi lại request. Nhiều request cùng lỗi thì dùng chung một lần refresh, vì refresh token xoay vòng.
4. Tải lại trang: loader gốc của router chạy `restoreSession()` (`features/auth/session.ts`) để lấy lại access token từ cookie và tải user, trước khi guard kiểm tra.
5. Refresh thất bại thì phiên bị xoá, `ProtectedRoute` tự chuyển về trang đăng nhập. Đăng nhập lại xong sẽ quay về trang cũ.

## Thêm một tính năng mới

1. Tạo thư mục `src/features/<ten>/` với các phần `api/`, `hooks/`, `pages/` (theo mẫu `features/jobs`).
2. `api/`: hàm gọi API dùng `api` từ `@/lib/api-client`, trả về `res.data.data`.
3. `hooks/`: bọc API bằng `useQuery` / `useMutation`, khai báo query key dạng phân cấp để dễ làm mới dữ liệu.
4. Thêm đường dẫn vào `routes/paths.ts` và route vào `routes/router.tsx`, bọc bằng `requires(Permission.X, [...])`.
5. Thêm link vào `navGroups` trong `app/layouts/MainLayout.tsx` (kèm permission) và handler giả cho test trong `src/test/msw/handlers/`.
6. Export những gì feature khác cần dùng qua `features/<ten>/index.ts`. oxlint chặn import sâu kiểu `@/features/<ten>/hooks/...` từ bên ngoài feature.

Import trong `src` dùng alias `@/`, ví dụ `import { Button } from '@/components/ui'`.

## Lưu ý

- Thêm package mới mà npm báo lỗi `Cannot read properties of null (reading 'edgesOut')`: dùng `npx npm@11 install <package>`.
