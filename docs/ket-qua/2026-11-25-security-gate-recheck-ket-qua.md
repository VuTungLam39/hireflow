# Kết quả phiên — Security gate re-check, 25/11/2026

- Chạy lại W1–W7 trên local (main @ 467b872): tất cả PASS. Bổ sung test cho W3 (Interviewer/HM sửa job), W4 (refresh sau khi khoá công ty), W6 (token chỉ tác động một hồ sơ).
- E2E 353/353, unit 468/468.
- Còn chờ chủ dự án: W7 với LLM thật (`npm run ai:eval`, tốn quota), W8 (mật khẩu tài khoản test production), W9 (kiểm tra bucket B2 private).
- Phát hiện phụ: thêm upload thứ 12 vào `ai-pipeline.e2e` làm hồ sơ cuối kẹt PROCESSING — cần chẩn đoán riêng.
- Kết luận: gate vẫn CONDITIONAL cho tới khi xong W7 thật, W8, W9.
