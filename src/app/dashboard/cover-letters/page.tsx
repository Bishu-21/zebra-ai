import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { resumes as resumesTable, coverLetters as coverLettersTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { GenerateCoverLetter } from "@/components/dashboard/GenerateCoverLetter";
import { Magicpen, DocumentText, Trash, DirectRight } from "iconsax-react";
import { CoverLetterActions } from "@/components/dashboard/CoverLetterActions";

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default async function CoverLettersPage() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (e) {
    console.error("Session fetch failed in cover-letters:", e);
  }

  if (!session) return null;

  // Fetch resumes for the generator
  const userResumes = await db.query.resumes.findMany({
    where: eq(resumesTable.userId, session.user.id),
    orderBy: [desc(resumesTable.updatedAt)],
  });

  // Fetch existing cover letters
  const letters = await db.query.coverLetters.findMany({
    where: eq(coverLettersTable.userId, session.user.id),
    orderBy: [desc(coverLettersTable.createdAt)],
  });

  return (
    <div className="p-10 max-w-6xl pb-24">
      <div className="flex items-start justify-between mb-16">
        <div className="max-w-2xl">
          <h1 className="text-[2.5rem] font-bold tracking-[-0.03em] leading-tight mb-4">Cover Letter Vault</h1>
          <p className="text-[#6B6B6B] text-[1.05rem] leading-relaxed">
            AI-generated cover letters tailored to specific job descriptions. High conversion, surgically precise.
          </p>
        </div>
        <GenerateCoverLetter resumes={userResumes} />
      </div>

      {letters.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-[#EAEAEA] p-24 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-24 h-24 bg-[#3B82F6]/5 rounded-[2rem] flex items-center justify-center text-[#3B82F6] mb-10">
            <Magicpen size={48} variant="Bold" />
          </div>
          <h2 className="text-3xl font-extrabold mb-5 tracking-tight">No Cover Letters Yet</h2>
          <p className="text-[#6B6B6B] mb-12 max-w-md leading-relaxed text-lg">
            Generate your first professional cover letter by matching your resume to a job description.
          </p>
          <GenerateCoverLetter resumes={userResumes} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {letters.map((letter) => (
            <div 
                key={letter.id} 
                className="group relative bg-white border border-[#EAEAEA] rounded-[2.5rem] p-8 flex flex-col hover:border-[#3B82F6] hover:shadow-xl hover:shadow-[#3B82F6]/5 transition-all duration-300"
            >
                <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 bg-[#F9F9F9] rounded-2xl flex items-center justify-center text-[#B5B5B5] border border-[#EAEAEA] group-hover:border-[#3B82F6]/30 group-hover:bg-[#3B82F6]/5 group-hover:text-[#3B82F6] transition-all">
                        <DocumentText size={28} />
                    </div>
                    <div className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-[#B5B5B5] bg-[#F9F9F9] px-3 py-1.5 rounded-full group-hover:text-[#3B82F6] transition-colors">
                        {formatTimeAgo(letter.createdAt)}
                    </div>
                </div>



                <div className="flex-grow">
                    <h3 className="text-xl font-bold text-[#0A0A0A] mb-3 leading-tight group-hover:text-[#3B82F6] transition-colors line-clamp-1">
                        {letter.title}
                    </h3>
                    <div className="relative text-sm text-[#6B6B6B] line-clamp-4 leading-relaxed font-medium mb-8 overflow-hidden h-24">
                        {letter.content}
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
    </div>
  );
}
