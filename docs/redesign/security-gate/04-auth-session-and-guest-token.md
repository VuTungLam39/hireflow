# 04 — Auth, Session & Guest Token (Areas D–E)

## D. Authentication & session
| Check | Result | Evidence |
|---|---|---|
| Login throttle | 5/60 s per email, blocked 60 s, then resets; 30/60 s per IP | Source-verified (`user-throttler.guard.ts`); Phase 00 runtime observation consistent (D-21) |
| User enumeration at login | unknown email runs bcrypt on a dummy hash; account/email/org state revealed only after a correct password | Source-verified |
| Access token | Bearer, in memory (FE), 900 s; user + org re-read each request | Source-verified |
| Refresh token | httpOnly, Secure in prod, `SameSite=Strict`, path `/api/v1/auth`, rotation, reuse → family revoked | Source-verified |
| Refresh for disabled user/org | refused and all user tokens revoked | Source-verified (`auth.service.ts:85-93`) |
| Newly disabled company's existing sessions | blocked at next request (`ORG_DISABLED` 403 in `JwtStrategy.validate`) | Source-verified; runtime needs a write (file 08) |
| Logout | revokes refresh family; access token valid ≤900 s → **SG-07** (LOW, mitigated) | Source-verified |
| Password change | revokes all other refresh families | Source-verified |
| Guest 401 refresh noise (Phase 00) | expected: SPA calls `/auth/refresh` with no cookie → 401; flow is sound, purely cosmetic console noise | Source-verified; LOW, no separate finding |
| Forgot/reset password | **Missing → SG-06** (LOW): recovery needs an Admin; platform recovery for a lone company Admin needs DB access | Source-verified |
| Unauthenticated access to protected endpoints (prod) | 9 sampled endpoints → 401 | Runtime-verified (prod, read-only) |
| API security headers (prod) | helmet: CSP, HSTS, `no-referrer`, nosniff, `SAMEORIGIN` | Runtime-verified (prod) |

## E. Guest / candidate token (ADR-0001) [SG-F3 part 1]
| Property | Finding | Evidence |
|---|---|---|
| Entropy / format | 32 random bytes, base64url (256 bit) | Source-verified |
| Storage | SHA hash only (`auth_tokens.token_hash`) | Source-verified |
| Expiry | 90 days | Source-verified |
| Enumeration | infeasible; endpoint throttled 30/min/IP; invalid → 400 `TOKEN_INVALID` | Source + Runtime (prod, invalid token) |
| Blast radius | one application; returns job title, company, stage, appliedAt, withdrawable | Source-verified |
| Reuse / forwarding | bearer semantics — anyone holding the link can view and **withdraw** the application for 90 days | Source-verified (by design of ADR-0001) |
| Leakage | query string → access logs, history; echoed in error `path` → **SG-05** (LOW) | Runtime-verified (prod) |
| Valid-token view at runtime | Not verified (would need a real application → write) | file 08 |

**SG-F3 (token part) disposition: confirmed finding SG-05 (LOW); otherwise cleared with evidence.**
