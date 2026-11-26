# 04 — Visual regression (D-11)

**Baseline 26/11/2026:** 34 ảnh: 13 route trọng yếu và biến thể (hộp thoại tin, tin mới, hộp thoại hồ sơ, chi tiết công ty) × 390 và 1440; CR-13 chỉ ở trạng thái không có token, Chromium trên Windows, dữ liệu seed demo local. Ảnh ở `visual-baseline/`.

| Kiểm | Kết quả |
|---|---|
| Chụp rồi so lại ngay | 6/6 test PASS |
| Tràn ngang trên mọi ảnh | 0 |
| Xem mắt thường (mẫu: CR-06 1440, CR-09 1440, CR-10 390, CR-12 390) | đúng trang thật, không dính khung chờ hay trang lỗi |

## Cách đọc khi lệch
- Baseline là **hiện trạng sau redesign**, không phải so với trước redesign. Nó phát hiện thay đổi từ nay về sau.
- Ảnh chỉ chụp khung nhìn đầu tiên, không chụp cả trang.
- Phụ thuộc dữ liệu seed local: seed lại hoặc thao tác ghi sẽ làm lệch. Đồng hồ trình duyệt cố định 26/11/2026 10:00, nhưng giờ do server trả (ví dụ "cập nhật lúc" ở Hôm nay) và dữ liệu tính theo ngày của server không cố định.
- Cho phép lệch 1 % điểm ảnh; thay đổi rất nhỏ có thể lọt.
- Chỉ có baseline `win32`; máy khác hệ điều hành phải chụp lại.
- Công cụ debug TanStack Query được ẩn khi chụp (`fe/e2e/screenshot.css`).
