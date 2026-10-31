import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { createKafkaConfig } from "../src/lib/kafka";
import { readFileSync } from "node:fs";

const originalBroker = process.env.KAFKA_BROKER;
const originalEventHubs = process.env.AZURE_EVENT_HUBS_CONNECTION_STRING;

afterEach(() => {
    if (originalBroker === undefined) delete process.env.KAFKA_BROKER;
    else process.env.KAFKA_BROKER = originalBroker;
    if (originalEventHubs === undefined) delete process.env.AZURE_EVENT_HUBS_CONNECTION_STRING;
    else process.env.AZURE_EVENT_HUBS_CONNECTION_STRING = originalEventHubs;
});

describe("kafka client config", () => {
    test("uses IPv4 loopback without SASL for local Docker", () => {
        const config = createKafkaConfig({
            KAFKA_BROKER: undefined,
            AZURE_EVENT_HUBS_CONNECTION_STRING: undefined,
        });
        assert.deepEqual(config.brokers, ["127.0.0.1:9092"]);
        assert.equal(config.ssl, undefined);
        assert.equal(config.sasl, undefined);
        assert.equal(config.connectionTimeout, 3_000);
    });

    test("does not apply Event Hubs SASL to a loopback broker", () => {
        const config = createKafkaConfig({
            KAFKA_BROKER: "localhost:9092",
            AZURE_EVENT_HUBS_CONNECTION_STRING: "Endpoint=sb://zebra.servicebus.windows.net/;SharedAccessKeyName=Root;SharedAccessKey=x",
        });
        assert.deepEqual(config.brokers, ["localhost:9092"]);
        assert.equal(config.ssl, undefined);
        assert.equal(config.sasl, undefined);
    });

    test("uses Event Hubs host and SASL when no local broker is set", () => {
        const config = createKafkaConfig({
            KAFKA_BROKER: undefined,
            AZURE_EVENT_HUBS_CONNECTION_STRING: "Endpoint=sb://zebra.servicebus.windows.net/;SharedAccessKeyName=Root;SharedAccessKey=x",
        });
        assert.deepEqual(config.brokers, ["zebra.servicebus.windows.net:9093"]);
        assert.equal(config.ssl, true);
        assert.equal(config.sasl?.mechanism, "plain");
        assert.equal(config.sasl && "username" in config.sasl ? config.sasl.username : undefined, "$ConnectionString");
    });

    test("creates the producer with the v2 default partitioner", () => {
        const source = readFileSync("src/lib/kafka.ts", "utf8");
        assert.match(source, /createPartitioner: Partitioners\.DefaultPartitioner/);
    });
});
