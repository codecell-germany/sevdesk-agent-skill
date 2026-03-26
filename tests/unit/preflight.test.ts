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
          contact: { id: "123", objectName: "Contact" },
          invoiceType: "RE",
          status: 100,
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

  it("rejects createInvoiceByFactory without contact and invoice core fields", () => {
    const result = validateWritePreflight("createInvoiceByFactory", {
      invoice: {
        invoiceDate: "2026-03-05",
        deliveryDate: "2026-03-06",
      },
      invoicePosSave: [{ quantity: 1, price: 100, taxRate: 19 }],
    });

    expect(result.errors.join("\n")).toContain("invoice.contact");
    expect(result.errors.join("\n")).toContain("invoice.invoiceType");
    expect(result.errors.join("\n")).toContain("invoice.status");
  });

  it("rejects createInvoiceByFactory with invalid position values", () => {
    const result = validateWritePreflight("createInvoiceByFactory", {
      invoice: {
        contact: { id: "123", objectName: "Contact" },
        invoiceType: "RE",
        status: 100,
        invoiceDate: "2026-03-05",
        deliveryDate: "2026-03-06",
      },
      invoicePosSave: [{ quantity: 0, price: -1, taxRate: -19 }],
    });

    const output = result.errors.join("\n");
    expect(output).toContain("invoicePosSave[0].quantity");
    expect(output).toContain("invoicePosSave[0].price");
    expect(output).toContain("invoicePosSave[0].taxRate");
  });

  it("accepts valid voucherFactorySaveVoucher payload", () => {
    const result = validateWritePreflight("voucherFactorySaveVoucher", {
      voucher: {
        objectName: "Voucher",
        mapAll: true,
        status: 50,
        voucherType: "VOU",
        creditDebit: "D",
        taxType: "default",
        taxRule: { id: "9", objectName: "TaxRule" },
        currency: "EUR",
        voucherDate: "2026-03-10",
        deliveryDate: "2026-03-10",
        description: "Adobe",
        supplierName: "Adobe",
      },
      voucherPosSave: [
        {
          objectName: "VoucherPos",
          mapAll: true,
          accountDatev: { id: "700", objectName: "AccountDatev" },
          accountingType: { id: "33", objectName: "AccountingType" },
          taxRate: 19,
          net: false,
          sumNet: 100,
          sumGross: 119,
        },
      ],
      filename: "hash.pdf",
    });

    expect(result.errors).toEqual([]);
  });

  it("rejects voucherFactorySaveVoucher without account mapping", () => {
    const result = validateWritePreflight("voucherFactorySaveVoucher", {
      voucher: {
        objectName: "Voucher",
        status: 50,
        voucherType: "VOU",
        creditDebit: "D",
        taxType: "default",
        taxRule: { id: "9", objectName: "TaxRule" },
        currency: "EUR",
        voucherDate: "2026-03-10",
        deliveryDate: "2026-03-10",
        description: "Adobe",
        supplierName: "Adobe",
      },
      voucherPosSave: [
        {
          objectName: "VoucherPos",
          mapAll: true,
          taxRate: 19,
          net: false,
          sumNet: 100,
          sumGross: 119,
        },
      ],
    });

    const output = result.errors.join("\n");
    expect(output).toContain("accountDatev.id");
    expect(output).toContain("accountingType.id");
  });

  it("accepts valid bookVoucher payload", () => {
    const result = validateWritePreflight("bookVoucher", {
      amount: 119,
      date: "2026-03-11",
      type: "FULL_PAYMENT",
      checkAccount: { id: "5", objectName: "CheckAccount" },
      checkAccountTransaction: {
        id: "100",
        objectName: "CheckAccountTransaction",
      },
    });

    expect(result.errors).toEqual([]);
  });

  it("rejects invalid bookVoucher payload", () => {
    const result = validateWritePreflight("bookVoucher", {
      amount: 0,
      date: "not-a-date",
      type: "",
      checkAccount: {},
      checkAccountTransaction: { objectName: "CheckAccountTransaction" },
    });

    const output = result.errors.join("\n");
    expect(output).toContain("amount");
    expect(output).toContain("date");
    expect(output).toContain("type");
    expect(output).toContain("checkAccount.id");
    expect(output).toContain("checkAccountTransaction.id");
  });
});
