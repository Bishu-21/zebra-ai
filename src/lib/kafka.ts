import { Kafka, Partitioners, type Admin, type KafkaConfig, type Producer } from "kafkajs";

export const RESUME_INGESTION_TOPIC = "resume-ingestion";

const LOCAL_BROKER = "127.0.0.1:9092";

const globalForKafka = globalThis as unknown as { kafkaProducer: Producer | undefined };

let producerConnect: Promise<Producer> | undefined;

function isLoopbackBroker(broker: string): boolean {
  const host = broker.split(":")[0]?.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function eventHubsBroker(connectionString: string): string | null {
  const match = connectionString.match(/Endpoint=sb:\/\/([^/;]+)/i);
  return match?.[1] ? `${match[1]}:9093` : null;
}

export function createKafkaConfig(
  environment: Record<string, string | undefined> = process.env,
): KafkaConfig {
  const eventHubsConnectionString = environment.AZURE_EVENT_HUBS_CONNECTION_STRING?.trim();
  const explicitBroker = environment.KAFKA_BROKER?.trim();
  const inferredEventHubsBroker = eventHubsConnectionString
    ? eventHubsBroker(eventHubsConnectionString)
    : null;
  const broker = explicitBroker
    || (inferredEventHubsBroker && eventHubsConnectionString ? inferredEventHubsBroker : LOCAL_BROKER);
  const useEventHubs = Boolean(eventHubsConnectionString) && !isLoopbackBroker(broker);

  const config: KafkaConfig = {
    clientId: "zebra-ai",
    brokers: [broker],
    connectionTimeout: 3_000,
    requestTimeout: 10_000,
    retry: {
      retries: 2,
      initialRetryTime: 200,
      maxRetryTime: 2_000,
    },
  };

  if (useEventHubs && eventHubsConnectionString) {
    config.ssl = true;
    config.sasl = {
      mechanism: "plain",
      // Event Hubs Kafka surface requires this literal SASL username.
      username: "$ConnectionString",
      password: eventHubsConnectionString,
    };
  }

  return config;
}

// Docker recreates the broker without topics after `docker compose down`.
// Provision before subscribing rather than racing metadata auto-creation.
export async function ensureLocalResumeTopic(
  kafka: { admin(): Pick<Admin, "connect" | "listTopics" | "createTopics" | "disconnect"> },
  config: KafkaConfig,
): Promise<void> {
  if (!Array.isArray(config.brokers) || !config.brokers.every(isLoopbackBroker)) return;

  const admin = kafka.admin();
  try {
    await admin.connect();
    const topics = await admin.listTopics();
    if (topics.includes(RESUME_INGESTION_TOPIC)) return;
    await admin.createTopics({
      waitForLeaders: true,
      timeout: 30_000,
      topics: [{ topic: RESUME_INGESTION_TOPIC, numPartitions: 1, replicationFactor: 1 }],
    });
  } finally {
    await admin.disconnect();
  }
}

export async function getKafkaProducer(): Promise<Producer> {
  const existing = globalForKafka.kafkaProducer;
  if (existing) {
    await existing.connect();
    return existing;
  }

  if (!producerConnect) {
    producerConnect = (async () => {
      const producer = new Kafka(createKafkaConfig()).producer({
        createPartitioner: Partitioners.DefaultPartitioner,
        allowAutoTopicCreation: true,
      });
      await producer.connect();
      globalForKafka.kafkaProducer = producer;
      return producer;
    })().finally(() => {
      producerConnect = undefined;
    });
  }

  return producerConnect;
}

export async function dispatchKafkaJob(
  topic: string,
  key: string,
  payload: unknown,
  correlationId: string,
): Promise<void> {
  const producer = await getKafkaProducer();
  await producer.send({
    topic,
    messages: [
      {
        key: String(key),
        value: JSON.stringify(payload),
        headers: {
          correlationId,
          timestamp: Date.now().toString(),
        },
      },
    ],
  });
}

export async function disconnectKafka(): Promise<void> {
  const producer = globalForKafka.kafkaProducer;
  if (!producer) return;
  await producer.disconnect();
  globalForKafka.kafkaProducer = undefined;
}
