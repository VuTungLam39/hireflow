# 04 — Direction B: "Bàn điều phối" (Pipeline Console)

> Concept only — not product state.

## Derived from
- Brief §2–3 (HR high-volume triage, "get to a defensible short list fast"), §7 speed for experts.
- Findings answered first: **F-03** (h-scroll at 1024), **F-19** (duplicate tables/modals), **F-07** + T1/T2 baselines (actions per decision), F-13/F-18 (keyboard), F-23, RR-04, RR-06, RR-08.

## Character
An operations console for recruiters: maximum information per screen, keyboard-first, everything is a table or a queue. Cool, neutral, precise. High density.

## Color palette
| Role | Value |
|---|---|
| Canvas | `#F4F6F8` |
| Surface | `#FFFFFF` |
| Text | `#0F172A` |
| Text-muted | `#475569` |
| Border | `#D9DEE5` |
| **Brand/action** | `#0E7C66` teal (white text ≥4.5:1) |
| Selection row | `#E6F4F1` |
| Status | success `#15803D` · warning `#B45309` · danger `#B91C1C` · info `#1D4ED8` · neutral `#475569` |
Status colour appears as a 3 px left edge + label, never fill-only.

## Typography system
- One family: **Inter** (Vietnamese coverage) 400/500/600; 13 px base for tables, 14 px for forms.
- Mono: **Roboto Mono** for IDs, dates in audit, keyboard hints.
- Scale: 12 / 13 / 14 / 16 / 20 / 24. Public pages use 16 px base with the same family.

## Layout principles
- Full-width workspace; 4 px grid; row height 36 px (compact) / 44 px (comfortable) user toggle.
- Persistent filter column (240 px) on the left of every list at ≥1280; collapses to a bar at 1024.

## Navigation concept
Top bar with a **command palette** (Ctrl K) as primary navigation and search; workspace tabs per open Tin tuyển dụng (like editor tabs); secondary sidebar hidden by default. Public: standard top bar with menu ≤430.

## Dashboard concept
Queues with counts and SLA ageing ("12 hồ sơ mới · cũ nhất 3 ngày"), a funnel strip per open tin, all clickable into a filtered table.

## Data table concept
The heart of the direction: one table system (data list, ranking, compare, admin variants), sticky identity column, column chooser, saved views, multi-select with bulk actions in a bottom bar (only allowed bulk transitions), inline expansion row showing criteria + Căn cứ without leaving the table.

## Form concept
Two-column at ≥1280 for job editing (fields | live preview of the public posting); keyboard submit; validation inline.

## Candidate profile concept
Application detail as a full-width page with a header strip (name, Mức phù hợp, status, actions) and three panes: criteria table | CV text | activity (notes, Phiếu đánh giá, history).

## Application pipeline concept
Kanban board per tin with column counts and drag to move — drag opens the same confirm-with-reason dialog; list view as alternative.

## Dialog / drawer concept
Right drawer 560 px for quick view (read only, DL-16) with Prev/Next; modal only for confirmations.

## Interaction principles
Everything reachable by keyboard; shortcuts shown in tooltips and the palette; optimistic updates with undo toast for reversible changes; bulk actions with result summary (succeeded / unchanged / failed).

## Motion principles (CSS/WAAPI)
Near-zero motion: 100–150 ms fades for drawer and toast; none on row navigation, sorting, filtering. Reduced-motion: none.

## Responsive concept
Internal ≤768: tables become stacked cards (name, score, status, one secondary line); board becomes a stage selector + list. Public mobile-first cards; filters in a sheet.

## Edge states
Not-found: in-table "Không tìm thấy hồ sơ này" panel with back link (same for both causes). Empty: table frame with one-line reason + action. Expired job: status pill "Đã hết hạn" in public detail header, disabled apply, related jobs list. Stale: toolbar badge "Dữ liệu cũ · Tải lại".

## How it meets RR-01..16
RR-01 menu ≤430 · **RR-02/RR-04 core strength** · RR-03 shared row component · RR-05 filter column/sheet · RR-06 palette, listbox, tabs per APG · RR-07 inline expansion row (one action) · **RR-08 J/K + inline decision in detail; bulk for allowed transitions** · RR-09 table-level states · RR-10 stale badge · RR-11 public 404 · RR-12 · RR-13 queue verbs · RR-14 single font, light · RR-15 · RR-16 weakest: console look carries no candidate-facing story; needs a separate public skin.

## Known weaknesses
- Distinctiveness low: resembles many SaaS admin tools; evidence becomes one column among many (risk to P1).
- Drag-to-move on the board invites fast decisions — pressure against P2/P8 even with a confirm dialog.
- Dense 13 px tables are hard for occasional users (HM, Interviewer) and for the 390 px floor.
- Public pages need a separate visual language → two designs to maintain.
