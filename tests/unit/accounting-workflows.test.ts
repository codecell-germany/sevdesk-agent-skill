import { describe, expect, it } from "vitest";

import {
  filterAccountingGuidanceAccounts,
  normalizeAccountingGuidanceAccounts,
  summarizeTaxRuleGuidance,
} from "../../src/lib/accounting-workflows";

describe("accounting workflow helpers", () => {
  it("normalizes receipt guidance accounts", () => {
    const accounts = normalizeAccountingGuidanceAccounts({
      objects: [
        {
          accountDatevId: 700,
          accountNumber: "4210",
          accountName: "Hosting",
          description: "Hostingkosten",
          allowedTaxRules: [
            {
              id: 1,
              name: "USTPFL_UMS_EINN",
              description: "Umsatzsteuerpflichtige Umsätze",
              taxRates: ["NINETEEN"],
            },
          ],
          allowedReceiptTypes: ["EXPENSE"],
        },
      ],
    });

    expect(accounts).toEqual([
      {
        accountDatevId: "700",
        accountNumber: "4210",
        accountName: "Hosting",
        description: "Hostingkosten",
        allowedTaxRules: [
          {
            id: "1",
            name: "USTPFL_UMS_EINN",
            description: "Umsatzsteuerpflichtige Umsätze",
            taxRates: ["NINETEEN"],
          },
        ],
        allowedReceiptTypes: ["EXPENSE"],
      },
    ]);
  });

  it("filters guidance accounts by account number or id", () => {
    const accounts = [
      {
        accountDatevId: "700",
        accountNumber: "4210",
        accountName: "Hosting",
        description: null,
        allowedTaxRules: [],
        allowedReceiptTypes: [],
      },
      {
        accountDatevId: "701",
        accountNumber: "4220",
        accountName: "Software",
        description: null,
        allowedTaxRules: [],
        allowedReceiptTypes: [],
      },
    ];

    expect(
      filterAccountingGuidanceAccounts(accounts, { accountNumber: "4220" })
    ).toHaveLength(1);
    expect(
      filterAccountingGuidanceAccounts(accounts, { accountDatevId: "700" })
    ).toHaveLength(1);
  });

  it("summarizes tax rule guidance payloads", () => {
    const rules = summarizeTaxRuleGuidance({
      objects: {
        id: 1,
        name: "USTPFL_UMS_EINN",
        description: "Umsatzsteuerpflichtige Umsätze",
        taxRates: ["NINETEEN"],
      },
    });

    expect(rules).toEqual([
      {
        id: "1",
        name: "USTPFL_UMS_EINN",
        description: "Umsatzsteuerpflichtige Umsätze",
        taxRates: ["NINETEEN"],
      },
    ]);
  });
});
