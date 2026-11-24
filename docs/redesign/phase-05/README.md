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
