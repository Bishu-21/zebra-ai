# Zebra AI Deployment Guide

This guide outlines the process for deploying Zebra AI to Vercel, its primary hosting platform.

## 1. Production Hosting: Vercel

> [!WARNING]
> Never commit `.env.local` to source control. Always configure these variables securely via the Vercel Dashboard (Settings > Environment Variables).

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://[user]:[password]@[host]/[dbname]?sslmode=require&channel_binding=require"

# Better Auth Configuration
BETTER_AUTH_SECRET="[secure-random-string]"
BETTER_AUTH_URL="https://zebra-ai.app"
BETTER_AUTH_TRUSTED_ORIGINS="https://zebra-ai.app,https://www.zebra-ai.app"
NEXT_PUBLIC_APP_URL="https://zebra-ai.app"

# Google OAuth
GOOGLE_CLIENT_ID="[production-google-client-id]"
GOOGLE_CLIENT_SECRET="[production-google-client-secret]"

# Gemini AI Pipeline
GEMINI_API_KEY="[production-gemini-key]"
GEMINI_MODEL="gemma-4-31b-it"
COPILOT_MODEL="gemini-2.5-flash-lite"
RAG_MODEL="gemma-3-27b-it"

# Razorpay Production Keys (Use test keys initially if verifying deployment)
NEXT_PUBLIC_RAZORPAY_KEY_ID="[production-key-id]"
RAZORPAY_KEY_ID="[production-key-id]"
RAZORPAY_KEY_SECRET="[production-key-secret]"
```

### Build Configuration

Ensure your Vercel project is configured to use **Node.js 20.x** (Settings > General > Node.js Version). Next.js 16 requires Node 20+.

**Build Command**:
```bash
npm run build
```
*(Dependencies are installed automatically via `npm install`)*

### Domain Setup (zebra-ai.app)

1. Go to your Vercel Project > **Settings** > **Domains**.
2. Add `zebra-ai.app` and `www.zebra-ai.app`.
3. Follow the DNS instructions provided by Vercel to point your domain (usually a CNAME for `www` and an A record for the apex).
4. Vercel automatically provisions and manages the SSL certificate.

### Vercel Deployment Checklist

- [ ] Visit `https://zebra-ai.app` and verify the landing page.
- [ ] Confirm Google OAuth login works (ensure `https://zebra-ai.app/api/auth/callback/google` is in your Google Cloud Console).
- [ ] Test a basic AI generation task in the Resume Editor.
- [ ] Review the Vercel Runtime Logs for any startup warnings or 500 errors.

## 2. Database Schema Management

> [!IMPORTANT]
> Database schema migrations (`npx drizzle-kit push`) should **not** be run automatically during the standard Vercel build pipeline. Never run `--force` automatically in CI to prevent accidental data loss.

When schema changes occur:
1. Run migrations manually from your local machine before deployment:
   ```bash
   npx drizzle-kit push
   ```
2. Once the schema is updated in the Neon database, push your application code to Vercel to align with the new schema.

## 3. Razorpay Test Checklist

Before swapping to production Razorpay keys, run a full payment test on the live deployment:

- [ ] Ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID` uses the `rzp_test_...` prefix.
- [ ] Go to the credits page and initialize a transaction.
- [ ] Complete the checkout using Razorpay's test card details (e.g., Visa `4111 1111 1111 1111`).
- [ ] Verify that the database registers the credit increment.
- [ ] Ensure the webhook/verification endpoint successfully processed the order. 
- [ ] Swap the environment variables in Vercel to use live credentials and redeploy.

## 4. Optional Azure Enhancements

While Vercel acts as the primary deployment host, Zebra AI can leverage the following Azure ecosystem services to enhance architecture and observability:

- **Application Insights / Azure Monitor**: For deep observability evidence, telemetry, and advanced trace logging.
- **Azure Document Intelligence**: As a high-accuracy benchmark comparison against the existing resume parsing pipeline.
- **Azure AI Search**: For advanced vector search capabilities in future Job and Resume RAG (Retrieval-Augmented Generation) features.
- **Azure Key Vault**: For enterprise-grade secrets management comparison versus standard environment variables.
- **Azure Translator / Speech**: As a reliable fallback or analytical comparison with the Sarvam integration for regional processing.
