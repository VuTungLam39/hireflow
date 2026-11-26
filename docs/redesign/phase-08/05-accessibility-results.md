# 05 — Accessibility (8c, 26/11/2026)

## axe-core 4.10 (local)
Mọi lượt trong ma trận truy cập (6 vai × 34 đường dẫn), ở 1440 và 390.

| Mức | Kết quả |
|---|---|
| critical | 0 |
| serious | 0 |
| moderate | `landmark-complementary-is-top-level` ở `/manage/jobs/new` (K-03); `page-has-heading-one` ở khung lỗi của K-02 |

Đạt ngưỡng §5 (0 lỗi serious/critical). Giới hạn: axe chạy trên trạng thái mặc định của trang; không chạy trên hộp thoại mở từ thao tác, menu, trạng thái lỗi nhập liệu.

## Bàn phím (Admin công ty)
| Kiểm | Kết quả |
|---|---|
| Đăng nhập chỉ bằng bàn phím | PASS |
| "Bỏ qua tới nội dung" đưa focus vào `main` | PASS |
| Tab đầu tiên sau khi tải trang là liên kết bỏ qua | PASS trên bản build (kiểm một lần); bản dev khác do StrictMode |
| Ctrl+K mở bảng lệnh, Esc đóng | PASS |
| Mở hộp thoại tin bằng Enter, Esc đóng, focus quay lại | PASS |
| Hộp thoại giữ focus (30 lần Tab) | PASS |
| Menu di động mở bằng Enter, Esc đóng, focus quay lại | PASS |

## Chưa kiểm
- **Screen reader:** chưa có người nghe thật.
- Bàn phím với vai HR, HM, IV và biểu mẫu dài (tin tuyển dụng, phiếu, Offer).
- Phóng to 200 %, tương phản ở chế độ tương phản cao.
