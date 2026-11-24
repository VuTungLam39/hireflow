# 04 — Information Architecture, Role-based UX and Trust & Security UX (dimensions A, G, L)

> Evidence: Phase 00 files 03/05 (route inventory, 70/70 role×route matrix), Phase 01 runtime checks, ADR-0002.

## A — Information architecture (RV)

- Internal nav is role-filtered and short: HR 6+1 items, HM 6, Interviewer 3 (Tin tuyển dụng, Hồ sơ ứng tuyển, Lịch phỏng vấn), platform_admin 2. Landing per role: `/` (Admin/HR/HM), `/interviews` (Interviewer), `/platform/companies` (platform) — sensible.
- Detail is reachable three ways (route, `?xem=` quick view, command palette) — powerful but creates the quick-view vs review-page split (F-07, file 06).
- Public IA: Việc làm / Công ty / Nhà tuyển dụng / Đăng nhập — clear, but broken on phones (F-01).

## G — Role-based UX (RV)

- Interviewer surface is focused: list of assigned hồ sơ with "Phiếu của bạn" status (Đã gửi / Cần gửi phiếu); "Lịch phỏng vấn" groups "Cần xử lý" — good role fit.
- Forbidden pages are consistent ("Trang này không thuộc quyền của bạn" inside the shell).

## L — Trust & security UX (experience only; ADR-0002 two-case rule)

| Case | Observed | Verdict |
|---|---|---|
| Out-of-scope record (HM other department; Interviewer unassigned) | "Chưa mở được hồ sơ — Không tìm thấy dữ liệu" + reference code | Conforms (not found) |
| Route-level missing permission | ForbiddenPage | Conforms (in-scope action denial) |
| Action-level permission inside a visible record (e.g. Interviewer on an application) | decision buttons not rendered (SV `Can`/`usePermission`) | Conforms (no misleading "not found") |
| Destructive actions | "Từ chối hồ sơ" opens ConfirmDialog with reason code (SV StatusActions.tsx:126-166) | Conforms; critique A's P1 "adjacent destructive action" downgraded — mis-click is caught by the confirm step |

→ P01-13 and P01-18: **no finding** (rule satisfied).

## Findings

```text
Finding ID: F-10
Title: Guests hitting an unknown URL are sent to /login instead of a 404
Category: Information architecture · Trust UX
Route: any unknown path (e.g. /khong-ton-tai), also mistyped public links
Actor: Guest / Candidate
UI State: not-found
Viewport: all
Problem: the catch-all route lives inside the protected branch, so guests get the staff login screen.
Reproduction Steps: open https://hireflow-gray-zeta.vercel.app/khong-ton-tai while signed out.
Evidence: Phase 00 RV probe (redirect to /login); router.tsx `*` inside ProtectedRoute (SV).
Source Location: fe/src/routes/router.tsx (catch-all inside ProtectedRoute → MainLayout)
Expected Behavior: public 404 with links to Việc làm / Công ty.
Actual Behavior: staff login page ("Mỗi quyết định tuyển dụng…").
User Impact: candidates following a stale/mistyped link land on a login they cannot use. Business Impact: lost candidate traffic; SEO soft-404.
Severity: P2 · Frequency: every unknown URL from guests · Root Cause Confidence: High
Recommendation: add a public catch-all (or route guard that distinguishes guest vs staff paths).
Implementation Effort: S · Dependencies: none (slice H)
Accessibility Impact: none · Responsive Impact: none · Performance Impact: none
Acceptance Criteria: signed-out GET of an unknown path renders a public 404 (HTTP 200 SPA acceptable) with public navigation.
```

```text
Finding ID: F-12
Title: Hiring Manager dashboard shows three different "my work" counts
Category: Role-based UX · Feedback
Route: CR-06 /
Actor: Hiring Manager
UI State: default
Viewport: 1440
Problem: headline "2 hồ sơ chờ bạn xem", section "Cần làm 3", sidebar badge "2".
Reproduction Steps: sign in as HM → /.
Evidence: phase-00/screenshots/hiring-manager/CR-06-dashboard--default--1440.png (headline + "Cần làm" count); sidebar badge 2 in phase-00 HM screenshots; impeccable critique A (P2). HR shows 5/5/5 (consistent).
Source Location: fe/src/features/dashboard/pages/DashboardPage.tsx (headline vs task list sources)
Expected Behavior: one definition of "pending for me", or each number labelled with what it counts.
Actual Behavior: different counters with no explanation.
User Impact: HM cannot tell whether work is done. Business Impact: trust in the dashboard.
Severity: P2 · Frequency: HM every visit when tasks ≠ pending applications · Root Cause Confidence: Medium (headline counts applications; "Cần làm" counts tasks incl. offers — inferred from copy)
Recommendation: align counters or label them ("2 hồ sơ · 1 offer chờ duyệt").
Implementation Effort: S · Dependencies: none
Accessibility Impact: none · Responsive Impact: none · Performance Impact: none
Acceptance Criteria: headline, "Cần làm" and badge either match or state distinct units.
```
