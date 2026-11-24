# Phase 01 — Kết quả (Audit UX/UI toàn diện)

> Ngày: 24/11/2026 · Nhánh: `main` @ `04ac5b7` · **Trạng thái: PASSED** · Báo cáo: `docs/redesign/phase-01/README.md`

## Kết luận chính

- **24 phát hiện: P0 = 0 · P1 = 1 · P2 = 12 · P3 = 11.**
- P1 duy nhất: header trang công khai bị chồng chữ trên điện thoại (F-01).
- Các P2 quan trọng nhất:
  - Hộp xem nhanh hồ sơ không có nút quyết định, phải mở thêm trang (F-07).
  - Trang công khai dùng bản prerender cũ và che mất trạng thái đang tải/lỗi (F-02).
  - Nhãn trạng thái lệch GLOSSARY: "Đề nghị", "Đã nhận" (F-14).
  - Bảng hồ sơ tràn ngang ở khổ 1024 (F-03).
  - Bộ lọc công khai đẩy kết quả xuống dưới, chip công ty không mở rộng được (F-04).
- Bảo mật: không chấm điểm ở phase này, chuyển cho Security Gate (SG-F1…F4).

## Chỉ số nền T1–T3 (đo trên production, 3 lần, không tính thời gian suy nghĩ của người)

| Tác vụ | Bước | Thời gian hệ thống |
|---|---|---|
| T1: HR tìm và mở một hồ sơ | 2 thao tác | ≈1,0 s |
| T2: HR xem CV và ghi đánh giá | không đo đúng định nghĩa vì phải ghi dữ liệu; proxy: 3 thao tác tới khi thấy căn cứ và nút quyết định | ≈2,0 s |
| T3: khách lọc việc làm rồi mở trang công ty | 3 click | ≈2,3 s |

## Công cụ

- impeccable critique (2 sub-agent tách biệt): điểm heuristic 21/32 … 31/40; audit kỹ thuật 15/20; detector 0 phát hiện (lưu làm mốc cho Phase 08). Overlay trong trình duyệt không chạy được (Chrome chặn script localhost).
- axe: 0 vi phạm trên ≈27 tổ hợp trang × vai trò. Lighthouse 3 lần × 6 trang công khai: trợ năng 100 hết.
- Đo lại các mốc của Phase 00: `/manage/jobs` 4,8 s **không tái hiện** (0,83–0,92 s); `/companies` 81 → 97–100.

## Truy vết backlog Phase 00

21 mục P01-* đều đã có kết quả: thành phát hiện, bị bác có lý do, hoặc chuyển tiếp có lý do (file 12 §2). Hai mục chuyển tiếp: P01-07 (giao diện khi id không tồn tại → thiết kế trạng thái ở Phase 02) và P01-11 (form phiếu đánh giá → kiểm ở môi trường không phải production).

## Câu hỏi mở cho chủ dự án (file 13)

1. Hộp xem nhanh có nên chứa nút quyết định không, hay bỏ hộp này và dùng thẳng trang duyệt CV?
2. Tin hết hạn được phép còn hiện trên trang công khai tối đa bao lâu?
3. Mobile có phải bối cảnh chính của Hiring Manager không?

## Phạm vi đã giữ

Không sửa mã nguồn, không cài dependency vào dự án, không commit, không ghi dữ liệu trên production. Mật khẩu chỉ dùng trong phiên. File Lighthouse JSON thô (12 MB) để ngoài repo.

## Bước tiếp theo

Security Gate (Phase SG), chưa bắt đầu. Phase 02 chỉ được làm sau Security Gate.
