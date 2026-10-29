import React, { Suspense } from "react";
import { getSafeSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { resumes as resumesTable, coverLetters as coverLettersTable } from "@/lib/schema";
import { and, eq, desc, lt, or } from "drizzle-orm";
import Link from "next/link";
import { GenerateCoverLetter } from "@/components/dashboard/GenerateCoverLetter";
import { RiTimeLine } from "react-icons/ri";
import { CoverLetterActions } from "@/components/dashboard/CoverLetterActions";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/DashboardPage";
import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { decodeCursor, paginateRows } from "@/lib/pagination";

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
  const cursor = decodeCursor(rawCursor);
  const [userResumes, letterRows] = await Promise.all([
    db.query.resumes.findMany({
      columns: { id: true, title: true },
      where: eq(resumesTable.userId, userId),
      orderBy: [desc(resumesTable.updatedAt)],
      limit: 50,
    }),
    db.query.coverLetters.findMany({
      columns: { id: true, title: true, content: true, createdAt: true },
      where: and(
        eq(coverLettersTable.userId, userId),
        cursor ? or(
          lt(coverLettersTable.createdAt, cursor.timestamp),
          and(eq(coverLettersTable.createdAt, cursor.timestamp), lt(coverLettersTable.id, cursor.id)),
        ) : undefined,
      ),
      orderBy: [desc(coverLettersTable.createdAt), desc(coverLettersTable.id)],
      limit: 25,
    }),
  ]);
  const letterPage = paginateRows(letterRows, 24, letter => ({ id: letter.id, timestamp: letter.createdAt }));
  const letters = letterPage.items;

  return (
    <DashboardPage className="max-[640px]:pr-16">
      <DashboardPageHeader
        title="Cover Letters"
        description="Create evidence-grounded drafts for a specific role, then review and edit every claim before use."
        actions={<GenerateCoverLetter resumes={userResumes} />}
      />

      {letters.length === 0 ? (
        <div className={featureChrome.emptyState}>
          <FeatureIcon feature="Cover Letters" size={22} className="text-muted-foreground" />
          <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">No cover letters yet</h2>
          <p className="mt-1 mb-5 max-w-md text-sm leading-6 text-muted-foreground">
            Generate a cover letter by matching a resume to a job description.
          </p>
          <GenerateCoverLetter resumes={userResumes} />
        </div>
      ) : (
        <div className="space-y-4 max-[640px]:pb-24">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {letters.map((letter) => (
            <div key={letter.id} className={featureChrome.card}>
                <div className="flex items-center justify-between gap-2">
                    <FeatureIcon feature="Cover Letters" size={18} className="text-muted-foreground" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AppIcon icon={RiTimeLine} size={12} />
                        {formatTimeAgo(letter.createdAt)}
                    </div>
                </div>

                <div className="mt-3 flex-grow">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground">
                        {letter.title}
                    </h3>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {letter.content.replace(/\*/g, '')}
                    </p>
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
          {letterPage.page.nextCursor && (
            <Link href={`/dashboard/cover-letters?cursor=${encodeURIComponent(letterPage.page.nextCursor)}`} className={featureChrome.secondaryButton}>
              View older cover letters
            </Link>
          )}
        </div>
      )}
    </DashboardPage>
  );
}
