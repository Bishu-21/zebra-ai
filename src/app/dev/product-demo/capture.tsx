"use client";

import { PreviewPane } from "@/components/compiler/PreviewPane";
import { ImportResume } from "@/components/dashboard/ImportResume";
import { EditorToolbar } from "@/components/dashboard/resume-editor/EditorToolbar";
import { ExperienceEditor } from "@/components/dashboard/resume-editor/ExperienceEditor";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";
import { PRODUCT_DEMO_CONTENT, PRODUCT_DEMO_RESUME } from "@/lib/product-demo-fixture";
import { useRouter } from "next/navigation";
import { useState } from "react";

const noopAsync = async () => undefined;

function CaptureToolbar() {
    const router = useRouter();
    const { settings } = useSettings();
    const [resume, setResume] = useState(PRODUCT_DEMO_RESUME);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"source" | "sheet">("sheet");
    const [selectedTemplate, setSelectedTemplate] = useState<"modern" | "professional" | "minimal" | "executive">("modern");
    const [isZenMode, setIsZenMode] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);

    return (
        <EditorToolbar
            showAiPanel={false}
            router={router}
            isRenaming={isRenaming}
            setIsMenuOpen={setIsMenuOpen}
            isMenuOpen={isMenuOpen}
            resume={resume}
            setResume={setResume}
            setIsRenaming={setIsRenaming}
            handleSave={noopAsync}
            setShowShareModal={() => undefined}
            handleExportPdf={noopAsync}
            copyToClipboard={noopAsync}
            handleDuplicate={noopAsync}
            handleDelete={noopAsync}
            isStripeVersion={false}
            setViewMode={setViewMode}
            viewMode={viewMode}
            copying={null}
            setSelectedTemplate={setSelectedTemplate}
            selectedTemplate={selectedTemplate}
            isGeneratingPdf={false}
            setIsZenMode={setIsZenMode}
            isZenMode={isZenMode}
            settings={settings}
            isSaving={false}
            saveStatus="saved"
        />
    );
}

export function ProductDemoCapture({ scene }: { scene: string }) {
    return (
        <SettingsProvider>
            <div className="min-h-screen bg-[#FDFDFD] font-sans text-foreground">
                <p className="sr-only">Synthetic demo data for Jordan Hale. This page is not the public product.</p>
                {scene === "import" && (
                    <div className="mx-auto max-w-md p-10">
                        <ImportResume defaultOpen />
                    </div>
                )}
                {scene === "review" && (
                    <div className="mx-auto max-w-3xl bg-white p-6">
                        <PreviewPane content={PRODUCT_DEMO_CONTENT} onJumpToSourceAction={() => undefined} template="modern" />
                    </div>
                )}
                {scene === "edit" && (
                    <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                            <h1 className="mb-4 text-sm font-semibold">Experience</h1>
                            <ExperienceEditor
                                content={PRODUCT_DEMO_CONTENT}
                                updateExperience={() => undefined}
                                addExperience={() => undefined}
                                removeItem={() => undefined}
                                getAiSuggestions={() => undefined}
                            />
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                            <PreviewPane content={PRODUCT_DEMO_CONTENT} onJumpToSourceAction={() => undefined} template="modern" />
                        </div>
                    </div>
                )}
                {scene === "preview" && (
                    <div className="mx-auto max-w-3xl bg-white p-6">
                        <PreviewPane content={PRODUCT_DEMO_CONTENT} onJumpToSourceAction={() => undefined} template="modern" />
                    </div>
                )}
                {scene === "export" && (
                    <div className="bg-white">
                        <CaptureToolbar />
                        <div className="mx-auto max-w-3xl p-6">
                            <PreviewPane content={PRODUCT_DEMO_CONTENT} onJumpToSourceAction={() => undefined} template="modern" />
                        </div>
                    </div>
                )}
            </div>
        </SettingsProvider>
    );
}
