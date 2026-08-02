# Zebra UI/UX audit and next build plan

## Executive diagnosis

The product has a polished visual language, but the experience still presents too many equal-priority actions: Analyze Resume, Tailor Resume, Build Resume, Import Resume, and Project Analyzer. That makes Zebra feel like a toolbox. The strongest product story is a guided application workspace.

The visual layer is already good enough for a demo. The next improvement is not more animation; it is stronger information hierarchy, clearer copy, fewer choices, and a reliable end-to-end demo path.

## UI/UX findings from the codebase

### High priority

1. **Landing-page promise is misaligned.** The hero says “Resumes aren’t broken. The process is,” but the scratch-card payoff says “ATS rejected it.” That reinforces the exact ATS/resume-scorer category Zebra should escape. Replace it with a concrete application outcome.
2. **Dashboard has competing heroes.** The “Next Step” banner is correct, but it is followed by five action cards that pull the user away. Make “Continue application” the dominant action and move the other tools into the workspace or secondary actions.
3. **Navigation language is inconsistent.** “My Applications,” “My Resume,” “My Work,” and “Portfolio” are understandable, but the home page still talks about AI optimizations and reports. Use one vocabulary: application, work, proof, fit, next step.
4. **The user cannot immediately see the value of proof.** Project analysis exists, but the main flow must show exactly which work item supports which job requirement, with a visible source/proof link.
5. **The product makes AI the actor.** Copy such as “AI optimizations,” “deep AI resume audit,” and “high conversion” sounds generic and makes trust harder. Use “Zebra suggests; you approve.”

### Medium priority

- Replace credit-first labels with outcomes: “1 application pack” rather than “1 AI scan credit.”
- Add explicit empty states with one recommended action, not several options.
- Add a visible progress stepper inside each application: Job → Resume → Proof → Review → Export → Follow-up.
- Make every AI suggestion show its source: resume section, work item, or job requirement.
- Add keyboard focus states, `aria-describedby` for errors, and consistent loading/success states across AI actions.
- Audit mobile layouts; the landing page has a floating bottom nav, while the dashboard uses a slide-out sidebar. Ensure neither covers primary buttons or form controls.
- Replace placeholder social links (`href="#"`) before public demos.
- Fix visible encoding artifacts such as `Â©` and the malformed characters in some product documentation/UI strings.

## The demo path to build

Create one seeded demo account or a demo mode with a realistic frontend candidate and one job. The path must work in under three minutes:

1. Open “Frontend Developer — Acme” from Home.
2. Show the job requirements grouped into must-have and evidence-needed.
3. Show the candidate’s real project linked to the requirement.
4. Show one honest gap: “testing experience is not evidenced.”
5. Generate a suggested resume change; display the source and approval control.
6. Approve it and show the version history.
7. Export the application PDF and open the shareable portfolio/application page.
8. Mark the application as submitted and show the next follow-up date.

The wow moment should be traceability, not a flashy chatbot: **job requirement → candidate evidence → approved application change → tracked outcome**.

## Implementation order

### Sprint 1: remove confusion

- Make the dashboard’s primary CTA “Start an application.”
- Build a canonical application workspace route that composes existing components.
- Move Analyze Resume, Tailor Resume, Project Analyzer, and Cover Letter into application steps.
- Update landing, pricing, sidebar, and empty-state copy to the same product promise.

### Sprint 2: make trust visible

- Add structured suggestion cards with `source`, `reason`, `proposed change`, and `unsupported-claim warning`.
- Implement Apply, Edit, Reject, and Undo consistently.
- Preserve an application change history and show who approved the change.
- Add proof-link validation and a clear “not enough evidence” state.

### Sprint 3: make the demo reliable

- Add seeded demo data and a demo-mode entry point.
- Add event tracking for job added, resume attached, proof attached, suggestion approved, export, share, payment, and outcome.
- Add failure recovery for AI timeout, parsing failure, missing credits, and database unavailability.
- Run lint, typecheck, tests, and production build; then test the complete demo on mobile and desktop.

### Sprint 4: validate the business

- Recruit 20–30 students through two Kolkata colleges, communities, or placement cells.
- Charge for an application pack instead of selling abstract AI credits.
- Measure time-to-ready, completion, second application, paid conversion, and unsupported suggestions.
- Collect before/after application artifacts and permissioned testimonials.

## What to show VCs and Google/IIMCIP

Google’s AI Day for Startups India 2026 is explicitly about moving from experimentation to execution, with emphasis on agentic workflows, multimodal AI, sovereign/localized AI, and deploying products with Google AI and Google Cloud. Position Zebra around execution and measurable workflow value, not around having used many models. [Google Cloud event page](https://cloud.google.com/events/ai-day-for-startups-india-2026)

Use this five-slide / five-minute structure:

1. **Pain:** “Students have work, but cannot convert it into evidence-backed applications.” Show one anonymized messy resume/project/job situation.
2. **Product:** live demo of the one application loop.
3. **Trust and AI architecture:** model-agnostic orchestration, small-context prompts, structured schemas, human approval, and no invented claims.
4. **Business and distribution:** paid application packs plus college/placement-cell distribution; explain why each channel reduces acquisition cost.
5. **Proof and ask:** current users, completed applications, paid pilots, time saved, suggestion accuracy, and the exact next milestone you want help with.

## Questions you should be ready to answer

- Why is this not just ChatGPT plus a resume template?
- Why will a student use it for a second application?
- Who pays: student, college, bootcamp, or recruiter?
- What evidence shows the product improves applications rather than just writing them?
- How do you prevent hallucinated achievements and privacy leaks?
- What happens when model quality becomes a commodity?
- What is your wedge in Kolkata, and how does it expand across India?
- What are your current AI cost and gross-margin assumptions?
- What exactly will the next ₹X of capital unlock in 90 days?

## The strongest one-line answer

“We are not trying to make AI write more resumes. We are building the evidence layer between a graduate’s real work and the job they are applying for.”

## Demo-day behavior

- Start with the customer and the job, not the architecture.
- Use one real workflow and one honest failure/gap.
- Let the audience see approval and traceability.
- Show the product working live, with a preloaded fallback recording or local demo mode.
- Ask for two specific introductions: one placement-cell pilot and one early-stage investor/customer discovery conversation.
- Do not claim hiring uplift until you have controlled evidence.
