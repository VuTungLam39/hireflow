# 15 — Document / Source / Runtime Discrepancies

> Phase 00 · Workstream J. Each item: claim source → actual → label.

| ID | Claim (source) | Actual | Label | Notes / routing |
|---|---|---|---|---|
| D-01 | README intro: production is "bản v2-demo, một công ty"; MVP 3 "chờ phát hành" | Live shows 3 companies, MVP 3 public pages and employer registration live | INC (README stale) | Known; doc fix out of scope |
| D-02 | Plan §2.3 / prompt: Candidate is an actor needing a test account | No candidate role; candidate = guest, authenticated by token link | INC → **resolved by DL-02** | Actor model adjusted (file 05) |
| D-03 | Plan §2.2: "Radix used selectively" | No Radix; all primitives hand-rolled | INC | Phase 01 item P01-A11Y-PRIM (DL-05) |
| D-04 | Plan B5/§00.14: axe-core is a Phase 01 addition | `axe-core` 4.10.2 already a devDependency (used by `scripts/qa/phase3.mjs`) | INC | Governance record (§6) for it: UNK |
| D-05 | Plan §2.1 (23/11): `/jobs` shows 15 positions | 13 positions on 24/11; 12 per page ("1–12 trong 13", page 2 has 1) | Explained — **closed (DL-03)** | Count drift = expired jobs (plausible); pagination confirmed |
| D-06 | Plan §2.4: password recovery is an area to investigate | No forgot/reset-password route in router | Missing | Product gap, not redesign scope unless approved |
| D-07 | Route `/manage/jobs/:id/edit` | Gated by `job:read` only (route), i.e. Interviewer/HM pass the route gate | INC (route gate < action) | **Flag for Security Gate** (DL-04); BE enforcement UNK |
| D-08 | Expected 404 for unknown URLs | Guest on unknown URL → redirected to `/login` (catch-all is inside protected branch) | INC (RV) | UX + SEO; Phase 01 |
| D-09 | Public pages show live data | Prerendered snapshot is stale (15 vs 13) and masks loading/error states | INC (RV) | Phase 01 + Phase 05 data pattern |
| D-10 | Responsive public header | Links overlap at 320–430 px | Defect (RV) | Phase 01 P1 candidate |
| D-11 | Nav "Lịch phỏng vấn" relates to interviews | Gated by `application:read` | Observation (SV) | Phase 01 IA review |
| D-12 | Kickoff prompt: master plan at `docs/redesign/master-plan-v1.2.md`, CLAUDE.md merged | Plan at `docs/hireflow-master-plan-v1.2-consolidated-en.md`; CLAUDE.md lacks §9.3 block | INC (accepted, DL-00) | Handover gap G5 |
| D-13 | Every guest load of a protected route | Logs a console 401 (session refresh attempt) | Observation (RV) | Noise for monitoring; Phase 01 low |
| D-14 | `/login` page | Two `h1`; no skip link; a focus stop with no visible focus | Defect (RV) | Phase 01 a11y |
| D-15 | `fe/src/features/applications/constants.ts` comment: "OFFER → HIRED via `PATCH /applications/:id/hire`" | Commit a1c0271 (MVP 3.1 S4) removed hire/decline-offer; OFFER/HIRED only via the offer flow | INC (stale comment) | Source-doc drift; no redesign impact |
| D-16 | Terminology: status "Đề nghị" (OFFER), KPI "Đã nhận việc", status "Đã nhận", UI block "Offer" | Same concept named in Vietnamese and English in different places | INC (RV/SV) | Open grill question (GLOSSARY) |
| D-17 | Plan expects distinct permission-denied vs not-found | Out-of-scope records render "Không tìm thấy dữ liệu" (not-found) for HM; route-level denial renders "Trang này không thuộc quyền của bạn" | Observation (RV) | Deliberate non-disclosure (likely); Phase 01 wording |
| D-18 | `/manage/jobs/:id/edit` (D-07 follow-up) | HM out of department → BE returns not-found (route renders, data denied). In-department HM edit not tested | Partially resolved (RV) | Still SG-F1 |
| D-19 | Owner said Interviewer account available | First password given failed (401); corrected password worked on the first attempt; Interviewer fully verified | **Resolved** | — |
| D-21 | Project decision 14/11 "throttle login 5/email" was read as a lockout | Source: `LOGIN_PER_ACCOUNT = { limit: 5, ttl: 60_000 }`, block 60 s — a per-minute throttle, not an account lockout | Clarified (SV) | Recon was over-cautious; no impact |
| D-20 | Fifth account "company" (`hienvan690@…`) | Login rejected `403 ORG_DISABLED` — company suspended/rejected | Observation (RV) | Confirms disabled-company rule |
