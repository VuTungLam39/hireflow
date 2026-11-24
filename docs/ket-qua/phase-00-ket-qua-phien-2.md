# Phase 00 — Kết quả phiên 2 (sau checkpoint A–C)

> Ngày: 24/11/2026 · Nhánh khảo sát: `main` @ `04ac5b7` · Chi tiết: `docs/redesign/phase-00/` (README + file 01–17 + `screenshots/guest/`)
> **Trạng thái Phase 00: PARTIALLY PASSED** — phần sau đăng nhập vẫn Blocked vì chưa có tài khoản test.

## 1. Quyết định của chủ dự án đã ghi vào decision log (README §2)

| ID | Nội dung |
|---|---|
| DL-01 | Duyệt route quan trọng CR-01..CR-13; `/ai-chat` không vào danh sách nhưng gắn cờ cho Security Gate (bề mặt LLM) |
| DL-02 | Ứng viên là khách, xác thực bằng link token, không có tài khoản — đã sửa mô hình actor (file 05) |
| DL-03 | Đóng finding `/jobs` 12 link: phân trang 12 tin/trang, "1–12 trong 13", trang 2 có 1 tin |
| DL-04 | `/manage/jobs/:id/edit` chỉ chặn bằng `job:read` → file 15 (D-07), file 17 (SG-F1), gắn cờ Security Gate |
| DL-05 | Thêm backlog Phase 01: trợ năng của primitive tự viết (P01-A11Y-PRIM) |
| DL-06 | Dữ liệu demo được chấp nhận làm bộ dữ liệu kiểm chứng (giới hạn đã chấp nhận); tài khoản test vẫn chờ |

## 2. Việc đã làm (không cần đăng nhập)

- **38 ảnh chụp** cho khách: CR-01..05, CR-13 × {mặc định, đang tải, lỗi, rỗng (giả lập)} × {1440, 390} + route nội bộ khi là khách.
- **Lighthouse** (mobile, 1 lần chạy): `/jobs` hiệu năng 97, `/companies` 81, `/login` 76; trợ năng đều 100; SEO `/login` 63.
- **axe-core** trên 6 trang công khai: 0 vi phạm.
- Kiểm tra bàn phím, heading, landmark, chồng lấn header theo nhiều chiều rộng.
- Viết xong file 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17 và cập nhật README (Skill/Tool log, DoD).

## 3. Phát hiện mới quan trọng

1. **Header trang công khai bị chồng chữ ở 320–430 px** ("Công ty"/"Việc làm" đè "Nhà tuyển dụng") — lỗi thật, Lighthouse/axe không bắt được. Dự kiến P1.
2. **Trang công khai được prerender và bản prerender đã cũ**: khi API lỗi vẫn hiện "15 vị trí" (thực tế 13); trạng thái đang tải/lỗi gần như không bao giờ hiện ra; logo hỏng khi media lỗi.
3. `/login`: 2 thẻ h1, không có skip link, có một điểm focus không nhìn thấy.
4. Lịch phỏng vấn chặn bằng `application:read`; chuỗi chuyển hướng theo vai `/` → `/interviews` → `/platform/companies`.
5. Trùng lặp: ngoài DataTable có 5 bảng `<table>` tự viết; có 5 kiểu modal khác nhau.
6. `axe-core` đã có trong dự án, chỉ dùng trong script QA thủ công `scripts/qa/phase3.mjs`.

## 4. Còn chặn

Tài khoản Admin, HR, Hiring Manager, Interviewer, platform_admin → để hoàn tất phần chạy thực tế của file 05, workflow nội bộ (06), trạng thái/ảnh/đáp ứng/trợ năng/hiệu năng của trang nội bộ, và chạy `/grill-with-docs` cuối phase.

## 5. Phạm vi đã giữ

Không sửa mã nguồn, không cài dependency vào dự án (Lighthouse/axe chạy tạm ngoài dự án), không commit, không gửi form hay thao tác ghi dữ liệu trên production.
