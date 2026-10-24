import "server-only";
import { getToken } from "@vercel/connect";

/** Obtain app-scoped Jev credentials only at the server-side call site. */
export async function getJevToken(): Promise<string> {
  return getToken("jev/acme-jev", { subject: { type: "app" } });
}
