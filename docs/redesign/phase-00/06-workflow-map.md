# 06 — Workflow Map

> Phase 00 · Workstream E · 2026-11-24. **Read-only rule:** every step that would write production data (submit, status change, publish, approve, send) was observed up to the control and **not executed**. Steps are labelled RV (observed live), SV (source), BLK.

## W-01 Candidate — find a job and apply (guest actor)

| Field | Detail |
|---|---|
| Entry | `/jobs`, `/companies` → `/companies/:slug` (RV) |
| Actor | Candidate (guest) |
| Preconditions | none; demo banner warns not to submit real CVs (RV) |
| Main path | filter (keyword, location, company chips, level/type/mode) → paginate 12/page → `/jobs/:id` → form: Họ tên, Email, Số điện thoại, CV (PDF/DOCX < 5 MB), consent linking `/chinh-sach-du-lieu` → submit (RV up to submit; **submit not executed**) |
| Alternative | company page → job; `/careers` → demo company (RV) |
| Failure | validation, file type/size, rate limit 30/h/IP (DO, decision 14/11), API down — not exercised |
| Permission boundary | public |
| Retry / recovery | resubmit; draft persistence UNK |
| Completion | confirmation + tracking email (DO/SV) |

## W-02 Candidate — track application by token

`/applications/track?token=` ; invalid/missing → "Link không còn hiệu lực" (RV). Valid-token view: UNK (needs a real application).

## W-03 Employer — self-registration

`/employers/register` (RV form) → `/employers/check-email` (RV) → `/verify-email` (invalid → "Link không còn hiệu lực", RV) → platform_admin approves in "Chờ duyệt" tab (RV tab exists, currently empty) → company ACTIVE. Rejected/suspended company → its users get `ORG_DISABLED` at login (RV).

## W-10 HR — daily triage ("Hôm nay")  ·  RV

| Field | Detail |
|---|---|
| Entry | login → `/` |
| Main path | heading "N hồ sơ chờ bạn xem"; "Cần làm" task list with deep links (e.g. "2 hồ sơ mới từ 70 điểm chưa xem", "1 buổi phỏng vấn đã có phiếu, chờ quyết định", "4 tin đã hết hạn nộp nhưng chưa đóng", "1 CV không đọc được"); KPI strip (Hồ sơ tuần này, Đang phỏng vấn, Đã nhận việc, Mức phù hợp trung bình); "Phễu tuyển dụng" with 30/90 ngày/12 tháng range |
| Completion | user follows a task link |

## W-12 HR — review applications and CV (task T1/T2)  ·  RV up to decision

| Field | Detail |
|---|---|
| Entry | `/applications` or a dashboard task |
| Preconditions | `application:read`; data scope all (HR) |
| Main path | list with tabs (Tất cả, Chờ xem, Điểm cao, Thiếu tiêu chí…), search, filters (Tin, Trạng thái, Mức phù hợp, Ngày nộp), density (Thoáng/Gọn), row checkboxes, "Xuất CSV", "Tải CV hộ" → open row → `/applications/:id` (or `?xem=application:id` dialog) → **CV review**: left "Mức phù hợp 100/100" with per-criterion match + verbatim quote + "Xem trong CV"; right the CV text with numbered highlighter marks ("dạ quang = căn cứ cho tiêu chí") |
| Decision controls (not executed) | "Ghi nhận ứng viên rút", "Từ chối hồ sơ", "Chuyển sang Sàng lọc →" |
| Failure | API error → skeleton persists while queries retry (2 retries on 5xx), then error state; unknown id → "Chưa mở được hồ sơ / Không tìm thấy dữ liệu" + reference code |
| Permission boundary | out-of-scope application → same not-found message (no leak) |
| Completion | status transition (SV: NEW→SCREENING→INTERVIEW→OFFER→HIRED; REJECTED/WITHDRAWN terminal; reopen REJECTED/WITHDRAWN→SCREENING with reason) |

## W-13 HR — ranking  ·  RV up to save

`/manage/jobs/:id/ranking` → "Trọng số" sliders per criterion (1 ít quan trọng … 3 rất quan trọng, "bắt buộc" marker), "Về mặc định", "Lưu trọng số" (not executed) → ranked table (#, Ứng viên, Tiêu chí dots, Điểm) → click row for "vì sao" panel with quotes; "Xem dạng bảng hồ sơ". Table ready ≈1.3 s after navigation (RV, warm API).

## W-11 HR — jobs  ·  RV (read only)

`/manage/jobs` list (DRAFT/OPEN/CLOSED observed in API data) → `?xem=job:id` job workspace dialog (RV screenshot) → `/manage/jobs/new` form renders (RV); publish/close not executed.

## W-20 Hiring Manager  ·  RV (read only)

Login → `/` "2 hồ sơ chờ bạn xem" → `/applications` (department-scoped, 9 rows) → application detail/CV review in scope; out-of-scope → not found. `/manage/jobs/new` → Forbidden. Offer approval (`application:approve-offer`) not exercised.

## W-30 Interviewer — submit Phiếu đánh giá  ·  RV up to submit

| Field | Detail |
|---|---|
| Entry | login → `/` redirects to `/interviews` "Lịch phỏng vấn" (RV) |
| Actor | Interviewer (assigned-only scope) |
| Preconditions | assigned to a Buổi phỏng vấn; permissions `job:read, application:read, cv:read, interview:feedback` (RV `/auth/me`) |
| Main path | "Lịch phỏng vấn": header "2 buổi cần xử lý · 0 buổi sắp tới", views Danh sách / Tuần, "Hiện buổi đã huỷ", group "Cần xử lý" with rows (date, time, candidate · job · Vòng 1, meet link or room, status "Cần gửi phiếu") → open the application (3 assigned hồ sơ in `/applications`, column "Phiếu của bạn": Đã gửi / Cần gửi phiếu) → fill and send the phiếu (**not executed** — production write) |
| Alternative | open the job (3 assigned tin in `/manage/jobs`) |
| Failure | unassigned application → "Chưa mở được hồ sơ / Không tìm thấy dữ liệu" (RV, ADR-0002) |
| Permission boundary | no dashboard, candidates pool, AI chat, admin, platform → ForbiddenPage (RV) |
| Retry / recovery | phiếu resubmission/edit: UNK |
| Completion | phiếu status "Đã gửi"; dashboard for HR shows "buổi phỏng vấn đã có phiếu, chờ quyết định" (RV on HR dashboard) |

## W-40 Admin  ·  RV (read only)

All company admin pages render: `/users`, `/departments`, `/admin/company`, `/admin/ai-queue` ("Xử lý CV"), `/admin/audit-logs`. No mutations executed.

## W-50 platform_admin  ·  RV (read only)

Login → `/platform/companies` "Công ty trên sàn" with tabs Chờ duyệt / Đang hoạt động / Đã khoá / Bị từ chối / Tất cả and search (tên, slug, mã số thuế); "Chờ duyệt" currently empty; `/platform/queues` "Hàng đợi hệ thống". Approve/lock/quota not executed.

## W-15/W-16 Interviews & offers  ·  partially BLK

Interview scheduling and the offer block (draft → submit for approval → HM/Admin approve/return → send → accept/decline) exist in source (MVP 3.1 S4); every step is a write → not executed. Interviewer feedback path observed up to the submit control (W-30).
