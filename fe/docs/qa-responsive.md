# Kiểm thử giao diện: 3 role × 3 độ rộng

Kickoff 15.2, 22.1: giao diện dùng được ở 360px, bảng chuyển thành thẻ dưới 768px, kiểm ở 360/768/1280px cho cả 3 role.

**Cách chạy**: hệ thống chạy bằng `docker compose up -d --build` từ một bản clone sạch, seed demo trong container (`docker compose exec api node dist/database/seeds/seed.js`), BE thật, LLM giả. Script `fe/scripts/qa/responsive.mjs` đăng nhập từng role, mở từng màn hình ở 3 độ rộng (cao 800px) và ghi lại:

- lỗi JavaScript, lỗi console (trừ 401 của lần khôi phục phiên đầu tiên), request API trả 4xx/5xx;
- trang bị tràn ngang (`scrollWidth` lớn hơn chiều rộng màn hình);
- ảnh chụp từng màn để xem bằng mắt.

Ngày chạy 26/10/2026, Chrome 155. **Kết quả: 96 lượt, 0 lỗi** (sau khi sửa 3 lỗi ở mục dưới).

## Lỗi tìm thấy và đã sửa

| Màn hình | Độ rộng | Lỗi | Nguyên nhân | Sửa |
| --- | --- | --- | --- | --- |
| Dashboard | 360, 768px | Trang tràn ngang 116–145px, hai thẻ "Hồ sơ mới cần xem", "Điểm cao đang chờ phỏng vấn" rộng hơn màn hình | Thẻ là phần tử lưới, mặc định `min-width: auto` nên bị tên ứng viên dài đẩy rộng; `truncate` bên trong không có tác dụng | Thêm `min-w-0` cho thẻ |
| Bảng hồ sơ | 360px | Hai ô chọn ngày rộng cố định 152px, tràn khỏi khung lọc | `w-38` cố định | Dưới 640px hai ô chia đều chiều rộng (`flex-1`), từ 640px giữ 152px |
| Bảng hồ sơ | 768px | Trang tràn ngang 101px dù bảng đã nằm trong khung cuộn ngang | Chữ `sr-only` (định vị tuyệt đối) trong ô bảng thoát khỏi khung cuộn vì khung không phải `relative`, nên kéo rộng cả trang | Thêm `relative` cho khung cuộn của `DataTable` và bảng xếp hạng |

## Kết quả theo màn hình

### Admin

| Màn hình | 360px | 768px | 1280px | Ghi chú |
| --- | :---: | :---: | :---: | --- |
| Dashboard | ✔ | ✔ | ✔ |  |
| Tin tuyển dụng | ✔ | ✔ | ✔ |  |
| Xếp hạng + thanh trọng số | ✔ | ✔ | ✔ |  |
| Bảng hồ sơ | ✔ | ✔ | ✔ |  |
| Chi tiết hồ sơ | ✔ | ✔ | ✔ |  |
| Kho ứng viên | ✔ | ✔ | ✔ |  |
| Chi tiết ứng viên | ✔ | ✔ | ✔ |  |
| Chat AI | ✔ | ✔ | ✔ |  |
| Quản lý người dùng | ✔ | ✔ | ✔ |  |
| Phòng ban | ✔ | ✔ | ✔ |  |
| Hàng đợi AI | ✔ | ✔ | ✔ |  |
| Trang job công khai | ✔ | ✔ | ✔ |  |
| Chi tiết job công khai | ✔ | ✔ | ✔ |  |

### HR

| Màn hình | 360px | 768px | 1280px | Ghi chú |
| --- | :---: | :---: | :---: | --- |
| Dashboard | ✔ | ✔ | ✔ |  |
| Tin tuyển dụng | ✔ | ✔ | ✔ |  |
| Xếp hạng + thanh trọng số | ✔ | ✔ | ✔ |  |
| Bảng hồ sơ | ✔ | ✔ | ✔ |  |
| Chi tiết hồ sơ | ✔ | ✔ | ✔ |  |
| Kho ứng viên | ✔ | ✔ | ✔ |  |
| Chi tiết ứng viên | ✔ | ✔ | ✔ |  |
| Chat AI | ✔ | ✔ | ✔ |  |
| Tạo job | ✔ | ✔ | ✔ |  |
| Quản lý người dùng | ✔ | ✔ | ✔ | Trang "không có quyền" (đúng ma trận quyền Kickoff 11.1) |

### Hiring Manager

| Màn hình | 360px | 768px | 1280px | Ghi chú |
| --- | :---: | :---: | :---: | --- |
| Dashboard | ✔ | ✔ | ✔ |  |
| Tin tuyển dụng | ✔ | ✔ | ✔ |  |
| Xếp hạng + thanh trọng số | ✔ | ✔ | ✔ |  |
| Bảng hồ sơ | ✔ | ✔ | ✔ |  |
| Chi tiết hồ sơ | ✔ | ✔ | ✔ | Xem được; ô đổi trạng thái báo không có quyền (đúng BR-STS-05, HM chỉ thao tác ở bước OFFER) |
| Kho ứng viên | ✔ | ✔ | ✔ |  |
| Chi tiết ứng viên | ✔ | ✔ | ✔ |  |
| Chat AI | ✔ | ✔ | ✔ |  |
| Quản lý người dùng | ✔ | ✔ | ✔ | Trang "không có quyền" (đúng ma trận quyền Kickoff 11.1) |

## Dùng bằng bàn phím (Kickoff 6)

Script `fe/scripts/qa/keyboard.mjs` chỉ dùng Tab, Space, Enter, Esc (không chuột) trên bản build thật nối BE thật, ngày 26/10/2026. **9/9 bước đạt:**

| Luồng | Bước | Kết quả |
| --- | --- | --- |
| Nộp CV (ứng viên) | Mở chi tiết job từ danh sách bằng Enter | ✔ |
| | Tab lần lượt tới họ tên → email → số điện thoại | ✔ |
| | Chọn file CV bằng Enter trên nút "chọn từ máy" | ✔ |
| | Tích ô đồng ý bằng Space | ✔ |
| | Gửi hồ sơ bằng Enter, hiện lời cảm ơn | ✔ |
| Đăng nhập | Tab tới email, mật khẩu, Enter để đăng nhập | ✔ |
| Tạo job (HR) | Tab tới tiêu đề → phòng ban (chọn bằng phím mũi tên) → địa điểm → JD | ✔ |
| | Tạo job bằng Enter, chuyển sang trang sửa job | ✔ |
| Đổi trạng thái hồ sơ | Mở hộp thoại bằng Enter, đóng bằng Esc | ✔ |

## Còn lại

- Ô chọn ngày hiển thị theo ngôn ngữ của trình duyệt (`mm/dd/yyyy` trên Chrome tiếng Anh), không phải lỗi của ứng dụng.
