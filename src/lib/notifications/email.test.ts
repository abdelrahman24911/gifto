import { describe, expect, it, vi } from "vitest";
import { sendOrderEmail } from "./email";
import type { EmailConfig, GmailConfig, MailOptions, OrderNotificationPayload } from "./types";

const config: EmailConfig = {
  apiKey: "re_super_secret_key",
  from: "FL Tase3 <orders@example.com>",
  to: "owner@example.com",
};

const payload: OrderNotificationPayload = {
  order_number: "FL-3003",
  customer_name: "Sara",
  customer_phone: "+20 122",
  items: [
    { name: "Mug", quantity: 2, unit_price: 50 },
    { name: "Box", quantity: 1, unit_price: 300 },
  ],
  subtotal: 400,
  delivery_fee: 40,
  total: 440,
  currency: "EGP",
  governorate: "cairo",
  area: "Heliopolis",
  delivery_address: "45 El Horreya",
  delivery_notes: "Ring the bell",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("sendOrderEmail", () => {
  it("returns not-retryable when email is not configured", async () => {
    const outcome = await sendOrderEmail(payload, { config: null });
    expect(outcome).toEqual({
      ok: false,
      retryable: false,
      error: expect.stringContaining("not configured"),
    });
  });

  it("posts the notification to Resend with the authoritative payload", async () => {
    const calls: [RequestInfo | URL, RequestInit | undefined][] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push([input, init]);
      return jsonResponse({ id: "email-123" });
    });

    const outcome = await sendOrderEmail(payload, { config, fetchImpl });

    expect(outcome).toEqual({ ok: true, providerMessageId: "email-123" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] = calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer re_super_secret_key",
    );

    const body = JSON.parse(init?.body as string);
    expect(body.from).toBe(config.from);
    expect(body.to).toBe(config.to);
    expect(body.subject).toContain("FL-3003");
    expect(body.text).toContain("2× Mug");
    expect(body.text).toMatch(/Subtotal:\s+400 EGP/);
    expect(body.text).toMatch(/Delivery fee:\s+40 EGP/);
    expect(body.text).toMatch(/Total:\s+440 EGP/);
    expect(body.text).toContain("45 El Horreya");
    expect(body.html).toContain("45 El Horreya");
  });

  it("classifies 5xx and 429 as retryable, 4xx as permanent", async () => {
    const server = await sendOrderEmail(payload, {
      config,
      fetchImpl: vi.fn(async () => jsonResponse({ message: "boom" }, 503)),
    });
    expect(server).toEqual({ ok: false, retryable: true, error: "boom" });

    const throttled = await sendOrderEmail(payload, {
      config,
      fetchImpl: vi.fn(async () => jsonResponse({ message: "slow down" }, 429)),
    });
    expect(throttled).toMatchObject({ ok: false, retryable: true });

    const rejected = await sendOrderEmail(payload, {
      config,
      fetchImpl: vi.fn(async () => jsonResponse({ message: "invalid from" }, 422)),
    });
    expect(rejected).toMatchObject({ ok: false, retryable: false, error: "invalid from" });
  });

  it("treats network failures and timeouts as retryable", async () => {
    const network = await sendOrderEmail(payload, {
      config,
      fetchImpl: vi.fn(async () => {
        throw new Error("socket hang up");
      }),
    });
    expect(network).toMatchObject({ ok: false, retryable: true, error: "socket hang up" });

    const aborted = await sendOrderEmail(payload, {
      config,
      fetchImpl: vi.fn(async () => {
        throw Object.assign(new Error("aborted"), { name: "AbortError" });
      }),
    });
    expect(aborted).toMatchObject({ ok: false, retryable: true });
  });

  it("handles a non-JSON error body without leaking the API key", async () => {
    const outcome = await sendOrderEmail(payload, {
      config,
      fetchImpl: vi.fn(async () => new Response("<html>gateway</html>", { status: 502 })),
    });
    expect(outcome).toMatchObject({ ok: false, retryable: true });
    expect(JSON.stringify(outcome)).not.toContain(config.apiKey);
  });
});

const gmail: GmailConfig = {
  user: "store@gmail.com",
  pass: "super_secret_app_password",
  from: "FL Tase3 <store@gmail.com>",
  to: "owner@example.com",
};

function transport(impl: (options: MailOptions) => Promise<{ messageId?: string }>) {
  return { sendMail: vi.fn(impl) };
}

describe("sendOrderEmail via Gmail SMTP", () => {
  it("sends through the injected transport with the authoritative payload", async () => {
    const t = transport(async () => ({ messageId: "smtp-1" }));

    const outcome = await sendOrderEmail(payload, { gmailConfig: gmail, transporter: t });

    expect(outcome).toEqual({ ok: true, providerMessageId: "smtp-1" });
    expect(t.sendMail).toHaveBeenCalledTimes(1);
    const mail = t.sendMail.mock.calls[0][0];
    expect(mail.from).toBe(gmail.from);
    expect(mail.to).toBe(gmail.to);
    expect(mail.subject).toContain("FL-3003");
    expect(mail.text).toContain("2× Mug");
    expect(mail.html).toContain("45 El Horreya");
  });

  it("prefers Gmail over Resend when both are configured", async () => {
    const t = transport(async () => ({ messageId: "smtp-1" }));
    const fetchImpl = vi.fn();

    const outcome = await sendOrderEmail(payload, {
      gmailConfig: gmail,
      config,
      transporter: t,
      fetchImpl,
    });

    expect(outcome).toMatchObject({ ok: true });
    expect(t.sendMail).toHaveBeenCalledTimes(1);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("treats bad credentials / rejected envelope as permanent", async () => {
    const auth = await sendOrderEmail(payload, {
      gmailConfig: gmail,
      transporter: transport(async () => {
        throw Object.assign(new Error("Invalid login"), { code: "EAUTH", responseCode: 535 });
      }),
    });
    expect(auth).toMatchObject({ ok: false, retryable: false, error: "Invalid login" });
  });

  it("treats transient SMTP failures as retryable", async () => {
    const transient = await sendOrderEmail(payload, {
      gmailConfig: gmail,
      transporter: transport(async () => {
        throw Object.assign(new Error("try later"), { responseCode: 421 });
      }),
    });
    expect(transient).toMatchObject({ ok: false, retryable: true });

    const network = await sendOrderEmail(payload, {
      gmailConfig: gmail,
      transporter: transport(async () => {
        throw Object.assign(new Error("socket"), { code: "ETIMEDOUT" });
      }),
    });
    expect(network).toMatchObject({ ok: false, retryable: true });
  });

  it("never leaks the app password in the outcome", async () => {
    const outcome = await sendOrderEmail(payload, {
      gmailConfig: gmail,
      transporter: transport(async () => {
        throw new Error("SMTP failure");
      }),
    });
    expect(JSON.stringify(outcome)).not.toContain(gmail.pass);
  });
});
