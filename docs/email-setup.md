# Account email setup

Zebra uses Resend for verification and password-reset emails. Push notifications cannot deliver a password-reset link reliably to someone who has lost access to their account or device.

## Before enabling it

1. Add `zebra-ai.app`, which you already own, in Resend. You do not need a separate mail domain or paid inbox to send transactional mail.
2. Publish the DNS records Resend gives you for `zebra-ai.app` and wait until sending is verified. You can use a sending subdomain later if you want to separate email reputation.
3. Create a Resend API key with sending permission. Set these server-side environment variables in your hosting provider:

   ```text
   RESEND_API_KEY=...
   EMAIL_FROM=Zebra AI <accounts@zebra-ai.app>
   ```

4. Set `BETTER_AUTH_URL` to the public HTTPS app origin. Do not put `RESEND_API_KEY` in any `NEXT_PUBLIC_` variable or commit it to Git.
   Set `NEXT_PUBLIC_APP_URL` to `https://zebra-ai.app` and `NEXT_PUBLIC_SUPPORT_EMAIL` to a working inbox you monitor. A personal email is acceptable temporarily for support, refunds, and privacy requests.
5. Deploy, register a fresh account, follow the verification link, request a password reset, and confirm that the old password and other sessions stop working.

Both email variables are required together. Until they are configured, Zebra does not require email verification and cannot send password-reset mail. Configure the sender only after Resend verifies the domain; otherwise new email/password users can be unable to sign in.

Resend's test sender is useful for development but does not replace a verified sender domain for customer email. A sending address also does not create an inbox. Before launching, provide a monitored reply or support address and update the legal-policy contact addresses if necessary.

If your DNS is on Cloudflare, its Email Routing can forward `support@zebra-ai.app` to an inbox you already use. Verify that an external test message arrives before setting `NEXT_PUBLIC_SUPPORT_EMAIL=support@zebra-ai.app`. Otherwise use a forwarding or mailbox option from your DNS/email provider. Keep the sender's DNS records and inbound MX records consistent with each provider's instructions.

Account email is transactional. Marketing updates need separate opt-in, unsubscribe handling, and a clear preference setting; this integration does not subscribe users to promotional messages.
