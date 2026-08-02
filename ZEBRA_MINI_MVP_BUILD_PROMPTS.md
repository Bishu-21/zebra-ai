# Zebra Mini MVP: copy-paste build prompts

Use these prompts sequentially with your coding agent. Run each prompt only after the previous one is verified.

## Mini-project scope

Build only this journey:

`Create application → paste job → add/select resume → add one project → see fit and gap → approve one suggestion → export/share application`

Keep the existing Zebra stack: Next.js App Router, React, TypeScript, Tailwind, Drizzle/Postgres, Better Auth, existing AI provider abstraction, and current visual style. Do not introduce a new framework.

Defer job scraping, analytics, subscriptions, cover letters, interview prep, broad career advice, recruiter tools, and automatic application submission.

## Prompt 1 — inspect and plan

```text
You are working inside the existing Zebra AI repository. Read AGENTS.md, README.md, ZEBRA_PRODUCT_AND_PRODUCTION_SPEC.md, and ZEBRA_UI_UX_AND_DEMO_PLAN.md. Inspect the current routes, schema, components, tests, and package.json before changing anything.

The goal is to create a small MVP, not expand the product. The only user journey is:
Create application → paste job description → select/import resume → add one project/proof item → see grounded fit and missing evidence → approve one AI suggestion → export/share the application.

Produce a written implementation plan first. Identify which existing files/components/routes can be reused, which are obsolete for this MVP, and what schema/API changes are required. Do not edit files in this step.
```

## Prompt 2 — establish MVP information architecture

```text
Implement the MVP information architecture in the existing Zebra app.

Create or adapt these routes:
- /dashboard: one primary CTA, “Start an application”
- /dashboard/applications/new: create an application
- /dashboard/applications/[id]: the guided application workspace
- /share/[token]: public read-only application preview

The workspace must show a clear progress stepper:
Job → Resume → Proof → Review → Export

Reuse existing auth, database, resume, work, application, sharing, and export code where safe. Preserve user ownership checks. Do not add new navigation categories unless required.

Acceptance criteria:
- A signed-in user can create an application with company, role, job description, and optional URL.
- The application workspace loads the saved application.
- Empty states always have one recommended next action.
- The old dashboard tools are secondary and do not compete with the primary application CTA.
```

## Prompt 3 — build the application workspace UI

```text
Build the application workspace UI using the existing Zebra visual system: warm off-white surfaces, black primary actions, restrained borders, rounded cards, compact typography, and accessible focus states.

Design the page as:
1. Header: company, role, application status.
2. Progress stepper: Job, Resume, Proof, Review, Export.
3. Main content: current step card.
4. Right rail on desktop: application summary and next action.
5. Mobile layout: single column with sticky bottom action.

Do not use a dashboard of unrelated cards. The page should feel like one calm guided workflow.

Add loading, empty, error, retry, and success states. Use plain language. Never use “career operating system,” “intelligence units,” “AI-powered transformation,” or “ATS score.”
```

## Prompt 4 — implement resume and proof selection

```text
Implement the Resume and Proof steps using existing resume and work entities/components.

Resume step:
- show existing resumes;
- allow selecting one;
- allow importing a resume through the existing import flow;
- show a compact preview and selected state.

Proof step:
- show existing work/projects/certificates;
- allow selecting at least one project;
- allow adding a new project with title, description, tools, result/learning, and proof URL;
- clearly distinguish “evidence available” from “not enough evidence.”

Do not silently modify saved resume or work data. Every save must be explicit and scoped to the authenticated user.
```

## Prompt 5 — implement grounded fit analysis

```text
Implement one MVP AI operation called application_fit_analysis.

Input:
- job description;
- selected resume content;
- selected work/proof items.

Output must be validated with Zod and contain:
- requirements: [{ requirement, importance, evidenceItemIds, evidenceStrength }];
- strengths: [{ requirement, evidenceItemId, explanation }];
- gaps: [{ requirement, explanation, recommendedEvidenceAction }];
- one suggestedChange: { target, originalText, proposedText, sourceIds, rationale }.

Rules:
- Never invent metrics, employers, skills, or achievements.
- If evidence is missing, say so explicitly.
- Use the smallest context needed.
- Store the operation name, input size, model/provider, latency, and usage record.
- Make model providers replaceable behind the existing provider layer.

Add API tests for valid output, malformed model output, unauthorized access, empty job description, and unsupported claims.
```

## Prompt 6 — build review and approval UX

```text
Build the Review step around trust and user control.

For each suggestion show:
- what Zebra found;
- the source resume/work/job requirement;
- original text;
- proposed text;
- rationale;
- warning if the claim lacks evidence.

Provide explicit actions:
- Apply;
- Edit;
- Reject;
- Undo.

Applying a suggestion must create a new editable resume/application version. Never overwrite the master resume silently. Show a small version-history panel with timestamp and action. Add optimistic UI only when rollback is safe.
```

## Prompt 7 — export and share

```text
Implement the final Export step using the existing PDF and sharing infrastructure.

The user must be able to:
- review the final selected resume;
- export a PDF;
- create a public share token;
- open a public read-only application page;
- see exactly what is public before sharing;
- mark the application as Submitted.

Public pages must expose only explicitly selected fields and proof items. Do not expose private notes, raw AI input, internal IDs, or unselected work. Add tests for ownership, token access, revocation, and private-field leakage.
```

## Prompt 8 — align all UI copy and landing page

```text
Update the landing page, pricing, sidebar, dashboard, empty states, and buttons so they all communicate one promise:

“Turn your real work into a stronger, job-specific application.”

Replace resume-scorer and ATS-first language. Use:
- “Application pack” instead of “AI credits” where user-facing;
- “Fit and missing proof” instead of “ATS score”;
- “Zebra suggests; you approve” for AI behavior;
- “Start an application” as the primary CTA.

Remove placeholder social links, fix encoding artifacts, verify responsive spacing, and ensure buttons have visible focus and disabled states.
```

## Prompt 9 — seed a perfect demo mode

```text
Create a safe demo mode for presentations.

Seed:
- a fictional candidate named Ananya Das;
- one Frontend Developer job at Acme Labs;
- one resume;
- two projects, one with strong evidence and one with a clear gap;
- one pending suggestion;
- one shareable application preview.

Demo mode must not use real personal data, must not call paid AI APIs unless explicitly requested, and must have a deterministic fallback analysis. Add a “Reset demo” action. Make the complete flow demonstrable in under three minutes.
```

## Prompt 10 — quality and release gate

```text
Run the MVP release audit.

Verify:
- npm run lint;
- npm run typecheck;
- npm run test;
- npm run build;
- authenticated ownership on every application, resume, work, analysis, export, and share operation;
- no hallucinated claims in seeded and test analyses;
- desktop and mobile layouts;
- keyboard navigation and visible focus;
- loading, error, retry, empty, and success states;
- no placeholder links or broken routes.

Fix issues that block the single MVP journey. Do not add new features. Report the remaining risks with file paths and test evidence.
```

## Final demo script prompt

```text
Prepare a 3-minute demo script for Zebra’s MVP.

The narrative must start with a graduate who has real projects but cannot translate them into a job-specific application. Demonstrate one job, one resume, one project-to-requirement match, one honest evidence gap, one approved suggestion, and one exported/shared application. End with the measurable pilot plan: completed application packs, time-to-ready, repeat applications, paid conversion, and unsupported-claim rate.

Do not claim hiring uplift, proprietary foundation models, or guaranteed interviews. Position Zebra as the evidence layer between a graduate’s real work and the job they are applying for.
```

## Definition of done

The mini-project is ready when a new user can complete the full flow without instructions, every AI change is reviewable and reversible, the public page is privacy-safe, and the demo can be repeated reliably on a laptop in under three minutes.
