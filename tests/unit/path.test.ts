import { describe, expect, it } from "vitest";

import { resolvePathTemplate } from "../../src/lib/path";

describe("resolvePathTemplate", () => {
  it("replaces placeholders", () => {
    expect(
      resolvePathTemplate("/Invoice/{invoiceId}/getPdf", { invoiceId: "123" })
    ).toBe("/Invoice/123/getPdf");
  });

  it("encodes path values", () => {
    expect(resolvePathTemplate("/Tag/{tagId}", { tagId: "A B" })).toBe(
      "/Tag/A%20B"
    );
  });

  it("throws when missing path param", () => {
    expect(() => resolvePathTemplate("/Tag/{tagId}", {})).toThrow(
      "Missing required path parameter"
    );
  });
});
