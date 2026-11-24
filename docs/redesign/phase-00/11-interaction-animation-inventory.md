# 11 — Interaction & Animation Inventory

> Phase 00 · Workstream H · SV (source) + RV where noted.

## 1. Motion primitives (SV, `index.css`)

Keyframes: `float-in`, `fade-in`, `slide-in-right`, `slide-in-up`, `marker-focus` (evidence highlight pulse), `skeleton`, `caret` (streaming text caret), `progress`. Tailwind usage: `animate-float-in` ×2, `animate-slide-in-up`, `animate-slide-in-right`, `animate-skeleton`, `animate-progress`, `animate-marker-focus`, `animate-caret`, `animate-spin`, `animate-none` ×2. Transition durations: `duration-150` ×8, `200` ×3, `100` ×2, `300` ×1; buttons `transition-colors 150ms ease-standard`. No animation library dependency (CSS only — consistent with D-11 default).

## 2. Reduced motion (SV)

Global `@media (prefers-reduced-motion: reduce)` block in `index.css` (replaces animations with a 120 ms fade or `none`); JS checks in `CvSheet.tsx` and `RankingTable.tsx` (smooth scroll / highlight). Runtime check: BLK for those two components (internal).

## 3. Interaction patterns (SV; RV for public)

| Pattern | Where | Evidence |
|---|---|---|
| URL-driven detail dialogs (`?xem=`) | internal app | SV |
| Command palette + QuickSearch (hotkeys via `use-hotkeys`) | internal app | SV |
| Toasts (Sonner, bottom-left, 5 s) | global | SV |
| Notifications SSE + unread badge ("Hôm nay" pending badge) | internal | SV |
| Density toggle (comfortable/compact, per user, persisted) | tables | SV |
| Streaming AI chat (`use-stream`, caret) | `/ai-chat` | SV |
| Stale-chunk auto reload after deploy | global | SV |
| Skip link, keyboard focus ring | public layout | RV |
| Password reveal toggle | login | RV |
| Chip filters / dropdown filters / pagination | `/jobs` | RV |
| Drag-and-drop CV upload | `/jobs/:id` | RV (UI present; not exercised) |
