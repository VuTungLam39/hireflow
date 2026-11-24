# Kết quả phiên 24/11/2026 — Security Gate

## Kết luận: GATE FAILED
- **SG-01 (CRITICAL):** `POST /applications/bulk-status` không lọc theo công ty. HR/Admin của công ty B đổi được trạng thái hồ sơ của công ty A, miễn là biết UUID. Đã tái hiện trên máy local: hồ sơ chuyển từ INTERVIEW sang REJECTED. Lỗi có trên `main` đang chạy.
- **SG-03 (HIGH):** điểm có thể bị đẩy lên. Chữ ẩn trong CV vẫn được tính là trích dẫn hợp lệ, và số năm kinh nghiệm do LLM tự khai mà không đối chiếu với trích dẫn.
- **SG-02 (MEDIUM):** các API ghi trả 403 "outside your organization" khi ID thuộc công ty khác, nhưng trả 404 khi ID không tồn tại. Như vậy là trái ADR-0002.
- 4 lỗi LOW (SG-04..07); RK-15 là rủi ro đã chấp nhận (SG-08).
- **Đã gỡ:** SG-F1 (backend đòi quyền `job:update`), SG-F2 (chat không vượt ranh giới công ty), phần platform của SG-F3.

## Đã làm
- Đọc mã nguồn 113 handler; dựng threat model.
- Chạy e2e tạm trên local (Docker, DB ở cổng 5433, LLM giả). File tạm đã xoá, repo không đổi.
- Kiểm chỉ-đọc trên production, không đăng nhập: các endpoint được bảo vệ đều trả 401, token sai, chữ ký file sai, header bảo mật, bundle JS.
- Quét secret trong repo: không thấy secret production nào.
- Viết 9 file trong `docs/redesign/security-gate/`.

## Chưa kiểm
- Kiểm production có đăng nhập (chưa có mật khẩu).
- LLM thật có bị prompt injection không.
- Bucket B2 có để private không.
- Các mục W3–W6 trong file 08.

## Quyết định của chủ dự án (24/11)
- Chấp nhận kết luận GATE FAILED.
- Xếp lịch R1 (SG-01) và R2 (SG-02) làm slice trước Phase 05, mỗi slice một PR, R1 làm trước.
  - R1 sửa cả lớp lỗi: lọc phạm vi khi nạp bulk, `transition()` khoá dòng theo `id + organization_id`, e2e mở rộng sang ID gửi trong body. R1 phải xong trước khi có dữ liệu thật.
  - R2 gồm cả trường hợp HM ghi ngoài phòng ban, và e2e chỉ chấp nhận 404.
- SG-03: R3 vẫn là slice trước Phase 05 và chặn dữ liệu thật. **Không ký chấp nhận rủi ro.** Làm spike phát hiện chữ ẩn trong PDF trước; phần tính số năm và bộ CV đối kháng làm song song.
- R4, R5 làm lúc nào tiện. R6 phải xong trước khi có công ty thật. SG-07 chấp nhận, chỉ để thông tin.
- Hệ quả: Phase 02 bắt đầu được ngay. Dữ liệu thật và các slice Phase 05 đụng tới tenant, pipeline CV hoặc chấm điểm vẫn bị chặn cho tới khi kiểm lại gate (sau R1–R3) đạt.
- Đã chép master plan sang `docs/redesign/master-plan-v1.2.md`.
- Commit E: tài liệu gate cùng file kết quả này. R1 chưa bắt đầu.
