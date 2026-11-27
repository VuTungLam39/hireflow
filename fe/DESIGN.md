---
version: alpha
name: HireFlow — Hồ sơ có căn cứ
description: Design system for HireFlow, a Vietnamese recruitment marketplace whose fit scores are backed by verbatim quotes from the CV. Direction A "Evidence Desk" with Direction B's table system (Phase 02, DD-01). Light theme only; no dark mode in this redesign (D-09).
colors:
  primary: "#1F4E79"
  primary-hover: "#173B5C"
  on-primary: "#FFFFFF"
  background: "#FAF8F4"
  surface: "#FFFFFF"
  surface-sunken: "#F3EEE3"
  foreground: "#1C1B19"
  muted-foreground: "#5F5B54"
  border: "#E4DFD6"
  border-strong: "#8C857A"
  marker: "#F2C94C"
  marker-soft: "#FBE9B3"
  marker-ink: "#8A6A00"
  success: "#2E7D4F"
  warning: "#9A5B00"
  danger: "#B3261E"
  on-danger: "#FFFFFF"
  focus-ring: "#1F4E79"
typography:
  display:
    fontFamily: Be Vietnam Pro
    fontSize: 3rem
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.01em
  h1:
    fontFamily: Be Vietnam Pro
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
  h2:
    fontFamily: Be Vietnam Pro
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.35
  h3:
    fontFamily: Be Vietnam Pro
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.4
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Be Vietnam Pro
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: Be Vietnam Pro
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
  overline:
    fontFamily: Be Vietnam Pro
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.04em
  metric:
    fontFamily: Be Vietnam Pro
    fontSize: 1.75rem
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: '"tnum" 1'
  table-cell:
    fontFamily: Be Vietnam Pro
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.3
    fontFeature: '"tnum" 1'
  table-header:
    fontFamily: Be Vietnam Pro
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.3
  document-body:
    fontFamily: Source Serif 4
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
  evidence-quote:
    fontFamily: Source Serif 4
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.6
  hero:
    fontFamily: Be Vietnam Pro
    fontSize: 2.75rem
    fontWeight: 700
    lineHeight: 1.18
  hero-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.19
  wordmark-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 1.0625rem
    fontWeight: 600
    lineHeight: 1
  wordmark-md:
    fontFamily: Be Vietnam Pro
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1
  wordmark-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 1.625rem
    fontWeight: 600
    lineHeight: 1
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
  page-public:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-lg}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 16px
  text-muted:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.caption}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 8px 14px
    height: 36px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 8px 14px
    height: 36px
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 8px 14px
    height: 36px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 8px 12px
    height: 36px
  input-border:
    backgroundColor: "{colors.border-strong}"
    width: 1px
  focus-indicator:
    backgroundColor: "{colors.focus-ring}"
    width: 2px
  rail-item-active:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 36px
  table-header:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.foreground}"
    typography: "{typography.table-header}"
    height: 40px
  table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.table-cell}"
    height: 44px
  table-row-compact:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.table-cell}"
    height: 36px
  badge-success:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 0 8px
  badge-warning:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 0 8px
  badge-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 0 8px
  badge-info:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 0 8px
  badge-neutral:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 0 8px
  evidence-mark:
    backgroundColor: "{colors.marker}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: 0 2px
  evidence-mark-focus:
    backgroundColor: "{colors.marker-soft}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
  evidence-quote:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.evidence-quote}"
  criterion-dot-matched:
    backgroundColor: "{colors.marker}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    size: 20px
  criterion-dot-border:
    backgroundColor: "{colors.marker-ink}"
    width: 2px
  cv-document:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.document-body}"
    padding: 24px
  score-metric:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.metric}"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    width: 480px
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    width: 480px
  notice-stale:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.foreground}"
    typography: "{typography.caption}"
    padding: 8px 12px
---

## Overview

HireFlow shows its working. Every application (Hồ sơ ứng tuyển) gets a Mức phù hợp backed by verbatim quotes (Căn cứ) from the CV, and a person makes every decision. The interface is a reading desk: warm paper, dark ink, and one marker colour reserved for evidence. Lists exist to reach a document; every score leads to its criteria and quotes in one action.

Principles, in priority order: evidence before decoration; one decision surface (state changes only in application detail, never in quick view — DL-16); density without crowding; one component per job; honest states; public pages mobile-first, internal pages desktop-first with a 390 px floor (DL-18); words from the GLOSSARY "Thuật ngữ giao diện" table only.

Light theme only. Dark mode is out of scope for this redesign (D-09); tokens are named by role so a dark set can be added later without renaming.

## Colors

- **Primary (#1F4E79) / Primary-hover (#173B5C):** the only action colour — primary buttons, links, focus ring, info badges (outlined, never underlined, so they do not read as links). White on primary is 8.7:1; hover darkens.
- **Background (#FAF8F4) / Surface (#FFFFFF) / Surface-sunken (#F3EEE3):** paper page, white working surfaces (cards, CV document, tables), tinted headers and the active rail item.
- **Foreground (#1C1B19) / Muted-foreground (#5F5B54):** 16.2:1 and 6.4:1 on paper; muted text stays ≥5.8:1 on every surface.
- **Border (#E4DFD6):** decorative separation only, never the sole boundary of an interactive control. **Border-strong (#8C857A):** control outlines (inputs, unselected checkboxes), 3.65:1 on surface.
- **Marker (#F2C94C) / Marker-soft (#FBE9B3) / Marker-ink (#8A6A00):** reserved for evidence. Text always sits on the marker in Foreground (10.9:1). The marker fill alone is 1.6:1 against white, so any marker-filled indicator (criterion dots) carries a 2 px Marker-ink border (5.1:1) and a number or label.
- **Success (#2E7D4F), Warning (#9A5B00), Danger (#B3261E):** status text and outlines on surface (5.1 / 5.4 / 6.5:1). Status is never colour alone: every status badge has its label from the terminology table. Warning is amber-brown and outlined so it never reads as the marker.

## Typography

- **Be Vietnam Pro** (400/500/600) for all interface text; designed for Vietnamese and verified to render the full diacritic set. Internal base 14 px (`body-md`), public base 16 px (`body-lg`).
- **Source Serif 4** (400, italic 400, 600) only for the CV document and evidence quotes — it marks "the candidate's own words". It is loaded only on document routes (application detail, CV review, ranking expansion), never on entry pages, to protect LCP.
- Numbers in scores, counts and tables use tabular figures (`metric`, `table-cell`).
- `overline` is for small section labels in documents; use sentence case in Vietnamese UI, uppercase only for these overlines.
- Self-host both families with the Vietnamese subset.
- Off-ramp sizes exist only as named tokens (DD-14): `hero` / `hero-sm` for page-level display headings, `wordmark-sm/md/lg` for the HireFlow logo only.

## Layout

- 4 px base unit; spacing scale 4 / 8 / 12 / 16 / 24 / 32 / 48.
- Internal app: left rail (labels ≥1100 px, icons 600–1100 px, compact navigation ≤600 px), content max width fluid; application work uses a list | document split at ≥1280 px and becomes two screens ≤768 px.
- Evidence margin: criteria sit beside the CV text, linked both ways; criteria are numbered identically in ranking dots, CV highlights and score segments.
- Documents cap at 72 characters per line.
- Tables follow one system: sticky identity column and header, documented column priority that hides or relocates columns by container width, no page-level horizontal scroll, stacked cards ≤600 px.
- Public pages start at 360 px and scale up.

## Elevation & Depth

Flat by default: separation comes from surface colour and 1 px borders. Two shadows only — `overlay` for sheet, dialog and popover (0 8px 24px rgba(28,27,25,0.16)) and `raised` for sticky headers while scrolling (0 1px 0 #E4DFD6). Layers: base 0, sticky 10, popover 30, sheet/dialog 40, toast 50.

## Shapes

Radius 4 px (marks, small controls), 6 px (buttons, inputs), 8 px (cards, dialogs), full (badges, criterion dots). No radius above 8 px on working surfaces.

## Components

- **Buttons:** primary (one per view region), secondary (outlined with Border-strong), danger (destructive, always behind a confirmation with reason when it changes an application). Height 36 px; touch targets reach 44 px on coarse pointers.
- **Badges:** outlined pills on surface; text = terminology label. Status, score band (Phù hợp cao / Phù hợp một phần / Phù hợp thấp) and match (Khớp / Khớp một phần / Không thấy trong CV) share this shape.
- **Evidence mark and quote:** marker fill behind the quoted span in the CV; the same quote in the criteria list uses `evidence-quote` serif italic with typographic quotes.
- **Criterion dot:** 20 px circle with its criterion number; matched = marker fill + Marker-ink border; partial = marker-soft + border; not found = surface + Border.
- **Table:** 44 px rows (36 px compact), sunken header, sticky first column, inline expansion row for criteria and quotes.
- **Sheet (quick view):** 480 px right sheet, read and navigate only — no state-changing actions.
- **Dialog:** 480 px, used for confirmations; Từ chối requires a reason.
- **Stale notice:** sunken bar "Dữ liệu lúc {giờ} · Tải lại".
- Motion uses CSS/WAAPI only: 150 ms highlight settle, 200 ms sheet ease-out, no motion on keyboard list navigation or command menu, opacity-only (≤100 ms) under prefers-reduced-motion. The 200 ms ceiling stands.
- **Named exception `marker-focus` (DD-12):** the evidence pulse after jumping to a quote lasts 300 ms, because the eye needs time to find the passage once the scroll lands. It is colour only (kept under reduced motion). The exception covers this animation alone.

## Do's and Don'ts

- Do link every score to its criteria and Căn cứ in one action.
- Do take the job label from context: "Tin tuyển dụng" on internal screens, "Việc làm" on public pages.
- Do render not-found identically for "never existed" and "outside your scope".
- Don't put decision or status-change actions in the quick-view sheet.
- Don't use the marker colour for anything except evidence; text selection (`::selection`) uses a primary tint, never the marker, so selected text is not mistaken for Căn cứ.
- Don't convey status with colour alone, and don't put text directly on Border or Marker-ink.
- Don't add dark-mode values, GSAP or Three.js patterns.
- Don't use "Đề nghị", "Đã nhận", "điểm AI" or "bằng chứng" in the UI.
