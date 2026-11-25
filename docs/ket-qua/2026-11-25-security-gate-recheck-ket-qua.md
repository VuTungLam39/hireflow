# Kết quả phiên — Security gate re-check, 25/11/2026

- Chạy lại W1–W7 trên local (main @ 467b872): tất cả PASS. Bổ sung test cho W3 (Interviewer/HM sửa job), W4 (refresh sau khi khoá công ty), W6 (token chỉ tác động một hồ sơ).
- E2E 353/353, unit 468/468.
- W7 với LLM thật: CV đối kháng 2/2 đạt, injection 0/2, tiêu chí đúng 98/99.
- W8 production (467b872): job của 2 công ty khác trả 404 giống id ngẫu nhiên.
- Còn chờ chủ dự án: W9 (bucket B2 private).
- Phát hiện phụ: thêm upload thứ 12 vào `ai-pipeline.e2e` làm hồ sơ cuối kẹt PROCESSING — cần chẩn đoán riêng.
- Kết luận: W1–W8 PASS; gate chỉ còn chờ W9.
