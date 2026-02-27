import { describe, expect, it } from "vitest";

import {
  getOperationQuirk,
  listOperationQuirkEntries,
  normalizeReadData,
  validateRuntimeReadQuery,
} from "../../src/lib/quirks";

describe("runtime quirks", () => {
  it("knows runtime-required query quirk", () => {
    const quirk = getOperationQuirk("contactCustomerNumberAvailabilityCheck");
    expect(quirk?.runtimeRequiredQuery).toEqual(["customerNumber"]);
  });

  it("validates runtime-required query", () => {
    expect(
      validateRuntimeReadQuery("contactCustomerNumberAvailabilityCheck", {})
    ).toEqual(["customerNumber"]);

    expect(
      validateRuntimeReadQuery("contactCustomerNumberAvailabilityCheck", {
        customerNumber: "123",
      })
    ).toEqual([]);
  });

  it("unwraps objects for known wrapped endpoints", () => {
    const raw = {
      objects: {
        orders: 1,
      },
    };

    const result = normalizeReadData("getContactTabsItemCountById", raw);
    expect(result.normalizedData).toEqual({ orders: 1 });
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("coerces numeric objects string to number", () => {
    const raw = { objects: "42" };
    const result = normalizeReadData("partGetStock", raw);

    expect(result.normalizedData).toBe(42);
    expect(result.warnings).toContain(
      "Applied quirk: coerced objects string to number"
    );
  });

  it("coerces objects object to array", () => {
    const raw = { objects: { accountNumber: "1234" } };
    const result = normalizeReadData("forAccountNumber", raw);

    expect(result.normalizedData).toEqual([{ accountNumber: "1234" }]);
    expect(result.warnings).toContain(
      "Applied quirk: coerced objects object to array"
    );
  });

  it("returns raw data when no quirk exists", () => {
    const raw = { objects: [1, 2, 3] };
    const result = normalizeReadData("getInvoices", raw);

    expect(result.normalizedData).toEqual(raw);
    expect(result.warnings).toEqual([]);
  });

  it("can return quirks as a sorted array for stable parsing", () => {
    const entries = listOperationQuirkEntries();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]).toHaveProperty("operationId");
    expect(entries.map((entry) => entry.operationId)).toEqual(
      [...entries.map((entry) => entry.operationId)].sort((a, b) =>
        a.localeCompare(b)
      )
    );
  });
});
