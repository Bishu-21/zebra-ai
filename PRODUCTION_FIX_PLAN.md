# Zebra AI — Production Hardening Plan

## Phase 1: Critical Security & Ownership Fixes ← CURRENT

### Bug 1 — `/api/user/credits` allows arbitrary credit injection
| | |
|---|---|
| **File** | `src/app/api/user/credits/route.ts` |
| **Severity** | 🔴 CRITICAL |
| **Bug** | Any authenticated user can POST `{ "amount": 999999 }` and add unlimited credits. No payment verification, no admin check, no origin validation. |
| **Fix** | Delete or disable the entire route. Credits should only be granted by a verified payment webhook (e.g., Razorpay). |

### Bug 2 — `/api/resumes` POST update path has no ownership check
| | |
|---|---|
| **File** | `src/app/api/resumes/route.ts` — lines 56-66 |
| **Severity** | 🔴 CRITICAL |
| **Bug** | When `id` is provided, the route does `.where(eq(resumesTable.id, id))` — it updates **any** resume by ID without checking `userId`. User A can overwrite User B's resume. |
| **Fix** | Add `AND userId = session.user.id` to the WHERE clause. Return 404 if no rows affected. |

### Bug 3 — `/api/jobs` PATCH has no ownership check
| | |
|---|---|
| **File** | `src/app/api/jobs/route.ts` — lines 89-102 |
| **Severity** | 🔴 CRITICAL |
| **Bug** | `.where(eq(jobsTable.id, id))` — any authenticated user can update any other user's job by guessing/knowing the UUID. |
| **Fix** | Add `AND userId = session.user.id` to the WHERE clause. |

### Bug 4 — `/api/jobs` DELETE has no ownership check
| | |
|---|---|
| **File** | `src/app/api/jobs/route.ts` — lines 128-129 |
| **Severity** | 🔴 CRITICAL |
| **Bug** | Same pattern — deletes by `id` only, no user filter. Any user can delete any user's jobs. |
| **Fix** | Add `AND userId = session.user.id` to the WHERE clause. |

### Bug 5 — `/api/ai/tailor` fetches any user's resume
| | |
|---|---|
| **File** | `src/app/api/ai/tailor/route.ts` — lines 42-44 |
| **Severity** | 🟠 HIGH |
| **Bug** | Looks up resume by `resumeId` alone: `eq(resumesTable.id, resumeId)`. User A can use User B's resume content for their ATS analysis and spend only their own credits. Also leaks resume content into AI prompts. |
| **Fix** | Add `AND userId = session.user.id` to the resume lookup. |

### Bug 6 — `/api/cover-letters` POST fetches any user's resume
| | |
|---|---|
| **File** | `src/app/api/cover-letters/route.ts` — lines 66-68 |
| **Severity** | 🟠 HIGH |
| **Bug** | Same as Bug 5 — looks up resume by ID without ownership filter. |
| **Fix** | Add `AND userId = session.user.id` to the resume lookup. |

### Bug 7 — `/dashboard/resumes/[id]/page.tsx` renders any user's resume
| | |
|---|---|
| **File** | `src/app/dashboard/resumes/[id]/page.tsx` — lines 29-31 |
| **Severity** | 🟠 HIGH |
| **Bug** | Server component fetches resume by ID only — no `userId` check. Anyone with the UUID can view/edit another user's resume in the editor. |
| **Fix** | Add `AND userId = session.user.id` to the DB query. |

---

## Phase 2: Input Validation & Error Hardening (TODO)
- Sanitize all user inputs before DB writes
- Prevent `error.message` leaks to client in production
- Rate-limit AI endpoints

## Phase 3: Auth & Session Hardening (TODO)
- CSRF protection audit
- Session expiry and refresh policies
- Secure cookie flags audit

## Phase 4: Observability & Monitoring (TODO)
- Structured logging
- Error tracking (Sentry/equivalent)
- Uptime monitoring

---

**Status:** ✅ Phase 1 — Complete.
- `tsc --noEmit` → 0 errors
- `npm run build` → Success (Next.js 16.2.4, 29/29 pages)
- Lint: 0 new errors introduced (76 pre-existing)
