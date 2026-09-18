# Zebra AI - Pitch Deck Content

**Deck purpose:** persuade incubators, hackathon judges, college partners, and early-stage investors that Zebra solves a narrow, real problem for Indian students and recent graduates.

**Core statement:** Zebra connects a candidate's real work to the job they want, then helps them prepare an evidence-backed application without inventing experience.

**Recommended length:** 12 main slides + 2 appendix slides  
**Recommended presentation time:** 6-8 minutes  
**Writing tone:** observant, honest, academically grounded, and quietly ambitious

---

## Slide 1 - Zebra AI

### Title

**Your work is real. Your application should prove it.**

### Subtitle

Zebra turns scattered projects, certificates, resumes, and links into a job-specific application a student can review, export, and track.

### Footer

**Evidence before adjectives. Approval before automation.**

### Presenter opening

The job tab is open. The deadline is tomorrow. Somewhere in another tab sits an old resume. A useful project is buried in GitHub, a certificate is resting in Downloads, and the strongest part of the candidate's work is absent from the application. This is not always a lack-of-skill problem. Quite often, it is a failure to connect the proof.

### Visual direction

Show one clean line connecting four real objects: **Job requirement -> Project proof -> Approved resume change -> Submitted application**.

---

## Slide 2 - Capable students are losing context between doing the work and applying for the job

### On-slide content

A student may have:

- built a working project;
- completed a course or internship;
- solved a real problem in a hackathon;
- learned tools relevant to a role.

Yet the application often shows only a generic skills list and a recycled resume.

**The missing layer is not another template. It is the connection between requirement, evidence, and claim.**

### Evidence line

In LinkedIn's 2025 recruiting research, 93% of surveyed talent-acquisition professionals said accurate skill assessment is crucial to improving quality of hire. India's fresher market is active but selective: Naukri reported fresher hiring up 7% year over year in August 2025 while IT hiring declined 6%.

### Source note

- LinkedIn, *Future of Recruiting 2025*: https://www.linkedin.com/business/talent/blog/talent-acquisition/future-of-recruiting-2025
- Naukri JobSpeak, September 2025: https://www.naukri.com/blog/understanding-hiring-trends-with-naukri-jobspeak-report-sep-2025/amp/

---

## Slide 3 - Existing tools solve fragments; the student still carries the whole burden

### On-slide content

**Resume builders** improve layout, but cannot establish whether a claim is supported.  
**General AI tools** write quickly, but can flatten a student's voice or introduce claims the student cannot defend.  
**Job boards** help people discover openings, but do not prepare the application.  
**Application trackers** record status after the difficult work has already been done.

The student still has to answer five questions alone:

1. What does this job actually require?
2. What have I done that supports it?
3. What is missing or weak?
4. What may I honestly improve in my resume?
5. What should I do after I apply?

### Closing line

**Zebra puts these five decisions into one guided workspace.**

---

## Slide 4 - We begin with one user, one trigger, and one promised outcome

### Primary user

Indian final-year students and recent graduates who have genuine projects, coursework, internships, certificates, or self-directed work, but lack a reliable method to present it for a particular role.

### Trigger

The user finds a job and pastes the job description or link.

### Promised outcome

Within one guided session, the user can produce a reviewed, editable application package containing:

- a clear requirement-to-evidence report;
- selected projects and proof links;
- an approved job-specific resume version;
- an optional cover letter and shareable portfolio;
- an application record with a visible next step.

### Product boundary

Zebra does not promise a job, bypass an ATS, or manufacture achievements. It helps the user prepare a more complete and defensible application.

---

## Slide 5 - Zebra turns a job description into a sequence of answerable decisions

### Main workflow

**Add the job -> Import the resume -> Attach real work -> See fit and missing proof -> Review each suggestion -> Export -> Track the outcome**

### What the user sees

- Must-have and preferred requirements separated clearly.
- Each requirement marked as **supported**, **weakly supported**, or **missing evidence**.
- The exact project, certificate, resume section, or proof link behind a proposed claim.
- Apply, Edit, Reject, and Undo controls for every suggested change.
- One next action instead of a dashboard full of competing tools.

### Presenter line

The important moment is not when Zebra writes. It is when Zebra says, “This requirement is supported by this work,” or, just as importantly, “There is not enough evidence to say this yet.”

---

## Slide 6 - The evidence compiler is the simple idea that can compound

### On-slide model

**Person -> Work item -> Evidence -> Skill -> Job requirement -> Approved change -> Application outcome**

### Explanation

Zebra stores a candidate's work as reusable evidence nodes: what they did, where they did it, which skill they used, what result followed, and where the proof can be inspected. For each job, Zebra maps those nodes to explicit requirements.

### Three outputs

1. **Supported:** evidence is strong enough to use.
2. **Weak:** the experience may be relevant, but the description or proof needs improvement.
3. **Missing:** Zebra asks for clarification; it does not fill the gap with fiction.

### Why this can do wonders

One well-described project can support several applications. The student stops rebuilding their professional story from zero, while every approved application makes the underlying record more useful.

---

## Slide 7 - Our difference is traceability, not a louder AI label

### Comparison

| Typical product | Zebra |
|---|---|
| Starts with a blank resume or template | Starts with a real job and the candidate's existing work |
| Optimizes a document in isolation | Connects requirements, evidence, documents, and outcomes |
| Produces a score with little explanation | Shows what is supported, weak, or missing |
| Rewrites entire sections | Proposes small, reviewable changes |
| Treats AI output as the answer | Treats AI output as a suggestion requiring approval |
| Stores a finished file | Builds a reusable, permissioned evidence graph |

### Defensibility line

Models, parsers, and templates are replaceable. Zebra's long-term asset is the structured history of proof, approved changes, repeated applications, and outcomes - owned and controlled by the user.

---

## Slide 8 - The product is already more than a presentation

### Implemented in the current codebase

- secure account and ownership-aware data model;
- resume import, structured editing, versioning, sharing, and PDF export;
- application capture, status, deadline, notes, and outcome tracking;
- projects, certifications, proof URLs, and evidence nodes;
- a requirement-to-evidence matrix;
- human review of suggested changes;
- compiled job-specific resume versions;
- cover letters and a public portfolio with private-by-default controls;
- Razorpay-based credit transactions;
- Azure Foundry as the primary generative AI provider, with a fallback path;
- automated tests covering application journeys, evidence, security, rendering, and AI workflows.

### Honest status statement

The technical primitives exist. The next challenge is product focus: make the application workspace the clear front door, harden long-running operations, and validate repeat use with students.

### Visual direction

Use one real product screenshot and four callouts only: **Application**, **Evidence**, **Review**, **Export**.

---

## Slide 9 - Trust is a product requirement, not a paragraph in the terms

### Zebra's integrity rules

- No invented employers, metrics, skills, dates, or achievements.
- No suggestion is saved silently.
- Every meaningful change supports Apply, Edit, Reject, and Undo.
- Private work remains private unless the user selects it for publication.
- Scores are diagnostic guidance, never a claim about hiring probability.
- AI receives the smallest useful context for the operation.
- Structured AI outputs are validated before storage.
- Usage, provider, prompt version, latency, and errors are auditable.

### Academic framing

The design follows a human-in-the-loop model: automation reduces clerical work, while the candidate remains responsible for truth, context, and final approval.

### Closing line

**The system may suggest the sentence. Only the student may authorize the claim.**

---

## Slide 10 - We will validate behavior before claiming impact

### Four-week design-partner study

**Participants:** 20-30 final-year students or recent graduates from two colleges, placement cells, or student communities.  
**Task:** complete real applications using their own resumes, work, and target jobs.  
**Method:** observe the existing process, run the guided Zebra workflow, review unsupported suggestions, and conduct follow-up interviews.

### Initial success gates

- 70% complete at least one application package.
- Median time from job entry to reviewed export is below 20 minutes.
- 50% begin a second application within 14 days.
- Fewer than 5% of reviewed suggestions contain an unsupported claim.
- At least 10 participants pay for a small pack, or one institution funds a cohort pilot.
- AI cost remains below 20% of realized application-pack revenue.

### Research discipline

Until a controlled comparison exists, Zebra will report completion, time-to-ready, evidence coverage, repeat use, and paid conversion - not an invented “increase in hiring probability.”

---

## Slide 11 - The first business model sells a completed outcome

### Individual offering

**Free:** one master resume, saved work, and one guided application.  
**Application Pack:** a fixed number of job-specific application workflows, paid in rupees.  
**Pro:** more applications, versions, portfolio controls, deeper review, and follow-up history.

### Distribution wedge

Start with colleges, placement cells, bootcamps, and student communities. They provide concentrated access, a trusted introduction, and a structured feedback loop; the student remains the owner of the data and the primary user.

### Expansion logic

1. Prove the individual workflow.
2. Run paid cohort pilots.
3. Add an institution view for aggregate completion and support needs, without exposing private student content by default.
4. Explore recruiter-side proof review only after candidate trust is established.

### No false promise

Zebra sells preparation and workflow quality, not placement guarantees.

---

## Slide 12 - A diverse team can build the whole loop because the problem crosses disciplines

### Team structure - replace brackets with real names and proof

**[Name] - Product and user research**  
Understands the student journey, converts observations into product decisions, and keeps the scope centred on one completed application.

**[Name] - Full-stack engineering**  
Builds the application workspace, secure APIs, data model, document pipeline, and production reliability.

**[Name] - AI and data systems**  
Designs evidence extraction, requirement mapping, evaluation sets, output validation, and cost controls.

**[Name] - Design and communication**  
Makes complex evidence understandable, protects the student's voice, and turns the workflow into a calm experience.

**[Name] - Partnerships and validation**  
Works with placement cells and student communities, recruits pilot users, and carries real feedback back into the build.

### Team line

Our diversity is useful when it becomes an operating method: one team observes the problem, builds the system, questions its output, and returns to the user with a better version.

### Rule for this slide

Use only real names, roles, shipped work, research, institutional access, or lived experience. Do not list generic adjectives such as “visionary” or “passionate.”

---

## Slide 13 - The next 90 days are for proof, not expansion

### Days 1-30: make the path unmistakable

- Make **Start an application** the primary action.
- Consolidate resume, work, evidence, review, export, and tracking into one workspace.
- Replace score-first language with fit, missing proof, and next action.
- Seed a reliable three-minute demo.

### Days 31-60: make trust measurable

- Complete change lineage and undo behaviour.
- Add evaluation cases for unsupported claims and terminology mismatch.
- Instrument the full application funnel and AI cost per completed package.
- Harden rate limiting, billing reconciliation, and background jobs.

### Days 61-90: run a paid pilot

- Recruit 20-30 students through two partner groups.
- Observe real application completion and repeat use.
- Collect permissioned before/after examples and interviews.
- Decide the next build from evidence, not from feature appetite.

---

## Slide 14 - The ask and the line we intend to hold

### Partnership ask

We are seeking:

- **two placement-cell or student-community partners** for a four-week cohort pilot;
- **one product or recruiting mentor** to review the evidence model and evaluation method;
- **[insert exact funding or cloud-credit ask]** to complete the 90-day validation plan.

### Closing statement

We are not trying to make AI write more resumes. We are building the evidence layer between a graduate's real work and the job they are applying for.

### Final presenter line

There are many students who have already begun the work. Their projects exist, their learning is real, and their effort should not disappear between folders and forms. Zebra's job is simple to say and difficult enough to matter: keep the proof connected until the application is sent.

---

# Appendix

## Appendix A - Technical architecture

### Current implementation

- **Frontend and API:** Next.js 16 App Router, React 19, TypeScript.
- **Data:** Neon Postgres with Drizzle ORM.
- **Authentication:** Better Auth with email/password and optional Google OAuth.
- **AI:** Azure Foundry Responses API; Gemini used only as a transient-error fallback.
- **Documents:** PDF, DOCX, and TXT ingestion; HTML-to-PDF rendering.
- **Payments:** Razorpay credit transactions.
- **Observability:** OpenTelemetry and optional Azure Application Insights.

### Target production boundary

Keep the modular monolith for interactive work. Move retryable and high-risk tasks - AI generation, document conversion, and URL inspection - into durable background jobs with isolation, idempotency, and observable failure states.

## Appendix B - Research and claim discipline

### External references used

1. LinkedIn, *Future of Recruiting 2025*. Survey of 1,271 recruiting professionals across 23 countries, conducted September 2024. https://www.linkedin.com/business/talent/blog/talent-acquisition/future-of-recruiting-2025
2. Naukri JobSpeak, September 2025. Reports August 2025 white-collar hiring trends based on jobs posted by Naukri clients. https://www.naukri.com/blog/understanding-hiring-trends-with-naukri-jobspeak-report-sep-2025/amp/
3. Mercer | Mettl, *India's Graduate Skill Index 2025*. https://resources.mettl.com/wp-content/uploads/2025/02/MM_GSI_2025_Latest-1.pdf
4. World Economic Forum, *Future of Jobs Report 2025*. https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf

### Claims deliberately excluded

- “Zebra increases the chance of getting hired.”
- “Zebra is certified by every ATS.”
- “Recruiters can always detect AI-written resumes.”
- “Tier-3 students are automatically rejected.”
- Any user, revenue, accuracy, or partnership number not supported by records.

---

# Optional 30-second pitch

Zebra helps Indian final-year students and recent graduates turn the work they have actually done into job-specific applications. A user adds a job, imports a resume, and attaches projects or proof. Zebra shows which requirements are supported, where the evidence is weak, and what is genuinely missing. It then proposes editable changes that the student must approve before producing a resume, portfolio, and tracked next step. We use replaceable AI infrastructure; our long-term value is the trusted connection between real work, job requirements, approved claims, and outcomes.

# Optional one-line descriptions

**Formal:** An evidence-backed application workspace for early-career candidates.  
**Human:** Zebra helps students show the work they have already done, properly.  
**Investor-facing:** The permissioned evidence layer between early-career talent and job applications.  
**College-facing:** A guided system that helps students complete clearer, more defensible applications without placement guarantees.
