# 02 — Critical Workflow Prototypes

All prototypes: `prototypes/`, built from `tokens.css` = `designmd export --format css-tailwind fe/DESIGN.md` (@google/design.md 0.4.0, `@theme` → `:root` for plain browsers) + `proto.css`/`proto.js`. Labelled on every page "internally validated only · không phải sản phẩm". Behaviour the contracts assign to Radix is simulated (native `<dialog>` for focus trap/Escape + focus return; Tabs arrows/Home/End; J/K rows). Fonts load from Google Fonts (prototype only). Each page has a state switcher (`?state=`).

| ID | File | Workflow | Fidelity | States covered |
|---|---|---|---|---|
| P1 | `p1-cv-review.html` | CV Review: Mức phù hợp → criteria ↔ Căn cứ (two-way) → Có căn cứ bị loại → Phiếu đánh giá summary → Chuyển trạng thái (Từ chối needs reason) → confirmation | high | ready, loading (sr h1), not-found (ADR-0002 one design), permission-denied (in scope), Đang đọc CV, Không đọc được CV, submit error (dialog stays, retry) |
| P2 | `p2-ranking.html` | Xếp hạng hồ sơ: tabs → Trọng số → live re-order → expand row quotes → open hồ sơ | high (dots/weights), mid (layout) | ready, loading, empty, stale (criteria changed, rescoring) |
| P3 | `p3-pipeline.html` | 64 hồ sơ: search → Bộ lọc (n) → quick-view Sheet (read-only, DL-16) → Mở chi tiết; bulk Sàng lọc/Phỏng vấn/Từ chối (reason) with result summary | mid | ready, loading, error + retry, stale notice, empty filter result, bulk partial failure (Offer not moved) |
| P4 | `p4-public.html` | /jobs (390 first) → Bộ lọc → company page / job → Ứng tuyển (validation) → success with tracking promise → tracking (public labels) | mid | ready, stale, expired job ≤30 days (apply disabled, other jobs), invalid tracking link, public 404 |
| P5 | `p5-evaluation.html` | Phiếu đánh giá: criteria ratings + nhận xét + đề xuất → submit (irreversible notice) | mid | ready, loading, not-found (not assigned), submitted (read-only), save error (content kept) |

## Browser verification (Phase 03 file 07 rules)
Script `prototypes/checks/check-renders.cjs` (Playwright-core via global `@playwright/cli`, Chromium): every prototype × every state/view × 1440/1024/768/390 = **112 renders**. Checks: R1 page `scrollWidth ≤ innerWidth`; R2 no overlapping header links/buttons/badges/h1; exactly one visible h1; table vs container width (T1–T4); zero console/page errors. Results: `checks/render-results.json`; screenshots at 1440 and 390: `checks/*.png` (56).

**First run: 15 failures → fixed → final run 112/112 pass.**
| Defect found by the check | Fix |
|---|---|
| Loading states had no h1 (P1, P5) | visually hidden h1 "Đang tải …" + `aria-busy` |
| P3 bulk bar visible while empty — CSS `display:flex` overrode `[hidden]`, overlapping table badges | global `[hidden]{display:none!important}` |
| P4 apply form 427 px wide at 390 (file input intrinsic width) | file input `width:100%`, label wrapping |
Tables at every width fit their container exactly: ranking and applications 1190/1190 · 918/918 (1024, F-03) · 662/662 · cards at 390.

## Interaction verification
Script `checks/check-flows.cjs` runs each scenario's happy path + error-recovery path at 1440 and 390 (20 flows) and counts actions; results `checks/flow-results.json`. **Final: 20/20 pass** after two defects were fixed:
| Defect | Fix |
|---|---|
| P3 at 390: in card mode the checkbox cell covered the candidate name, so tapping the name selected the row instead of opening it | checkbox cell fixed to a 44 px box at the card's top-right; name cell padded |
| P5: visually hidden radio inputs sat outside their labels (no positioned parent) | label `position:relative`, input `inset:0` |
Keyboard: ranking J then x expands the row ✔ · Tabs Home → first tab ✔ · criterion Enter → focus on its `<mark>` ✔, Escape → back to criterion ✔ · dialog Escape → focus returns to "Chuyển trạng thái" ✔.
