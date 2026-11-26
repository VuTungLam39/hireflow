# Phase 08 — QA, Regression & Release

Trạng thái: **kế hoạch đã duyệt** (chủ dự án, 26/11/2026). Chuẩn: master plan §08.

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
