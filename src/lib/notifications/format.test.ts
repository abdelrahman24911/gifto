import { describe, expect, it } from "vitest";
import {
  buildEmailHtml,
  buildEmailSubject,
  buildEmailText,
  buildTemplateParameters,
  buildTextMessage,
  formatDeliveryLocation,
  formatItemLines,
  formatMoney,
  formatOrderItems,
} from "./format";
import type { OrderNotificationPayload } from "./types";

const payload: OrderNotificationPayload = {
  order_number: "FL-1001",
  customer_name: "Mona Ali",
  customer_phone: "+20 100 000 0000",
  items: [
    { name: "Birthday Bliss Box", quantity: 2, unit_price: 200 },
    { name: "Custom Mug", quantity: 1, unit_price: 50 },
  ],
  subtotal: 450,
  delivery_fee: 40,
  total: 490,
  currency: "EGP",
  governorate: "cairo",
  area: "Nasr City",
  delivery_address: "Building 5, Street 9",
  delivery_notes: "Call on arrival",
};

describe("formatMoney", () => {
  it("formats numbers with thousands separators and currency", () => {
    expect(formatMoney(1250.5, "EGP")).toBe("1,250.5 EGP");
    expect(formatMoney("450")).toBe("450 EGP");
  });

  it("treats null/NaN/invalid as zero", () => {
    expect(formatMoney(null)).toBe("0 EGP");
    expect(formatMoney(Number.NaN)).toBe("0 EGP");
    expect(formatMoney("not a number")).toBe("0 EGP");
  });
});

describe("formatOrderItems", () => {
  it("joins items as quantity × name", () => {
    expect(formatOrderItems(payload.items)).toBe("2× Birthday Bliss Box, 1× Custom Mug");
  });

  it("falls back to an em dash for empty lists", () => {
    expect(formatOrderItems([])).toBe("—");
    expect(formatOrderItems(null)).toBe("—");
  });
});

describe("formatDeliveryLocation", () => {
  it("joins address, area and governorate", () => {
    expect(formatDeliveryLocation(payload)).toBe("Building 5, Street 9, Nasr City, cairo");
  });

  it("falls back when nothing is available", () => {
    expect(
      formatDeliveryLocation({
        ...payload,
        delivery_address: null,
        area: "  ",
        governorate: null,
      }),
    ).toBe("—");
  });
});

describe("buildTemplateParameters", () => {
  it("returns the seven template params in the documented order", () => {
    expect(buildTemplateParameters(payload)).toEqual([
      "FL-1001",
      "Mona Ali",
      "+20 100 000 0000",
      "2× Birthday Bliss Box, 1× Custom Mug",
      "490 EGP",
      "Building 5, Street 9, Nasr City, cairo",
      "Call on arrival",
    ]);
  });

  it("collapses whitespace and never emits empty params", () => {
    const params = buildTemplateParameters({
      ...payload,
      customer_name: "  Mona\n\nAli  ",
      delivery_notes: null,
      area: null,
      governorate: null,
      delivery_address: null,
    });
    expect(params[1]).toBe("Mona Ali");
    expect(params[5]).toBe("—");
    expect(params[6]).toBe("None");
    expect(params.every((param) => param.length > 0)).toBe(true);
  });
});

describe("buildTextMessage", () => {
  it("renders a readable multi-line message", () => {
    const text = buildTextMessage(payload);
    expect(text).toContain("New order FL-1001");
    expect(text).toContain("Mona Ali");
    expect(text).toContain("Total: 490 EGP");
    expect(text).toContain("Notes: Call on arrival");
  });
});

describe("email formatting", () => {
  it("formats one line per item with quantity and unit price", () => {
    expect(formatItemLines(payload.items)).toEqual([
      "2× Birthday Bliss Box — 200 EGP each",
      "1× Custom Mug — 50 EGP each",
    ]);
    expect(formatItemLines(null)).toEqual([]);
  });

  it("builds a subject with order number and total", () => {
    expect(buildEmailSubject(payload)).toBe("New order FL-1001 - 490 EGP");
  });

  it("includes customer, items, subtotal, fee, total and delivery details", () => {
    const text = buildEmailText(payload);
    expect(text).toContain("New order FL-1001");
    expect(text).toContain("Mona Ali");
    expect(text).toContain("+20 100 000 0000");
    expect(text).toContain("2× Birthday Bliss Box — 200 EGP each");
    expect(text).toMatch(/Subtotal:\s+450 EGP/);
    expect(text).toMatch(/Delivery fee:\s+40 EGP/);
    expect(text).toMatch(/Total:\s+490 EGP/);
    expect(text).toContain("Building 5, Street 9");
    expect(text).toContain("Nasr City");
    expect(text).toContain("cairo");
    expect(text).toContain("Call on arrival");
  });

  it("renders HTML with escaped user-supplied values", () => {
    const html = buildEmailHtml({
      ...payload,
      customer_name: "Mona <script>alert(1)</script>",
    });
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("2× Birthday Bliss Box — 200 EGP each");
    expect(html).toContain("490 EGP");
  });

  it("uses fallbacks for missing optional fields", () => {
    const text = buildEmailText({
      ...payload,
      delivery_address: null,
      area: null,
      governorate: null,
      delivery_notes: null,
    });
    expect(text).toMatch(/Address:\s+—/);
    expect(text).toMatch(/Notes:\s+None/);
  });
});
