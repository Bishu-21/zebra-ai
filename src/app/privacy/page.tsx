import React from "react";
import Link from "next/link";

export const metadata = {
    title: "Privacy Policy | Zebra AI",
    description: "Zebra AI Privacy Policy — how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
    const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            <nav className="h-16 border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center px-8">
                <Link href="/" className="font-black text-lg tracking-tight">Zebra AI</Link>
                <span className="mx-3 text-black/20">·</span>
                <span className="text-sm font-semibold text-black/50">Privacy Policy</span>
            </nav>
            <main className="max-w-3xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
                <p className="text-sm text-neutral-600 font-semibold mb-12">Last updated: September 26, 2026</p>

                <div className="prose-zebra space-y-10">
                    <Section title="1. Information We Collect">
                        <p>When you use Zebra AI, we collect information you provide directly:</p>
                        <ul>
                            <li><strong>Account Information:</strong> Name and email address for email signup; name, email address, and profile picture may be received when you choose Google sign-in.</li>
                            <li><strong>Resume Data:</strong> The content you create, upload, or import into the Zebra Compiler, including text, structured data, and uploaded documents (e.g., PDF resumes).</li>
                            <li><strong>Service Data:</strong> Saved applications, work items, AI requests and usage records needed to provide features and account credits.</li>
                            <li><strong>Payment Information:</strong> Processed securely through Razorpay. We never store your card details.</li>
                            <li><strong>Connected accounts:</strong> If you link LinkedIn or GitHub, we store the connection and provider identifiers. A separate GitHub App installation can read metadata and limited content from repositories you grant the installation access to. You review evidence before adding it to your workspace.</li>
                            <li><strong>Diagnostics:</strong> Server errors and request details may be sent to Azure Application Insights when monitoring is enabled.</li>
                        </ul>
                    </Section>

                    <Section title="2. How We Use Your Information">
                        <ul>
                            <li>To provide and improve the Zebra AI Compiler experience.</li>
                            <li>To power AI features (copilot suggestions, RAG assistant) using your resume context.</li>
                            <li>To authenticate your identity and manage your account.</li>
                            <li>To process payments and manage one-time credit packs.</li>
                            <li>To send important service updates (no marketing spam).</li>
                        </ul>
                    </Section>

                    <Section title="3. AI & Data Processing">
                        <p>Zebra AI uses Microsoft Azure Foundry as its primary AI provider and may use Google Gemini as a transient-error fallback. When you use AI features:</p>
                        <ul>
                            <li>Your resume content is sent to AI models for processing.</li>
                            <li>AI responses and usage records may be saved when a feature needs them for your workspace or credit history.</li>
                            <li>Provider handling of submitted data depends on the applicable provider terms and configuration.</li>
                            <li>Only use AI features with content you are authorized to submit to the named providers.</li>
                        </ul>
                    </Section>

                    <Section title="4. Data Security">
                        <p>We implement industry-standard security measures:</p>
                        <ul>
                            <li>All data transmitted via HTTPS/TLS encryption.</li>
                            <li>Database hosted on Neon Postgres with SSL-enforced connections.</li>
                            <li>Authentication managed via Better Auth with secure session tokens.</li>
                            <li>Premium export endpoints are server-side gated to prevent unauthorized access.</li>
                        </ul>
                    </Section>

                    <Section title="5. Data Retention">
                        <p>Account and resume data is retained while your account is active. {supportEmail ? <>To request deletion, email <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a>.</> : "A contact address for deletion requests will be published before paid launch."} We will explain any records that must be kept for payment, security, or legal reasons. Self-service account deletion is not currently available.</p>
                    </Section>

                    <Section title="6. Third-Party Services">
                        <p>We integrate with:</p>
                        <ul>
                            <li><strong>Google OAuth</strong> — for authentication.</li>
                            <li><strong>Microsoft Azure Foundry</strong> — for primary AI processing.</li>
                            <li><strong>Google Gemini</strong> — for optional transient-error fallback processing.</li>
                            <li><strong>Razorpay</strong> — for payment processing.</li>
                            <li><strong>Neon</strong> — for database hosting.</li>
                            <li><strong>GitHub and LinkedIn</strong> — when you choose to connect an account; GitHub repository reads require a separate installation.</li>
                            <li><strong>Azure Application Insights</strong> — for server diagnostics when enabled.</li>
                        </ul>
                        <p>Each service operates under its own privacy policy.</p>
                    </Section>

                    <Section title="7. Your Rights">
                        <ul>
                            <li><strong>Access:</strong> Request a copy of your data at any time.</li>
                            <li><strong>Correction:</strong> Update your information via the dashboard.</li>
                            <li><strong>Deletion:</strong> Request account and data deletion through the contact address below.</li>
                            <li><strong>Assistance:</strong> Contact us if dashboard controls do not meet your request.</li>
                        </ul>
                    </Section>

                    <Section title="8. Cookies">
                        <p>We use essential cookies for authentication and session management. The app code has no browser advertising or site analytics cookies. Server diagnostics may be sent to Azure Application Insights. See the <Link href="/cookies" className="underline">Cookie Policy</Link> for details. Payment checkout may use Razorpay cookies when opened.</p>
                    </Section>

                    <Section title="9. Changes to This Policy">
                        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification.</p>
                    </Section>

                    <Section title="10. Contact">
                        <p>For privacy-related inquiries: {supportEmail ? <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a> : "A contact address will be published before paid launch."}</p>
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
