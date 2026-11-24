# Phase 05 — Implementation Log

Validation status carried in: Phase 04 PASSED — internally validated only; human task time not measured.
Gate split [D-02]: slices 0–6 and 12 free; slices 7–11 locked until R1–R3 merged + Security Gate re-check passed.

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

- **PR:** #116 — **trạng thái: awaiting merge.**

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

- **PR:** _(điền sau khi mở)_ — **trạng thái: awaiting merge.**
