# Weekly LinkedIn presence automation

The Sep 18–24 progress email reports zero posts and zero comments. Treat its “up to 4x” and “up to 3x” claims as prompts to experiment, not guaranteed results or factors to multiply.

## Reverse-engineer the workflow

Start with the desired outcome: a useful, evidence-backed post and comment each week. Work backward through the observable steps: choose a topic, find a credible personal proof point, draft, review, open LinkedIn, publish, then record the outcome. The current LinkedIn audit already supports profile evidence and human-reviewed drafts. The evidence graph supplies skills, actions, outcomes, and proof URLs; it can ground suggestions without inventing achievements.

Represent each suggestion as edges among `Person`, `TargetRole`, `Skill`, `Evidence`, `Topic`, `Draft`, `Activity`, and `Outcome`. For example: `Evidence -supports-> Draft -targets-> Topic`; `Activity -uses-> Draft`; `Outcome -measures-> Activity`. Keep user ID and source on every edge. The existing relational evidence graph is enough for an initial implementation; a separate graph database becomes useful only if multi-hop queries become a measured bottleneck.

## First automation

1. Once per week, check user-confirmed post and comment timestamps. An email saying “no posts” is a useful input, but is not a reliable account-wide API signal.
2. If a type of activity is missing, rank evidence nodes for the user's target role and offer one post idea and one thoughtful comment angle. Link each claim to its evidence node.
3. Let the user edit and approve each draft. Provide the LinkedIn compose/feed links; record completion only after user confirmation or an authorized API signal.
4. Compare profile views and relevant engagement over several weeks against the user's own baseline. Avoid claiming that the LinkedIn email's association is causal.

Jev can score or classify candidate ideas after the `jev/acme-jev` connector is installed and bound to this Vercel project. Retrieve credentials with `getJevToken()` in server-side code only. Add the actual Jev API call when its endpoint and request schema are known; a token alone cannot perform scoring.

## LoRA decision

Begin with structured prompts, a rubric, and accepted/rejected draft feedback. Consider LoRA only after collecting a consented, sufficiently large set of reviewed examples and finding a repeatable quality gap that prompt changes cannot close. Keep private profile data out of training without explicit consent. Evaluate any adapter on held-out users and compare factual accuracy, style fit, and edit rate against the non-fine-tuned baseline.

## Vercel setup remaining

This checkout is not linked to a Vercel project, and the CLI reported a logged-out state. From the project root, run `npx vercel login`, `npx vercel link`, `npx vercel connect create jev --name acme-jev`, and `npx vercel env pull` in that order. Complete any browser registration requested by Vercel. Then bind the connector to the required deployment environments and verify a server-side token request without logging its value.
