# Phase 06 — Motion & Interaction Polish

Trạng thái: **đóng** (6a, 6b, 6c đã phát hành 26/11/2026); spec đã duyệt (chủ dự án, 26/11/2026): M-01…M-07, thứ tự 6a → 6b → 6c, Q1 giữ 300 ms. Nhãn bằng chứng: SV (đọc source @ `dca07a8`); chưa kiểm runtime.

Chuẩn đối chiếu: master plan §06; DNA §9; token spec (100/150/200 ms, standard `cubic-bezier(.2,0,0,1)`); accessibility contract (reduced motion: chỉ opacity, ≤100 ms, không cuộn mượt).

## 1. Hiện trạng
CSS/WAAPI, không thư viện motion. Keyframe ở `fe/src/index.css`. JS: FLIP ở `RankingTable` (200 ms), cuộn tới căn cứ ở `CvSheet`, cuộn tới form ở `PublicJobDetailPage`.

## 2. Phát hiện

| ID | Mức | Phát hiện | Chỗ |
|---|---|---|---|
| M-01 | Lỗi a11y | Cuộn tới form dùng `behavior: 'smooth'` cố định, bỏ qua reduced motion (CSS `scroll-behavior` không đè được tham số JS) | `PublicJobDetailPage.tsx` |
| M-02 | Lệch contract | Reduced motion fade 120 ms, contract ≤100 ms | `index.css` |
| M-03 | Thừa | Command Palette (Ctrl+K, `/`) có `animate-float-in`: thao tác bàn phím lặp nhiều | `CommandPalette.tsx` |
| M-04 | Không nhất quán | `Dialog`, `AlertDialog` hiện tức thì; `<dialog>` (DetailDialog) có float-in 150 ms | `ui/Dialog.tsx`, `ui/AlertDialog.tsx` |
| M-05 | Thiếu liên tục | Sheet/NavSheet trượt 200 ms nhưng lớp phủ bật tức thì | `ui/Sheet.tsx`, `ui/NavSheet.tsx` |
| M-06 | Thiếu định hướng | Menu/Popover phóng từ tâm, không từ nút mở | `ui/DropdownMenu.tsx`, `ui/Popover.tsx` |
| M-07 | Lệch token | Chưa có token thời lượng (số viết cứng); zoom ảnh 300 ms vượt mức slow 200 ms; `marker-focus` 300 ms trong khi DESIGN.md ghi 150 ms | `index.css`, `CareersPage.tsx` |

## 3. Không thêm motion
Sắp xếp bảng và J/K (DNA §9); Select, RichSelect, Tooltip; gạch chân tab; điều hướng giữa trang; toast (Sonner đã có); đổi trạng thái hồ sơ (đã optimistic); animation lúc đóng overlay (đóng tức thì là chấp nhận được). Không có kéo-thả pipeline nên không đặc tả. Ý tưởng "xem trước thứ hạng khi đổi trọng số" (Phase 01) là tính năng, ngoài phạm vi.

## 4. Motion specification (§06.3)

Chung: easing standard; chỉ `transform`/`opacity` (trừ nhịp màu); không thư viện.

| Trường | Dialog / AlertDialog (M-04) | Lớp phủ Sheet, NavSheet, Dialog (M-05) | Menu / Popover (M-06) | Sheet (giữ) | Đổi thứ hạng FLIP (giữ) | Nhịp căn cứ (giữ) |
|---|---|---|---|---|---|---|
| Trigger | mở | overlay mở | mở | mở | thứ tự dòng đổi | chọn tiêu chí |
| Initial | mờ, 0.98 | trong suốt | mờ, 0.98 | ngoài mép | vị trí cũ | nền marker |
| Target | rõ, 1 | `bg-ink/40` | rõ, 1 | tại chỗ | vị trí mới | nền thường |
| Duration | 150 ms | 150 ms (Dialog), 200 ms (Sheet) | 150 ms | 200 ms | 200 ms | 300 ms (DD-12) |
| Movement | không | không | không | translateX | translateY | không |
| Opacity | 0→1 | 0→1 | 0→1 | không | không | không |
| Scale | .98→1 | không | .98→1, gốc tại nút mở | không | không | không |
| Ngắt giữa chừng | đóng = gỡ ngay | gỡ ngay | gỡ ngay | gỡ ngay | lần sắp mới tính từ vị trí mới | chọn mục khác thì chạy lại |
| Reduced motion | fade ≤100 ms | fade ≤100 ms | fade ≤100 ms | fade ≤100 ms | không chạy | giữ (chỉ đổi màu) |
| Hiệu năng | compositor | compositor | compositor | compositor | một lần reflow mỗi lần đổi | repaint một đoạn |
| A11y | focus vào ngay, không chờ animation | như bên trái | như bên trái | như bên trái | focus giữ trên dòng | không thay cho `aria` |

Cuộn tới form / căn cứ (M-01): trigger bấm nút; cuộn mượt; reduced motion → `auto`; focus đặt ngay, không chờ cuộn.

## 5. Slices (mỗi slice 1 PR revert được + smoke, §05.5)

| Slice | Nội dung | Tiêu chí nghiệm thu |
|---|---|---|
| 6a | M-01, M-02, M-03 | test: reduced motion → `behavior: 'auto'`; palette không có class animation; fade 100 ms |
| 6b | M-04, M-05, M-06 | overlay/panel có animation đúng bảng; **focus vào ngay, không chờ animation**; mọi overlay đóng = gỡ ngay; test focus hiện có vẫn đạt; xem bằng trình duyệt ở 390/1440, cả reduced motion; dialog vẫn căn giữa |
| 6c | M-07 | token 100/150/200 ms dùng trong keyframe; test whitelist tường minh skeleton, caret, progress, spinner, `marker-focus` (DD-12); thời lượng > 200 ms nào khác làm test đỏ |

DoD §06.6: motion có mục đích, nhất quán, không mất focus, bàn phím chạy, có reduced motion, không giật, không chậm đi.

Ghi nhận từ review 6a, chủ dự án duyệt áp trong 6c (26/11/2026): khi reduced motion, `transition` của phần tử có class transition dài ≤100 ms.

Lưu ý 6b: lớp phủ Command Palette không nhận fade của M-05 (M-03).

## 6. Quyết định (26/11/2026)

- **Q1:** giữ `marker-focus` 300 ms; ngoại lệ có tên trong DESIGN.md, ghi DD-12.
- **Q2:** duyệt M-01…M-07 và thứ tự 6a → 6b → 6c.

## 7. Implementation log

### 6a — PR #171, merged `200ef40` (26/11/2026)
- Kiểm trước merge: FE 350 test; lint, typecheck, format, build, check:* exit 0; CI xanh. Code-review: sửa thêm lớp phủ `<dialog>` còn fade 150 ms khi reduced motion.
- Production smoke (khách, 390 px): `/jobs`, `/companies`, một trang chi tiết tin: 1 h1, không tràn ngang, console 0 lỗi; nút "Ứng tuyển" gọi `scrollIntoView` với `auto` khi reduced motion, `smooth` khi không; focus vào ô nhập. CSS production có fade `.1s` cho `::backdrop`.
- Chưa kiểm trên production: Command Palette (cần đăng nhập) — chỉ có test.
- Rollback: revert PR.

### 6b — PR #173, merged `83e5c85` (26/11/2026)
- Kiểm trước merge: FE 358 test; lint, typecheck, format, build, check:* exit 0; CI xanh. Code-review: không lỗi triển khai; bổ sung test thời lượng lớp phủ và Command Palette không fade.
- Trình duyệt local (Dialog, DropdownMenu, Popover, Sheet, NavSheet; có/không reduced motion): đúng nhịp, focus vào ngay, đóng sạch, hộp thoại căn giữa.
- Production smoke (khách, 390 px): `/jobs`, `/companies`, chi tiết tin: 1 h1, không tràn; hộp "Bộ lọc": lớp phủ `fade-in` 150 ms, panel `float-in` 150 ms (reduced: 100 ms), focus trong hộp, căn giữa, Escape đóng; console 0 lỗi.
- Chưa kiểm trên production: overlay khu nội bộ (cần đăng nhập).
- Lỗi có sẵn: `src/test/flows/detail-dialog.test.tsx` chập chờn khi chạy cả bộ ở máy local (cũng trượt trên `main`).
- Rollback: revert PR.

### 6c — PR #175, merged `14a411e` (26/11/2026)
- Kiểm trước merge: FE 367 test; lint, typecheck, format, build, check:* exit 0; CI xanh. Code-review: siết test chặn (class `animate-*` lạ, `delay-*`, thuộc tính tuỳ ý, CSS viết cứng, ghim `marker-focus` 300 ms).
- Production smoke (khách, 390 px): `/jobs`, `/companies`, chi tiết tin: 1 h1, không tràn; token `--duration-base` .15s; link 150 → 100 ms khi reduced motion, h1 không có transition (0 s); hộp "Bộ lọc" 150 ms / 100 ms; console 0 lỗi.
- Giới hạn của test chặn: không quét CSS thư viện (Sonner), style inline, WAAPI.
- Rollback: revert PR.

## 8. Đóng phase (DoD §06.6)
M-01…M-07 đã sửa. Motion có mục đích và dùng chung token; focus và bàn phím giữ nguyên (test + trình duyệt); reduced motion chỉ mờ ≤100 ms; không thêm thư viện. **Chưa đo:** hiệu năng (jank, bundle) bằng công cụ; overlay khu nội bộ chưa kiểm trên production.

Còn mở ngoài phase: `src/test/flows/detail-dialog.test.tsx` chập chờn ở máy local.
