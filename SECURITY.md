# Security Policy

## Supported versions

Zebra AI is under active development. Fixes are maintained on `main`; there
is no published long-term support schedule for older commits or forks. A merge
to `main` does not prove that a hosted deployment has been updated. Releases
must pass the checks and approvals in [DEPLOYMENT.md](DEPLOYMENT.md).

## Reporting a vulnerability

Please do not report vulnerabilities in a public issue, discussion, pull
request, or social post.

Use GitHub's **Security** tab and select **Report a vulnerability**, or open
the [private reporting form](https://github.com/Bishu-21/zebra-ai/security/advisories/new).
If that form is unavailable, email
[accounts@zebra-ai.app](mailto:accounts@zebra-ai.app) with the subject
`Security report`. Include:

- A concise description and the affected component or route.
- Reproduction steps or a minimal proof of concept.
- The impact you believe is possible.
- Any suggested mitigation, if known.
- Whether the issue has been disclosed anywhere else.

Use synthetic examples. Do not send passwords, API keys, session cookies,
full resumes, or production database exports. Redact identifying information
from screenshots and logs. If you encounter an exposed credential, report its
location rather than testing or reproducing its value in a public report.

The maintainer, [@Bishu-21](https://github.com/Bishu-21), assesses reports and
coordinates fixes and disclosure as resources permit. There is no guaranteed
response or remediation deadline and no advertised bug-bounty payment. Please
allow time for investigation before public disclosure.

## Safe-harbor intent

Prefer a local instance with synthetic data and your own development services.
Do not access other users' records, run destructive tests, disrupt availability,
make real purchases, consume other people's AI credits, or test third-party
infrastructure without its operator's permission. This policy does not grant
authorization over Neon, Vercel, Azure, Google, Razorpay, or other providers.
Stop testing and report if you encounter personal or confidential data.

Good-faith reports that respect these boundaries are welcome. Coordinate any
testing that requires broader access with the maintainer in advance.

## Release and incident handling

Keep credentials out of Git, issue reports, and screenshots. Configuration
changes, database migrations, and production approvals are separate actions;
do not bypass them to demonstrate a vulnerability. A clean dependency audit,
passing build, or HTTP health probe does not establish that the application is
free of vulnerabilities.

For account support or deletion requests, contact
[accounts@zebra-ai.app](mailto:accounts@zebra-ai.app). For ordinary product bugs,
use the [bug report template](https://github.com/Bishu-21/zebra-ai/issues/new/choose).
