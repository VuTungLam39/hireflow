# 08 — Release checklist (8f, 26/11/2026)

Bản đánh giá: `main` @ `4ac96a7` (CI xanh, `/api/health` 200). Vì merge vào `main` là phát hành ngay (§05.5), phần redesign **đã chạy trên production**; gate này đánh giá bản đang chạy.

## Release gate §08.4
| # | Điều kiện | Bằng chứng | Kết quả |
|---|---|---|---|
| 1 | E2E trọng yếu đạt | 26/11 trên `4ac96a7`: BE unit 472/472, BE E2E 366/366, FE vitest 368/368, Playwright 16/16 và 3 luồng ghi 3/3 (bản sao DB, AI giả) | **PASS** |
| 2 | Không P0 chưa xử lý | `07-known-issues.md` | **PASS** |
| 3 | Không P1 chưa được chấp nhận | `07-known-issues.md`: không có P1 | **PASS** |
| 4 | Không hồi quy phân quyền | truy cập 204/204 (6 vai × 34 đường dẫn); W1–W6, W8 | **PASS** |
| 5 | Không hồi quy bảo mật (Security Gate chạy lại) | `03-e2e-results.md` §6: W1–W9 | **PASS** |
| 6 | Không hồi quy toàn vẹn dữ liệu | BE E2E; luồng nộp, rút, đổi trạng thái; K-06 lưu tin giữ phòng ban | **PASS** |
| 7 | Lỗi accessibility chặn phát hành đã xử lý hoặc được chấp nhận | axe 0 critical/serious (còn 1 loại moderate, K-03); bàn phím 6/6 (vai Admin). **Screen reader chưa kiểm** | **PASS phần tự động**; chủ dự án cần nhận phần screen reader |
| 8 | Smoke responsive | 1440/1024/768/390: 0 tràn ngang trên 204 lượt | **PASS** |
| 9 | Hiệu năng đạt ngưỡng đã chốt | xem bảng dưới | **FAIL theo ngưỡng ở 2 mục** |
| 10 | Monitoring sẵn sàng | `/api/health` (database, redis, storage) + log Render, theo cách hiểu đã duyệt; hết hạn khi có dữ liệu công ty thật. Log Render chưa được Claude xem | **PASS** theo Q2 |
| 11 | Chiến lược rollback sẵn sàng | `09-rollback-plan.md`, đã diễn tập local 2 PR | **PASS** |
| 12 | Release notes | `10-release-notes.md` | **PASS** |

### Mục 9 — ghi đúng như README §8
| Ngưỡng §5 | Kết quả theo ngưỡng | Xử lý |
|---|---|---|
| Lighthouse a11y 100 | PASS | |
| Lighthouse perf 5 trang công khai còn lại | PASS | |
| Lighthouse perf `/login` | **FAIL** (giả lập: 80 so với 88) | **Ngoại lệ được chủ dự án chấp nhận** (26/11/2026). Số đo mạng thật (`devtools`, máy local): LCP hiện tại 5,30 s, bản 24/11 5,79 s. K-07 P3, giữ mở |
| T1; T2-proxy ≤ 3 thao tác | PASS (RR-08 ≤ 2 chưa đạt) | |
| T3 số thao tác | **FAIL** (4 so với 3) | Lệch có chủ ý (F-04); **chờ chủ dự án xác nhận** (K-08) |

T1/T2 không chậm hơn baseline (§08.2 Outcome Metrics).

## DoD §08.7
| Mục | Trạng thái |
|---|---|
| Ma trận regression đã kiểm | ✔ truy cập, trạng thái, ảnh, 3 engine (chỉ smoke trang công khai); F03, F05–F11 chỉ qua test API và component |
| Luồng trọng yếu đã xác minh | ✔ F01, F02, F04 qua trình duyệt |
| Accessibility đã rà | ✔ trừ screen reader |
| Đã đo hiệu năng; đo lại T1–T3 | ✔ `06-performance-results.md` |
| Ghi lỗi đã biết | ✔ `07` |
| Rollback, checklist, release notes | ✔ `08`–`10` |

## So khớp tính nhất quán (§01.3)
`impeccable detect fe/src`: **7 mục advisory** `design-system-font-size` (`BrandMark.tsx` 2, `index.css` 5), baseline Phase 01 là 0. Không mục nào mức lỗi (K-09).

## Phụ thuộc (không thuộc §08.4)
`npm audit --omit=dev`: FE 0; BE 3 mức moderate (`typeorm` → `glob`, `minimatch`), sửa tự động đòi đổi phiên bản phá vỡ; không có mức high.

## Chưa kiểm
Screen reader; smoke production vai Admin công ty, Hiring Manager, Quản trị sàn cho các màn nội bộ; thao tác ghi trên production; quên mật khẩu bằng hộp thư thật (SG-06); phản hồi của phiếu đánh giá, Offer, hỏi kho CV trên trình duyệt.

## Kết luận release gate — **CHỜ CHỦ DỰ ÁN**
Cần chủ dự án quyết:
1. T3 (K-08): xác nhận lệch có chủ ý?
2. Screen reader chưa kiểm: chấp nhận cho bản demo?
3. Kết luận chung: PASS / PASS có điều kiện / FAIL.

Đề xuất của người đánh giá (không phải kết luận): **PASS có điều kiện cho bản demo** — chấp nhận mục 1 và 2; điều kiện: trước khi đưa dữ liệu công ty thật phải xét lại Monitoring, R6 (SG-06), SG-08 và screen reader.

| Kết luận | Người quyết | Ngày |
|---|---|---|
| | | |
