# Kết quả phiên — R6 quên/đặt lại mật khẩu (SG-06), 25/11/2026

- Quyết định chủ dự án: link dùng một lần, hết hạn 30 phút, link mới huỷ link cũ, 3 email/giờ/tài khoản + 3 yêu cầu/giờ/IP, trả lời giống nhau dù email có hay không; đặt lại xong thu hồi mọi phiên, về trang đăng nhập.
- BE: `POST /auth/forgot-password`, `POST /auth/reset-password`, migration thêm kind `RESET_PASSWORD`, email có link token ở fragment (#t=).
- FE: link "Quên mật khẩu?", trang Quên mật khẩu, trang Đặt mật khẩu mới (xoá token khỏi URL ngay khi đọc).
- Kiểm: BE unit 470, FE 344, e2e mới viết sẵn — chạy trên CI vì máy không có Postgres (Docker tắt).
- Chưa làm: smoke production (cần hộp thư thật nhận email).
