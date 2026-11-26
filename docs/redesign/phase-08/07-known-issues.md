# 07 — Lỗi đã biết

| ID | Mức | Mô tả | Trạng thái |
|---|---|---|---|
| K-01 | P3 (chỉ test) | Test flow FE trượt khi CPU quá tải. **Chẩn đoán 8a:** chạy khi máy rảnh thì đạt; thêm 24 tiến trình bận thì `findBy*` hết hạn 1 s và test hết 15 s, ở nhiều test khác nhau của `detail-dialog.test.tsx`. Không phải lỗi sản phẩm. | Đã nâng hạn chờ (8 s) và hạn test (30 s) cho **cả bộ** FE (PR #177). Cả bộ 5/5 xanh; tải cực nặng vẫn còn 1/3 lần trượt. Hệ quả: test chậm dần khó bị phát hiện hơn. |
