# Kết quả phiên 24/11/2026 — Phase 03 tới checkpoint primitives

## Đã làm
- Viết `fe/DESIGN.md` theo chuẩn design.md, gồm 17 màu, 14 cỡ chữ, 4 mức bo góc, 7 mức khoảng cách, 30 component token.
- **Lint đạt:** `designmd lint` cho 0 lỗi, 0 cảnh báo, 1 info. Dùng `@google/design.md` 0.4.0, cài vào scratchpad, không thêm vào dependency của dự án. Lệnh `npx` bị treo nên chuyển sang cách này.
- Viết file 01 (token 3 lớp), 02 (typography), 03 (màu, kèm bảng tương phản đã tính) và 04 (inventory component):
  - 5 kiểu modal gom lại thành 4 contract;
  - 6 bảng gom về 1 hệ DataTable.
- Viết phần so sánh chi phí giữa dùng Radix và tự cứng hoá primitive tự viết. **Đề xuất: dùng Radix theo từng slice, bọc sau component của dự án.**

## Chờ chủ dự án
- Duyệt inventory và chọn chiến lược primitives. Sau đó mới viết file 05–09 và chạy review impeccable.
- Chưa commit.

## Sau checkpoint (24/11)
- Chủ dự án duyệt inventory và chọn **Radix**, đưa vào từng slice, bọc sau component của dự án, kèm các điều kiện đã ghi trong README.
- Viết file 05: contract theo API của dự án, không theo prop của Radix. Có hai điều khoản đã quyết: nhãn tin tuyển dụng lấy theo bối cảnh (DL-11), và Sheet xem nhanh không có thao tác đổi trạng thái (DL-16).
- Viết file 06 (trợ năng, gồm liên kết hai chiều giữa căn cứ và CV), 07 (quy tắc responsive kiểm thử được), 08 (14 pattern, CV Review khớp hướng R3) và 09 (5 trạng thái biên, lộ trình chuyển đổi dần, không làm lại một lần).
- Review impeccable: detect cho 0 phát hiện. Nhận 3 góp ý: thêm token hover cho nút chính, màu chọn văn bản không trùng marker, badge info không gạch chân.
- Lint lại: 0 lỗi, 0 cảnh báo, 1 info (dòng info chỉ tóm tắt số token).
- **Phase 03: PASSED.** Chờ lệnh commit.
