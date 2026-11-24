# 05 — Direction C: "Một việc mỗi lúc" (Guided Flow)

> Concept only — not product state.

## Derived from
- Brief §2 (candidates mobile-primary; HM/Interviewer occasional users), §6 warmth toward candidates, §11.
- Findings answered first: **F-01** (public header), **F-04** (public filters), **F-12/F-21** (dashboard counters, generic CTAs), F-24 (entry LCP), F-10, RR-01, RR-05, RR-13, RR-16.

## Character
Task-first and mobile-first everywhere: each screen asks one question ("Hồ sơ này có đi tiếp không?"), with large touch targets and plain language. Friendly, bright, spacious. Low density.

## Color palette
| Role | Value |
|---|---|
| Background | `#FFFFFF` |
| Tint surface | `#F1F5FF` |
| Text | `#111827` |
| Text-muted | `#4B5563` |
| **Brand** | `#3B5BDB` indigo (white text ≥4.5:1) |
| Accent | `#F08C00` for highlights in illustrations only |
| Status | success `#2B8A3E` · warning `#B35C00` · danger `#C92A2A` · info `#3B5BDB` |

## Typography system
**Lexend** for headings (readability-oriented, Vietnamese coverage to verify) + **Be Vietnam Pro** for body; 16 px base everywhere, 18 px on candidate pages; scale 14 / 16 / 18 / 22 / 28 / 36.

## Layout principles
Single column, max 720 px for task screens; cards with 16–24 px padding; bottom action bar on mobile.

## Navigation concept
Mobile: bottom tab bar (Hôm nay · Hồ sơ · Phỏng vấn · Thêm). Desktop: top bar + left list only on list pages. Public: big search-first header, one menu.

## Dashboard concept
"Việc của bạn hôm nay" as a stack of task cards, each one action ("Xem 5 hồ sơ mới", "Viết Phiếu đánh giá cho buổi 14:00").

## Data table concept
Cards by default; a "Xem dạng bảng" toggle on desktop for HR with a simple table (no column chooser).

## Form concept
Stepped forms (job creation 4 steps; apply 2 steps) with progress, autosave, large inputs.

## Candidate profile concept
Review mode: one hồ sơ per screen, summary card on top (Mức phù hợp + 3 strongest Căn cứ), then criteria list; "Tiếp" moves to the next hồ sơ; decision buttons at the bottom of the detail screen (not in a quick view).

## Application pipeline concept
Stage tabs with counts; inside a stage a review queue ("Xem lần lượt").

## Dialog / drawer concept
Bottom sheets on mobile, centred dialogs on desktop; no side drawers.

## Interaction principles
One primary action per screen; swipe between hồ sơ in review mode on mobile (no swipe-to-decide); celebratory but small confirmations.

## Motion principles (CSS/WAAPI)
Card transitions 200–250 ms slide between queue items; bottom-sheet spring approximated with CSS easing; reduced-motion: crossfade.

## Responsive concept
Same layout scales up; desktop shows two columns at most. Strong at 390; under-uses 1440.

## Edge states
Not-found: friendly full-screen message, same for both causes. Empty: illustrated card with one action. Expired job: large notice card with "Việc làm này đã hết hạn" and suggestions. Stale: inline card "Có thể chưa cập nhật · Tải lại".

## How it meets RR-01..16
**RR-01, RR-05, RR-13, RR-16 strongest** · RR-02 easy (single column) · RR-03 card components · RR-04 weak: simple table only, no ranking/compare density · RR-06 sheets/dialogs/tabs · RR-07 summary card shows top quotes, full criteria one scroll away · RR-08 review queue reaches decision in 2 actions · RR-09–RR-12, RR-15 fine · RR-14 good (light pages).

## Known weaknesses
- Fails data-heavy work: ranking and compare for 50+ hồ sơ per tin become long scrolls (Phase 01 data-heavy audit).
- Under-uses desktop, which is the primary context for HR/HM (DL-18).
- Queue-style review can bias toward sequential, fast decisions on whoever comes first.
- Friendly visual tone risks reading as a consumer app, not a professional tool for companies.
