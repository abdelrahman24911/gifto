import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/notifications/dispatch/route";

const URL = "http://localhost/api/notifications/dispatch";
const ENV_KEYS = [
  "CRON_SECRET",
  "RESEND_API_KEY",
  "ORDER_NOTIFICATION_FROM",
  "ORDER_NOTIFICATION_EMAIL",
] as const;

const saved = new Map<string, string | undefined>();

beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved.set(key, process.env[key]);
    delete process.env[key];
  }
  process.env.CRON_SECRET = "test-secret";
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = saved.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function request(headers: Record<string, string> = {}): Request {
  return new Request(URL, { headers });
}

describe("dispatch route authorization", () => {
  it("rejects a request with no credentials", async () => {
    const response = await GET(request());
    expect(response.status).toBe(401);
  });

  it("rejects a wrong bearer token", async () => {
    const response = await GET(request({ authorization: "Bearer nope" }));
    expect(response.status).toBe(401);
  });

  it("rejects when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(request({ authorization: "Bearer test-secret" }));
    expect(response.status).toBe(401);
  });

  it("accepts the bearer secret used by Vercel Cron", async () => {
    const response = await GET(request({ authorization: "Bearer test-secret" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ configured: false });
  });

  it("accepts the x-cron-secret header", async () => {
    const response = await POST(request({ "x-cron-secret": "test-secret" }));
    expect(response.status).toBe(200);
  });
});
