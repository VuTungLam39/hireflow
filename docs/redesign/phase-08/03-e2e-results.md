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

## 6. Security Gate chạy lại (8e, 26/11/2026)
Baseline: `main` @ `4ac96a7`. Hồ sơ gate: `docs/redesign/security-gate/` (W1–W9 ở file 08). Bộ tự động local: BE unit 472/472, BE E2E 366/366 (DB `hireflow_test`, LLM giả).

| # | Kiểm | Bằng chứng 26/11 | Kết quả |
|---|---|---|---|
| W1 | Cô lập công ty: bulk-status, id trong body (SG-01) | `cross-tenant.e2e` | **PASS** |
| W2 | Ghi lên hồ sơ công ty khác giống id không tồn tại (SG-02) | `cross-tenant.e2e`, `applications.e2e` | **PASS** |
| W3 | HM, Interviewer không sửa được tin | `jobs.e2e` | **PASS** |
| W4 | Khoá công ty cắt phiên đang mở | `platform.e2e` | **PASS** |
| W5 | Đăng xuất thu hồi refresh token | `app.e2e` | **PASS** |
| W6 | Token theo dõi chỉ thấy đúng hồ sơ của nó | `application-tracking.e2e` | **PASS** |
| W7 | Trung thực trích dẫn, chữ ẩn, số năm (SG-03) | unit `cv-parser`, `scoring`; e2e `BR-AI-03` | **PASS** |
| W7 | Prompt injection với LLM thật | `ai:eval` (dưới) | **PASS** |
| W8 | Production: HR công ty A mở tin công ty B | phiên HR trong Chrome, chỉ đọc: tin mình 200; tin `vi-may`, `cho-lanh` và id ngẫu nhiên đều 404, cùng thông báo | **PASS** |
| W9 | Bucket B2 riêng tư | **Chưa chạy lại** (cần chủ dự án vào console B2). Lần 25/11 PASS; mã `modules/files` không đổi từ đó | **Chưa kiểm lại** |

### Eval LLM thật
- **Số lượt gọi: 11** (đếm ở tầng `fetch`; cả 11 HTTP 200, không retry, không dùng model dự phòng). Chỉ chạy bộ `ai:eval` một lần.
- Model `gemini-3.5-flash-lite`, prompt `v4`, 11 CV × 2 JD. Báo cáo: `be/docs/ai-eval/20261126-0843-v4.md`.
- Tiêu chí đúng 99/99; bằng chứng có thật 69/69; injection bị làm theo 0/2; CV đối kháng không bị thổi điểm 2/2.

### Kiểm kèm (production, chỉ đọc)
| Mục | Kết quả |
|---|---|
| 10 endpoint cần đăng nhập, không token | 401 |
| Chữ ký tệp sai; truy cập vượt thư mục media | 404 |
| SG-04: 78 chunk JS của bản production | không có mật khẩu seed, không có email `@hireflow.dev` |
| SG-05: `GET /public/applications/track?t=…` | đã gỡ (404), lỗi không lặp lại token |
| Header API (CSP, HSTS, `no-referrer`, nosniff, SAMEORIGIN) | có đủ |
| Tìm khoá trong tệp được theo dõi | chỉ có chuỗi mẫu trong README và test |

### Kết luận 8e
Không thấy lỗi mới. W1–W8 PASS; W9 chưa kiểm lại. Kết luận gate cuối cùng thuộc 8f và chờ chủ dự án.

**Giới hạn:** eval chỉ phủ bước trích xuất CV, một lần chạy, một model, theo `.env` local (chưa đối chiếu cấu hình model trên Render); injection qua `/ai-chat` với LLM thật không thuộc bộ eval của gate; W8 chỉ thử được id tin tuyển dụng. SG-06 vẫn chờ smoke quên mật khẩu bằng hộp thư thật.
