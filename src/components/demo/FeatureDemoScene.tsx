"use client";

import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import { useMemo, type ReactNode } from "react";
import { RiArrowRightLine, RiCheckLine, RiFileTextLine, RiMicLine, RiUploadCloud2Line } from "react-icons/ri";
import { PreviewPane } from "@/components/compiler/PreviewPane";
import { FieldInput, FieldTextarea } from "@/components/compiler/FieldInput";
import { CoverLetterDocument } from "@/components/dashboard/CoverLetterDocument";
import { DashboardStat } from "@/components/dashboard/DashboardPage";
import { PortfolioStatusCard } from "@/components/dashboard/PortfolioStatusCard";
import { LinkedInDraftReview } from "@/components/dashboard/LinkedInDraftReview";
import { ZebuDisplayCard } from "@/components/dashboard/ZebuDisplayCard";
import { ReviewTab } from "@/components/dashboard/application-workspace/ReviewTab";
import { WorkTab } from "@/components/dashboard/application-workspace/WorkTab";
import { AppIcon } from "@/components/ui/AppIcon";
import { PRODUCT_DEMO_CONTENT } from "@/lib/product-demo-fixture";
import { APPLICATION_WORKSPACE_FIXTURE } from "@/lib/application-workspace-fixture";
import { DEMO_FEATURES, getDemoMoment, type DemoFeatureId, type DemoId } from "@/lib/demo-catalog";
import type { LinkedInDraft } from "@/lib/linkedin-workflow";
import styles from "./FeatureDemoScene.module.css";

const noop = () => undefined;
const noopAsync = async () => undefined;
const sampleLetter = "Dear Hiring Team,\n\nI am applying for the Frontend Engineer role at Riverbend Civic Lab. My experience building accessible React interfaces matches the practical focus of your team.\n\nIn my recent work, I rebuilt a grants portal so applicants could save drafts and return to their applications. I worked with designers to make the forms clearer and easier to use.\n\nI would welcome the opportunity to discuss how this experience could support your team.\n\nSincerely,\nJordan Hale";

function Sheet({ summary }: { summary: string }) {
    const content = useMemo(() => ({ ...PRODUCT_DEMO_CONTENT, basics: { ...PRODUCT_DEMO_CONTENT.basics, summary } }), [summary]);
    return <div className={styles.document}><PreviewPane content={content} onJumpToSourceAction={noop} template="modern" /></div>;
}

function ResumeScene({ phase, seconds }: { phase: number; seconds: number }) {
    const fullSummary = "Frontend engineer building accessible React interfaces for public services.";
    const summary = phase === 0 ? PRODUCT_DEMO_CONTENT.basics.summary : fullSummary.slice(0, Math.max(1, Math.min(fullSummary.length, Math.floor((seconds - 4) / 2.8 * fullSummary.length))));
    return <div className={styles.split}>
        <div className={styles.editor}>
            <div className={styles.eyebrow}>{phase === 0 ? "Import your document" : "Review your details"}</div>
            {phase === 0 ? <m.div className={styles.upload} initial={{ scale: 0.94 }} animate={{ scale: 1 }}>
                <AppIcon icon={RiUploadCloud2Line} size={36} /><strong>Jordan_Hale_Resume.pdf</strong><span>Review the imported information</span>
                <div className={styles.loadTrack}><m.div initial={{ width: "12%" }} animate={{ width: "100%" }} transition={{ duration: 2.8 }} /></div>
            </m.div> : <div className={styles.fields}><FieldInput label="Full name" value="Jordan Hale" onChange={noop} /><FieldTextarea label="Summary" value={summary} onChange={noop} rows={4} /></div>}
            <div className={styles.notice}>{phase === 2 ? <><AppIcon icon={RiFileTextLine} /> Preview before PDF export</> : "Your details stay editable."}</div>
        </div>
        <Sheet summary={summary} />
    </div>;
}

function ApplicationScene({ phase }: { phase: number }) {
    const app = APPLICATION_WORKSPACE_FIXTURE.application;
    if (phase === 2) return <ReviewTab app={{ ...app, resumeVersion: { id: "example-version", title: "Jordan Hale · Frontend Engineer", updatedAt: "2026-10-30" } }} approvedSuggestionsCount={1} company={app.company} setActiveTab={noop} />;
    return <div className={styles.padded}>
        <div className={styles.role}><strong>{app.position}</strong><span>{app.company}</span><span className={styles.tag}>Preparing</span></div>
        <div className={styles.reviewCard}>
            <div className={styles.cardHead}><strong>Experience</strong><span className={styles.tag}>{phase === 0 ? "Pending review" : "Review your changes"}</span></div>
            <label>Original</label><p>Worked on the grants portal.</p>
            <label>Suggested wording</label><m.p className={styles.suggestion} animate={{ backgroundColor: phase ? "#eef5ef" : "#f5f5f5" }}>Rebuilt the grants portal in React so applicants could save drafts.</m.p>
            <div className={styles.exampleActions}><span>Reject</span><m.span animate={{ backgroundColor: phase ? "#0a0a0a" : "#f5f5f5", color: phase ? "#fff" : "#171717" }}>Approve</m.span></div>
        </div><div className={styles.notice}>Sample suggestion. The original resume is kept separately.</div>
    </div>;
}

function WorkScene({ phase }: { phase: number }) {
    if (phase === 2) return <WorkTab workItems={APPLICATION_WORKSPACE_FIXTURE.workItems} selectedWorkIds={APPLICATION_WORKSPACE_FIXTURE.application.selectedWorkIds || []} toggleWorkSelection={noop} selectedCertIds={[]} isLoadingCerts={false} certsError={null} fetchCertifications={noopAsync} certificationsList={[]} toggleCertSelection={noop} certNextCursor={null} isLoadingMoreCerts={false} setActiveTab={noop} />;
    return <div className={styles.padded}><div className={styles.eyebrow}>Work item · Project</div><h3 className={styles.panelTitle}>Accessible grants portal</h3>
        <div className={styles.fields}><FieldInput label="Title" value="Accessible grants portal" onChange={noop} /><FieldTextarea label="Your contribution" value={phase ? "Built React forms with draft saving and clearer validation." : "Built and maintained the application interface."} onChange={noop} rows={3} /><FieldInput label="Supporting link" value={phase ? "https://example.com/jordan/grants-portal" : ""} onChange={noop} /></div>
        <div className={styles.notice}>Choose what supports your next application.</div></div>;
}

function CoverLetterScene({ phase }: { phase: number }) {
    return <div className={styles.split}><div className={styles.editor}><div className={styles.eyebrow}>Cover letter</div><h3 className={styles.panelTitle}>Frontend Engineer</h3><div className={styles.fields}><FieldInput label="Company" value="Riverbend Civic Lab" onChange={noop} /><FieldInput label="Candidate" value="Jordan Hale" onChange={noop} /></div><div className={styles.notice}>{phase === 0 ? "Start from your own experience." : phase === 1 ? "Review the draft and make it your own." : "Check the document before PDF export."}</div></div>
        <m.div className={styles.letter} animate={{ y: phase === 2 ? -28 : 0 }} transition={{ duration: 1.2 }}><CoverLetterDocument content={sampleLetter} candidateName="Jordan Hale" className="p-6" /></m.div></div>;
}

function PortfolioScene({ phase }: { phase: number }) {
    return <div className={styles.padded}><PortfolioStatusCard slug="example-jordan-hale" title="Jordan Hale" selectedWorkIds={phase === 0 ? [] : ["example-work"]} isPublished={false} /><m.div className={styles.portfolio} animate={{ y: phase ? 0 : 22, opacity: phase ? 1 : 0.6 }}><div className={styles.avatar}>JH</div><h3>Jordan Hale</h3><p>Frontend engineer building accessible interfaces.</p><div className={styles.portfolioItem}><span>Selected work</span><strong>Accessible grants portal</strong><p>React forms, draft saving, and clearer validation.</p></div></m.div><div className={styles.notice}>Example preview. Nothing is published by this demo.</div></div>;
}

function LinkedInScene({ phase }: { phase: number }) {
    const draft: LinkedInDraft = { id: "example-draft", field: "headline", sourceQuote: "I build accessible React interfaces for public services.", proposedText: "Frontend Engineer | React and TypeScript | Accessible public services", rationale: "Connects the target role with the work described in the source text.", status: phase === 2 ? "accepted" : "proposed", editedText: null };
    return <div className={styles.linkedin}><LinkedInDraftReview auditId="example-only" drafts={[draft]} onChange={noop} /></div>;
}

function AnalyticsScene({ phase }: { phase: number }) {
    return <div className={styles.padded}><div className={styles.eyebrow}>Sample workspace activity</div><div className={styles.metrics}><DashboardStat label="Saved resumes" value={2} /><DashboardStat label="Active applications" value={3} /><DashboardStat label="Saved analyses" value={1} /></div><h3 className={styles.panelTitle}>Recent activity</h3>{["Resume details reviewed", "Application prepared for Riverbend", "Project added to Work"].slice(0, phase + 1).map((text, index) => <m.div key={text} className={styles.activity} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}><AppIcon icon={RiCheckLine} size={18} /><span>{text}</span><span>Example</span></m.div>)}<div className={styles.notice}>Illustrative counts, not hiring predictions.</div></div>;
}

function SettingsScene({ phase }: { phase: number }) {
    return <div className={styles.padded}><div className={styles.settingsNav}>{["General", "Editor and preview", "Account"].map((text, index) => <m.span key={text} animate={{ backgroundColor: phase === index ? "#0a0a0a" : "#f5f5f5", color: phase === index ? "#fff" : "#525252" }}>{text}</m.span>)}</div><h3 className={styles.panelTitle}>{phase === 0 ? "Your preferences" : phase === 1 ? "Editor and preview" : "Your account"}</h3><div className={styles.fields}><FieldInput label={phase === 2 ? "Name" : "Document font"} value={phase === 2 ? "Jordan Hale" : phase === 1 ? "Arial" : "Georgia"} onChange={noop} /><FieldInput label={phase === 2 ? "Email" : "Preview zoom"} value={phase === 2 ? "jordan.hale@example.com" : phase === 1 ? "100%" : "90%"} onChange={noop} /></div><div className={styles.notice}>Example preferences. Your settings are not changed.</div></div>;
}

function ZebuScene({ phase }: { phase: number }) {
    return <div className={styles.zebu}><div className={styles.zebuBrand}><Image src="/zebra_star.png" width={64} height={64} alt="" /><div><strong>Zebu</strong><span>Your workspace assistant</span></div></div><div className={styles.wave}>{Array.from({ length: 25 }, (_, index) => <m.span key={index} animate={{ height: [8, 12 + (index % 5) * 7, 8] }} transition={{ duration: 0.7 + (index % 3) * 0.2, repeat: Infinity, delay: index * 0.04 }} />)}</div><div className={styles.question}><AppIcon icon={RiMicLine} size={20} /> {phase === 0 ? "Help me find my next step." : "Open my applications."}</div><AnimatePresence>{phase > 0 && <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.zebuResult}><p>Example workspace destination</p><ZebuDisplayCard card={{ id: "example-card", kind: "application", title: "Applications", subtitle: "View roles, deadlines, and saved progress", href: "/dashboard/job-tracker" }} onOpen={noop} /></m.div>}</AnimatePresence><div className={styles.notice}>Illustrative request. No microphone or live voice session is opened.</div></div>;
}

function SceneContent({ id, phase, seconds }: { id: DemoFeatureId; phase: number; seconds: number }) {
    const scenes: Record<DemoFeatureId, ReactNode> = { resumes: <ResumeScene phase={phase} seconds={seconds} />, applications: <ApplicationScene phase={phase} />, work: <WorkScene phase={phase} />, "cover-letters": <CoverLetterScene phase={phase} />, portfolio: <PortfolioScene phase={phase} />, linkedin: <LinkedInScene phase={phase} />, analytics: <AnalyticsScene phase={phase} />, settings: <SettingsScene phase={phase} />, zebu: <ZebuScene phase={phase} /> };
    return scenes[id];
}

export function FeatureDemoScene({ id, seconds }: { id: DemoId; seconds: number }) {
    const { feature, phase, duration, caption } = getDemoMoment(id, seconds);
    const index = DEMO_FEATURES.findIndex(item => item.id === feature.id);
    const featureTime = id === "overview" ? (seconds % 3) * 4 : seconds;
    const content = useMemo(() => <SceneContent id={feature.id} phase={phase} seconds={featureTime} />, [feature.id, phase, featureTime]);
    return <div className={styles.stage} data-demo-feature={feature.id}>
        <div className={styles.top}><span className={styles.brand}><Image src="/zebra_star.png" width={28} height={28} alt="" /> Zebra AI</span><span>Sample workspace · Jordan Hale</span><span>{id === "overview" ? "Product overview" : "Feature showcase"}</span></div>
        <div className={styles.body}>
            <div className={styles.story}>
                <div className={styles.eyebrow}>0{index + 1} / 09 · {feature.title}</div>
                <AnimatePresence mode="wait"><m.div key={feature.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}><h1>{feature.headline}</h1><p className={styles.description}>{feature.description}</p></m.div></AnimatePresence>
                <ol className={styles.steps}>{feature.steps.map((step, stepIndex) => <li key={step} className={stepIndex === phase ? styles.activeStep : ""}><span>{stepIndex < phase ? <AppIcon icon={RiCheckLine} size={12} /> : stepIndex + 1}</span>{step}</li>)}</ol>
            </div>
            <m.div className={styles.window} animate={{ rotate: phase === 0 ? -0.6 : 0, y: phase === 0 ? 6 : 0 }} transition={{ duration: 0.9 }}>
                <div className={styles.windowBar}><span /><span /><span /><strong>Zebra AI / {feature.title}</strong><span className={styles.sampleBadge}>Sample</span></div>
                <div className={styles.screen} inert aria-hidden="true"><AnimatePresence mode="wait"><m.div key={feature.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>{content}</m.div></AnimatePresence></div>
                <m.div className={styles.cursor} animate={{ x: phase === 0 ? 130 : phase === 1 ? 400 : 520, y: phase === 0 ? 150 : phase === 1 ? 280 : 370 }} transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}><svg width="25" height="30" viewBox="0 0 25 30"><path d="M2 2v23l7-6 5 9 4-2-5-9 10-1z" fill="#171717" stroke="white" strokeWidth="2" /></svg><m.span key={`${feature.id}-${phase}`} initial={{ scale: 0.1, opacity: 0.8 }} animate={{ scale: 2, opacity: 0 }} transition={{ delay: 1.2, duration: 0.6 }} /></m.div>
            </m.div>
        </div>
        <div className={styles.caption}><span>{feature.title}</span><strong>{caption}</strong><AppIcon icon={RiArrowRightLine} size={20} /></div>
        <div className={styles.progress}><div style={{ width: `${Math.min(100, seconds / duration * 100)}%` }} /></div>
        <div className={styles.disclosure}>Motion showcase · Synthetic examples · No live account actions</div>
    </div>;
}
