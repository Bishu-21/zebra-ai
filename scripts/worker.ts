import path from "node:path";
import dotenv from "dotenv";
import { Kafka } from "kafkajs";
import { createKafkaConfig, ensureLocalResumeTopic, RESUME_INGESTION_TOPIC } from "../src/lib/kafka";
import { handleResumeIngestionMessage } from "../src/lib/resume-audit-job";
import { sanitizeSecretText } from "../src/lib/db";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const groupId = process.env.KAFKA_CONSUMER_GROUP || "zebra-ai-resume-ingestion";

async function main() {
    const config = createKafkaConfig();
    const kafka = new Kafka(config);
    await ensureLocalResumeTopic(kafka, config);
    const consumer = kafka.consumer({
        groupId,
        sessionTimeout: 360_000,
        heartbeatInterval: 10_000,
    });

    const shutdown = async (signal: string) => {
        console.log(`[worker] ${signal} received; disconnecting Kafka consumer`);
        await consumer.disconnect().catch(() => undefined);
        process.exit(0);
    };
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));

    await consumer.connect();
    await consumer.subscribe({ topic: RESUME_INGESTION_TOPIC, fromBeginning: false });
    console.log(`[worker] listening on ${RESUME_INGESTION_TOPIC} as ${groupId}`);

    await consumer.run({
        partitionsConsumedConcurrently: 1,
        eachMessage: async ({ message, heartbeat }) => {
            const raw = message.value?.toString();
            if (!raw) {
                console.warn("[worker] skipped empty resume-ingestion message");
                return;
            }
            try {
                const outcome = await handleResumeIngestionMessage(raw, { heartbeat });
                console.log(`[worker] ${outcome}`);
            } catch (error: unknown) {
                console.error("[worker] resume-ingestion handler error:", sanitizeSecretText(error instanceof Error ? error.message : String(error)));
                throw error;
            }
        },
    });
}

main().catch((error: unknown) => {
    console.error("[worker] failed to start:", sanitizeSecretText(error instanceof Error ? error.message : String(error)));
    process.exit(1);
});
