# Candidates are guests authenticated by a token link, not account holders

Candidates apply on public pages without creating an account and later return only through a tracking link emailed after they apply (`/applications/track?token=…`). The redesign keeps this: no candidate login, profile or dashboard is introduced, and candidate-facing screens are designed as guest flows. Decided by the project owner on 2026-11-24 (Phase 00, DL-02) after reconnaissance showed no candidate role exists in the code, contradicting the plan's actor list.

## Consequences

- Phase 00/01 actor matrices treat Candidate as a guest column; "test account per actor" does not apply to candidates.
- The tracking link is the candidate's only credential, which makes `/applications/track` a security surface (critical route CR-13, Security Gate flag SG-F3).
