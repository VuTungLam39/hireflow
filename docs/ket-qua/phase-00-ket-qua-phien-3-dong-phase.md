# Phase 00 — Kết quả phiên 3 (đóng phase)

> Ngày: 24/11/2026 · Nhánh: `main` @ `04ac5b7` · Báo cáo đầy đủ: `docs/redesign/phase-00/README.md`
> **Trạng thái: PARTIALLY PASSED** — chỉ còn thiếu tài khoản Interviewer.

## 1. Đã kiểm chứng bằng đăng nhập thật

- 4 vai: Admin, HR, Hiring Manager, platform_admin. Mật khẩu chỉ dùng trong phiên, không ghi vào file nào; các log tạm có chứa mật khẩu đã xoá.
- **Ma trận quyền: 56/56 ô (4 vai × 14 route) khớp đúng bảng quyền của BE.**
- platform_admin tồn tại thật: không thuộc công ty nào, đăng nhập vào thẳng `/platform/companies`.
- Phạm vi phòng ban của HM chạy đúng: HM thấy 9 hồ sơ, HR thấy từ 20 trở lên. HM mở hồ sơ ngoài phòng → "Không tìm thấy dữ liệu", không lộ dữ liệu.
- HM vào `/manage/jobs/:id/edit` của tin ngoài phòng: route vẫn mở nhưng BE trả không tìm thấy. HM sửa tin trong phòng: chưa thử. Vẫn để cho Security Gate.
- Tài khoản "công ty" `hienvan690@…` bị chặn với `403 ORG_DISABLED` ("Công ty của bạn đã bị khoá hoặc bị từ chối trên sàn") → đã kiểm chứng quy tắc chặn đăng nhập khi công ty bị khoá.

## 2. Bằng chứng đã thu

- 80 ảnh chụp: khách 39, HR 28, HM 8, Admin 2, platform 3, Interviewer 0.
- Các route quan trọng CR-06..CR-12: trạng thái mặc định, đang tải, lỗi, rỗng, bị từ chối quyền; khổ 1440 và 390.
- axe: 0 vi phạm trên 7 trang nội bộ (cộng với 6 trang công khai trước đó).
- Thời gian: trang xem CV hiện nội dung sau ≈1,6 s, bảng xếp hạng ≈1,3 s; `/manage/jobs` lần đầu tốn 4,8 s (cần đo lại).

## 3. /grill-with-docs

- Đã tạo `GLOSSARY.md` ở gốc repo, chỉ gồm các thuật ngữ đã có căn cứ trong mã nguồn hoặc đã có quyết định: Sàn, Công ty, Quản trị sàn, Nhà tuyển dụng, Ứng viên, Tin tuyển dụng, Hồ sơ ứng tuyển, Kho ứng viên, Trạng thái hồ sơ, Tiêu chí, Trọng số, Mức phù hợp, Căn cứ, Xếp hạng.
- Đã tạo `docs/adr/0001-candidate-is-a-guest-actor.md`.
- Vòng câu hỏi 1 đang chờ chủ dự án trả lời (xem tin nhắn trong phiên).

## 4. Phát hiện mới (file 15/17)

- D-15: comment trong code vẫn ghi OFFER → HIRED đi qua `/hire`, nhưng S4 đã bỏ endpoint này.
- D-16: cùng một khái niệm lúc gọi tiếng Việt, lúc tiếng Anh: "Đề nghị" / "Offer" / "Đã nhận" / "Đã nhận việc".
- D-17: hồ sơ ngoài phạm vi hiện là "không tìm thấy", không phải "không có quyền".
- P01-12..16: lỗi ở màn xem CV hiện ra muộn (vì query thử lại khi gặp lỗi 5xx); `/manage/jobs` chậm lần đầu; mật độ thông tin trên mobile; thuật ngữ offer.

## 5. Còn lại để lên PASSED

1. Tài khoản Interviewer, hoặc chủ dự án chấp nhận rủi ro bằng văn bản.
2. Trả lời vòng câu hỏi 1 của grill.

Không sửa mã nguồn, không đổi dependency, không commit, không thao tác ghi dữ liệu trên production (ngoài việc đăng nhập).
