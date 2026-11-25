# Kết quả phiên — Security gate R3 (SG-03), 25/11/2026

- Branch `fix/sg03-r3-evidence-visibility` từ main sau khi merge #141.
- PDF: bỏ chữ người đọc không thấy (chữ trắng, render ẩn, cỡ < 2pt) ngay lúc trích text → không gửi LLM, bằng chứng trích từ đó bị gắn cờ UNVERIFIED_EVIDENCE, không cộng điểm.
- Chấm điểm: số năm LLM khai bị giới hạn bởi số năm ghi trong câu trích hoặc khoảng thời gian làm việc ghi trong CV.
- Bộ eval AI: thêm cv11 (PDF giấu chữ), ngưỡng pass "CV đối kháng không bị thổi điểm"; `ai:eval` trả mã lỗi nếu trượt.
- Kiểm tra: unit 468/468, e2e 352/352, lint/typecheck sạch.
- Chưa làm: DOCX ẩn chữ, chữ trong suốt/trùng màu nền, chạy eval với LLM thật (để vào đợt kiểm tra lại gate).
