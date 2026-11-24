# 02 — Design Principles

Every direction is judged against these. Each traces to a brief position (B#) or Phase 01 finding/requirement.

| # | Principle | Means in practice | Source |
|---|---|---|---|
| P1 | **Evidence before decoration** | A score is never shown without one action to its criteria and Căn cứ; no decorative bars; quotes are first-class visual objects | B1, B8, RR-07, F-05, F-06, F-20, F-22 |
| P2 | **One decision surface** | State-changing actions live only in application detail (with confirm + reason); quick views read and navigate | DL-16, RR-08, F-07 |
| P3 | **Density without crowding** | High information per screen through alignment, column priority and type scale — not smaller targets or page scroll | RR-02, RR-04, F-03, F-23 |
| P4 | **One component per job** | One table system, one job row, one company-facts block, one dialog/sheet family | RR-03, RR-04, RR-06, F-09, F-11, F-19 |
| P5 | **Honest states** | Every critical route designs loading, empty, error+retry, stale, not-found (one look, two causes), forbidden, expired | RR-09, RR-10, F-02, F-08, F-10, ADR-0002, DL-17 |
| P6 | **Public is mobile-first; internal is desktop-first with a floor** | Candidate layouts start at 360; internal start at 1280 and must survive 390 | DL-18, RR-01, F-01 |
| P7 | **Words are part of the design** | Labels only from GLOSSARY terminology table, with scope column | RR-12, F-14, F-15, F-16, D-09 |
| P8 | **Humans decide, visibly** | Machine output (score, flags) is styled as advisory; human actions (decision, Phiếu đánh giá, Offer approval) carry the visual weight | B5, B6 |
| P9 | **Calm motion with purpose** | CSS/WAAPI, ≤200 ms for UI feedback, no motion on high-frequency keyboard actions, reduced-motion respected | B12, Phase 00 file 11 |
| P10 | **Keyboard is a first-class input** | APG patterns, visible focus, shortcuts for expert triage never required | RR-06, F-13, F-18 |
| P11 | **Speak to candidates differently** | Public pages explain the promise in candidate terms and stay current | RR-16, F-02, F-09 |

## Mandatory edge-state concepts (every direction must render these)
1. **Không tìm thấy** — same visual and copy whether the ID never existed or is outside scope (ADR-0002, P01-07). Internal: "Không tìm thấy hồ sơ này" + back to list. Public guests get a public 404, never `/login` (RR-11, F-10).
2. **Empty** — explain why it is empty and the one next step (F-21): e.g. "Chưa có hồ sơ nào cho tin này" + "Chia sẻ link việc làm".
3. **Đã hết hạn** (public job detail, ≤30 days after expiry) — banner "Việc làm này đã hết hạn", apply disabled, links to the company's open jobs (DL-17); after 30 days → public 404.
4. **Stale/failed refresh** on public lists — visible "Đang hiển thị dữ liệu lúc …" + retry (RR-10, F-02).
5. **Error with retry** surfaced within 1 s of the first failure, not after retries (F-08).
