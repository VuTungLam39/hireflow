# 07 — Component & Layout Catalog (v1.1 files 07 + 08 merged [D-07])

> Phase 00 · Workstream F · Source-verified (`fe/src` @ `04ac5b7`). Visual usage inside signed-in pages: BLK.

## 1. Layouts (SV)

| Layout | Used by | Notes |
|---|---|---|
| `PublicLayout` | 10 public routes | Top bar (brand, "Việc làm", "Công ty", "Nhà tuyển dụng", "Đăng nhập"), demo banner, footer with privacy link, skip link "Bỏ qua tới nội dung" (RV). **Header links overlap at widths 320–430 px** (RV, file 12) |
| `AuthLayout` | `/login` | Split screen: marketing `<aside>` ("Giới thiệu HireFlow", own h1 + illustrative CV figure) + form. No skip link, no header/nav landmark (RV) |
| `MainLayout` | all internal routes | `Sidebar` (dark "rail" tokens, 3 groups) + `Topbar` (breadcrumb crumb, `QuickSearch`, notifications, `UserMenu`) + `DetailHost` overlay + `CommandPalette`; `handle.fullWidth` for `/applications/:id` |
| Overlay hosts | `DetailHost`, `JobCreateDialog`, `JobWorkspaceDialog` | URL-driven (`?xem=`) dialogs, idle-preloaded |

## 2. UI primitives (`components/ui`, SV)

| Component | Implementation | Variants / API | A11y notes (source) |
|---|---|---|---|
| Button / `buttonVariants` | `<button>` + class builder | variants `primary, inverse, secondary, quiet, danger, danger-quiet`; sizes `sm 32, md 36, lg 44, icon 36, icon-sm 32`; `data-loading`; coarse-pointer 44 px hit area | sizes below 44 px rely on pseudo-element hit area |
| Input, Textarea, Checkbox | native elements + `field-styles.ts` | `fieldBase` | native semantics |
| Select | **native `<select>`** + chevron | — | native |
| FormField | label/error wrapper | — | to verify label association in Phase 01 |
| Dialog | **native `<dialog>` + `showModal()`**, `aria-labelledby`, close button `aria-label="Đóng"` | — | native focus trap/Escape; return-focus behaviour UNK |
| Popover | custom; trigger gets `aria-expanded/haspopup/controls`; roles `dialog/menu/listbox`; Escape returns focus; arrow-key navigation over `[role^=menuitem]` | — | hand-rolled — Phase 01 item P01-A11Y-PRIM |
| Tabs | custom `role=tablist/tab`, roving `tabIndex`, ArrowLeft/Right; edge scroll arrows `aria-hidden` | — | Home/End keys not handled (SV) |
| Tooltip | custom `role=tooltip`, `aria-describedby`, shows on `:focus-visible` | — | — |
| SegmentedControl, ChipGroup, Stepper, Pagination, Avatar, Skeleton, Spinner, `tones.ts` | custom | — | — |

**No Radix / shadcn** — every interactive primitive is in-house (owner decision DL-05 → Phase 01 backlog).

## 3. Shared composites (`components/shared`, SV)

DataTable (372 lines, virtualized via `@tanstack/react-virtual`, density-aware), FilterBar, DateRangeFilter, DetailDialog (173), SidePanel (83), ConfirmDialog, CommandPalette, KpiStrip, PageHeader, RowMenu, Timeline, EmptyState, ErrorState, FileUploader, Can.

## 4. Duplication & inconsistency candidates (SV — to be judged in Phase 01)

| Area | Evidence |
|---|---|
| Tables | Besides `DataTable`, raw `<table>` in `CompareDialog`, `FunnelReport`, `AiQuotaSection`, `QueueCountsTable`, `RankingTable` |
| Dialog-like surfaces | `Dialog`, `DetailDialog`, `SidePanel`, `CommandPalette`, `GalleryLightbox` — 5 modal implementations |
| Raw buttons | 20 feature files render `<button>` directly instead of `Button` (some legitimately: rows, chips) |
| Radius tokens | `--radius-md/lg/xl/2xl` all = 10px (collapsed scale) |
| Heavy pages | `ApplicationsPage` 582 lines, `JobRankingPage` 449, `InterviewsPage` 439, `JobsPage` 423 — feature-coupled UI likely |
| Two "Nhà tuyển dụng"/employer entry points | public header link vs login page link "Đăng ký nhà tuyển dụng" (RV) |
