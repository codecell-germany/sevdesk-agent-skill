import { describe, expect, it } from "vitest";

import { getCatalog, getOperation, listOperations } from "../../src/lib/catalog";

describe("catalog", () => {
  it("contains operation entries", () => {
    const catalog = getCatalog();
    expect(catalog.length).toBeGreaterThan(100);
  });

  it("finds known operation", () => {
    const op = getOperation("getInvoices");
    expect(op.method).toBe("GET");
    expect(op.path).toBe("/Invoice");
  });

  it("filters read-only operations", () => {
    const items = listOperations({ readOnly: true });
    expect(items.every((entry) => entry.method === "GET")).toBe(true);
  });

  it("throws for unknown operation", () => {
    expect(() => getOperation("notExistingOperation")).toThrow(
      "Unknown operationId"
    );
  });
});
