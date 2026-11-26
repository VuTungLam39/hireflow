# 10 — Release notes: HireFlow sau redesign (24–26/11/2026)

Bản demo thực tập, dữ liệu mẫu. Không dùng cho dữ liệu ứng viên thật.

## Giao diện
- Hệ thiết kế mới: token màu và khoảng cách, phông Be Vietnam Pro tự host, hộp thoại, menu, tab, ô chọn thống nhất.
- Trang công khai (việc làm, chi tiết tin, công ty) làm lại; lọc công ty bằng ô chọn có tìm kiếm.
- Khung nội bộ mới: thanh điều hướng, thanh trên, bảng lệnh Ctrl+K.
- Bảng dữ liệu vừa khung ở màn hẹp, chuyển thành thẻ trên điện thoại.
- Hồ sơ ứng tuyển: xem nhanh, thao tác hàng loạt (sàng lọc, phỏng vấn, từ chối kèm lý do).
- Duyệt CV, xếp hạng, phỏng vấn, phiếu đánh giá, Offer, trang Hôm nay, kho ứng viên và khu quản trị được làm lại.
- Chuyển động ngắn; tôn trọng thiết lập giảm chuyển động của hệ điều hành.

## Hành vi mới
- Trang chi tiết tin đã hết hạn hoặc đã đóng còn xem được 30 ngày (không nộp được).
- Quên mật khẩu: nhận liên kết qua email, dùng một lần, hết hạn sau 30 phút.

## Bảo mật
- Chặn đổi trạng thái hồ sơ của công ty khác qua thao tác hàng loạt.
- Ghi vào dữ liệu công ty khác trả "không tìm thấy" như id không tồn tại.
- Chữ ẩn trong CV PDF không còn được tính điểm; số năm kinh nghiệm bị giới hạn theo trích dẫn.
- Bản build công khai không còn tài khoản seed; token theo dõi không còn nằm trong query.

## Sửa lỗi gần nhất
- Interviewer mở trang xếp hạng nhận trang "không thuộc quyền của bạn" thay vì khung lỗi.

## Vấn đề đã biết (đều P3)
- Trang sửa tin: ô "Phòng ban" hiện "Chọn phòng ban" khi mở thẳng trang; lưu không mất phòng ban (K-06).
- Lọc công ty trên trang việc làm cần thêm một thao tác (K-08).
- Trang đăng nhập đạt điểm Lighthouse thấp hơn trước trong mô hình giả lập (K-07).
- Ảnh công khai bị mất trong kho trả lỗi 500 thay vì 404 (K-04, #182).
- Danh sách đầy đủ: `07-known-issues.md`.

## Người vận hành cần biết
- Cần biến `APP_PUBLIC_URL` và cấu hình email để gửi liên kết (đặt lại mật khẩu, theo dõi hồ sơ).
- Migration chạy tự động khi API khởi động. Rollback: `09-rollback-plan.md`.
