# 03 — Direction A: "Hồ sơ có căn cứ" (Evidence Desk)

> Concept only — not product state. Wireframes are ASCII sketches.

## Derived from
- Brief §1 (the promise: score backed by verbatim quotes), §5 (shows its working), §8 (identity built on the quote).
- Findings answered first: **F-05, F-06, F-20, F-22** (evidence hidden, decorative scores, mobile "why" lost), **F-07** (decision path), F-09/F-11 (one company-facts / job row), RR-07, RR-08, RR-16.

## Character
Document-centric. The CV and its quotes are the centre of the product; lists exist to get you to a document. Feels like a well-kept reading desk: paper, ink, one marker colour. Medium density.

## Color palette
| Role | Value | Note |
|---|---|---|
| Paper (page bg) | `#FAF8F4` | warm off-white |
| Surface | `#FFFFFF` | cards, document |
| Ink (text) | `#1C1B19` | ~16:1 on paper |
| Ink-muted | `#5F5B54` | ~6.5:1 on paper |
| Rule/border | `#E4DFD6` | |
| **Marker (brand/evidence)** | `#F2C94C` highlight fill behind quotes; `#8A6A00` for marker text/icons | fill is background-only; text stays Ink |
| Action (primary) | `#1F4E79` deep blue | ≥7:1 white text |
| Status | success `#2E7D4F` · warning `#9A5B00` · danger `#B3261E` · info `#1F4E79` · neutral `#5F5B54` | always paired with label/icon |
Contrast values are targets to verify in Phase 03 tokens.

## Typography system
- UI: **Be Vietnam Pro** (designed for Vietnamese) 400/500/600 — 14 px base internal, 16 px base public.
- Document & quotes: **Source Serif 4** 400/600 italic for Căn cứ — the serif marks "this is the candidate's own words".
- Numbers: tabular figures of the UI face for scores and counts.
- Scale (internal): 12 / 14 / 16 / 20 / 24 / 32. Public adds 40 / 48 for hero.

## Layout principles
- Internal: **list | document split** at ≥1280 (list 40%, document 60%); at 1024 list collapses to a narrow column of names + score; ≤768 list and document are separate screens.
- Document view has a **right margin for evidence**: each criterion sits beside the CV passage that proves it (like margin notes).
- 8 px spacing grid; max reading width 72ch in documents.

## Navigation concept
Left rail (icons + labels, collapsible): Hôm nay · Tin tuyển dụng · Hồ sơ · Kho ứng viên · Phỏng vấn · Công ty. Within a Tin tuyển dụng: tabs Tổng quan · Hồ sơ · Xếp hạng · Tiêu chí. Public: slim top bar (logo, Việc làm, Công ty, Nhà tuyển dụng) collapsing to one menu button ≤430 px (fixes F-01).

## Dashboard concept ("Hôm nay")
A short reading list, not a wall of counters: "Cần bạn quyết định" (hồ sơ with Phiếu đánh giá complete), "Hồ sơ mới cần xem", "Buổi phỏng vấn hôm nay", "Offer chờ duyệt". Each row = verb + count + the first item; zero states say why (F-12, F-21, RR-13).

## Data table concept
Ledger style: generous row height (44 px), sticky name column, score column shows number + criteria dots with numbers (1·2·3) that match the document's criteria numbering (RR-07). Column priority documented; at 1024 low-priority columns move into the row's secondary line (no h-scroll, F-03).

## Form concept
Single column, labels above, helper text in Ink-muted, errors inline and summarised at top on submit. Public apply form: 3 fields + CV upload, progress shown in the button, success page shows the tracking-link promise.

## Candidate profile concept (application detail)
```
┌ Nguyễn V. A — Backend Dev · Mức phù hợp 82 ─────────── [Chuyển trạng thái ▾] ┐
│ CV (serif)                                │ Tiêu chí                       │
│ ... 5 năm làm [NestJS, PostgreSQL] ...  ◀─┤ 1 NestJS ≥3 năm   Khớp   ▮▮▮   │
│ ... triển khai [Docker] cho ...         ◀─┤ 2 Docker          Khớp         │
│                                           │ 3 AWS             Không thấy    │
│ Phiếu đánh giá (2) · Ghi chú · Lịch sử    │ Căn cứ bị loại (1) ▸           │
└───────────────────────────────────────────┴────────────────────────────────┘
```
Highlights in the CV and the criteria list are linked both ways (hover/focus one → the other). Decision button lives here only (P2).

## Application pipeline concept
Per-job list grouped by Trạng thái hồ sơ (collapsible sections, counts in headers), not a drag board — moves happen in detail with reason (P2). A compact stage bar at the top of each job shows counts per stage.

## Dialog / drawer concept
Quick view = right **sheet** (480 px) showing summary, top 3 Căn cứ, and "Mở chi tiết" — no state actions (DL-16). Confirm dialogs centred, max 480 px, reason field required for Từ chối.

## Interaction principles
Link evidence both ways; keyboard J/K to move through the list while the document updates; every number is a link to its explanation; destructive actions confirm with reason.

## Motion principles (CSS/WAAPI)
- Highlight "settle": quote background fades in 150 ms when its criterion is focused.
- Sheet slides 200 ms ease-out; no motion when navigating with J/K (high frequency).
- `prefers-reduced-motion`: opacity only.

## Responsive concept
Public mobile-first: job cards with company + location + deadline; filters in one "Bộ lọc (n)" sheet (F-04, RR-05). Internal ≤768: list and document become two screens; in the document, criteria become an accordion at the top, each opening its quote inline — the "why" is one tap (F-06, F-22).

## Edge states
Not-found: a blank paper sheet with "Không tìm thấy hồ sơ này" (one design for both causes). Empty: illustrated only with a single line icon, plus one action. Expired job: grey banner across the job document, "Đã hết hạn" stamp, apply button disabled, "Việc làm khác của công ty". Stale: thin notice bar "Dữ liệu lúc 09:12 · Tải lại".

## How it meets RR-01..16
RR-01 slim header + menu ≤430 · RR-02 column priority, no h-scroll · RR-03 one job row / facts block adapting to missing data · RR-04 one ledger table with variants · RR-05 filter sheet with count · RR-06 one primitive family (sheet, dialog, listbox, tabs) · **RR-07 core of the direction** · RR-08 J/K + decision in detail = ≤2 actions from list · RR-09 edge states above · RR-10 stale bar · RR-11 public 404 · RR-12 terminology table · RR-13 verb rows · RR-14 serif loaded only on document views (public entry pages use UI face only) · RR-15 one h1, skip link · **RR-16 public hero shows a real-looking quote-highlight motif.**

## Known weaknesses
- Medium density: HR handling 200+ hồ sơ per tin sees fewer rows per screen than Direction B.
- Two typefaces = more font bytes; serif must stay off entry pages to keep LCP (RR-14).
- The yellow marker risks reading as "warning"; needs a distinct warning hue and careful naming in tokens.
- Split view at 1024 is tight; needs testing with long Vietnamese names.
