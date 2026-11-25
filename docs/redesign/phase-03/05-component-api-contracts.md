# 05 — Component API Contracts

Written against the **house component API** (primitives decision, Option 1, owner 24/11/2026). Radix is an implementation detail inside Dialog/AlertDialog/Sheet, Popover, Dropdown Menu, Tooltip, Tabs and rich Select; no contract below names a Radix prop, and every primitive must stay swappable without touching a call site. Combobox and Command Menu: implementation chosen in their slice (Radix building blocks or one focused library), same rule. Native elements: Input, Textarea, Checkbox, Radio, simple Select. Tokens: `fe/DESIGN.md`.

## Shared defaults (apply to every contract unless overridden)
- **Props convention:** `className` allowed only for layout (margin/grid placement), never to recolour; `ref` forwarded to the root focusable element; text props accept `ReactNode`.
- **States:** default · hover · focus-visible (2 px focus-ring, 2 px offset) · active · disabled (opacity .5 + `disabled`/`aria-disabled`) · loading where listed.
- **Sizes:** sm 32 px · md 36 px (default) · lg 44 px; on coarse pointers every interactive target reaches 44 px hit area.
- **Keyboard:** WAI-ARIA APG pattern for the role; Tab order follows DOM; Escape closes the topmost layer and returns focus to its trigger.
- **Responsive:** follows file 07; nothing may introduce page-level horizontal scroll.
- **Loading:** skeleton matching final layout for content; spinner only inside buttons; no layout shift.
- **Error:** inline, adjacent, with text (never colour alone); network errors surface within 1 s with a retry (F-08).
- **Terminology:** any rendered status, stage, score, match or job label comes from GLOSSARY "Thuật ngữ giao diện" via a shared label map — never a hardcoded string in the component.
- **Motion:** CSS/WAAPI tokens from file 01; none under `prefers-reduced-motion` except opacity.

---

## Foundation

### Button
- **Purpose:** trigger an action.
- **Props:** `variant: 'primary'|'secondary'|'ghost'|'danger'|'link'` · `size` · `loading?: boolean` · `leadingIcon?` · `type` (default `button`) · `asChild?` for links styled as buttons.
- **Variants:** primary (one per region) · secondary (outlined border-strong) · ghost (toolbar) · danger · link.
- **States:** shared + loading (spinner replaces leading icon, label kept, `aria-busy`, click ignored).
- **Composition:** icon + label; never icon-only (use IconButton).
- **Keyboard / a11y:** native `<button>`; Enter/Space; accessible name = label.
- **Responsive:** may go full-width in mobile bottom action bars.
- **Usage:** verb-first Vietnamese labels ("Chuyển trạng thái", "Tạo Offer"). Danger is used only behind AlertDialog when it changes an application.
- **Anti-patterns:** raw `<button>` in feature code for actions; two primary buttons side by side; danger without confirmation.

### IconButton
Purpose: icon-only action. Props: `label` (**required**, becomes `aria-label` + Tooltip), `icon`, `variant: 'ghost'|'secondary'`, `size`. A11y: Tooltip shows the same label on hover/focus. Anti-pattern: icon-only primary actions.

### Input / Textarea / FormField
- **Purpose:** text entry with label, help and error.
- **Props (FormField):** `label` (required) · `description?` · `error?` · `required?` · children = native control. Input: native props + `size`. Textarea: native + `autoGrow?`.
- **States:** shared + invalid (`aria-invalid`, error text linked by `aria-describedby`).
- **A11y:** label `for`/id wired by FormField; required marked in text "(bắt buộc)", not only by asterisk.
- **Error:** inline below field; on submit, a summary at top lists errors and focuses the first.
- **Anti-patterns:** placeholder as label; error shown only by red border.

### Checkbox / Radio / Switch
Native inputs with FormField-style label. Switch = `role="switch"` on a native checkbox, only for immediate settings (never in forms that need Submit). Group with `fieldset`/`legend`.

### Select (simple, native) / Select (rich)
- **Simple:** native `<select>` styled with tokens; use when options are plain text.
- **Rich (Radix inside):** `options: {value,label,description?,icon?}[]`, `value`, `onValueChange`, `placeholder`, `disabled`. Keyboard: Arrow keys, Home/End, typeahead, Enter/Space select, Escape close (closes F-13). Use only where options need rich content.
- **Anti-pattern:** rich Select for a 3-item plain list.

### Combobox
- **Purpose:** choose one/many from a long or searchable list (company filter ≥50, interviewer picker) — F-04, F-23.
- **Props:** `options` or async `loadOptions(query)` · `multiple?` · `value` · `onChange` · `placeholder` · `emptyText` · `maxVisibleChips?`.
- **States:** loading (inline spinner in list), empty ("Không có kết quả"), error (inline with retry).
- **Keyboard:** APG combobox — typing filters, ArrowDown opens/moves, Enter selects, Backspace removes last chip, Escape closes.
- **Responsive:** <600 px opens as full-height Sheet.
- **Implementation:** decided in its slice (no Radix primitive).

### Badge family
- **StatusBadge** `status: ApplicationStatus` · `scope: 'internal'|'public'` → label from table (public maps OFFER/HIRED/REJECTED to "Đã có kết quả"). **ScoreBadge** `score: number` → number + band label (Phù hợp cao ≥70 / một phần 40–69 / thấp <40; thresholds read from scoring config, not hardcoded in the component). **MatchBadge** `match: 1|0.5|0` → Khớp / Khớp một phần / Không thấy trong CV. **FlagBadge** `flag` → Thiếu tiêu chí bắt buộc / Có căn cứ bị loại. **JobStatusBadge**, **OfferStatusBadge** likewise.
- **Visual:** outlined pill (`badge-*` tokens); text always present.
- **Anti-patterns:** colour-only dots; free-text labels.

### Avatar · Separator
Avatar: initials fallback, `alt` = name or decorative when name is adjacent. Separator: decorative unless it separates groups in a menu (`role=separator`).

### Tooltip (Radix inside)
Props: `content`, `side?`, `children` (trigger). Opens on hover after 400 ms and on focus immediately; Escape dismisses; never contains interactive content or essential information.

### Popover (Radix inside)
Props: `trigger`, `content`, `align?`, `modal?`. Focus moves into content; Escape/outside click closes and returns focus; collision-aware. For menus use Dropdown Menu; for option lists use Select/Combobox.

---

## Navigation

### Rail (internal primary navigation)
- **Props:** `items: {id,label,icon,href,badgeCount?}[]` filtered by permissions · `activeId`.
- **Variants (by container width):** full (≥1100: icon + label) · icon (600–1100: icon + Tooltip label) · compact (<600: top menu button opening a Sheet with the full list).
- **A11y:** `<nav aria-label="Điều hướng chính">`; active item `aria-current="page"`; skip link precedes it.
- **Anti-pattern:** horizontally scrolling nav strip as the final mobile pattern (Phase 02 concept floor only).

### PublicHeader
Logo · "Việc làm" · "Công ty" · "Nhà tuyển dụng" · "Đăng nhập". ≤430 px: logo + one menu button (Sheet). No overlap at 320–430 (RR-01, F-01). One `<header>` landmark, skip link first.

### Topbar
Breadcrumbs · Command Menu trigger (Ctrl+K) · notifications · user menu (Dropdown Menu).

### Tabs (Radix inside)
Props: `items: {value,label,count?}[]`, `value`, `onValueChange`, `variant: 'line'|'segmented'`. Keyboard: ArrowLeft/Right, **Home/End** (closes F-18), automatic activation for cheap panels, manual for heavy ones. Overflow: scroll with visible edge fade; never wraps into two rows. `segmented` replaces SegmentedControl.

### Breadcrumbs · Pagination
Breadcrumbs: `<nav aria-label="Đường dẫn">`, last item `aria-current`. Pagination: "1–12 trong 13", prev/next with labels, page size where tables allow.

---

## Overlay

### Dialog (Radix inside)
- **Purpose:** focused task or content that blocks the page.
- **Props:** `open`, `onOpenChange`, `title` (required, labelled), `description?`, `size: 'sm'|'md'|'lg'`, `variant: 'default'|'media'`, footer actions.
- **A11y:** focus trapped, initial focus on first field or close, Escape closes, focus returns to trigger, page scroll locked, `aria-modal`.
- **Responsive:** <600 px becomes full-screen.
- **Anti-patterns:** dialog over dialog; long forms in sm.

### AlertDialog
- **Purpose:** confirm a consequential action.
- **Props:** `title`, `description`, `confirmLabel`, `confirmVariant: 'primary'|'danger'`, `requireReason?: {codes: RejectReasonCode[], otherRequiresText: true}`, `onConfirm(reason?)` returning a promise (button shows loading; dialog stays open on error with inline message).
- **A11y:** `role=alertdialog`; initial focus on the **least destructive** action.
- **Usage:** Từ chối always uses `requireReason` with the reject-reason labels from the GLOSSARY/current map.

### Sheet (quick view) — DL-16 clause
- **Purpose:** preview a hồ sơ / ứng viên / tin tuyển dụng without leaving the list.
- **Props:** `open`, `onOpenChange`, `title`, `side: 'right'`, `width: 480`, `onPrev?`/`onNext?`, `detailHref` (required).
- **Decided clause:** **the quick-view Sheet carries NO state-changing actions** — no status change, no reject, no Offer, no delete. Allowed: "Mở chi tiết", open CV, copy tracking link, prev/next.
- **A11y:** same as Dialog (modal); URL-driven (`?xem=`) so Back closes it.
- **Responsive:** <600 px full-screen.
- **Anti-pattern:** adding a "quick reject" button.

### Dropdown Menu (Radix inside)
Row and user menus. Items: `{label, icon?, onSelect, variant?: 'danger', disabled?}`; danger items open AlertDialog. Keyboard: arrows, Home/End, typeahead, Escape.

### Command Menu
Ctrl/Cmd+K; groups "Đi tới", **"Tìm ứng viên" (roles with `candidate:read` — HR, HM; results are people, opening the candidate view that gathers all their hồ sơ) or "Tìm hồ sơ" (Interviewer)**, "Tìm tin tuyển dụng" (P5-D07, 25/11/2026); results respect permissions and scope; implementation chosen in its slice. Never executes state changes directly — navigates.

---

## Data

### DataTable (one system, B's rules)
- **Purpose:** every tabular list (applications, candidates, jobs, users, audit, ranking, compare, reports, queues).
- **Props:** `columns: {id, header, cell, priority: 1–4, align?, width?, sortable?, sticky?: 'start'}[]` · `rows` · `getRowId` · `variant: 'list'|'ranking'|'compare'|'report'|'admin'` · `density: 'comfortable'|'compact'` · `selection?: {mode:'multi', bulkActions}` · `expandable?: (row) => ReactNode` · `views?: SavedView[]` · `sort`, `onSortChange` · `state: 'loading'|'empty'|'error'|'stale'|'ready'` · `emptyState`, `errorState` · `virtualize?` (default on above 100 rows) · `onRowOpen` (opens Sheet or detail).
- **Behaviour:** sticky header and identity column; **column priority by container width** — priority 4 hides first, then 3; priority-2 columns relocate into a secondary line under the identity cell; priority 1 never hides. No page-level horizontal scroll; container scroll only if priority-1 columns alone exceed the width.
- **States:** loading = skeleton rows (same row height); empty = EmptyState with reason + action; error = ErrorState with retry inside the table frame; stale = StaleNotice above the table; selection count in BulkActionBar.
- **Keyboard:** rows are a list of links/buttons, not a grid: Tab to table, J/K or ArrowUp/Down moves row focus, Enter opens, Space toggles selection, `x` toggles expansion; sort headers are buttons with `aria-sort`.
- **Responsive:** <600 px → stacked cards (identity, score, status, one secondary line); 1024 must fit the applications list without scroll (verified in Phase 02 concept: 918/918).
- **Variants:** `ranking` (criteria dots column with numbers matching the CV view, weights header), `compare` (columns = hồ sơ, rows = criteria), `report`/`admin` (no selection).
- **Usage:** column headers and cell labels from the terminology table; job column header reads from context (internal "Tin tuyển dụng").
- **Anti-patterns:** raw `<table>` in features; hiding the identity column; decorative score bars (F-20).

### FilterBar
Primary search always visible; secondary filters in one "Bộ lọc (n)" control (Popover ≥600, Sheet <600) with active count and "Xoá lọc"; company filter uses Combobox (RR-05).

### Search Input · Sort Control
Search: `<input type="search">` with label (visually hidden ok), debounced 250 ms, clear button IconButton "Xoá tìm kiếm". Sort: header buttons in tables; standalone Select on card views.

### BulkActionBar
Appears when ≥1 row selected: "{n} hồ sơ đã chọn" + only allowed transitions (Sàng lọc, Phỏng vấn, Từ chối with reason); result summary toast with succeeded / không đổi / lỗi counts. Never offers OFFER/HIRED.

### EmptyState · ErrorState · Skeleton · Spinner · StaleNotice
- EmptyState: `title`, `reason`, `action?`; one line icon max.
- ErrorState: `title`, `message`, `onRetry`; shown within 1 s of first failure, retries continue in background.
- StaleNotice: `updatedAt`, `onRefresh` → "Dữ liệu lúc {giờ} · Tải lại", `role=status`.
- Not-found uses ErrorState variant `notFound` (file 09) — one design for both causes (ADR-0002).

---

## Feedback
- **Toast** (existing sonner, wrapped): success/info/error; `role=status`/`alert`; undo action for reversible changes; max 1 visible stack of 3.
- **Inline Alert:** `tone: info|success|warning|danger`, icon + title + text; persistent.
- **Success State:** full-panel confirmation (apply success shows the tracking-link promise).
- **Progress Indicator:** Stepper (multi-step forms), indeterminate bar for CV processing ("Đang đọc CV").
- **Confirmation Dialog:** = AlertDialog.

---

## Layout
- **AppShell:** skip link → Rail → Topbar → `<main id="main">`; one h1 per page.
- **PublicShell / AuthShell:** skip link, header landmark, one h1 (fixes F-17 two h1).
- **PageHeader:** h1 + description + primary action + optional tabs.
- **PageContainer / ContentSection:** max widths and section spacing from tokens.
- **SplitLayout:** `list`, `detail`, `ratio` (default 2:3); ≥1280 side by side; 768–1279 narrow list (identity + score) + detail; <768 two routes (list → detail with back). Keyboard: J/K in list updates detail without moving focus out of the list; F6 moves focus between panes.
- **DetailLayout:** header (identity, Mức phù hợp, status, the single "Chuyển trạng thái" action) + main + side.

## Job label clause — DL-11 (decided)
Every job-display component (JobRow, JobSummary, job column, breadcrumbs, empty states) takes its noun from a **surface context** (`SurfaceContext = 'internal' | 'public'`): "Tin tuyển dụng"/"tin" internal, "Việc làm"/"vị trí" public. **No component hardcodes either string.**
