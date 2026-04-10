import { describe, expect, it } from "vitest";

import {
  buildContactAddressEditPatch,
  buildContactEditPatch,
  buildInvoiceRecreatePayload,
  buildOrderEditPatch,
} from "../../src/lib/edit-workflows";

describe("edit workflow helpers", () => {
  it("builds an order patch from flags and wrapped patch files", () => {
    const patch = buildOrderEditPatch({
      patchBody: {
        order: {
          header: "Alt",
          currency: "EUR",
        },
      },
      header: "Neu",
      contactId: "55",
    });

    expect(patch.header).toBe("Neu");
    expect(patch.currency).toBe("EUR");
    expect(patch.contact).toEqual({ id: "55", objectName: "Contact" });
  });

  it("builds a contact patch with nested parent contact", () => {
    const patch = buildContactEditPatch({
      customerNumber: "KD-1001",
      parentId: "88",
      exemptVat: true,
    });

    expect(patch.customerNumber).toBe("KD-1001");
    expect(patch.parent).toEqual({ id: "88", objectName: "Contact" });
    expect(patch.exemptVat).toBe(true);
  });

  it("builds a contact address patch with wrapped patch file and flags", () => {
    const patch = buildContactAddressEditPatch({
      patchBody: {
        contactAddress: {
          street: "Alte Straße 1",
        },
      },
      contactId: "100",
      city: "Berlin",
      countryId: "1",
    });

    expect(patch.contact).toEqual({ id: "100", objectName: "Contact" });
    expect(patch.street).toBe("Alte Straße 1");
    expect(patch.city).toBe("Berlin");
    expect(patch.country).toEqual({ id: "1", objectName: "StaticCountry" });
  });

  it("builds a recreated invoice payload with patched invoice fields and replaced positions", () => {
    const payload = buildInvoiceRecreatePayload({
      sourceInvoice: {
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
      },
      sourcePositions: [
        {
          name: "Alt",
          quantity: 1,
          price: 100,
          taxRate: 19,
          unity: { id: 1, objectName: "Unity" },
        },
      ],
      patchBody: {
        invoice: {
          headText: "Korrigiert",
        },
        invoicePosSave: [
          {
            objectName: "InvoicePos",
            mapAll: true,
            name: "Neu",
            quantity: 2,
            price: 50,
            taxRate: 19,
            unity: { id: 1, objectName: "Unity" },
          },
        ],
      },
      invoiceDate: "2026-04-10",
      deliveryDate: "2026-04-11",
      label: "Korrigierte Rechnung",
      header: "Korrigiert RE-100",
      contactId: "77",
    });

    const invoice = payload.invoice as Record<string, unknown>;
    const positions = payload.invoicePosSave as Array<Record<string, unknown>>;

    expect(invoice.header).toBe("Korrigiert RE-100");
    expect(invoice.headText).toBe("Korrigiert");
    expect(invoice.contact).toEqual({ id: "77", objectName: "Contact" });
    expect(positions).toHaveLength(1);
    expect(positions[0].name).toBe("Neu");
  });
});
