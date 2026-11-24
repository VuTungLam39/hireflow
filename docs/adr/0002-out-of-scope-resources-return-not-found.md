---
status: accepted
---

# Out-of-scope resources are reported as "not found"

HireFlow is a multi-company marketplace where access is scoped by company and, inside a company, by department or assignment. When a user requests a resource outside their scope by ID, the system answers **not found** — in UI copy and in API behaviour — indistinguishable from an ID that does not exist. This applies to all scoped resources (applications, jobs, candidates, CVs, scores/rankings) across company and department scopes. Decided 2026-11-24 (Phase 00, grill round 1, DL-10); evidence: finding D-17, and the permission matrix verified 56/56 against the BE table.

**Boundary:** when the resource is *inside* the user's scope but their role lacks the specific action permission, permission-denied feedback is used, because existence is not a secret from them.

## Consequences

- No existence oracle: probing IDs across departments or companies yields no signal; consistent with tenant isolation as a hard rule. Matches the behaviour already implemented.
- Support and debugging are harder — a mistyped ID and an out-of-scope ID look identical; scope must be checked server-side. Users following a stale link get no hint. Both accepted: the alternative leaks the existence of personal data.

## Verification

The Security Gate must test this explicitly: authenticated requests with IDs from another department and another company must be indistinguishable from non-existent IDs (status, body shape; timing side-channels noted if observed). Any route returning 403 for an out-of-scope ID is a gate finding.

## Do not reverse casually

Changing an out-of-scope response to 403 "for clearer UX" re-opens the enumeration hole. Reversing this requires a new ADR that addresses the enumeration risk explicitly.
