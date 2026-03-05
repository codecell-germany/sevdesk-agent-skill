import { describe, expect, it } from "vitest";

import { validateWritePreflight } from "../../src/lib/preflight";

describe("validateWritePreflight", () => {
  it("rejects createContact without company/person naming fields", () => {
    const result = validateWritePreflight("createContact", {
      contact: {
        customerNumber: "10001",
      },
    });

    expect(result.errors.join("\n")).toContain("contact.name");
  });

  it("accepts valid createContact payload", () => {
    const result = validateWritePreflight("createContact", {
      contact: {
        name: "Example GmbH",
        customerNumber: "10001",
      },
    });

    expect(result.errors).toEqual([]);
  });

  it("rejects createOrder without positions", () => {
    const result = validateWritePreflight("createOrder", {
      order: {
        orderType: "AN",
        orderDate: "2026-02-20",
        currency: "EUR",
        orderNumber: "AN-202602-1001",
        status: 100,
        contact: { id: "123", objectName: "Contact" },
      },
      orderPosSave: [],
    });

    expect(result.errors.join("\n")).toContain("orderPosSave");
  });

  it("accepts valid createOrder payload", () => {
    const result = validateWritePreflight("createOrder", {
      order: {
        orderType: "AN",
        orderDate: "2026-02-20",
        currency: "EUR",
        orderNumber: "AN-202602-1001",
        status: 100,
        contact: { id: "123", objectName: "Contact" },
      },
      orderPosSave: [
        {
          name: "Service",
          quantity: 1,
          price: 100,
        },
      ],
    });

    expect(result.errors).toEqual([]);
  });

  it("rejects createInvoiceByFactory when deliveryDate is not later than invoiceDate", () => {
    const result = validateWritePreflight("createInvoiceByFactory", {
      invoice: {
        invoiceDate: "2026-03-05",
        deliveryDate: "2026-03-05",
      },
      invoicePosSave: [{ quantity: 1, price: 100, taxRate: 19 }],
    });

    expect(result.errors.join("\n")).toContain("deliveryDate");
    expect(result.errors.join("\n")).toContain("auto-fix-delivery-date");
  });

  it("auto-fixes createInvoiceByFactory deliveryDate when requested", () => {
    const result = validateWritePreflight(
      "createInvoiceByFactory",
      {
        invoice: {
          invoiceDate: "2026-03-05",
          deliveryDate: "2026-03-05",
        },
        invoicePosSave: [{ quantity: 1, price: 100, taxRate: 19 }],
      },
      { autoFixDeliveryDate: true }
    );

    expect(result.errors).toEqual([]);
    expect(result.autoFixes).toContain("invoice.deliveryDate");
    const normalized = (result.normalizedBody ?? {}) as Record<string, unknown>;
    const invoice = (normalized.invoice ?? {}) as Record<string, unknown>;
    expect(invoice.deliveryDate).toBe("2026-03-06");
  });
});
