import { describe, expect, it } from "vitest";

import { deriveRemediationHints } from "../../src/lib/remediation";

describe("deriveRemediationHints", () => {
  it("provides delivery/invoice date hint for invoice validation errors", () => {
    const hints = deriveRemediationHints({
      operationId: "createInvoiceByFactory",
      status: 422,
      data: {
        error: {
          message: "invoiceDate must be before deliveryDate",
        },
      },
    });

    expect(hints.join("\n")).toContain("deliveryDate > invoiceDate");
  });

  it("provides position hint", () => {
    const hints = deriveRemediationHints({
      operationId: "createOrder",
      status: 422,
      data: {
        message: "The given document must have at least one position",
      },
    });

    expect(hints.join("\n")).toContain("at least one position entry");
  });
});

