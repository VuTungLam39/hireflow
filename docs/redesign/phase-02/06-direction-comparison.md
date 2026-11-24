# 06 — Direction Comparison

Scores 1–5 are reasoned judgements against the brief and Phase 01 evidence, not measurements; Phase 04 validates with users [D-08].

| Criterion | A — Evidence Desk | B — Pipeline Console | C — Guided Flow |
|---|---|---|---|
| Workflow Fit | **5** — built around W3/W4 (triage + evidence review), decision in detail (DL-16) | 4 — fastest for W3 bulk triage; evidence is one column among many | 3 — good for W1/W2/W5; weak for W4 ranking/compare |
| Readability | **5** — serif quotes vs UI text separates candidate words from system text | 3 — 13 px dense tables; fine for experts, hard for HM/Interviewer | 5 — large type, one task per screen |
| Data Density | 3 — medium; split view trades rows for document | **5** — maximum rows, saved views, column chooser | 2 — cards; long scrolls at 50+ hồ sơ |
| Distinctiveness | **5** — the marker/quote motif is the product's own idea (RR-16) | 2 — looks like generic admin SaaS | 3 — friendly but familiar consumer style |
| Accessibility | 4 — clear contrast, keyboard linking; split view needs focus care | 4 — keyboard-first; small text risk | **5** — large targets and type |
| Responsive | 4 — public mobile-first; internal two-screen pattern on mobile | 3 — tables→cards OK, board awkward ≤768 | **5** at 390, 2 at 1440 → overall 4 |
| Scalability | 4 — rail + per-job tabs extend to new modules | **5** — palette + table system absorb anything | 3 — task cards don't scale to admin/reporting |
| Maintainability | 4 — one table, one sheet, two typefaces | 4 — one family, but a second public skin to maintain | 4 — simple components, stepped forms cost more |
| Brand Fit | **5** — "evidence you can check" is the visible identity | 2 — speed over trust | 3 — warmth fits candidates, not companies |
| **Total (45)** | **39** | 32 | 32 |

## Critical workflows evaluated
| Workflow | A | B | C |
|---|---|---|---|
| T1 open hồ sơ from list (baseline 2 actions) | 1 (J/K or click; document updates in place) | 1 (row expansion) | 2 (open card → detail) |
| T2 triage decision (baseline 3; RR-08 ≤2) | 2 (select → Chuyển trạng thái with reason) | 2 (select → decide; bulk for allowed moves) | 2 (review queue → decide) |
| T3 see why a score (baseline 3 clicks) | 1 (criteria beside CV, linked) | 1 (expansion row) | 1–2 (summary card, then scroll) |
| Public browse → apply on 390 px | mobile-first cards + filter sheet | same pattern, separate skin | strongest (search-first, stepped apply) |
| Ranking 50+ hồ sơ | ledger table, criteria numbered | strongest | weak |
Action counts are design intent, to be measured in Phase 04.

## Recommendation: **Direction A — "Hồ sơ có căn cứ"**, borrowing B's table system
Why: HireFlow's differentiator is evidence-backed scoring (brief §1). A is the only direction where that promise shapes the structure (CV and criteria side by side, quotes as a visual identity), on public and internal surfaces alike, which also answers RR-16. It meets every RR, keeps decisions in one surface (DL-16) and reads well for occasional roles. Its main gap — density for heavy HR lists — is closed by adopting B's table rules (sticky identity column, column priority, saved views, inline expansion) inside A's ledger style.

Note: SG-03 (Security Gate) shows evidence can be invisible in the rendered CV. A's design, which shows the CV **text layer** as the document with quotes highlighted, is also the presentation R3 may choose; that alignment is a bonus, not a reason.

## What choosing each direction commits Phase 03 to
- **A:** tokens for paper/ink/marker + status; two typefaces (Be Vietnam Pro + Source Serif 4, subset, serif lazy on document routes); components: rail nav, split view, evidence margin with two-way linking, ledger table (with B's features), sheet, dialog. Accepted trade-off: fewer rows per screen than B by default (compact mode available).
- **B:** single family; table system first; command palette, workspace tabs, kanban with confirm; **plus a separate public visual language** (B has none for candidates). Trade-off accepted: lower distinctiveness, evidence visually de-emphasised.
- **C:** mobile-first card system, bottom tabs, stepped forms, review queue; a separate dense table for HR would still be needed. Trade-off accepted: desktop HR/HM work gets the weakest support.

## If the owner chooses differently
- Choosing **B** means accepting that HireFlow looks like any ATS and that P1 (evidence before decoration) relies on discipline in table cells rather than structure.
- Choosing **C** means accepting weaker ranking/compare for HR/HM (the desktop-primary roles per DL-18).
