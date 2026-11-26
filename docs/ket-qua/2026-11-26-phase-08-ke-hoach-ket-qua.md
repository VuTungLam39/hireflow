# Kết quả phiên — Phase 08 kế hoạch, 26/11/2026

- Kế hoạch: `docs/redesign/phase-08/README.md` (bước 8a–8f, ma trận, ngưỡng đề xuất).
- Chưa chạy kiểm thử, chưa sửa code, chưa commit. Chờ duyệt Q1–Q5.

## Cập nhật: kế hoạch đã duyệt; 8a, 8b
- 8a: PR #177, merge `33fc67f`. Test FE chờ lâu hơn khi máy bận; cả bộ 5/5 lần xanh; dưới tải cực nặng vẫn còn 1/3 lần trượt.
- 8b: `@playwright/test`, `fe/e2e/`, 26 ảnh baseline, tài liệu 01, 02, 04. E2E trình duyệt chạy local, chưa vào CI.
- 8c: kết quả ở 03, 05, 07. 204/204 lượt truy cập đúng, axe 0 serious/critical, không có P0–P2; 4 mục P3 (K-02…K-05). Chưa smoke nội bộ production. Commit trên nhánh `docs/phase08-8c-results`, chưa push, chưa merge.

## Sửa K-02, K-05 (chiều 26/11)
- #180 (K-02) và #181 (K-05) đã merge; `/jobs`, `/companies`, `/api/health` production đạt.
- #183 (bổ sung K-05 sau review) chờ merge.
- K-04: đã xác minh 500 thay vì 404, tách #182.
- Còn lại: smoke production khu nội bộ bằng phiên Interviewer, HR/Admin (Chrome chưa kết nối).
- Cập nhật: #183, #184 đã merge; smoke production K-02 bằng phiên Interviewer và HR đạt. Phát hiện K-06 (ô "Phòng ban" trên trang sửa tin).

## 8d — hiệu năng (tối 26/11)
- a11y 100; perf đạt 5/6, `/login` trượt (−8, K-07). T1, T2-proxy đạt; T3 trượt số thao tác (K-08). Chi tiết: `docs/redesign/phase-08/06-performance-results.md`.

## 8e — Security Gate chạy lại (tối 26/11)
- W1–W8 PASS, W9 (bucket B2) chưa kiểm lại. LLM thật: 11 lượt gọi. Chi tiết: `docs/redesign/phase-08/03-e2e-results.md` §6.
