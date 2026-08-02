# Zebra: research-backed MVP and pitch

**Research cut-off:** 31 July 2026  
**Product reviewed:** current `C:\zebra-ai` codebase

## The decision

Zebra should launch as a focused **application-readiness workspace for Indian final-year students and recent graduates**.

> Zebra turns a student's scattered projects, certificates, and experience into an honest, job-specific application they can submit, share, and improve.

Do not pitch Zebra as an AI resume builder, an ATS score, a career operating system, or a deep-tech company. Those positions put Zebra into crowded, low-trust categories. Pitch the workflow and the measurable outcome: **more complete, more relevant applications prepared faster, without inventing experience**.

## What the research changes

India's white-collar hiring market is active but selective. Naukri reported an 11% year-on-year rise in white-collar hiring in June 2025, including a double-digit increase in fresher hiring; its JobSpeak index is based on data from over 100,000 clients. Later 2025 reporting showed fresher hiring still growing, but only 7% year-on-year in August. That supports a painful but useful wedge: graduates need to apply repeatedly and improve quality, not just generate one attractive resume. [Naukri, June 2025](https://www.naukri.com/blog/understanding-hiring-trends-with-naukri-jobspeak-report-june-2025/), [Naukri, September 2025](https://www.naukri.com/blog/understanding-hiring-trends-with-naukri-jobspeak-report-sep-2025/amp/)

The skills problem is real, but “skills gap” alone is too broad to be a product. Recent research describes a gap between higher-education learning and changing job-market demands. Zebra should therefore own the narrower translation problem: **what did this person actually do, what evidence supports it, and how should it be presented for this role?** [ERIC, 2025 study](https://eric.ed.gov/default.aspx?ff1=subEmployment+Qualifications&id=EJ1489510&q=descriptor%3A%22Employment+Qualifications%22)

Capital is available but selective. Reporting on 2025 put Indian startup funding near $11B with fewer checks and greater selectivity; 2026 ecosystem reporting identifies AI/ML and deep tech as investor priorities while naming execution and talent as key risks. Zebra should not claim that it needs long-horizon deep-tech funding. It should show a capital-efficient software wedge, early paid pilots, and evidence of repeat use. [TechCrunch, India funding 2025](https://techcrunch.com/2025/12/27/india-startup-funding-hits-11b-in-2025-as-investors-grow-more-selective/), [Tracxn India Tech Report 2025–26](https://indiatechreport.in/2026/04/21/india-tech-startup-landscape-2025-26-tracxn-press-release/)

## The sharp MVP

### One user

Final-year students and recent graduates in India who have some real work but struggle to explain it, select what matters for a job, and keep their applications organized.

### One trigger

The user finds a job and pastes the job description or URL.

### One promised outcome

Within 15 minutes the user has a reviewed, editable application package:

1. a fit-and-gap explanation grounded in the job description;
2. selected projects/work items with proof links;
3. an approved tailored resume version;
4. an optional cover letter;
5. a shareable portfolio/application page;
6. a tracked next step.

### The MVP loop

`Add job → import resume → add proof → see fit/gaps → approve edits → export/share → track outcome`

The MVP is complete when a user can finish that loop without needing to understand which AI feature to open next.

## What the current code already supports

| MVP capability | Current evidence in codebase | Decision |
|---|---|---|
| Resume import, editing, versions, preview, PDF export | `src/app/api/resumes`, `src/components/compiler`, `src/app/api/export` | Keep; make the application the entry point |
| Job/application capture and status tracking | `src/app/api/applications`, `src/components/dashboard/JobBoard` | Keep; remove legacy dual-path confusion after validation |
| Job tailoring and fit suggestions | `src/app/api/ai/tailor`, `src/components/dashboard/TailorResume` | Keep; rename around “fit and missing proof,” not a score |
| Work/proof records | `src/app/api/work`, `src/components/dashboard/ProjectProofAnalyzer` | Make this the differentiating core |
| Portfolio and public sharing | `src/app/api/portfolio`, share routes | Keep as an output of an application, not a separate destination |
| Cover letters | `src/app/api/cover-letters` | Keep as a paid/add-on step, after resume and proof |
| Credits, Razorpay, plans | `src/lib/credit-policy`, `src/lib/razorpay`, landing pricing | Keep, but sell completed application packs rather than “AI credits” |
| Analytics | `src/app/dashboard/analytics` | Defer investor-facing claims; use for product learning first |
| Multiple AI providers | Azure + Gemini dependencies and AI routes | Use as an internal resilience layer; do not make it the customer pitch |

## Cut or defer from the first paid MVP

- Generic ATS scoring and “high-conversion” language.
- Job scraping/aggregation as a primary product; links and pasted descriptions are enough for the first cohort.
- Broad career advice, courses, interview training, and automatic application submission.
- Enterprise, mentorship, universal translation, and “all-in-one career platform” claims.
- Deep-tech/IP claims. The current defensibility is workflow data, structured proof, approval history, outcome feedback, and distribution—not a patent or proprietary foundation model.

## Product moat, stated honestly

Commodity layer: LLM calls, PDF/DOCX parsing, OCR, embeddings, resume templates, payments, auth, and standard CRUD. These should be replaceable behind provider adapters.

Core product asset: a permissioned graph connecting **person → work item → evidence → skill → job requirement → approved application change → application outcome**. The moat compounds through structured, user-approved data and workflow habit. It becomes stronger through college placement cells, student communities, mentors, and recruiter feedback—not through claiming that model orchestration itself is proprietary.

## Validation plan before raising on scale

Run a 4-week paid design-partner sprint with 20–30 students from two colleges or communities.

Week 1: observe how they currently collect projects, edit resumes, and apply; capture ten real jobs per participant.  
Week 2: ship the single application journey and manually review AI suggestions.  
Week 3: charge for a small application pack and measure repeat use.  
Week 4: interview users and compare completed applications, time-to-ready, and response/interview outcomes.

Suggested gates:

- 70% of invited users complete one application package;
- median time from job paste to export below 20 minutes;
- 50% create a second application within 14 days;
- fewer than 5% of reviewed suggestions contain unsupported claims;
- at least 10 users pay, or one institution pays for a cohort pilot;
- AI cost per completed package stays below 20% of realized revenue.

Do not claim that Zebra increases hiring probability until there is a properly measured control group. Early proof should be workflow proof: completion, time saved, evidence quality, repeat applications, and paid conversion.

## Commercial wedge

Use a hybrid model suited to price-sensitive users:

- Free: one resume and one guided application;
- Student pack: a fixed number of application packs, priced in rupees;
- Pro: monthly applications, versions, portfolio, and deeper analysis;
- B2B2C pilot: placement cells, bootcamps, and student communities pay per active student or per completed application.

The institutional route is strategically important because student acquisition one by one is expensive and trust-sensitive. The student remains the user; the institution can provide distribution and structured feedback. Do not sell placement guarantees.

## Investor-ready narrative

**Problem:** Indian graduates often have real work, but it is scattered across certificates, GitHub, projects, and old resumes. Existing tools optimize a document or teach another course; they do not connect proof to a specific application.

**Solution:** Zebra creates an application workspace that turns a job description and a candidate's real work into a reviewed, traceable application package.

**Why now:** Hiring remains selective even as fresher hiring grows. AI makes generic document generation cheap, which increases the value of grounded evidence, trust, review, and workflow completion.

**Why us:** Zebra already has the application, resume, work, tailoring, sharing, export, payments, and tracking primitives. The next product work is orchestration and focus, not a speculative research program.

**Business model:** paid application packs plus institution-led distribution.

**Moat:** structured proof-to-requirement data, approval history, outcome feedback, and embedded distribution. Model providers remain replaceable.

**Milestone for the next round:** prove that users repeatedly complete better-grounded applications and pay for the workflow; then expand into institution dashboards and recruiter-side proof review.

**Exit framing:** strategic acquisition is a possible long-term outcome for a larger HR, education, recruiting, or productivity platform, but it is not the operating plan. IPO should be described only as an eventual option, not a near-term objective.

## 30-second pitch

Zebra helps Indian final-year students and recent graduates turn the work they have actually done into job-specific applications. A user pastes a job, imports a resume, and adds projects or proof. Zebra explains what fits, shows what is missing, suggests editable changes without inventing achievements, and produces a shareable application package that can be tracked to an outcome. We use commodity AI infrastructure and keep providers replaceable; our defensibility is the structured proof-to-job workflow, user trust, and distribution through colleges and student communities.

## Immediate engineering priorities

1. Make `/dashboard` start with **Add a job**, not a generic resume action.
2. Create one canonical application workspace that composes existing resume, work, tailoring, export, portfolio, and tracking components.
3. Replace score-first copy with fit, missing proof, and next action.
4. Enforce structured, cited-to-source AI suggestions with Apply/Edit/Reject/Undo in every flow.
5. Add an event model for funnel metrics: job added, proof added, suggestion approved, export, share, application outcome, payment.
6. Hide or defer features that do not serve the first loop; keep their APIs only if tests and migrations make removal risky.
7. Run the existing lint, typecheck, test, and build commands before the design-partner pilot, then fix any failures that block the happy path.

## Important product-risk note

The current code contains valuable surface area but also signs of product drift: legacy `/api/jobs` fallback behavior, credit-led copy, generic resume positioning, and several AI operations with different concepts of “analysis.” Before adding more features, define one canonical `Application` journey and one typed analysis contract. This is the highest-leverage execution work for the pitch you want to make.
