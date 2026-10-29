import React, { Suspense } from "react";
import { getSafeSession } from "@/lib/auth-helpers";
import Link from "next/link";
import { GenerateCoverLetter } from "@/components/dashboard/GenerateCoverLetter";
import {
    RiArticleLine,
    RiTimeLine
} from "react-icons/ri";
import { CoverLetterActions } from "@/components/dashboard/CoverLetterActions";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { AppIcon } from "@/components/ui/AppIcon";
import { loadCoverLetterWorkspace } from "@/lib/cover-letter-workspace";

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function CoverLettersLoadingState() {
  return (
    <DashboardPage className="animate-pulse">
      <div className="flex items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="h-7 w-52 rounded-lg bg-black/10" />
          <div className="h-3 w-80 max-w-full rounded bg-black/5" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-black/10" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-52 rounded-2xl border border-neutral-200/70 bg-white" />
        ))}
      </div>
    </DashboardPage>
  );
}

export default async function CoverLettersPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const session = await getSafeSession();

  if (!session) return null;

  return (
    <Suspense fallback={<CoverLettersLoadingState />}>
      <CoverLettersContent userId={session.user.id} cursor={(await searchParams).cursor} />
    </Suspense>
  );
}

async function CoverLettersContent({ userId, cursor: rawCursor }: { userId: string; cursor?: string }) {
  const { resumeOptions, letters, letterPage, candidateNameByResumeId } = await loadCoverLetterWorkspace(userId, rawCursor);

  return (
    <DashboardPage>
      <div className="flex flex-col gap-4 font-sans md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2.5">
            <AppIcon icon={RiArticleLine} size={18} className="text-muted-foreground" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Cover Letters</h1>
          </div>
          <p className="mt-1 font-sans text-sm font-normal leading-6 text-muted-foreground">
            Create evidence-grounded drafts for a specific role, then review and edit every claim before use.
          </p>
        </div>
        <div className="w-full shrink-0 md:w-auto">
          <GenerateCoverLetter resumes={resumeOptions} />
        </div>
      </div>

      {letters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200/70 bg-white px-6 py-12 text-center font-sans">
          <AppIcon icon={RiArticleLine} size={22} className="text-muted-foreground" />
          <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">No cover letters yet</h2>
          <p className="mt-1 mb-5 max-w-md font-sans text-sm leading-6 text-muted-foreground">
            Generate your first cover letter by matching a resume to a job description.
          </p>
          <GenerateCoverLetter resumes={resumeOptions} />
        </div>
      ) : (
        <div className="space-y-4 max-[640px]:pb-24">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {letters.map((letter) => (
            <div
                key={letter.id}
                className="group relative flex flex-col rounded-2xl border border-neutral-200/70 bg-white p-4 font-sans"
            >
                <div className="flex items-center justify-between gap-2">
                    <AppIcon icon={RiArticleLine} size={18} className="text-muted-foreground" />
                    <div className="flex items-center gap-1 font-sans text-xs text-muted-foreground">
                        <AppIcon icon={RiTimeLine} size={12} />
                        {formatTimeAgo(letter.createdAt)}
                    </div>
                </div>

                <div className="mt-3 flex-grow">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground">
                        {letter.title}
                    </h3>
                    <p className="mt-1 line-clamp-3 font-sans text-sm leading-6 text-muted-foreground">
                        {letter.content.replace(/\*/g, '')}
                    </p>
                </div>

                <CoverLetterActions letter={{
                    id: letter.id,
                    title: letter.title,
                    content: letter.content,
                    createdAt: letter.createdAt,
                    resumeId: letter.resumeId,
                    candidateName: letter.resumeId ? candidateNameByResumeId.get(letter.resumeId) : undefined,
                }} />
            </div>
          ))}
          </div>
          {letterPage.page.nextCursor && (
            <Link href={`/dashboard/cover-letters?cursor=${encodeURIComponent(letterPage.page.nextCursor)}`} className="inline-flex min-h-11 items-center rounded-xl border border-neutral-200 bg-white px-4 font-sans text-sm font-medium text-foreground hover:bg-muted">
              View older cover letters
            </Link>
          )}
        </div>
      )}
    </DashboardPage>
  );
}
