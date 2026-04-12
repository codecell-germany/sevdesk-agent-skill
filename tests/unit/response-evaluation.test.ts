import { describe, expect, it } from "vitest";

import { hasFailedVerification } from "../../src/lib/response-evaluation";

describe("response evaluation", () => {
  it("returns false for empty or successful verification payloads", () => {
    expect(hasFailedVerification(undefined)).toBe(false);
    expect(hasFailedVerification(null)).toBe(false);
    expect(hasFailedVerification({ ok: true })).toBe(false);
    expect(
      hasFailedVerification({
        contact: { ok: true, checks: [] },
        address: { ok: true, checks: [] },
      })
    ).toBe(false);
  });

  it("detects nested failed verification results", () => {
    expect(hasFailedVerification({ ok: false })).toBe(true);
    expect(
      hasFailedVerification({
        contact: { ok: true },
        address: { ok: false, error: "mismatch" },
      })
    ).toBe(true);
    expect(
      hasFailedVerification({
        verification: [{ ok: true }, { ok: false }],
      })
    ).toBe(true);
  });
});
