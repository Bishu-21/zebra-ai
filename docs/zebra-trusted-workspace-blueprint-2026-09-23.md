# Zebra trusted workspace: product and delivery blueprint

**Status:** Working blueprint for founder alpha. No implementation is authorized by this document alone.  
**Owner:** Zebra AI  
**First user:** Bishal Sarkar  
**Date:** 2026-09-23

## Delivery log

- **2026-09-23 — first working slice:** Zebu text accepts a job URL in a role-matching request and opens the role-match screen with that URL. The screen imports a public job URL or uploaded PDF/TXT, lets the user review the extracted details, and then uses the existing role-match analysis. URL import preserves readable page text and falls back to page metadata if AI field extraction fails. This slice does not yet create a durable task run, connect external accounts, or complete the full reviewed resume export journey. `npm run check`: 268 tests passed, lint/typecheck/build passed.

## 1. Product outcome

Zebra should let a user complete a career task in one workspace: bring in source material, understand it, make grounded edits, review them, and export or apply the result. Zebu is the task guide and operator inside Zebra, not merely a page navigator. Gemini remains an optional model fallback; the product should remove the need to use Gemini's website or other general chat tools to finish routine Zebra work.

The founder alpha succeeds when Bishal can start with his existing resume, a job URL or PDF, and optional GitHub/LinkedIn evidence, then reach a reviewed resume and profile draft without copying the same material between screens or external AI tools.

## 2. Product principles and non-negotiable constraints

1. **One task, one visible workspace.** Every input, source, decision, draft, error, and final artifact belongs to a task run. The user can leave and resume it.
2. **Source before claim.** Any factual statement in a resume or profile draft must link to a user-owned source, a permitted connector result, or an explicit user confirmation. Missing evidence becomes a question, not an invented metric.
3. **Capability honesty.** A connected account does not imply access to every API or permission to automate its website. Show the exact granted scopes and current capability.
4. **Review before consequential writes.** Zebra can save its own drafts automatically. Publishing to another service, changing an external account, submitting an application, or sending a message requires the user's explicit review and action when the service permits it.
5. **Recoverable work.** A failed importer or agent step leaves a useful partial result, a clear reason, and a retry path. Do not charge for a step that failed to produce its promised artifact.
6. **Private by default.** Every task, artifact, connection, token reference, and run is owned by one user. Authorization is checked at both the API and database layer.
7. **Speed through orchestration.** Run independent reads in parallel, cache source snapshots, and stream step progress. Do not fake terminal-like speed by hiding unfinished work.
8. **Accessibility and predictable UI.** The existing Zebu overlay should remain keyboard usable, preserve context when opened, and show a clear task tree with current state, next action, and human review points.

## 3. Current state and verified gaps

| Area | Present in repo | Gap to close |
| --- | --- | --- |
| Job URL import | `src/app/api/jobs/scrape/route.ts` and `AddApplicationDrawer.tsx` | Only one entry point uses it; failures are generic; role match and application evidence still request pasted text; PDF job descriptions need a shared intake path. |
| Resume evidence | Saved resumes, upload/ingestion, analysis, editing, PDF export | The user must move between screens, choose inputs again, and invoke separate tools. Verify which resume content is current before using it. |
| Zebu | Text/voice overlay and typed navigation/search actions | `zebu-contract.ts` allows one action per turn and does not cover LinkedIn; opening a flow does not carry a durable task to a final artifact. |
| LinkedIn optimizer | Audit, export text intake, evidence-linked draft review | Paste or export first; no authorized LinkedIn account read; audit history fails until its pending database migration is applied. |
| GitHub | Public repository analysis by URL in `project-analyse` | No user-authorized GitHub App, selected-repository permissions, connection status, or source refresh history. |
| External account connections | Existing app authentication | No connector registry, encrypted credential lifecycle, consent UI, or per-connector capability reporting. |

The current database lacks `linkedin_audits`; migrations `drizzle/0012_linkedin_audits.sql` and `drizzle/0013_linkedin_workflow_rls.sql` are pending. Repair and verify this before founder testing of LinkedIn history. The intermittent `/api/auth/get-session` 500 is a separate issue and needs its own trace. Do not infer the cause from the LinkedIn table error.

## 4. The founder alpha journey

**Entry:** In Zebu, type or say “Help me tailor my resume for this job” and provide a URL or PDF. The same task is accessible from Applications and Resumes.

1. **Choose source.** Zebra offers likely existing resumes with title, modified date, and a preview. The user selects the canonical base resume. No silent selection among similarly named versions.
2. **Import role.** Zebra fetches a permitted public job page or reads an uploaded PDF. It extracts company, title, location, requirements, and full description with source spans and confidence. It flags login walls, expired listings, empty pages, and conflicting metadata. The user corrects extracted fields once.
3. **Build evidence map.** Zebra links relevant resume experience, work items, portfolio pieces, and optionally authorized GitHub projects to the job requirements. It shows “supported,” “partially supported,” and “missing evidence.”
4. **Create work.** Zebu produces a concise task plan, a role match, and editable resume changes. Each suggested bullet shows its source and explains the change. Unsupported achievements are withheld as questions.
5. **Review and export.** The user accepts, edits, or rejects changes in the resume editor with live preview. Zebra saves a named version, runs existing export checks, and produces the requested PDF. The task retains all inputs and decisions.
6. **Continue to LinkedIn.** With the same approved evidence, Zebra proposes headline, About, experience, and Featured changes. LinkedIn account capabilities determine whether Zebra can read any profile data; otherwise it requests a user export or specific missing fields. Drafts remain editable and copyable.

The workflow should never require users to paste a job description already captured from their supplied link or PDF. Pasting is a recovery option when the source cannot be accessed or parsed.

## 5. Zebu interaction and task tree

Keep the Zebu overlay as the persistent front door. Add a compact task panel with: goal, source cards, step progress, current question, proposed action, and resulting artifact. A user may expand each step for provenance and technical detail. Navigation should carry the task ID and selected entities into the destination screen so “open my resume” actually opens the chosen resume.

The durable task tree is:

`run → intake → sources → extraction → evidence map → proposals → verification → user review → saved artifact → optional external action`

Each node has `pending | running | needs_input | completed | failed | canceled`, timestamps, idempotency key, owner, input version, output artifact IDs, and an error code safe to display. A retry resumes the failed node from saved inputs; it does not repeat completed credit-bearing work. The UI shows real progress from persisted state, including after refresh or reconnect.

### Six bounded agent roles

These are server-side roles with typed inputs and outputs, not six free-form chatbots debating indefinitely:

1. **Coordinator:** turns a user goal into a bounded task graph, chooses authorized tools, tracks state, and asks only blocking questions.
2. **Source agent:** imports and normalizes resume, job, PDF, portfolio, and connector data; reports source quality and access failures.
3. **Role agent:** extracts job requirements and compares them with user evidence.
4. **Resume agent:** drafts changes in the existing resume schema, preserving confirmed facts and formatting constraints.
5. **Profile agent:** proposes LinkedIn and portfolio text from the same approved evidence; uses only sections supported by the actual source and current interface.
6. **Verifier:** checks every proposed claim against source spans, checks schema/length constraints, detects contradictions, and blocks unsupported output.

Deterministic parsers, validators, database queries, and exports remain ordinary tools. Agent roles use the existing Azure-first generation path with Gemini fallback where configured; the workflow does not depend on a user visiting Gemini's website. Roles may run concurrently only when their inputs do not depend on one another.

## 6. Shared intake and source contract

Create one reusable intake service for job URLs, uploaded job PDFs, resume PDF/DOCX/TXT, user-entered text, and connector snapshots. Every normalized source records `ownerId`, `kind`, `origin`, `canonicalUrl` if any, `retrievedAt`, `contentHash`, `parserVersion`, `status`, and bounded extracted text. Keep the original file or URL reference according to retention policy. Attach provenance spans to extracted facts.

Job URL import order: validate and resolve the URL against SSRF rules; prefer structured job-posting metadata when present; extract readable page text; use model-assisted field extraction only after deterministic extraction; validate outputs against source text; let the user correct fields. A page requiring sign-in or blocking automation receives a truthful status and offers PDF, file, or manual entry. A PDF URL is treated as a document and parsed through the document path. Do not ask the model to invent missing company or role values.

Inputs require file size/type limits, decompression and page limits, URL redirect and DNS checks, timeouts, content length limits, rate limits, prompt-injection isolation, and malware scanning where file storage requires it. User-supplied documents and web pages are data, never instructions for agent tool use.

## 7. Connector architecture and exact capabilities

Use a connector registry with `provider`, `status`, `scopes`, `readCapabilities`, `writeCapabilities`, `lastSync`, `expiresAt`, and `disconnect`. Tokens are encrypted server-side, never exposed to browser code or prompts. Consent is specific and revocable. A failed/revoked connection does not corrupt previously reviewed work; the UI marks snapshots stale.

| Connector | Alpha capability | Restriction and fallback |
| --- | --- | --- |
| GitHub App | User chooses repositories; read-only metadata, README, selected files, and project links for evidence | Request minimum GitHub App permissions. Do not turn repository activity into employment claims. Public URL analysis remains available. |
| LinkedIn | Offer connection only for scopes and APIs actually granted to Zebra. Identity sign-in, if available, is labeled identity, not full profile sync. | Full profile read/write requires LinkedIn-approved access. User consent alone does not authorize website scraping or browser automation. Until approved access exists, use a user-provided profile export and focused prompts; review drafts and copy or open LinkedIn for user application. |
| Overleaf | Support user-uploaded `.tex`/project archive and PDF first; evaluate Git/GitHub sync for users whose Overleaf plan supports it | Do not imply universal Overleaf OAuth or automatic project access. Preserve LaTeX formatting when importing or producing compatible source. |
| Job sources | Public job URL and PDF ingestion through one service | Respect source access restrictions; show blocked/expired status and recovery options. |

Keep connector access separate from application login. The Settings connection card must show **Connected**, **Available to connect**, **Limited**, or **Unavailable**, plus exactly what Zebra can do. Never show a generic “LinkedIn connected” badge if Zebra has only identity data.

### LinkedIn authorized API path (verified 2026-09-23)

LinkedIn does have a proper member authorization flow. Zebra registers a LinkedIn developer application, requests a product and its scopes, sends the member to LinkedIn's OAuth consent page, receives an authorization code, and exchanges it server-side for an access token. The member's consent grants only the scopes already enabled for Zebra's application. A user may revoke access; Zebra must then stop fetching. Do not collect a LinkedIn password or session cookie.

| Access tier | API/product | What Zebra can honestly do | Availability |
| --- | --- | --- | --- |
| Identity | Sign In with LinkedIn using OpenID Connect; `openid profile email`; `/v2/userinfo` | Read subject ID, name, picture, locale, and optional email. Link the right LinkedIn account to a Zebra user. | Self-serve product request in the LinkedIn Developer Portal; confirm activation for Zebra's app. No About, experience, skills, or full profile scan. |
| Member posting | Share on LinkedIn / applicable `w_member_social` API | If enabled, publish a reviewed member post; this does not edit the member's profile. | Separate product/scope; verify currently granted scope and supported API version before enabling UI. |
| Profile read | Profile API with approved `r_basicprofile` or additional partner permissions | Read only the fields LinkedIn approves for Zebra, subject to member privacy and data restrictions. Basic profile access includes headline/vanity name but does not imply About, positions, skills, and every section. | Restricted to approved developers. Apply to LinkedIn; inspect written terms and exact field permissions before implementation. |
| Profile editing | Profile Edit APIs for specific resources | Edit only the resources and operations explicitly approved for Zebra and the member. | Restricted to approved developers; no general profile-edit promise. |
| Member post reading | Restricted `r_member_social` in applicable Posts API | Read permitted member posts where approved. | Approved users only; separate from profile read. |

**Approval workstream:** (1) create/verify Zebra's developer app and company association; (2) list enabled products and scopes in the portal; (3) implement and test OIDC with a test account, including callback state validation, token expiry, reconnect, and disconnect; (4) submit Zebra's precise profile-optimization use case for Profile API access through LinkedIn's developer/partner process; (5) record LinkedIn's response, approved fields, storage restrictions, rates, and permitted operations in the connector registry; (6) enable a capability only after a real token and API response prove it works. If profile access is declined, retain the first-class export/import path and continue providing grounded optimization without describing it as automatic profile sync.

The distinction is between **authorized API retrieval** and **website scraping**. The former can be built with the appropriate app approval, scope, and member consent. Consent alone does not turn an unsupported API into an available one or authorize browser scraping. No code should automate LinkedIn's logged-in web UI as a substitute for missing API access.

## 8. Data security, RLS, and consent

- Own all rows by authenticated `user_id`: task runs and nodes, sources, source spans, artifacts, proposals, decisions, connector accounts, and sync logs. All list/read/update/delete routes scope by user ID. Database RLS is defense in depth; test direct cross-user reads and writes with actual app roles.
- Store provider credentials in an encrypted secret store or envelope-encrypted DB column with key rotation. Store only a credential reference in task records. Redact tokens and sensitive document contents from logs and telemetry.
- Connector callbacks validate state and PKCE where supported; handle expiration, refresh, revocation, and disconnect. Disconnect prevents future sync and queues token deletion. User data deletion follows a documented retention workflow.
- External actions require a review screen showing target account, exact payload, permission used, and expected effect. Record a user approval event and a provider receipt. Use idempotency keys for writes.
- Show source freshness and avoid silently reusing changed job postings or stale profiles. Before a rerun, compare content hashes and ask whether to use the new source.

## 9. Delivery sequence with independent release gates

### Phase 0 — Stabilize the current alpha surface

- Apply pending LinkedIn migrations in a controlled environment; verify journal, table, policies, per-user history, and no duplicate credit charge on retries.
- Trace the intermittent session 500 with request IDs and database timings; repair the observed cause.
- Test Zebu opening a selected resume; inventory every action that only navigates and every flow requiring re-entry of existing data.
- Gate: existing LinkedIn and resume flows load for Bishal, with no unhandled server error or silent empty state.

### Phase 1 — Shared job and resume intake

- Consolidate URL/PDF/text job intake behind one API and UI component used by Add Application, Role Match, and Zebu.
- Improve extraction and provenance; add exact error states and a correction screen.
- Preserve the selected base resume and job evidence across screens.
- Gate: Bishal provides one real job URL and one PDF, sees correct source text and fields, corrects any errors once, and does not paste the whole job description.

### Phase 2 — Durable Zebu task execution

- Add task/run tables and an authorized action registry. Implement coordinator, source, role, resume, and verifier roles; profile role follows when LinkedIn evidence path is ready.
- Persist nodes and outputs, stream progress, support resume/retry/cancel, and link Zebu to the existing editor and export routes.
- Gate: one Zebu request ends in a saved, reviewed resume version and downloadable PDF; refresh and a simulated model timeout preserve the run.

### Phase 3 — GitHub connection and proof reuse

- Register a GitHub App with read-only, selected-repository access; implement install/callback, credential lifecycle, repository picker, snapshot sync, and disconnect.
- Feed approved repository facts into the evidence map and LinkedIn Featured recommendations.
- Gate: connect, select one repo, inspect cited evidence, disconnect, and confirm no further access; another user cannot read the connection or snapshot.

### Phase 4 — LinkedIn workflow and connector honesty

- Replace paste-first UI with source selection and a targeted missing-information review. Reuse existing resume, portfolio, and GitHub evidence.
- Implement only LinkedIn API scopes actually approved for Zebra. Keep export import and manual review as first-class paths.
- Generate editable profile proposals with citations and exact unsupported-claim warnings. Let the user copy each approved section or use authorized provider actions if available.
- Gate: Bishal receives a useful headline/About/experience proposal without retyping existing Zebra evidence; no false claim that Zebra synced or published a LinkedIn profile.

### Phase 5 — Polish and expand

- Add Overleaf source route if justified by alpha usage, voice parity for Zebu tasks, reusable connector framework for more services, analytics, and responsive overlay improvements.
- Gate: measure reduced external tool switching and task completion across multiple alpha users before broad release.

## 10. Alpha test protocol and success metrics

Use Bishal's own account first, with explicit sample inputs and permission to use each source. Record screen capture or step timestamps and run IDs, but redact private resume text and credentials in shared reports.

**Scenario A:** Existing resume + accessible job URL → verified role facts → evidence map → reviewed resume version → PDF.  
**Scenario B:** Job description PDF → same result, with no URL.  
**Scenario C:** Login-walled or expired URL → truthful failure, upload/manual recovery, no invented facts.  
**Scenario D:** Model timeout during drafting → saved progress, one-click retry, no duplicate charge.  
**Scenario E:** GitHub selected-repo connection → cited project evidence → disconnect and access revocation.  
**Scenario F:** LinkedIn profile draft from existing evidence + export/targeted questions, with missing data clearly marked.  
**Scenario G:** Second test account attempts direct API/DB access to Bishal's runs, sources, drafts, and connections → denied.

Track: completion rate, elapsed time to first useful result and final artifact, number of paste/re-entry events, number of external AI/browser handoffs, unsupported factual claims, extraction corrections, retry recovery rate, cross-user access failures, and qualitative trust score after each run. **Release blockers:** any cross-user data exposure, unauthorized external write, unsupported metric or credential claim in an accepted draft, or silent loss of user work. The alpha target is zero external AI handoffs for Scenarios A and B; numeric speed targets should be set from the first measured baseline, not guessed.

## 11. Implementation work packages and dependencies

1. **Reliability repair:** migrations, session tracing, LinkedIn history, and a documented clean local/staging setup. Depends on no new subsystem.
2. **Unified intake:** source schema/API, URL/PDF parsers, provenance and correction UI. Depends on package 1 for stable auth and DB.
3. **Task engine:** durable run/node schema, idempotency, retries, authorization, events, task UI. Depends on package 2's source contract.
4. **Zebu orchestration:** typed specialist tools and evidence verifier wired to existing resume editor/export. Depends on package 3.
5. **GitHub connector:** app registration, secure token lifecycle, selected-repo sync, evidence adapter. Can begin after package 2; integrate with package 4 when ready.
6. **LinkedIn experience:** source selection, audit/draft redesign, truthful connection capability UI, approved API path if available. Depends on packages 1, 2, and 4; GitHub evidence is optional.
7. **Overleaf and voice expansion:** only after the first end-to-end alpha has measured demand and reliability.

Each package needs its own detailed implementation plan, tests, and review gate. Do not start all connectors and all six roles in one change set. Preserve the existing Gemini fallback and current working-tree changes while isolating implementation work for review.

## 12. Open product decisions to settle before detailed implementation plans

1. What counts as the canonical resume when a user has multiple saved versions? Proposed: explicit selection, then remember per task.
2. Should Zebra retain original uploaded job PDFs and LaTeX sources or only normalized text plus a secure file reference? Proposed: user-visible retention control and bounded default retention.
3. What external action may Zebra take after approval? Proposed alpha: no external LinkedIn writes; read-only GitHub only.
4. Which task result matters most to Bishal first: a finished role-tailored resume, a LinkedIn profile draft, or an application package? Proposed: role-tailored resume, then LinkedIn draft from the same evidence.
5. Which staging environment and test accounts are available for RLS and connector callback tests? No production data migration should be treated as verified by local unit tests alone.

## 13. Source and capability notes

- The user-supplied `implementation_plan.md` is background, not a source of platform permissions or verified algorithm weights. Avoid product claims such as fixed LinkedIn headline ranking multipliers, engagement thresholds, or guaranteed distribution.
- LinkedIn Profile API access is restricted to approved developers: https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api?context=linkedin%2Fconsumer%2Fcontext
- LinkedIn prohibits third-party scraping/browser automation of its site: https://www.linkedin.com/help/linkedin/answer/a1341387
- LinkedIn sign-in gives limited member identity information: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
- GitHub Apps offer granular, read-only permissions and selected repository access: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app
- Overleaf documents Git and GitHub synchronization as plan-dependent features: https://docs.overleaf.com/integrations-and-add-ons/git-integration-and-github-synchronization
