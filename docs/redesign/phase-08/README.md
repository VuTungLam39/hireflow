# Phase 08 — QA, Regression & Release

Trạng thái: **8a–8f đã làm; kết luận release gate chờ chủ dự án** (`08-release-checklist.md`). Kế hoạch duyệt 26/11/2026. Chuẩn: master plan §08.

## 1. Đã có sẵn
- CI: BE format/lint/typecheck/unit/build/e2e/coverage/audit; FE format/lint/typecheck/test/build/check:design/tokens/terms/bundle/audit.
- Lần gần nhất: FE 367 test (6c), BE unit 472, e2e 366 (#129).
- `fe/scripts/qa/` (puppeteer: sweep, responsive, keyboard, flows), `axe-core` đã cài.
- Baseline Phase 01: T1 2 thao tác ≈1.02 s; T2-proxy 3 thao tác ≈2.0 s; T3 3 click ≈2.26 s; axe 0 trên 27 trang×vai; Lighthouse công khai perf 79–100, a11y 100.
- Chưa có: `@playwright/test`, ảnh baseline.

## 2. Môi trường
| Việc | Ở đâu |
|---|---|
| Ma trận đầy đủ, kể cả thao tác ghi | Local, seed demo (Docker) |
| Smoke chỉ đọc, T1/T2-proxy/T3, Lighthouse | Production (như baseline) |

Production không ghi dữ liệu.

## 3. Ma trận regression (Route × Actor × State × Viewport × Browser)
- **Actor:** Khách, Admin công ty, HR, Hiring Manager, Interviewer, Quản trị sàn.
- **Vùng ưu tiên:** đăng nhập/phân quyền, dashboard, tin tuyển dụng, hồ sơ, hồ sơ ứng viên, duyệt CV, xếp hạng, phỏng vấn, phiếu đánh giá, Offer, quản trị, 401/403/not-found, phục hồi lỗi.
- **State:** mặc định, đang tải, rỗng, lỗi + thử lại, không có quyền.
- **Viewport:** 390 và 1440 đầy đủ; 768 và 1024 smoke.
- **Browser:** Chromium đầy đủ; Firefox, WebKit smoke trang công khai.

Chỉ đưa vào chức năng đã kiểm chứng là tồn tại (§08.3).

## 4. Các bước (mỗi bước có thay đổi code = 1 PR revert được, §05.5)

| Bước | Nội dung | Xong khi | Deliverable |
|---|---|---|---|
| 8a | Sửa `detail-dialog.test.tsx` chập chờn (chẩn đoán trước) | cả bộ FE xanh 5 lần liên tiếp ở local | — |
| 8b | Chiến lược test, ma trận; ảnh baseline route trọng yếu (390, 1440) | ma trận đủ ô, baseline trong `visual-baseline/` | 01, 02, 04 |
| 8c | Chạy E2E theo vai + trạng thái; axe + bàn phím | mọi ô có kết quả; lỗi xếp P0–P3 | 03, 05, 07 |
| 8d | Lighthouse, kích thước bundle, đo lại T1–T3 | có bảng so với baseline | 06 |
| 8e | Chạy lại Security Gate (cô lập công ty, prompt injection, trung thực trích dẫn) | PASS/FAIL từng mục | 03 |
| 8f | Rollback, checklist phát hành, release notes | release gate §08.4 có kết luận từng dòng | 08, 09, 10 |

Lỗi tìm được: ghi vào 07 trước; sửa ở PR riêng sau khi chủ dự án chọn. P0 báo ngay. Screen reader: cần người nghe thật, mặc định ghi là chưa kiểm.

## 5. Ngưỡng đề xuất (release gate)
- Không P0; P1 chỉ khi chủ dự án chấp nhận rõ.
- axe: 0 lỗi serious/critical.
- Lighthouse công khai: a11y 100; perf mỗi trang không thấp hơn baseline quá 5 điểm.
- T1, T3: số thao tác không tăng, thời gian ≤ baseline +20%. T2-proxy: ≤ 3 thao tác và ghi nhận so với ngưỡng RR-08 (≤ 2).
- Monitoring: dự án không dùng Sentry (quyết định 15/11); đề xuất tính `/api/health` + log Render là đủ cho bản demo.

## 6. Quyết định (chủ dự án, 26/11/2026)
- **Q1:** thêm `@playwright/test` (devDependency, không vào bundle).
- **Q2:** duyệt ngưỡng §5. Cách hiểu "Monitoring" **hết hạn khi có dữ liệu công ty thật** (xét lại cùng đợt với R6). T2: trần cứng 3 thao tác, đồng thời ghi đối chiếu RR-08 (≤ 2).
- **Q3:** không gửi mật khẩu. Smoke nội bộ production: chủ dự án tự đăng nhập từng vai trong Chrome, Claude lái phiên đó, chỉ đọc (kể cả Quản trị sàn nếu chủ dự án muốn). Vai không phủ được → BLK. Ma trận đầy đủ và thao tác ghi chạy ở local.
- **Q4:** dùng LLM thật ở 8e, chỉ bộ eval/adversarial của gate, ghi số lượt gọi.
- **Q5:** tự mở PR, merge, smoke cho **8a và 8b**. 8c–8e chỉ tạo kết quả; lỗi sửa ở PR riêng do chủ dự án chọn (P0 báo ngay). 8f: không revert gì trên `main` khi chủ dự án vắng; kết luận release gate chờ chủ dự án.

## 7. Nhật ký phát hành (§05.5)
- **8a** — PR #177, merge `33fc67f` (26/11/2026). Smoke production: `/jobs` 200, `/companies` 200, `/api/health` 200. Chỉ đổi cấu hình test; tự rà diff trước merge, code-review hai trục chạy sau cùng với 8b.
- **8b** — PR #178, merge `23617d5` (26/11/2026). CI xanh; code-review hai trục, đã sửa phát hiện chính. Smoke production: `/jobs`, `/companies`, `/login` 200, `/api/health` 200 (không đổi mã sản phẩm). Rollback: revert PR.
- **K-02** — PR #180, merge `0d9254a` (26/11/2026, 13:48). **K-05** — PR #181, merge `7530d7b` (26/11/2026, 13:48). Cả hai được merge trên GitHub trước khi code-review chạy xong; review sau đó tìm một lỗi ở K-05, sửa ở PR #183 (chờ merge). Smoke production: `/jobs`, `/companies` 200, `/api/health` 200 (database, redis, storage up), Vercel và Render đã triển khai `7530d7b`. Khu nội bộ theo vai trên production: **BLK** (Chrome chưa kết nối). Rollback: revert PR.
- **K-05 bổ sung** — PR #183, merge `0b75469`; **8c** — PR #184, merge `b09def4` (26/11/2026). `/api/health` 200, Vercel triển khai xong.
- **Smoke production khu nội bộ cho K-02** (26/11/2026, phiên Chrome của chủ dự án, chỉ đọc). Interviewer: mở thẳng trang xếp hạng ra trang 403 có h1; trang sửa tin không còn "Xếp hạng"; `/` chuyển sang Lịch phỏng vấn; `/applications` vào được; `/candidates`, `/users` bị chặn. HR: trang xếp hạng có dữ liệu, trang sửa tin còn nút, tab "Xếp hạng" trong hộp thoại tin vẫn mở được. Admin, Hiring Manager, Quản trị sàn: chưa smoke production. Phát hiện thêm K-06.

## 8. Mang vào release gate (8f ghi đúng như dưới đây)
| Ngưỡng §5 | Kết quả theo ngưỡng | Xử lý |
|---|---|---|
| Lighthouse perf `/login` | **FAIL** (giả lập: 80 so với 88) | **Ngoại lệ được chủ dự án chấp nhận** (26/11/2026). Số đo mạng thật (`devtools`, máy local): LCP hiện tại 5,30 s, bản 24/11 5,79 s. K-07 hạ P3, giữ mở; không sửa code. Chi tiết: file 06 §5 |
| T3 số thao tác | **FAIL** (4 so với 3) | Lệch có chủ ý (F-04: bộ lọc công ty là ô chọn); **chờ chủ dự án xác nhận ở release gate** (K-08) |
