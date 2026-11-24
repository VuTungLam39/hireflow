# 01 — Product Design Brief

Status: draft for owner approval at the Phase 02 checkpoint. Claims about the current product cite Phase 00/01 files; everything else is a position, not a measurement.

## 1. Product positioning
HireFlow is a Vietnamese recruitment marketplace (sàn) where many companies post jobs and candidates apply with a CV. Its distinct promise: **every application gets a fit score (Mức phù hợp) that is backed by verbatim quotes (Căn cứ) from the CV, and a human makes every decision** (GLOSSARY header). Phase 01 found the public pages do not communicate this promise at all (RR-16, critique A synthesis). The redesign must make "evidence you can check" the visible identity, not a hidden feature.

## 2. Target users
| User | Context | Device posture (DL-18) |
|---|---|---|
| Ứng viên (guest candidate) | browses `/jobs`, `/companies`, applies, follows a tracking link (ADR-0001) | **mobile-primary** |
| HR | runs the pipeline daily, high-volume triage | desktop-primary, mobile-safe floor 390 px |
| Hiring Manager | reviews ranked hồ sơ of own department, approves Offer | desktop-primary, mobile-safe floor; glanceable on phone |
| Interviewer | sees assigned interviews, writes Phiếu đánh giá | desktop-primary, mobile-safe floor |
| Admin | company settings, users, departments, audit | desktop |
| Quản trị sàn | approves/locks companies | desktop |

## 3. Core jobs-to-be-done
- Candidate: "find a real, open job I fit, apply in a few minutes from my phone, and know where my application stands."
- HR: "get from a pile of CVs to a short list I can defend, fast, without missing a good candidate."
- HM: "see who is worth interviewing for my role and why, then decide."
- Interviewer: "know what I must evaluate and record it once."
- Company admin: "keep our company page and team set up."

## 4. Main workflows (Phase 00 file 06; baselines Phase 01)
W1 Public browse → apply (CR-01, CR-02) · W2 track application (CR-13) · W3 triage list → decision (CR-08 → CR-09; T1 2 actions, T2 3 actions) · W4 ranking + CV evidence review (CR-10, CR-09; T3 3 clicks) · W5 interview → Phiếu đánh giá → debrief · W6 Offer draft → approve → send → accepted/declined · W7 job create/publish (CR-07) · W8 company page (CR-04) · W9 platform approval (CR-12).

## 5. Product personality
Trustworthy, precise, calm, Vietnamese-first. It behaves like a careful colleague who shows their working — never a black-box "AI says". Not playful, not corporate-grey.

## 6. Brand attributes
Evidence · Fairness (human decides, no demographic inference — BR-AI-09) · Clarity · Speed for experts · Warmth toward candidates.

## 7. UX principles (input to file 02)
Evidence before decoration; one decision surface (DL-16); density without crowding; one component per job (F-11, F-19); state honesty (F-02, F-08); public-first mobile (F-01); words from GLOSSARY only (RR-12).

## 8. Visual objectives
- A recognisable identity built around the **quote** (the evidence mark), usable on public and internal surfaces.
- Scores never shown as decoration (F-20): every number links to its criteria and quotes (RR-07).
- Clear hierarchy on dense HR screens without horizontal page scroll (F-03, RR-02).
- Public pages that feel alive and current (F-02 stale prerender, F-09 empty facts).

## 9. Functional constraints
- Backend stays (rebuild FE, keep BE — redesign plan). API shapes and statuses are fixed (`ApplicationStatus`, `OfferStatus`, `AiStatus`, `ScoreFlag`).
- Quick view = read + navigate only (DL-16). Decisions live in application detail.
- Expired jobs: off listings immediately; detail page 30 days with "Đã hết hạn", apply disabled; then not-found (DL-17).
- Not-found is one behaviour for two causes — never-existed and out-of-scope (ADR-0002, P01-07).
- Offer/Đã nhận việc only via the Offer flow (BR-STS-05).

## 10. Accessibility requirements
WCAG 2.2 AA: contrast ≥4.5:1 text / 3:1 UI; targets ≥24 px (2.5.8); one h1 + skip link per layout (RR-15, F-17); APG keyboard patterns for every primitive (RR-06, F-13, F-18); colour never the only carrier of status; `prefers-reduced-motion` honoured. Baseline: axe 0 violations on 27 page×actor checks (Phase 01) — must not regress.

## 11. Responsive requirements
Breakpoints checked at 320/360/390/430/768/1024/1280/1440. Candidate surfaces mobile-first; internal surfaces desktop-first with a 390 px floor: no overlap, no page-level horizontal scroll, primary read flows usable, dense tables may become cards with a path to detail (DL-18, RR-01, RR-02).

## 12. Technical constraints
React + Vite SPA, Tailwind, hand-rolled primitives today (no Radix; Phase 00). Motion in CSS/WAAPI only — GSAP/Three.js decided against. Fonts self-hosted with full Vietnamese coverage. Prerendered public pages (F-02). Entry pages LCP ≤2.5 s mobile (RR-14, F-24). **No dark mode** in this redesign; semantic tokens kept clean enough to add it later [D-09].

## 13. Content & language requirements [D-09]
- UI language Vietnamese; terminology from GLOSSARY verbatim, including Avoid lists and the scope column (public / internal) — table finalized in GLOSSARY "Thuật ngữ giao diện".
- "Offer" stays English (DL-08); HIRED = "Đã nhận việc".
- Internal surfaces say "Tin tuyển dụng" (counted "tin"); public says "Việc làm" (counted "vị trí") (DL-11).
- Hồ sơ ứng tuyển is the working unit; Ứng viên is the person (DL-09).
- Tone: candidate-facing copy is warm and plain ("bạn"); internal copy is terse and task-verb led (F-21).
