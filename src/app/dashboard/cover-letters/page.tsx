import React, { Suspense } from "react";
import { getSafeSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { resumes as resumesTable, coverLetters as coverLettersTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { GenerateCoverLetter } from "@/components/dashboard/GenerateCoverLetter";
import {
    RiMagicLine,
    RiFileTextLine,
    RiTimeLine
} from "react-icons/ri";
import { CoverLetterActions } from "@/components/dashboard/CoverLetterActions";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/DashboardPage";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-64 rounded-[var(--radius-xl)] border border-border-subtle bg-white" />
        ))}
      </div>
    </DashboardPage>
  );
}

export default async function CoverLettersPage() {
  const session = await getSafeSession();

  if (!session) return null;

  return (
    <Suspense fallback={<CoverLettersLoadingState />}>
      <CoverLettersContent userId={session.user.id} />
    </Suspense>
  );
}

async function CoverLettersContent({ userId }: { userId: string }) {
  const [userResumes, letters] = await Promise.all([
    db.query.resumes.findMany({
      columns: { id: true, title: true },
      where: eq(resumesTable.userId, userId),
      orderBy: [desc(resumesTable.updatedAt)],
    }),
    db.query.coverLetters.findMany({
      columns: { id: true, title: true, content: true, createdAt: true },
      where: eq(coverLettersTable.userId, userId),
      orderBy: [desc(coverLettersTable.createdAt)],
    }),
  ]);

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="Cover Letters"
        description="Create evidence-grounded drafts for a specific role, then review and edit every claim before use."
        actions={<GenerateCoverLetter resumes={userResumes} />}
      />

      {letters.length === 0 ? (
        <div className="bg-white rounded-[var(--radius-xl)] border border-border-subtle p-10 md:p-16 flex flex-col items-center justify-center text-center shadow-[var(--shadow-sm)]">
          <div className="w-14 h-14 bg-muted rounded-[var(--radius-lg)] flex items-center justify-center text-foreground mb-6">
            <RiMagicLine size={26} />
          </div>
          <h2 className="text-lg font-bold mb-2 tracking-tight text-foreground">No cover letters yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md leading-6">
            Generate your first professional cover letter by matching your resume to a job description.
          </p>
          <GenerateCoverLetter resumes={userResumes} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {letters.map((letter) => (
            <div
                key={letter.id}
                className="group relative bg-white border border-border-subtle rounded-[var(--radius-xl)] p-6 flex flex-col hover:border-neutral-300 hover:shadow-[var(--shadow-md)] transition-all"
            >
                <div className="flex items-start justify-between mb-6">
                    <div className="w-11 h-11 bg-muted rounded-[var(--radius-md)] flex items-center justify-center text-muted-foreground border border-border-subtle group-hover:bg-foreground group-hover:text-white transition-colors">
                        <RiFileTextLine size={20} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <RiTimeLine size={12} className="opacity-50" />
                        {formatTimeAgo(letter.createdAt)}
                    </div>
                </div>

                <div className="flex-grow">
                    <h3 className="text-base font-bold text-foreground mb-3 leading-snug line-clamp-2">
                        {letter.title}
                    </h3>
                    <div className="relative text-sm text-muted-foreground line-clamp-4 leading-6 font-normal mb-6 overflow-hidden h-24">
                        {letter.content.replace(/\*/g, '')}
                        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent"></div>
                    </div>
                </div>

                <CoverLetterActions letter={{
                    id: letter.id,
                    title: letter.title,
                    content: letter.content,
                    createdAt: letter.createdAt
                }} />
            </div>
          ))}
        </div>
      )}
    </DashboardPage>
  );
}
