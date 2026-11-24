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
  - [ ] applications/CvSheet, CvTextDialog — "bằng chứng" (slice 8)
  - [ ] applications/OfferPanel (10), hooks/use-offers (6), audit/audit-format (8), dashboard/DashboardPage (1), lib/error-codes (3) — "offer" viết thường (slice 11 / 12; error-codes theo slice chạm thông báo)
  - [ ] applications/hooks/use-applications, pages/ApplicationsPage — "Đề nghị" trong thông báo bulk (slice 7)
  - [ ] candidates/CandidateSections — "bằng chứng" (slice 12)
  - [ ] dashboard/FunnelReport — "Đã nhận" (slice 12)
  - [ ] jobs/JobsPage, ranking/RankingTable — "Xếp hạng ứng viên" (slice 6/9)
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
| (chưa trang nào) | — | mọi trang đang v1 |
Quy tắc: lật cả trang trong slice dựng lại trang đó bằng `data-theme="v2"` trên gốc trang/layout; không lật từng component.

### Bàn giao cho slice khoá (không sửa ở slice 1)
- [ ] `applications/components/JobApplicationHighlights.tsx:84` — slice 8
- [ ] `applications/components/RequirementList.tsx:81` — slice 8
- [ ] `applications/components/StatusActions.tsx:83` — slice 8
- [ ] `applications/pages/ApplicationDetailPage.tsx:251`, `:276` — slice 8
- [ ] `applications/pages/ApplicationsPage.tsx:562` — slice 7
- [ ] `ranking/pages/JobRankingPage.tsx:262` — slice 9
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
  - [ ] `applications/pages/ApplicationsPage` (vùng khoá) → `FilterTabs` — slice 7.
  - [ ] DetailDialog → Radix Tabs (tab có panel) — slice 5; ApplicationDetailPage → Radix Tabs — slice 8. Khi đó `Tabs` chỉ còn nghĩa tab-có-panel.
  - [ ] **Đo bundle RichSelect** ở slice đầu tiên gắn nó vào trang thật (hiện bị tree-shake, chưa đo — Entry 5).
- **PR:** _(điền sau khi mở)_ — **trạng thái: awaiting merge.**
