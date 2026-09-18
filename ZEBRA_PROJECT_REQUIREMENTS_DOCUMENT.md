# Zebra AI - Product Requirements Document

**Document status:** Ready for team review  
**Product stage:** Focused MVP and design-partner validation  
**Primary market:** India  
**Primary user:** Final-year students and recent graduates  
**Working product category:** Evidence-backed application-readiness workspace  
**Version:** 1.0  
**Date:** 10 September 2026

---

## 1. Executive summary

Zebra AI helps an early-career candidate turn scattered work into a clear, job-specific application. The user adds a job, imports or selects a resume, attaches relevant projects and certificates, sees which requirements are supported or missing, reviews proposed changes, exports the final documents, and tracks what happens next.

The MVP is intentionally narrower than a general career platform. Its purpose is to complete one important loop reliably:

> **Add job -> connect proof -> approve changes -> export application -> track outcome**

Zebra must not invent achievements, imply guaranteed hiring outcomes, or publish private content without explicit consent. Its distinguishing feature is traceability: a meaningful application claim should be connected to candidate-provided evidence or be clearly marked as unsupported.

---

## 2. Problem definition

### 2.1 Problem statement

Many students and recent graduates have projects, certificates, internships, hackathons, courses, or independent work. These records are distributed across resumes, GitHub repositories, cloud folders, certificate links, and memory. When a relevant job appears, the candidate has to reconstruct this material quickly, decide what matters, rewrite a resume, verify every claim, and remember the follow-up.

Existing products usually solve one part of this work: document formatting, text generation, job discovery, or status tracking. The user remains responsible for connecting the full chain.

### 2.2 The specific failure Zebra addresses

The system loses context between **work completed** and **claim submitted**. This creates four practical risks:

1. Relevant work is omitted.
2. Weakly described work appears less valuable than it is.
3. Generic rewriting introduces claims the candidate cannot defend.
4. Each new application begins almost from zero.

### 2.3 Product hypothesis

If Zebra gives users a reusable record of their work and explicitly maps that record to a job's requirements, users will complete evidence-backed applications faster, repeat the workflow for additional jobs, and trust suggested edits more than whole-document generation.

---

## 3. Product vision and principles

### 3.1 Vision

Make real work easier to recognize, explain, and carry into opportunity.

### 3.2 Product promise

Zebra helps students keep track of what they have done, show it properly for a specific role, and prepare a complete application without starting again each time.

### 3.3 Non-negotiable principles

1. **Evidence before wording.** Zebra first determines what the user can support, then helps express it.
2. **The user approves the claim.** AI suggestions are never silently committed.
3. **Missing means missing.** The system asks for evidence instead of fabricating it.
4. **One visible next step.** The interface guides the user through the application rather than exposing a toolbox of unrelated AI actions.
5. **Private by default.** Work, resumes, links, and outcomes remain private until explicitly shared.
6. **Outcomes over activity.** Success is a reviewed and exported application, not the number of AI generations.
7. **Provider independence.** Models and extraction services are replaceable infrastructure, not the product's identity.

---

## 4. Goals and non-goals

### 4.1 MVP goals

- Let a new user complete one real application from job entry to export.
- Create a reusable, structured record of projects, certificates, skills, actions, results, and proof links.
- Make job requirements and supporting evidence visible in the same workspace.
- Ensure suggested changes are reviewable, editable, rejectable, reversible, and traceable.
- Produce a structured, editable job-specific resume version and a reliable PDF.
- Track status, dates, notes, follow-ups, and outcomes.
- Measure completion, speed, repeat use, unsupported suggestions, and cost.

### 4.2 Non-goals for the MVP

- Automatic job application submission.
- A general job-search engine or broad scraping platform.
- Placement or interview guarantees.
- A universal ATS-certification claim.
- A complete learning, DSA, interview-coaching, mentorship, or social network platform.
- Recruiter-side ranking of candidates.
- Autonomous publication of user data.
- Training a proprietary foundation model.

---

## 5. Users and stakeholders

### 5.1 Primary persona: the evidence-rich, presentation-poor student

**Profile:** final-year student or graduate with at least one project, course, internship, certificate, hackathon, freelance task, or self-directed work item.  
**Need:** prepare a credible application for a real role.  
**Difficulty:** cannot decide what to include, explain the work clearly, or maintain different resume versions.  
**Success condition:** exports an application whose meaningful claims they understand and can defend.

### 5.2 Secondary persona: the placement coordinator

**Need:** help a cohort complete applications consistently without rewriting every student's resume.  
**Permitted visibility:** aggregate participation and completion metrics only, unless the student explicitly shares content.  
**Not permitted by default:** private resumes, project details, proof links, job choices, or outcomes at individual level.

### 5.3 Internal stakeholders

- Product and user research.
- Full-stack engineering.
- AI/data engineering.
- Design and content.
- Security and operations.
- Partnerships and pilot delivery.

---

## 6. Primary user journey

### 6.1 Happy path

1. User creates an account or signs in.
2. User selects **Start an application**.
3. User enters the company, role, job description or URL, location, and deadline.
4. User imports or selects a master resume.
5. Zebra extracts job requirements and separates must-have, preferred, and hard-eligibility items.
6. User selects existing work and certifications or adds new evidence.
7. Zebra creates a requirement-to-evidence matrix.
8. User reviews supported, weak, and missing-evidence items.
9. Zebra proposes grounded, section-level resume changes.
10. User applies, edits, rejects, or undoes each change.
11. Zebra compiles a new, editable resume version.
12. User performs a final preflight review.
13. User exports a PDF and may generate an optional cover letter or selected public portfolio.
14. User marks the application as submitted and records the next follow-up.
15. User later records interview notes or the application outcome.

### 6.2 Failure recovery

- If extraction fails, preserve the uploaded record and allow manual text entry.
- If AI generation fails, retain the application state and permit retry without double charging.
- If evidence is missing, allow the user to add it or continue with a visible warning.
- If export fails, retain the approved resume version and offer a retry.
- If payment verification is interrupted, reconcile the transaction without granting duplicate credits.
- If the user leaves, reopen the application at the last completed step.

---

## 7. Scope and implementation status

| Capability | Current repository status | MVP decision |
|---|---|---|
| Authentication and ownership | Implemented | Retain and audit |
| Resume import, editor, versions, share, PDF | Implemented | Make part of application flow |
| Application capture and tracking | Implemented | Make canonical starting point |
| Work items and certifications | Implemented | Promote as reusable proof |
| Evidence nodes and requirement matrix | Implemented | Make primary differentiator |
| AI suggestions and approvals | Implemented in core flow | Standardize Apply/Edit/Reject/Undo |
| Tailored resume compilation | Implemented | Preserve lineage and editability |
| Cover letter | Implemented | Optional post-resume step |
| Portfolio publishing | Implemented | Private by default; selected output |
| Payments and credits | Implemented | Reframe as application packs; add reconciliation |
| Background-job data model | Implemented | Complete durable worker execution |
| Product analytics | Partial | Add canonical funnel events |
| Institution dashboard | Not in MVP | Validate manually before building |
| Automatic submission | Not planned | Remain out of scope |

---

## 8. Functional requirements

Priority definitions: **P0** is required for a trustworthy pilot; **P1** is required for a complete paid MVP; **P2** may follow validation.

### 8.1 Accounts and privacy

**FR-001 - Account access (P0)**  
The system shall support secure registration, sign-in, sign-out, session management, and account recovery where configured.

**Acceptance criteria**

- Unauthenticated users cannot access private workspace routes.
- Sessions expire according to server policy.
- Authentication errors use actionable, non-sensitive messages.

**FR-002 - Record ownership (P0)**  
Every private read, write, delete, export, share, and AI operation shall validate the authenticated user's ownership.

**Acceptance criteria**

- Changing a resource ID to another user's ID returns a non-disclosing authorization response.
- Ownership checks cover resumes, versions, work, evidence, applications, changes, portfolios, exports, payments, and AI operations.

**FR-003 - Privacy by default (P0)**  
New resumes, work items, evidence, and portfolios shall be private by default.

**Acceptance criteria**

- No public route exposes an item until the user explicitly publishes or shares it.
- The publication screen lists the exact fields and items that will become public.
- Revocation invalidates public access.

### 8.2 Resume intake and management

**FR-010 - Resume import (P0)**  
The user shall be able to import PDF, DOCX, and TXT files within configured type and size limits.

**Acceptance criteria**

- The server validates extension, MIME type, file signature where applicable, and size.
- Extracted content is shown for review before it becomes the canonical structured resume.
- Failed extraction does not destroy the user's application draft.

**FR-011 - Structured resume editing (P0)**  
The system shall maintain resume content in a versioned, typed structure suitable for editing and rendering.

**Acceptance criteria**

- Contact information, summary, experience, education, projects, certifications, and skills remain individually editable.
- The system does not alternate ambiguously between raw text and serialized structured content.
- Validation errors identify the field requiring correction.

**FR-012 - Resume versions (P0)**  
The system shall create job-specific versions without overwriting the master resume.

**Acceptance criteria**

- Each version records its parent resume, application, target company, target role, and creation time.
- The user can reopen and edit any retained version.
- The application records the exact version exported.

### 8.3 Work and evidence

**FR-020 - Work item capture (P0)**  
The user shall be able to store projects, internships, hackathons, courses, awards, and other relevant work.

**Required fields**

- Title.
- Category.
- Description of work.
- Tools or skills.
- Result or learning.
- Optional proof URL.
- Date range.
- Visibility.

**FR-021 - Evidence node creation (P0)**  
The system shall normalize relevant work into evidence nodes.

**Required evidence-node fields**

- Context or project.
- Skill.
- Action performed.
- Optional measurable outcome.
- Optional proof URL.
- Source.
- Confidence state.

**Acceptance criteria**

- A skill name alone is not sufficient evidence.
- An action description is required.
- A metric is never compulsory and is never invented.
- The user can correct imported or inferred evidence.

**FR-022 - Proof-link handling (P1)**  
The system shall store and safely validate user-supplied proof URLs.

**Acceptance criteria**

- Unsafe local or private-network destinations are rejected.
- Link failure is shown as a warning, not converted into proof.
- Private links are not published unless selected by the user.

### 8.4 Job and requirement analysis

**FR-030 - Application creation (P0)**  
The user shall be able to create an application using a pasted job description or a supported public URL.

**Required fields**

- Company.
- Position.
- Job description or retrievable URL.

**Optional fields**

- Location, employment type, salary, deadline, notes.

**FR-031 - Requirement extraction (P0)**  
The system shall extract discrete requirements and classify them as must-have, preferred, or hard eligibility.

**Acceptance criteria**

- Each extracted requirement retains source text from the job description.
- Duplicates are consolidated without changing meaning.
- The user can inspect and correct the extracted list.
- Ambiguous content is labelled as uncertain rather than asserted.

**FR-032 - Requirement-to-evidence matrix (P0)**  
The system shall map job requirements to user-owned evidence.

**Permitted statuses**

- Exact or strong match.
- Terminology mismatch.
- Weak evidence.
- Missing evidence.
- Not assessed.

**Acceptance criteria**

- Each positive match identifies its evidence node.
- Missing evidence never produces an affirmative claim.
- The matrix distinguishes hard eligibility from improvable presentation gaps.
- Any summary score remains secondary to the underlying explanations.

### 8.5 Suggestions and approval

**FR-040 - Grounded suggestions (P0)**  
Suggested resume changes shall use only the selected resume, selected work, selected certifications, evidence nodes, and job description.

**Acceptance criteria**

- A suggestion stores its source, reason, original text, proposed text, and application ID.
- Unsupported claims are blocked or visibly flagged.
- The system does not invent metrics, technologies, dates, employers, responsibilities, awards, or proficiency.

**FR-041 - Human approval controls (P0)**  
Every suggestion shall offer Apply, Edit, Reject, and Undo.

**Acceptance criteria**

- Pending suggestions do not change the resume.
- An edited suggestion stores the user's final text separately from the generated text.
- Rejected suggestions remain auditable but are not compiled.
- Undo restores the preceding version without corrupting history.

**FR-042 - Tailored compilation (P0)**  
The system shall compile approved changes into a new structured resume version.

**Acceptance criteria**

- Only approved changes are included.
- User-edited text takes precedence over the original suggestion.
- The resulting resume remains editable.
- The system preserves section or line-level evidence lineage where available.

### 8.6 Preflight, export, and sharing

**FR-050 - Application preflight (P0)**  
Before export, the system shall display blocking errors, warnings, and unresolved evidence gaps.

**Checks include**

- Missing required resume sections.
- Skills listed without evidence.
- Unsupported or unresolved claims.
- Parsing and formatting risks.
- Hard-eligibility gaps.
- Missing company, role, or job description.

**FR-051 - PDF export (P0)**  
The user shall be able to export the selected resume version as a readable PDF.

**Acceptance criteria**

- The output is generated from the canonical structured version.
- Layout is stable on common A4 viewers.
- Export failure can be retried without losing approved content.
- The exported artifact records its content hash and source version.

**FR-052 - Optional cover letter (P1)**  
After the resume is approved, the user may create and edit a grounded cover letter for the same application.

**FR-053 - Controlled portfolio/share page (P1)**  
The user may publish a page containing only selected work and public fields.

**Acceptance criteria**

- Publishing is off by default.
- The user previews the public view before activation.
- Revocation removes public access.
- The page does not imply third-party verification unless such verification actually occurred.

### 8.7 Tracking and next action

**FR-060 - Application state (P0)**  
The application shall support Draft, Preparing, Ready, Applied, Interviewing, Offer, Rejected, and Withdrawn states.

**Acceptance criteria**

- State transitions are timestamped.
- The UI offers only valid next states.
- The selected resume version, documents, deadline, notes, and outcome remain attached to the application.

**FR-061 - Next-action guidance (P0)**  
The home page and application workspace shall show one primary next action based on application state.

**Examples**

- Add a job description.
- Attach a resume.
- Add evidence for a must-have requirement.
- Review three pending suggestions.
- Export the approved version.
- Follow up on an applied role.

### 8.8 Billing and entitlement

**FR-070 - Application-pack entitlement (P1)**  
The commercial interface shall describe paid usage as application outcomes or packs, even if internal accounting uses credits.

**FR-071 - Idempotent billing (P0 for paid pilot)**  
Payment completion shall be processed idempotently and reconciled if the browser callback is interrupted.

**Acceptance criteria**

- A provider order or event cannot grant credits twice.
- The server owns price, currency, and entitlement values.
- Pending transactions can be reconciled through a signed provider webhook or a documented recovery job.

### 8.9 Analytics and audit

**FR-080 - Canonical product events (P0)**  
The system shall record, at minimum: account created, job added, resume attached, evidence attached, matrix generated, suggestion proposed, suggestion approved/edited/rejected, version compiled, preflight completed, export completed, application marked applied, second application started, payment completed, and outcome recorded.

**FR-081 - AI usage record (P0)**  
Every AI attempt shall record operation, user, prompt version, provider, token usage where available, latency, credit cost, idempotency key, request ID, result status, and safe error code.

---

## 9. Non-functional requirements

### 9.1 Security

**NFR-SEC-001:** All private resources require authenticated, owner-scoped access.  
**NFR-SEC-002:** Inputs are schema-validated and size-bounded.  
**NFR-SEC-003:** Uploaded files are validated using more than the client-supplied MIME type.  
**NFR-SEC-004:** URL inspection rejects loopback, link-local, private, metadata-service, and unsafe redirect destinations.  
**NFR-SEC-005:** Secrets remain server-side and are loaded through environment or managed secret storage.  
**NFR-SEC-006:** Logs and user-facing errors exclude resume text, proof content, access tokens, and payment secrets.  
**NFR-SEC-007:** Payment events use signature verification and replay protection.

### 9.2 Privacy

**NFR-PRI-001:** Collect only information necessary for the active workflow.  
**NFR-PRI-002:** Send the smallest useful context to an AI provider.  
**NFR-PRI-003:** Provide account-data export and deletion procedures before public launch.  
**NFR-PRI-004:** Public content requires explicit item-level selection.  
**NFR-PRI-005:** State third-party AI processing and retention behaviour in plain language.

### 9.3 Reliability

**NFR-REL-001:** AI, parsing, browsing, and document jobs shall have explicit timeout, retry, failure, and cancellation states.  
**NFR-REL-002:** Retried operations shall not duplicate charges, versions, or application changes.  
**NFR-REL-003:** Long-running operations shall move behind durable job boundaries before scaled production use.  
**NFR-REL-004:** Payment reconciliation shall not depend solely on a successful browser return.  
**NFR-REL-005:** Generated artifacts shall be reproducible from their canonical source version.

### 9.4 Performance

Initial pilot targets:

- Interactive page transition: visible feedback within 300 ms under normal conditions.
- Standard authenticated API read: p95 below 800 ms, excluding external providers.
- AI operation: progress begins within 2 seconds; explicit timeout or queued state rather than an indefinite spinner.
- Resume PDF export: complete or enter a recoverable background state within 30 seconds.
- Requirement matrix: complete within 20 seconds for a typical one-to-three-page job description and candidate profile.

These are engineering targets, not externally advertised guarantees, until production measurements exist.

### 9.5 Accessibility and usability

**NFR-A11Y-001:** Core journeys shall meet WCAG 2.2 AA expectations for keyboard access, focus visibility, contrast, labels, error association, and reduced motion.  
**NFR-A11Y-002:** AI progress and failures shall be available to assistive technology.  
**NFR-UX-001:** Each empty state shall offer one recommended action.  
**NFR-UX-002:** The main application flow shall work at mobile and desktop widths.  
**NFR-UX-003:** User-facing language shall prefer “work,” “proof,” “fit,” “missing,” and “next step” over unexplained technical vocabulary.

### 9.6 Observability

**NFR-OBS-001:** Every request and background job shall carry a correlation ID.  
**NFR-OBS-002:** Metrics shall cover latency, error rate, queue age, provider failure, unsupported-suggestion review, export failure, payment reconciliation, and AI cost.  
**NFR-OBS-003:** Sensitive actions shall create an audit event without copying the sensitive content into logs.

---

## 10. AI system requirements

### 10.1 Permitted AI responsibilities

- Extract structured fields from user-supplied resumes and job descriptions.
- Normalize and organize user-supplied work.
- Propose mappings between evidence and job requirements.
- Suggest clearer, job-relevant wording grounded in supplied evidence.
- Identify missing or weak proof.
- Draft an optional cover letter or portfolio description from approved content.
- Generate interview questions from the candidate's own work and target role.

### 10.2 Prohibited AI behaviour

- Inventing or rounding metrics.
- Adding a skill because it occurs in the job description.
- Converting inference into fact.
- Silently modifying canonical resume or work records.
- Publishing or sharing information.
- Predicting a hiring probability as if it were a measured fact.
- Treating an aggregate score as a substitute for explanations.
- Sending unrelated parts of the user's profile to the provider.

### 10.3 Output contract

Each structured AI operation shall have:

- a named operation;
- a versioned prompt;
- a bounded input schema;
- a strict output schema;
- source references or evidence IDs where relevant;
- a confidence or uncertainty field where relevant;
- an idempotency key;
- usage and error logging;
- deterministic validation before persistence.

### 10.4 Model fallback rule

Azure Foundry is the current primary provider. A fallback provider may be used only for defined transient conditions. Fallback must not occur for invalid input, authorization failure, policy rejection, schema-validation failure, or a permanent configuration error. The user must not be charged twice for a single logical operation.

### 10.5 Evaluation set

Before a paid pilot, the team shall maintain a test set containing:

- job requirements with direct evidence;
- relevant evidence using different terminology;
- weak evidence without an outcome;
- skills listed without an action;
- missing hard eligibility;
- ambiguous dates;
- tempting but unsupported metrics;
- malicious instructions inside a job page or uploaded file;
- resumes with tables, columns, missing headings, and extraction noise;
- non-native English writing that must be clarified without erasing voice.

Primary evaluation measures: unsupported-claim rate, requirement-extraction precision, evidence-link correctness, user correction rate, and schema-valid response rate.

---

## 11. Data requirements

### 11.1 Core entities

- User and authentication records.
- Profile.
- Resume and ResumeVersion.
- WorkItem and Certification.
- EvidenceNode.
- Job and Application.
- JobRequirementMatrix.
- ApplicationChange and TailoringRun.
- PreflightCheck.
- CoverLetter.
- Portfolio.
- InterviewNote.
- DocumentArtifact.
- BackgroundJob.
- AIUsage.
- PaymentTransaction.

### 11.2 Key relationships

```text
User
|- Resumes -> Resume Versions
|- Work Items -> Evidence Nodes
|- Certifications
|- Applications
|  |- Job Requirements -> Evidence Nodes
|  |- Application Changes -> Tailored Resume Version
|  |- Preflight Checks
|  |- Document Artifacts
|  `- Interview Notes / Outcome
|- Portfolio
|- AI Usage
`- Payment Transactions
```

### 11.3 Data integrity rules

- All private domain records carry `userId` or inherit an owner through an owner-checked parent.
- Application changes cannot be compiled into an application owned by another user.
- A public token exposes only an explicitly published artifact.
- Evidence confidence uses controlled values such as `asserted`, `imported`, or `externally_checked`; the label must not imply independent verification when none occurred.
- Generated documents record their source version, content hash, creation time, and lineage.
- Deletion and retention rules cover database records, uploaded originals, generated files, logs, and provider-side retention where applicable.

---

## 12. Information architecture and UX copy

### 12.1 Primary navigation

- Home.
- Applications.
- My Work.
- My Resume.
- Portfolio.
- Settings.

### 12.2 Application workspace steps

1. Job.
2. Resume.
3. Work and proof.
4. Evidence review.
5. Suggested changes.
6. Final review.
7. Export and follow-up.

### 12.3 Language rules

| Avoid | Prefer |
|---|---|
| AI optimization | Suggested improvement |
| ATS rejection probability | Parsing or evidence risk |
| Intelligence units | Application pack or plan usage |
| Strategic match protocol | What fits this job |
| Evidence vault | My Work |
| High-conversion resume | Reviewed job-specific resume |
| Verified candidate | Candidate-provided evidence |
| Guaranteed result | Clearer, more complete application |

### 12.4 Example product messages

**Good:** “This role asks for automated testing. Your resume lists Jest, but no saved project shows how you used it.”  
**Good:** “We found a related project. Add what you built before using it in the application.”  
**Good:** “This sentence is a suggestion. Check that every detail is true.”  
**Bad:** “Your match score is 84%, so you are highly likely to be selected.”  
**Bad:** “We upgraded your profile with high-impact metrics.”

---

## 13. Success metrics

### 13.1 North-star workflow

```text
Application started
-> evidence reviewed
-> tailored version approved
-> document exported
-> application marked submitted
```

### 13.2 Pilot success gates

- At least 70% of invited users complete one package.
- Median job-to-export time is under 20 minutes.
- At least 50% start a second application within 14 days.
- Fewer than 5% of reviewed suggestions contain an unsupported claim.
- At least 10 users pay, or one institution funds a cohort.
- AI cost per completed paid package is below 20% of realized revenue.

### 13.3 Supporting metrics

- Requirement extraction correction rate.
- Evidence nodes reused across applications.
- Suggestions applied, edited, rejected, and undone.
- Preflight warnings resolved before export.
- PDF export success rate.
- Time spent at each application step.
- Application response, interview, and outcome when voluntarily reported.
- Support requests and failure-recovery completion.

### 13.4 Claims policy

Do not claim improved hiring probability, interview rate, or placement rate until the team has adequate sample size, a defined comparison method, informed consent, and a documented analysis. Early reporting shall focus on workflow measures.

---

## 14. Business requirements

### 14.1 Initial packaging

**Free**

- One master resume.
- Work and evidence storage within stated limits.
- One guided application.
- Basic export and portfolio preview.

**Application Pack**

- A fixed number of complete job-specific application workflows.
- Resume versions and exports.
- Grounded suggestions and preflight review.

**Pro**

- Higher application limits.
- Deeper version history.
- Cover letters and portfolio customization.
- Follow-up history and interview notes.

### 14.2 Institutional pilot

The institution may purchase access for a defined cohort. The agreement must state:

- cohort size and duration;
- included product use and support;
- aggregate metrics visible to the institution;
- student consent and content-sharing boundaries;
- data retention and deletion terms;
- absence of placement guarantees;
- pilot fee and payment schedule;
- success measures and feedback method.

---

## 15. Technical architecture

### 15.1 Current stack

- Next.js 16 App Router and React 19.
- TypeScript and Tailwind CSS 4.
- Next.js Route Handlers as API/BFF.
- Better Auth.
- Neon Postgres and Drizzle ORM.
- Azure Foundry for primary generation, with a controlled fallback provider.
- `unpdf` and Mammoth for document extraction.
- Puppeteer/Chromium for PDF generation and supported page inspection.
- Razorpay for payment transactions.
- OpenTelemetry and optional Azure Application Insights.

### 15.2 Current deployment shape

The application is a modular monolith. This is appropriate for the pilot because it keeps interactive development and deployment simple. Slow, untrusted, retryable, or expensive operations require stronger boundaries before scale.

### 15.3 Required target boundaries

- Unified authorization, validation, rate-limit, and idempotency policy.
- Durable queue and background workers for AI, extraction, browsing, and rendering.
- Sandboxed browser worker with restricted network egress.
- Private object storage for original uploads and generated artifacts.
- Immutable or append-only credit ledger and webhook-based reconciliation.
- Provider gateway with task-specific timeout, retry, schema, and fallback rules.
- Correlated telemetry across web request, job, provider call, and database update.

---

## 16. Delivery plan

### Phase 1 - Focus the journey (Weeks 1-2)

- Make **Start an application** the dominant dashboard action.
- Consolidate existing components into one canonical workspace.
- Align navigation and copy to job, work, proof, fit, review, export, and next step.
- Add a seeded, realistic demo account.

**Exit condition:** a new user can complete the happy path without choosing between separate analyzer tools.

### Phase 2 - Make trust visible (Weeks 3-4)

- Standardize grounded suggestion contracts.
- Complete Apply/Edit/Reject/Undo and change lineage.
- Improve missing-evidence prompts.
- Add canonical funnel and AI usage events.

**Exit condition:** every compiled change can be traced to a user action and source context.

### Phase 3 - Harden the pilot (Weeks 5-6)

- Complete payment reconciliation.
- Move long operations to durable jobs where necessary.
- Test ownership boundaries and upload/URL safety.
- Run visual PDF, mobile, accessibility, and failure-recovery tests.

**Exit condition:** the paid happy path survives common provider, network, and user-interruption failures.

### Phase 4 - Validate (Weeks 7-10)

- Recruit 20-30 design partners through two groups.
- Observe baseline behaviour and run real application tasks.
- Review suggestion errors manually.
- Charge for a small pack or funded cohort.
- Conduct final interviews and decide whether to iterate, narrow, or expand.

**Exit condition:** the team has evidence for completion, repeat use, trust, cost, and willingness to pay.

---

## 17. Test and launch requirements

### 17.1 Automated checks

- Type checking and linting.
- Unit tests for schemas, requirement extraction, evidence matching, and compilation.
- API integration tests for authentication and ownership.
- AI schema-validation and fallback tests.
- Prompt-injection and unsupported-claim cases.
- Upload type, size, extraction, and malicious-file cases.
- Payment signature, replay, idempotency, and reconciliation tests.
- Resume and cover-letter rendering smoke tests.
- End-to-end application journey.
- Mobile navigation and accessibility checks.

### 17.2 Manual acceptance journey

```text
Create account
-> import old resume
-> review extracted data
-> add one project and certificate
-> add a real job
-> inspect extracted requirements
-> connect one item of evidence
-> leave one honest gap unresolved
-> generate suggestions
-> apply one, edit one, reject one, undo one
-> compile and reopen the version
-> run preflight
-> export PDF
-> mark as applied
-> confirm the dashboard shows the next step
```

### 17.3 Public-launch gates

Zebra is not ready for public launch until:

- the complete journey works from a clean account;
- no tested cross-user access path succeeds;
- AI output cannot silently enter saved content;
- the tailored resume remains structured and editable;
- paid entitlement cannot be duplicated;
- failed payment callbacks can be reconciled;
- PDF export passes visual review;
- public sharing is private by default and revocable;
- errors provide a useful recovery path;
- product events and operational alerts are visible;
- the user always knows the next step.

---

## 18. Risks and mitigations

### Risk 1 - The product appears to be another resume generator

**Mitigation:** enter through the application, lead with the evidence matrix, and make traceability the demo's central moment.

### Risk 2 - AI introduces an unsupported claim

**Mitigation:** structured evidence IDs, output validation, blocked claim types, human approval, undo, evaluation cases, and review-rate monitoring.

### Risk 3 - Students will not maintain a separate work record

**Mitigation:** extract an initial record from the resume, ask for missing evidence inside a live application, and show immediate reuse rather than requiring profile completion first.

### Risk 4 - Users try the product once and do not return

**Mitigation:** preserve reusable work, versions, status, follow-up, and a clear second-application path; measure 14-day repeat use.

### Risk 5 - Individual acquisition is too expensive

**Mitigation:** use placement cells and student communities for cohort distribution while preserving student ownership.

### Risk 6 - External AI or document services fail

**Mitigation:** bounded retries, durable job state, provider abstraction, manual fallbacks, idempotency, and clear errors.

### Risk 7 - A score is mistaken for hiring probability

**Mitigation:** keep explanations primary, label diagnostic measures narrowly, and prohibit probability or guarantee language.

### Risk 8 - Sensitive student data becomes public

**Mitigation:** private defaults, item-level preview, revocable tokens, ownership tests, minimum-context AI calls, and explicit retention controls.

---

## 19. Decisions that must use real evidence

The following items must be filled by the team and must not be guessed:

- Team member names, roles, and proof of execution.
- Current active users and completed applications.
- Pilot college or community names and written commitments.
- Paid revenue and pricing conversion.
- Current AI cost per operation and per completed package.
- Unsupported-suggestion rate on the evaluation set.
- Exact funding, cloud-credit, or partnership ask.
- Data-retention periods and provider contractual terms.

---

## 20. Definition of done for the focused MVP

The focused MVP is complete when a first-time user can take an existing resume and a real job description, connect relevant work, understand what is supported and missing, approve a job-specific revision, export it, mark the application as submitted, and return later to see the next action - without Zebra inventing a fact or requiring the user to navigate separate AI tools.

---

## 21. Reference basis

### Product and implementation basis

- Current Zebra AI repository, including the application workspace, resume compiler, requirement matrix, evidence graph, schema, APIs, exports, tests, and production specification.

### External context

1. LinkedIn, *Future of Recruiting 2025*. https://www.linkedin.com/business/talent/blog/talent-acquisition/future-of-recruiting-2025
2. Naukri JobSpeak, September 2025. https://www.naukri.com/blog/understanding-hiring-trends-with-naukri-jobspeak-report-sep-2025/amp/
3. Mercer | Mettl, *India's Graduate Skill Index 2025*. https://resources.mettl.com/wp-content/uploads/2025/02/MM_GSI_2025_Latest-1.pdf
4. World Economic Forum, *Future of Jobs Report 2025*. https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf

These references establish market context. They do not establish Zebra's product impact; that must be measured through the proposed pilot.
