# 02 — Typography System

Tokens: `typography.*` in `fe/DESIGN.md`.

## Families
| Family | Weights | Use | Loading |
|---|---|---|---|
| Be Vietnam Pro | 400, 500, 600 | all interface text | self-hosted, Vietnamese subset, preloaded on every route |
| Source Serif 4 | 400, 400 italic, 600 | CV document, evidence quotes only | self-hosted, loaded only on document routes (DD-11) |
Vietnamese rendering of both verified in Phase 02 concepts (incl. ỡ ặ ẫ ợ ữ ỹ Ẩ Ỗ Ự Ỳ đ).

## Scale
| Token | Size / weight / line-height | Use |
|---|---|---|
| display | 48 / 600 / 1.15, −0.01em | public hero only |
| h1 | 24 / 600 / 1.3 | one per page (RR-15) |
| h2 | 20 / 600 / 1.35 | section |
| h3 | 16 / 600 / 1.4 | card / sub-section |
| body-lg | 16 / 400 / 1.6 | public base, long-form job descriptions |
| body-md | 14 / 400 / 1.5 | internal base |
| label | 14 / 500 / 1.4 | buttons, form labels, nav |
| caption | 12 / 400 / 1.4 | meta, badges, helper text |
| overline | 13 / 500 / 1.4, +0.04em, uppercase | document section labels only |
| metric | 28 / 600 / 1.2, tabular | dashboard counts, Mức phù hợp in headers |
| table-cell | 14 / 400 / 1.3, tabular | table body |
| table-header | 12 / 600 / 1.3 | table header |
| document-body | Serif 16 / 400 / 1.7 | CV text |
| evidence-quote | Serif 15 / italic 400 / 1.6 | Căn cứ in criteria lists |

## Domain guidance
- **Candidate information:** names in `label` 600 (h3 in cards); never truncate a Vietnamese name mid-word — wrap to two lines in tables (secondary line pattern).
- **Job descriptions:** `body-lg`, 72ch max.
- **Dashboard metrics:** `metric` with the unit in words beside it ("12 hồ sơ mới").
- **Dense tables:** `table-cell`, 14 px minimum; compact mode changes row height, not font size.
- **Status labels:** `caption` inside badges; sentence case.
- **Long-form (CV):** `document-body`, quotes wrapped in “ ” typographic quotes.
- No text below 12 px anywhere.
