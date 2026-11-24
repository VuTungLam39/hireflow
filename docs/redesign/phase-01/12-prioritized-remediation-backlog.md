# 12 — Prioritized Remediation Backlog

> Order = severity, then reach (actors × frequency), then effort. Slice letters refer to plan §05.4 (A Shell · B Shared components · C Data patterns · D Core hiring · E Interview/Evaluation · F Offer · G Admin · H Public/Auth · I Secondary). Nothing here is to be fixed in Phase 01.

## 1. Backlog

| Rank | ID | Title | Sev | Actors | Effort | Slice | Requirement |
|---|---|---|---|---|---|---|---|
| 1 | F-01 | Public header overlap ≤430 px | P1 | Guest/Candidate | S | H | RR-01 |
| 2 | F-07 | Quick view lacks decision actions (T2 = 3 actions) | P2 | HR, HM | M | D | RR-08 |
| 3 | F-02 | Stale prerender; masked loading/error | P2 | Guest | M | H | RR-09, RR-10 |
| 4 | F-14 | Status labels vs GLOSSARY (Offer / Đã nhận việc) | P2 | all staff | S | B/D | RR-12 |
| 5 | F-03 | /applications page h-scroll at 1024 | P2 | HR, HM, Admin | S–M | C | RR-04 |
| 6 | F-04 | Public filters bury results; company chips don't scale | P2 | Guest | S–M | H | RR-05 |
| 7 | F-05 | Ranking marks unlabeled / hidden on mobile | P2 | HR, HM | S | D | RR-07 |
| 8 | F-06 | Mobile ranking "why" not discoverable | P2 | HR, HM | S–M | D | RR-07 |
| 9 | F-22 | Mobile CV review buries evidence | P2 | HR, HM | M | D | RR-07, RR-02 |
| 10 | F-08 | Errors surface after ~3.6 s retries | P2 | staff | S | B | RR-09 |
| 11 | F-10 | Guest 404 → /login | P2 | Guest | S | H | RR-11 |
| 12 | F-12 | HM dashboard counters disagree | P2 | HM | S | D | RR-13 |
| 13 | F-09 | Empty facts strip on company page | P2 | Guest | XS | H | RR-03 |
| 14 | F-19 | Duplicate tables/modals | P3 | staff | M | B/C | RR-04, RR-06 |
| 15 | F-13 | Listbox arrow keys | P3 | staff | XS–S | B | RR-06 |
| 16 | F-23 | Dense mobile list header | P3 | HR, HM | S | C | RR-05 |
| 17 | F-24 | Login/track LCP 3.1–4.2 s | P3 | staff, Candidate | S | H | RR-14 |
| 18 | F-11 | Job row variants | P3 | Guest | S | H | RR-03 |
| 19 | F-20 | Decorative score bars | P3 | HR, HM | S | D | RR-07 |
| 20 | F-21 | Dashboard zeros / generic CTAs | P3 | staff | XS | D | RR-13 |
| 21 | F-15 | "Xếp hạng ứng viên"; candidate page term | P3 | staff, Candidate | XS | D/H | RR-12 |
| 22 | F-16 | "offer" lowercase | P3 | staff | XS | F | RR-12 |
| 23 | F-17 | /login two h1 | P3 | staff | XS | H | RR-15 |
| 24 | F-18 | Tabs Home/End | P3 | staff | XS | B | RR-06 |

## 2. Traceability of the Phase 00 backlog (every P01-* item)

| Phase 00 item | Outcome | Where / reason |
|---|---|---|
| P01-01 header overlap | **Finding** | F-01 |
| P01-02 stale prerender | **Finding** | F-02 |
| P01-03 guest 404 → login | **Finding** | F-10 |
| P01-04 /login a11y | **Finding (partial)** + **rejected part** | F-17 (two h1, no skip link). "Invisible focus stop" **not reproduced** — aside has no focusable elements (RV) |
| P01-A11Y-PRIM primitives | **Findings** + passes | F-13, F-18; Dialog, slider, palette, tooltip pass (file 09 §2) |
| P01-05 duplicate tables/modals | **Finding** | F-19 |
| P01-06 /companies SI, /login LCP | **Rejected (companies)** / **Finding (login)** | /companies SI 1.1 s over 3 runs (P00 outlier); login → F-24 |
| P01-07 unknown job/company id error UX | **Carried over** → Phase 02 state design (RR-09) | not re-captured in Phase 01; Phase 00 evidence only (no h1 rendered); needs a design decision rather than a defect report |
| P01-08 IA: interviews gating & landing redirects | **Rejected** | RV: every role lands on a usable page; no user-facing confusion found; gating by `application:read` is invisible to users |
| P01-09 T1–T3 baselines | **Done** | file 01 §2 (T2 via read-only proxy) |
| P01-10 impeccable critique/audit | **Done** | files 01 §4, 09 §5, `tool-output/` |
| P01-11 Phiếu đánh giá form UX | **Carried over** → Phase 04/05 in a non-production environment | opening/submitting a phiếu on production risks a write |
| P01-12 late CV errors | **Finding** | F-08 |
| P01-13 not-found vs forbidden wording | **Rejected (conforms)** | file 04 §L — ADR-0002 two-case rule satisfied |
| P01-14 /manage/jobs 4.8 s | **Rejected** | not reproduced: 0.83–0.92 s cold over 3 runs (file 11) |
| P01-15 mobile density | **Findings** | F-22, F-23 |
| P01-16 Offer Avoid list | **Findings** | F-14, F-16 |
| P01-17 hồ sơ / ứng viên rule | **Finding** | F-15 |
| P01-18 ADR-0002 error copy | **Rejected (conforms)** | file 04 §L |
| P01-19 Việc làm / Tin tuyển dụng mixing | **Finding (minor)** | F-15 (privacy page); internal pages conform |
| P01-20 "Nhà tuyển dụng" as internal concept | **Rejected (conforms)** | only label reference in PlatformCompaniesPage empty state |
| P01-21 Phiếu naming | **Rejected (conforms)** + submit flow carried with P01-11 | file 06 grep checks |

## 3. Security Gate hand-off (not Phase 01 findings)

| Flag | Item | Phase 01 note |
|---|---|---|
| SG-F1 | `/manage/jobs/:id/edit` gated by `job:read` | unchanged; Interviewer also passes the route gate (job:read) — include in SG test |
| SG-F2 | `/ai-chat` LLM/RAG surface | not audited for security here |
| SG-F3 | `/applications/track` token access; `/platform/*` cross-company | track page behaviour with invalid token RV; valid-token untested |
| SG-F4 | ADR-0002 indistinguishability | UI conforms; API-level status/body/timing comparison is SG scope |

## 4. impeccable critique items adjusted during cross-check

| Critique A item | Critique sev | Phase 01 | Reason |
|---|---|---|---|
| Header overlap | P1 | P1 (F-01) | confirmed |
| Empty facts strip | P1 | P2 (F-09) | cosmetic, no task blocked |
| Ranking dots unlabeled | P1 | P2 (F-05) | accessible name exists (role=img + aria-label) |
| Mobile ranking "why" | P1 | P2 (F-06) | desktop path works |
| Destructive "Từ chối" next to primary | P1 | **not a finding** | ConfirmDialog with reason code catches mis-clicks (SV) |
| Public pages don't express the differentiator | P2 (synthesis) | requirement RR-16 | strategy/brand input for Phase 02, not a defect |
| Demo banner, card anatomy on /companies, dashboard funnel spacing | P3/P2 | not filed | aesthetic only; noted for Phase 02 |
| Detector (Assessment B) | 0 findings | baseline | Phase 08 comparison |
