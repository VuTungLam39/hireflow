# Phase 00 — Kết quả phiên 5 (grill vòng 1)

> Ngày: 24/11/2026 · Trạng thái Phase 00: **vẫn PARTIALLY PASSED** (chờ Interviewer)

## Quyết định đã ghi (README phase-00 §6)

| ID | Nội dung |
|---|---|
| DL-08 | Q1: dùng "Offer" cho trạng thái, khối chi tiết, nút, thông báo, email (cố ý giữ tiếng Anh); HIRED = "Đã nhận việc"; tránh "Đề nghị", "Đã nhận". Không cần ADR |
| DL-09 | Q2: Hồ sơ ứng tuyển là đơn vị làm việc của HR (số đếm, hàng đợi, trạng thái, điểm, xếp hạng); Ứng viên là con người (Kho ứng viên, hồ sơ cá nhân) |
| DL-10 | Q3: tài nguyên ngoài phạm vi trả "không tìm thấy"; trong phạm vi mà thiếu quyền thao tác thì báo "không có quyền" → ADR-0002 |

Chủ dự án đề nghị số DL-07..09, nhưng DL-07 đã dùng nên đánh số DL-08..10.

## File đã cập nhật

- `GLOSSARY.md`: sửa Hồ sơ ứng tuyển, Ứng viên, Trạng thái hồ sơ; thêm Offer, Đã nhận việc.
- `docs/adr/0002-out-of-scope-resources-return-not-found.md` (mới).
- `docs/redesign/phase-00/17-…`: thêm P01-16 (grep danh sách từ cần tránh), P01-17 (quy tắc hồ sơ/ứng viên), P01-18 (cách báo lỗi theo ADR-0002), SG-F4 (Security Gate kiểm ADR-0002).

## Còn mở

- Grill vòng 2 (3 câu hỏi về thuật ngữ) — chờ trả lời.
- Tài khoản Interviewer — chờ mật khẩu đúng hoặc chấp nhận rủi ro.
