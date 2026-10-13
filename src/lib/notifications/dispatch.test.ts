import { describe, expect, it, vi } from "vitest";
import { dispatchNotifications } from "./dispatch";
import type { NotificationStore } from "./store";
import type { EmailConfig, NotificationJob, OrderNotificationPayload } from "./types";

const emailConfig: EmailConfig = {
  apiKey: "re_test",
  from: "orders@example.com",
  to: "owner@example.com",
};

const payload: OrderNotificationPayload = {
  order_number: "FL-1",
  customer_name: "Ali",
  customer_phone: "+20 1",
  items: [{ name: "Mug", quantity: 1, unit_price: 50 }],
  subtotal: 50,
  delivery_fee: 0,
  total: 50,
};

function job(overrides: Partial<NotificationJob> = {}): NotificationJob {
  return {
    id: "job-1",
    order_id: "order-1",
    channel: "email",
    event_type: "order_created",
    payload,
    attempts: 1,
    max_attempts: 5,
    ...overrides,
  };
}

function makeStore(overrides: Partial<NotificationStore> = {}): NotificationStore {
  return {
    claim: vi.fn(async () => []),
    markSent: vi.fn(async () => {}),
    markFailed: vi.fn(async () => {}),
    ...overrides,
  };
}

function response(status: number, body: unknown = { id: "email-1" }): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("dispatchNotifications", () => {
  it("does nothing (and never touches the store) when email is not configured", async () => {
    const store = makeStore();
    const fetchImpl = vi.fn();

    const summary = await dispatchNotifications({ emailConfig: null, store, fetchImpl });

    expect(summary).toEqual({ claimed: 0, sent: 0, failed: 0, retried: 0, configured: false });
    expect(store.claim).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("claims with the configured limit and marks a delivered email as sent", async () => {
    const store = makeStore({ claim: vi.fn(async () => [job()]) });
    const fetchImpl = vi.fn(async () => response(200));

    const summary = await dispatchNotifications({
      emailConfig,
      store,
      fetchImpl,
      limit: 3,
    });

    expect(store.claim).toHaveBeenCalledWith(3);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith("https://api.resend.com/emails", expect.anything());
    expect(store.markSent).toHaveBeenCalledWith("job-1", "email-1");
    expect(store.markFailed).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ claimed: 1, sent: 1, failed: 0, retried: 0, configured: true });
  });

  it("reschedules a retryable failure with exponential backoff", async () => {
    const store = makeStore({ claim: vi.fn(async () => [job({ attempts: 2 })]) });
    const now = new Date("2026-10-13T12:00:00.000Z");

    const summary = await dispatchNotifications({
      emailConfig,
      store,
      now: () => now,
      fetchImpl: vi.fn(async () => response(500, { message: "boom" })),
    });

    expect(store.markFailed).toHaveBeenCalledWith(
      "job-1",
      "boom",
      true,
      "2026-10-13T12:02:00.000Z",
    );
    expect(summary).toMatchObject({ failed: 0, retried: 1 });
  });

  it("gives up when a retryable failure has exhausted its attempts", async () => {
    const store = makeStore({
      claim: vi.fn(async () => [job({ attempts: 5, max_attempts: 5 })]),
    });

    const summary = await dispatchNotifications({
      emailConfig,
      store,
      fetchImpl: vi.fn(async () => response(503, { message: "unavailable" })),
    });

    expect(store.markFailed).toHaveBeenCalledWith("job-1", "unavailable", false, null);
    expect(summary).toMatchObject({ failed: 1, retried: 0 });
  });

  it("does not retry a permanent failure", async () => {
    const store = makeStore({ claim: vi.fn(async () => [job()]) });

    const summary = await dispatchNotifications({
      emailConfig,
      store,
      fetchImpl: vi.fn(async () => response(422, { message: "bad request" })),
    });

    expect(store.markFailed).toHaveBeenCalledWith("job-1", "bad request", false, null);
    expect(summary).toMatchObject({ failed: 1, retried: 0 });
  });

  it("never calls a provider for a dormant WhatsApp job", async () => {
    const store = makeStore({ claim: vi.fn(async () => [job({ channel: "whatsapp" })]) });
    const fetchImpl = vi.fn();

    const summary = await dispatchNotifications({ emailConfig, store, fetchImpl });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(store.markSent).not.toHaveBeenCalled();
    expect(store.markFailed).toHaveBeenCalledWith(
      "job-1",
      expect.stringContaining("not enabled"),
      false,
      null,
    );
    expect(summary).toMatchObject({ sent: 0, failed: 1 });
  });

  it("never throws when claiming fails", async () => {
    const onError = vi.fn();
    const store = makeStore({
      claim: vi.fn(async () => {
        throw new Error("db down");
      }),
    });

    const summary = await dispatchNotifications({
      emailConfig,
      store,
      onError,
      fetchImpl: vi.fn(),
    });

    expect(summary).toEqual({ claimed: 0, sent: 0, failed: 0, retried: 0, configured: true });
    expect(onError).toHaveBeenCalledWith("db down");
  });

  it("counts a job as failed when persisting the result throws", async () => {
    const store = makeStore({
      claim: vi.fn(async () => [job()]),
      markSent: vi.fn(async () => {
        throw new Error("write failed");
      }),
    });

    const summary = await dispatchNotifications({
      emailConfig,
      store,
      onError: vi.fn(),
      fetchImpl: vi.fn(async () => response(200)),
    });

    expect(summary).toMatchObject({ failed: 1, sent: 0 });
  });
});
