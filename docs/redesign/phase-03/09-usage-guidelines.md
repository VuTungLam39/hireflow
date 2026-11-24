# 09 — Usage Guidelines & Migration Strategy

## Terminology
- Labels come only from GLOSSARY "Thuật ngữ giao diện"; Phase 05 creates one label module mirroring that table, and components read from it.
- Respect the scope column: public surfaces never show Offer; tracking page uses the public stage labels.
- Job noun from surface context (DL-11): internal "Tin tuyển dụng"/"tin", public "Việc làm"/"vị trí".
- Avoid list enforced by a grep check in CI (Phase 05): "Đề nghị", "Đã nhận" (as status), "điểm AI", "bằng chứng", "Xếp hạng ứng viên", lowercase "offer" in UI strings.
- Copy tone: public warm, "bạn"; internal terse, verb-first.

## The five edge states
| State | Component | Copy | Rule |
|---|---|---|---|
| Not found | ErrorState `notFound` | internal "Không tìm thấy {hồ sơ/tin tuyển dụng/ứng viên} này" + back to list; public "Không tìm thấy trang này" | identical for never-existed and out-of-scope (ADR-0002); guests never redirected to /login (RR-11) |
| Empty | EmptyState | reason + one action ("Chưa có hồ sơ nào cho tin này" · "Chia sẻ link việc làm") | explain why zero (F-21) |
| Expired job (public, ≤30 days) | Inline Alert + disabled apply | "Việc làm này đã hết hạn" + links to company's open jobs | removed from lists immediately; after 30 days → public not-found (DL-17) |
| Stale data | StaleNotice | "Dữ liệu lúc {giờ} · Tải lại" | shown when live refresh fails over prerendered/cached data (RR-10, F-02) |
| Error | ErrorState | what failed + "Thử lại" | within 1 s of first failure (F-08) |
Permission-denied (in scope, missing action permission): Inline Alert "Bạn không có quyền thực hiện thao tác này" — the only case allowed to differ from not-found.

## Migration strategy (no big-bang)
1. **Slice 0 — Foundations:** generate theme CSS from `fe/DESIGN.md` (`designmd export --format css-tailwind`) into the Tailwind v4 theme; add self-hosted fonts; add the terminology label module and the Avoid-list grep check. Old tokens keep working (aliases) so nothing breaks.
2. **Primitives by area, behind house components:** each slice replaces one primitive family and migrates its call sites — Button/IconButton → Dialog/AlertDialog/Sheet (first Radix slice measures the bundle; >40 KB gzip on an entry route pauses adoption) → Tabs → Popover/Dropdown/Tooltip → rich Select → Combobox → Command Menu.
3. **Surfaces by workflow:** public shell + job list/detail (F-01, F-02, F-04, DL-17) → applications list on DataTable (F-03) → application detail with CV Review Panel (after R3 lands, per security gate) → ranking → dashboard → interviews/Phiếu đánh giá → Offer → admin/platform.
4. **Strangler rule:** a page is migrated whole within its slice; old and new components may coexist across pages but never within one page. Each slice deletes the old implementation it replaced when its last call site moves.
5. **Gates per slice:** axe 0 violations on touched pages, keyboard tests for introduced primitives, responsive checks R1–R4 at the 8 widths, `designmd lint` still passing if DESIGN.md changed, impeccable hook clean (concept suppressions do not apply to product files).
6. Security-dependent slices (tenant boundary, CV pipeline, scoring) start only after the Security Gate re-check passes (R1–R3).
