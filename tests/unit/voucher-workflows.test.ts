import { describe, expect, it } from "vitest";

import {
  buildBookExistingVoucherPlan,
  buildBookVoucherPayload,
  buildTransactionDateRange,
  buildTransactionMatchCriteriaFromVoucher,
  buildVoucherPayloadFromArgs,
  buildVoucherPayloadFromTemplate,
  extractUploadedFileMetadata,
  extractUploadedFilename,
  matchTransactions,
  summarizeVoucherInspect,
} from "../../src/lib/voucher-workflows";

describe("voucher workflow helpers", () => {
  it("builds a voucher payload from simple args", () => {
    const payload = buildVoucherPayloadFromArgs({
      supplierName: "Adobe",
      description: "Adobe March 2026",
      voucherDate: "2026-03-10",
      deliveryDate: "2026-03-10",
      currency: "EUR",
      status: 50,
      creditDebit: "D",
      voucherType: "VOU",
      taxType: "default",
      taxRuleId: "9",
      taxRate: 19,
      amount: 119,
      net: false,
      accountDatevId: "700",
      accountingTypeId: "33",
      filename: "hash.pdf",
      comment: "Software-Abo",
    });

    const voucher = payload.voucher as Record<string, unknown>;
    const positions = payload.voucherPosSave as Array<Record<string, unknown>>;

    expect(voucher.supplierName).toBe("Adobe");
    expect(voucher.taxRule).toEqual({ id: "9", objectName: "TaxRule" });
    expect(positions[0].sumNet).toBe(100);
    expect(positions[0].sumGross).toBe(119);
    expect(payload.filename).toBe("hash.pdf");
  });

  it("injects filename into voucher template payloads", () => {
    const payload = buildVoucherPayloadFromTemplate(
      { voucher: { objectName: "Voucher" }, voucherPosSave: [] },
      "upload.pdf"
    );

    expect(payload.filename).toBe("upload.pdf");
  });

  it("extracts uploaded filename from upload response", () => {
    expect(
      extractUploadedFilename({ objects: { filename: "f019bec36c65.pdf" } })
    ).toBe("f019bec36c65.pdf");
  });

  it("extracts normalized upload metadata from upload response", () => {
    expect(
      extractUploadedFileMetadata({
        objects: {
          filename: "f019bec36c65.pdf",
          mimeType: "application/pdf",
          document: { id: "800", objectName: "Document" },
        },
      })
    ).toEqual({
      filename: "f019bec36c65.pdf",
      mimeType: "application/pdf",
      documentId: "800",
    });
  });

  it("matches transactions by text, amount and date", () => {
    const matches = matchTransactions(
      [
        {
          id: "100",
          amount: 119,
          valueDate: "2026-03-10",
          payeePayerName: "Adobe Ireland Ltd",
          paymtPurpose: "Adobe Creative Cloud",
          status: 100,
          checkAccount: { id: "5", objectName: "CheckAccount" },
        },
        {
          id: "101",
          amount: 119,
          valueDate: "2026-02-01",
          payeePayerName: "Other Vendor",
          paymtPurpose: "Misc",
          status: 100,
          checkAccount: { id: "5", objectName: "CheckAccount" },
        },
      ],
      {
        amount: 119,
        counterpart: "Adobe",
        purpose: "Creative Cloud",
        voucherDate: "2026-03-10",
        windowDays: 30,
      },
      5
    );

    expect(matches[0].id).toBe("100");
    expect(matches[0].score).toBeGreaterThan(matches[1].score);
  });

  it("builds transaction matching criteria and booking payload", () => {
    const criteria = buildTransactionMatchCriteriaFromVoucher(
      {
        sumGross: "119",
        supplierName: "Adobe",
        description: "Creative Cloud",
        voucherDate: "2026-03-10",
      },
      21
    );
    const payload = buildBookVoucherPayload({
      amount: 119,
      date: "2026-03-11",
      type: "FULL_PAYMENT",
      checkAccountId: "5",
      transactionId: "100",
      createFeed: true,
    });

    expect(criteria.amount).toBe(119);
    expect(criteria.counterpart).toBe("Adobe");
    expect(buildTransactionDateRange("2026-03-10", 21)).toEqual({
      startDate: "2026-02-17",
      endDate: "2026-03-31",
    });
    expect(payload.checkAccount).toEqual({ id: "5", objectName: "CheckAccount" });
    expect(payload.checkAccountTransaction).toEqual({
      id: "100",
      objectName: "CheckAccountTransaction",
    });
  });

  it("summarizes voucher inspect payloads", () => {
    const summary = summarizeVoucherInspect(
      {
        id: "901",
        status: "100",
        voucherDate: "2026-03-10",
        deliveryDate: "2026-03-10",
        description: "IONOS Rechnung",
        supplierName: "IONOS SE",
        currency: "EUR",
        taxRule: { id: "9", objectName: "TaxRule" },
        taxType: "default",
        document: { id: "500", objectName: "Document" },
        sumNet: "10",
        sumTax: "1.9",
        sumGross: "11.9",
        paidAmount: "0",
      },
      [
        {
          id: "1",
          accountDatev: { id: "700", name: "Hosting", number: "4210" },
          accountingType: { id: "33", name: "Hosting", number: "4210" },
          taxRate: "19",
          net: false,
          sumNet: "10",
          sumGross: "11.9",
          comment: "Monatsrechnung",
        },
      ]
    );

    expect(summary.payStatus).toBe("open");
    expect(summary.document.id).toBe("500");
    expect(summary.positions[0].accountDatev.number).toBe("4210");
  });

  it("derives booking plans for existing vouchers and transactions", () => {
    const plan = buildBookExistingVoucherPlan({
      voucher: {
        id: "901",
        status: "100",
        sumGross: "11.90",
        paidAmount: "0",
      },
      transaction: {
        id: "100",
        amount: "-11.90",
        valueDate: "2026-03-11",
        status: "100",
        payeePayerName: "IONOS SE",
        checkAccount: { id: "5", objectName: "CheckAccount" },
      },
      type: "FULL_PAYMENT",
    });

    expect(plan.payload).toEqual({
      amount: 11.9,
      date: "2026-03-11",
      type: "FULL_PAYMENT",
      checkAccount: { id: "5", objectName: "CheckAccount" },
      checkAccountTransaction: { id: "100", objectName: "CheckAccountTransaction" },
    });
    expect(plan.warnings).toHaveLength(0);
  });
});
