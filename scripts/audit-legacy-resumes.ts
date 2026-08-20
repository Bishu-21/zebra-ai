import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { ingestResumeText } from "../src/lib/resume-ingestion";
import {
    getResumeSourceText,
    parseStoredResumeContent,
    stringifyResumeContent,
} from "../src/lib/resume-content";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

interface ResumeAuditRecord {
    id: string;
    title: string;
    content: string;
}

function argumentValue(name: string): string | undefined {
    const prefix = `${name}=`;
    return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
    const apply = process.argv.includes("--apply");
    const verbose = process.argv.includes("--verbose");
    const resumeId = argumentValue("--id");
    if (apply && !resumeId) {
        throw new Error("Safe apply mode requires one explicit --id=<resume-id>. Bulk mutation is intentionally disabled.");
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not configured.");

    // A standalone maintenance command should use Neon's stateless HTTP
    // transport. Reusing the application's WebSocket pool can keep the CLI
    // alive and trigger driver teardown errors after a completed audit.
    const sql = neon(connectionString, { readOnly: !apply });
    const queryResult = resumeId
        ? await sql`select id, title, content from resumes where id = ${resumeId}`
        : await sql`select id, title, content from resumes`;
    const records = queryResult as unknown as ResumeAuditRecord[];

    const legacy = records.filter((record) => {
        const content = parseStoredResumeContent(record.content);
        return content._ingestionMeta?.parseStatus === "legacy";
    });

    const sourceGroups = new Map<string, ResumeAuditRecord[]>();
    for (const record of legacy) {
        const source = getResumeSourceText(parseStoredResumeContent(record.content));
        sourceGroups.set(source, [...(sourceGroups.get(source) ?? []), record]);
    }
    const duplicateGroups = [...sourceGroups.values()].filter((group) => group.length > 1);
    const duplicateCopies = duplicateGroups.reduce((total, group) => total + group.length - 1, 0);

    console.log(`Inspected ${records.length} resume record(s).`);
    console.log(`- Structured/reviewable: ${records.length - legacy.length}`);
    console.log(`- Legacy raw: ${legacy.length}`);
    console.log(`- Exact duplicate legacy copies: ${duplicateCopies} across ${duplicateGroups.length} source group(s)`);

    if (verbose || apply) {
        for (const record of legacy) {
            const source = getResumeSourceText(parseStoredResumeContent(record.content));
            console.log(`- ${record.id} | ${record.title} | ${source.length} preserved characters`);
        }
    } else if (legacy.length > 0) {
        console.log("Run with --verbose to list legacy record IDs. No data is changed by verbose mode.");
    }

    if (!apply) {
        console.log("Dry run only. To repair one record, rerun with --apply --id=<resume-id>.");
        return;
    }

    const record = legacy[0];
    if (!record) throw new Error("The selected record is not a legacy raw resume or does not exist.");
    const source = getResumeSourceText(parseStoredResumeContent(record.content));
    const ingestion = await ingestResumeText(source);

    const serializedContent = stringifyResumeContent(ingestion.content);
    const updatedAt = new Date().toISOString();
    await sql`update resumes
        set content = ${serializedContent}, updated_at = ${updatedAt}
        where id = ${record.id}`;

    console.log(`Repaired ${record.id}. Original source remains embedded in _ingestionMeta.sourceText.`);
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
