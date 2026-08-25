# Zebu Azure prototype and Voice Live handoff

## What works in the repository now

- A persistent **Talk to Zebu** launcher is rendered inside the authenticated dashboard.
- Chrome/Edge browser speech recognition captures the prototype command; typing remains available.
- `POST /api/zebu/turn` authenticates the Zebra user, rate-limits requests, loads only that user's resumes and applications, and sends a bounded structured-output request to the existing Azure Foundry deployment.
- Zebu can open allow-listed Zebra pages, resolve a saved canonical application or resume, and open the existing Resume Analysis and Role Match tools.
- Zebu is read-only. It cannot mutate data, spend credits, delete records, submit applications, email anyone, or browse arbitrary URLs.
- Gemini fallback is disabled for Zebu planning. Azure failures are visible to the user.

The prototype deliberately uses browser speech input/output. This lets the action layer be tested before incurring Voice Live usage. The next transport replaces browser speech with Azure Voice Live without changing the action contract.

## Azure portal checklist

### 1. Secure the existing resource

1. Rotate any Azure keys that have been copied into terminals, screenshots, chat, or logs.
2. Update `.env.local` and restart Zebra.
3. Keep keys server-side; never create `NEXT_PUBLIC_` voice or Foundry secrets.
4. Run `npm run azure:smoke`.

### 2. Confirm permissions

On the `zebra-ai-uae-resource` resource, open **Access control (IAM)**.

- Assign the developer account **Foundry User** and **Cognitive Services User**.
- Assign the Foundry project's managed identity **Foundry User** at project scope.
- Use **Foundry Project Manager** only for identities that must create agents, deployments, or connections.

### 3. Create the Foundry agent

In Microsoft Foundry, open the existing `zebra-ai-uae` project:

1. Go to **Build → Agents → New agent**.
2. Name it `zebu`.
3. Select the existing `zebra-gpt-5-4-mini` deployment.
4. Add the Zebu behavioural instructions from the product plan.
5. Do not attach database credentials or unrestricted browser tools.
6. Save the agent name/version.

### 4. Validate Voice Live in UAE North

1. Open **Services → Azure Speech - Voice Live**, or open the Voice Live feature page from Foundry.
2. Select **Open in playground**.
3. Select the `zebu` agent and turn **Voice mode** on.
4. Select a standard voice; avoid custom voice/avatar charges for the student prototype.
5. Enable interruption detection, server VAD, noise suppression, and echo cancellation.
6. Start a session and verify that the selected model/agent combination is available in this resource.

The model is already deployed in UAE North. Voice Live supports bringing an existing supported model, but portal availability is the final authority for the subscription, resource kind, quota, and region combination.

### 5. Configure the later server transport

Copy only non-secret identifiers into the optional variables shown in `.env.example`:

```dotenv
AZURE_VOICE_LIVE_ENDPOINT=https://zebra-ai-uae-resource.services.ai.azure.com
AZURE_VOICE_LIVE_API_VERSION=2026-04-10
AZURE_VOICE_LIVE_AGENT_NAME=zebu
AZURE_VOICE_LIVE_AGENT_VERSION=<saved-agent-version>
```

Production authentication should use Microsoft Entra ID and a short-lived token issued by a server route. Do not give the resource API key to the browser.

## Student-credit controls

Before enabling external testers:

1. Create Azure Cost Management budgets at 25%, 50%, 75%, and 90% of the amount allocated to Zebu.
2. Keep Voice Live sessions user-initiated and end idle sessions quickly.
3. Start with the standard voice and the existing GPT-5.4-mini deployment.
4. Keep Zebu's output short and retain at most the last few turns.
5. Rate-limit per user and cap daily voice minutes.
6. Do not enable Memory, avatar, hosted browser automation, or telephone calling in the first prototype.
7. Monitor model tokens, Voice Live audio tokens, endpoint errors, and average session duration weekly.

## Next implementation gate

Do not add mutation tools until the read-only command evaluation passes. A reasonable gate is:

- 95% correct destination/tool selection on a fixed 100-command test set.
- Zero cross-user record exposure.
- Zero arbitrary/external navigation.
- Clear failure when Azure is unavailable.
- User confirmation design reviewed before any credit-spending or destructive operation.

After that gate, add application creation/status updates with idempotency keys and confirmation tokens. Telephone and sandboxed external browser automation should remain later phases.
