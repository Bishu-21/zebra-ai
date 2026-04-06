import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = global as unknown as {
  queryClient: postgres.Sql | undefined;
};

const queryClient = globalForDb.queryClient ?? postgres(process.env.DATABASE_URL!, {
  max: 5, // Limit connections for serverless
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: "require",
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.queryClient = queryClient;
}

export const db = drizzle(queryClient, { schema });


