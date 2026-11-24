# HireFlow

A recruitment marketplace where many companies post jobs, candidates apply with a CV, and each application gets an explainable fit score backed by verbatim quotes from the CV. Humans make every hiring decision.

## Platform & companies

**Sàn (Platform)**:
The shared marketplace that hosts many companies and their public job board.
_Avoid_: hệ thống, portal

**Công ty (Company)**:
An organization that recruits on the platform; all of its jobs, candidates and applications belong to it and are invisible to other companies. A company is registered, waits for approval, then is active — or is locked, which shuts out all its staff. Inside the product, people are always named by their role acting for a company; the person who registers a company is described as "người đăng ký (đại diện công ty)", not given a term.
_Avoid_: tenant, tổ chức, khách hàng; "Nhà tuyển dụng" as a concept — it is only the public navigation label for the employer entry point

**Quản trị sàn (Platform admin)**:
A platform-level account that approves, locks or rejects companies and belongs to no company.
_Avoid_: super admin, admin hệ thống

## People

**Ứng viên (Candidate)**:
The person behind one or more applications; a guest without an account who returns only through a tracking link sent by email. Lives in the Kho ứng viên and is never scored directly — only their applications are.
_Avoid_: người dùng, tài khoản ứng viên

**Admin / HR / Hiring Manager / Interviewer**:
The four roles of a company's staff; Hiring Manager works within one department, Interviewer only on what is assigned to them.
_Avoid_: nhân viên, user (when a role is meant)

## Hiring

**Tin tuyển dụng (Job)**:
A position a company is recruiting for, with criteria used to score applications. The term on every signed-in (company-side) screen; counted as "tin" ("13 tin đang mở").
_Avoid_: JD (except for the description text), "việc làm" behind login

**Việc làm**:
Not a separate concept — the candidate-facing label for a Tin tuyển dụng, used only on public pages and in messages to candidates; counted as "vị trí" ("15 vị trí đang tuyển"). Never mixed with "tin tuyển dụng" on the same surface.
_Avoid_: using it on signed-in screens

**Hồ sơ ứng tuyển (Application)**:
One candidate's application to one job, and the working unit of HR: it is what gets scored against that job's criteria, ranked within that job and moved through statuses. Counts, queues, statuses, scores and ranking always refer to hồ sơ.
_Avoid_: CV (the file), ứng tuyển (as a noun), "ứng viên" when an application is meant

**Kho ứng viên (Candidate pool)**:
All candidates a company has received across its jobs.
_Avoid_: talent pool, danh bạ

**Trạng thái hồ sơ (Application status)**:
The pipeline stage of an application: Mới, Sàng lọc, Phỏng vấn, Offer, Đã nhận việc (active → hired); Từ chối and Ứng viên rút (closed).
_Avoid_: bước, giai đoạn (as labels)

**Offer**:
The stage, and the document, in which the company presents employment terms for an application that passed evaluation; the same word is used for the status, the offer section, buttons ("Tạo Offer", "Gửi Offer"), notifications and emails. Kept in English on purpose because it is the working term of Vietnamese recruiters — do not translate it.
_Avoid_: Đề nghị, Thư mời, Lời mời làm việc

**Buổi phỏng vấn (Interview)**:
One scheduled interview for one application, with one or more assigned Interviewers.
_Avoid_: lịch hẹn, cuộc gọi

**Phiếu đánh giá (Interview feedback)**:
The structured evaluation one Interviewer submits for one interview, feeding the decision on the application. Written in full in headings and wherever the record is named; "phiếu" alone only in dense screens where the interview is already in view.
_Avoid_: feedback, nhận xét (a free-text remark, at most a part of the phiếu), "Đánh giá" alone as the record's name

**Đã nhận việc (Hired)**:
The final successful status: the candidate accepted the offer and joined.
_Avoid_: Đã nhận (reads as "received")

## Screening

**Tiêu chí (Criterion)**:
One requirement of a job that an application is checked against, either required ("bắt buộc") or nice-to-have ("nên có").
_Avoid_: kỹ năng, yêu cầu (as the scored unit)

**Trọng số (Weight)**:
How much a criterion counts in the score, from 1 (ít quan trọng) to 3 (rất quan trọng).
_Avoid_: hệ số, ưu tiên

**Mức phù hợp (Fit score)**:
The 0–100 score of an application, computed from the criteria it matches and their weights.
_Avoid_: điểm AI, AI score, rating

**Căn cứ (Evidence)**:
A verbatim quote from the CV that proves a criterion is matched, highlighted in the CV.
_Avoid_: bằng chứng AI, lý do, giải thích

**Xếp hạng (Ranking)**:
The ordering of a job's applications by fit score under the current weights.
_Avoid_: bảng điểm, leaderboard
