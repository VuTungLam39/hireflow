# Phase 05 — Implementation Log

Validation status carried in: Phase 04 PASSED — internally validated only; human task time not measured.
Gate split [D-02]: slices 0–6 and 12 free; slices 7–11 locked until R1–R3 merged + Security Gate re-check passed.

## Quyết định Phase 05 (decision log)
| ID | Ngày | Quyết định (chủ dự án) | Đối chiếu | Lý do / điều kiện |
|---|---|---|---|---|
| P5-D01 | 24/11/2026 | Văn bản pháp lý/chính sách ngoài phạm vi guard thuật ngữ; không sửa câu chữ chính sách | GLOSSARY Avoid list, Phase 03 file 09 | guard chỉ cho UI copy + thuật ngữ tính năng (Entry 1, thực hiện ở Entry 2) |
| P5-D02 | 24/11/2026 | (a) Giữ nhìn cũ, lật token theo trang bằng `data-theme="v2"`; (b) cấm sửa file vùng khoá ở slice không khoá, kể cả call site; (c) VF-10 dựng primitive ở slice 1, gắn ở slice 10 | luật strangler (Phase 03 file 09), [D-02] | lật cơ học + sổ lật theme; primitive tương thích ngược; checklist bàn giao (Entry 2) |
| P5-D03 | 24/11/2026 | PR giảm bundle route vào trước slice 3 | primitives decision — điều kiện dừng 40 KB | route vào 321.35 → 288.44 KB; Radix vẫn ở `vendor` (Entry 4) |
| P5-D04 | 24/11/2026 | **Tabs giữ engine tự viết, không Radix** | **Phase 03 file 04 — primitives decision Option 1 (Tabs: Radix inside)**; contract Tabs (file 05) | Tabs trong sản phẩm là **thanh lọc không có panel**; Radix Tabs sinh `aria-controls` tới panel không tồn tại. Điều kiện: (1) ghi vào decision log, đối chiếu primitives decision ✔; (2) bản tự viết phải đúng ngữ nghĩa thanh lọc → `FilterTabs` = radiogroup/radio + `aria-checked` (Entry 6); (3) trang đầu tiên có tab-có-panel thật → chuyển Radix Tabs ở slice đó và tách tên: **Tabs** = tab có panel, **FilterTabs** = thanh lọc. Điểm kích hoạt đã có sẵn: DetailDialog (slice 5), ApplicationDetailPage (slice 8) |
| P5-D05 | 24/11/2026 | Slice 4 chia **2 PR**: 4a chức năng (nhìn cũ), 4b lật toàn bộ trang công khai sang v2 một lần; Combobox công ty dùng **cmdk** | [D-10] (1 slice = 1 PR); contract Combobox ("decided in its slice") | header/footer dùng chung → mọi trang công khai phải lật cùng lúc (strangler); tách chức năng khỏi đổi giao diện để review/so ảnh/hoàn tác riêng |
| P5-D06 | 25/11/2026 | Slice 5: (a) §05.5 = **PR chuẩn bị (5a) + PR thật (5b)**, không feature flag; (b) khung nội bộ **giữ v1**, lật nội bộ khi trang bên trong dựng lại; (c) Command Menu = **cmdk** trong Dialog, nhóm theo contract; (d) Rail compact = **NavSheet** riêng, Sheet quick view giữ DL-16 | [D-10] §05.5; contract Command Menu ("chosen in its slice"), Sheet (DL-16) | khung bao mọi trang nội bộ kể cả vùng khoá → tách đổi cấu trúc khỏi đổi hành vi; tránh khung v2 bọc trang v1 |
| P5-D07 | 25/11/2026 | (a) DetailDialog **giữ Tabs tự viết**, sửa `aria-controls` ↔ `id` panel; Radix Tabs xét ở slice 8 (hợp nhất engine). (b) Tab có panel: **kích hoạt tự động** cho panel nhẹ/đã nạp, thủ công cho panel nặng/tải lười (quy tắc file 05) — **sửa dòng Tabs ở Phase 03 file 06** cho khớp. (c) Contract Command Menu sửa theo thực tế phân vai: **"Tìm ứng viên"** (vai có `candidate:read`: HR, HM — kết quả là người) / **"Tìm hồ sơ"** (Interviewer); code giữ nguyên | P5-D04 điều kiện 3; Phase 03 file 05 (Tabs, Command Menu), file 06 (Tabs); DL-09; §05.2 | kiểm APG: bàn phím đạt trọn, chỉ thiếu nối một chiều (2 thuộc tính) → không thay engine; mâu thuẫn chế độ kích hoạt là giữa hai contract, không phải lỗi code; đổi nhãn sẽ phá luồng tìm theo người hợp lệ của HR (Entry 11) |
| P5-D08 | 25/11/2026 | Slice 6: (a) hành vi DataTable có xung đột là **opt-in** `layout="container"` (thẻ <600 container, ô chọn 44 px VF-05, Space = chọn dòng) — ApplicationsPage (vùng khoá) giữ nguyên, slice 7 bật; phần thuần cộng (J/K, StaleNotice, `priority`, `sticky`) áp mọi nơi. (b) Ngưỡng cột **cố định bằng container query**: ưu tiên 4 ẩn <1024, 3 ẩn <840, 2 dời xuống dòng phụ <720, 1 không ẩn | [D-02], P5-D02b; Phase 03 file 05 (DataTable), file 07 T1–T5 | không đổi hành vi trang chủ lực của HR trước khi slice của nó kiểm chứng; CSS thuần, không đo JS → không nhảy bố cục |
| P5-D09 | 25/11/2026 | (a) **Giữ ngưỡng cột** (ưu tiên 4 ẩn <1024 container) — không hạ về ~960; là tham số đã biết, chỉnh một dòng (`priorityClass` trong DataTable) khi dùng thật có bằng chứng vướng. (b) **Làm Security Gate trước** (R1 → R2 → spike R3 → R3 → re-check), slice 12 là slice đệm | Phase 02 cơ chế ưu tiên cột; [D-02]; SG-01 (CRITICAL, cách ly tenant) | ở 1280 px cột ưu tiên 4 không mất mà xuống dòng phụ có nhãn (sau #137); ngưỡng toàn cục, đổi là mở lại kiểm 5×5; gate mở khoá slice 7–11, R1 là điều kiện cứng trước dữ liệu thật |
| P5-D10 | 25/11/2026 | Slice 7: (a) **bulk theo prototype P3** — luôn hiện Chuyển sang Sàng lọc / Phỏng vấn / Từ chối… (lý do chung), backend xử lý từng hồ sơ, tóm tắt có lý do bỏ qua; (b) **xem nhanh chỉ đọc cho mọi vai** — Interviewer thấy lịch phỏng vấn chỉ đọc, điền phiếu ở trang chi tiết; (c) **lật trang Hồ sơ ứng tuyển sang v2**, khung giữ v1 | Phase 04 file 05 dòng 7, `p3-pipeline.html`; DL-16; P5-D06b | bỏ điều kiện "cùng trạng thái" khó hiểu, backend vốn trả kết quả từng hồ sơ; Sheet không chứa thao tác (DL-16), phiếu dựng lại ở slice 10 |
| P5-D11 | 25/11/2026 | Slice 8: (a) **hộp quyết định theo P1** — một nút "Chuyển trạng thái" mở AlertDialog có ô chọn trạng thái không chọn sẵn, lý do chỉ khi Từ chối, nút xác nhận theo lựa chọn; (b) **tab có panel chuyển Radix Tabs** (`@radix-ui/react-tabs` 1.2.1) cho cả ApplicationDetailPage và DetailDialog; `FilterTabs` giữ radiogroup tự viết | Phase 04 file 05 dòng 8, `p1-cv-review.html`; VF-01, VF-02, OP-1; P5-D04 điều kiện 3, P5-D07a | theo thiết kế đã kiểm chứng P1 (không giữ nút theo bước); hợp nhất engine tab-có-panel — **đóng P5-D04 điều kiện 3** |
| P5-D12 | 25/11/2026 | Slice 9: (a) **giữ panel "Vì sao"** (không mở rộng dòng theo P2) — màn hẹp SidePanel → Sheet; (b) **thêm `scoredJdVersion` vào `GET /jobs/:id/ranking`** (chỉ cộng thêm) cho thông báo "đang chấm lại" | Phase 04 file 05 dòng 9, `p2-ranking.html`; DL-16; §05.2 (hợp đồng API giữ, chỉ cộng trường) | panel đã đạt 1 thao tác, giữ ảo hóa + hiệu ứng đổi hạng + khay so sánh; FE không có cách khác biết hồ sơ chấm theo tiêu chí cũ |

## Entry 0 — Planning record merged into main (pre-Slice 0)
- **Decision:** owner, 24/11/2026 — option (a): merge planning branch into main before Slice 0, via PR, with verification gate.
- **Verification:** `git log origin/main..feat/mvp31-s5-release` = 7 commits (513b8e7, 2db8ba6, a5af803, 24775d3, 931decc, 05baf4b, 279f90f; commit "B" for conversation logs was never made). `git diff --name-only origin/main...feat/mvp31-s5-release` = 532 files; **no** `fe/src/`, `be/`, `fe/package*.json`, product lockfiles or migrations (1bf3c67 and earlier were already on main via PR #109).
- **PR:** #110 — CI green (BE lint/typecheck/unit/build, BE e2e, FE lint/typecheck/test/build, Vercel preview).
- **Merge:** `581ee0a` (merge commit) into `main`.
- **Production smoke (after Vercel production deploy = success):** HTTP checks only — `/jobs` 200 (title "Việc làm đang tuyển – HireFlow Careers"), `/companies` 200 ("Công ty đang tuyển – HireFlow Careers"), `/login` 200, `GET /api/v1/public/jobs` 200. No browser render or sign-in performed. Docs-only change → expected behavioural no-op.
- **Consequence:** Slice 0 branches off the updated `main` (DESIGN.md, Phase 03 contracts, Phase 04 spec now present) — resolves the baseline question from Phase 04 Checkpoint 2.
- This log file itself is not yet committed; it lands with Slice 0's PR.

## Entry 1 — Slice 0: Foundations (🟢)
- **Spec + tickets:** issue #111 (spec, phạm vi, T1–T6, AC). Kỹ năng `/to-spec`, `/to-tickets` không có trong môi trường phiên này → spec/tickets viết tay theo `docs/agents/issue-tracker.md`.
- **Base:** `feat/phase05-slice0-foundations` từ `main @ 581ee0a`.
- **Đã làm:** theme sinh từ DESIGN.md (`npm run tokens`, `@google/design.md` 0.4.0 pin, devDependency) → `fe/src/styles/tokens.generated.css`; font tự host Be Vietnam Pro + Source Serif 4 (`fe/public/fonts`, 18 woff2, 376 KB tổng, chỉ tải theo unicode-range/khi dùng); module nhãn `fe/src/lib/terms.ts` + `SurfaceProvider` (PublicLayout = public); `npm run check:terms` + baseline; `[hidden]` (VF-07); ride-along DL-08 (Offer, Đã nhận việc, Có căn cứ bị loại).
- **Kiểm cục bộ:** `designmd lint` 0 lỗi/0 cảnh báo (1 info token-summary) · check:tokens · check:terms · check:design · format · lint · typecheck · test 69 file/279 test xanh · build xanh (index JS 19.12 KB gzip). CSS build: 6 token trùng tên giữ giá trị cũ (`--color-surface #fff`, `--color-marker #fce98a`, `--font-display` Bricolage, `--radius-md 10px`).
- **Lệch so với spec:**
  - Alias theo hướng "token cũ thắng khi trùng tên" (6 tên: `--color-surface`, `--color-marker`, `--font-display`, `--radius-sm/md/lg`) để giữ AC "không hồi quy giao diện"; component mới không được dùng 6 tên này cho tới khi slice đầu tiên chuyển hết call site cũ — slice 1 phải quyết cách gỡ.
  - Be Vietnam Pro tự host gồm cả 700 (code cũ dùng `font-bold`; Phase 03 file 02 chỉ 400/500/600) — bỏ 700 khi call site cuối chuyển.
  - Bricolage Grotesque vẫn tải từ Google Fonts (tiêu đề cũ); gỡ ở slice dựng lại tiêu đề.
  - Serif "lazy trên route tài liệu" = không preload + @font-face chỉ tải khi có phần tử dùng (chưa có, CV Review là slice 8).
  - `prerender/entry.tsx` chưa bọc SurfaceProvider (chưa component nào đọc context); slice 4 phải bọc khi dùng `useJobNoun`.
  - `package.json`: thêm devDependency `@google/design.md` 0.4.0 (lockfile +~1.5k dòng) và 3 script (`tokens`, `check:tokens`, `check:terms`).
- **Checklist thuật ngữ còn lại (baseline `fe/scripts/check-terms.baseline.json`, 15 mục) — slice dựng lại màn hình đó xoá mục tương ứng:**
  - [x] applications/CvSheet, CvTextDialog — "bằng chứng" (slice 8)
  - [ ] applications/OfferPanel (10), hooks/use-offers (6), audit/audit-format (8), dashboard/DashboardPage (1), lib/error-codes (3) — "offer" viết thường (slice 11 / 12; error-codes theo slice chạm thông báo)
  - [x] applications/hooks/use-applications, pages/ApplicationsPage — "Đề nghị" trong thông báo bulk (slice 7)
  - [ ] candidates/CandidateSections — "bằng chứng" (slice 12)
  - [ ] dashboard/FunnelReport — "Đã nhận" (slice 12)
  - [x] ranking/RankingTable — "Xếp hạng ứng viên" (slice 9); jobs/JobsPage đã xử lý trước
  - [x] public-jobs/PrivacyPolicyPage — "bằng chứng", "nhận xét phỏng vấn": **miễn trừ** (quyết định chủ dự án 24/11/2026, bên dưới); giữ nguyên câu chữ, mục baseline gỡ khi slice 1 thu hẹp phạm vi quét
- **Quyết định chủ dự án (24/11/2026):** văn bản pháp lý/chính sách nằm **ngoài phạm vi** guard thuật ngữ; guard chỉ áp cho UI copy và thuật ngữ tính năng. Hai chỗ trong trang chính sách bảo mật ("bằng chứng", "nhận xét phỏng vấn") được chấp nhận là ngôn ngữ pháp lý thông thường; không sửa câu chữ chính sách.
- **Xếp hàng cho Slice 1:** (1) thu hẹp phạm vi quét của `check:terms` về UI copy (loại văn bản pháp lý/chính sách, gỡ 2 mục PrivacyPolicyPage khỏi baseline); (2) thêm file giấy phép OFL cho font tự host; (3) gỡ 6 token trùng tên.
- **PR:** #112 — CI xanh (FE lint/typecheck/test/build gồm check:tokens + check:terms; BE lint/unit/build; BE e2e; Vercel preview deploy). Preview trả 302 (Vercel Deployment Protection) → chưa so giao diện 1440/1024/768/390 và chưa đo LCP; cần chủ dự án mở preview khi đã đăng nhập Vercel, hoặc kiểm sau merge. **Merged.**
- **Merge:** `36d2f25` (merge commit PR #112) vào `main`.
- **Production smoke (Chrome, https://hireflow-gray-zeta.vercel.app):** `/jobs` và `/companies` hiển thị bình thường; font tự host được tải (`/fonts/BeVietnamPro-*.woff2`), tiêu đề vẫn Bricolage, `--color-surface #fff` / `--color-marker #fce98a` giữ giá trị cũ; LCP `/jobs` 1504 ms ở viewport 1536 px (không có số đo trước merge để so → AC "LCP không tệ hơn" **chưa chứng minh**). Không đổi được viewport (resize cửa sổ không có tác dụng) → **chưa kiểm 1024/768/390**.
- **HỒI QUY phát hiện ở smoke:** trang `/login` panel trái vỡ chữ (mỗi từ một dòng). Nguyên nhân: token `--spacing-xs..xl` sinh từ DESIGN.md bị Tailwind v4 dùng cho `max-w-{xs,sm,md,lg,xl}` (`max-w-md` = 16px); 9 call site bị ảnh hưởng. Bài học: so sánh CSS trước merge chỉ kiểm token trùng tên, không kiểm namespace utility.
- **Hotfix:** nhánh `fix/phase05-slice0-spacing-tokens` — `npm run tokens` đổi `--spacing-*` → `--space-*` (`scripts/tokens-namespace.mjs`). Đã so từng rule utility trong CSS build giữa `581ee0a` (trước slice 0) và hotfix: chỉ khác `rounded-full` (`2147483647px` → `var(--radius-full)` = 9999px, không đổi hình). PR #113, merge `99a0c46`.
- **Production smoke sau hotfix (Playwright, 24/11/2026, `/jobs` `/companies` `/login` × 1440/1024/768/390):** 12/12 không tràn ngang; không còn khối chữ bị bóp hẹp (<40 px); `/login` panel trái hiển thị đúng; Be Vietnam Pro tải từ `/fonts/` (8–9 file/trang), không còn request Google cho Be Vietnam Pro; LCP lần tải đầu `/jobs` 1316 ms, `/companies` 404 ms, `/login` 708 ms (các lần sau 116–192 ms do cache). Không có số đo trước slice 0 → AC "LCP không tệ hơn" vẫn **chưa chứng minh** bằng so sánh.
- **Ghi nhận có từ trước (không do slice 0):** header công khai chồng chữ ở 390 px ("Công ty"/"Nhà tuyển dụng") = F-01 → slice 4; `/login` có 2 `h1` → slice 5 (AC "one h1").
- **Chưa kiểm:** các trang sau đăng nhập (nhãn DL-08 mới) — không đăng nhập trong smoke.

## Entry 2 — Slice 1: Buttons & form primitives (🟢)
- **Spec + tickets:** issue #115. Base `feat/phase05-slice1-primitives` từ `main @ f08ea85`.
- **Quyết định chủ dự án (24/11/2026):** (1) giữ nhìn cũ, lật token theo trang — cơ học, có sổ; (2) cấm sửa file vùng khoá ở slice 1, kể cả call site; (3) VF-10 dựng primitive ở slice 1, gắn ở slice 10.
- **Đã làm:**
  - Token: mọi token sinh từ DESIGN.md sang namespace `-v2-` (`--color-v2-*`, `--font-v2-*`, `--text-v2-*`, `--radius-v2-*`, `--space-v2-*`…) → **6 tên trùng của slice 0 đã gỡ**, không còn quy ước "token cũ thắng". `fe/src/styles/ui-theme.css`: lớp ngữ nghĩa `--ui-*` (utility `bg-ui-primary`, `rounded-ui`…), `:root` = màu cũ, `[data-theme='v2']` = DESIGN.md. Focus ring toàn cục + `accent-color` đi qua `--ui-*`.
  - Primitive: Button (primary/secondary/ghost/danger/link + alias `quiet`/`inverse`/`danger-quiet`, `leadingIcon`, loading thay icon) · IconButton mới · FormField (`description`, `required` → "(bắt buộc)", tự nối `aria-describedby`/`aria-invalid` vào control; giữ `hint`/`optional`) · Input `size` · Textarea `autoGrow` · Checkbox (token) · RadioGroup mới · Switch mới · RatingScale mới (VF-10).
  - Chuyển `<button>` thô dạng link → `Button variant="link"`: `jobs/components/RequirementEditor` ("Giữ nguyên"), `jobs/components/JobOverview` ("Xem N hồ sơ").
  - Guard thuật ngữ miễn `PrivacyPolicyPage.tsx` (văn bản pháp lý); baseline 15 → 13. File OFL: `fe/public/fonts/OFL-BeVietnamPro.txt`, `OFL-SourceSerif4.txt`.
- **Kiểm:** 7 test primitive mới (loading, alias, IconButton tên + tooltip khi focus bàn phím, FormField nối mô tả/lỗi + "(bắt buộc)", Switch Space, RadioGroup fieldset/legend, RatingScale radio trong label + mũi tên) + axe 0 vi phạm trên Switch/RadioGroup/RatingScale/FormField (tắt color-contrast vì jsdom) · toàn bộ 287 test xanh · format, lint, check:design, check:terms, check:tokens, typecheck, build xanh. **Không đổi hình ở theme v1:** so từng rule utility trong CSS build `main` vs nhánh sau khi resolve `var(--ui-*)` → chỉ khác `rounded-full` (9999px ↔ mặc định Tailwind, nhìn như nhau) và fallback hex của `hover:bg-ui-danger/90` (trình duyệt hiện đại dùng `color-mix` giống hệt). Vùng khoá: 0 file thay đổi.
- **VF-08:** đạt sẵn — input file của FileUploader và ImagePicker là `sr-only` (dropzone hiển thị), GallerySection `block w-full`; không đổi code.
- **Lệch so với contract (ghi nợ):**
  - Disabled giữ kiểu cũ (nền sunken + chữ muted) thay vì `opacity .5` — đổi kiểu disabled sẽ đổi hình cả trang khoá chưa dựng lại; áp contract khi trang lật v2.
  - `asChild` chưa có (cần Slot) → slice 2 cùng Radix; link dạng nút tạm dùng `buttonVariants()`.
  - DESIGN.md chưa có `danger-soft`/`focus-soft` → v2 trộn bằng `color-mix` (`shortcut:` trong `ui-theme.css`); thêm token khi trang đầu tiên lật.
  - FormField hiện gợi ý cả khi có lỗi (trước đây lỗi thay gợi ý) — theo contract mô tả luôn nối vào control.
- **`package.json`:** không đổi.

### Sổ lật theme (data-theme="v2")
| Trang / route | Slice | Trạng thái |
|---|---|---|
| PublicLayout + mọi trang công khai: `/jobs`, `/jobs/:id`, `/jobs/:id/apply` (form trong trang chi tiết), `/companies`, `/companies/:slug`, `/track`, `/privacy`, `/employers/*`, 404 công khai cho khách | 4b | **v2** (PR 4b) |
| `/applications` (ApplicationsPage, gồm Sheet xem nhanh) | 7 | **v2** (khung AppShell vẫn v1 – P5-D06b) |
| `/applications/:id` (ApplicationDetailPage) | 8 | **v2** |
| `/jobs/:id/ranking` (JobRankingPage, route riêng; bản nhúng trong hộp tin giữ v1) | 9 | **v2** |
| AuthLayout (`/login`), các trang nội bộ còn lại | — | v1 |
Quy tắc: lật cả trang trong slice dựng lại trang đó bằng `data-theme="v2"` trên gốc trang/layout; không lật từng component.

### Bàn giao cho slice khoá (không sửa ở slice 1)
- [x] `applications/components/JobApplicationHighlights.tsx:84` — slice 8
- [x] `applications/components/RequirementList.tsx:81` — slice 8
- [x] `applications/components/StatusActions.tsx:83` — slice 8
- [x] `applications/pages/ApplicationDetailPage.tsx:251`, `:276` — slice 8
- [ ] `applications/pages/ApplicationsPage.tsx:562` — slice 7
- [x] `ranking/pages/JobRankingPage.tsx:262` — slice 9
- [ ] `interviews/components/FeedbackDialog.tsx:33`, `:149` — slice 10
- [ ] `interviews/components/QuestionSuggestions.tsx:51` — slice 10
- [ ] **VF-10:** `RatingScale` đã sẵn (`components/ui/RatingScale.tsx`, có test) — **chờ gắn** vào Phiếu đánh giá ở slice 10; slice 10 được chỉnh primitive nếu cần.
- Alias variant `quiet`/`inverse`/`danger-quiet` và prop `hint`/`optional` của FormField gỡ khi call site cuối (phần lớn trong vùng khoá) chuyển.

### `<button>` thô còn lại ngoài vùng khoá (slice sở hữu)
layouts Sidebar/Topbar/UserMenu (7) → slice 5 · ConfirmDialog/DetailDialog/SidePanel/RowMenu (5) → slice 2 · DataTable/FilterBar/DateRangeFilter (7) → slice 4/6 · FileUploader (2) → slice 4 · public GalleryLightbox/CareersPage (3) → slice 4 · LoginPage (1) → slice 5 · jobs JobsPage (3) → slice 6, JobFormPage menu (3) → slice 2 (Dropdown Menu), InterviewStagesEditor chip (1) → giữ (chip là toggle, không phải Button) · candidates CvSearchResults (1), ai-chat (3), notifications (2) → slice 12/5.

- **PR:** #116 — CI xanh (FE, BE, BE e2e, Vercel). **Merged:** `e77fe50`.
- **Production smoke (Playwright, 24/11/2026, `/jobs` `/companies` `/login` + 1 trang chi tiết việc làm × 1440/1024/768/390):** 16/16 không tràn ngang, không khối chữ bị bóp hẹp; `--ui-primary` = `#1e5b4f` (màu cũ) và `--color-v2-primary` = `#1f4e79` có mặt → cơ chế lật sẵn sàng, chưa trang nào lật; nút chính ("Đăng nhập", "Nộp hồ sơ") nền `rgb(30, 91, 79)` = màu cũ, không đổi hình. Header 390 chồng chữ = F-01 có từ trước (slice 4). Chưa kiểm trang sau đăng nhập (nơi có 2 nút link đã chuyển: tạo/sửa tin, tổng quan tin).

## Entry 3 — Slice 2: Overlay layer — slice Radix đầu tiên (🟢)
- **Spec + tickets:** issue #118. Base `feat/phase05-slice2-overlays` từ `main @ e77fe50`.
- **Phụ thuộc mới:** `@radix-ui/react-dialog` 1.3.1, `@radix-ui/react-alert-dialog` 1.2.1, `@radix-ui/react-dropdown-menu` 2.2.1 (pin chính xác; Radix nằm sau house API, không call site nào thấy prop Radix).
- **Đã làm:**
  - **Dialog** dựng lại trên Radix, giữ props cũ (`onClose`) + `onOpenChange`; <600 px toàn màn hình; `useReturnFocus` trả focus về phần tử mở dialog (Radix chỉ tự trả về `<Trigger>` của nó — mọi call site hiện có mở bằng nút ngoài, test đã bắt lỗi này).
  - **AlertDialog** mới: `role=alertdialog`, focus đầu vào "Huỷ" (ít phá huỷ nhất), mã lý do không chọn sẵn (VF-01), `confirmLabel` do nơi gọi truyền theo hành động (VF-02), `onConfirm` trả promise → tự loading, lỗi → giữ nội dung + thông báo + nút **"Thử lại"** (OP-1), đóng khi thành công.
  - **Sheet** mới (quick view): 480 px, toàn màn hình <600 px, prev/next với nhãn do nơi gọi truyền, `detailHref` bắt buộc, chỉ "Mở chi tiết" — **không có chỗ đặt hành động đổi trạng thái** (DL-16). Chưa có call site (quick view là slice 7).
  - **DropdownMenu** mới (items theo contract); **RowMenu** (Users, Departments, Jobs) và menu "Thao tác khác" của JobFormPage chạy trên nó (3 `<button>` thô của JobFormPage đã gỡ).
  - Call site ConfirmDialog ngoài vùng khoá → **AlertDialog**: candidates/CandidateSections, company/BrandImages, departments/DepartmentsPage, jobs/JobSections, jobs/JobFormPage, jobs/JobsPage, operations/AiQueuePage, platform/PlatformCompanyDetailPage, public-jobs/TrackApplicationPage (**Rút hồ sơ** giờ là alertdialog — VF-06 phần primitive), users/UsersPage (2).
  - **ConfirmDialog bản cũ giữ nguyên** (trên Dialog Radix, `role=dialog`) — chỉ còn call site vùng khoá.
  - Test sửa theo (ngoài vùng khoá): Users/Departments mở menu bằng bàn phím + `aria-disabled` (Radix không dùng thuộc tính `disabled` cho menuitem); Company/AiQueue/Track/Platform chờ `alertdialog`.
- **Đo bundle (vite build, gzip mức 9, tổng JS+CSS mà `index.html` tải/preload = route vào):** trước **291.21 KB** → sau **321.35 KB** = **+30.14 KB** (vendor 101.35 → 130.44; ui 6.62 → 10.07). **< 40 KB → điều kiện dừng không kích hoạt, tiếp tục dùng Radix.** Lưu ý cho chủ dự án: chunk `vendor` gom mọi `node_modules` nên Radix tải ở mọi route kể cả trang công khai; còn ~9.9 KB dư địa trước ngưỡng cho slice 3 (Tabs/Popover/Tooltip/rich Select — Popover/Tooltip kéo theo floating-ui). Phương án giảm nếu cần: tách nhóm chunk Radix/overlay để chỉ tải khi mở overlay — chưa làm (cần quyết định).
- **Kiểm:** 5 test overlay mới (Dialog: focus vào trong, bẫy Tab, khoá cuộn, Escape, trả focus; AlertDialog: focus "Huỷ", không chọn sẵn, OP-1 giữ nội dung + "Thử lại"; Sheet: chỉ "Mở chi tiết" + điều hướng, Escape; DropdownMenu: mũi tên/Home/End/typeahead/Escape trả focus) + axe 0 · toàn bộ test xanh · format, lint, check:design, check:terms, typecheck, build xanh. Vùng khoá: 0 file thay đổi (test vùng khoá ApplicationDetailPage + flow bulk-status vẫn xanh nhờ ConfirmDialog bản cũ).
- **Lệch / ghi nợ:**
  - Overlay bỏ animation mở (Design Spec cấm `animate-fade-in`; dialog cũ cũng không có).
  - DetailDialog (native `<dialog>`, modal thứ 5) chưa chuyển: dùng bởi DetailHost/JobWorkspace/JobCreate (slice 5) và ApplicationDialog/CompareDialog (vùng khoá) → slice 5 + 7/8.
  - SidePanel chưa chuyển sang Sheet: call site QuickView/ApplicationDetail/Ranking thuộc vùng khoá (slice 7/8/9); ChatPage dùng SidePanel làm khung trích dẫn (không phải quick view) → slice 12.
- **`package.json`:** thêm 3 dependency Radix (runtime). Lockfile đổi theo.

### Bàn giao thêm cho slice khoá
- [ ] ConfirmDialog → AlertDialog: `applications/components/OfferPanel` (slice 11), `applications/components/StatusActions` (slice 8), `applications/pages/ApplicationsPage` (slice 7), `interviews/components/InterviewPanel` (slice 10). Khi call site cuối chuyển → xoá `components/shared/ConfirmDialog.tsx`.
- [ ] SidePanel → Sheet (DL-16, URL `?xem=`): QuickView + ApplicationDetailPage (slice 7/8), JobRankingPage (slice 9).

- **PR:** #119 — CI xanh. **Merged:** `e9f029b`.
- **Production smoke (Playwright, 24/11/2026):** trang công khai `/jobs` `/companies` `/login` + 1 chi tiết việc làm × 1440/1024/768/390 → 16/16 không tràn ngang, không chữ bị bóp; `--ui-primary` vẫn màu cũ; chunk `vendor-TmOoJZmz.js` (có Radix) đúng bản build. **Overlay (chủ dự án tự đăng nhập Admin công ty; chỉ mở rồi huỷ, không xác nhận thao tác nào)** — `/users`, `/departments` × 1440/390: menu hàng mở bằng Enter, tên menu = nhãn nút, focus vào mục đầu, Escape đóng + trả focus về nút ✔; "Sửa thông tin"/"Sửa phòng ban" mở Dialog: focus vào trong, Tab bị bẫy, cuộn trang khoá, rộng 480 px (1440) / toàn màn hình 390 px (390), Escape đóng ✔.
- **Lỗi phát hiện ở smoke:** Dialog mở **từ mục menu** → đóng thì focus rơi về đầu trang thay vì nút "Thao tác với…" (Dialog ghi nhớ phần tử focus đúng lúc menu vừa đóng, focus chưa về nút). Test jsdom cũ không có ca menu → dialog. **Hotfix:** `fix/phase05-slice2-menu-return-focus` — DropdownMenu đưa focus về nút mở trước khi chạy `onSelect`; thêm test tái hiện (đỏ trước, xanh sau). PR #120, merge `c2f9bba`. **Smoke lại (cùng phiên đăng nhập):** `/users`, `/departments` × 1440/390 — đóng Dialog mở từ menu → focus về đúng nút "Thao tác với …" ✔ (4/4).
- **Chưa kiểm trên trình duyệt thật:** AlertDialog (không mở để tránh chạm thao tác thật — chỉ có test jsdom), Sheet (chưa có call site), "Rút hồ sơ" trang tra cứu (cần link tra cứu).

## Entry 4 — Giảm bundle route vào trước slice 3 (chủ dự án duyệt 24/11/2026)
- **Lý do:** sau slice 2 route vào +30.14 KB, còn ~9.9 KB trước ngưỡng 40 KB; slice 3 (Popover/Tooltip kéo floating-ui) nhiều khả năng vượt.
- **Thử và kết quả đo (gzip mức 9, tổng JS+CSS `index.html` tải/preload; mốc trước Radix = 291.21 KB):**
  | Cách | Route vào | Radix ở route vào? |
  |---|---|---|
  | sau slice 2 (main) | 321.35 | có (chunk `vendor`) |
  | nhóm chunk `radix` riêng | 321.68 | có — chunk `ui` (chứa `PageLoader` mà router import) kéo nó vào |
  | + `MainLayout` lazy + import sâu query/schema applications | 288.71 | có |
  | + gom module overlay vào nhóm `radix` | 289.59 | có — rolldown đặt helper dùng chung vào chunk đó, `index`/`vendor` import ngược |
  | `vendor` loại Radix (Radix vào chunk `ui`) | 288.64 | có |
  | **chọn: chỉ sửa router, giữ nguyên `vite.config`** | **288.44** | có (`vendor`) |
- **Thay đổi:** `fe/src/routes/router.tsx` — `MainLayout` tải lazy (route vào công khai không còn kéo layout nội bộ + DetailHost + barrel applications); `applicationQueries`/`applicationListSchema` import thẳng file thay vì barrel `@/features/applications` (barrel kéo ApplicationDialog/CompareDialog vào route vào).
- **Kết quả:** route vào **321.35 → 288.44 KB (−32.91 KB)**, thấp hơn mốc trước Radix 2.77 KB → dư địa so với ngưỡng 40 KB trở lại ~42.8 KB cho slice 3. **Không đạt mục tiêu ban đầu "Radix chỉ tải ở route có overlay":** Radix vẫn nằm trong `vendor` tải mọi route — tách được thì phải bỏ barrel `@/components/ui` ở route vào hoặc nạp overlay lazy; để lại, đo lại ở slice 3.
- **Hành vi:** lần đầu vào khu nội bộ tải thêm chunk `MainLayout` (route lazy; React Router giữ màn hình cũ tới khi tải xong). Đây là thay đổi tải ở AppShell — giữ nguyên hành vi, được coi là PR chuẩn bị theo [D-10]; slice 5 xem lại.
- **Kiểm:** format, lint, check:design, check:terms, typecheck, toàn bộ test, build (gồm prerender) xanh. `package.json` không đổi. Vùng khoá: 0 file (chỉ đổi đường import từ router).
- **PR:** #121 — **trạng thái: awaiting merge.**

## Entry 5 — Slice 3: Tabs, Popover, Tooltip, rich Select (🟢)
- **Trước slice — smoke PR #121 (merge `cce3c8e`):** route công khai `/jobs` không tải chunk `MainLayout`; khu nội bộ `/`, `/users`, `/manage/jobs` hiển thị đúng; điều hướng client-side qua sidebar (`/` → `/users`) ✔ (phiên đăng nhập của chủ dự án).
- **Spec + tickets:** issue #122. Base `feat/phase05-slice3-tabs-popover` từ `main @ cce3c8e`.
- **Phụ thuộc mới:** `@radix-ui/react-popover` 1.3.1, `@radix-ui/react-tooltip` 1.4.1, `@radix-ui/react-select` 2.4.1 (pin chính xác).
- **Đã làm:**
  - **Tabs:** Home/End + mũi tên vòng (**F-18 đóng**). Giữ bản tự viết (lệch có lý do, bên dưới).
  - **Popover** trên Radix, giữ API (trigger render-prop, `role` dialog/menu/listbox, `align`, `side`), **không Portal** (giữ vị trí DOM cho call site cũ), có xử lý va chạm mép (collision-aware). Menu + **listbox** đi bằng mũi tên/Home/End, mở thì focus vào lựa chọn đang chọn (**F-13 đóng** cho FilterBar "Trạng thái"). Esc chỉ đóng popover (chặn lan xuống dialog/phím tắt trang) và trả focus về nút; bấm lại nút mở thì đóng.
  - **Tooltip** trên Radix: hover 400 ms, focus bàn phím mở ngay, Escape đóng; như bản cũ không bật khi focus đến từ cú bấm chuột. Escape trong Sheet/Dialog: lần đầu đóng tooltip đang mở (lớp trên cùng), lần sau đóng Sheet/Dialog.
  - **RichSelect** mới (Radix Select): `options {value,label,description?,icon?}`, `value`, `onValueChange`, `placeholder`, `disabled`; mũi tên, Enter, typeahead, Escape theo Radix. Chưa có call site.
  - Test setup: polyfill jsdom `scrollIntoView`/`hasPointerCapture` cho Radix Select; helper axe trong test component tắt rule `region` (rule cấp trang về landmark).
- **Bundle (route vào, gzip):** sau #121 **288.44** → sau slice 3 **290.95 KB (+2.51)**; vẫn dưới mốc trước Radix (291.21). Popover/Tooltip thêm ít vì popper/floating-ui đã vào từ DropdownMenu (slice 2). **RichSelect chưa được đo** (chưa có call site → bị tree-shake); đo ở slice đầu tiên dùng nó.
- **Kiểm:** 5 test mới (Tabs Home/End/vòng; Popover listbox focus-đang-chọn/mũi tên/End/vòng/Esc trả focus; bấm lại nút đóng; Tooltip focus/Escape; RichSelect bàn phím) + axe 0 · 297 test xanh (gồm test Popover cũ: Esc không lan, menu bàn phím) · format, lint, check:design, check:terms, typecheck, build xanh. Vùng khoá: 0 file (call site Popover/Tooltip/Tabs trong vùng khoá chạy qua API cũ, test vẫn xanh).
- **Lệch so với contract (ghi nợ):**
  - **Tabs không dùng Radix:** call site (JobsPage, ApplicationsPage, PlatformCompaniesPage) dùng Tabs làm thanh lọc không có panel; Radix Tabs gắn `aria-controls` tới `Tabs.Content` nó tự render → ARIA trỏ tới phần tử không tồn tại. Đổi sang Radix khi có call site panel thật (hoặc tách "FilterTabs" khỏi "Tabs"). Cần chủ dự án xác nhận lệch này so với primitives decision.
  - Tabs `segmented` (thay SegmentedControl) chưa làm.
  - Tooltip: prop vẫn là `label` (contract ghi `content`) để không phải sửa call site vùng khoá.
- **`package.json`:** thêm 3 dependency Radix (runtime).
- **PR:** #123 — **trạng thái: awaiting merge.**

## Entry 6 — Slice 3 merge + smoke; FilterTabs (P5-D04 điều kiện 2)
- **Slice 3:** PR #123 — CI xanh. **Merged:** `639d644`.
- **Production smoke slice 3 (Playwright, phiên đăng nhập của chủ dự án, 24/11/2026):** Tin tuyển dụng — tab End → "Đã đóng", Home → "Tất cả" ✔ (F-18); bộ lọc listbox "Phòng ban" — mở bằng Enter → focus vào lựa chọn, ArrowDown/End đi đúng, Escape đóng + trả focus về nút ✔ (F-13); tooltip sidebar (rail thu gọn) — hiện khi hover và khi focus bàn phím, Escape tắt ✔.
- **Kiểm ARIA của Tabs tự viết (P5-D04 điều kiện 2):** **có lỗi** — Tabs gán `role="tablist"`/`role="tab"`/`aria-selected` cho cả nơi dùng làm thanh lọc không có panel (cùng lỗi Radix sẽ gây). Phân loại call site: tab có panel thật = `components/shared/DetailDialog` (`tabpanel` + `aria-labelledby`), `applications/pages/ApplicationDetailPage` (vùng khoá); thanh lọc = `jobs/pages/JobsPage`, `platform/pages/PlatformCompaniesPage`, `applications/pages/ApplicationsPage` (vùng khoá).
- **Sửa:** `Tabs` thêm `semantics: 'tabs' | 'filter'`; export `FilterTabs` (radiogroup/radio, `aria-checked`, giữ roving focus + mũi tên + Home/End — chọn radiogroup vì hành vi thật là một lựa chọn, mũi tên vừa chuyển vừa chọn). JobsPage + PlatformCompaniesPage → `FilterTabs`; test platform chờ `radio`. Test mới: không còn tablist/tab, radiogroup có tên, End chọn + chuyển focus, axe 0.
- **Còn lại (bàn giao):**
  - [x] `applications/pages/ApplicationsPage` (vùng khoá) → `FilterTabs` — slice 7.
  - [x] DetailDialog + ApplicationDetailPage → Radix Tabs — slice 8 (P5-D11b). `Tabs` = tab có panel (Radix, `TabsPanel`), `FilterTabs` = thanh lọc.
  - [ ] **Đo bundle RichSelect** ở slice đầu tiên gắn nó vào trang thật (hiện bị tree-shake, chưa đo — Entry 5).
- **PR:** #124 — CI xanh. **Merged:** `475e94d`.

## Entry 7 — Slice 4a: Public shell — chức năng (🟢)
- **Spec + tickets:** issue #125 (4a + 4b). Base `feat/phase05-slice4-public` từ `main @ 475e94d`. Quyết định P5-D05.
- **Phụ thuộc mới:** `cmdk` 1.1.1 (pin chính xác).
- **Đã làm:**
  - **F-01:** header công khai dưới 640 px gom "Nhà tuyển dụng"/"Đăng nhập" vào nút "Menu" (DropdownMenu, nhãn theo prototype P4). Kiểm bbox trên bản build (vite preview): 320/360/390/430/640/1024 → **0 chồng lấn**, mọi đích bấm ≥24 px, không tràn ngang.
  - **F-10 / RR-11:** route `*` nội bộ gắn `handle.notFound`; `ProtectedRoute` gặp khách ở URL không có thật → render `PublicLayout` + `PublicNotFoundPage` ("Không tìm thấy trang này", copy theo prototype), **không** đẩy về /login; URL giữ nguyên. Đường dẫn nội bộ có thật vẫn chuyển khách về /login như cũ; nhân viên đã đăng nhập vẫn thấy 404 nội bộ. (Đụng guard điều hướng — sửa lỗi phạm vi khách, giữ nguyên hành vi cho nhân viên.)
  - **RR-05:** `CompanyCombobox` (cmdk) thay ChipGroup công ty trên /jobs — tìm phía server theo chữ gõ (trước đây chỉ tải 48 công ty đầu), giữ nhãn công ty đã chọn khi nó ngoài trang kết quả; màn hình hẹp gom Công ty/Cấp bậc/Hình thức/Làm việc vào nút **"Bộ lọc (n)"** mở Dialog ("Xoá lọc" / "Áp dụng" theo prototype). Bộ lọc phòng ban (chỉ khi đã chọn công ty) giữ nguyên.
  - **RR-10 / F-02:** `StaleNotice` dùng chung ("Dữ liệu lúc {giờ} · Tải lại", đúng GLOSSARY) trên /jobs, /companies, chi tiết việc làm, trang công ty khi làm mới thất bại mà đang hiện dữ liệu cũ.
  - Guard thuật ngữ: thêm `pages/Public*` vào phạm vi công khai (bắt được "Việc làm" trên trang 404 công khai bị coi là nội bộ).
  - Test setup: stub `ResizeObserver` (cmdk, Radix Popper).
- **SurfaceContext (DL-11):** prerender đi qua `routes` → `PublicLayout` → đã có `SurfaceProvider` (nợ từ Entry 1 tự đóng). Trang chỉ-công-khai dùng danh từ công khai trực tiếp; `useJobNoun` dành cho component dùng chung hai bề mặt (Job Summary — 4b).
- **Bundle (route vào, gzip):** 290.95 → **295.47 KB (+4.52, cmdk)**; so mốc trước Radix (291.21) +4.26 KB. Chunk /jobs 2.14 → 2.99 KB.
- **Kiểm:** test mới — F-10 (khách URL lạ → 404 công khai, URL giữ; nhân viên → 404 nội bộ), RR-05 (60 công ty, gõ "số 57" → tìm server → chọn), "Bộ lọc (2)" + Xoá lọc, F-02 StaleNotice sau refetch lỗi · toàn bộ test xanh · format, lint, check:design, check:terms, typecheck, build xanh. Vùng khoá: 0 file. F-10 không kiểm được trên bản build cục bộ (không có backend → loader phiên báo "Chưa kết nối được máy chủ") → kiểm trên production sau merge.
- **VF-06:** "Rút hồ sơ" đã là AlertDialog từ slice 2 (test TrackApplicationPage chờ `alertdialog`).
- **Vấn đề hợp đồng API — DL-17/RR-10 (ghi nhận, không sửa trong slice, §05.2):** `findPublicOne` chỉ trả tin `status = OPEN`; tin quá deadline vẫn trả **vô thời hạn** với `expired: true` (không có mốc 30 ngày → 404); tin `CLOSED` trả 404 **ngay** (không có cửa sổ 30 ngày "Đã hết hạn"). FE hiện hiển thị đúng những gì API trả (banner hết hạn + tắt Ứng tuyển + việc khác). **Đề xuất riêng cho chủ dự án:** backend thêm cửa sổ 30 ngày cho cả tin quá deadline và tin CLOSED (cần mốc thời điểm đóng). Không làm workaround phía FE.
- **`package.json`:** thêm `cmdk` (runtime).
- **PR:** #126 — CI xanh. **Merged:** `7ad5f84`.
- **Production smoke 4a (Playwright, phiên khách, 24/11/2026):** F-10 — `/trang-khong-co-that` → "Không tìm thấy trang này", URL giữ nguyên ✔; `/manage/jobs` (khách) → `/login` như cũ ✔; F-01 bbox 320/360/390/430/640/1024 → 0 chồng lấn, đích ≥24 px, không tràn ✔; RR-05 — 390 px "Bộ lọc (1)" → Dialog → Combobox gõ "Chợ" (tìm server) → chọn "Chợ Lành" → URL `company=cho-lanh`, nút "Bộ lọc (2)" ✔. **Ghi nhận (có từ trước, không do 4a):** bấm trước khi trang prerender hydrate xong thì cú bấm bị mất (script đầu bấm ngay sau `load` → Dialog không mở; chờ hydrate thì mở bình thường) — đề xuất xem lại ở slice 5/12 (vd. tắt control tới khi hydrate).

## Entry 8 — Slice 4b: lật trang công khai sang v2 (🟢)
- **Base:** `feat/phase05-slice4b-public-v2` từ `main @ 7ad5f84`. Issue #125 (4b), quyết định P5-D05.
- **Cơ chế lật (cơ học, P5-D02a):** `[data-theme='v2']` trong `ui-theme.css` ngoài `--ui-*` còn ánh xạ lại **token cũ** (`--color-ink/surface/line/brand/good/warn/bad/info/marker…`, `--radius-*`, `--font-display`) sang giá trị v2 — utility Tailwind v4 đọc biến nên mọi class cũ trong phạm vi tự đổi, **không viết lại class nào**. `PublicLayout` đặt `data-theme="v2"` trên gốc (HTML prerender đúng ngay) và trên `<html>` khi mount (overlay qua Portal — Dialog "Bộ lọc", Tooltip, Menu — cũng lật); gỡ khi rời layout. Token DESIGN.md còn thiếu (`*-soft`) trộn `color-mix` từ màu gốc v2 (`shortcut:` đã ghi ở slice 1).
- **Typography:** tiêu đề công khai chuyển Bricolage → Be Vietnam Pro 600 (DESIGN.md); Bricolage còn tải cho trang nội bộ v1.
- **Sửa kèm (có từ trước):** `/companies` và trang công ty tràn ngang 28 px ở 320 (lưới một cột track `auto` không co) → `grid-cols-1`.
- **So trước (production v1) / sau (build mới, `/api` proxy sang production, chỉ GET), 5 trang × 8 bề rộng (320/360/390/430/768/1024/1280/1440):** sau = 40/40 lượt `data-theme=v2`; **0** phần tử còn màu xanh lá cũ `rgb(30,91,79)`; mỗi trang đúng 1 `h1`; tiêu đề Be Vietnam Pro; nút chính `rgb(31,78,121)`; không tràn ngang (sau khi sửa lưới). Ảnh 390/1440 duyệt mắt: danh sách việc làm, chi tiết + thanh "Ứng tuyển vị trí này", công ty, 404.
- **Trợ năng:** axe trên trình duyệt thật (bật tương phản màu) — `/jobs`, chi tiết việc làm, `/companies`, trang công ty, 404 × 390/1440 → **0 vi phạm**.
- **LCP:** chưa so — máy chủ preview cục bộ không so được với production; đo trên production trước/sau merge.
- **Chưa làm trong 4b (ghi nợ):** Job Summary theo SurfaceContext — chưa có component tóm tắt việc làm dùng chung hai bề mặt (JobRows chỉ công khai); làm khi slice 6/12 dựng component dùng chung. Bố cục chi tiết theo prototype P4 (thẻ "Yêu cầu", bước "1. Thông tin / 2. Xong") không đổi — 4b chỉ lật token theo P5-D05.
- **Kiểm:** format, lint, check:design, check:terms, check:tokens, typecheck, toàn bộ test, build xanh. `package.json` không đổi. Vùng khoá: 0 file.
- **PR:** #127 — CI xanh. **Merged.**
- **Production sau merge (Playwright, 24/11/2026):** `/jobs`, chi tiết việc làm, `/companies`, trang công ty × 390/1440 → 8/8 `data-theme=v2`, 0 phần tử màu cũ, không tràn ngang; ảnh 390 trang công ty duyệt mắt ✔.
- **LCP production (3 lần tải lạnh/trang, context mới, trung vị):** 390 — `/jobs` 288 ms, chi tiết 304, `/companies` 268, trang công ty 432 · 1440 — 260, 400, 272, 320 ms. **Không có số đo v1 cùng phương pháp để so** (số ở Entry 1 là 1 lần tải, phương pháp khác: 1316/404/708 ms) → AC "LCP không tệ hơn" ghi nhận là *không thấy dấu hiệu xấu đi*, chưa chứng minh bằng so sánh cùng điều kiện.
- **Font trên trang công khai:** chỉ tải Be Vietnam Pro tự host; **Bricolage không còn bị tải** (chỉ còn request stylesheet `css2` của Google, bất đồng bộ — gỡ khi trang nội bộ lật). Ghi nhận: vẫn tải weight **700** (code cũ còn `font-bold`), DESIGN.md chỉ 400/500/600 → dọn khi lật trang nội bộ.

## Entry 9 — Slice 5a: PR chuẩn bị AppShell (🟢, không đổi hành vi)
- **Spec + tickets:** issue #130 (5a + 5b). Base `feat/phase05-slice5a-appshell-prep` từ `main @ fe5487a`. Quyết định P5-D06.
- **Đã làm:** `MainLayout` → `AppShell` (router lazy import đổi tên); `Sidebar` → `Rail` nhận `groups` (đã lọc quyền) + `activeId` theo contract, mục active xác định bằng `findNavItem` (khớp dài nhất — giống breadcrumb) thay cho `NavLink` isActive, `aria-current="page"` gắn tay; lọc quyền + đếm "chờ xem" chuyển sang hook `useNavGroups`. Giao diện, breakpoint, drawer di động giữ nguyên.
- **Test khoá hành vi** (`AppShell.test.tsx`, 6 ca): skip link là phần tử bấm được đầu tiên, trỏ `#main`; Rail lọc theo quyền (Admin, HR, Interviewer); route lồng `/applications/abc` → đúng một mục `aria-current`; Ctrl+K mở tìm nhanh. **Cùng bộ test chạy xanh trên `MainLayout`/`Sidebar` của `main`** → hành vi trước/sau giống nhau.
- **Kiểm:** format, lint (1 cảnh báo có từ trước ở Dialog.tsx), check:design, check:terms, typecheck, toàn bộ test, build xanh. `package.json` không đổi. Vùng khoá: 0 file.
- **PR:** #131 — **Merged:** `0c5a2c7`. **Production smoke:** Vercel deploy success; `/jobs`, `/login`, `/companies` HTTP 200. Khu nội bộ chưa mở trên trình duyệt (cần phiên đăng nhập) — gộp vào smoke sau 5b.

## Entry 10 — Slice 5b: AppShell, Rail, Topbar, Command Menu (🟢)
- **Base:** `feat/phase05-slice5b-appshell` từ `main @ 0c5a2c7`. Issue #130 (5b), quyết định P5-D06.
- **Đã làm:**
  - **Rail 3 chế độ** theo bề rộng: full ≥1100 (icon + nhãn) · icon 600–1100 (Tooltip nhãn) · compact <600 (nút "Mở menu" ở Topbar → **NavSheet**). Breakpoint cũ 768/1024 → 600/1100 theo contract. AppShell luôn rộng bằng viewport nên dùng media query bề rộng viewport thay cho container query (cùng kết quả, không thêm cơ chế).
  - **NavSheet** mới (`components/ui/NavSheet.tsx`, engine Radix Dialog): trượt từ trái, bẫy focus, Escape, khoá cuộn, trả focus về nút mở; chọn mục thì đóng. Bỏ drawer tự viết cũ (overlay `div` không bẫy focus). Thêm keyframe `slide-in-left` (giảm chuyển động → fade như các overlay khác).
  - **Topbar:** breadcrumb đổi tên landmark "Vị trí hiện tại" → **"Đường dẫn"** (contract), mục cuối `aria-current`.
  - **Command Menu = cmdk** trong Radix Dialog (thay `<dialog>` tự viết), giữ API `CommandPalette`. Nhóm: **"Tìm ứng viên"/"Tìm hồ sơ"** (theo quyền, như cũ) · **"Tìm tin tuyển dụng"** (mới, `job:read`, mở chi tiết tin `?xem=job:…`) · **"Đi tới"**. Chỉ điều hướng/mở chi tiết, không đổi trạng thái.
  - **F-17:** `AuthLayout` bỏ h1 ở panel giới thiệu (→ `p`, giữ kiểu chữ) → `/login` còn 1 h1. Rà các trang `features/*/pages`: mỗi trang đúng một h1 cho mỗi trạng thái (VerifyEmailPage, TrackApplicationPage có 2 h1 ở hai nhánh trạng thái loại trừ nhau — đúng).
- **Lệch so với contract / spec (ghi nợ):**
  - Nhóm tìm người: HR/HM vẫn tìm **ứng viên** (nhãn "Tìm ứng viên"), Interviewer tìm **hồ sơ** — giữ hành vi đã có test, contract ghi "Tìm hồ sơ". Đổi nếu chủ dự án muốn.
  - **P5-D04 điều kiện 3 (DetailDialog → Radix Tabs) chưa làm:** DetailDialog đã dùng `Tabs` ngữ nghĩa `tabs` với `tabpanel` + `aria-labelledby` đúng (Entry 6); chuyển Radix cần thêm `@radix-ui/react-tabs` và dựng lại phần cuộn tràn/đếm số mà không đổi gì cho người dùng. **Cần chủ dự án quyết:** giữ bản tự viết cho tab-có-panel, hoặc chuyển ở slice 8 cùng ApplicationDetailPage.
  - `MainLayout` lazy (Entry 4) giữ nguyên — route công khai không tải khung nội bộ; mất cú bấm trước hydrate (Entry 7) là chuyện trang công khai prerender, không thuộc AppShell → để slice 12.
- **Bundle (route vào, gzip):** **296.03 KB** (sau 4a ghi 295.47; cmdk đã có trong `vendor` từ 4a). Chunk `AppShell` 8.77 KB.
- **Kiểm:** test mới — NavSheet (<600: không có nav khi đóng, mở bằng "Mở menu", Escape đóng + trả focus; chọn mục → điều hướng + đóng), breadcrumb "Đường dẫn" + `aria-current`, AuthLayout một h1, Command Menu nhóm "Tìm tin tuyển dụng" → `?xem=job:…`; test cũ quick-search (Interviewer/HR) xanh trên cmdk · 314 test xanh · format, lint, check:design, check:terms, typecheck, build xanh. `package.json` không đổi. Vùng khoá: 0 file.
- **Chưa kiểm trên trình duyệt thật:** 3 chế độ Rail ở 320/390/600/768/1024/1100/1280/1440 và axe trang nội bộ — cần phiên đăng nhập (production smoke sau merge).
- **PR:** #132 — CI xanh. **Merged:** `a2c2293`.
- **Production smoke (Chrome, phiên đăng nhập HR/Admin của chủ dự án, 25/11/2026; đổi kích thước cửa sổ không có tác dụng → đo bằng iframe cùng origin có bề rộng cố định, chỉ đọc):**
  - `/applications` × 1440/1280/1100/1024/768/600/390/320: Rail **full 232 px** ở 1440–1100, **icon 64 px** (nhãn ẩn) ở 1024–600, **không có rail + nút "Mở menu"** ở 390/320 ✔; mỗi bề rộng đúng 1 h1; skip link là phần tử bấm được đầu tiên; `aria-current` đúng một mục; không tràn ngang (8/8).
  - NavSheet ở 390: mở bằng "Mở menu" → dialog tên "Menu", rộng 280 px, chứa nav "Điều hướng chính", focus vào trong, khoá cuộn; Escape đóng + trả focus về nút ✔.
  - Command Menu (1536): Ctrl+K mở, focus vào ô tìm (combobox); gõ "Dev" → nhóm "Tìm ứng viên" (2) + **"Tìm tin tuyển dụng" (5)**; chọn tin → `?xem=job:…` mở chi tiết tin, Escape đóng ✔. Không thao tác đổi trạng thái nào.
- **Chưa kiểm:** axe trên trình duyệt thật cho trang nội bộ (chỉ có axe trong test jsdom); bản đăng nhập Interviewer/HM (chỉ có test).
- **Chờ chủ dự án quyết (Entry 10):** P5-D04 điều kiện 3 (DetailDialog → Radix Tabs) và nhãn nhóm tìm người.

## Entry 11 — Kiểm DetailDialog theo contract tab + P5-D07 (🟢)
- **Base:** `feat/phase05-detaildialog-tabs-audit` từ `main @ cba9684`. Điều kiện của chủ dự án khi giữ bản tự viết (25/11/2026): DetailDialog có panel thật nên phải qua trọn contract tab (Phase 03 file 06 + APG) và ghi kết quả ngay kỳ này.
- **Kiểm (test `components/shared/DetailDialog.test.tsx`, viết theo APG Tabs):**
  - **Đạt:** tablist có tên; `aria-selected` đúng; roving tabindex (0/−1); ←/→ chuyển và vòng; Home/End; panel `role=tabpanel` + `aria-labelledby` trỏ đúng tab đang chọn, đổi theo tab.
  - **Trượt 1:** tab không có `aria-controls`, panel không có `id` (nối một chiều). → **Sửa:** `Tabs` thêm prop tuỳ chọn `panelId` → `aria-controls` (chỉ ngữ nghĩa `tabs`); DetailDialog đặt `id` cho panel và truyền `panelId`. Tương thích ngược; ApplicationDetailPage (vùng khoá) không truyền `panelId` nên **chưa** có `aria-controls` — không sửa file khoá, xử lý ở slice 8.
  - **Trượt 2:** mâu thuẫn contract — file 06 ghi kích hoạt thủ công, file 05 ghi tự động cho panel nhẹ. → **Quyết định P5-D07:** DetailDialog kích hoạt tự động (panel nhẹ, dữ liệu đã nạp; đúng hành vi hiện tại §05.2; khớp file 05); sửa dòng Tabs trong file 06 theo quy tắc file 05.
  - Test chạy **đỏ trước sửa** (thiếu `aria-controls`), **xanh sau sửa**.
- **Command Menu (P5-D07c):** đối chiếu code — HR/HM tìm qua `candidatesApi` (mỗi kết quả là một người, mở popup ứng viên gom mọi hồ sơ), Interviewer tìm qua `applicationsApi`. Rơi đúng ngoại lệ chủ dự án nêu → sửa contract Phase 03 file 05 (nhóm "Tìm ứng viên" / "Tìm hồ sơ" theo vai), code giữ nguyên. Đóng mục "lệch" ở Entry 10.
- **Kiểm:** toàn bộ test, format, lint, check:design, check:terms, typecheck, build xanh. `package.json` không đổi. Vùng khoá: 0 file.

## Entry 12 — Slice 6: DataTable system (🟢)
- **Spec + tickets:** issue #135. Base `feat/phase05-slice6-datatable` từ `main @ 1d7ac64`. Quyết định P5-D08.
- **Đã làm (`components/shared/DataTable.tsx`):**
  - `Column.priority` 1–4 (T1–T3) theo **bề rộng container** (`@container` trên khung bảng): 4 ẩn <1024, 3 ẩn <840, 2 ẩn <720 và **hiện lại ở dòng phụ dưới cột định danh**, 1 không ẩn. Không truyền `priority` = 1 → nơi gọi cũ không đổi.
  - `Column.sticky: 'start'` — cột định danh dính trái khi bảng cuộn ngang trong container.
  - Opt-in `layout="container"`: thẻ khi container <600 (T5) thay cho viewport <768; bảng cuộn trong container thay vì trang; **VF-05** ô chọn nằm trong ô 44 px góc trên phải thẻ, bấm tên thì mở (không chọn); **Space = chọn dòng** khi có selection.
  - Bàn phím (mọi nơi): **J/K và ↑/↓** chuyển focus dòng, Enter mở.
  - **StaleNotice** ("Dữ liệu lúc … · Tải lại") phía trên bảng khi làm mới thất bại mà đang hiện dữ liệu (prop `dataUpdatedAt`).
  - Sửa kèm (axe bắt được, có từ trước): thẻ mặc định đặt cột định danh trong `<dl>` không có `dt/dd` → đưa ra ngoài `<dl>`.
- **Bật cho 6 trang ngoài vùng khoá** (`layout="container"`, `dataUpdatedAt`, priority/sticky từng cột): Kho ứng viên, Tin tuyển dụng, Người dùng, Phòng ban, Xử lý CV, Công ty (Quản trị sàn).
- **Thuật ngữ:** menu dòng ở Tin tuyển dụng "Xếp hạng ứng viên" → **"Xếp hạng hồ sơ"** (GLOSSARY); gỡ mục baseline (13 → 12). RankingTable (vùng khoá, slice 9) giữ.
- **Không làm ở slice 6 (bàn giao):**
  - [x] ApplicationsPage bật `layout="container"` + priority — slice 7 (kiểm F-03/T4, VF-05 trên trình duyệt: production smoke).
  - [ ] BulkActionBar, Search, Sort, Pagination: giữ bản đang có (đã đạt contract cơ bản: sort header là nút + `aria-sort`, phân trang có nhãn). `expandable`, `views`, `virtualize`, biến thể `ranking`/`compare` — slice 7/9 khi có call site.
- **Bundle (route vào, gzip):** 296.03 → **296.61 KB** (+0.58).
- **Kiểm:** 7 test mới (J/K/↑/↓ + Enter; Space chọn ở opt-in; Space cũ giữ ở nơi không opt-in; class priority/sticky + dòng phụ ưu tiên 2; VF-05 ô 44 px, bấm tên mở không chọn; StaleNotice + Tải lại; axe 0) · 323 test xanh (gồm test vùng khoá ApplicationsPage, bulk-status) · format, lint, check:design, check:terms, typecheck, build xanh. `package.json` không đổi. Vùng khoá: 0 file.
- **Chưa kiểm trên trình duyệt thật:** ẩn cột theo container ở 390/768/1024/1280/1440 và không tràn trên 6 trang (jsdom không có container query — test chỉ kiểm class) → production smoke sau merge (cần phiên đăng nhập).
- **PR:** #136 — CI xanh. **Merged:** `56cee5d`.
- **Production smoke (Chrome, phiên đăng nhập của chủ dự án, iframe cùng origin bề rộng cố định, chỉ đọc, 25/11/2026)** — 5 trang × 1440/1280/1024/768/390 (Công ty — Quản trị sàn — không kiểm được bằng phiên Admin công ty):
  - **25/25 không tràn trang, không tràn container.** 390 → thẻ ở cả 5 trang.
  - Cột hiện: Kho ứng viên 1440 đủ 4 cột · 1280/1024 ẩn "Điện thoại" (ưu tiên 4) · 768 chỉ còn "Ứng viên", dòng phụ chứa tin + trạng thái. Tin tuyển dụng 1440 đủ · 1280/1024 ẩn "Đã đăng" · 768 Tin/Hồ sơ. Người dùng 1440 đủ · 1280/1024 ẩn "Đăng nhập gần nhất" · 768 Người dùng + dòng phụ (vai trò, trạng thái). Phòng ban đủ ở 1440–1024. Xử lý CV đủ ở 1440–1024 · 768 dời "Lý do" xuống dòng phụ.
  - **Ghi nhận:** ở 1280 viewport, container ≈1000 px (<1024) nên cột ưu tiên 4 đã ẩn dù màn hình rộng — ngưỡng thiên về an toàn; chỉnh ngưỡng nếu chủ dự án muốn hiện thêm ở 1280.
- **Lỗi phát hiện ở smoke:** dòng phụ chỉ hiện giá trị, mất tên cột (Phòng ban 768: "1 1" cho Số người/Số tin). **Hotfix** `fix/phase05-slice6-secondary-labels`: dòng phụ hiện "{tên cột}: {giá trị}"; test cập nhật.
- **Hotfix:** PR #137 — **Merged:** `2b1c44c`. **Smoke (production, 768):** Phòng ban dòng phụ "Số người: 1 · Số tin: 1"; Người dùng "Vai trò: Interviewer · Trạng thái: Hoạt động"; không tràn ✔.
- **Quan sát 1280 px (P5-D09a):** container ≈1000 px → cột ưu tiên 4 xuống dòng phụ có nhãn; giữ ngưỡng, ghi là tham số chỉnh được.
- **Slice 6 đóng.** Tiếp theo theo P5-D09b: phiên Security Gate R1 (SG-01); slice 12 làm xen khi cần chờ.

## Entry 13 — Slice 7: Applications pipeline (🟢 sau gate)
- **Spec + tickets:** issue #144. Base `feat/phase05-slice7-pipeline` từ `main @ 047a74e` (Security Gate re-check PASSED, PR #143).
- **Đã làm:**
  - DataTable `layout="container"` + priority (Ứng viên 1 sticky, Trạng thái 1, Mức phù hợp/Phiếu của bạn 1, Tin 2, Nộp lúc 3), `dataUpdatedAt` → StaleNotice; J/K/Enter/Space theo DataTable opt-in. Thẻ giữ `mobileRow` hiện có (ô chọn 44 px góc phải VF-05 do DataTable lo).
  - Bộ lọc đã lưu: `Tabs` → `FilterTabs` (radiogroup).
  - Xem nhanh: `SidePanel` → `Sheet`, URL **`?nhanh=<id>`** (không dùng `?xem=` như ghi chú cũ vì `?xem=` đã thuộc DetailDialog/DetailHost toàn app — trùng sẽ mở cả hai). Trước/Sau theo trang danh sách đang lọc; chỉ "Mở chi tiết" (mang `listQuery` qua `detailState` mới của Sheet); câu "Để chuyển trạng thái, mở chi tiết hồ sơ."; Interviewer: lịch phỏng vấn chỉ đọc (P5-D10b).
  - Bulk (P5-D10a): 3 hành động cố định; `ConfirmDialog` → `AlertDialog` (mã lý do không chọn sẵn, lỗi giữ nội dung + Thử lại qua `mutateAsync`); tóm tắt "N không đổi · K bỏ qua (lý do)" theo mã lỗi backend; hồ sơ bỏ qua vẫn được chọn. So sánh 2–3 hồ sơ giữ nguyên.
  - Thuật ngữ: bỏ "Đề nghị" ở ApplicationsPage + use-applications (baseline `check:terms` 12 → 10).
  - Trang lật v2 (`data-theme="v2"` ở gốc trang).
- **Kiểm:** 325 test FE xanh (3 test bulk/saved view sửa theo hành vi mới: tên nút, `alertdialog`, radiogroup; 2 test mới `quick-view.test.tsx`: ?nhanh=, chỉ đọc, Trước/Sau, đóng; Interviewer không có InterviewPanel) · typecheck, build, format, lint, check:design, check:terms xanh.
- **Production smoke (25/11, `main @ 8918ddf`, Admin hireflow-demo, Playwright, `/applications` × 390/768/1024/1280/1440):** trang không tràn ngang ở cả 5; 390 = thẻ (20 thẻ, ô chọn **44×44** VF-05); 768 hiện Ứng viên/Trạng thái/Mức phù hợp (Tin, Nộp lúc ẩn theo container 646 px); ≥1024 đủ 5 cột; `data-theme="v2"` có; **axe 0** cả 5. **Lỗi F-03/T4:** bảng cuộn ngang trong khung ở 768 (+34 px) và 1024 (+29 px) — cột Ứng viên giữ 328 px vì khối tên/email `max-w-64` (bảng auto layout cấp đủ max-width). Sửa: `max-w-48` (PR sửa sau slice 7); thử trên production bằng cách áp `12rem` vào DOM → tràn 0 ở 768/1024/1280.
- **Bàn giao còn lại:** ConfirmDialog còn ở OfferPanel (11), StatusActions (8), InterviewPanel (10); SidePanel còn ở ApplicationDetailPage (8), JobRankingPage (9).

## Entry 14 — Slice 8: CV Review / chi tiết hồ sơ (🟢 sau gate)
- **Spec + tickets:** issue #147. Base `feat/phase05-slice8-cv-review` từ `main @ 8918ddf` (PR #146 sửa cột slice 7 chưa merge — không chạm file của slice 8).
- **Đã làm:**
  - **Hộp quyết định (P5-D11a):** `StatusActions` = một nút "Chuyển trạng thái" → `AlertDialog` "Chuyển trạng thái hồ sơ" (tên + trạng thái hiện tại), ô chọn không chọn sẵn (VF-01, lỗi "Chọn trạng thái mới."), lý do mã + ghi chú chỉ khi Từ chối, nút "Xác nhận"/"Xác nhận từ chối" đổi kiểu theo lựa chọn (VF-02), gợi ý "Offer chỉ tạo trong mục Offer của hồ sơ." ở bước Phỏng vấn; lỗi lưu giữ lựa chọn + "Thử lại" (OP-1); 403 → đóng hộp + banner "Bạn không có quyền thực hiện thao tác này…". Mở lại hồ sơ → `AlertDialog`.
  - **Radix Tabs (P5-D11b):** `Tabs` dựng lại trên `@radix-ui/react-tabs` (giữ đếm số, mũi tên cuộn tràn, kiểu chữ); thêm `onClick` trên Trigger vì Radix đổi tab ở mousedown (trình đọc màn hình có thể chỉ gửi click). DetailDialog dùng `TabsPanel` (bỏ `tab-id.ts`, `panelId`); tab Hoạt động của trang chi tiết có `TabsPanel` thật → nối tab ↔ panel hai chiều. Roving focus của Radix: `tablist` tabIndex 0, các tab -1 (Tab vào danh sách → tới tab đang chọn).
  - **Trạng thái:** không tìm thấy/ngoài phạm vi một thiết kế (ADR-0002) "Không tìm thấy hồ sơ này" + "Về danh sách hồ sơ"; Đang đọc CV / Không đọc được CV giữ bản có sẵn.
  - **Căn cứ:** câu trích bị loại gom vào `<details>` "Có căn cứ bị loại (n)" dưới danh sách tiêu chí (bỏ khối gạch ngang xen giữa); câu trích được tính vẫn hiện sẵn (VF-11). Khung CV ghi "Nội dung CV đã trích xuất · đây là văn bản hệ thống dùng để kiểm căn cứ" (VF-12 / R3).
  - Xem CV trên màn hẹp: `SidePanel` → `Dialog` (Sheet là quick view có "Mở chi tiết" nên không hợp ở trang chi tiết). Menu "Thao tác khác" → `DropdownMenu`. Nút `<button>` thô ở RequirementList/JobApplicationHighlights → `Button variant="link"`. Thuật ngữ "Bằng chứng" → "Căn cứ" (CvSheet, CvTextDialog; baseline 10 → 8). Trang lật v2.
- **Bundle:** route vào không đổi (index 13.61 KB gzip); `vendor` +0.71 KB gzip (Radix Tabs).
- **Kiểm:** 330 test FE xanh — mới: hộp quyết định (không chọn sẵn, nhãn theo lựa chọn, lý do khi Từ chối; lỗi lưu giữ lựa chọn + Thử lại; 403 → banner), không tìm thấy (ADR-0002), "Có căn cứ bị loại (1)" + chú thích văn bản trích xuất; Tabs có `aria-controls` ↔ panel. Sửa theo hành vi mới: DetailDialog roving focus, mở lại → `alertdialog` + nút "Chuyển trạng thái". Typecheck, build, format, lint, check:design, check:terms xanh.
- **Production smoke (25/11, `main @ db2423d` gồm #146 + #148, Admin hireflow-demo, Playwright):**
  - `/applications` (kiểm lại #146): 390 thẻ; 768/1024/1440 bảng **tràn trong khung 0** (trước #146: +34/+29) → F-03/T4 đạt.
  - `/applications/:id` × 390/1024/1440: trang không tràn; 1 h1; `data-theme="v2"`; 3 tab Radix đều có `aria-controls` → panel, panel có `aria-labelledby`; ≥1024 khung CV ghi "Nội dung CV đã trích xuất…"; 390 "Xem CV" mở Dialog toàn màn (390×844), có chú thích trích xuất, không tràn; **axe 0** (trang, hộp quyết định, Dialog CV).
  - Hộp quyết định (mở rồi Escape, **không bấm Xác nhận**): tên "Chuyển trạng thái hồ sơ", ô chọn `""` (không chọn sẵn), lựa chọn Phỏng vấn / Từ chối / Ứng viên rút hồ sơ (không có Offer), focus vào "Huỷ", vừa màn ở 390, Escape đóng.
  - Không tìm thấy: `/applications/<uuid không tồn tại>` → h1 "Không tìm thấy hồ sơ này" + "Về danh sách hồ sơ".
  - **Chưa thấy trên production:** mục "Có căn cứ bị loại" (hồ sơ được mở không có câu trích bị loại — chỉ có test); lưu thật/lỗi lưu/403 (không ghi dữ liệu production — chỉ có test).
- **Bàn giao còn lại:** ConfirmDialog ở OfferPanel (11), InterviewPanel (10); SidePanel ở JobRankingPage (9), ChatPage (12).

## Entry 15 — Slice 9: Ranking (🟢 sau gate)
- **Spec + tickets:** issue #150. Base `feat/phase05-slice9-ranking` từ `main @ 2812e75`.
- **Đã làm:**
  - **BE (P5-D12b):** `GET /jobs/:id/ranking` → `items[].scoredJdVersion` (chỉ cộng thêm). e2e `jobs`: hồ sơ chấm theo phiên bản hiện hành, phiên bản cũ, chưa chấm (null).
  - **Thông báo chấm lại:** "Tiêu chí của tin vừa đổi — N hồ sơ đang được chấm lại. Xếp hạng có thể chưa cập nhật · Tải lại" khi có hồ sơ `scoredJdVersion` khác `job.jdVersion`; `useRanking` tự làm mới mỗi 5 s tới khi hết.
  - **Trọng số (VF-03):** thanh trượt → `WeightSelect` (ô chọn native) "1 · ít quan trọng / 2 · quan trọng / 3 · rất quan trọng"; nhãn gồm số thứ tự + "bắt buộc".
  - **VF-04:** vùng `role="status"` đọc "Đã sắp xếp lại theo trọng số mới" khi đổi trọng số làm đổi thứ tự (không đọc khi thứ tự giữ nguyên).
  - **Màn hẹp:** panel Vì sao → `Sheet` (DL-16: "Mở chi tiết" mang ngữ cảnh danh sách theo điểm; Trước/Sau = hạng trên/dưới; "Thêm vào so sánh" giữ — không phải đổi trạng thái); nút "Mở bàn duyệt CV" chỉ còn ở panel bên phải màn rộng. Bảng trọng số trên màn hẹp → `Dialog`. Nút bỏ khỏi khay so sánh → `IconButton`.
  - Bàn phím J/K/↑/↓ giữa các dòng (Enter/Space mở Vì sao như cũ). Caption "Xếp hạng hồ sơ theo mức phù hợp" (baseline thuật ngữ 8 → 7). Route riêng lật v2; bản nhúng trong hộp tin giữ v1.
- **Kiểm:** BE e2e jobs + query-count 42/42. FE 332 test xanh — mới: chữ trong ô trọng số, thông báo sắp xếp lại (chỉ khi thứ tự đổi), thông báo chấm lại; 2 test trọng số cũ đổi sang tìm ô chọn theo nhãn mới. Typecheck, build, format, lint, check:design, check:terms xanh.
- **Production smoke (25/11, `main @ 876dafe`, Render deploy success, Admin hireflow-demo):**
  - API: `GET /jobs/:id/ranking` có `scoredJdVersion` ở mọi item (lần gọi đầu khi Render còn `in_progress` chưa có — đã gọi lại sau khi deploy xong); 0 hồ sơ chấm theo phiên bản cũ → thông báo chấm lại **không hiện** (đúng; chỉ có test cho trạng thái hiện).
  - `/manage/jobs/:id/ranking` (tin 4 hồ sơ đã chấm, 5 tiêu chí) × 390/1024/1440: không tràn; 1 h1; `data-theme="v2"`; 0 thanh trượt, ô chọn có chữ "1 · ít quan trọng / 2 · quan trọng / 3 · rất quan trọng"; vùng `role=status` `aria-live=polite` có; caption "Xếp hạng hồ sơ theo mức phù hợp"; phím J chuyển focus sang dòng dưới; **axe 0**.
  - 390: bấm dòng → Sheet 390×900 "Vì sao … #1", chỉ "Mở chi tiết" + "Hồ sơ hạng dưới" + "Thêm vào so sánh"; nút "Trọng số" → Dialog "Trọng số tiêu chí" 5 ô chọn; axe 0 cả hai. ≥1024: panel bên phải "Vì sao … #1", 5 câu trích, "Mở bàn duyệt CV".
  - **Không làm trên production:** đổi trọng số để nghe thông báo sắp xếp lại (chỉ có test), lưu trọng số.
- **Bàn giao còn lại:** SidePanel ở ChatPage (12); ConfirmDialog ở OfferPanel (11), InterviewPanel (10).

