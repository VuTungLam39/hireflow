# 17 — Phase 01 Audit Backlog (input contract for Phase 01)

> Items Phase 01 must audit with evidence (impeccable critique/audit [D-03], axe-core/Lighthouse [D-05], T1–T3 baselines [D-08]). Severity here is provisional.

| ID | Item | Route(s) | Source | Prov. severity |
|---|---|---|---|---|
| P01-01 | Public header link overlap ≤430 px | all public (CR-01..04, CR-13) | R-01/R-02 | P1 |
| P01-02 | Stale prerender + masked loading/error states | CR-01..04 | file 09 §1 | P2 |
| P01-03 | Guest 404 redirects to `/login` | `*` | D-08 | P2 |
| P01-04 | `/login` a11y: two h1, no skip link, invisible focus stop | CR-05 | D-14 | P2 |
| **P01-A11Y-PRIM** | **Accessibility of hand-rolled primitives — Dialog (native `<dialog>`; return focus), Popover (menu/listbox semantics, arrow keys), Tabs (Home/End missing), Tooltip — no Radix in this codebase** | all internal | DL-05, file 07 | P2 |
| P01-05 | Duplicate table/dialog implementations (5 raw tables, 5 modal surfaces) | internal | file 07 §4 | P3 |
| P01-06 | `/companies` Speed Index 9.4 s; `/login` LCP 4.0 s | CR-03, CR-05 | file 14 | P3 |
| P01-07 | Unknown job/company id renders no heading — check error UX | CR-02, CR-04 | file 09 | P3 |
| P01-08 | IA: "Lịch phỏng vấn" gated by `application:read`; role landing redirects (`/` → `/interviews` → `/platform/companies`) | internal | D-11 | P3 |
| P01-09 | T1–T3 baselines (HR find/open application; HR review CV + evaluate; Candidate filter job → company) | CR-01, CR-04, CR-08, CR-09 | D-08 | required |
| P01-10 | impeccable critique/audit on critical routes CR-01..CR-13 | all critical | D-03 | required |
| P01-11 | Interviewer: UX of the Phiếu đánh giá form (opened/submitted only in a safe environment — not on production) | `/interviews`, CR-09 | W-30 | P3 |
| P01-12 | Error handling on CV review: skeleton persists while 5xx retries run; error appears late | CR-09 | file 09 §4 | P3 |
| P01-13 | "Not found" vs "forbidden" wording for out-of-scope records | CR-09, job edit | D-17 | P3 |
| P01-14 | `/manage/jobs` first-load DOMContentLoaded 4.8 s — re-measure, cold vs warm | CR-07 | file 14 §3 | P3 (unconfirmed) |
| P01-15 | Mobile density of applications list/filters (4 filters wrap above first record) and stacked CV review | CR-08, CR-09 | R-07/R-08 | P3 |
| P01-16 | Terminology: grep UI strings for the GLOSSARY Avoid lists ("Đề nghị" for the offer concept, "Đã nhận" as a status) and file each occurrence against D-16 (DL-08) | CR-06, CR-09 | D-16 | P3 |
| P01-17 | List/detail copy against the hồ sơ vs ứng viên rule (dimensions D, F) (DL-09) | CR-06, CR-08, CR-09, CR-10, CR-11 | GLOSSARY | P3 |
| P01-18 | Dimension L: error copy against ADR-0002 — "forbidden" on out-of-scope = finding; "not found" on in-scope permission denial = finding | all detail routes | ADR-0002 | P3 |

| P01-19 | Cross-scope label mixing: public pages using "tin tuyển dụng", signed-in pages using "việc làm" (DL-11) | public + internal | GLOSSARY | P3 |
| P01-20 | Internal UI/docs using "Nhà tuyển dụng" as a concept (actor, column, filter) — public header label is correct, do not flag (DL-12) | internal | GLOSSARY | P3 |
| P01-21 | Interview screens + dashboard against Phiếu đánh giá / Buổi phỏng vấn naming and Avoid list; Interviewer submit-flow verification (DL-13) | `/interviews`, CR-06, CR-09 | GLOSSARY | P3 |

## Carry-forward notes for later phases

- Phase 02 [D-09]: terminology table needs a **scope** column (public / internal / both) — from DL-11/DL-12.
- Phase 03: job-display components take the entity label from context (public "Việc làm" vs internal "Tin tuyển dụng"); never hardcode it (DL-11).

## Security Gate flags (carried, not audited in Phase 01)

- SG-F1 `/manage/jobs/:id/edit` gated by `job:read` — verify BE enforces `job:update` (DL-04).
- SG-F2 `/ai-chat` LLM/RAG surface — prompt injection and cross-tenant retrieval (DL-01).
- SG-F3 `/applications/track` token access (CR-13) and `/platform/*` cross-company access (CR-12).
- SG-F4 ADR-0002 verification: out-of-scope IDs (other department, other company) must be indistinguishable from non-existent IDs.
