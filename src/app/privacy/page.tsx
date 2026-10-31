import React from "react";
import Link from "next/link";
import { getSupportEmail } from "@/lib/constants/support";

export const metadata = {
    title: "Privacy Policy | Zebra AI",
    description: "Zebra AI Privacy Policy: how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
    const supportEmail = getSupportEmail();
    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            <nav className="h-16 border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center px-8">
                <Link href="/" className="font-black text-lg tracking-tight">Zebra AI</Link>
                <span className="mx-3 text-black/20">·</span>
                <span className="text-sm font-semibold text-black/50">Privacy Policy</span>
            </nav>
            <main className="max-w-3xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
                <p className="text-sm text-neutral-600 font-semibold mb-12">Last updated: October 30, 2026</p>

                <div className="prose-zebra space-y-10">
                    <Section title="1. Information We Collect">
                        <p>When you use Zebra AI, we collect information you provide directly:</p>
                        <ul>
                            <li><strong>Account Information:</strong> Name and email address for email signup; name, email address, and profile picture may be received when you choose Google sign-in.</li>
                            <li><strong>Resume and workspace data:</strong> Content you create, upload, or import, including resume text, structured resume records, uploaded PDFs, cover letters, applications, work items, LinkedIn profile text you paste or export, and AI request and usage records needed for features and credits.</li>
                            <li><strong>Voice sessions:</strong> If you use Zebu with a microphone, the browser captures audio for that session. Audio is sent to Google Gemini Live to produce a spoken reply. Session transcripts may exist for the duration of the live session. Microphone access can be denied in the browser; Zebra does not record voice when Zebu is closed.</li>
                            <li><strong>Payment records:</strong> Checkout is processed by Razorpay. Zebra stores order identifiers, payment identifiers, signatures, pack selection, and credit grants. Card numbers and CVV values are not stored in Zebra application databases.</li>
                            <li><strong>Connected accounts:</strong> If you link LinkedIn or GitHub, we store the connection and provider identifiers. LinkedIn linking is identity only and does not sync or publish your profile. A separate GitHub App installation can read metadata and limited content from repositories you grant. You review evidence before adding it to your workspace.</li>
                            <li><strong>Public portfolios:</strong> If you publish a portfolio page, the selected work you mark public is visible on the internet at the public URL.</li>
                            <li><strong>Browser storage:</strong> Editor preferences, some unfinished drafts, and LinkedIn activity links you choose to record stay in your browser (localStorage). They are not the same as server account data.</li>
                            <li><strong>Diagnostics:</strong> Server errors and request details may be sent to Azure Application Insights when monitoring is enabled.</li>
                        </ul>
                    </Section>

                    <Section title="2. How We Use Your Information">
                        <ul>
                            <li>To provide and improve the Zebra AI Compiler experience.</li>
                            <li>To power AI features (resume review, job matching, cover letters, LinkedIn audit, Zebu) using the workspace content you submit for that request.</li>
                            <li>To authenticate your identity and manage your account.</li>
                            <li>To process payments and manage one-time credit packs.</li>
                            <li>To send important service updates (no marketing spam).</li>
                        </ul>
                    </Section>

                    <Section title="3. AI and data processing">
                        <p>Zebra uses Microsoft Azure Foundry as the primary text AI provider for reviews, matching, drafts, and audits. Google Gemini may be used as a fallback when Foundry is unavailable. Zebu typed replies prefer Google Gemini when a Gemini key is configured, and may use Foundry if Gemini is unavailable. Zebu live voice uses the Google Gemini Live API.</p>
                        <ul>
                            <li>Content you submit for an AI feature (resume text, job descriptions, LinkedIn export text, voice audio for Zebu) is sent to the provider for that request.</li>
                            <li>AI responses and usage records may be saved when a feature needs them for your workspace or credit history.</li>
                            <li>Microsoft&apos;s published policy for Foundry Models sold by Azure states that prompts and completions are not used to train generative foundation models without the customer&apos;s permission or instruction. Whether Zebra&apos;s specific Azure resource has additional logging or preview features enabled is an owner configuration fact and is not asserted here.</li>
                            <li>Google&apos;s Gemini API terms distinguish paid services (prompts not used to improve Google products) from unpaid or free-quota services (which may be used to improve Google products). Whether Zebra&apos;s Gemini keys are on a paid plan is an owner configuration fact and is not asserted here. The Gemini Live API is stateful and may store conversation state so a session can reconnect.</li>
                            <li>Zebra does not scrape LinkedIn profiles or post changes to LinkedIn. A LinkedIn URL you enter identifies the profile for your records.</li>
                            <li>Only use AI features with content you are authorized to submit to the named providers.</li>
                        </ul>
                    </Section>

                    <Section title="4. Data security">
                        <ul>
                            <li>Data in transit uses HTTPS.</li>
                            <li>Application data is stored in Neon Postgres with SSL-enforced connections.</li>
                            <li>Sign-in uses Better Auth session cookies.</li>
                            <li>Resume PDF export and other owner-scoped APIs check the signed-in user before returning records.</li>
                            <li>Zebra does not claim SOC, ISO, or other certifications in this policy.</li>
                        </ul>
                    </Section>

                    <Section title="5. Data Retention">
                        <p>Account and resume data is retained while your account is active. To request deletion, email <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a>. We will explain any records that must be kept for payment, security, or legal reasons. Self-service account deletion is not currently available.</p>
                    </Section>

                    <Section title="6. Third-Party Services">
                        <p>We integrate with:</p>
                        <ul>
                            <li><strong>Google OAuth</strong> — for authentication.</li>
                            <li><strong>Microsoft Azure Foundry</strong> — for primary AI processing.</li>
                            <li><strong>Google Gemini</strong> — for Zebu typed replies (preferred), optional fallback for other text features, and Zebu live voice.</li>
                            <li><strong>Razorpay</strong> — for payment processing.</li>
                            <li><strong>Neon</strong> — for database hosting.</li>
                            <li><strong>GitHub and LinkedIn</strong> — when you choose to connect an account; GitHub repository reads require a separate installation.</li>
                            <li><strong>Azure Application Insights</strong> — for server diagnostics when enabled.</li>
                        </ul>
                        <p>Each service operates under its own privacy policy.</p>
                    </Section>

                    <Section title="7. Your Rights">
                        <ul>
                            <li><strong>Access and correction:</strong> You can view and edit much of your workspace in the dashboard. Additional copies or corrections can be requested through the contact address below.</li>
                            <li><strong>Deletion:</strong> Self-service account deletion is not implemented. Request deletion through the contact address below. Payment records, security logs, or legal holds may need to be retained; that process will be explained with the request. Exact retention periods are not published here because they are not encoded as product guarantees.</li>
                            <li><strong>Voice:</strong> Closing Zebu ends the live session. Browser microphone permission is controlled by you.</li>
                        </ul>
                    </Section>

                    <Section title="8. Cookies">
                        <p>We use essential cookies for authentication and session management. The app code has no browser advertising or site analytics cookies. Server diagnostics may be sent to Azure Application Insights. See the <Link href="/cookies" className="underline">Cookie Policy</Link> for details. Payment checkout may use Razorpay cookies when opened.</p>
                    </Section>

                    <Section title="9. Changes to This Policy">
                        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification.</p>
                    </Section>

                    <Section title="10. Contact">
                        <p>For privacy-related inquiries: <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a></p>
                    </Section>
                </div>

                <div className="mt-16 pt-8 border-t border-black/5 flex items-center justify-between text-sm text-black/40">
                    <Link href="/terms" className="hover:text-black transition-colors font-semibold">Terms of Service →</Link>
                    <Link href="/" className="hover:text-black transition-colors font-semibold">← Back to Home</Link>
                </div>
            </main>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="text-xl font-black tracking-tight mb-4">{title}</h2>
            <div className="text-[15px] text-black/70 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:text-black/70">
                {children}
            </div>
        </section>
    );
}
