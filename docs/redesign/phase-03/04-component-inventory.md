# 04 — Component Inventory

Starting point: Phase 00 file 07 (Source-verified at `04ac5b7`): all primitives hand-rolled, no Radix; 5 raw tables besides DataTable; 5 modal implementations; 20 feature files rendering raw `<button>`; radius scale collapsed to 10 px.
Decision codes: **keep** (API fits contract, restyle only) · **rebuild** (behaviour or API must change) · **new** · **drop/merge**.

## Foundation
| Component | Current | Decision | Note |
|---|---|---|---|
| Button | `Button` + `buttonVariants` (6 variants) | rebuild | variants → primary / secondary / ghost / danger / link; sizes sm 32 · md 36 · lg 44; replace raw `<button>` in 20 files over time |
| IconButton | Button `icon` size | new (split) | required accessible name |
| Input, Textarea, Checkbox | native + `fieldBase` | keep | restyle to tokens |
| Radio, Switch | none / ad hoc | new | native-first |
| Select | native `<select>` | keep native for simple; **new** Select (listbox) only where options need rich content | fixes nothing broken today |
| Combobox | none (company filter chips) | new | F-04/F-23: company filter must scale to ≥50 |
| Badge (StatusBadge, ScoreBadge, MatchBadge) | `StatusBadges.tsx`, `tones.ts` | rebuild | labels from GLOSSARY table only |
| Avatar, Separator | custom | keep | |
| Tooltip | custom `role=tooltip` | rebuild | primitives decision |
| Popover | custom (P01-A11Y-PRIM; F-13 arrows missing) | rebuild | primitives decision |

## Navigation
| Component | Current | Decision |
|---|---|---|
| Sidebar → **Rail** | dark rail Sidebar | rebuild (Direction A rail, 3 width modes) |
| Topbar | Topbar + QuickSearch + UserMenu | rebuild (lighter; search moves to Command Menu) |
| PublicHeader | PublicLayout header (F-01 overlap) | rebuild — menu ≤430 px |
| Breadcrumbs | crumb in Topbar | keep |
| Tabs | custom (F-18 Home/End missing) | rebuild — primitives decision |
| Pagination | custom | keep |
| SegmentedControl, ChipGroup, Stepper | custom | merge: SegmentedControl → Tabs/ToggleGroup; ChipGroup → Combobox/Filter; Stepper keep |

## Overlay (5 modal implementations → 4 contracts)
| Current | → Contract |
|---|---|
| `Dialog` (native `<dialog>`) | **Dialog** |
| `ConfirmDialog` | **AlertDialog** (reason field variant for Từ chối) |
| `DetailDialog` (173), `SidePanel` (83) | **Sheet** (quick view, read-only DL-16; one implementation) |
| `CommandPalette` | **Command Menu** |
| `GalleryLightbox` | Dialog variant `media` |
| RowMenu | **Dropdown Menu** |

## Data (6 tables → 1 system)
| Current | → |
|---|---|
| `DataTable` (372, virtualized) | **DataTable** contract (B's rules: sticky identity, column priority, saved views, inline expansion, bulk bar) — rebuild |
| raw tables in `CompareDialog`, `RankingTable`, `FunnelReport`, `AiQuotaSection`, `QueueCountsTable` | variants of DataTable (`ranking`, `compare`, `report`, `admin`) — drop raw tables |
| FilterBar, DateRangeFilter | **FilterBar** with active count + sheet on <600 px — rebuild |
| Search Input, Sort Control, Bulk Action Bar | new / extracted from DataTable |
| EmptyState, ErrorState, Skeleton, Spinner | keep, align to edge-state templates |

## Feedback
Toast (sonner, keep) · Inline Alert (new) · Error State (keep) · Success State (new) · Progress Indicator (Stepper/Spinner keep) · Confirmation Dialog (= AlertDialog) · **Stale Notice** (new, RR-10).

## Layout
AppShell (rebuild from MainLayout) · PublicShell (rebuild) · AuthShell (rebuild: one h1, skip link — F-17) · PageHeader (keep) · PageContainer, ContentSection (new) · **SplitLayout** (new — list | document) · DetailLayout (new) · SidebarLayout (= AppShell).

## Recruiting patterns (file 08)
Candidate Card, Candidate Profile Header, CV Review Panel (with evidence margin), Criterion List, Ranking, Pipeline (stage-grouped list), Interview Schedule, Phiếu đánh giá form, Offer Summary, Activity Timeline, Candidate Comparison, Bulk Candidate Actions, Job Summary, Hiring Progress — each only where its business function is verified.

## Counts
Contracts to write in file 05: ~38 components + 14 patterns. Removed implementations: 5 raw tables, 2 of 5 modal variants (DetailDialog+SidePanel merged), SegmentedControl, ChipGroup.

---

# Checkpoint — Primitives strategy (owner decision)

Interactive primitives in scope: Dialog/AlertDialog/Sheet, Popover, Dropdown Menu, Tooltip, Tabs, Select (rich), Combobox, Command Menu.

| | **Option 1 — Adopt Radix UI** (per-primitive `@radix-ui/react-*`) | **Option 2 — Harden hand-rolled** |
|---|---|---|
| Bundle | Est. +25–40 KB gzip for the full set (shared deps: focus-scope, dismissable-layer, react-remove-scroll, floating-ui for Popover/Tooltip/Select); tree-shaken per primitive, loaded with the routes that use them. **Estimate, not measured** — first slice measures with `vite build` | ~0 added; current `components/ui` is 1,172 lines incl. tests |
| API fit with contracts | Unstyled, compound components (`Dialog.Root/Trigger/Content`) wrap cleanly behind house components that expose the contract props; WAI-ARIA APG keyboard maps built in (arrows, Home/End, typeahead, focus return, scroll lock, collision-aware positioning) | Contracts are written to the house API directly; every APG behaviour must be implemented and tested by us |
| Known gaps closed | F-13 (listbox arrows), F-18 (Home/End), Dialog return-focus (UNK), positioning/collision, typeahead, nested layer dismissal — all out of the box | must be built: listbox arrow/typeahead, Home/End, focus return audit, positioning engine (or keep naive positioning), nested-layer dismissal; Combobox and Command Menu from scratch |
| Migration effort per slice | Each slice swaps one primitive behind its house component (1–2 days each incl. tests); call sites unchanged if the house API is kept | Each slice fixes one primitive (1–3 days each incl. keyboard tests); Combobox/Select/Command Menu are the expensive ones (est. 3–5 days each) |
| Accessibility risk carried | Low for behaviour (library maintained, React 19 supported); residual risk in our composition (labels, content) | Medium-high and ongoing: each primitive is ours to keep APG-correct; Phase 01 already found 2 partial primitives |
| Dependency / lock-in | +1 dependency family (MIT, widely used); styling stays ours (Tailwind + tokens) | none |
| Fit with project stance | Plan §2.2 originally assumed "Radix used selectively" (Phase 00 D-03 discrepancy) | matches current code |

**Recommendation: Option 1 — adopt Radix for the interactive primitives listed above, introduced slice by slice behind house components; keep native elements for Input, Textarea, Checkbox, simple Select.** Reason: the behaviours the contracts require (APG keyboard maps, focus management, layering) are exactly what Radix provides and what our hand-rolled set already fails partially; the ongoing accessibility maintenance cost of Option 2 outweighs an estimated 25–40 KB that is split across routes. Condition: the first Phase 05 slice that adopts Radix measures the real bundle delta and records it; if it exceeds 40 KB gzip on any entry route, stop and revisit.

STOP — file 05 contracts are written after the owner chooses.
