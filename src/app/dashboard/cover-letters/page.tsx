import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
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
  } catch {
    console.error("Session fetch failed in cover-letters");
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
    <div className="p-6 md:p-10 max-w-7xl pb-32">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12 md:mb-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-[3rem] font-black tracking-[-0.04em] leading-tight mb-4 text-[#0A0A0A]">Cover Letter Vault</h1>
          <p className="text-[#6B6B6B] text-[1rem] md:text-[1.1rem] leading-relaxed font-medium">
            AI-generated cover letters tailored to specific job descriptions. High conversion, surgically precise.
          </p>
        </div>
        <div className="w-full md:w-auto">
          <GenerateCoverLetter resumes={userResumes} />
        </div>
      </div>

      {letters.length === 0 ? (
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-[#EAEAEA] p-12 md:p-24 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-[#3B82F6]/5 rounded-[1.5rem] md:rounded-[2.2rem] flex items-center justify-center text-[#3B82F6] mb-8 md:mb-10 shadow-inner">
            <RiMagicLine size={40} className="md:w-12 md:h-12" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-5 tracking-tight">No Cover Letters Yet</h2>
          <p className="text-[#6B6B6B] mb-8 md:mb-12 max-w-md leading-relaxed text-base md:text-lg">
            Generate your first professional cover letter by matching your resume to a job description.
          </p>
          <GenerateCoverLetter resumes={userResumes} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {letters.map((letter) => (
            <div 
                key={letter.id} 
                className="group relative bg-white border border-[#EAEAEA] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col hover:border-[#3B82F6] hover:shadow-xl hover:shadow-[#3B82F6]/5 transition-all duration-300"
            >
                <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 bg-[#F9F9F9] rounded-2xl flex items-center justify-center text-[#B5B5B5] border border-[#EAEAEA] group-hover:border-[#3B82F6]/30 group-hover:bg-[#3B82F6]/5 group-hover:text-[#3B82F6] transition-all duration-500 shadow-sm">
                        <RiFileTextLine size={28} />
                    </div>
                    <div className="flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-[0.15em] text-[#B5B5B5] bg-[#F9F9F9] px-4 py-2 rounded-full group-hover:text-[#3B82F6] group-hover:bg-[#3B82F6]/5 transition-all duration-300">
                        <RiTimeLine size={12} className="opacity-50" />
                        {formatTimeAgo(letter.createdAt)}
                    </div>
                </div>



                <div className="flex-grow">
                    <h3 className="text-xl font-black text-[#0A0A0A] mb-4 leading-tight group-hover:text-[#3B82F6] transition-colors line-clamp-2">
                        {letter.title}
                    </h3>
                    <div className="relative text-[0.9rem] text-[#6B6B6B] line-clamp-4 leading-[1.6] font-medium mb-8 overflow-hidden h-24">
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
