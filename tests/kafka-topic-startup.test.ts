import assert from "node:assert/strict";
import { test } from "node:test";
import { type Admin } from "kafkajs";
import { createKafkaConfig, ensureLocalResumeTopic } from "../src/lib/kafka";

function fixture(failure?: Error, existingTopics: string[] = []) {
    const events: string[] = [];
    const admin = {
        async connect() { events.push("connect"); },
        async listTopics() { return existingTopics; },
        async createTopics(options: Parameters<Admin["createTopics"]>[0]) {
            events.push("create");
            assert.equal(options.waitForLeaders, true);
            assert.deepEqual(options.topics, [{ topic: "resume-ingestion", numPartitions: 1, replicationFactor: 1 }]);
            if (failure) throw failure;
            return false; // An existing topic must also allow startup.
        },
        async disconnect() { events.push("disconnect"); },
    };
    return { events, client: { admin: () => admin } };
}

test("local startup ensures the topic and waits for its leader, including existing topics", async () => {
    const { events, client } = fixture();
    await ensureLocalResumeTopic(client, createKafkaConfig({}));
    assert.deepEqual(events, ["connect", "create", "disconnect"]);
});

test("topic provisioning failures propagate and close the admin connection", async () => {
    const failure = new Error("broker unavailable");
    const { events, client } = fixture(failure);
    await assert.rejects(ensureLocalResumeTopic(client, createKafkaConfig({})), failure);
    assert.deepEqual(events, ["connect", "create", "disconnect"]);
});

test("restarting with an existing topic skips creation and its error log", async () => {
    const { events, client } = fixture(new Error("must not create an existing topic"), ["resume-ingestion"]);
    await ensureLocalResumeTopic(client, createKafkaConfig({}));
    assert.deepEqual(events, ["connect", "disconnect"]);
});

test("Event Hubs startup does not attempt Kafka topic administration", async () => {
    const { events, client } = fixture();
    await ensureLocalResumeTopic(client, createKafkaConfig({
        AZURE_EVENT_HUBS_CONNECTION_STRING: "Endpoint=sb://zebra.servicebus.windows.net/;SharedAccessKeyName=Root;SharedAccessKey=x",
    }));
    assert.deepEqual(events, []);
});
