# HireFlow — Full Rebuild & Full Redesign Implementation Plan

> **Document:** Master Implementation Plan — Consolidated Edition
> **Version:** 1.2 (merges Master Plan v1.1 and Addendum v1.2 into a single governing document)
> **Last Updated:** 23 November 2026
> **Project:** HireFlow (VuTungLam39/hireflow)
> **Scope:** Product UX Research, UX/UI Audit, Design Direction, Design System, Prototyping, Frontend Reconstruction, Interaction & Motion, Quality Assurance
> **Execution Model:** Evidence-driven, phase-based, incremental implementation
> **Language note:** This consolidated edition is written entirely in English. The product UI language is Vietnamese (see §Phase 02, Content & Language).
> **How to read the amendments:** Rules introduced or changed by the v1.2 consolidation carry a Decision ID tag such as **[D-01]**. The full reasoning for each decision is summarized in Appendix A (Decision Log with Rationale). Where this document is silent, the original v1.1 intent applies; where a [D-xx] rule conflicts with a v1.1 statement elsewhere, the [D-xx] rule wins.

---

# 1. Executive Summary

## 1.1. Project Vision

HireFlow will undergo a **Full Rebuild & Full Redesign** to comprehensively restructure the product experience and the interface system.

The goal is not merely to change colors, typography, spacing, or to beautify the existing pages.

This is a process of re-evaluating the entire product experience, including:

- Product Information Architecture.
- Navigation Architecture.
- User Experience and recruitment workflows.
- Role-based User Experience.
- Page Layout and Content Hierarchy.
- Visual Design Language.
- Design System.
- Component Architecture.
- Interaction Design.
- Motion Design.
- Responsive Experience.
- Accessibility.
- Frontend Architecture.
- Performance.
- Testing and Quality Assurance.

The required outcome is a HireFlow with a modern, consistent, professional, easy-to-use experience and real product quality.

## 1.2. Strategic Direction

Core direction:

**Full Redesign — Rebuild the experience, preserve the product foundation.**

This means:

- Not constrained by the old Design DNA.
- Not required by default to keep the current layout or interface organization.
- Allowed to redesign the Information Architecture if evidence shows the current structure is not good.
- Allowed to rebuild the Design System.
- Allowed to restructure components and frontend architecture.
- Allowed to change how users interact with business workflows, as long as business behavior is not distorted.
- Must preserve API contracts, data, business logic, access rights, and verified functionality.

No backend rewrite will be performed merely because the frontend is being rebuilt.

## 1.3. Core Principles

| Principle | Description |
|---|---|
| Evidence-driven | Every decision is based on source code, runtime, screenshots, user flows, or verifiable data |
| Workflow-first | Design revolves around recruitment workflows, not around individual pages |
| Role-aware | Every actor must have an experience appropriate to their responsibilities and permissions |
| Design-led | The visual language must have a clear direction, not be an arbitrary assembly of components |
| Consistency | Components, patterns, spacing, typography, and interaction must be consistent |
| Incremental | Rebuild in vertical slices; do not replace the entire frontend at once |
| Accessible | Keyboard, focus, contrast, semantic HTML, and reduced motion |
| Performant | Do not trade performance for effects |
| Maintainable | Just enough architecture; avoid over-engineering |
| Verifiable | Every phase has deliverables and a Definition of Done |

## 1.4. What This Project Is Not

By default, this project does **not**:

- Migrate from Vite to Next.js.
- Replace all components with shadcn/ui.
- Install many animation libraries. **[D-11]** The default motion stack is CSS Transitions/Animations and the Web Animations API; a library (Motion, GSAP) may only be adopted through the Dependency Governance process (§6) with a concrete motion specification as evidence of need.
- Use Three.js merely to create eye-catching effects. **[D-11]** 3D is an appendix-level option (Phase 07), not part of the main roadmap.
- Change the backend or database during the redesign.
- Create component abstractions before the real patterns are understood.
- Delete existing business functionality before verifying whether it is still used.
- Treat old documents as absolute truth if source code and runtime show otherwise.

## 1.5. The Decided Working Stack **[D-01, D-03, D-04, D-05]**

This consolidated edition fixes, in one place, the tooling and process decisions that govern all phases:

- **Single development process:** mattpocock/skills — grill → spec → tickets → implement (TDD, one ticket at a time) → code-review. No second process system may run in parallel (see §5.6 for the binding mapping, including the three narrowly permitted Superpowers borrowings).
- **Behavior principles:** Andrej Karpathy's 4 principles — Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution — live in the project's `CLAUDE.md`, together with a half-page HireFlow constitution borrowed from spec-kit's constitution idea (see §9.3).
- **Design audit reviewer:** pbakaus/impeccable (`critique`, `audit`, `detect`) is a mandatory input to Phase 01.
- **Design system source of truth:** one `DESIGN.md` in the google-labs-code/design.md format, lint-checked (Phase 03).
- **Testing:** Microsoft Playwright (CLI in Phase 00, Test in later phases), axe-core for accessibility, Lighthouse for performance/accessibility baselines and audits.
- **Security:** one mandatory Security Gate using the cloudflare/security-audit-skill method, after Phase 01 (see Phase SG).
- **Memory bridge between planning (Claude Pro) and implementation (Claude Code):** repository files only (`CLAUDE.md`, GLOSSARY, ADRs, specs/tickets). No memory tool is the primary bridge.

---

# 2. Project Context & Technical Baseline

## 2.1. Existing Technical Stack — Historical Reference

The information below is technical context recorded from documents and prior development. **All of it must be re-verified in Phase 00.**

| Area | Historical Technology |
|---|---|
| Frontend framework | React 19 |
| Build tool | Vite 8 |
| Language | TypeScript 7 |
| Routing | React Router 8 |
| Server state | TanStack Query 5 |
| Client state | Zustand 5 |
| Form management | React Hook Form |
| Schema validation | Zod 4 |
| HTTP client | Axios |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Notifications | Sonner |
| API mocking | MSW |
| Unit testing | Vitest |
| Component testing | Testing Library |
| Linting | oxlint |
| Formatting | Prettier |
| Rendering | CSR with deliberate prerendering for public pages |

Do not automatically upgrade or change any of these dependencies before checking:

1. `package.json`.
2. The lockfile.
3. Runtime versions.
4. Existing source imports.
5. Build scripts.
6. CI configuration.
7. Test configuration.
8. Deployment configuration.

**Verified deployment facts (checked 2026-11-23, to be re-confirmed in Phase 00):** the frontend deploys on **Vercel** from `main` (each PR gets a preview that calls the production API); the API and workers deploy on **Render** (`hireflow-api`, `autoDeployTrigger: commit`); the database is Neon; Redis is Render Key Value; CV files are stored on Backblaze B2; the LLM is Gemini. **Consequence: merging to `main` is a production release** (see §Phase 05 and [D-10]).

**Verified product status (checked live 2026-11-23):** MVP 1 and MVP 2 are complete; MVP 3 (multi-company marketplace) is **already live** on production — `/jobs` publicly shows 15 positions from 3 companies and `/companies` lists all 3 companies at hireflow-gray-zeta.vercel.app. All live data is sample/demo data. The signed-in MVP 3 flows (employer self-registration, email verification, platform-admin approval, per-company AI quota) are **Documented-only, not Runtime-verified**. The HireFlow README's intro line calling production the "v2-demo" build is stale and inconsistent with its own status table and with the live site.

## 2.2. Existing Architecture Principles — To Verify

Historical architecture principles to be checked:

- Feature-based architecture.
- Server state managed by TanStack Query.
- Global client state uses Zustand only when truly necessary.
- The URL is the source of state for filters, sorting, and pagination.
- No ad-hoc API fetching inside `useEffect`.
- Cross-feature imports go through a public `index.ts`.
- Tailwind is used for styling.
- Radix is used selectively, only for appropriate interaction primitives.

Do not assume these principles have been applied uniformly across the codebase.

## 2.3. Actors & Roles

The actors below are a list **to verify**:

- Guest.
- Candidate.
- Admin.
- HR.
- Hiring Manager.
- Interviewer.
- `platform_admin`.

In particular, `platform_admin` is recorded in MVP 3 historical documents. Verify:

- Does the role exist in the backend?
- Is it returned in the authentication payload?
- Does it have its own routes?
- Does it have its own permissions?
- How does it differ from a regular Admin?

Do not create new roles or permissions during the redesign.

## 2.4. Product Areas to Investigate

| Area | Investigation Scope |
|---|---|
| Authentication | Login, registration, password recovery, session |
| Dashboard / Today | Overview, metrics, tasks, recent activities |
| Jobs | Job listing, job creation, job details, management |
| Applications | Application listing, details, status, pipeline |
| CV Review | CV preview, review, assessment |
| Candidate Ranking | Candidate ranking, scoring, comparison |
| Candidate Pool | Candidate management, saved candidates |
| CV Search | Search, filters, matching |
| Interviews | Scheduling, interview management |
| Evaluation | Interview feedback, evaluation forms |
| Offers | Offer preparation, status, management |
| Notifications | Notification center, unread states |
| Company Profile | Company information and configuration |
| Public Pages | Public job pages and company pages |
| Administration | User management and system settings |
| Platform Administration | Platform-level management, if verified |
| Error Pages | Not found, forbidden, server error |

This is a survey scope, not a list of confirmed routes.

---

# 3. Project Governance & Evidence Rules

## 3.1. Audit Unit

The standard evaluation unit:

**Route × Actor × UI State × Viewport × Interaction**

Example:

- Route: an application detail page.
- Actor: HR.
- UI State: loading.
- Viewport: desktop.
- Interaction: open candidate profile.

A page must not be evaluated from its default screenshot alone. Real states and behaviors must be checked. **[D-07]** The full matrix is applied at the *mapping* level; photographic/screenshot evidence is mandatory only for critical routes and representative states (see Phase 00, Workstream H).

## 3.2. Evidence Classification

Every piece of information carries one of these labels:

| Label | Meaning |
|---|---|
| Source-verified | Verified directly from source code |
| Runtime-verified | Verified through the running application |
| Documented-only | Described only in documents |
| Missing | Not found, or does not exist |
| Inconsistent | Source, documentation, or runtime disagree |
| Unknown | Not enough evidence |
| Deprecated | Determined to no longer be in use |

Never turn `Documented-only` into `Runtime-verified`. Never infer that a route, permission, or workflow exists merely because a document names it.

## 3.3. Evidence Requirements

A significant finding should have:

- Finding ID.
- Route.
- Actor.
- UI state.
- Viewport.
- Reproduction steps.
- Screenshot or video where appropriate.
- Source code location, if determinable.
- Expected behavior.
- Actual behavior.
- Impact.
- Severity.
- Root-cause confidence.
- Proposed solution.
- Acceptance criteria.

## 3.4. Phase Boundaries

- Each phase is executed only within its defined scope.
- Do not automatically proceed to the next phase.
- Do not change the backend without approval.
- Do not add dependencies without a documented reason.
- Do not edit source code in Phase 00.
- Do not fabricate screenshots or test reports that were not performed.
- Do not record a result as Passed without evidence.

## 3.5. Single Process Rule **[D-01]**

All process artifacts (specs, tickets, ADRs, glossaries, plans) follow the mattpocock/skills system defined in §1.5 and §5.6. If any referenced document, skill, or habit suggests a competing process framework (including spec-kit as a process, or Superpowers as a process), this rule wins: the competing framework is not adopted; only the specific borrowings listed in §5.6 are permitted.

---

# 4. Overall Execution Roadmap

| Phase | Name | Primary Outcome |
|---|---|---|
| 00 | Product Reconnaissance | Understand exactly what the current product is |
| 01 | Comprehensive UX/UI Audit | Identify problems and improvement opportunities |
| SG | **Security Gate [D-02]** | Verify tenant isolation, CV/LLM attack surface, and evidence integrity before real data and before at-risk implementation |
| 02 | Design DNA & Creative Direction | Build the new design direction |
| 03 | Design System Reconstruction | Build the Design System |
| 04 | Prototype & Validation | Validate the critical workflows |
| 05 | Frontend Reconstruction | Rebuild the interface in vertical slices |
| 06 | Motion & Interaction Polish | Refine interaction and motion |
| 08 | QA, Regression & Release | Test and prepare the release |

*Appendix (not in the main roadmap): Phase 07 — Three.js / 3D Exploration, opened only by an explicit Go decision [D-11].*

**Indicative effort and minimum cut per phase [D-07]:** S = a few working sessions; M ≈ one part-time week; L = several weeks.

| Phase | Indicative effort | Minimum acceptable cut (never go below this) |
|---|---|---|
| 00 | M | Route inventory + permission matrix + workflow map + discrepancies (most secondary screenshots may be dropped) |
| 01 | M | P0/P1/P2 findings for critical routes + T1–T3 baselines + impeccable audit |
| SG | S | Three scopes: tenant isolation, CV prompt injection, quote integrity |
| 02 | S–M | Brief + 2 directions + decision log (3 directions not required) |
| 03 | M | `DESIGN.md` passing lint + component APIs for foundation & data components |
| 04 | S–M | Prototypes for CV Review + Ranking (the two highest-risk workflows) |
| 05 | L | Per slice; every slice independently meets its DoD, so stopping after any slice leaves a coherent product |
| 06 | S | Only motion serving feedback/state transitions that has a specification |
| 08 | M | Regression on critical routes + Security Gate re-check + T1–T3 re-measurement |

---

# PHASE 00 — PRODUCT RECONNAISSANCE

## 00.1. Objective

Understand all of HireFlow before making any redesign decision.

This phase focuses on gathering evidence, mapping the product, verifying the architecture, and determining the real scope.

**Phase 00 is read-only reconnaissance.** Do not change source code, do not refactor, do not redesign, and do not install dependencies into the project.

## 00.2. Entry Criteria **[D-06]**

Phase 00 may only be declared "fully in progress" when the following exist:

1. Read access to the source of the VuTungLam39/hireflow repository, and knowledge of the branch under examination.
2. A list of test accounts per verified actor (minimum: Guest by default, Candidate, HR, Admin; `platform_admin` if it exists) — or an explicit record that they do not yet exist.
3. A minimum verification dataset: 1 test company, 2–3 job descriptions in different states, 3–5 CVs/applications at multiple pipeline stages.
4. Access to the live site (read-only is sufficient) at hireflow-gray-zeta.vercel.app.

If criteria 2 or 3 are missing, Phase 00 still proceeds with the public surface plus source code, but the affected deliverables must be marked **Blocked — awaiting test accounts/data**, and the final Phase 00 status is at most **PARTIALLY PASSED** until the signed-in surface is verified or the project owner accepts the risk in the decision log.

*Rationale in brief:* at least four workstreams below (C, D, E, H) cannot be completed for signed-in actors without test accounts and controlled data; the signed-in MVP 3 flows are currently Documented-only, and the live homepage redirects unauthenticated visitors to `/login`.

## 00.3. Workstream A — Repository Reconnaissance

Check:

- Repository structure.
- Package manager.
- Lockfile.
- Node.js version.
- TypeScript configuration.
- Vite configuration.
- Tailwind configuration.
- ESLint/Oxlint configuration.
- Prettier configuration.
- Router setup.
- Application entrypoints.
- Providers.
- Authentication.
- Authorization.
- API client.
- TanStack Query configuration.
- Zustand stores.
- Form architecture.
- Shared components.
- Feature modules.
- Error handling.
- Environment variable **names** (never record secret values).
- Build scripts.
- Test scripts.
- CI/CD.
- Deployment configuration.

### Deliverable

`01-repository-map.md`, containing: project structure; important directories; main entrypoints; package manager; available scripts; existing dependencies; runtime assumptions; technical risks.

## 00.4. Workstream B — Architecture Reconnaissance

Verify:

- Frontend architecture.
- Routing architecture.
- Data-fetching architecture.
- State management.
- Authentication flow.
- Authorization flow.
- API error handling.
- Form validation.
- Shared UI architecture.
- Feature boundaries.
- Cross-feature dependencies.

### Deliverable

`02-architecture-map.md`

## 00.5. Workstream C — Route & Page Inventory

Find routes from the router and source code; do not use the sidebar as the only source.

For each route, record:

- Route pattern.
- Page component.
- Parent layout.
- Required actor.
- Permission requirement.
- Page purpose.
- Data source.
- Important interactions.
- Loading state.
- Empty state.
- Error state.
- Responsive behavior.
- Current implementation status.

Historical routes such as `/applications/:id` or `/manage/jobs/:id/ranking` are only examples to check, not assumed current routes.

### Deliverables **[D-07 — merged]**

- `03-route-and-page-inventory.md` (routes and pages in one file; the v1.1 files 03 and 04 are combined).

This file also fixes the project's **critical routes** list: routes belonging to the verified core workflows — public jobs/companies, dashboard, job management, application list/detail, CV review, ranking — plus any route found to expose cross-company data. The critical-routes list governs evidence scope in Phase 00/01 and regression scope in Phase 08.

## 00.6. Workstream D — Actor & Permission Mapping

Build the actor and permission matrix.

| Product Area | Guest | Candidate | HR | Hiring Manager | Interviewer | Admin |
|---|---|---|---|---|---|---|
| Public Jobs | Verify | Verify | Verify | Verify | Verify | Verify |
| Applications | Verify | Verify | Verify | Verify | Verify | Verify |
| CV Review | Verify | Verify | Verify | Verify | Verify | Verify |
| Interviews | Verify | Verify | Verify | Verify | Verify | Verify |
| Offers | Verify | Verify | Verify | Verify | Verify | Verify |
| User Management | Verify | Verify | Verify | Verify | Verify | Verify |

`Verify` means the actual permission must be checked; it does not mean the actor is assumed to have access. Add a `platform_admin` column if that role is verified to exist.

### Deliverable

`05-actor-permission-matrix.md`

## 00.7. Workstream E — Workflow Mapping

Survey the main workflows.

### Candidate Workflow

- Authentication.
- Browse jobs.
- Search and filter.
- View job detail.
- Submit application.
- Upload CV.
- View application status.
- Receive notifications.
- Manage profile.

Only include functions that have been verified in the final workflow map.

### HR Workflow

- Dashboard.
- Create/manage jobs.
- Review applications.
- Open candidate profile.
- Review CV.
- Evaluate candidates.
- Move candidates through the pipeline.
- Schedule interviews.
- Manage offers.

### Hiring Manager Workflow

- Review candidates.
- Participate in evaluations.
- Access relevant hiring information.
- Collaborate with HR.

### Interviewer Workflow

- View assigned interviews.
- Access candidate information.
- Submit evaluation.
- Review interview schedule.

### Admin Workflow

- Manage users.
- Manage company or system configuration.
- Monitor relevant operations.

### Deliverable

`06-workflow-map.md`

Each workflow must describe:

1. Entry point.
2. Actor.
3. Preconditions.
4. Main path.
5. Alternative paths.
6. Failure paths.
7. Permission boundaries.
8. Retry and recovery.
9. Completion state.

## 00.8. Workstream F — UI Component & Layout Inventory

Inventory the current components:

- Buttons.
- Inputs.
- Selects.
- Dropdowns.
- Dialogs.
- Drawers.
- Tabs.
- Tables.
- Cards.
- Badges.
- Tooltips.
- Pagination.
- Breadcrumbs.
- Notifications.
- Loading indicators.
- Empty states.
- Error states.

Check for:

- Component duplication.
- Inconsistent variants.
- Inconsistent sizing.
- Inconsistent spacing.
- Unclear APIs.
- Accessibility issues.
- Components too tightly coupled to features.

### Deliverable **[D-07 — merged]**

- `07-component-and-layout-catalog.md` (components and layouts in one file; the v1.1 files 07 and 08 are combined).

## 00.9. Workstream G — UI State Inventory

For each important page or component, determine:

- Default.
- Loading.
- Empty.
- Error.
- Success.
- Disabled.
- Hover.
- Focus.
- Active.
- Selected.
- Expanded.
- Collapsed.
- Pending.
- Permission denied.
- Partial data.
- Long content.
- Network failure.

### Deliverable

`09-ui-state-inventory.md`

## 00.10. Workstream H — Visual & Interaction Reconnaissance

Survey the actual interface:

- Typography.
- Color palette.
- Spacing.
- Grid.
- Layout.
- Navigation.
- Content density.
- Information hierarchy.
- Tables.
- Forms.
- Dialogs.
- Responsive layout.
- Hover and focus.
- Transitions.
- Loading feedback.
- Empty states.
- Error feedback.

**Screenshot scope [D-07]:** screenshots are mandatory for **critical routes × {default, loading, empty, error, permission-denied} × {desktop 1440, mobile 390}**, organized by actor. Outside this scope, capture screenshots when they serve a specific finding. Do not attempt the full Actor × Route × State × Viewport product.

### Deliverables

- `10-visual-reconnaissance.md`
- `11-interaction-animation-inventory.md`
- `screenshots/`

## 00.11. Workstream I — Responsive, Accessibility & Performance Baseline

### Responsive

Check desktop, laptop, tablet, and mobile. Specific sizes are determined after surveying the real viewports in use.

### Accessibility

Check:

- Semantic HTML.
- Heading hierarchy.
- Keyboard navigation.
- Focus visibility.
- Focus management.
- Accessible names.
- Form labels.
- Error announcements.
- Color contrast.
- Reduced motion.

### Performance

Record:

- Initial load.
- Route transitions.
- Bundle size.
- Image loading.
- Rendering bottlenecks.
- Long tasks.
- Layout shifts.
- Large data tables.
- Expensive interactions.

**[D-05]** Lighthouse is an approved tool for the performance and accessibility baselines of this workstream; use it rather than recording a tooling limitation. If a specific measurement genuinely cannot be performed in the available environment, record the limitation explicitly instead of fabricating a baseline.

### Deliverables

- `12-responsive-audit.md`
- `13-accessibility-baseline.md`
- `14-performance-baseline.md`

## 00.12. Workstream J — Consolidation

Consolidate:

- Document vs. source discrepancies.
- Missing functionality.
- Inconsistent behavior.
- Architectural risks.
- UI debt.
- UX risks.
- Technical dependencies.
- Unknowns.
- Blockers (including, explicitly, the test-account/data blocker from §00.2 if unresolved).

### Deliverables

- `15-document-code-discrepancies.md`
- `16-risk-and-dependency-register.md`
- `17-phase-01-audit-backlog.md`

## 00.13. Phase 00 Output Structure

```text
docs/
└── redesign/
    └── phase-00/
        ├── README.md
        ├── 01-repository-map.md
        ├── 02-architecture-map.md
        ├── 03-route-and-page-inventory.md
        ├── 05-actor-permission-matrix.md
        ├── 06-workflow-map.md
        ├── 07-component-and-layout-catalog.md
        ├── 09-ui-state-inventory.md
        ├── 10-visual-reconnaissance.md
        ├── 11-interaction-animation-inventory.md
        ├── 12-responsive-audit.md
        ├── 13-accessibility-baseline.md
        ├── 14-performance-baseline.md
        ├── 15-document-code-discrepancies.md
        ├── 16-risk-and-dependency-register.md
        ├── 17-phase-01-audit-backlog.md
        └── screenshots/
            ├── guest/
            ├── candidate/
            ├── hr/
            ├── hiring-manager/
            ├── interviewer/
            └── admin/
```

(File numbering follows v1.1; merged files keep the first number of their pair and the merge is noted in the phase README **[D-07]**. Target ≈ 10–12 files instead of 17.)

## 00.14. Skills & Tooling Playbook

### Playwright CLI

Repository: https://github.com/microsoft/playwright

Use for: browser exploration, navigation, screenshots, DOM snapshots, interaction testing, runtime reconnaissance. **Activate during Phase 00.**

### Playwright MCP

Repository: https://github.com/microsoft/playwright-mcp

Optional. Use only when the selected coding agent benefits from browser interaction through MCP. Do not install the MCP server if Playwright CLI already meets the requirements.

### Systematic debugging

Use when: runtime behavior differs from expectations; a page fails to load; an interaction is broken; there is an unexplained rendering issue; a technical blocker needs investigation. The primary skill is mattpocock `/diagnosing-bugs`; Superpowers `systematic-debugging` is a permitted borrowing under §5.6 **[D-01]**. Do not use debugging as a justification for unrelated code changes during reconnaissance.

### Browser DevTools

Use for: console errors, network requests, failed API calls, layout inspection, responsive inspection, performance profiling.

### Lighthouse **[D-05]**

Use for the performance and accessibility baselines in Workstream I.

### Activation Timing

| Tool | Activation |
|---|---|
| Playwright CLI | Phase 00 |
| Browser DevTools | Phase 00 |
| Lighthouse (baseline) | Phase 00 |
| Systematic debugging (as defined above) | As needed |
| Playwright Test | Later, after the existing test stack is inspected |
| axe-core | Phase 01 |

## 00.15. Phase 00 Definition of Done

Phase 00 is complete when:

- Repository architecture is mapped.
- Actual routes are inventoried.
- Actors and permissions are verified or marked unknown/blocked.
- Critical workflows are documented.
- UI components and layouts are catalogued.
- UI states are inventoried.
- Screenshots have sufficient context within the scope of §00.10.
- Responsive, accessibility, and performance baselines are documented.
- Documentation/source discrepancies are identified.
- Risks and blockers are recorded.
- The Phase 01 backlog is prepared.
- No unapproved source changes were made.

**Gate:** Phase 00 must be reviewed before Phase 01 starts. If the Entry Criteria in §00.2 are unmet for the signed-in surface, the maximum status is PARTIALLY PASSED **[D-06]**.

---

# PHASE 01 — COMPREHENSIVE UX/UI AUDIT

## 01.1. Objective

Comprehensively evaluate the current experience based on the evidence from Phase 00.

The goal is not merely to find interface defects, but to identify the problems that genuinely affect how effectively the product is used.

## 01.2. Audit Dimensions

### A. Information Architecture

Check: navigation hierarchy; page grouping; feature discoverability; navigation depth; naming consistency; context switching; route organization; user orientation.

### B. Workflow UX

Check: number of steps; redundant actions; unnecessary navigation; context loss; confusing transitions; missing feedback; recovery from failure; bulk-operation efficiency.

### C. Visual Hierarchy

Check: primary action visibility; secondary action hierarchy; content grouping; typography hierarchy; spacing consistency; visual density; contrast; scannability.

### D. Data-heavy UX

Particularly important for a recruitment system. Check: candidate tables; application lists; ranking tables; search and filters; sorting; pagination; bulk actions; column density; long candidate information; comparison experience.

### E. Form UX

Check: field grouping; required fields; validation timing; inline errors; error recovery; multi-step forms; draft preservation; submission feedback.

### F. Recruiting Domain UX

Check the fit between the interface and the business: candidate profile; CV review; job requirements; application pipeline; candidate ranking; interview scheduling; interview evaluation; offer management.

Do not evaluate a screen on aesthetics alone while ignoring its business function.

### G. Role-based UX

Evaluate each actor by: information visibility; available actions; permission feedback; task relevance; navigation relevance; cognitive load.

### H. Responsive UX

Evaluate: navigation adaptation; table behavior; form layout; dialog behavior; touch targets; overflow; content prioritization.

### I. Accessibility

Evaluate: keyboard access; focus management; semantic structure; accessible labels; color contrast; screen reader behavior; motion sensitivity.

### J. Motion & Interaction

Evaluate: feedback; transition clarity; loading feedback; menu and dialog behavior; animation consistency; interaction latency; reduced-motion support.

### K. Performance

Evaluate: rendering performance; bundle cost; network behavior; image loading; expensive component rendering; interaction responsiveness.

### L. Trust & Security UX

Evaluate: permission-denied feedback; sensitive information visibility; destructive-action confirmation; authentication states; data-mutation feedback; user identity context.

*Note:* this dimension evaluates the **experience** of security-related feedback only. The technical security verification of the product is the Security Gate (Phase SG) **[D-02]**; the two must not be confused.

## 01.3. Mandatory Tool-assisted Audit **[D-03]**

In addition to manual review:

- Run pbakaus/impeccable `critique` and `audit` on at least the key routes: `/jobs`, `/companies`, `/companies/:slug`, the ranking page, the CV review page, and the dashboard (using the actual routes verified in Phase 00).
- Treat impeccable's output as **input evidence** for findings, not as findings themselves: every result must be cross-checked against the business workflow before entering the backlog (per the rule that a skill is not evidence).
- Where technically feasible, record the output of `npx impeccable detect src/` as a consistency baseline for comparison in Phase 08.

## 01.4. Baseline Task Metrics **[D-08]**

Measure, on the current product, three core tasks (these baselines anchor Phase 04 validation and Phase 08 comparison):

- **T1:** HR finds and opens one specific application from the list.
- **T2:** HR views a CV and records one evaluation.
- **T3:** A candidate finds one job using filters and opens the company detail page.

For each task record the average completion time and the number of steps/navigations. Record the results in the Phase 01 executive summary.

## 01.5. Finding Template

Every finding uses this structure:

```text
Finding ID:
Title:
Category:
Route:
Actor:
UI State:
Viewport:

Problem:
Reproduction Steps:
Evidence:
Source Location:
Expected Behavior:
Actual Behavior:

User Impact:
Business Impact:
Severity:
Frequency:
Root Cause Confidence:

Recommendation:
Implementation Effort:
Dependencies:
Accessibility Impact:
Responsive Impact:
Performance Impact:

Acceptance Criteria:
```

## 01.6. Severity Classification

| Severity | Definition |
|---|---|
| P0 — Critical | Security, permission, data integrity, or business-critical failure |
| P1 — High | An important workflow is broken or severely obstructed |
| P2 — Medium | Significant UX friction that reduces usage efficiency |
| P3 — Low | Visual polish, consistency, or minor interaction issue |

Severity must be based on real impact, not on aesthetic impression alone.

## 01.7. Deliverables

```text
docs/redesign/phase-01/
├── README.md
├── 01-executive-summary.md            (includes the T1–T3 baselines [D-08])
├── 02-findings-by-actor.md
├── 03-findings-by-workflow.md
├── 04-information-architecture-audit.md
├── 05-visual-hierarchy-audit.md
├── 06-data-heavy-ux-audit.md
├── 07-form-ux-audit.md
├── 08-responsive-audit.md
├── 09-accessibility-audit.md
├── 10-motion-interaction-audit.md
├── 11-performance-audit.md
├── 12-prioritized-remediation-backlog.md
└── 13-redesign-requirements.md
```

## 01.8. Skills & Tooling Playbook

### Impeccable **[D-03]**

Repository: https://github.com/pbakaus/impeccable — mandatory `critique`/`audit` as specified in §01.3.

### UI/UX Pro Max

Repository: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

Use for: UI/UX design patterns; design style exploration; typography recommendations; color palette exploration; domain-specific UX guidance; dashboard and SaaS interface patterns.

Do not use output from this skill as evidence that the product has a problem. Evidence must come from HireFlow itself.

### AccessLint Skills **[D-05]**

Repository: https://github.com/AccessLint/skills

Use for: accessibility review and accessibility-related implementation guidance. Verify the actual repository and skills before use, and log the use (§5.5).

### axe-core **[D-05]**

Repository: https://github.com/dequelabs/axe-core

Use for automated accessibility checks. Automated testing does not replace manual keyboard and screen-reader review. Approved for audit-level use; installing it into the project requires Dependency Governance (§6).

### Lighthouse

Repository: https://github.com/GoogleChrome/lighthouse

Use for: performance, accessibility, best practices, and SEO where relevant.

### Playwright

Use for: reproducing findings, capturing screenshots, testing interactions, validating responsive behavior.

## 01.9. Definition of Done

- Findings have evidence.
- P0/P1 issues are identified.
- Critical workflows are evaluated.
- Actor-specific UX is analyzed.
- Accessibility issues are recorded.
- Responsive issues are recorded.
- Performance bottlenecks are recorded.
- The remediation backlog is prioritized.
- Redesign requirements are written clearly.
- T1–T3 baseline metrics are recorded **[D-08]**.
- The impeccable audit has been run and its output cross-checked into findings **[D-03]**.

**Gate:** Do not start Design DNA before the important problems and the redesign requirements are consolidated. The Security Gate (Phase SG) runs immediately after this phase.

---

# PHASE SG — SECURITY GATE **[D-02]**

## SG.1. Objective

Verify, before real company data touches the live product and before Phase 05 implements any slice that touches the same surfaces, that HireFlow's three integrity-critical properties actually hold:

1. **Tenant isolation** — one company can never access another company's jobs, candidates, CVs, or scores, through any route, ID, list, detail view, ranking, search, or export.
2. **LLM pipeline integrity** — untrusted content (CVs, job descriptions) cannot manipulate extraction or scoring through prompt injection, and every AI score carries a verbatim quote that is verified to exist in the CV.
3. **Access control on sensitive surfaces** — file upload and storage, authentication/session handling, and platform-admin surfaces behave as the permission matrix (Phase 00) says they must.

*Rationale in brief:* the live product currently runs on sample/demo data, which makes this the cheapest moment to audit. A cross-tenant data leak or a manipulated AI score is a P0 by this plan's own severity scale, and a UX audit (Phase 01, dimension L) cannot detect it, because the interface can look correct while the data returned is wrong.

## SG.2. Method and Scope

- **Method:** cloudflare/security-audit-skill (repository: https://github.com/cloudflare/security-audit-skill). Read its actual `SKILL.md` before use and log the use (§5.5). Run it in read-only/report style; this gate changes no code.
- **Minimum scope:** (1) tenant isolation at API and UI; (2) prompt injection via CV and JD into the extraction/scoring pipeline; (3) integrity of the evidence-quote mechanism; (4) file upload (file types, size, B2 storage, access paths); (5) auth/session and platform-admin routes.

## SG.3. Deliverable and Blocking Power

- Deliverable: `docs/redesign/security-gate/findings.md`, using the Phase 01 finding template and P0–P3 severity.
- **Blocking rule:** unresolved P0/P1 findings mean the gate is **not Passed**. The gate must be Passed before (a) any real company data is used on the live product, and (b) Phase 05 begins slices touching tenant boundaries, the CV pipeline, or scoring.
- Risk acceptance is never silent: accepting a P0/P1 risk requires an entry in the decision log signed off by the project owner.

---

# PHASE 02 — DESIGN DNA & CREATIVE DIRECTION

## 02.1. Objective

Rebuild the Design DNA for HireFlow.

The old Design DNA is only a historical reference, not a design constraint.

The goal is to find a visual direction genuinely suited to:

- The recruiting domain.
- A multi-role product.
- Data-heavy workflows.
- A professional SaaS experience.
- Brand personality.
- Long-term scalability.

## 02.2. Design Brief

Create a Product Design Brief including:

1. Product positioning.
2. Target users.
3. Core jobs-to-be-done.
4. Main workflows.
5. Product personality.
6. Brand attributes.
7. UX principles.
8. Visual objectives.
9. Functional constraints.
10. Accessibility requirements.
11. Responsive requirements.
12. Technical constraints.
13. **Content & language requirements [D-09]** — see §02.7.

## 02.3. Creative Direction Exploration

Create 2–3 genuinely different design directions, **derived from the brief and the Phase 01 evidence**. (Three illustrative hypotheses formerly listed here — a professional recruiting workspace, an editorial talent platform, and a modern operations console — are retained only as examples in Appendix B; they must not anchor the exploration **[D-09]**.)

## 02.4. Comparison Criteria

| Criterion | Evaluation |
|---|---|
| Workflow Fit | Does it fit recruitment workflows? |
| Readability | Is information easy to read and scan? |
| Data Density | Does it suit large data tables? |
| Distinctiveness | Does it create its own identity? |
| Accessibility | Does it meet accessibility requirements? |
| Responsive | Does it adapt well across viewports? |
| Scalability | Can it extend to more modules? |
| Maintainability | Can it be implemented and maintained reasonably? |
| Brand Fit | Does it fit HireFlow's positioning? |

## 02.5. Design Exploration Requirements

Each direction should include:

- Color palette.
- Typography system.
- Layout principles.
- Navigation concept.
- Dashboard concept.
- Data table concept.
- Form concept.
- Candidate profile concept.
- Application pipeline concept.
- Dialog/drawer concept.
- Interaction principles.
- Motion principles.
- Responsive concept.

Do not produce one beautiful landing page and conclude that the whole product has a Design DNA.

## 02.6. Decision Process

1. Build the brief.
2. Propose the directions.
3. Compare using explicit criteria.
4. Create representative prototypes.
5. Evaluate workflow fit.
6. Review with users (using the minimum validation method in Phase 04, §04.4 **[D-08]**).
7. Choose a direction.
8. Record the decision log.
9. Freeze the Design DNA.

Do not automatically choose a direction merely because it is beautiful or trendy.

## 02.7. Content & Language; Dark Mode **[D-09]**

- **UI language:** the product's interface language is Vietnamese. This phase must finalize the Vietnamese UI terminology table — pipeline stage names, application status labels, and labels related to AI scores — and add it to the project GLOSSARY. Phase 03 usage guidelines reference this table, and every Phase 05 slice uses exactly these terms.
- **Dark mode:** the official decision for this redesign is **no dark mode**, unless the project owner decides otherwise at the Phase 02 gate. The token architecture (Phase 03) must keep semantic tokens clean enough to add it later, but no phase may spend effort on dark mode in this redesign.

## 02.8. Deliverables

```text
docs/redesign/phase-02/
├── README.md
├── 01-product-design-brief.md
├── 02-design-principles.md
├── 03-direction-a.md
├── 04-direction-b.md
├── 05-direction-c.md          (only if a third direction is produced)
├── 06-direction-comparison.md
├── 07-approved-design-dna.md
└── 08-design-decision-log.md
```

## 02.9. Skills & Tooling Playbook

### Anthropic Frontend Design

Repository: https://github.com/anthropics/skills — Skill: `frontend-design`

Use for: distinctive frontend design; strong visual hierarchy; layout composition; typography; color; visual identity; avoiding generic AI-generated aesthetics. Verify the actual skill before use (§5.5).

### UI/UX Pro Max

Use for: domain patterns, design styles, typography, palette exploration, UI recommendations.

### Emil Kowalski Skills

Repository: https://github.com/emilkowalski/skills

Use the relevant design-engineering and prototype-related skills. These skills support craft and implementation; they do not replace product discovery.

### Structured exploration and decision-making **[D-01]**

Use mattpocock `/grill-me` / `/grill-with-docs` to structure design exploration, alternative solutions, tradeoff discussion, and design decisions (this replaces any separate brainstorming framework; see §5.6).

### Taste-skill (limited borrowing)

From Leonxlnx/taste-skill, keep only one habit: verify pages in a real browser at 1440 / 1024 / 768 / 390 before calling them done. Its landing-page layouts are not adopted for HireFlow's dense HR screens.

## 02.10. Definition of Done

- The Product Design Brief is approved.
- Design principles are defined.
- Directions are compared.
- Critical workflows are evaluated.
- The new Design DNA is finalized.
- Decisions are recorded.
- The Vietnamese terminology table is finalized and the dark-mode decision is recorded **[D-09]**.

**Gate:** Do not implement the official Design System before the direction is approved.

---

# PHASE 03 — DESIGN SYSTEM RECONSTRUCTION

## 03.1. Objective

Build the new Design System based on the approved Design DNA.

The Design System must ensure:

- Consistency.
- Reusability.
- Accessibility.
- Responsive behavior.
- Clear component APIs.
- Maintainability.
- Scalable design patterns.

## 03.2. The Source of Truth: `DESIGN.md` **[D-04]**

- The design system's root file is **`DESIGN.md`**, written in the google-labs-code/design.md format (repository: https://github.com/google-labs-code/design.md): machine-readable tokens (YAML) plus human-readable rationale.
- `DESIGN.md` must **pass the format's CLI lint** (on Windows/PowerShell use the `designmd` alias, per the repository's documentation). A passing lint result is part of this phase's Definition of Done.
- The prose documents in §03.10 remain as *explanation*; `DESIGN.md` is the *verifiable* source. If the two disagree, `DESIGN.md` wins and the prose must be corrected.

## 03.3. Token Architecture

### Primitive Tokens

Examples: color primitives; spacing scale; radius scale; typography scale; shadow scale; border width; motion duration; z-index layers.

### Semantic Tokens

Examples: background; foreground; surface; muted; primary; secondary; accent; border; destructive; success; warning; info; focus ring.

### Component Tokens

Create only when a component genuinely needs its own token. Do not create a token for every CSS value without benefit.

## 03.4. Typography System

Define: font families; font weights; heading scale; body scale; caption scale; line heights; letter spacing; numeric typography; table typography.

Pay particular attention to typography for: candidate information; job descriptions; dashboard metrics; dense tables; status labels; long-form content.

## 03.5. Color System

Build: brand palette; neutral palette; semantic status palette; surface hierarchy; text hierarchy; border hierarchy; focus state; disabled state.

Ensure adequate contrast. Do not use color as the only means of conveying status.

## 03.6. Component Architecture

### Foundation Components

Button; IconButton; Input; Textarea; Select; Combobox; Checkbox; Radio; Switch; Badge; Avatar; Tooltip; Popover; Separator.

### Navigation Components

Sidebar; Topbar; Breadcrumbs; Tabs; Pagination; Navigation Menu.

### Overlay Components

Dialog; Drawer; Alert Dialog; Dropdown Menu; Command Menu.

### Data Components

Table; DataTable; FilterBar; Search Input; Sort Control; Bulk Action Bar; Status Badge; Empty State; Loading Skeleton.

### Feedback Components

Toast; Inline Alert; Error State; Success State; Progress Indicator; Confirmation Dialog.

### Layout Components

AppShell; PageHeader; PageContainer; ContentSection; SplitLayout; DetailLayout; SidebarLayout.

## 03.7. Recruiting-specific Patterns

Do not build only generic components. Identify the business patterns:

- Candidate Card.
- Candidate Profile Header.
- CV Preview.
- CV Review Panel.
- Application Pipeline.
- Candidate Ranking.
- Interview Schedule.
- Interview Evaluation.
- Offer Summary.
- Activity Timeline.
- Candidate Comparison.
- Bulk Candidate Actions.
- Job Summary.
- Hiring Progress.

Implement a pattern only when the corresponding business function has been verified.

## 03.8. Component API Contract

Every important component must have:

- Purpose.
- Props.
- Variants.
- Sizes.
- States.
- Composition.
- Keyboard behavior.
- Accessibility requirements.
- Responsive behavior.
- Loading behavior.
- Error behavior.
- Usage guidelines (including the approved Vietnamese UI terminology where the component renders status or pipeline labels **[D-09]**).
- Anti-patterns.

Example:

```text
Component: Button

Purpose:
Trigger a user action.

Variants:
- Primary
- Secondary
- Outline
- Ghost
- Destructive
- Link

Sizes:
- Small
- Medium
- Large

States:
- Default
- Hover
- Focus
- Active
- Disabled
- Loading

Accessibility:
- Keyboard accessible
- Visible focus
- Accessible name
- Correct button semantics
```

## 03.9. Component Documentation

Storybook may be used if it fits the project's scale and workflow. Storybook is not mandatory if an internal component showcase meets the need.

## 03.10. Deliverables

```text
DESIGN.md                                (repository root of the frontend — see 03.2 [D-04])
docs/redesign/phase-03/
├── README.md
├── 01-token-specification.md
├── 02-typography-system.md
├── 03-color-system.md
├── 04-component-inventory.md
├── 05-component-api-contracts.md
├── 06-accessibility-contract.md
├── 07-responsive-rules.md
├── 08-recruiting-pattern-library.md
└── 09-usage-guidelines.md
```

## 03.11. Skills & Tooling Playbook

- **design.md format + CLI lint** — the token source of truth **[D-04]**.
- **Impeccable** — design review of the system as it is drafted **[D-03]**.
- UI/UX Pro Max: design system guidance.
- Anthropic frontend-design: visual implementation quality.
- Emil design-engineering skills: interface craft.
- mattpocock `/to-spec`: implementation planning for the system **[D-01]**.
- React best practices (vercel-labs/agent-skills, repository: https://github.com/vercel-labs/agent-skills): apply after verifying the actual skills; filter out guidance that applies only to Next.js while HireFlow uses Vite.
- Storybook: optional component documentation.

### Local Skill Creation

After the Design System is stable, a local skill may be created:

`hireflow-design-system`

It should contain: approved tokens; component APIs; usage rules; accessibility contracts; responsive behavior; anti-patterns.

Do not create the local skill too early, while the design system is still changing constantly.

## 03.12. Definition of Done

- Semantic tokens are complete.
- The typography and color systems are clear.
- The component inventory is approved.
- Component APIs are defined.
- Component states are defined.
- Accessibility rules are recorded.
- Responsive rules are recorded.
- Recruiting patterns are described.
- A migration strategy is prepared.
- **`DESIGN.md` passes lint [D-04].**

---

# PHASE 04 — PROTOTYPE & VALIDATION

## 04.1. Objective

Validate the Design DNA and the Design System through the critical workflows before wide implementation.

There is no need to prototype the entire application. Prioritize workflows with:

- High business impact.
- High interaction complexity.
- High data density.
- Multiple participating actors.
- High risk when changed.

## 04.2. Candidate Prototype Areas

Areas that may be selected after the audit:

1. CV Review.
2. Candidate Ranking.
3. Application Pipeline.
4. Interview Scheduling.
5. Interview Evaluation.
6. Job Creation.
7. Candidate Profile.
8. Dashboard.

This list is a set of candidates for selection, not an assertion that all of them exist in the current product. **[D-07]** If scope must be cut, the minimum is CV Review + Candidate Ranking, the two highest-risk workflows.

## 04.3. Prototype Fidelity

### Low Fidelity

Use to check: information architecture; workflow sequence; content grouping; navigation; interaction logic.

### Mid Fidelity

Use to check: layout; information density; component hierarchy; user flow; responsive structure.

### High Fidelity

Use to check: Design DNA; typography; color; spacing; component details; motion; interaction quality.

## 04.4. Validation Scenarios and Success Criteria **[D-08]**

Every prototype must have an explicit scenario **and a pass threshold**.

Example — **Scenario: HR reviews an application**

1. HR opens the application list.
2. Searches for a candidate.
3. Applies filters.
4. Opens the application detail.
5. Views the CV.
6. Evaluates the candidate.
7. Performs the appropriate action.
8. Confirms the result.

Check:

- Does the user understand the next step?
- Do they lose context?
- Must they perform too many actions?
- Is there feedback after the action?
- Can they recover from an error?
- Is the data easy to scan?
- Does it work well by keyboard?

**Pass thresholds (minimum):** the task is completed **unassisted**; completion time is **not worse than the Phase 01 baseline** for the corresponding task (T1/T2/T3); no context loss mid-task.

**Minimum validation method:** run **3–5 task-based walkthrough sessions** with people role-playing HR/Candidate against the scenarios (people outside the building team where possible), and record every stumble as a finding using the Phase 01 template. If walkthroughs with people outside the project cannot be held, the Phase 04 report must state **"internally validated only"** — the phrase "validated with users" must not be used.

## 04.5. Deliverables

```text
docs/redesign/phase-04/
├── README.md
├── 01-prototype-scope.md
├── 02-critical-workflow-prototypes.md
├── 03-validation-scenarios.md
├── 04-validation-findings.md
└── 05-approved-implementation-spec.md
```

## 04.6. Skills & Tooling Playbook

- Anthropic frontend-design (verify before use).
- UI/UX Pro Max.
- Emil prototype-related skills; Emil `break-ui`.
- mattpocock `/grill-me` for structured exploration of alternatives **[D-01]**.
- Playwright for interaction validation.

## 04.7. Definition of Done

- Critical workflows are prototyped.
- Loading, empty, error, and permission states are considered.
- Responsive behavior is checked.
- Interaction logic is confirmed.
- Major usability issues are resolved.
- The implementation specification is approved.
- Validation results are reported against the thresholds in §04.4, with the validation method stated honestly **[D-08]**.

---

# PHASE 05 — FRONTEND RECONSTRUCTION

## 05.1. Objective

Rebuild the frontend based on:

- The verified product architecture.
- The UX/UI audit.
- The approved Design DNA.
- The Design System.
- The validated prototypes.

Implement in vertical slices; no big-bang rewrite.

## 05.2. Technical Constraints

Must preserve:

- Existing API contracts.
- Authentication behavior.
- Authorization behavior.
- Backend business rules.
- Database semantics.
- Existing data.
- Workflow state transitions.
- Error-handling contracts.

Do not change the backend merely to make the frontend easier to implement.

If an API contract problem is discovered:

1. Record it.
2. Enter it into the technical decision log.
3. Assess the impact.
4. Propose a separate change.
5. Implement only when approved.

**Prerequisite [D-02]:** the Security Gate (Phase SG) must be Passed before slices that touch tenant boundaries, the CV pipeline, or scoring begin.

## 05.3. Vertical Slice Workflow

Every slice must follow this process:

1. Read the current implementation.
2. Read the approved design specification.
3. Identify the relevant API endpoints.
4. Identify query and mutation behavior.
5. Identify actor and permission requirements.
6. Identify loading, empty, error, and edge states.
7. Write the implementation plan (as spec + tickets in the mattpocock process **[D-01]**).
8. Define acceptance criteria.
9. Implement (TDD, one ticket at a time).
10. Run the relevant tests.
11. Run lint and typecheck.
12. Run the build.
13. Review screenshots.
14. Review accessibility.
15. Code-review the slice.
16. Review the changed files.
17. Update the implementation log (including the merge commit hash and the post-merge smoke result **[D-10]**).

A slice is not complete merely because the page looks like the design.

## 05.4. Suggested Reconstruction Order

The order below is a suggestion. The final order must be based on the dependency graph and the audit findings.

### Slice A — Application Shell

AppShell; main navigation; sidebar; topbar; breadcrumbs; page layout; responsive navigation; actor-specific navigation. *This is the highest-blast-radius slice: apply the preparation-PR / feature-flag rule in §05.5 [D-10].*

### Slice B — Shared Interaction Components

Buttons; inputs; selects; dialogs; drawers; dropdowns; tooltips; tabs; toasts; loading states; error states.

### Slice C — Data-heavy Patterns

Data tables; filters; search; sorting; pagination; bulk actions; empty states; row actions.

### Slice D — Core Hiring Workflows

Implement according to the workflows verified and prioritized in the audit. May include: Jobs; Applications; Candidate profiles; CV review; Candidate ranking; Pipeline management.

### Slice E — Interview & Evaluation

If these modules exist: interview management; scheduling; evaluation forms; feedback; status transitions.

### Slice F — Offer Management

If verified: offer details; offer status; relevant actions; feedback and history.

### Slice G — Administration

User management; configuration; role-specific interfaces; permission states.

### Slice H — Public & Authentication Pages

Login; registration; recovery; public job pages; company pages.

### Slice I — Secondary Pages

Remaining pages, implemented by priority and dependency.

## 05.5. Branch, PR, and Release Safety **[D-10]**

Deployment reality (verified): the frontend deploys on Vercel from `main` and the API on Render with auto-deploy on commit. **Merging to `main` is a production release**; there is no separate full staging environment (Vercel previews call the production API).

Therefore:

- **One vertical slice = one short-lived branch + one pull request.** Each PR must be self-contained: independently mergeable and **independently revertible** (reverting the PR is the slice's rollback).
- After every merge to `main`, run a minimum production smoke check (open `/jobs`, `/companies`, and one page belonging to the merged slice) and record the commit hash and the smoke result in the slice's implementation log.
- Changes to AppShell, navigation, or permission-related UI must be split into a **behavior-preserving preparation PR** before the real change, or placed behind a simple feature flag; the choice is recorded in the slice's spec.

## 05.6. State Management Rules

Continue to evaluate these principles against the verified codebase:

- TanStack Query for server state.
- Zustand for genuinely necessary shared client state.
- The URL for filters, sorting, pagination, and shareable page state.
- Local component state for local UI state.
- Do not duplicate server state in Zustand without a reason.
- Do not fetch data in `useEffect` when Query can handle it better.
- Form state should have clear ownership.

## 05.7. Component Architecture Rules

- Prefer composition over unnecessary abstraction.
- Keep component responsibilities clear.
- Avoid giant page components.
- Avoid over-fragmentation.
- Avoid duplicated business logic.
- Keep feature boundaries explicit.
- Reuse shared components only when behavior is genuinely shared.
- Do not create generic abstractions prematurely.

## 05.8. Testing Strategy

Each slice must define: unit tests; component tests; integration tests; E2E tests; visual review; accessibility review.

Do not install Playwright Test before inspecting the existing test infrastructure.

## 05.9. Skills & Tooling Playbook

### Process **[D-01]**

The mattpocock loop governs this phase: `/to-spec` → `/to-tickets` → `/implement` (TDD) → `/code-review`, with `/diagnosing-bugs` for defects and `/wayfinder` for work larger than one session. The mapping from other frameworks' skill names to this loop is binding and is given in §5.6. Permitted Superpowers borrowings (after reading the actual `SKILL.md` and logging the use): `systematic-debugging`, `verification-before-completion`, `using-git-worktrees`.

### Vercel Agent Skills

Repository: https://github.com/vercel-labs/agent-skills

Use the React best practices where appropriate. Filter out guidance that applies only to Next.js while HireFlow uses Vite. Verify the actual skills before use.

### Anthropic Frontend Design

Use to ensure visual implementation quality.

### Playwright

Use for: E2E; interaction regression; screenshot review; responsive checks.

## 05.10. Definition of Done — Per Slice

- Acceptance criteria are met.
- The API contract is preserved.
- No permission regression.
- Loading, empty, error, and success states are handled.
- Responsive behavior works.
- Keyboard interaction works.
- Tests pass.
- Lint passes.
- Typecheck passes.
- Build passes.
- Screenshots are reviewed.
- No out-of-scope changes.
- Documentation is updated if needed.
- The PR is independently revertible, and the post-merge production smoke check is recorded **[D-10]**.

---

# PHASE 06 — MOTION & INTERACTION POLISH

## 06.1. Objective

Refine interaction and motion after the interface structure and workflows are stable.

Motion must not be used merely to make the interface look attractive.

Every animation must serve at least one purpose: feedback; orientation; continuity; state transition; spatial relationship; perceived performance.

## 06.2. Interaction Areas

Consider: navigation transitions; dropdown menus; dialogs; drawers; expand/collapse; tabs; progress indicators; drag and drop; pipeline movement; status changes; optimistic feedback; toasts; skeleton transitions; form feedback.

## 06.3. Motion Specification

Every important motion must define:

```text
Name:
Trigger:
Initial State:
Target State:
Duration:
Easing:
Movement:
Opacity:
Scale:
Interruption Behavior:
Reduced Motion Behavior:
Performance Considerations:
Accessibility Considerations:
```

## 06.4. Technology Selection **[D-11]**

### Default: CSS Transitions / Animations and the Web Animations API

CSS is preferred for: hover; focus; simple transitions; basic component state changes. The Web Animations API may be used when direct animation control is needed and the animation is relatively independent.

### Libraries — only through Dependency Governance (§6)

**Motion for React** (https://motion.dev/) suits React layout animations, gesture interactions, presence animations, and shared layout transitions. **GSAP** (https://gsap.com/, already in the project's reference set) suits complex timelines, sequenced animations, scroll-driven experiences, and advanced motion control.

Do not install Motion and GSAP by default, and never both without justification. A library may be adopted only when a concrete motion specification (§06.3) demonstrates that CSS/WAAPI cannot meet it, and the adoption passes §6.

## 06.5. Skills & Tooling Playbook

Repository: https://github.com/emilkowalski/skills

Skill groups to survey: `emil-design-eng`; `apple-design`; `prototype`; `find-animation-opportunities`; `animate`; `review-animations`; `improve-animations`; `animation-performance`; `break-ui`.

Skill names and contents must be checked in the repository at implementation time. The Emil skills are highly valuable for design engineering, animation, and UI polish, but they do not replace UX research or product architecture. LottieFiles' motion-design-skill (https://github.com/LottieFiles/motion-design-skill) may be consulted for motion philosophy where relevant.

## 06.6. Definition of Done

- Motion has a clear purpose.
- Timing is consistent.
- Easing is appropriate.
- Focus is never lost.
- Keyboard behavior still works.
- Reduced motion is supported.
- No layout jank.
- No negative performance impact.
- The workflow is not obstructed.

---

# APPENDIX PHASE 07 — THREE.JS / 3D EXPLORATION (OPTIONAL, OUTSIDE THE MAIN ROADMAP) **[D-11]**

## 07.1. Objective

Evaluate the possible use of 3D or WebGL in HireFlow. This is an optional appendix, not a required phase and not part of the main roadmap. The default decision is **No-Go**: no surface of a CV-screening ATS is currently known to need 3D.

## 07.2. Decision Questions

Before any implementation, answer:

1. What problem does 3D solve?
2. Is the value it brings genuinely necessary?
3. Could CSS, SVG, or 2D solve it better?
4. Does it affect initial load?
5. Does it affect GPU and battery?
6. Does it work well on weak devices?
7. Is there a fallback when WebGL is unavailable?
8. Is there an accessibility alternative?
9. Does it complicate maintenance?

If there is no convincing reason, skip 3D.

## 07.3. Technology Reference

- Three.js — https://threejs.org/ — 3D rendering library (already in the project's reference set).
- React Three Fiber — https://r3f.docs.pmnd.rs/ — React renderer for Three.js.
- Drei — https://github.com/pmndrs/drei — helpers and abstractions for React Three Fiber.

Note: Three.js, React Three Fiber, and Drei are libraries/frameworks, not Agent Skills.

## 07.4. Deliverables — If Approved

```text
docs/redesign/phase-07/
├── README.md
├── 01-use-case-brief.md
├── 02-technical-prototype.md
├── 03-performance-budget.md
├── 04-accessibility-fallback.md
└── 05-go-no-go-decision.md
```

## 07.5. Definition of Done

Implement only when: there is a concrete use case; a prototype proves the value; a performance budget is defined; a fallback is designed; accessibility is considered; and there is a Go/No-Go decision.

---

# PHASE 08 — QA, REGRESSION & RELEASE

## 08.1. Objective

Ensure the product after the redesign: works correctly; does not break business logic; does not lose permission boundaries; has appropriate responsive behavior; has an acceptable level of accessibility; has appropriate performance; and can be released and rolled back.

## 08.2. Test Strategy

### Unit Testing

Check: utilities; business-independent frontend logic; validation; state transformations; reusable hooks.

### Component Testing

Check: interaction; props; states; keyboard behavior; accessibility semantics.

### Integration Testing

Check: query and mutation; form submission; error handling; navigation; component integration.

### E2E Testing

Check real workflows by actor.

### Visual Regression **[D-11]**

Use **Playwright screenshot comparison** at a basic level for the critical routes; baselines are stored in `docs/redesign/phase-08/visual-baseline/`. Do not adopt a separate visual-regression service in this redesign. Check: layout consistency; typography; spacing; responsive layout; component states.

### Accessibility Testing

Combine: axe-core; keyboard testing; manual review; screen-reader review where appropriate.

### Performance Testing

Combine: Lighthouse; browser performance tools; bundle analysis; runtime profiling.

### Security Re-check **[D-02]**

Re-run the Security Gate's core checks (tenant isolation, prompt injection, quote integrity) against the rebuilt frontend before release.

### Outcome Metrics **[D-08]**

Re-measure tasks T1–T3 on the redesigned product and report the difference against the Phase 01 baselines. The redesign must not be declared successful if T1/T2 are materially slower than baseline without a reason accepted in the decision log.

## 08.3. Regression Matrix

Testing unit: **Route × Actor × State × Viewport × Browser**

Priority areas: authentication; authorization; dashboard; job management; application workflow; candidate profile; CV review; candidate ranking; interview workflow; evaluation; offer workflow; administration; unauthorized; forbidden; not found; error recovery.

Only include verified functionality in the test suite.

## 08.4. Release Gate

Before release:

- Critical E2E tests pass.
- No unresolved P0.
- No unresolved P1 without explicit acceptance.
- No permission regression.
- No security regression (Security Gate re-check passed **[D-02]**).
- No data integrity regression.
- Accessibility blockers resolved or explicitly accepted.
- Responsive smoke tests pass.
- Performance meets the agreed thresholds.
- Monitoring is ready.
- The rollback strategy is ready (per-PR revert, per §05.5 **[D-10]**).
- Release notes are prepared.

## 08.5. Deliverables

```text
docs/redesign/phase-08/
├── README.md
├── 01-test-strategy.md
├── 02-regression-matrix.md
├── 03-e2e-results.md
├── 04-visual-regression-results.md
├── 05-accessibility-results.md
├── 06-performance-results.md
├── 07-known-issues.md
├── 08-release-checklist.md
├── 09-rollback-plan.md
├── 10-release-notes.md
└── visual-baseline/
```

## 08.6. Skills & Tooling Playbook

- Playwright Test.
- axe-core.
- Lighthouse.
- mattpocock `/code-review`; the DoD checklists of each phase; Superpowers `verification-before-completion` is a permitted borrowing under §5.6 **[D-01]**.
- Browser DevTools.

## 08.7. Definition of Done

- The regression matrix is checked.
- Critical workflows are verified.
- Accessibility is reviewed.
- Performance is measured.
- Known issues are recorded.
- Rollback is prepared.
- The release checklist is completed.
- Release notes are created.
- T1–T3 are re-measured and compared with baseline **[D-08]**.

---

# 5. Skills & Tooling Strategy

## 5.1. Important Distinction

Do not confuse the following concepts:

| Type | Meaning |
|---|---|
| Agent Skill | A set of instructions in a `SKILL.md` |
| MCP Server | Exposes tools to an AI agent |
| CLI | A tool run through the terminal |
| Test Framework | A framework serving testing |
| Runtime Library | A library used in the application runtime |
| Reference Repository | A source of implementation/design reference |
| Audit Engine | A tool that automatically measures and detects issues |

Examples:

- Playwright CLI: a CLI.
- Playwright MCP: an MCP server.
- Playwright Test: a test framework.
- axe-core: an accessibility testing engine.
- Motion: a runtime animation library.
- Three.js: a 3D rendering library.
- Emil skills: Agent Skills.
- UI/UX Pro Max: an Agent Skill / project resource set, whose actual structure must be checked.

Never call a library a skill merely because an agent can use it.

## 5.2. Reference Repositories

| Repository | Main Purpose | Status in this project |
|---|---|---|
| `mattpocock/skills` | **The single development process** (grill, spec, tickets, TDD implement, code-review) | Adopted — governing process **[D-01]** |
| `multica-ai/andrej-karpathy-skills` | Behavior principles for agents | Adopted as content in `CLAUDE.md` **[D-01]** |
| `github/spec-kit` | Spec-driven development | Not adopted as a process; only the constitution idea is borrowed **[D-01]** |
| `pbakaus/impeccable` | Design critique/audit, deterministic detector | Adopted — Phase 01/03 **[D-03]** |
| `google-labs-code/design.md` | Machine-checkable design-token format | Adopted — Phase 03 **[D-04]** |
| `cloudflare/security-audit-skill` | Security audit method incl. AI/LLM attack classes | Adopted — Security Gate **[D-02]** |
| `emilkowalski/skills` | Design engineering, motion, UI polish, prototypes | Adopted — Phases 02/04/06, narrowly |
| `nextlevelbuilder/ui-ux-pro-max-skill` | UX/UI patterns, styles, palettes, typography | Reference only — never evidence, never the design system |
| `microsoft/playwright` | Browser automation and testing | Adopted — Phases 00/01/04/05/08 |
| `microsoft/playwright-mcp` | Browser interaction through MCP | Optional; only if Playwright CLI is insufficient |
| `dequelabs/axe-core` | Automated accessibility testing | Approved tooling **[D-05]** |
| `GoogleChrome/lighthouse` | Performance and quality audits | Approved tooling **[D-05]** |
| `AccessLint/skills` | Accessibility-related agent guidance | Evaluate in Phase 01; use only after reading the actual skills **[D-05]** |
| `anthropics/skills` | Frontend design and other agent skills | Reference; verify before use |
| `vercel-labs/agent-skills` | React and web development best practices | Reference; filter out Next.js-only guidance |
| `obra/superpowers` | Planning, TDD, debugging, code review (a process framework) | **Not adopted as a process.** Only the three borrowings in §5.6 are permitted **[D-01]** |
| `storybookjs/storybook` | Component development and documentation | Optional |
| `motiondivision/motion` | React animation and interaction (runtime library) | Only through §6 governance **[D-11]** |
| `greensock/GSAP` | Advanced animation timelines (runtime library) | Only through §6 governance **[D-11]** |
| `mrdoob/three.js` | 3D rendering (runtime library) | Appendix Phase 07 only **[D-11]** |
| `pmndrs/react-three-fiber` | React renderer for Three.js | Appendix Phase 07 only |
| `thedotmack/claude-mem` | Cross-session memory for coding agents | Not the primary memory bridge (it does not bridge to Claude Pro); optional, later, local-only |
| `Leonxlnx/taste-skill` | Art direction for company/landing sites | Not adopted as a system; only its multi-viewport browser-check habit is kept |
| `zanwei/design-dna` | Extracting design DNA from a reference UI | Not adopted (HireFlow has no reference UI to clone) |
| `LottieFiles/motion-design-skill` | Motion design philosophy | Reference for Phase 06 |

## 5.3. Skill Activation Matrix

| Phase | Skills / Tools | Purpose |
|---|---|---|
| 00 | Playwright CLI, DevTools, Lighthouse (baseline), mattpocock `/diagnosing-bugs` as needed | Product reconnaissance |
| 01 | **Impeccable critique/audit**, UI/UX Pro Max (reference), AccessLint (evaluate), axe-core, Lighthouse, Playwright | UX/UI audit + T1–T3 baselines |
| SG | **cloudflare/security-audit-skill** | Security Gate **[D-02]** |
| 02 | mattpocock `/grill-me`, UI/UX Pro Max, frontend-design, Emil | Creative direction + terminology + dark-mode decision |
| 03 | **design.md format + lint**, Impeccable, UI/UX Pro Max, frontend-design, mattpocock `/to-spec`, React best practices | Design System |
| 04 | frontend-design, UI/UX Pro Max, Emil prototype + break-ui, Playwright | Prototype validation |
| 05 | **mattpocock loop (spec → tickets → TDD implement → code-review)**, React best practices, frontend-design, Playwright | Frontend rebuild |
| 06 | Emil animation skills; CSS/WAAPI by default; Motion or GSAP only via §6 | Interaction and motion |
| 07 (appendix) | Three.js, R3F, Drei | Optional 3D, Go decision required |
| 08 | Playwright Test, axe-core, Lighthouse, mattpocock `/code-review`, screenshot comparison | QA and release |

## 5.4. Local HireFlow Skills

Create local skills only when the knowledge and conventions are stable enough.

### `hireflow-product-recon`

Create after Phase 00. Contains: repository map; routes; actors; permissions; workflows; product terminology; architecture facts; known limitations.

### `hireflow-product-ux`

Create after Phase 02. Contains: approved Design DNA; product UX principles; actor-specific workflows; navigation rules; UX patterns.

### `hireflow-design-system`

Create after Phase 03. Contains: design tokens; component APIs; component variants; accessibility; responsive rules; anti-patterns.

### `hireflow-ui-review`

Create after Phases 03–05. Contains: visual review checklist; interaction review; responsive review; accessibility review; consistency rules.

### `hireflow-qa`

Create after Phase 08. Contains: test matrix; E2E conventions; regression checklist; release checklist.

Do not create a local skill merely to copy another repository's documentation verbatim.

## 5.5. Skill & Tool Execution Log

Each time an important skill/tool is used, record:

```text
Date:
Phase:
Tool/Skill Name:
Repository:
Path:
Version:
Task:
Input:
Output:
Verification:
Status:
Notes:
```

Status: Verified / Partially verified / Recommendation / Unknown / N/A.

Never record a skill as Verified if its actual instructions have not been read and it has not been used.

## 5.6. Binding Process Mapping **[D-01]**

The mattpocock loop is the only process. Where any source (including earlier drafts of this plan) names a Superpowers skill, use this mapping:

| Named need | Official source in this project | Note |
|---|---|---|
| Brainstorming / exploration (Phases 02, 04) | mattpocock `/grill-me`, `/grill-with-docs` | Grilling also produces the glossary + ADRs — the memory bridge |
| Writing plans (Phases 03, 05) | mattpocock `/to-spec` + `/to-tickets` | Do not create a second "plan" format |
| Test-driven development (Phase 05) | mattpocock `/tdd`, `/implement` | One ticket at a time |
| Requesting / receiving code review | mattpocock `/code-review` | Review before commit/merge |
| Systematic debugging (Phases 00, 05) | mattpocock `/diagnosing-bugs`; Superpowers `systematic-debugging` **permitted** after reading its `SKILL.md` and logging the use | Permitted borrowing #1 |
| Verification before completion (Phase 08) | The phase DoD checklists; Superpowers `verification-before-completion` **permitted** on the same conditions | Permitted borrowing #2 |
| Git worktrees (Phase 05) | Only when a large slice needs isolation; Superpowers `using-git-worktrees` **permitted** on the same conditions | Permitted borrowing #3; otherwise use the branch/PR convention in §05.5 |
| Subagent-driven development | mattpocock `/wayfinder` for work larger than one session | Do not run two coordination mechanisms in parallel |
| Finishing a development branch | The PR convention in §05.5 | — |

*Rationale (summary of Appendix A, D-01):* two competing process frameworks create two sources of truth for how work is planned, split, tested, and reviewed; the mattpocock process was selected earlier on direct evidence (both candidate repositories were read and scored against HireFlow's needs), while Superpowers had never been evaluated. Superpowers is not rejected as low quality — three of its capabilities fill genuine gaps and are therefore borrowable under verification, but it does not replace the governing process without a new, evidence-based decision recorded in the decision log.

---

# 6. Dependency Governance

Do not install dependencies on impulse.

Before installing any package, record:

```text
Dependency:
Proposed Version:

Problem:
Why Existing Stack Is Insufficient:

Primary Use Case:
Expected Benefit:

Compatibility:
Bundle Impact:
Runtime Impact:
Accessibility Impact:

Maintenance:
License:
Lock-in Risk:

Alternatives:
Decision:
Rollback Strategy:
```

Potential dependencies:

| Dependency | Potential Use |
|---|---|
| Playwright Test | E2E testing |
| axe-core | Accessibility (audit use is pre-approved [D-05]; project installation goes through this section) |
| Storybook | Component documentation |
| Motion | React animation (only with a concrete motion spec [D-11]) |
| GSAP | Advanced timeline animation (only with a concrete motion spec [D-11]) |
| Three.js | Optional 3D (appendix only) |
| React Three Fiber | Three.js integration in React (appendix only) |

This is not a list of packages that must be installed.

---

# 7. Progress Tracking & Reporting

## 7.1. Phase Status

Each phase has one of these statuses:

- Not started.
- In progress.
- Blocked.
- Ready for review.
- Passed.
- Passed with accepted risks.

Do not change a status without sufficient evidence. Final phase reports use exactly one of: **PASSED / PARTIALLY PASSED / BLOCKED** (see §9).

## 7.2. Phase Report Template

```text
# Phase Report

Phase:
Status:
Date:

## 1. Objective

## 2. Scope Completed

## 3. Deliverables

## 4. Verified Facts

## 5. Findings

## 6. Decisions (including which [D-xx] rules were applied)

## 7. Unknowns

## 8. Blockers

## 9. Files Changed

## 10. Dependencies Changed

## 11. Commands Executed

## 12. Tests Executed

## 13. Actual Test Results

## 14. Risks

## 15. Definition of Done

## 16. Next Prerequisites
```

Clearly distinguish: commands that were run; tests that were run; tests that were not run; tests that were blocked; actual results.

Never write `All tests passed` if the full suite was not run.

---

# 8. Master Definition of Done

The whole project is considered complete when the following are satisfied:

## Product Understanding

- Actual routes are verified.
- Actors are verified.
- Permissions are verified.
- Critical workflows are documented.
- UI states are inventoried.

## Security

- The Security Gate is Passed, and its core checks are re-verified before release.
- No unresolved P0/P1 security findings without explicit, logged acceptance.

## UX/UI

- The UX audit has evidence.
- P0/P1 issues are resolved or have an acceptance decision.
- The new Design DNA is approved.
- The information architecture is appropriate.
- Actor-specific experiences are clear.
- Core task metrics (T1–T3) are not materially worse than baseline without an accepted reason.

## Design System

- Design tokens are complete, and `DESIGN.md` passes lint.
- Component APIs are clear.
- Component states are defined.
- Responsive rules are defined.
- Accessibility contracts are defined.
- Recruiting patterns are standardized.
- UI terminology matches the approved Vietnamese glossary.

## Prototype

- Critical workflows are prototyped.
- Important usability issues are resolved.
- Implementation specs are approved.

## Frontend

- The frontend is rebuilt in vertical slices.
- API contracts are preserved.
- Business rules are preserved.
- Authentication is preserved.
- Authorization is preserved.
- No permission regression.
- Every slice was merged as an independently revertible PR with a recorded post-merge smoke check.

## Interaction & Motion

- Motion has a purpose.
- Reduced motion is supported.
- Keyboard behavior is preserved.
- No animation causes a serious performance impact.

## 3D

- Skipped if there is no justified reason.
- If implemented: a prototype, a performance budget, and a fallback exist.

## QA & Release

- Critical E2E tests pass.
- Accessibility is reviewed.
- Responsive behavior is reviewed.
- Performance is measured.
- Known issues are recorded.
- A rollback strategy is prepared.
- The release checklist is completed.

## Documentation

- Phase reports are updated.
- The decision log is updated.
- The skill/tool log is updated.
- Documentation matches the actual implementation.

---

# 9. Master Prompt for Claude Code / Codex

Use the prompt below when starting a phase.

```text
You are working on HireFlow, a recruitment management application.

Your task is to execute the explicitly requested phase from:

HireFlow — Full Rebuild & Full Redesign Implementation Plan (Consolidated v1.2).

PROJECT STRATEGY

This is a Full Rebuild & Full Redesign.

The objective is to rebuild the product experience and frontend quality while preserving the verified product foundation.

Do not treat the old Design DNA as a constraint.

Preserve:
- Existing business rules.
- Existing API contracts.
- Existing data semantics.
- Authentication.
- Authorization.
- Role and permission boundaries.
- Verified product workflows.

Do not perform backend rewrites or database changes as a side effect of frontend redesign.

SOURCE OF TRUTH

Before working:

1. Read this master implementation plan (Consolidated v1.2), including its [D-xx] rules.
2. Read the requested phase specification.
3. Read previous phase reports.
4. Inspect the actual repository.
5. Inspect the current branch.
6. Inspect package.json and the lockfile.
7. Inspect the runtime and available scripts.
8. Inspect the relevant source code.
9. Inspect existing tests.
10. Read relevant documentation.

Do not assume historical documentation is still accurate. Known example: the HireFlow
README intro calls production the "v2-demo" build, but MVP 3 is already live —
documentation has been wrong before and will be again.

EVIDENCE RULES

Distinguish:

- Source-verified.
- Runtime-verified.
- Documented-only.
- Missing.
- Inconsistent.
- Unknown.
- Deprecated.

Never invent:
- Routes.
- Actors.
- Permissions.
- APIs.
- Workflows.
- Product capabilities.
- Test results.
- Screenshots.
- Tool availability.
- Skill availability.

The signed-in MVP 3 flows (employer self-registration, email verification,
platform-admin approval, per-company AI quota) are Documented-only until verified
with real test accounts.

PROCESS RULES [D-01]

- The single process is mattpocock/skills: grill -> spec -> tickets -> implement
  (TDD, one ticket at a time) -> code-review.
- Superpowers skills may be used ONLY for systematic-debugging,
  verification-before-completion, and using-git-worktrees, and only after reading
  their actual SKILL.md and logging the use (see section 5.6 of the plan).
- Do not adopt any other process framework, including spec-kit as a process.

SKILL AND TOOL RULES

Before claiming to use an Agent Skill:

1. Locate the actual SKILL.md.
2. Read the skill instructions.
3. Confirm that the skill is relevant.
4. Follow its applicable instructions.
5. Record the actual usage.

Do not confuse:
- Agent Skills.
- MCP servers.
- CLI tools.
- Runtime libraries.
- Testing frameworks.
- Reference repositories.

Do not assume a dependency or tool is installed. If a named skill does not exist
at the stated path, STOP and report it — do not silently improvise a substitute.

PHASE BOUNDARIES

Execute only the explicitly requested phase.

Do not automatically proceed to the next phase.

Do not modify unrelated source files.

Do not install dependencies without documenting:
- The problem.
- The use case.
- Why the current stack is insufficient.
- Compatibility.
- Bundle/runtime impact.
- Alternatives.
- Rollback strategy.

PHASE 00 SPECIAL RULES

Phase 00 is read-only reconnaissance.

Do not:
- Edit source code.
- Refactor.
- Redesign.
- Change dependencies.
- Change business behavior.

Only inspect, collect evidence, create approved documentation, and report blockers.

Before starting Phase 00, state whether the Entry Criteria (plan section 00.2)
are met; list what is missing and which deliverables will be marked
"Blocked — awaiting test accounts/data".

SECURITY GATE [D-02]

A Security Gate (plan Phase SG) must be Passed before:
- Phase 05 slices that touch tenant boundaries, the CV pipeline, or scoring; and
- Any use of real company data on the live product.

Unresolved P0/P1 security findings block the gate. Risk acceptance must be
recorded in the decision log by the project owner — never silently.

IMPLEMENTATION RULES

For implementation phases:

- Follow the approved Design DNA.
- Follow the approved Design System; DESIGN.md is the machine-checkable source
  of truth for tokens and must pass lint.
- Preserve API contracts.
- Preserve permission boundaries.
- Use vertical slices: one slice = one branch + one self-contained,
  independently revertible pull request.
- Merging to main IS a production release (Vercel + Render auto-deploy).
  After every merge, run the production smoke check and log the commit hash.
- Define acceptance criteria before implementation.
- Handle loading, empty, error, success, and permission states.
- Consider responsive behavior.
- Consider accessibility.
- Use the approved Vietnamese UI terminology from the GLOSSARY exactly.
- Avoid unnecessary abstractions.
- Avoid over-engineering.

TESTING RULES

Run only tests that are actually available and relevant.

Report:
- Commands executed.
- Tests executed.
- Tests passed.
- Tests failed.
- Tests skipped.
- Tests blocked.

Never fabricate successful results.

REPORTING

At the beginning of the phase, report:

1. Objective.
2. Verified repository facts.
3. Unknowns.
4. Planned tasks.
5. Expected deliverables.
6. Verification strategy.
7. Potential source/dependency modifications.
8. Which [D-xx] decision rules apply to this phase.

At the end, report:

1. Completed work.
2. Files created or changed.
3. Evidence collected.
4. Decisions made.
5. Actual commands executed.
6. Actual test results.
7. Remaining unknowns.
8. Blockers.
9. Risks.
10. Definition of Done status.

Choose exactly one final phase status:

- PASSED
- PARTIALLY PASSED
- BLOCKED

Do not advance to another phase unless explicitly instructed.

The goal is a reliable, evidence-driven, maintainable product redesign — not simply generating visually attractive pages.
```

## 9.3. `CLAUDE.md` Block (paste into the repository's `CLAUDE.md` when the project owner authorizes creating/editing it)

```markdown
# HireFlow — Working Rules

## Governing document
HireFlow Full Rebuild & Full Redesign Master Implementation Plan, Consolidated v1.2.
Read it, and the current phase's spec/tickets and previous phase reports under
docs/redesign/, before any phase work. Its [D-xx] rules are binding.

## Process (single system — do not mix with another process framework)
- Loop: grill -> spec -> tickets -> implement (TDD, one ticket at a time) -> code-review.
- Source: mattpocock/skills. Superpowers skills may be used ONLY for
  systematic-debugging, verification-before-completion, and git-worktrees, and only
  after reading their SKILL.md and logging the use. Do not adopt any other process
  system (including spec-kit as a process).

## Behaviour principles (Karpathy)
- Think Before Coding: state assumptions; if tenant scope, permission, or data
  semantics are unclear, stop and verify — never guess.
- Simplicity First: minimum code that solves the ticket; no speculative abstractions.
- Surgical Changes: touch only what the ticket requires; preserve API contracts,
  auth, permissions, and data semantics.
- Goal-Driven Execution: every ticket has verifiable acceptance criteria before
  implementation.

## HireFlow constitution (non-negotiable)
- AI only suggests; humans decide.
- Every AI score must carry a verbatim quote verified against the CV.
- Tenant isolation is never optional: one company must never see another company's
  jobs, candidates, CVs, or scores — in lists, detail views, ranking, search, or exports.
- CV extraction happens exactly once per CV; re-ranking on weight change makes no
  extra LLM call.

## Evidence rules
- Label every claim: Source-verified / Runtime-verified / Documented-only / Missing /
  Inconsistent / Unknown / Deprecated. Never present Documented-only as verified.
- Never invent routes, actors, permissions, APIs, workflows, test results, or screenshots.
- Signed-in MVP 3 flows (employer registration, email verification, platform-admin
  approval, per-company quota) are Documented-only until verified with real test accounts.

## Phase discipline
- Execute only the explicitly requested phase. Do not advance phases on your own.
- Phase 00 is read-only: no source edits, no dependency changes, no redesign.
- A Security Gate (plan Phase SG) must be Passed before Phase 05 slices that touch
  tenant boundaries, the CV pipeline, or scoring, and before any real company data is used.
- Do not install any dependency without the governance record in section 6 of the plan.

## Deployment reality
- Merging to main IS a production release (Vercel FE + Render API auto-deploy).
- One vertical slice = one branch + one self-contained, independently revertible PR.
- After every merge: run the production smoke check and log the commit hash.

## Design system
- DESIGN.md (google-labs-code/design.md format) is the machine-checkable source of
  truth for tokens; it must pass lint (PowerShell: use the `designmd` alias).
- UI terminology in Vietnamese follows GLOSSARY exactly. No dark mode in this redesign.
- Motion defaults to CSS/Web Animations API; animation libraries only via governance.
```

---

# 10. Immediate Next Steps

## Step 1 — Complete the Playwright Setup

- Verify the Playwright CLI.
- Verify the Agent Skill (if any is claimed).
- Check browser launch.
- Check screenshots.
- Check DOM snapshots.

## Step 2 — Open the Actual HireFlow Repository

- Check the repository path.
- Check the branch.
- Check the package manager.
- Check the package scripts.
- Check the runtime.
- Check the current project status.

## Step 3 — Prepare Phase 00 Entry **[D-06]**

- Confirm read access to the repository.
- Request/prepare test accounts per actor and the minimum verification dataset (§00.2), or record their absence as a known blocker.

## Step 4 — Begin Phase 00

Reconnaissance only. No redesign, no source-code edits.

## Step 5 — Complete the Phase 00 Documentation

Create the full documentation set in `docs/redesign/phase-00/` (structure in §00.13).

## Step 6 — Review Phase 00

Check: completeness; accuracy; evidence; unknowns; blockers; the Phase 01 backlog.

## Step 7 — Explicitly Approve Phase 01

Start the UX/UI Audit only after Phase 00 is reviewed. The Security Gate follows Phase 01 immediately.

---

# 11. Reference Links

## Governing process & principles

- https://github.com/mattpocock/skills
- https://github.com/multica-ai/andrej-karpathy-skills
- https://github.com/github/spec-kit (constitution idea only)

## Design & UX

- https://github.com/pbakaus/impeccable
- https://github.com/google-labs-code/design.md
- https://github.com/emilkowalski/skills
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://github.com/anthropics/skills

## Security

- https://github.com/cloudflare/security-audit-skill

## Engineering references (not governing processes)

- https://github.com/obra/superpowers (only the borrowings in §5.6)
- https://github.com/vercel-labs/agent-skills

## Browser Automation & Testing

- https://github.com/microsoft/playwright
- https://github.com/microsoft/playwright-mcp

## Accessibility & Auditing

- https://github.com/AccessLint/skills
- https://github.com/dequelabs/axe-core
- https://github.com/GoogleChrome/lighthouse

## Component Documentation

- https://storybook.js.org/

## Motion

- https://motion.dev/
- https://gsap.com/

## 3D (appendix only)

- https://threejs.org/
- https://r3f.docs.pmnd.rs/

---

# Appendix A — Decision Log with Rationale (the v1.2 Amendments)

*This appendix preserves, in condensed form, the reasoning behind every [D-xx] rule, so that a future reader — human or agent — can see why the consolidated plan differs from v1.1. The project owner may veto any single decision when approving this document; a veto must itself be recorded here.*

| ID | Decision | Rationale (condensed) |
|---|---|---|
| D-01 | mattpocock/skills is the single governing process; Superpowers is limited to three verified borrowings (systematic-debugging, verification-before-completion, git-worktrees) | v1.1 silently replaced a process that had been selected on direct evidence (both candidates read and scored for HireFlow) with one that had never been evaluated, and running two process frameworks creates two competing sources of truth for planning, ticketing, TDD, and review artifacts. Superpowers is not judged low quality — three of its capabilities fill real gaps — but replacement requires a new evidence-based decision, not silence. |
| D-02 | A mandatory Security Gate is inserted after Phase 01, blocking at-risk Phase 05 slices and any use of real company data until Passed | HireFlow's core risks are P0-class and invisible to UX audit: cross-tenant data exposure, prompt injection through CVs into the LLM extraction/scoring pipeline, and integrity of the evidence-quote mechanism. The live product still runs on sample data, making this the cheapest moment to audit. The cloudflare/security-audit-skill method (already in the project's reference set, with dedicated AI/LLM attack classes) fits this surface unusually well. |
| D-03 | impeccable `critique`/`audit` is mandatory input to Phase 01 (and a reviewer in Phase 03) | It is the strongest design-audit tool already in the project's reference set (scored critique, P0–P3 audit matching this plan's severity scale, and a deterministic 62-rule detector that runs in CI). Without it, Phase 01's visual-hierarchy and consistency findings are agent opinion rather than measured results — contradicting the plan's own evidence principle. Its output is input evidence, not automatic findings. |
| D-04 | The design system's source of truth is one `DESIGN.md` in the google-labs-code/design.md format, lint-checked in Phase 03's DoD | A prose-only token specification drifts away from code within a few slices; a lintable, exportable (to Tailwind/CSS) token file does not. The format was already evaluated and selected; v1.1 omitted it without a reason. |
| D-05 | axe-core and Lighthouse are approved tooling (verify-before-use); AccessLint skills may be used after reading them | Accessibility and web performance cannot be audited credibly by eye/LLM alone; no tool in the original reference set covers either. "Not starred/bookmarked" is not a prohibition — the plan's own §5.5/§6 verification and governance procedures are the correct gate, and audit-level use is pre-approved here while project installation still requires §6. |
| D-06 | Phase 00 has Entry Criteria (repo access, per-actor test accounts, a minimum verification dataset, live access); without test accounts/data the phase caps at PARTIALLY PASSED | Verified facts: the live homepage redirects unauthenticated visitors to `/login`; all live data is demo data; the signed-in MVP 3 flows and the `platform_admin` role are Documented-only. At least four Phase 00 workstreams (routes for signed-in actors, permission matrix, signed-in workflows, per-actor screenshots) are impossible to complete honestly without accounts and controlled data. Naming the blocker up front prevents a predictable mid-phase stall and prevents guessing. |
| D-07 | Phase 00 evidence scope is slimmed: full coverage at the mapping level, selective screenshot evidence (critical routes × representative states × 2 viewports); deliverables merged from 17 to ~10–12 files; per-phase effort and minimum cuts are stated | The audit unit (Route × Actor × 15+ states × Viewport × Interaction) explodes combinatorially, and v1.1's documentation volume (80+ files across phases) risks the documentation project consuming the redesign project for a small team. Reconnaissance value lies in the decisions it unlocks (Design DNA, Design System contents, slice order), which need complete maps but not exhaustive photography. |
| D-08 | Success metrics are added: baseline tasks T1–T3 measured in Phase 01, pass thresholds and 3–5 task-based walkthroughs in Phase 04, re-measurement in Phase 08 | v1.1's evidence system covered source and runtime but contained no evidence from users and no numeric definition of redesign success; a redesign could pass every gate while being no better for HR. Three timed core tasks plus honest walkthrough reporting are the minimum that breaks this self-confirmation loop. Where outside participants are impossible, reporting must say "internally validated only". |
| D-09 | Phase 02 must finalize the Vietnamese UI terminology (into the GLOSSARY); dark mode is officially out of scope for this redesign; the three pre-written sample directions are demoted to Appendix B | The live product's UI language is Vietnamese; terminology is part of the design system, and without a single source every Phase 05 slice would invent its own labels. Dark mode silently doubles token/surface work if discovered mid-implementation, so it is decided at the Phase 02 gate. Pre-written directions, even with a disclaimer, anchor exploration toward choosing among three boxes instead of deriving a direction from the brief and audit evidence. |
| D-10 | One vertical slice = one branch + one self-contained, independently revertible PR; a production smoke check and commit hash are logged after every merge; AppShell/navigation/permission changes need a behavior-preserving preparation PR or a feature flag | Verified deployment reality: Vercel (frontend) and Render (API) auto-deploy from `main`, and previews call the production API, so there is no true staging and every merge is a release. In that world a slice is a release unit, and rollback must be designed per slice (PR revert), not only at Phase 08. |
| D-11 | Motion defaults to CSS/Web Animations API, with libraries only via §6; Phase 07 (3D) is demoted to an appendix outside the main roadmap; visual regression is specified as Playwright screenshot comparison | Resolves three internal contradictions of v1.1: §1.4 vs. Phase 06 (animation libraries both discouraged and pre-selected); the roadmap vs. the "no decorative 3D" principle (a listed phase creates an expectation to execute it, and no ATS surface is known to need 3D); and §08.2 (visual regression was required but no method was ever specified). |

# Appendix B — Illustrative Design Direction Hypotheses (reference only, from v1.1 §02.3)

*These examples illustrate the *kind* of directions Phase 02 should produce. They are not candidates to select from [D-09].*

### Direction A — Professional Recruiting Workspace

Professional; structured; calm; trustworthy; productivity-focused. Suited to professional recruitment workflows and heavy data.

### Direction B — Editorial Talent Platform

Typography-led; editorial composition; strong content hierarchy; distinctive brand personality; a more expressive visual language. Suited if the product needs a strong brand imprint.

### Direction C — Modern Operations Console

Dense but readable; functional; information-rich; clear status visualization; efficient navigation. Suited to HR and actors processing large candidate volumes.

---

# Final Project Principle

**Understand the product before redesigning it.**

**Audit the experience before defining the new design.**

**Approve the Design DNA before building the Design System.**

**Validate critical workflows before rebuilding the frontend.**

**Rebuild incrementally while preserving the verified business foundation.**

**Measure and verify before declaring completion.**

HireFlow should not become merely a prettier version of the old application. It should become a coherent, usable, maintainable, and professionally designed recruitment product.

*End of the Consolidated Master Implementation Plan v1.2. This document is a plan and a set of governing rules — not an implementation order. Phase 00 begins only on the project owner's explicit instruction.*
