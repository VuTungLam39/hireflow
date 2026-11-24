# 07 — Approved Design DNA (frozen 24/11/2026)

**Direction A — "Hồ sơ có căn cứ" (Evidence Desk), with Direction B's table system.** Approved by the owner at the Phase 02 checkpoint; concept freeze gate passed (see "Concept verification"). Phase 03 builds DESIGN.md and tokens from this file.

## 1. Idea
The CV and its verbatim quotes are the centre of the product. Lists exist to reach a document; every score leads to its criteria and Căn cứ in one action. The quote highlight (marker) is the product's visual identity on public and internal surfaces.

## 2. Principles (binding)
P1–P11 from `02-design-principles.md`, with P1 (evidence before decoration) and P2 (one decision surface, DL-16) as tie-breakers.

## 3. Palette commitments (semantic roles; exact values finalised as tokens in Phase 03)
| Role | Value | Verified contrast |
|---|---|---|
| paper (page) | `#FAF8F4` | — |
| surface | `#FFFFFF` | — |
| ink (text) | `#1C1B19` | 16.2:1 on paper |
| ink-muted | `#5F5B54` | 6.4:1 paper · 6.8:1 surface · 5.8:1 on header tint |
| rule (decorative) | `#E4DFD6` | 1.3:1 — decoration only, never sole carrier |
| marker (evidence fill) | `#F2C94C` | text on marker 10.9:1; fill alone 1.6:1 → matched indicators need `marker-ink` border |
| marker-ink | `#8A6A00` | 5.1:1 on surface |
| action | `#1F4E79` | white text 8.7:1 |
| success / warning / danger | `#2E7D4F` / `#9A5B00` / `#B3261E` | 5.1 / 5.4 / 6.5:1 on surface; always with label |
Marker is reserved for evidence; warning must stay visually distinct from it (amber-brown, outlined).

## 4. Typography commitments
- UI: **Be Vietnam Pro** 400/500/600. Base 14 px internal, 16 px public. Tabular figures for scores/counts.
- Evidence & CV document: **Source Serif 4** 400/600 + italic 400 — loaded **only** on document routes (application detail, CV review, ranking expansion); entry pages (login, tracking, public lists) use the UI face only (RR-14).
- Both verified to render Vietnamese diacritics (incl. ỡ ặ ẫ ợ ữ ỹ Ẩ Ỗ Ự Ỳ đ) in a real browser. Phase 03 self-hosts with the Vietnamese subset.
- Internal scale 12/14/16/20/24/32; public adds 40/48.

## 5. Layout commitments
- Left **rail** navigation (labels ≥1100 px, icons 600–1100 px; on ≤600 px becomes a compact nav — Phase 03 decides menu vs scroll strip, see concept note).
- **Split view** list | document on application work at ≥1280; two screens ≤768.
- **Evidence margin**: criteria beside the CV text, two-way linked; criteria numbered identically across ranking dots, highlights, score segments (RR-07).
- 8 px grid; document max 72ch.

## 6. Table system (adopted from B, in A's ledger style)
One table component with variants (data list, ranking, compare, admin): sticky identity column, sticky header, **documented column priority** that hides/relocates columns by container width (no page h-scroll; container-scoped overflow only as last resort), saved views, filter control with active count, inline expansion row for criteria + Căn cứ, comfortable 44 px rows with an optional compact mode. Bulk bar only for allowed transitions.

## 7. Components committed for Phase 03
Rail nav · split view · evidence margin (two-way linking) · ledger table (§6) · sheet (quick view, read-only per DL-16) · dialog (confirm, reason required for Từ chối) · badge (status, score band) · criteria dots with numbers · notice bar (stale) · edge-state templates.

## 8. Per-role responsive posture (DL-18)
Candidate/public: mobile-first from 360 px. HR/HM/Interviewer/Admin: desktop-first from 1280 px with a 390 px floor — no overlap, no page-level horizontal scroll, read flows usable, tables become stacked cards with a path to detail.

## 9. Motion principles (CSS/WAAPI only)
Highlight settle 150 ms on criterion focus; sheet 200 ms ease-out; no motion on J/K list navigation or sorting; `prefers-reduced-motion` → opacity only. No GSAP/Three.js.

## 10. Edge states (mandatory)
Không tìm thấy (one design, two causes — ADR-0002); empty with reason + one action; Đã hết hạn public job (DL-17); stale notice "Dữ liệu lúc … · Tải lại"; error + retry within 1 s.

## 11. Language
Labels only from GLOSSARY "Thuật ngữ giao diện", respecting the scope column. No dark mode [D-09].

## Concept verification (freeze gate, 24/11/2026)
Static concepts in `concepts/` (split view, ledger with 64 rows, dashboard), labelled as concept material, checked in Chromium at 1440/1024/768/390 (12 renders, `concepts/screenshots/`):
- page `scrollWidth = innerWidth` at all widths; 0 overlaps among nav/buttons/badges/h1;
- both typefaces pass `document.fonts.check` with Vietnamese glyphs and load the expected faces; serif not loaded on ledger/dashboard;
- ledger at 1024: table 918 px fits container 918 px (F-03 width) — 13 rows visible in a 900 px-tall viewport; at 390 rows become cards;
- **one revision round on A applied** (parameters, not direction): matched-criterion dots got a `marker-ink` border (fill alone 1.6:1); low-priority column threshold moved to container width (table overflowed by 58 px at 1440); mobile rail labels no-wrap; badge stretch in dashboard rows fixed.
Remaining for Phase 03: internal mobile navigation pattern (concept used a horizontally scrolling strip — acceptable floor, not the final answer).
