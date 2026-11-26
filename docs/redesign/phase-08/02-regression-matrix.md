# 02 — Ma trận regression (Route × Actor × State × Viewport × Browser)

Nguồn: `fe/src/routes/router.tsx`, `be/src/common/permissions/role-permissions.ts` (26/11/2026).

**Ký hiệu:** `✔` phải vào được · `✖` phải bị chặn (Forbidden hoặc chuyển hướng) · kết quả ghi `PASS` / `FAIL` / `BLK` / `—` (chưa chạy).
**Actor:** G khách · AD admin công ty · HR · HM hiring manager · IV interviewer · PF quản trị sàn.

## A. Truy cập theo vai (kết quả ở 8c)

| # | Route | CR | G | AD | HR | HM | IV | PF | Kết quả |
|---|---|---|---|---|---|---|---|---|---|
| R01 | `/jobs`, `/jobs/:id`, `/companies`, `/companies/:slug` | 01–04 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| R02 | `/careers`, `/chinh-sach-du-lieu` | | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| R03 | `/employers/register`, `/employers/check-email`, `/verify-email` | | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| R04 | `/applications/track` (token) | 13 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| R05 | `/login`, `/forgot-password`, `/reset-password` | 05 | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | — |
| R06 | `/` | 06 | ✖ | ✔ | ✔ | ✔ | ✖ | ✖ | — |
| R07 | `/interviews` | | ✖ | ✔ | ✔ | ✔ | ✔ | ✖ | — |
| R08 | `/manage/jobs` | 07 | ✖ | ✔ | ✔ | ✔ | ✔ | ✖ | — |
| R09 | `/manage/jobs/new` | | ✖ | ✔ | ✔ | ✖ | ✖ | ✖ | — |
| R10 | `/manage/jobs/:id/edit` (cổng route `job:read`) | | ✖ | ✔ | ✔ | ✔ | ✔ | ✖ | — |
| R11 | `/manage/jobs/:id/ranking` | 10 | ✖ | ✔ | ✔ | ✔ | ✔ | ✖ | — |
| R12 | `/manage/jobs/:id/matches` | | ✖ | ✔ | ✔ | ✖ | ✖ | ✖ | — |
| R13 | `/applications`, `/applications/:id` | 08, 09 | ✖ | ✔ | ✔ | ✔ | ✔ (được giao) | ✖ | — |
| R14 | `/candidates`, `/candidates/:id` | 11 | ✖ | ✔ | ✔ | ✔ | ✖ | ✖ | — |
| R15 | `/ai-chat` | | ✖ | ✔ | ✔ | ✔ | ✖ | ✖ | — |
| R16 | `/users`, `/departments`, `/admin/ai-queue`, `/admin/audit-logs` | | ✖ | ✔ | ✖ | ✖ | ✖ | ✖ | — |
| R17 | `/admin/company` | | ✖ | ✔ | ✔ | ✖ | ✖ | ✖ | — |
| R18 | `/platform/companies`, `/:id`, `/platform/queues` | 12 | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | — |
| R19 | đường dẫn lạ (404) | | → login | ✔ | ✔ | ✔ | ✔ | ✔ | — |

## B. Luồng nghiệp vụ theo vai (8c)

| # | Luồng | Actor | Kết quả |
|---|---|---|---|
| F01 | Đăng nhập, đăng xuất, hết phiên, sai mật khẩu | mọi vai | — |
| F02 | Tìm, lọc tin → xem → nộp CV → email theo dõi → rút | G | — |
| F03 | Tạo, sửa, đăng, đóng, nhân bản tin | AD, HR | — |
| F04 | Danh sách hồ sơ → duyệt CV → đổi trạng thái kèm lý do; hàng loạt | HR | — |
| F05 | Xếp hạng, trọng số; ứng viên cũ phù hợp | HR | — |
| F06 | Kho ứng viên, sửa liên hệ, xoá dữ liệu | HR, AD | — |
| F07 | Xếp lịch phỏng vấn → phiếu đánh giá | HR, IV | — |
| F08 | Offer: soạn → duyệt → kết quả | HR, HM | — |
| F09 | Hỏi kho CV | HR, HM | — |
| F10 | Người dùng, phòng ban, công ty, hàng đợi, nhật ký | AD | — |
| F11 | Đăng ký công ty → xác thực → duyệt, khoá | G, PF | — |

## C. Trạng thái (8c, trên mỗi vùng ưu tiên §08.3)

| Vùng | Mặc định | Đang tải | Rỗng | Lỗi + thử lại | Không quyền |
|---|---|---|---|---|---|
| Dashboard, tin, hồ sơ, ứng viên, duyệt CV, xếp hạng, phỏng vấn, phiếu, Offer, quản trị, trang công khai | — | — | — | — | — |

## D. Viewport × Browser

| Phạm vi | 390 | 768 | 1024 | 1440 | Chromium | Firefox | WebKit |
|---|---|---|---|---|---|---|---|
| Trang công khai + `/login` + 404 | PASS (8b) | — | — | PASS (8b) | PASS (8b) | PASS (8b) | PASS (8b) |
| Route trọng yếu nội bộ CR-06…12 | PASS (8b) | — | — | PASS (8b) | PASS (8b) | không phủ | không phủ |
| Route còn lại | — | — | — | — | — | không phủ | không phủ |

`PASS (8b)` chỉ nghĩa là trang tải được, không tràn ngang và khớp ảnh baseline; trang công khai thêm 1 h1 và không lỗi JS.

## E. Production (chỉ đọc, phiên Chrome của chủ dự án)
Khách: Claude tự chạy. AD, HR, HM, IV, PF: chủ dự án đăng nhập từng vai; vai không phủ được ghi `BLK`.
