import { describe, expect, it, vi } from "vitest";
import { sendOrderNotification } from "./whatsapp";
import type { OrderNotificationPayload, WhatsAppConfig } from "./types";

const config: WhatsAppConfig = {
  accessToken: "EAAG-super-secret-token",
  phoneNumberId: "1234567890",
  apiVersion: "v21.0",
  notifyTo: "201012345678",
  templateName: "new_order_alert",
  templateLang: "en",
};

const payload: OrderNotificationPayload = {
  order_number: "FL-2002",
  customer_name: "Omar",
  customer_phone: "+20 111",
  items: [{ name: "Mug", quantity: 1, unit_price: 50 }],
  subtotal: 50,
  delivery_fee: 20,
  total: 70,
  currency: "EGP",
  governorate: "giza",
  area: "Dokki",
  delivery_address: "Street 3",
  delivery_notes: null,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("sendOrderNotification", () => {
  it("returns not-retryable when no WhatsApp config is available", async () => {
    const outcome = await sendOrderNotification(payload, { config: null });
    expect(outcome).toEqual({
      ok: false,
      retryable: false,
      error: expect.stringContaining("not configured"),
    });
  });

  it("posts an approved template to the Cloud API with the ordered params", async () => {
    const calls: [RequestInfo | URL, RequestInit | undefined][] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push([input, init]);
      return jsonResponse({ messages: [{ id: "wamid.ABC" }] });
    });

    const outcome = await sendOrderNotification(payload, { config, fetchImpl });

    expect(outcome).toEqual({ ok: true, providerMessageId: "wamid.ABC" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] = calls[0];
    expect(url).toBe("https://graph.facebook.com/v21.0/1234567890/messages");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer EAAG-super-secret-token",
    );

    const body = JSON.parse(init?.body as string);
    expect(body.messaging_product).toBe("whatsapp");
    expect(body.to).toBe("201012345678");
    expect(body.type).toBe("template");
    expect(body.template.name).toBe("new_order_alert");
    expect(body.template.language.code).toBe("en");
    expect(body.template.components[0].parameters.map((p: { text: string }) => p.text)).toEqual([
      "FL-2002",
      "Omar",
      "+20 111",
      "1× Mug",
      "70 EGP",
      "Street 3, Dokki, giza",
      "None",
    ]);
  });

  it("uses a plain text message when no template is configured", async () => {
    const calls: [RequestInfo | URL, RequestInit | undefined][] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push([input, init]);
      return jsonResponse({ messages: [{ id: "wamid.TXT" }] });
    });

    await sendOrderNotification(payload, {
      config: { ...config, templateName: null },
      fetchImpl,
    });

    const body = JSON.parse(calls[0][1]?.body as string);
    expect(body.type).toBe("text");
    expect(body.text.body).toContain("New order FL-2002");
  });

  it("classifies 5xx and 429 as retryable, 4xx as permanent", async () => {
    const server = await sendOrderNotification(payload, {
      config,
      fetchImpl: vi.fn(async () => jsonResponse({ error: { message: "boom" } }, 503)),
    });
    expect(server).toEqual({ ok: false, retryable: true, error: "boom" });

    const throttled = await sendOrderNotification(payload, {
      config,
      fetchImpl: vi.fn(async () => jsonResponse({ error: { message: "slow down" } }, 429)),
    });
    expect(throttled).toMatchObject({ ok: false, retryable: true });

    const badRequest = await sendOrderNotification(payload, {
      config,
      fetchImpl: vi.fn(async () => jsonResponse({ error: { message: "bad template" } }, 400)),
    });
    expect(badRequest).toMatchObject({ ok: false, retryable: false });
  });

  it("treats network failures and timeouts as retryable", async () => {
    const network = await sendOrderNotification(payload, {
      config,
      fetchImpl: vi.fn(async () => {
        throw new Error("socket hang up");
      }),
    });
    expect(network).toMatchObject({ ok: false, retryable: true, error: "socket hang up" });

    const aborted = await sendOrderNotification(payload, {
      config,
      fetchImpl: vi.fn(async () => {
        throw Object.assign(new Error("aborted"), { name: "AbortError" });
      }),
    });
    expect(aborted).toMatchObject({ ok: false, retryable: true });
  });

  it("handles a non-JSON error body without leaking the access token", async () => {
    const outcome = await sendOrderNotification(payload, {
      config,
      fetchImpl: vi.fn(async () => new Response("<html>gateway</html>", { status: 502 })),
    });
    expect(outcome).toMatchObject({ ok: false, retryable: true });
    expect(JSON.stringify(outcome)).not.toContain(config.accessToken);
  });
});
