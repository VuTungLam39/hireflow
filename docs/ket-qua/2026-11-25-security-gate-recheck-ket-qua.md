# Kết quả phiên — Security gate re-check, 25/11/2026

- Chạy lại W1–W7 trên local (main @ 467b872): tất cả PASS. Bổ sung test cho W3 (Interviewer/HM sửa job), W4 (refresh sau khi khoá công ty), W6 (token chỉ tác động một hồ sơ).
- E2E 353/353, unit 468/468.
- W7 với LLM thật: CV đối kháng 2/2 đạt, injection 0/2, tiêu chí đúng 98/99.
- W8 production (467b872): job của 2 công ty khác trả 404 giống id ngẫu nhiên.
- W9: bucket B2 Private, truy cập ẩn danh (a/b/c) đều 403, link ký của app vẫn mở được CV.
- Phát hiện phụ: thêm upload thứ 12 vào `ai-pipeline.e2e` làm hồ sơ cuối kẹt PROCESSING — cần chẩn đoán riêng.
- Kết luận: W1–W9 PASS → gate PASSED. Còn R4, R5 (không chặn) và R6 (trước khi công ty thật vào).
