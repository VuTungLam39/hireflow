# 03 — Kết quả E2E (8c, 26/11/2026)

Môi trường: local (Windows, Chromium), seed demo, `main` @ `141c193`. **Chưa smoke production khu nội bộ** (cần chủ dự án đăng nhập trong Chrome).

## 1. Bộ tự động
| Bộ | Kết quả |
|---|---|
| BE unit | 472/472 |
| BE E2E API, trên bản sao DB dev | 365/366; test trượt là K-04, chạy riêng file 3 lần đều 14/14 |
| FE vitest (8b) | 367/367 |
| Playwright (truy cập, trạng thái, ảnh, smoke 3 engine) | 16/16; 3 luồng ghi bỏ qua khi không đặt `E2E_FLOWS` |
| Playwright luồng ghi, trên bản sao DB, AI `fake`, email Mailpit | 3/3 |

## 2. Truy cập theo vai — `e2e/access.spec.ts`
6 vai × 34 đường dẫn = 204 lượt: **204 đúng**, 0 lỗi JS, 0 tràn ngang ở 1440, 1024, 768, 390.
Một ô hiển thị chưa đúng cách: K-02 (bị chặn đúng nhưng bằng khung lỗi).
Giới hạn: phạm vi dữ liệu trong cùng quyền (phòng ban, được giao, công ty khác) không kiểm ở đây; thuộc E2E API.

## 3. Trạng thái — `e2e/states.spec.ts` (vai Admin công ty và khách)
17 màn (3 công khai, 14 nội bộ): đang tải 17/17 có khung chờ; lỗi 500 17/17 có thông báo và "Thử lại" phục hồi. Rỗng (tìm không ra): 5/5 danh sách có thông báo.
Chưa kiểm trên trình duyệt: phiếu đánh giá, Offer, hỏi kho CV; rỗng do chưa có dữ liệu.

## 4. Luồng nghiệp vụ
| # | Luồng | Bằng chứng | Kết quả |
|---|---|---|---|
| F01 | Đăng nhập, sai mật khẩu, tải lại, đăng xuất | trình duyệt (HR) | PASS |
| F02 | Nộp CV → email → theo dõi → rút | trình duyệt (khách) | PASS |
| F04 | Sàng lọc → Từ chối bắt buộc lý do | trình duyệt (HR) | PASS; hàng loạt: API |
| F03 | Tin tuyển dụng | API `jobs`, `clone-job`; component | PASS (không qua trình duyệt) |
| F05 | Xếp hạng, ứng viên cũ | API `matching`, `compare`; component | PASS (không qua trình duyệt) |
| F06 | Kho ứng viên, ẩn danh | API `candidates`, `data-lifecycle` | PASS (không qua trình duyệt) |
| F07 | Phỏng vấn, phiếu | API `interviews`; component | PASS (không qua trình duyệt) |
| F08 | Offer | API `offers` | PASS (không qua trình duyệt) |
| F09 | Hỏi kho CV | component `ai-chat`; E2E API với AI giả | PASS (không qua trình duyệt) |
| F10 | Quản trị | API `permissions`, `department-scope` | PASS (không qua trình duyệt) |
| F11 | Đăng ký công ty, duyệt, khoá | API `employer-registration`, `platform` | PASS (không qua trình duyệt) |

Phiên hết hạn trên trình duyệt (phần còn lại của F01) chưa kiểm.

## 5. Chạy lại luồng ghi
```bash
docker exec hireflow-postgres createdb -U postgres -T ncc_intern ncc_intern_p8
# tắt backend đang chạy trước
DB_DATABASE=ncc_intern_p8 LLM_PROVIDERS=fake EMBEDDING_PROVIDER=fake EMAIL_PROVIDER=mailpit E2E_FLOWS=1 npx playwright test flows
docker exec hireflow-postgres dropdb -U postgres --force ncc_intern_p8
```
