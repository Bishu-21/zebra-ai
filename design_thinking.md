# Design Thinking Assessment: Zebra AI (XaaS Strategy)

This document applies the **Design Thinking** framework to assess Zebra AI’s strategic position against competitors like **Overleaf** and **OpenAI Prism**, while defining the shift from **SaaS** to **XaaS**.

---

## 1. Empathize: The User Crisis in 2026
Recruitment has shifted from human-led scanning to **Hyper-Automated ATS Filters**. Use cases for Overleaf (LaTeX precision) and Prism (AI-native authoring) show that users are drowning in powerful *tools* but failing at the *result* (getting the job).

### The Struggle
- **Overleaf Users**: Struggle with technical complexity only to produce "static" documents that don't talk back to recruiters.
- **Candidate concern**: AI-written material can lose the source context that supports a candidate's experience.
- **Zebra Target**: The engineer who needs to prove their "unique stripe pattern" (uniqueness) in a sea of AI-generated generic horses.

---

## 2. Define: SaaS vs. XaaS Principles
To compete with titans like OpenAI, Zebra must operate as **XaaS (Everything-as-a-Service)** rather than a simple SaaS tool.

| Feature | SaaS (Software as a Service) | XaaS (Everything as a Service) |
| :--- | :--- | :--- |
| **Focus** | Application features and functions | Outcomes, capabilities, and "Jobs to be Done" |
| **Relationship** | User uses the tool to do work | The service provides the solution autonomously |
| **Revenue** | Subscription for access | Performance-based or value-driven units (Credits) |
| **Zebra Example** | "A resume builder with AI" | "Job Acquisition Engine & Metadata Audit" |

> [!IMPORTANT]
> **Product principle**: Zebra helps candidates organize source evidence, review proposed edits, and produce clear application documents. Scores are guidance, not vendor certification or outcome guarantees.

---

## 3. Competitive Landscape (Tech Stack Analysis)

### Overleaf (The Legacy Standard)
- **Strengths**: Robust LaTeX rendering, solid PDF.js integration, stable Node.js/Socket.io backend.
- **Zebra’s Edge**: Overleaf is a *document* tool. Zebra is a *metadata* tool. Overleaf is about *how it looks*; Zebra is about *how it is read* by machines.

### OpenAI Prism (The AI-Native Giant)
- **Strengths**: GPT-5.2 core, extreme speed (Turbopack), deep contextual awareness of the whole document.
- **Zebra’s focus**: preserve source evidence and show users exactly which proposed edits they approve. Zebra does not provide ATS bypasses or vendor-certified compatibility.

---

## 4. Design Thinking: Step-by-Step Assessment

### Phase 1: Empathy Mapping
- **What do users feel?** Imposter syndrome when AI writes their resume.
- **What is the goal?** A clear, reviewable explanation of what is supported, partial, missing, or not assessed.
- **Action**: Increase the "Tactile" feedback of the `ScratchCard` and `Strategic Match` animations to build trust in the "Surgical" nature of the AI.

### Phase 2: Ideation (Differentiating via XaaS)
- **Feature Layer**: Real-time PDF previews (Prism does this).
- **Service layer**: evidence-grounded recommendations based on the supplied resume, work, and job description.
- **Action**: Implement "Metadata Fingerprinting" to certify that the resume isn't just AI-fluff, but audited technical truth.

### Phase 3: Prototyping (The UI/UX Moat)
- **Aesthetics**: Avoid the "Chatbot" look of Prism. Stick to the **premium, dark-mode, surgical instrument** aesthetic.
- **Tech Goal**: Use **Turbopack** and **Next.js 16/17** to match Prism's speed, but keep the UI focused on the "Recruitment Matrix" visualization.

---

## 5. Strategic Roadmap: Project Steps

1. **[ ] Step 1: The Integrity Protocol**: Formalize the "Audit" logic as a standalone backend service. Ensure it doesn't just "rewrite" text but "verifies" it against Job Description JSON data.
2. **[ ] Step 2: XaaS Credit Economy**: Refine the Razorpay integration to sync with "Value Units." One credit = one "Alpha Match" result, reinforcing the XaaS value proposition.
3. **[ ] Step 3: Recommendation quality**: Build a deeper, tested library of evidence-grounded recommendations.
4. **[ ] Step 4: Reviewed sharing**: Allow candidates to share only resumes they have reviewed, without presenting the link as third-party verification.

---

## Summary
Zebra AI should not try to be a better LaTeX editor than Overleaf or a better general writer than OpenAI Prism. Zebra must be the **XaaS Layer for Career Integrity**—the tool that confirms your "Streaks" are real in an age of AI hallucinations.
