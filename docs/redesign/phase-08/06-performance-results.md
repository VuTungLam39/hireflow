# 06 — Hiệu năng và T1–T3 (8d, 26/11/2026)

Môi trường: production, `main` @ `b09def4`, chỉ đọc. Baseline: Phase 01 (file `01-executive-summary.md` §2, `11-performance-audit.md` §1). Ngưỡng: README §5.

## 0. Kết luận
| Ngưỡng §5 | Kết quả |
|---|---|
| Lighthouse a11y 100 (6 trang công khai) | **PASS** |
| Lighthouse perf không thấp hơn baseline quá 5 | **FAIL** ở `/login` (−8); 5 trang còn lại PASS |
| T1: số thao tác không tăng, thời gian ≤ +20 % | **PASS** |
| T2-proxy ≤ 3 thao tác | **PASS**; RR-08 (≤ 2) chưa đạt |
| T3: số thao tác không tăng, thời gian ≤ +20 % | **FAIL** số thao tác (4 so với 3); thời gian PASS |

## 1. Lighthouse 12.8.2 (mobile giả lập, trung vị 3 lượt)
| Route | Perf (các lượt) | Trung vị / baseline | A11y | BP | SEO | LCP / baseline | FCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| CR-01 `/jobs` | 92/98/97 | 97 / 99 (−2) | 100 | 100 | 100 | 1,67 / 1,13 s | 1,67 s | 156 ms | 0,017 |
| CR-02 `/jobs/:id` | 96/98/95 | 96 / 96 (0) | 100 | 100 | 100 | 1,57 / 1,15 s | 1,57 s | 149 ms | 0,002 |
| CR-03 `/companies` | 99/89/99 | 99 / 100 (−1) | 100 | 100 | 100 | 1,86 / 1,14 s | 1,41 s | 94 ms | 0 |
| CR-04 `/companies/vi-may` | 97/99/99 | 99 / 100 (−1) | 100 | 100 | 100 | 1,67 / 1,21 s | 1,56 s | 103 ms | 0,001 |
| CR-05 `/login` | 81/80/79 + 5 lượt thêm 81/80/80/81/80 | **80 / 88 (−8)** | 100 | 100 | 63 | **4,16 / 3,11 s** | 2,99 s | 34 ms | 0 |
| CR-13 `/applications/track` (không token) | 80/81/78 | 80 / 79 (+1) | 100 | 96 | 63 | 4,19 / 4,18 s | 3,12 s | 73 ms | 0 |

- LCP của các trang prerender tăng 0,4–0,7 s nhưng điểm vẫn trong ngưỡng.
- `/login` (K-07): FCP gần như không đổi (3,02 → 2,99 s), LCP chậm thêm ≈1 s. Phần tử LCP là đoạn chữ dưới biểu mẫu ("Nhân viên công ty: …"), chờ JS rồi mới vẽ. Lighthouse ước 70 % chunk `vendor` không dùng ở trang này. **Nguyên nhân chưa xác minh.**
- BP 96 ở CR-13: lỗi console khi không có token (baseline cũng 96). SEO 63 ở trang không lập chỉ mục, như baseline.

## 2. T1–T3 (3 lượt, trung bình)
| Việc | Thao tác / baseline | Thời gian / baseline | Các lượt |
|---|---|---|---|
| T1 tìm "Đỗ Minh Khôi", mở xem nhanh | 2 / 2 | **0,77 s** / 1,02 s | 880 / 734 / 681 ms |
| T2-proxy: "Mở chi tiết" → thấy trích dẫn và "Chuyển trạng thái" | 3 / 3 (gồm T1) | bước này **0,21 s** / 0,95 s; cộng T1 ≈0,97 s / ≈2,0 s | 378 / 153 / 87 ms |
| T3 lọc Ví Mây → tin → trang công ty | **4** / 3 | **1,02 s** / 2,26 s | 1102 / 1053 / 911 ms |

- T3 (K-08): bộ lọc công ty nay là ô chọn (mở, rồi chọn) thay cho một cú bấm. Đây là thay đổi chủ ý cho F-04. Không lọc thì chỉ 2 thao tác (592 / 995 / 635 ms), nhưng không đúng định nghĩa T3.
- T2 đúng định nghĩa (ghi một đánh giá) không đo: production chỉ đọc.

**Khác cách đo với baseline, nên chỉ so thời gian ở mức tham khảo:** T1/T2 chạy bằng script trong phiên Chrome HR của chủ dự án (rộng 1536, cache đã ấm) thay cho Playwright 1440; T3 vẫn Playwright, context mới mỗi lượt. Không tính thời gian người đọc.

## 3. Bundle (vite build, gzip mức 9, JS+CSS mà `index.html` tải hoặc preload)
| Mốc | Route vào |
|---|---|
| Trước Radix (Phase 05) | 291,21 KB |
| Sau giảm bundle (Phase 05, entry 4) | 288,44 KB |
| `main` @ `b09def4` | **299,03 KB** (19 tệp; `vendor` 137,66, `react` 95,68, CSS 15,49) |

Toàn bộ JS+CSS: 433,87 KB (79 tệp). §5 không đặt ngưỡng bundle; ghi để theo dõi (+10,6 KB).

## 4. Chưa đo
Thời gian nội bộ khác của Phase 01 (`/manage/jobs` tải nguội, thời gian tới thông báo lỗi), bảng xếp hạng, Render khởi động nguội, Lighthouse trang đăng nhập rồi.
