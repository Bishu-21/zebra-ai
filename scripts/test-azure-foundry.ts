import dotenv from "dotenv";
import {
  createAzureFoundryClient,
  getAzureFoundryConfig,
} from "../src/lib/azure-foundry";

// Ensure .env.local is loaded
dotenv.config({ path: ".env.local" });

const config = getAzureFoundryConfig() ?? (() => {
  throw new Error("Azure Foundry is not configured in .env.local.");
})();

const client = createAzureFoundryClient(config);

async function main() {
  console.log(`Connecting to Azure Foundry deployment ${config.deployment}...`);
  
  const stream = client.responses.stream({
    model: config.deployment,
    input: "Solve 8x + 31 = 2. Answer briefly.",
    reasoning: { effort: "low" },
    max_output_tokens: 300,
    store: false,
  });

  stream.on("response.output_text.delta", (event) => {
    process.stdout.write(event.delta);
  });

  const response = await stream.finalResponse();
  if (response.status !== "completed") {
    throw new Error(
      JSON.stringify(response.error ?? response.incomplete_details)
    );
  }
  console.log("\nResponse ID:", response.id);
  console.log("Usage:", response.usage);
}

main().catch((error) => {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    error.status === 401
  ) {
    const endpoint = new URL(config.baseURL);
    const isProjectEndpoint = endpoint.pathname.includes("/api/projects/");
    const keyInstruction = isProjectEndpoint
      ? "Copy API Key from Manage > Project details for the same Foundry project used by AZURE_FOUNDRY_OPENAI_BASE_URL,"
      : "Copy KEY 1 or KEY 2 from the Keys and Endpoint page of the same Azure resource used by AZURE_FOUNDRY_OPENAI_BASE_URL,";

    console.error(
      [
        "Azure Foundry rejected the configured key (HTTP 401).",
        keyInstruction,
        "then replace only AZURE_FOUNDRY_API_KEY in .env.local and rerun npm run azure:smoke.",
        `Configured endpoint: ${endpoint.origin}${endpoint.pathname}`,
      ].join("\n"),
    );
    process.exitCode = 1;
    return;
  }

  console.error("Azure Foundry request failed:", error);
  process.exitCode = 1;
});
