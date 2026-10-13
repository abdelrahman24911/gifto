import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getEmailConfig, isEmailConfigured } from "./config";

const KEYS = ["RESEND_API_KEY", "ORDER_NOTIFICATION_FROM", "ORDER_NOTIFICATION_EMAIL"] as const;
const saved = new Map<string, string | undefined>();

beforeEach(() => {
  for (const key of KEYS) {
    saved.set(key, process.env[key]);
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of KEYS) {
    const value = saved.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("getEmailConfig", () => {
  it("returns null unless all three variables are present", () => {
    expect(getEmailConfig()).toBeNull();
    process.env.RESEND_API_KEY = "re_x";
    expect(getEmailConfig()).toBeNull();
    process.env.ORDER_NOTIFICATION_FROM = "orders@example.com";
    expect(getEmailConfig()).toBeNull();
    process.env.ORDER_NOTIFICATION_EMAIL = "owner@example.com";
    expect(getEmailConfig()).toEqual({
      apiKey: "re_x",
      from: "orders@example.com",
      to: "owner@example.com",
    });
    expect(isEmailConfigured()).toBe(true);
  });

  it("trims whitespace and ignores blank values", () => {
    process.env.RESEND_API_KEY = "  re_x  ";
    process.env.ORDER_NOTIFICATION_FROM = "  orders@example.com ";
    process.env.ORDER_NOTIFICATION_EMAIL = "   ";
    expect(getEmailConfig()).toBeNull();
  });
});
