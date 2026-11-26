# 02 — Ma trận regression (Route × Actor × State × Viewport × Browser)

Nguồn: `fe/src/routes/router.tsx`, `be/src/common/permissions/role-permissions.ts` (26/11/2026).

**Ký hiệu:** `✔` phải vào được · `✖` phải bị chặn (Forbidden hoặc chuyển hướng) · kết quả ghi `PASS` / `FAIL` / `BLK` / `—` (chưa chạy).
**Actor:** G khách · AD admin công ty · HR · HM hiring manager · IV interviewer · PF quản trị sàn.

## A. Truy cập theo vai (kết quả 8c, local)

| # | Route | CR | G | AD | HR | HM | IV | PF | Kết quả |
|---|---|---|---|---|---|---|---|---|---|
| R01 | `/jobs`, `/jobs/:id`, `/companies`, `/companies/:slug` | 01–04 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | PASS |
| R02 | `/careers`, `/chinh-sach-du-lieu` | | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | PASS |
| R03 | `/employers/register`, `/employers/check-email`, `/verify-email` | | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | PASS |
| R04 | `/applications/track` (token) | 13 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | PASS |
| R05 | `/login`, `/forgot-password`, `/reset-password` | 05 | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | PASS |
| R06 | `/` | 06 | ✖ | ✔ | ✔ | ✔ | ✖ | ✖ | PASS |
| R07 | `/interviews` | | ✖ | ✔ | ✔ | ✔ | ✔ | ✖ | PASS |
| R08 | `/manage/jobs` | 07 | ✖ | ✔ | ✔ | ✔ | ✔ | ✖ | PASS |
| R09 | `/manage/jobs/new` | | ✖ | ✔ | ✔ | ✖ | ✖ | ✖ | PASS |
| R10 | `/manage/jobs/:id/edit` (cổng route `job:read`) | | ✖ | ✔ | ✔ | ✔ | ✔ | ✖ | PASS |
| R11 | `/manage/jobs/:id/ranking` | 10 | ✖ | ✔ | ✔ | ✔ | ✖ (BR-INT-02) | ✖ | PASS, xem K-02 |
| R12 | `/manage/jobs/:id/matches` | | ✖ | ✔ | ✔ | ✖ | ✖ | ✖ | PASS |
| R13 | `/applications`, `/applications/:id` | 08, 09 | ✖ | ✔ | ✔ | ✔ | ✔ (được giao) | ✖ | PASS |
| R14 | `/candidates`, `/candidates/:id` | 11 | ✖ | ✔ | ✔ | ✔ | ✖ | ✖ | PASS |
| R15 | `/ai-chat` | | ✖ | ✔ | ✔ | ✔ | ✖ | ✖ | PASS |
| R16 | `/users`, `/departments`, `/admin/ai-queue`, `/admin/audit-logs` | | ✖ | ✔ | ✖ | ✖ | ✖ | ✖ | PASS |
| R17 | `/admin/company` | | ✖ | ✔ | ✔ | ✖ | ✖ | ✖ | PASS |
| R18 | `/platform/companies`, `/:id`, `/platform/queues` | 12 | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | PASS |
| R19 | đường dẫn lạ (404) | | ✔ (404 công khai) | ✔ | ✔ | ✔ | ✔ | ✔ | PASS |

## B. Luồng nghiệp vụ theo vai (8c)

| # | Luồng | Actor | Kết quả |
|---|---|---|---|
| F01 | Đăng nhập, đăng xuất, hết phiên, sai mật khẩu | mọi vai | PASS (trình duyệt; hết phiên chưa kiểm) |
| F02 | Tìm, lọc tin → xem → nộp CV → email theo dõi → rút | G | PASS (trình duyệt) |
| F03 | Tạo, sửa, đăng, đóng, nhân bản tin | AD, HR | PASS (API/component) |
| F04 | Danh sách hồ sơ → duyệt CV → đổi trạng thái kèm lý do; hàng loạt | HR | PASS (trình duyệt) |
| F05 | Xếp hạng, trọng số; ứng viên cũ phù hợp | HR | PASS (API/component) |
| F06 | Kho ứng viên, sửa liên hệ; ẩn danh dữ liệu (chỉ AD) | HR, AD | PASS (API/component) |
| F07 | Xếp lịch phỏng vấn → phiếu đánh giá | HR, IV | PASS (API/component) |
| F08 | Offer: soạn → duyệt → kết quả | HR, HM | PASS (API/component) |
| F09 | Hỏi kho CV | HR, HM | PASS (API/component) |
| F10 | Người dùng, phòng ban, công ty, hàng đợi, nhật ký | AD | PASS (API/component) |
| F11 | Đăng ký công ty → xác thực → duyệt, khoá | G, PF | PASS (API/component) |

## C. Trạng thái (8c, trên mỗi vùng ưu tiên §08.3)

| Vùng | Mặc định | Đang tải | Rỗng | Lỗi + thử lại | Không quyền |
|---|---|---|---|---|---|
| Đăng nhập / phân quyền | PASS | — | — | PASS (F01) | PASS |
| Dashboard | PASS | PASS | — | PASS | PASS |
| Tin tuyển dụng | PASS | PASS | PASS | PASS | PASS |
| Hồ sơ ứng tuyển | PASS | PASS | PASS | PASS | PASS |
| Hồ sơ ứng viên | PASS | PASS | PASS | PASS | PASS |
| Duyệt CV | PASS | PASS | — | PASS | PASS |
| Xếp hạng | PASS | PASS | — | PASS | K-02 |
| Phỏng vấn | PASS | PASS | — | PASS | PASS |
| Phiếu đánh giá | — | — | — | — | — |
| Offer | — | — | — | — | — |
| Quản trị | PASS | PASS | PASS | PASS | PASS |
| Trang công khai | PASS | PASS | PASS | PASS | — |
| 401 / 403 / not-found | PASS | — | — | — | PASS |
| Phục hồi lỗi | — | — | — | PASS | — |

## D. Viewport × Browser (kết quả 8b, 8c)

| Phạm vi | Chromium 390, 1440 | Firefox, WebKit 390, 1440 | 768, 1024 | Ảnh baseline |
|---|---|---|---|---|
| Trang công khai R01–R05 và 404 | PASS: 1 h1, không tràn, không lỗi JS | PASS: như cột trước | PASS: không tràn (8c) | chỉ CR-01…05, CR-13 (Chromium) |
| CR-06…11 (Admin công ty), CR-12 (quản trị sàn) | PASS: tải được, không tràn, khớp ảnh | không phủ | PASS: không tràn (8c) | có (Chromium) |
| Route còn lại | PASS: truy cập, tràn, axe (8c) | không phủ | PASS: không tràn (8c) | không |

Chưa phủ: CR-13 **có token** (cần link trong email), các tab bên trong hộp thoại; ảnh baseline cho vai HR, HM, IV.

## E. Production (chỉ đọc, phiên Chrome của chủ dự án)
Khách: Claude tự chạy. AD, HR, HM, IV, PF: chủ dự án đăng nhập từng vai; vai không phủ được ghi `BLK`.
