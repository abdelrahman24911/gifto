import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  fileURLToPath(
    new URL("../../../supabase/migrations/20261001000015_order_notifications.sql", import.meta.url),
  ),
  "utf8",
);

describe("order notifications migration", () => {
  it("enables email as the active channel and keeps whatsapp reserved", () => {
    expect(sql).toMatch(
      /create type public\.notification_channel as enum \('email', 'whatsapp'\)/,
    );
    expect(sql).toContain("channel             public.notification_channel not null default 'email'");
  });

  it("prevents duplicate jobs via the unique constraint and idempotent insert", () => {
    expect(sql).toContain("unique (order_id, event_type, channel)");
    expect(sql).toContain("on conflict (idempotency_key) do nothing");
    expect(sql).toContain("'order:' || v_order_id::text || ':order_created:email'");
  });

  it("enqueues an email job (never a whatsapp job) from create_order", () => {
    expect(sql).toContain("'order_created',");
    expect(sql).not.toContain(":order_created:whatsapp");
  });

  it("restricts claiming to the requested channel", () => {
    expect(sql).toMatch(
      /claim_notification_jobs\(\s*p_limit int default 10,\s*p_channel public\.notification_channel default 'email'/,
    );
    expect(sql).toContain("and channel = p_channel");
  });

  it("contains no WhatsApp API endpoint (the channel must stay dormant)", () => {
    expect(sql).not.toContain("graph.facebook.com");
    expect(sql).not.toContain("whatsapp/cloud");
  });
});
