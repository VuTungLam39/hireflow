# 05 — LLM Pipeline & Files (Areas F–G)

## F. CV pipeline & LLM surfaces
### Prompt injection via CV / JD
- Extraction (`ai/prompts/extract-cv.prompt.ts`): CV wrapped in `<cv>`; `<cv>`/`</cv>` stripped from content; system prompt states CV is data; output forced to a strict JSON schema (`additionalProperties: false`) and re-validated by DTO (`years` 0–50, string lengths). PII (email, phone, name) masked before the LLM. — Source-verified.
- **The LLM does not score.** Score = deterministic `computeScore` over requirement keywords (HR-defined) × verified evidence. Injection cannot write a score directly; it can only influence extracted `skills[].name/years/evidence`. → **SG-03** (HIGH) covers the two remaining levers (invisible text, unverified `years`).
- JD: written by in-tenant HR (insider); requirement suggestions are advisory and edited by HR. No finding.
- Live-LLM injection behaviour: **Not verified** (needs real provider; no paid quota spent).

### Quote integrity
- Mechanism **present** (BR-AI-03): evidence must be a substring of the normalised CV text, else `match = 0` and flag `UNVERIFIED_EVIDENCE`, rejected quote kept for review. — Source-verified. Not CRITICAL ("mechanism absent" is false).
- Limitation: verifies the text layer, not human visibility → part of SG-03.

### /ai-chat [DL-01, SG-F2]
- Auth: JWT + `ai:chat` (Admin, HR, HM). Interviewer and platform_admin excluded.
- Data reach: CV chunks filtered by `organization_id`, plus department/assigned-HM scope for HM (`rag/retrieval.ts`). Cross-tenant answer: not possible from source.
- Injection: CV chunks are untrusted context; prompt marks them as data and strips `<cv_context>` tags; answers are rendered as text (no `dangerouslySetInnerHTML` anywhere in `fe/src`). Residual risk: a crafted CV could bias a chat answer inside its own tenant — covered by SG-03 remediation (adversarial eval).
- **SG-F2 disposition: cleared with evidence for cross-tenant retrieval; injection residual folded into SG-03.**

### Cost / quota abuse
- Per-organization daily limits for CV scoring and chat (`ai-quota.service.ts`), set by platform_admin; consumed by pipeline, chat, requirement suggestions, interview questions. Public apply throttled 30/h/IP. Over-limit CVs are deferred to the next day, not dropped. — Source-verified. No finding; distributed-IP flooding of one company's quota is bounded by that company's daily limit (availability of scoring only).

## G. File handling
| Check | Result | Evidence |
|---|---|---|
| Accepted types | PDF / DOCX only; declared MIME **and** magic bytes must agree | Source-verified (`files/cv-file.rules.ts`) |
| Size | 5 MB max, empty rejected | Source-verified |
| Storage key | content hash; original name kept only as metadata (≤255) | Source-verified |
| Serving | `GET /files/:id/url` (JWT + `cv:read` + candidate scope) → 5-min presigned URL (S3/B2) or HMAC-signed local URL; access audited (`CV_VIEWED`) | Source-verified |
| Signed content endpoint | HMAC over `id.expires`, constant-time compare, expiry checked; bad signature → 400/404 | Source + Runtime (prod, bad signature) |
| Cross-tenant file fetch by ID | refused (404, identical to non-existent) | Runtime-verified (local) |
| Executable content types | served MIME limited to the stored allowlist (pdf/docx; media jpg/png/webp + `nosniff`) | Source-verified |
| B2 bucket ACL (private?) | **Not verified** — provider setting outside the repo | owner check, file 08 |

No finding in area G.
