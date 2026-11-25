# Kết quả phiên — R4 + R5 (SG-04, SG-05), 25/11/2026

- R4: khối điền nhanh tài khoản demo ở /login chỉ còn trong bản dev; bản build production không còn mật khẩu/email seed. Thêm `npm run check:bundle` chạy trong CI sau bước build.
- R5: API theo dõi hồ sơ đổi sang POST (token trong body); email mới đặt token ở #t=; trang theo dõi vẫn nhận link cũ ?t= và xoá token khỏi URL; lỗi API không còn echo query trong `path`; log che `t`/`token`.
- Kiểm: FE 345, BE unit 471, lint/typecheck/build/check:bundle đều exit 0; e2e BE chạy trên CI.
