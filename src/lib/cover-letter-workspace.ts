import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { db, executeWithDbRetry } from "@/lib/db";
import { candidateNameFromStoredResume, missingReferencedResumeIds } from "@/lib/cover-letter-document";
import { decodeCursor, paginateRows } from "@/lib/pagination";
import { coverLetters as coverLettersTable, resumes as resumesTable } from "@/lib/schema";

export async function loadCoverLetterWorkspace(userId: string, rawCursor?: string) {
  const started = Date.now();
  const data = await executeWithDbRetry(async () => {
    const cursor = decodeCursor(rawCursor);
    const [userResumes, letterRows] = await Promise.all([
      db.query.resumes.findMany({
        columns: { id: true, title: true, content: true },
        where: eq(resumesTable.userId, userId),
        orderBy: [desc(resumesTable.updatedAt)],
        limit: 50,
      }),
      db.query.coverLetters.findMany({
        columns: { id: true, title: true, content: true, createdAt: true, resumeId: true },
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
    const resumeOptions = userResumes.map((resume) => ({
      id: resume.id,
      title: resume.title,
      candidateName: candidateNameFromStoredResume(resume.content),
    }));
    const candidateNameByResumeId = new Map(resumeOptions.map((resume) => [resume.id, resume.candidateName]));
    const letters = letterPage.items;
    const missingResumeIds = missingReferencedResumeIds(
      letters.map((letter) => letter.resumeId),
      userResumes.map((resume) => resume.id),
    );
    if (missingResumeIds.length > 0) {
      const referencedResumes = await db.query.resumes.findMany({
        columns: { id: true, content: true },
        where: and(eq(resumesTable.userId, userId), inArray(resumesTable.id, missingResumeIds)),
      });
      for (const resume of referencedResumes) {
        candidateNameByResumeId.set(resume.id, candidateNameFromStoredResume(resume.content));
      }
    }
    return { resumeOptions, letters, letterPage, candidateNameByResumeId };
  });
  console.info(
    `[cover-letters] query_ms=${Date.now() - started} letters=${data.letters.length} resumes=${data.resumeOptions.length}`,
  );
  return data;
}
