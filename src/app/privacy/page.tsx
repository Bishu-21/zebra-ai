import React from "react";
import Link from "next/link";

export const metadata = {
    title: "Privacy Policy | Zebra AI",
    description: "Zebra AI Privacy Policy — how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            <nav className="h-16 border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center px-8">
                <Link href="/" className="font-black text-lg tracking-tight">Zebra AI</Link>
                <span className="mx-3 text-black/20">·</span>
                <span className="text-sm font-semibold text-black/50">Privacy Policy</span>
            </nav>
            <main className="max-w-3xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
                <p className="text-sm text-black/40 font-semibold mb-12">Last updated: April 6, 2026</p>

                <div className="prose-zebra space-y-10">
                    <Section title="1. Information We Collect">
                        <p>When you use Zebra AI, we collect information you provide directly:</p>
                        <ul>
                            <li><strong>Account Information:</strong> Name, email address, and profile picture when you sign up via Google OAuth.</li>
                            <li><strong>Resume Data:</strong> The content you create, upload, or import into the Zebra Compiler, including text, structured data, and uploaded documents (e.g., PDF resumes).</li>
                            <li><strong>Usage Data:</strong> How you interact with our features, including AI-generated suggestions you accept or reject.</li>
                            <li><strong>Payment Information:</strong> Processed securely through Razorpay. We never store your card details.</li>
                        </ul>
                    </Section>

                    <Section title="2. How We Use Your Information">
                        <ul>
                            <li>To provide and improve the Zebra AI Compiler experience.</li>
                            <li>To power AI features (copilot suggestions, RAG assistant) using your resume context.</li>
                            <li>To authenticate your identity and manage your account.</li>
                            <li>To process payments and manage subscriptions.</li>
                            <li>To send important service updates (no marketing spam).</li>
                        </ul>
                    </Section>

                    <Section title="3. AI & Data Processing">
                        <p>Zebra AI uses third-party AI models (Google Gemini, Gemma) to provide intelligent features. When you use AI features:</p>
                        <ul>
                            <li>Your resume content is sent to AI models for processing.</li>
                            <li>AI responses are not stored beyond your active session unless you explicitly save them.</li>
                            <li>We do not use your resume data to train AI models.</li>
                            <li>All AI processing follows the respective provider&apos;s data handling policies.</li>
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
                        <p>Your resume data is retained as long as your account is active. You may delete your account and all associated data at any time from Settings. Upon deletion, all data is permanently removed within 30 days.</p>
                    </Section>

                    <Section title="6. Third-Party Services">
                        <p>We integrate with:</p>
                        <ul>
                            <li><strong>Google OAuth</strong> — for authentication.</li>
                            <li><strong>Google Gemini / Gemma</strong> — for AI processing.</li>
                            <li><strong>Razorpay</strong> — for payment processing.</li>
                            <li><strong>Neon</strong> — for database hosting.</li>
                        </ul>
                        <p>Each service operates under its own privacy policy.</p>
                    </Section>

                    <Section title="7. Your Rights">
                        <ul>
                            <li><strong>Access:</strong> Request a copy of your data at any time.</li>
                            <li><strong>Correction:</strong> Update your information via the dashboard.</li>
                            <li><strong>Deletion:</strong> Delete your account and all data from Settings.</li>
                            <li><strong>Portability:</strong> Export your resume data in JSON format.</li>
                        </ul>
                    </Section>

                    <Section title="8. Cookies">
                        <p>We use essential cookies for authentication and session management. We do not use tracking or advertising cookies.</p>
                    </Section>

                    <Section title="9. Changes to This Policy">
                        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification.</p>
                    </Section>

                    <Section title="10. Contact">
                        <p>For privacy-related inquiries, contact us at: <strong>privacy@zebra-ai.app</strong></p>
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
