import Link from "next/link";

export const metadata = { title: "Refund Policy | Zebra AI" };

export default function RefundPolicyPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return <main className="mx-auto max-w-3xl px-6 py-16 text-neutral-900">
    <Link href="/" className="underline">Zebra AI home</Link>
    <h1 className="mt-8 text-4xl font-bold">Refund Policy</h1>
    <p className="mt-6 leading-7">Zebra AI sells one-time credit packs. {supportEmail ? <>If a payment was duplicated, credits were not delivered, or a paid feature failed, email <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a> with your payment ID, purchase date, and a short description. You may submit a request at any time.</> : "A working support address for payment and refund requests must be published before paid launch."} Do not send card details or passwords.</p>
    <p className="mt-4 leading-7">We review each request against the payment and credit records and reply with the outcome and any remedy. Refunds required by applicable law will be provided. Where a refund is approved, processing time depends on the payment provider and your bank. Credits already used may affect the remedy available for a discretionary request.</p>
    <p className="mt-4 leading-7">This page does not limit statutory consumer rights. For account or data requests, see our <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
  </main>;
}
