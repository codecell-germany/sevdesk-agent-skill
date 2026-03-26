import { describe, expect, it, vi } from "vitest";

import {
  runWriteVerification,
  verifyAndMaybeFixCreateContact,
} from "../../src/lib/verify";
import type { SevdeskClient } from "../../src/lib/client";

describe("runWriteVerification", () => {
  it("verifies createContact with expected customer number/parent/address", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: {
            id: "100",
            customerNumber: "7001",
            parent: { id: "88", objectName: "Contact" },
          },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: [{ id: "500" }],
        },
      });

    const client = { request } as unknown as SevdeskClient;
    const verification = await runWriteVerification({
      operationId: "createContact",
      client,
      body: {
        contact: {
          customerNumber: "7001",
          parent: { id: "88", objectName: "Contact" },
        },
      },
      writeResponse: {
        ok: true,
        status: 201,
        headers: {},
        data: { objects: { id: "100" } },
      },
    });

    expect(verification?.type).toBe("createContact");
    expect(verification?.ok).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("returns null for unsupported operation", async () => {
    const client = { request: vi.fn() } as unknown as SevdeskClient;
    const verification = await runWriteVerification({
      operationId: "updateInvoice",
      client,
      body: {},
      writeResponse: {
        ok: true,
        status: 200,
        headers: {},
        data: {},
      },
    });

    expect(verification).toBeNull();
  });

  it("verifies createInvoiceByFactory with contact, positions, sums, status and taxRule", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: {
            id: "321",
            contact: { id: "77", objectName: "Contact" },
            status: "100",
            taxRule: { id: "1", objectName: "TaxRule" },
            sumNet: "100",
            sumTax: "19",
            sumGross: "119",
            invoiceNumber: null,
          },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: [{ id: "1" }],
        },
      });

    const client = { request } as unknown as SevdeskClient;
    const verification = await runWriteVerification({
      operationId: "createInvoiceByFactory",
      client,
      body: {
        invoice: {
          contact: { id: "77", objectName: "Contact" },
          status: 100,
          taxRule: { id: "1", objectName: "TaxRule" },
          showNet: true,
        },
        invoicePosSave: [
          {
            quantity: 1,
            price: 100,
            taxRate: 19,
          },
        ],
      },
      writeResponse: {
        ok: true,
        status: 201,
        headers: {},
        data: { objects: { invoice: { id: "321" } } },
      },
    });

    expect(verification?.type).toBe("createInvoiceByFactory");
    expect(verification?.ok).toBe(true);
    expect(verification?.checks.some((check) => check.check === "invoiceNumber")).toBe(
      true
    );
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("verifies voucherFactorySaveVoucher with attachment, positions and totals", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: {
            id: "901",
            status: "50",
            taxRule: { id: "9", objectName: "TaxRule" },
            supplier: { id: "77", objectName: "Contact" },
            sumNet: "100",
            sumTax: "19",
            sumGross: "119",
            document: { id: "500", objectName: "Document" },
          },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: [{ id: "1" }],
        },
      });

    const client = { request } as unknown as SevdeskClient;
    const verification = await runWriteVerification({
      operationId: "voucherFactorySaveVoucher",
      client,
      body: {
        voucher: {
          status: 50,
          taxRule: { id: "9", objectName: "TaxRule" },
          supplier: { id: "77", objectName: "Contact" },
        },
        voucherPosSave: [{ sumNet: 100, sumGross: 119 }],
        filename: "hash.pdf",
      },
      writeResponse: {
        ok: true,
        status: 201,
        headers: {},
        data: { objects: { voucher: { id: "901" } } },
      },
    });

    expect(verification?.type).toBe("voucherFactorySaveVoucher");
    expect(verification?.ok).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("verifies bookVoucher by checking status and paidAmount", async () => {
    const request = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {},
      data: {
        objects: {
          id: "901",
          status: "1000",
          paidAmount: "119",
        },
      },
    });

    const client = { request } as unknown as SevdeskClient;
    const verification = await runWriteVerification({
      operationId: "bookVoucher",
      client,
      body: {
        amount: 119,
        checkAccount: { id: "5", objectName: "CheckAccount" },
        checkAccountTransaction: {
          id: "100",
          objectName: "CheckAccountTransaction",
        },
      },
      writeResponse: {
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: {
            voucher: { id: "901", objectName: "Voucher" },
            toStatus: "1000",
          },
        },
      },
    });

    expect(verification?.type).toBe("bookVoucher");
    expect(verification?.ok).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("can auto-fix createContact customerNumber mismatch", async () => {
    const request = vi
      .fn()
      // initial verification read: /Contact/{id}
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: {
            id: "100",
            customerNumber: "7000",
            parent: { id: "88", objectName: "Contact" },
          },
        },
      })
      // initial verification read: /ContactAddress
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: { objects: [{ id: "500" }] },
      })
      // auto-fix write: PUT /Contact/{id}
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: { objects: { id: "100" } },
      })
      // re-verify read: /Contact/{id}
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: {
            id: "100",
            customerNumber: "7001",
            parent: { id: "88", objectName: "Contact" },
          },
        },
      })
      // re-verify read: /ContactAddress
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: { objects: [{ id: "500" }] },
      });

    const client = { request } as unknown as SevdeskClient;
    const result = await verifyAndMaybeFixCreateContact({
      client,
      body: {
        contact: {
          customerNumber: "7001",
          parent: { id: "88", objectName: "Contact" },
        },
      },
      writeResponse: {
        ok: true,
        status: 201,
        headers: {},
        data: { objects: { id: "100" } },
      },
      autoFixCustomerNumber: true,
    });

    expect(result.verification.ok).toBe(true);
    expect(result.autoFix.attempted).toBe(true);
    expect(result.autoFix.changed).toBe(true);
    expect(result.autoFix.ok).toBe(true);
    expect(result.autoFix.afterCustomerNumber).toBe("7001");
    expect(request).toHaveBeenCalledTimes(5);
  });

  it("skips auto-fix when disabled", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: {
            id: "100",
            customerNumber: "7000",
            parent: { id: "88", objectName: "Contact" },
          },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: { objects: [{ id: "500" }] },
      });

    const client = { request } as unknown as SevdeskClient;
    const result = await verifyAndMaybeFixCreateContact({
      client,
      body: {
        contact: {
          customerNumber: "7001",
          parent: { id: "88", objectName: "Contact" },
        },
      },
      writeResponse: {
        ok: true,
        status: 201,
        headers: {},
        data: { objects: { id: "100" } },
      },
      autoFixCustomerNumber: false,
    });

    expect(result.verification.ok).toBe(false);
    expect(result.autoFix.attempted).toBe(false);
    expect(result.autoFix.reason).toContain("disabled");
    expect(request).toHaveBeenCalledTimes(2);
  });
});
