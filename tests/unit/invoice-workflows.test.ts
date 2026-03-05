import { describe, expect, it } from "vitest";

import {
  buildClonedInvoicePayload,
  buildInstallmentInvoicePayload,
  parsePositionPriceOverrides,
  shiftDateByPeriod,
} from "../../src/lib/invoice-workflows";

describe("invoice workflow helpers", () => {
  const sourceInvoice = {
    id: "10",
    invoiceNumber: "RE-100",
    invoiceType: "RE",
    currency: "EUR",
    taxText: "USt 19%",
    taxType: "default",
    showNet: true,
    contact: { id: "1", objectName: "Contact" },
    contactPerson: { id: "2", objectName: "SevUser" },
    taxRule: { id: "1", objectName: "TaxRule" },
    addressCountry: { id: "1", objectName: "StaticCountry" },
  };

  const sourcePositions = [
    {
      name: "A",
      text: "Text A",
      quantity: 2,
      price: 100,
      taxRate: 19,
      unity: { id: 1, objectName: "Unity" },
    },
  ];

  it("builds installment payload with scaled prices", () => {
    const payload = buildInstallmentInvoicePayload({
      sourceInvoice,
      sourcePositions,
      percent: 70,
      label: "Abschlag",
      invoiceDate: "2026-03-05",
      deliveryDate: "2026-03-06",
      invoiceType: "AR",
    });

    const invoice = payload.invoice as Record<string, unknown>;
    const positions = payload.invoicePosSave as Array<Record<string, unknown>>;

    expect(invoice.invoiceType).toBe("AR");
    expect(positions[0].price).toBe(70);
    expect(String(invoice.customerInternalNote)).toContain("70%");
  });

  it("builds cloned payload with selective price overrides", () => {
    const payload = buildClonedInvoicePayload({
      sourceInvoice,
      sourcePositions,
      invoiceDate: "2026-04-01",
      deliveryDate: "2026-04-02",
      label: "Clone",
      priceOverrides: { 0: 250.5 },
    });

    const positions = payload.invoicePosSave as Array<Record<string, unknown>>;
    expect(positions[0].price).toBe(250.5);
  });

  it("parses position overrides", () => {
    expect(parsePositionPriceOverrides(["0=100", "2=19.95"])).toEqual({
      0: 100,
      2: 19.95,
    });
  });

  it("shifts date by supported periods", () => {
    expect(shiftDateByPeriod("2026-03-05", "monthly")).toBe("2026-04-05");
    expect(shiftDateByPeriod("2026-03-05", "P1Y")).toBe("2027-03-05");
  });
});

