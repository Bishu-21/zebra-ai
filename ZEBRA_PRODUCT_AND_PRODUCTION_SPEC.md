# Zebra — Product and Production Specification

## 1. Product decision

Zebra is a practical career helper for students and fresh graduates who are trying to become job-ready but cannot keep their work, proof, applications, and next steps organized.

Zebra is not a DSA platform, a generic resume scorer, or an automatic job-application bot.

### Product promise

> Zebra helps you turn the work you have done into a stronger profile, a better application, and a clear next step.

### First target user

Final-year students and recent graduates who have projects, courses, hackathons, certificates, or some skills, but do not have a reliable process for presenting themselves and applying consistently.

They may be:

- strong students with scattered work;
- average students trying seriously to improve;
- students who started late and need a practical plan;
- students who are not confident in English, resumes, portfolios, or interviews;
- technical students who know some tools but cannot explain what they built or prove it.

## 2. The specific niche

The niche is **career proof and application preparation for early-career students**.

Most products help users learn DSA, write a resume, or find jobs. Zebra helps students answer:

1. What have I actually done?
2. Can I prove it?
3. Which parts matter for this role?
4. How do I present them honestly?
5. What should I do next?

The differentiator is not another score. It is the connection between a student's real work and the applications they are preparing.

## 3. Human product language

Use plain language in the product.

| Avoid | Use |
|---|---|
| Career operating system | Your job application helper |
| Evidence vault | My work |
| Intelligence units | Credits or plan usage |
| Role alignment analysis | How well does this fit the job? |
| Neural reconstruction | Make my old resume editable |
| Strategic career intelligence | What should I improve? |
| Profile readiness score | What is missing from my profile? |
| AI-powered transformation | Improve this with Zebra |

Zebra should feel like a calm, honest helper. AI should be visible when useful, but should not be the headline of every feature.

## 4. Core experience

The main object in Zebra is an **Application**, not an isolated resume.

```text
Application
├── Company and role
├── Job description or link
├── Selected resume
├── Relevant projects and certificates
├── Portfolio links
├── Changes suggested by Zebra
├── Final exported files
├── Application status and dates
└── Interview notes and outcome
```

### Main journey

```text
Add a job
→ Choose or import a resume
→ Add missing work and proof
→ See what fits and what is missing
→ Improve the application with approval
→ Check the final document
→ Export and mark as applied
→ Follow the next step
```

The student should never have to decide which Zebra feature to open next.

## 5. Main areas of the app

### Home

Shows the next useful action, active applications, deadlines, and unfinished work.

Example:

```text
Continue your application
Frontend Developer — Acme
Your project matches the role, but your resume does not show testing experience.
[Continue]
```

### My Work

Students save projects, hackathons, internships, certificates, courses, awards, GitHub links, demos, and other proof.

Every item has:

- title;
- what was done;
- tools or skills used;
- result or learning;
- link or proof;
- date;
- last reviewed date;
- visibility: private or public.

### My Resume

One master resume and job-specific copies. A tailored copy must remain editable and traceable to the master resume.

### Applications

Saved jobs, active applications, deadlines, resume versions, notes, follow-ups, interviews, and outcomes.

### Portfolio

A simple public page generated from selected work. Students choose what is public. Nothing becomes public by default.

### Improve

The app identifies repeated gaps across applications and suggests practical actions, such as:

> You have three projects but none explains the result. Add what changed, who used it, or what you learned.

This is not a DSA course. It helps the student present and improve the work they already have.

## 6. AI responsibilities

AI may:

- extract information from an uploaded resume;
- organize a student's work;
- match projects to a job;
- suggest clearer writing;
- identify missing proof;
- create a first draft of a portfolio description;
- prepare interview questions from the student's own work;
- identify patterns across applications.

AI must not:

- invent metrics, employers, skills, or achievements;
- silently alter saved content;
- submit an application without explicit approval;
- publish private information;
- treat one score as hiring probability;
- force every bullet to contain a number;
- send the entire student profile to an AI provider when a smaller context is enough.

### Approval rule

```text
Zebra suggests
→ student reviews
→ student approves or edits
→ Zebra saves a new version
```

Every AI change needs Apply, Edit, Reject, and Undo behavior.

## 7. Technical architecture — HLD

```text
Next.js web application
├── Home and navigation
├── Work and profile management
├── Application workspace
├── Resume editor and renderer
├── Portfolio page
└── Progress and reminders

Backend services
├── Authentication and authorization
├── Resume and profile service
├── Work/evidence service
├── Application service
├── AI extraction and suggestion service
├── Export service
├── Billing and credit service
└── Audit, logging, and monitoring

Storage
├── PostgreSQL for structured data
├── Private object storage for documents
├── Optional search index for a user's own work
└── Versioned generated files
```

Azure can be used where it provides a real advantage:

- Azure Document Intelligence for PDF/DOCX extraction;
- Azure AI Language for extracting skills, companies, dates, and entities;
- Azure OpenAI for controlled generation;
- Azure AI Search for searching a user's own saved work;
- Azure Blob Storage for private files;
- Azure Key Vault for secrets;
- Azure Monitor and Application Insights for production visibility.

Do not use an Azure service only because it sounds advanced. Each service must solve a measured problem.

## 8. Technical architecture — LLD rules

### Canonical data structures

All resume and work content must pass through typed schemas before being saved.

```text
Raw file/text
→ extracted content
→ normalized WorkItem or ResumeDocument
→ user review
→ saved version
→ rendered output
```

AI responses must be validated with Zod. Never persist model output based only on `JSON.parse`.

### Required core entities

```text
User
Profile
WorkItem
Certification
Resume
ResumeVersion
Job
Application
ApplicationChange
Analysis
Portfolio
InterviewNote
AIUsage
PaymentTransaction
```

### Ownership rule

Every private record query, update, delete, and AI operation must include the authenticated user's ID. Public portfolio access must use a separate public token and expose only explicitly selected fields.

### AI usage rule

Each AI operation needs:

- a named operation;
- input size limits;
- a validated response schema;
- a usage record;
- idempotency protection;
- credit reservation and refund behavior;
- safe error handling;
- a prompt version.

## 9. Security and privacy requirements

Student data is private by default.

Before public launch, verify:

- cross-user read, update, delete, and AI access;
- secure file type and size validation;
- private storage access rules;
- deletion and data export;
- public portfolio field selection;
- payment replay protection;
- rate limiting;
- prompt injection handling;
- error-message redaction;
- encryption in transit and at rest;
- secret management;
- audit logging for sensitive actions;
- clear third-party AI data policy.

## 10. Revenue model

The product should charge for meaningful outcomes, not every small interaction.

### Free

- one master resume;
- limited applications;
- basic profile and work storage;
- limited suggestions;
- basic portfolio page.

### Paid

- more job-specific resume versions;
- advanced tailoring and review;
- full application tracking;
- interview preparation;
- portfolio customization;
- reminders and history;
- higher AI limits.

Possible later customers include colleges, placement cells, bootcamps, and student communities. Do not build the institutional product until the individual student workflow works.

## 11. Launch scope

The first launch must prove one complete outcome:

> A student can take an existing resume and a real job description, produce an honest job-specific resume, export it, and track the application without leaving Zebra.

Build first:

1. Secure login.
2. Resume import and review.
3. My Work with projects and certificates.
4. Add an application.
5. Match job requirements to saved work.
6. Apply/reject/edit resume suggestions.
7. Final resume validation.
8. Reliable PDF export.
9. Application status and reminders.

Delay until this works:

- job scraping;
- newsletters;
- generic chatbot;
- broad learning platform;
- automatic application submission;
- multiple analyzer experiences;
- complex social features.

## 12. Audit and testing plan

### Manual test journey

```text
Create account
→ import old resume
→ review extracted content
→ add a project and certificate
→ add a real job
→ generate a fit report
→ apply one suggestion
→ reject one suggestion
→ undo one change
→ save a version
→ reopen it
→ export PDF
→ mark application as submitted
→ verify the dashboard shows the next step
```

### Automated testing

- typecheck;
- lint;
- unit tests for schemas and transformations;
- API tests for every ownership boundary;
- AI response validation tests;
- credit race and refund tests;
- upload and file extraction tests;
- PDF export smoke tests;
- payment verification tests;
- end-to-end application journey;
- responsive and accessibility checks.

### Launch gate

Zebra is not ready for public launch until:

- the main application journey works from a clean account;
- a tailored resume remains structured and editable;
- AI cannot invent unapproved data in saved content;
- users cannot access another user's records;
- credits cannot be duplicated or bypassed;
- PDF export is checked visually;
- errors have useful human messages;
- the product tells the user what to do next.

## 13. Product language examples

```text
Add your next application
Tell Zebra what you are applying for.

What have you worked on?
Add projects, certificates, internships, or anything you can show.

What fits this job?
Zebra found three strong matches and two things to improve.

Check before sending
Review the changes and make sure every claim is true.

Your next step
Add a result to your Campus Marketplace project.
```

## 14. Definition of success

The primary metric is not analyses performed or AI credits consumed.

Measure:

```text
Started application
→ completed tailored resume
→ exported application
→ marked as applied
```

Secondary measures:

- students returning for another application;
- time from job added to export;
- suggestions accepted or rejected;
- profile items reused across applications;
- applications receiving a response;
- percentage of users who complete their first application.

## Final product statement

> Zebra helps students keep track of the work they have done, show it properly, and prepare better applications without starting from zero every time.

That is the system to build. The existing analyzer, editor, portfolio, AI, Azure integrations, payments, and job tracker should all be judged by whether they make this promise more reliable.
