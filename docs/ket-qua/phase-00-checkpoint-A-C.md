# Phase 00 — Checkpoint sau Workstream A–C

> Ngày: 24/11/2026 · Nhánh khảo sát: `main` @ `04ac5b7` (worktree chỉ đọc) · Trang live: https://hireflow-gray-zeta.vercel.app
> Trạng thái: **Đang làm — dừng tại checkpoint A–C, chờ tài khoản test để làm D–J.**
> Chi tiết đầy đủ: `docs/redesign/phase-00/` (`README.md`, `01-repository-map.md`, `02-architecture-map.md`, `03-route-and-page-inventory.md`).

## 1. Kiểm tra công cụ

| Công cụ | Kết quả |
|---|---|
| `playwright-cli` 0.1.25 | Đạt — mở trình duyệt, chụp màn hình, DOM snapshot trang live |
| Lighthouse | Chưa cài trên máy — sẽ chạy tạm qua npx ngoài project ở Workstream I, hoặc ghi nhận hạn chế |
| `/diagnosing-bugs`, `/grill-with-docs` | Có SKILL.md, chưa cần dùng |

## 2. Điều kiện đầu vào [D-06]

| # | Điều kiện | Trạng thái |
|---|---|---|
| 1 | Truy cập repo + nhánh | Đạt (`main` @ `04ac5b7`) |
| 2 | Tài khoản test theo vai trò | **Chưa đạt** — chủ dự án sẽ cung cấp |
| 3 | Bộ dữ liệu kiểm chứng | **Chưa rõ** — live chạy dữ liệu demo |
| 4 | Truy cập trang live | Đạt |

→ Khi (2)/(3) chưa đạt, Phase 00 tối đa **PARTIALLY PASSED**.

## 3. Sự thật đã kiểm chứng

- **Stack (mã nguồn):** React 19.3, Vite 8, TS 7, React Router 8, TanStack Query 5, Zustand 5, RHF + Zod 4, Tailwind 4, Sonner, MSW, Vitest, oxlint — khớp plan §2.1.
- **Lệch so với plan:**
  - Không dùng Radix — mọi primitive (Dialog, Popover, Tabs…) tự viết.
  - `axe-core` 4.10.2 đã có trong devDependencies dù plan để Phase 01.
- **Kiến trúc (mã nguồn):** 18 feature module, không có import sâu vi phạm quy tắc; `jobs` và `applications` là trung tâm phụ thuộc chéo; trạng thái danh sách nằm trên URL; access token chỉ trong bộ nhớ, refresh token là cookie httpOnly; vercel.json chuyển `/api` về cùng origin.
- **Route:** 10 công khai, 1 khách (`/login`), 20 nội bộ chặn theo permission, cộng 4 dialog mở qua URL `?xem=application|candidate|job:<id>`. Màn xem CV nằm trong `/applications/:id`.
- **platform_admin:** có trong mã nguồn FE và BE (enum, migration 024, quyền `platform:manage`, 3 route `/platform/*`, seed `platform@example.com`). Chạy thực tế: chờ đăng nhập.
- **Không có tài khoản ứng viên:** ứng viên là khách, theo dõi hồ sơ qua link token `/applications/track` — lệch với plan (coi Candidate là vai có tài khoản).
- **Không có route quên/đặt lại mật khẩu** (Missing).
- **Trên live (khách):** `/jobs`, `/companies` (3 công ty: hireflow-demo, vi-may, cho-lanh), trang công ty, trang tin, chính sách, đăng ký nhà tuyển dụng đều mở được; `/careers` chuyển về `/companies/hireflow-demo`; mọi route nội bộ chuyển về `/login`.

## 4. Vấn đề phát hiện (sẽ vào file 15/17)

1. Route `*` (404) nằm trong nhánh cần đăng nhập → khách gõ URL sai bị đẩy về `/login` thay vì thấy trang 404 (đã thấy trên live).
2. Mỗi lần khách vào route nội bộ, console báo một lỗi 401 do thử refresh phiên.
3. `/manage/jobs/:id/edit` chỉ chặn bằng `job:read`, lỏng hơn quyền sửa.
4. README còn ghi production là "v2-demo, chờ phát hành MVP 3", trong khi live đã chạy MVP 3.
5. `/jobs` hiện 12 link tin ở lần tải đầu, plan ghi 15 — chưa rõ do phân trang.
6. Một số trang dùng tiêu đề tab chung "HireFlow" (login, đăng ký nhà tuyển dụng, xác nhận email).

## 5. Danh sách route quan trọng [D-07] — cần chủ dự án duyệt

CR-01 `/jobs` · CR-02 `/jobs/:id` · CR-03 `/companies` · CR-04 `/companies/:slug` · CR-05 `/login` · CR-06 `/` · CR-07 `/manage/jobs` · CR-08 `/applications` · CR-09 `/applications/:id` (gồm xem CV) · CR-10 `/manage/jobs/:id/ranking` · CR-11 `/candidates` · CR-12 `/platform/companies` · CR-13 `/applications/track`.

Điểm cần duyệt: giữ CR-11 và CR-13; loại `/ai-chat` (vẫn đánh dấu cho Security Gate).

## 6. Đang chặn

Workstream D, E và phần sau đăng nhập của G/H/I cần tài khoản Admin, HR, Hiring Manager, Interviewer, platform_admin. Tài khoản chỉ dùng để xem, không ghi mật khẩu vào tài liệu, không thao tác làm thay đổi dữ liệu production.

## 7. Phạm vi đã giữ

- Không sửa mã nguồn, không đổi dependency, không commit.
- Chưa gửi thử form đăng ký nhà tuyển dụng hay nộp hồ sơ trên live (sẽ tạo dữ liệu thật).
