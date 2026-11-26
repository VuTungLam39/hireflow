# 09 — Rollback (8f, 26/11/2026)

Đơn vị rollback: **một PR** (§05.5). Merge vào `main` thì Vercel (frontend) và Render (API) tự triển khai.

## Khi nào
Rollback ngay: lộ dữ liệu giữa công ty, mất hoặc hỏng dữ liệu, không đăng nhập hay không nộp CV được, `/api/health` đỏ sau một lần triển khai. Lỗi nhỏ hơn thì sửa tiến.

## Cách 1 — revert PR (mặc định, giữ lịch sử)
```bash
git fetch origin && git switch -c revert/pr-<số> origin/main
git revert -m 1 <merge-commit>
git push -u origin HEAD && gh pr create --fill
```
Chờ CI xanh, merge, rồi smoke `/jobs`, `/companies`, `/api/health` và một trang của phần vừa revert; ghi hash vào log.

## Cách 2 — nhanh hơn, trên bảng điều khiển (chỉ chủ dự án)
- Vercel: đưa bản triển khai trước đó lên production (Instant Rollback).
- Render: triển khai lại commit trước đó của `hireflow-api`.

Sau đó vẫn phải revert trên `main`, nếu không lần merge kế tiếp đưa lỗi trở lại. **Cách 2 chưa được diễn tập.**

## Cơ sở dữ liệu
- Container chạy `migration:run` mỗi lần khởi động (`be/Dockerfile`). **Revert code không hoàn tác schema.**
- Ưu tiên giữ schema và revert code. Chạy `migration:revert` trên production chỉ khi có bản sao lưu và chủ dự án quyết.
- Migration mới nhất `AddPasswordReset` (31): `down` **xoá** các token đặt lại mật khẩu; giá trị enum đã thêm vẫn còn.

## Không revert
Các PR bảo mật SG-01, SG-02, SG-03 (#139, #141, #142): revert sẽ mở lại lỗ hổng. Gặp lỗi thì sửa tiến.

## Diễn tập (26/11/2026, local, nhánh tạm đã xoá; `origin/main` không đổi)
| PR thử | Revert | typecheck | test FE | build | Thời gian |
|---|---|---|---|---|---|
| #180 (K-02) | sạch, 3 tệp | đạt | 367/367 | đạt | 70 s |
| #175 (Phase 06, 6c) | sạch, 5 tệp | đạt | lượt đầu 358/359, chạy lại 359/359 | đạt | 119 s (lượt đầu) |

Test trượt ở lượt đầu của #175: combobox công ty (`PublicJobsPage`, RR-05), chạy riêng 3/3 đạt; coi là chập chờn (K-01).

Chưa diễn tập: merge và triển khai bản revert; PR cũ hơn trong chuỗi chồng nhau (khả năng xung đột cao hơn); PR backend; Cách 2.
