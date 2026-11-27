# Rà soát UI theo apple-design (27/11/2026)

Bản 2: đã chạy với backend, giả lập điện thoại, cây trợ năng và toàn bộ test. Phần rà soát không sửa code, trên `main` tại `418e2c5`. **Đợt A đã triển khai sau đó, xem §9;** các mục từ §1 đến §8 mô tả hiện trạng trước khi sửa.

## 0. Môi trường và giới hạn

**Môi trường:** backend build từ `main` ở cổng 3002, FE Vite dev ở 5173, bản sao DB dev, Redis tạm, LLM và embedding giả, email vào Mailpit, kho tệp là bản sao. Không gọi production hay Gemini. DB bản sao và Redis tạm đã xoá. E2E API của BE ghi vào `hireflow_test` như thiết kế. `fe/dist`, `be/dist`, `be/coverage` được build lại (đều nằm trong `.gitignore`).

| Ký hiệu | Nghĩa |
|---|---|
| **[Đo]** | Quan sát hoặc đo trên app đang chạy, hoặc tính tỷ lệ tương phản WCAG |
| **[Code]** | Xác định từ mã nguồn |
| **[Suy]** | Suy luận, chưa kiểm |

**Chưa làm được:**
- **Trình đọc màn hình thật.** Máy không cài NVDA, và tôi không nghe được âm thanh. Phần trợ năng dựa trên cây trợ năng của Chromium, axe-core 4.10 và bàn phím. Kịch bản nghe thử ở §8.
- **Điện thoại thật.** Chỉ giả lập iPhone 13 (WebKit) và Android 360 px (Chromium). Giả lập không tái hiện việc iOS tự phóng khi focus ô nhập, bàn phím ảo hay thao tác vuốt.
- **Production** và bản build production: UI đo trên Vite dev.
- Đo khung hình khi chuyển động; `npm audit`.

## 1. Kết quả bộ test

| Bộ | Kết quả |
|---|---|
| FE typecheck, lint, format, `check:design`, `check:tokens`, `check:terms`, build, `check:bundle` | Đạt (lint có cảnh báo, exit 0) |
| FE vitest | 82 file, 373/373 |
| BE typecheck, lint, format | Đạt |
| BE unit | 50 file, 472/472; `test:cov` đạt |
| BE e2e | 31 file, 368/368; độ phủ gộp 94,2 % |
| Playwright: truy cập 6 vai, trạng thái, smoke 3 engine, ảnh baseline, lớp nổi | 20 đạt, 1 trượt (Ctrl K), 3 luồng ghi bỏ qua ở lượt đầu |
| Playwright luồng ghi F01, F02, F04 | 3/3 đạt sau khi xử lý môi trường (dưới) |

- **Ctrl K trượt thật:** 1 trượt ở lượt đầu, 2/5 khi lặp, 3/3 ở lượt sau. Nguyên nhân là lỗi sản phẩm UI-23.
- **Luồng ghi trượt lần đầu do môi trường:** (a) giới hạn đăng nhập 429 sau nhiều lượt test; (b) trên máy này `localhost:8025` đi vào listener IPv6 không trả lời, `127.0.0.1:8025` chạy được. Đặt `MAILPIT_URL=http://127.0.0.1:8025` và `NODE_OPTIONS=--dns-result-order=ipv4first` thì đạt.
- **Ảnh baseline** (17 màn × 2 khổ 1440 và 390) khớp.
- **axe-core:** 0 vi phạm ở 25 trang và các trạng thái mở (bộ lọc, menu dòng, thông báo, bảng lệnh, hộp thoại hồ sơ, đặt lịch, lỗi nhập liệu, xác nhận, menu điện thoại). Nhiều lỗi dưới đây axe không phát hiện được.

### Hai việc môi trường nên xử lý trước demo (không phải lỗi UI)
1. Container `hireflow-api` đang **khởi động lại liên tục** (đã ≥9 lần): `APP_PUBLIC_URL bắt buộc khi NODE_ENV=production`. Nếu demo bằng stack Docker ở `:8080` thì app không có API. Tôi không đụng vào.
2. Email local: backend chạy ngoài Docker gửi tới `localhost:8025` bị `fetch failed`/timeout trên máy này.

## 2. Tóm tắt

| Nhóm | Đánh giá | Vấn đề chính |
|---|---|---|
| Chuyển động | Khá | Gọn, ≤200 ms, reduced-motion đúng; không có chuyển động đóng |
| Phản hồi tương tác | Yếu | Không có trạng thái nhấn; thanh ứng tuyển và Ctrl K có lỗi |
| Chữ | Trung bình | Phóng cỡ chữ làm vỡ thứ bậc; serif cho CV chưa dùng |
| Nhất quán | Trung bình | `/login` còn theme cũ; bảng lệch DESIGN.md |
| Trợ năng | Khá, có lỗ hổng | axe sạch nhưng mất focus, tiêu đề trang đứng yên |
| Responsive | Tốt | Không tràn ngang ở 360, 390, 320 px; vùng chạm nhỏ |

**Đang tốt, nên giữ:** không tràn ngang và không lỗi JS ở 25 trang trên 2 thiết bị giả lập; mỗi trang đúng một h1, không nhảy cấp tiêu đề; đổi trang thì focus vào `main`; bảng có caption, tên checkbox và tên mức điểm rõ; hộp xác nhận có tên và nút rõ; token 100/150/200 ms có test chặn; giảm chuyển động đổi `float-in` 150 ms thành `fade-in` 100 ms [Đo].

## 3. P1

### UI-01. Checkbox, radio không có vòng focus — [Đo]
`fe/src/index.css:216` (`input:focus-visible { outline: none }`). Tab trên app: không có dấu focus ở mọi checkbox chọn dòng tại `/applications`, ô đồng ý của form nộp CV và form đăng ký nhà tuyển dụng, ô "Hiện buổi đã huỷ". WCAG 2.4.7.
```css
input:not([type='checkbox'], [type='radio']):focus-visible,
select:focus-visible,
textarea:focus-visible { outline: none; }
```

### UI-22. Thanh "Ứng tuyển vị trí này" không ẩn khi form đang hiện — [Đo]
`PublicJobDetailPage.tsx:24` (`useInView`). Trên iPhone giả lập, form hiện 547 px mà thanh ghim đáy vẫn còn, che form và lặp nút. Xảy ra ở cả WebKit và Chromium khi tải thẳng URL và khi bấm từ danh sách; chỉ đúng khi dữ liệu tin đã có trong cache.
**Nguyên nhân [Code]:** effect của `useInView` chạy một lần lúc trang còn đang tải, `ref.current` rỗng nên không bao giờ gắn observer.
**Sửa:** dùng callback ref giữ phần tử trong state và để effect phụ thuộc phần tử đó; thêm test "dữ liệu về sau".
Production có prerender nên tải thẳng có thể đúng; đi từ danh sách vẫn lỗi theo code [Suy].

### UI-24. Tiêu đề trang đứng yên "HireFlow" — [Đo]
Mọi trang nội bộ, `/login`, `/forgot-password`, `/employers/register` có `document.title = "HireFlow"`; đổi trang không đổi. Người dùng trình đọc màn hình và người mở nhiều tab không biết đang ở đâu. WCAG 2.4.2 (mức A). `use-document-title.ts` đã có, mới dùng cho trang công khai.
**Sửa:** gọi ở một chỗ chung (PageHeader hoặc `handle.title` của route).

### UI-02. Không có phản hồi khi nhấn — [Đo]
Giữ chuột trên nút primary, secondary, bộ lọc, tab, chuông, dòng bảng: **cả 6 không đổi gì** so với hover. Trên cảm ứng không có hover và `-webkit-tap-highlight-color` trong suốt, nên chạm không thấy gì.
**Sửa:** thêm vào gốc `buttonVariants`: `transition-[color,background-color,border-color,scale] duration-100 active:scale-[0.97] motion-reduce:active:scale-100 active:brightness-95` (không scale `variant: 'link'`); chip, tab, mục menu, dòng: `active:bg-ui-sunken`.

### UI-03. Vòng focus gần vô hình trên nền tối — [Đo]
Logo và "Trang tuyển dụng" trên rail: **1,92:1** (cần ≥3:1, WCAG 1.4.11). Cùng cách tính cho thanh thao tác hàng loạt và nút trong toast (1,99:1) và nút đóng menu điện thoại [Code].
**Sửa:** một class `.on-dark { --ui-focus: var(--color-v2-marker-soft) }` đặt ở các vùng nền tối.

## 4. P2

### UI-23. Ctrl K biến mất nếu bấm khi hộp thoại đang mở dở — [Đo]
Mở `/manage/jobs?xem=job:…`, bấm Ctrl K khi còn "Đang mở…": sau khi nội dung về, bảng lệnh không còn; bấm Ctrl K lần hai vẫn không hiện. Tái hiện cả khi không làm chậm mạng.
**Nguyên nhân [Suy từ code]:** `CommandPalette` portal vào `[data-layer]` của hộp thoại tạm; hộp thoại đó bị thay bằng hộp thoại thật, còn store vẫn ghi "đang mở".
**Sửa:** cho khung tải và nội dung dùng chung một `<dialog>`, hoặc đóng bảng lệnh khi hộp thoại chứa nó bị tháo. Test `overlays.spec.ts:16` đã bắt được; E2E trình duyệt không chạy trong CI.

### UI-15. Tăng cỡ chữ làm vỡ thứ bậc — [Đo]
Đặt cỡ chữ gốc 32 px (mô phỏng cài đặt cỡ chữ 200 %): chữ dùng `rem` to gấp đôi, utility `type-*` dùng px đứng yên. Ở trang "Hôm nay", nút "Duyệt hồ sơ" to hơn tiêu đề trang; rail cụt còn "Hô…", "Tin tu…"; logo bị cắt; tràn ngang 34 px. Reflow 320 px thì không tràn.
**Sửa:** font-size trong `type-*` theo rem, line-height không đơn vị; rail co giãn theo chữ.

### UI-25. Ô chọn tệp ẩn là điểm Tab vô hình — [Đo]
Form nộp CV (`FileUploader`) và Hồ sơ công ty (`ImagePicker`): input `sr-only` nhận focus không có dấu hiệu; ở `FileUploader` còn thêm nút "chọn từ máy" cùng việc.
**Sửa:** `tabIndex={-1}` cho input ẩn khi đã có nút; nếu không có nút thì hiện vòng focus trên khung bao.

### UI-26. Lỗi CV và ô đồng ý không gắn với trường — [Đo]
Gửi form rỗng: có 5 thông báo `role="alert"`, focus về Họ tên (tốt), nhưng chỉ 3 ô có `aria-invalid` (tên, email, điện thoại). CV và ô đồng ý không có.
**Sửa:** truyền `aria-invalid` và `aria-describedby` cho input tệp (hoặc nút chọn) và checkbox.

### UI-08. `radiogroup` không đi được bằng mũi tên — [Đo]
"Mật độ bảng": ArrowRight không đổi gì; cả hai lựa chọn đều `tabindex=0`. `SegmentedControl.tsx`, `ChipGroup.tsx` (code). `FilterTabs` đã làm đúng, tách logic đó dùng chung.

### UI-04. Bôi đen trông y hệt Căn cứ — [Đo]
`::selection` và `<mark>` cùng `rgb(251,233,179)`. Trái DESIGN.md và quyết định IR-3. Sửa `index.css:207`: `background: var(--ui-focus-soft)`.

### UI-07. Forced colors mất focus ở ô nhập — [Đo]
Ô tìm kiếm: `outline: none`, `box-shadow: none`. Sửa: `focus:outline-hidden` thay `focus:outline-none`. `Switch`, chấm trạng thái, thanh điểm có thể biến mất [Suy].

### UI-09. Vùng chạm dưới 44 px — [Đo] trên iPhone giả lập
| Nơi | Kích thước |
|---|---|
| Topbar: menu, tìm, chuông / tài khoản | 36×36 / 38×36 |
| Đầu trang công khai: "Việc làm", "Công ty" | 76×32, 71×32 |
| Ô nhập, bộ lọc | cao 36 |
| Tab | cao 40 |
| Link chữ ("Tất cả vị trí", "chọn từ máy", chân trang, link nhật ký) | cao 18–22 |

Hợp đồng Phase 03 yêu cầu 44 px với con trỏ thô. Link dưới 24 px có thể vẫn đạt WCAG 2.5.8 nhờ ngoại lệ khoảng cách.

### UI-06. Ô nhập dưới 16 px — [Đo] cỡ chữ, [Suy] hành vi iOS
Ô nhập 14 px: form nộp CV 3 ô, đăng ký nhà tuyển dụng 6, tạo tin 13, Hồ sơ công ty 46. Safari iOS sẽ phóng trang khi focus. Sửa: `pointer-coarse:text-base` trong `field-styles.ts`.

### UI-13. Nhãn mức điểm lệch Thuật ngữ — [Đo]
UI đọc "…trên 100, phù hợp / ít phù hợp", hiện "Một phần"; `GLOSSARY.md` quy định "Phù hợp cao / Phù hợp một phần / Phù hợp thấp" và "Khớp một phần". `check:terms` không bắt được. Sửa `score-tone.ts` và `MATCH_LEVEL`.

### UI-05. `/login` và các trang cùng khung còn theme cũ — [Đo] ảnh baseline
Nút xanh lá, tiêu đề Bricolage Grotesque từ Google Fonts; phần còn lại xanh dương, Be Vietnam Pro tự host. Ghi nhận là phần chưa lật (P5-D14c). Sửa: `useDocumentTheme('v2')` trong `AuthLayout`, gỡ thẻ Google Fonts, cập nhật ảnh CR-05.

### UI-10. Mở có chuyển động, đóng biến mất — [Đo]
Hộp xác nhận và menu điện thoại biến mất trong vòng 30 ms sau Esc; không nơi nào dùng `data-[state=closed]`. Ưu tiên Sheet và NavSheet (trượt vào thì trượt ra, 100–150 ms). Cần token `--animate-*` mới và cập nhật `motion.test.ts`.

### UI-11. Serif cho CV và câu trích chưa dùng — [Code]
DESIGN.md và DD-11 quy định Source Serif 4; font đã tự host, không class nào dùng. **Cần quyết định:** làm hoặc sửa tài liệu.

### UI-12. Tiêu chí không đánh số thống nhất — [Code] + ảnh
Thanh điểm và chấm tiêu chí ở xếp hạng không có số; thanh điểm phân biệt chủ yếu bằng màu, chi tiết nằm trong `title` (không dùng được khi chạm).

### UI-14. Bảng lệch DESIGN.md, skeleton lệch bảng thật — [Code]
Hàng 52/40 px (tài liệu 44/36); header nền surface (tài liệu sunken); skeleton header sunken 36 px, bảng thật surface 40 px.

## 5. P3

| ID | Vấn đề | Căn cứ | Đề xuất |
|---|---|---|---|
| UI-27 | Tìm không ra kết quả không được đọc: không có `role=status`/`alert` trong `main`; vùng live duy nhất là toast | [Đo] | thêm `role="status"` cho EmptyState sau khi lọc hoặc đọc số kết quả (WCAG 4.1.3) |
| UI-28 | Vùng cuộn trong hộp thoại và hồ sơ nhận focus nhưng tắt outline | [Đo] | hiện vòng focus inset |
| UI-29 | Ẩn mọi thanh cuộn (`index.css`); menu "Tải CV hộ" cắt giữa mục, không báo còn nữa | [Đo] ảnh | trả thanh cuộn mảnh cho vùng cuộn trong lớp nổi. Đây là chủ ý, cần quyết định |
| UI-16 | `type-title` weight 650; DESIGN.md quy định 600 | [Đo] 650; hiện bằng mặt 700 là [Suy] | đặt 600 |
| UI-17 | Hai thang chữ (token và utility viết tay), 68 chỗ `text-[13px]` | [Code] | một nguồn |
| UI-18 | Nhịp `marker-focus` tương phản 1,32:1, khó thấy | tính | thêm viền `marker-ink` thoáng qua |
| UI-19 | FLIP xếp hạng đọc `offsetTop`, đổi giữa chừng có thể giật | [Suy] | đo `getBoundingClientRect` |
| UI-20 | Toast chuyển động 0,4 s, vượt trần 200 ms | [Đo] | ghi ngoại lệ hoặc ghi đè |
| UI-21 | Bảng mờ ngay khi refetch, hết mờ thì giật | [Code] | giữ `transition-opacity`, trễ trước khi mờ |

## 6. Responsive

- 360, 390 px: 25 trang không tràn ngang; bảng chuyển thành thẻ; hộp thoại toàn màn hình; tab cuộn có mũi tên.
- 320 px: 5 trang kiểm thử không tràn.
- Tên tin dài bị cắt bằng dấu ba chấm trong thẻ hồ sơ và lịch phỏng vấn (chủ ý, nhưng trên cảm ứng không xem được tên đầy đủ tại chỗ).
- Lỗi riêng trên điện thoại: UI-22, UI-02, UI-06, UI-09.

## 7. Thứ tự triển khai đề xuất

| Đợt | Mục | Rủi ro |
|---|---|---|
| A (trước demo 30/11) | UI-22, 01, 24, 23, 03, 04, 13 | thấp; UI-23 cần chọn cách sửa; UI-13 có thể đụng test |
| B | UI-02, 25, 26, 08, 07, 06, 09, 27, 28, skeleton của 14, 16 | đổi cảm giác toàn app, xem lại 390 và 1440 |
| C | UI-05, 10 | đổi ảnh CR-05; đụng `motion.test.ts` |
| D | UI-15, 11, 12, 14, 17, 29 | **cần chủ dự án quyết định** (BR-PROC-01) |

Hai việc môi trường ở §1 nên xử lý trước cả đợt A. Sau mỗi đợt chạy lại bảng §1, đọc exit code.

**Không đề xuất:** spring, thư viện motion, vuốt để đóng, `backdrop-filter`, dark mode (không có thao tác kéo; DESIGN.md chốt phẳng và CSS/WAAPI).

## 8. Kịch bản nghe thử bằng trình đọc màn hình (chưa chạy)

Cài NVDA (Windows) hoặc dùng VoiceOver (iPhone), khoảng 20 phút:

| # | Thao tác | Cần nghe được |
|---|---|---|
| 1 | Đăng nhập bằng bàn phím, nhập sai một lần | nhãn ô, thông báo lỗi |
| 2 | Chuyển giữa 3 trang bằng rail | tên trang mới (dự đoán không đạt, UI-24) |
| 3 | `/applications`: đi bảng, chọn một dòng | tên cột, trạng thái chọn |
| 4 | Lọc đến rỗng | "không có kết quả" (dự đoán không đạt, UI-27) |
| 5 | Mở hộp thoại hồ sơ, đổi tab, Esc | tên hộp thoại, tab đang chọn, focus quay lại |
| 6 | Nộp CV thiếu dữ liệu | từng lỗi gắn đúng trường (dự đoán thiếu CV, đồng ý) |
| 7 | Hỏi kho CV | "Đang trả lời…", "Đã trả lời xong" |
| 8 | Chờ toast sau Xuất CSV | nội dung toast |

## 9. Đợt A: đã triển khai

| ID | Đã sửa | Kiểm trên app |
|---|---|---|
| UI-22 | `useInView` nhận phần tử qua state | Thanh ẩn khi ở form (WebKit, Chromium; tải thẳng và từ danh sách) |
| UI-01 | outline không còn bị tắt cho checkbox, radio | Ô đồng ý và ô chọn dòng có vòng focus |
| UI-24 | AppShell đặt tiêu đề theo menu và breadcrumb; 6 trang đăng nhập, đăng ký tự đặt | Đúng ở các route đã thử; trang không tìm thấy vẫn là "HireFlow" |
| UI-23 | Bảng lệnh theo dõi lớp hộp thoại và chuyển sang lớp mới | Mở sớm 5/5 lần: gõ được, Esc chỉ đóng bảng |
| UI-03 | class `.on-dark` ở rail, menu điện thoại, toast, thanh hàng loạt, xem ảnh | Vòng focus màu vàng nhạt trên nền tối |
| UI-04 | `::selection` dùng màu focus mềm | Không còn trùng màu Căn cứ |
| UI-13 | Nhãn theo `GLOSSARY.md` | "Phù hợp cao", "Khớp một phần" |

Test thêm 3 (UI-22, UI-23, UI-24); cả 3 trượt trên code cũ. FE vitest 376/376; typecheck, lint, format, `check:design`, `check:terms` đạt. Playwright đầy đủ 21 đạt, 3 luồng ghi bỏ qua; ảnh baseline không phải đổi. Bộ lớp nổi chạy 5 vòng cách nhau 61 giây (giới hạn đăng nhập): 25/25.
