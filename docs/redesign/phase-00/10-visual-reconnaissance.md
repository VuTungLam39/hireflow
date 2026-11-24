# 10 — Visual Reconnaissance

> Phase 00 · Workstream H. Public surface RV (screenshots in `screenshots/guest/`); tokens SV (`fe/src/index.css`); signed-in surface BLK. Descriptive only — no redesign judgement (that is Phase 01).

## 1. Current design language (Design Spec v1.0, SV + RV)

| Aspect | Current |
|---|---|
| Typography | Display `Bricolage Grotesque` (large h1, tight), body `Be Vietnam Pro` |
| Palette | Warm neutrals: canvas `#f7f6f2`, surface `#fff`, sunken `#efece5`, ink `#1c1b18` → faint `#8f8a7f`; brand deep green `#1e5b4f`; highlighter "marker" yellow `#fce98a` (used for evidence/CV highlighting and the brand mark); status good/warn/bad/info + soft tints; six "earth" tints (moss, clay, sand, stone, plum, sea) with ink pairs; dark "rail" palette for the internal sidebar |
| Radius | 2 / 6 / 4 (inset) / 10 px; `md…2xl` all 10 px; sheet 16 px |
| Elevation | one shadow token `--shadow-float` |
| Breakpoints | sm 40rem, md 48rem, lg 64rem, xl 80rem |
| Motion easing | `--ease-standard: cubic-bezier(0.2,0,0,1)` |
| CI guard | `npm run check:design` forbids raw colors, gradients, page animations, "AI wording" |

## 2. Public pages (RV)

- Centered content column ~928 px at 1440 viewport; lots of whitespace; list rows separated by hairlines; arrows on row right.
- Persistent demo banner ("Bản demo thực tập…") on every public page.
- Job rows: logo tile, title, company · city · posted age, salary · level · mode, deadline badge ("Còn 2 ngày" in warn colour).
- Company filter as chips with counts; secondary filters as dropdown buttons.
- Job detail: two columns (content + sticky-looking apply card) at desktop; key facts in a bordered grid.
- Login: split layout with illustrative CV excerpt showing numbered evidence lines and a "Mức phù hợp 78/100 · 5 tiêu chí" card.

## 3. Screenshot index (`screenshots/guest/`, 38 files)

Pattern `<CR>--<state>--<viewport>.png`; states `default`, `loading`, `error`, `empty-mocked` (jobs, companies only), plus `protected-route-as-guest--permission-denied--{1440,390}.png`. Routes: CR-01, CR-02, CR-03, CR-04, CR-05, CR-13. Caveat: on prerendered routes, `loading`/`error` captures show prerendered content (see file 09 §1). Folders for hr/hiring-manager/interviewer/admin are empty — **BLK**.

## 4. Internal app (RV 2026-11-24)

- **Shell:** dark left rail (brand, groups "Công việc" / "Quản trị" / "Quản trị sàn", active item with yellow marker bar, count badge), company name + "Trang tuyển dụng" link pinned at rail bottom; light topbar with breadcrumb, "Tìm ứng viên Ctrl K" (platform: "Tìm trang"), notification bell with red count, user chip (initials, name, role label). Content sits on a rounded white sheet over the canvas ("framed sheet").
- **Dashboard:** large display heading as a sentence ("5 hồ sơ chờ bạn xem"), date at right, task list rows with "Xem →", 4-cell KPI strip, funnel bars.
- **Application detail / CV review:** two panes — fit score (large number "/100", segmented bar) with criterion cards (match dot, verbatim quote on marker-yellow, "Xem trong CV ↘") and the CV "sheet" with numbered highlight marks.
- **Ranking:** weight sliders card, compact table with criterion dots and score bars, side "vì sao" panel (dashed empty prompt).
- **Mobile 390:** rail collapses to a hamburger; list rows become cards with avatar, status and score; filters wrap.
- Screenshots: `hr/` (CR-06…CR-11 default 1440/390; loading/error 1440; empty-filter; users forbidden), `hiring-manager/` (CR-06/07/08/09/10, forbidden, out-of-scope), `admin/` (dashboard, platform forbidden), `platform-admin/` (CR-12 1440/390, applications forbidden). `interviewer/` empty — BLK.
