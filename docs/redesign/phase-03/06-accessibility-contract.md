# 06 — Accessibility Contract

Target: WCAG 2.2 AA. Baseline to protect: axe 0 violations on 27 page×actor checks (Phase 01). Every Phase 05 slice runs axe on the pages it touches and adds keyboard tests for the primitives it introduces.

## Keyboard maps
| Component | Keys |
|---|---|
| Global | Tab/Shift+Tab; skip link first; Ctrl/Cmd+K Command Menu; Escape closes topmost layer |
| Tabs | ←/→ move, **Home/End** first/last, Enter/Space activate (manual mode) |
| Rich Select / Listbox | ↑/↓ move, **Home/End**, typeahead, Enter/Space select, Escape close |
| Combobox | type to filter, ↓ open/move, Enter select, Backspace remove chip, Escape close |
| Dropdown Menu | ↑/↓, Home/End, typeahead, Enter, Escape |
| Dialog / AlertDialog / Sheet | focus trapped; Escape closes; focus returns to trigger |
| DataTable | J/K or ↑/↓ row focus, Enter open, Space select, x expand, sort headers as buttons |
| SplitLayout | J/K in list updates detail; F6 switches pane |
| Evidence linking | see below |
Shortcuts are optional accelerators; every action is reachable with Tab + Enter.

## Focus management
- Visible focus ring on every interactive element (2 px `focus-ring`, 2 px offset, ≥7:1).
- Opening a layer moves focus inside (first field, or the least destructive action in AlertDialog); closing returns it to the trigger.
- Route change moves focus to the page h1 (announced title).
- Async lists keep focus on the row after refresh (match by row id).

## Two-way evidence linking (Direction A)
- Each criterion in the evidence margin is a button `aria-controls` the highlighted span(s) in the CV; each highlight is a focusable `<mark tabindex="0">` with `aria-describedby` → its criterion name.
- Activating a criterion scrolls the first span into view, applies `evidence-mark-focus`, and moves focus to the span; Escape returns focus to the criterion.
- From a span, Enter moves focus to its criterion.
- Screen readers: criterion button name = "Tiêu chí {n}: {tên} — {Khớp|…}"; span description = "Căn cứ cho tiêu chí {n}".
- Live region (`role=status`) announces "Đang hiển thị căn cứ cho tiêu chí {n}".

## ARIA patterns
APG patterns: dialog (modal), alertdialog, tabs, listbox, combobox, menu/menubutton, tooltip, disclosure (expansion rows), navigation landmarks. Tables use native table semantics with `aria-sort`; card mode uses `<ul>` of articles.

## Content rules
One h1 per page; skip link on every layout (RR-15, F-17); headings never skip levels; status/score never colour-only; minimum text 12 px; targets ≥24 px (≥44 px on coarse pointers); `lang="vi"`.

## P01-A11Y-PRIM position
Resolved by the primitives decision (Option 1): Dialog/AlertDialog/Sheet, Popover, Dropdown, Tooltip, Tabs, rich Select move to Radix-backed house components, closing F-13 (listbox arrows) and F-18 (Home/End) by construction; each adopting slice adds keyboard tests for the APG map above. Combobox and Command Menu get the same tests in their slices.

## Reduced motion
`prefers-reduced-motion: reduce` → opacity-only transitions ≤100 ms; no scroll-into-view smooth scrolling.
