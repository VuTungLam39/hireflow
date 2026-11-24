# HireFlow — Impeccable critique, Assessment A (Design Review)

Scope: 6 targets. Evidence tags: **[live]** = screenshots I captured 2026-11-24 from hireflow-gray-zeta.vercel.app (saved in this folder as `jobs-*.png`, `companies-*.png`, `vi-may-*.png`, 1440x900 and 390x844 viewports, top of page only); **[shot]** = phase-00 screenshots; **[src]** = `hf-main/fe/src` (main checkout). No detector output was consulted.

Heuristic key: H1 status, H2 real-world match, H3 control/freedom, H4 consistency, H5 error prevention, H6 recognition, H7 flexibility/efficiency, H8 aesthetic/minimal, H9 error recovery, H10 help/docs.

---

## 1. Public job list `/jobs`

**Design specificity:** Medium-low. Clean editorial job list in Bricolage + Be Vietnam Pro with company logo tiles [live jobs-1440]. Nothing in it carries the product's differentiator (explainable fit / "căn cứ"); swap the copy and it could be any job board. The demo disclaimer is honest and product-specific, but it is also the first thing you see.

| H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| 3 | 4 | 3 | 3 | n/a | 3 | 2 | 3 | n/a | 2 | 23/32 (72%, Good) |

H5/H9: no destructive actions or forms here (filters only).

**Cognitive load:** The filter block has 3 tiers stacked: 2 search fields, a company chip row (4 chips, wraps to 2 lines at 1440 and 3 at 390), and 3 dropdowns [live]. That makes 9 controls before the first result. At 390 the first job title sits at about y=780 of 844 [live jobs-390]. The company chip row grows with every company on the marketplace, so the >4-options problem gets worse as the market grows.

**Emotional journey:** Starts on a warning (demo banner), then a big generic H1, then a wall of filters, and the results only start after that. The peak (finding a job) is pushed below the fold on mobile. There is no reassurance moment that explains HireFlow's "you'll be read fairly, with reasons" promise, which is the candidate-side payoff of the differentiator.

**Strengths**
- Strong type hierarchy: job title, then company · city · relative age, then terms · level · mode, scannable in 3 lines [live jobs-1440].
- The result count "13 vị trí đang tuyển" gives clear status [live].
- Counts on the company chips ("HireFlow 9") let users judge a chip before clicking it.

**Priority issues**
- **[P1] Public header nav overlaps at 390px.** What: "Công ty" and "Nhà tuyển dụng" render on top of each other ("CôngNhà tuyển dụng") [live jobs-390, vi-may-390]. Why: the primary navigation is unreadable and its tap targets collide on the most common candidate device, on every public page. Fix: at <sm, collapse the right cluster ("Nhà tuyển dụng" into a menu, or keep only "Đăng nhập"), or let the left nav shrink. `shrink-0` on the right cluster plus non-shrinking NavLinks causes the overflow [src app/layouts/PublicLayout.tsx:25-52].
- **[P2] Filters bury the results on mobile.** What: 9 controls come before the first job at 390 [live jobs-390]. Fix: on mobile keep only the keyword search visible and move company/level/type/mode into one "Bộ lọc (n)" sheet, the same pattern the ranking page already uses for weights [src JobRankingPage.tsx:185-186].
- **[P2] The company chip row does not scale.** What: one chip per company, wrapping onto new lines [live]. Fix: use a combobox or "Công ty" dropdown like the other 3 filters. This also makes the filter types consistent (H4).
- **[P3] The demo banner takes the hero slot on every public page.** Fix: make it a thinner one-line strip above the header, or dismissible per session. Keep the wording.

**Persona red flags**
- *Casey (distracted mobile):* broken header, then a 4-line banner, then 9 filters, and no job visible on the first screen.
- *Jordan (first-timer):* "Hình thức" vs "Làm việc" dropdowns are ambiguous (employment type vs work mode?) until opened [live].
- *Sam (a11y):* the header overlap creates overlapping hit areas, and it may also break at 200% zoom.

**Minor:** The location field reuses the search (magnifier) icon; a pin would read better. The "Mọi công ty" selected chip uses a pale mint fill with low contrast against the white chips.

---

## 2. `/companies`

**Design specificity:** Low. A 3-up card grid with logo, name, tagline and "n vị trí đang tuyển" [live companies-1440]. This is generic directory UI.

| H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| 3 | 4 | 3 | 3 | n/a | 3 | 2 | 3 | n/a | 2 | 23/32 (72%, Good) |

**Cognitive load:** Low: 1 search field plus N cards. No checklist failures at the current data size.

**Emotional journey:** Neutral and calm, with no peak. The page states its purpose ("Tìm hiểu nơi bạn sẽ làm việc...") but gives very little to learn from (one tagline).

**Strengths**
- Very low load. Each card has one clear action, and "9 vị trí đang tuyển" serves as both status and CTA.
- Consistent shell, banner and typography with /jobs (H4).

**Priority issues**
- **[P2] Inconsistent card anatomy.** What: the HireFlow card shows an industry line ("Phần mềm, Nhân sự, Trí tuệ n…", truncated) and the others don't, so names sit at different heights [live companies-1440]. Fix: reserve the industry row always (placeholder or omit consistently) and allow 2-line wrap instead of an ellipsis.
- **[P2] Cards carry almost no decision information.** Fix: add city/size/industry as a meta line and the newest 1–2 open roles. Cards with nothing to compare make this page feel like an extra click on the way to /jobs.
- **[P3] Large dead area below the grid at 1440** [live]. It is fine at 3 companies but looks unfinished. A short employer CTA ("Đăng tin trên HireFlow") would fill the space with purpose.

**Persona red flags**
- *Alex (power user):* no sort or filter by industry/city, only a name search.
- *Riley (stress tester):* long legal names ("Công ty TNHH ...") already near-fill the card header; the industry row truncates [live].

**Minor:** No hover/press affordance was visible in the static capture (not verified interactively).

---

## 3. `/companies/:slug` (CareersPage, `vi-may`)

**Design specificity:** Medium-low. Logo, H1, tagline, a facts strip, "Giới thiệu" and a role list [live vi-may-1440]. Generic careers template.

| H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| 3 | 4 | 2 | 3 | n/a | 3 | 2 | 2 | n/a | 2 | 21/32 (66%, Acceptable) |

H3=2: no breadcrumb or back to /companies on desktop, only the header nav [live].

**Cognitive load:** Low.

**Emotional journey:** A good brand moment at the top (large logo + name). It then deflates: a mostly empty facts box, a one-sentence intro, and role rows rendered smaller and plainer than on /jobs.

**Strengths**
- Clear identity header; logo and name pair well [live].
- Role rows show department · city, which suits a single-company view.

**Priority issues**
- **[P1] The facts strip renders as an empty box.** What: the grid is 4 columns (2 on mobile), but only "Đang tuyển: 2 vị trí" is filled. The rest is a bordered void [live vi-may-1440 and -390; src CareersPage.tsx:165, 203]. Why: it reads as broken or missing data on a public brand page. Fix: render only filled facts, sized to their content, with no fixed column grid. Or drop the strip when it has fewer than 2 facts.
- **[P2] Role rows are inconsistent with /jobs.** What: on /jobs titles are ~18px display with a logo and 3 meta lines. Here they are ~14px bold with 1 meta line [live jobs-1440 vs vi-may-1440]. Fix: reuse the /jobs row component (minus the logo) so a job looks the same everywhere (H4).
- **[P2] No wayfinding back to the company list.** Fix: add a breadcrumb "Công ty / Ví Mây" as on signed-in pages, or a back link as on the mobile ranking page.
- **[P3] Section headings (H2 ~28px) compete with the H1.** "Giới thiệu" and "Vị trí đang tuyển" are nearly as heavy as the company name [live]. Step them down.

**Persona red flags**
- *Jordan:* the empty box suggests missing info, and they may distrust the company.
- *Casey:* at 390 the logo, then H1, then facts box push the roles below the fold [live vi-may-390].

**Minor:** The intro copy shows "(dữ liệu demo)", which is fine but repeats the banner.

---

## 4. Ranking page (JobRankingPage)

**Design specificity:** High in concept, medium in execution. Weight sliders per criterion, criteria dots per candidate, and a "Bấm một dòng để xem vì sao" explanation panel [shot CR-10-1440]. This is genuinely the product's differentiator: an explainable rank with adjustable weights. The visual form (generic slider plus generic table) does little to show *why*, until a user clicks.

| H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| 3 | 3 | 3 | 3 | 3 | 2 | 3 | 3 | n/a | 3 | 26/36 (72%, Good) |

H5=3: Save/Reset are disabled until the weights are dirty [src JobRankingPage.tsx:335-339]. H6=2: the criteria dots have no legend or labels (see issue).

**Cognitive load:** The weight block shows N sliders (3 here, but one per requirement, so 5+ is likely). There is no explanation of what changing a weight does to rank until the user tries it. The subtitle "1 ít quan trọng, 3 rất quan trọng" helps. Checklist failure: memory bridge, because the user must remember which dot is which criterion.

**Emotional journey:** The empty right panel invites curiosity (good). The peak, the "why" with quoted evidence, depends on a click and is absent on mobile. With 1 candidate the page feels empty; it is unclear whether more are coming or still being scored.

**Strengths**
- The explanation panel is framed as the hero action ("Bấm một dòng để xem vì sao – kèm câu trích làm căn cứ") [shot CR-10-1440].
- Rank-change deltas have accessible labels and keyboard row selection [src RankingRow.tsx:24-28, 55-64].
- Mobile collapses the weights into a "Trọng số (3)" button: a good progressive-disclosure pattern [shot CR-10-390; src :185-186].

**Priority issues**
- **[P1] Criteria dots are unlabeled.** What: "●●○" in the Tiêu chí column has no per-dot label or legend; the column is also hidden below sm [shot CR-10-1440; src RankingRow.tsx:94-96]. Why: this is the at-a-glance form of the differentiator, and users can't read it without a hover or memorising the slider order. Fix: number the dots to match the numbered criteria (the sliders are already numbered 1/2/3), add tooltips/aria per dot, and show a compact version on mobile.
- **[P1] The "why" is unreachable or unclear on mobile.** What: at 390 only the rank, name, status and score show, with no hint that tapping explains anything [shot CR-10-390]. Fix: on mobile, open the explanation as a sheet on row tap and say so ("Chạm để xem vì sao").
- **[P2] Score bars are tiny and redundant.** What: a ~24px mini bar next to "83" adds no information over the number [shot]. Fix: drop it, or make it a real comparative bar spanning the column.
- **[P2] The weight-to-rank effect is invisible until saved/changed.** Fix: preview re-rank live while dragging (the deltas exist already) and label it "Xem trước – chưa lưu".
- **[P3] "1 hồ sơ đã chấm" doesn't say how many are pending scoring.** Add "· 2 đang chấm".

**Persona red flags**
- *Alex:* no keyboard shortcuts across rows visible; compare is limited to 3 [src :437] with no explanation shown until hitting it.
- *Sam:* the slider has an aria-label only from the requirement label [src WeightSlider.tsx:45]; the value meaning (1–3 importance) may not be announced.
- *HR recruiter (project persona):* "bắt buộc" sits in small gold text next to criterion 1 and is easy to miss, though it drives the MISSING_MUST flag.

**Minor:** Top-right "Xem dạng bảng hồ sơ" is the only outlined button, and its relationship to this view is unclear.

---

## 5. CV review `/applications/:id`

**Design specificity:** High. This is the strongest screen. Criteria list with verbatim quotes highlighted in "dạ quang" yellow, numbered markers that map to the same numbers in the CV sheet, "Xem trong CV ↘" jump links, and the line "bạn là người quyết định" [shot CR-09-detail-1440]. It cannot be mistaken for another product.

| H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| 3 | 4 | 3 | 3 | 2 | 4 | 3 | 3 | 3 | 3 | 31/40 (78%, Good) |

H5=2: see the reject placement issue. H9 is scored from source patterns, not observed errors.

**Cognitive load:** Header action row: 3 actions plus an overflow (fine). The dialog variant has 5 tabs (Mức phù hợp / CV / Ghi chú / Phỏng vấn / Lịch sử), which is just over the 4-option threshold but conventional [shot CR-09-dialog]. The criteria list is long; with 5+ criteria, the CV side needs scrolling back and forth. The numbered markers keep that memory bridge small (good).

**Emotional journey:** The peak is "100/100 phù hợp" with evidence (good). High-stakes moment: "Từ chối hồ sơ" sits in red text right next to the primary CTA, with no visible reassurance about what happens next (email to candidate? reversible?). That is the risky valley.

**Strengths**
- Evidence-first: each match quotes the CV, highlights the same text in the sheet, and links to it. This is the differentiator made visible [shot CR-09-detail-1440].
- On mobile, a sticky bottom bar holds the one primary action and the rest goes in "…" [shot CR-09-detail-390].
- The dialog lets HR triage from the list without losing context, with a clear "Mở bản duyệt CV" escalation [shot CR-09-dialog].

**Priority issues**
- **[P1] Destructive action sits next to the primary action.** What: "Từ chối hồ sơ" (red text button) sits beside "Chuyển sang Sàng lọc" in the same row [shot CR-09-detail-1440]. Why: mis-click risk on an action that may notify the candidate. Fix: move reject into the overflow or space it apart, and require a reason step (the reason codes exist per S5 seed) before committing.
- **[P2] The meaning of the score bar segments is unclear.** What: the 5 segments are proportional to weights but unlabeled; at 100 all are green, so they convey nothing [shot]. Fix: label segments with criterion numbers, and show unmatched segments as empty or hatched.
- **[P2] The CV sheet doesn't show the evidence for unmatched criteria.** For "Không khớp", show "không tìm thấy căn cứ" explicitly so absence is also explained (verify; not visible in captures).
- **[P2] Contact PII sits inline in the subtitle line** (email · phone run together), forming a long, low-scannable meta line that wraps to 3 lines at 390 [shot CR-09-detail-390]. Fix: split it into a meta line and a contact line with copy buttons.
- **[P3] The yellow highlight plus gold "bắt buộc" plus the yellow active nav marker overload one accent hue.** Reserve the highlighter yellow for evidence only.

**Persona red flags**
- *HR recruiter:* the evidence quote is easy to trust; they need the same view for a *missed* criterion.
- *Sam:* relies on yellow highlight + numerals; check that the highlight is announced (mark element?) — not verified.
- *Casey:* the CV sheet is far down the page on mobile, so jump links ("Xem trong CV ↘") matter. Good.

**Minor:** The "dạ quang = căn cứ cho tiêu chí" legend is in tiny gray text at the top-right of the sheet; it deserves to sit by the criteria list.

---

## 6. Dashboard `/` (HR and Hiring Manager)

**Design specificity:** Medium-high. The headline is the task count ("5 hồ sơ chờ bạn xem"), followed by an action list worded in domain terms (e.g. "2 hồ sơ mới từ 70 điểm chưa xem", "1 CV không đọc được – thường là ảnh scan") [shot CR-06 hr-1440]. The KPI strip and funnel below are generic SaaS.

| H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| 4 | 4 | n/a | 3 | n/a | 4 | 3 | 3 | n/a | 3 | 24/28 (86%, Good) |

H3/H5/H9: read-and-route surface with no destructive actions.

**Cognitive load:** "Cần làm" has 5 rows (>4) but each is one decision with one CTA; acceptable. The KPI strip has 4 tiles; "0 bằng tuần trước" and "0 CV đang đọc" are noise at zero.

**Emotional journey:** Strong opening (one number, one job). It ends in a funnel that is analytic, not actionable — a flat finish for the peak-end rule.

**Strengths**
- Headline equals workload, and items explain *why* they're grouped ("Điểm dưới 70 hoặc chưa chấm xong").
- The HM variant is properly scoped ("Số liệu của Phát triển phần mềm") and orders the offer awaiting reply first [shot hiring-manager CR-06].
- The funnel annotates dwell time and drop reasons per step ("thường 4,2 ngày ở bước").

**Priority issues**
- **[P2] The "Cần làm" count and headline diverge.** HR: headline 5, list 5 OK. HM: headline "2 hồ sơ chờ bạn xem", but "Cần làm 3" and the nav badge 2 [shot HM]. Why: three numbers for "my work" erode trust. Fix: the headline counts the to-do total, or label it explicitly.
- **[P2] All rows share the same "Xem →" CTA.** Verbs differ only for "Xử lý". Fix: verb per row ("Duyệt", "Quyết định", "Đóng tin") so each row reads as a task.
- **[P2] Zero-state KPIs render as big "0" numbers** ("Hồ sơ tuần này 0", "Đã nhận việc 0") with weak subtext [shot]. Fix: de-emphasise zeros, or replace with context ("Chưa có hồ sơ tuần này · 3 tuần trước: 4").
- **[P3] The funnel bars are long and thin with large label gaps; at 1440 the data sits far right of the bars.** Tighten the column.

**Persona red flags**
- *Hiring Manager:* expects "what needs my decision" first; offers come first (good), but debrief/approval items are mixed in with HR-ish counts.
- *Casey:* the 390 screenshot was not reviewed in detail beyond confirming it stacks (low-effort pass).
- *Alex:* no keyboard path between to-do rows noted.

**Minor:** The date "Thứ Ba, 24/11/2026" is right-aligned far from the headline; fine.

---

## Cross-target synthesis

1. **The differentiator lives only behind sign-in.** CV review (31/40) and the dashboard show HireFlow's evidence-first identity. The public surfaces (/jobs, /companies, careers; 66–72%) are generic job-board templates that never mention the explainable fit. Candidates, half the marketplace, never see the promise "you'll be read with reasons".
2. **Mobile public shell is broken.** The header nav overlap is the single most visible defect and hits all 3 public targets (P1).
3. **Evidence visualisations are unlabeled.** Ranking dots, the score bar segments and the mini score bars all use symbols without legends; the quote-highlight system on CV review is the model to copy (numbered markers that map 1:1).
4. **Mobile keeps the "what", drops the "why".** Ranking at 390 hides criteria and the explanation path; the fix pattern (sheet + explicit "chạm để xem vì sao") already exists for weights.
5. **Consistency drift on public pages:** job rows differ between /jobs and careers, card anatomy differs across companies, and the filter types are mixed (chips vs dropdowns).
6. **High-stakes reassurance is thin:** reject sits beside advance on CV review without visible consequence copy.

Questions to consider: Should the public job row show what HireFlow will check ("Tiêu chí: NestJS, PostgreSQL…") to carry the differentiator to candidates? Does the ranking need a table at all on mobile, or a card list with the reason inline?
