# 07 — Lỗi đã biết

| ID | Mức | Mô tả | Trạng thái |
|---|---|---|---|
| K-01 | P3 (chỉ test) | Test flow FE trượt khi CPU quá tải. **Chẩn đoán 8a:** chạy khi máy rảnh thì đạt; thêm 24 tiến trình bận thì `findBy*` hết hạn 1 s và test hết 15 s, ở nhiều test khác nhau của `detail-dialog.test.tsx`. Không phải lỗi sản phẩm. | Đã nâng hạn chờ (8 s) và hạn test (30 s) cho **cả bộ** FE (PR #177). Cả bộ 5/5 xanh; tải cực nặng vẫn còn 1/3 lần trượt. Hệ quả: test chậm dần khó bị phát hiện hơn. |
| K-02 | P3 | Interviewer mở trực tiếp `/manage/jobs/:id/ranking`: route cho vào (`job:read`) rồi hiện khung lỗi "Chưa tải được xếp hạng · Không tìm thấy dữ liệu", không có h1, thay vì trang không có quyền. Máy chủ chặn đúng (BR-INT-02), không lộ dữ liệu. Hộp thoại tin đã ẩn tab "Xếp hạng"; liên kết trên trang sửa tin chưa kiểm. | Mở, chờ chủ dự án chọn |
| K-03 | P3 | axe moderate `landmark-complementary-is-top-level` ở `/manage/jobs/new` (AD, HR). | Mở |
| K-04 | P3 (chỉ test) | `be/test/company.e2e-spec.ts` lấy logo bất kỳ trong DB; DB có logo công ty khác thì trượt (1/366). Lần trượt nhận 500 ở `GET /public/media/…`; **suy đoán chưa xác minh:** bản ghi media không còn file thì trả 500 thay vì 404. CI dùng DB mới nên không gặp. | Mở |
| K-05 | P3 (môi trường) | E2E API ở local ghi thẳng vào DB dev (`be/.env`), để lại công ty rác; ảnh baseline phụ thuộc DB này. Cách tránh: đặt `DB_DATABASE` sang bản sao. | Mở |

Không có P0, P1, P2 phát hiện ở 8c.
