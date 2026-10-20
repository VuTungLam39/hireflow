# NCC Intern Project – Frontend

Giao diện web viết bằng **React 19 + TypeScript + Vite**, kết nối với backend NestJS trong thư mục `../be`.

## Công nghệ

| Mục đích | Thư viện |
| --- | --- |
| Build / dev server | Vite 8 |
| Routing | React Router 8 (lazy load từng trang) |
| Gọi API & cache dữ liệu | Axios + TanStack Query |
| State toàn cục (phiên đăng nhập) | Zustand (lưu vào localStorage) |
| Form & validate | React Hook Form + Zod |
| Giao diện | Tailwind CSS 4, thông báo bằng Sonner |
| Test | Vitest + Testing Library |
| Lint / format | oxlint, Prettier |

## Bắt đầu nhanh

Yêu cầu: Node.js >= 22 và backend đang chạy ở `http://localhost:3000` (xem `../be/README.md`).

```bash
npm ci
cp .env.example .env
npm run dev          # http://localhost:5173
```

Đăng nhập bằng tài khoản admin được seed ở backend: `admin@example.com` / `Admin@123`.

Khi dev, mọi request tới `/api/...` được Vite **proxy** sang backend, nên không phải cấu hình CORS.

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
├── main.tsx                # Điểm khởi động
├── app/providers.tsx       # QueryClient, Toaster, Devtools
├── config/env.ts           # Đọc & kiểm tra biến môi trường
├── lib/
│   ├── api-client.ts       # Axios: gắn token, tự refresh token khi 401
│   ├── errors.ts           # Lấy message lỗi, gắn lỗi validate từ server vào form
│   ├── query-client.ts     # Cấu hình TanStack Query
│   └── utils.ts            # cn(), formatDateTime()
├── stores/auth.store.ts    # Phiên đăng nhập (user, accessToken, refreshToken)
├── types/                  # Kiểu dữ liệu khớp với backend
├── hooks/                  # Hook dùng chung (useDebounce...)
├── components/
│   ├── ui/                 # Button, Input, Select, Card, Badge, Dialog, Pagination...
│   └── layout/             # MainLayout (có header), AuthLayout
├── routes/
│   ├── router.tsx          # Khai báo route
│   ├── guards.tsx          # ProtectedRoute, GuestRoute, RoleRoute
│   └── paths.ts            # Đường dẫn route
├── pages/                  # Trang chung: Home, 404, 403, Error
└── features/               # Chia theo tính năng
    ├── auth/               # api / hooks / schemas / pages (Login, Register)
    └── users/              # api / hooks / components / pages (quản lý user – Admin)
```

## Luồng xác thực

1. Đăng nhập → lưu `user`, `accessToken`, `refreshToken` vào store (tự lưu localStorage).
2. Mỗi request tự gắn `Authorization: Bearer <accessToken>`.
3. Khi API trả `401`, axios tự gọi `/auth/refresh` lấy token mới rồi gửi lại request. Nhiều request cùng lỗi sẽ dùng chung một lần refresh.
4. Refresh thất bại → xoá phiên → `ProtectedRoute` tự chuyển về trang đăng nhập, sau khi đăng nhập lại sẽ quay về trang cũ.

## Thêm một tính năng mới

1. Tạo thư mục `src/features/<ten>/` với các phần `api/`, `hooks/`, `pages/` (theo mẫu `features/users`).
2. `api/`: hàm gọi API dùng `api` từ `@/lib/api-client`, trả về `res.data.data`.
3. `hooks/`: bọc API bằng `useQuery` / `useMutation`, khai báo query key dạng phân cấp để dễ làm mới dữ liệu.
4. Thêm đường dẫn vào `routes/paths.ts` và route vào `routes/router.tsx` (bọc trong `RoleRoute` nếu cần phân quyền).
5. Thêm link vào `navItems` trong `components/layout/MainLayout.tsx`.

Import trong `src` dùng alias `@/`, ví dụ `import { Button } from '@/components/ui'`.

## Lưu ý

- Token đang lưu trong localStorage cho đơn giản. Nếu cần bảo mật cao hơn, nên chuyển refresh token sang cookie `httpOnly` (cần sửa cả backend).
- Thêm package mới mà npm báo lỗi `Cannot read properties of null (reading 'edgesOut')`: dùng `npx npm@11 install <package>`.
