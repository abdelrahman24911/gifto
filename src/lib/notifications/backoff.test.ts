import { describe, expect, it } from "vitest";
import { BASE_BACKOFF_MS, MAX_BACKOFF_MS, backoffMs, computeNextAttemptAt } from "./backoff";

describe("backoffMs", () => {
  it("starts at the base delay on the first failure", () => {
    expect(backoffMs(1)).toBe(BASE_BACKOFF_MS);
  });

  it("doubles on each subsequent attempt", () => {
    expect(backoffMs(2)).toBe(2 * BASE_BACKOFF_MS);
    expect(backoffMs(3)).toBe(4 * BASE_BACKOFF_MS);
  });

  it("caps at the maximum delay", () => {
    expect(backoffMs(20)).toBe(MAX_BACKOFF_MS);
  });
});

describe("computeNextAttemptAt", () => {
  it("adds the backoff to the provided clock", () => {
    const now = new Date("2026-10-13T12:00:00.000Z");
    expect(computeNextAttemptAt(1, now)).toBe("2026-10-13T12:01:00.000Z");
    expect(computeNextAttemptAt(2, now)).toBe("2026-10-13T12:02:00.000Z");
  });
});
