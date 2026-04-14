function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toText(value: unknown): string {
  return String(value ?? "").trim();
}

function toId(value: unknown): string | null {
  const text = toText(value);
  return text || null;
}

export interface AccountingTaxRuleSummary {
  id: string | null;
  name: string | null;
  description: string | null;
  taxRates: string[];
}

export interface AccountingGuidanceAccount {
  accountDatevId: string | null;
  accountNumber: string | null;
  accountName: string | null;
  description: string | null;
  allowedTaxRules: AccountingTaxRuleSummary[];
  allowedReceiptTypes: string[];
}

function normalizeTaxRule(value: unknown): AccountingTaxRuleSummary {
  const record = asRecord(value);
  return {
    id: toId(record?.id),
    name: toText(record?.name) || null,
    description: toText(record?.description) || null,
    taxRates: asArray(record?.taxRates)
      .map((entry) => toText(entry))
      .filter(Boolean),
  };
}

export function normalizeAccountingGuidanceAccounts(data: unknown): AccountingGuidanceAccount[] {
  const root = asRecord(data);
  const objects = root && Object.prototype.hasOwnProperty.call(root, "objects") ? root.objects : data;

  const entries = Array.isArray(objects)
    ? objects
    : objects && typeof objects === "object"
      ? [objects]
      : [];

  return entries
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => entry !== null)
    .map((entry) => ({
      accountDatevId: toId(entry.accountDatevId),
      accountNumber: toText(entry.accountNumber) || null,
      accountName: toText(entry.accountName) || null,
      description: toText(entry.description) || null,
      allowedTaxRules: asArray(entry.allowedTaxRules).map((rule) => normalizeTaxRule(rule)),
      allowedReceiptTypes: asArray(entry.allowedReceiptTypes)
        .map((receiptType) => toText(receiptType))
        .filter(Boolean),
    }));
}

export function filterAccountingGuidanceAccounts(
  accounts: AccountingGuidanceAccount[],
  options: {
    accountNumber?: string;
    accountDatevId?: string;
  }
): AccountingGuidanceAccount[] {
  const accountNumber = toText(options.accountNumber);
  const accountDatevId = toText(options.accountDatevId);

  return accounts.filter((account) => {
    if (accountNumber && account.accountNumber !== accountNumber) {
      return false;
    }
    if (accountDatevId && account.accountDatevId !== accountDatevId) {
      return false;
    }
    return true;
  });
}

export function summarizeTaxRuleGuidance(data: unknown): AccountingTaxRuleSummary[] {
  const root = asRecord(data);
  const objects = root && Object.prototype.hasOwnProperty.call(root, "objects") ? root.objects : data;
  const entries = Array.isArray(objects)
    ? objects
    : objects && typeof objects === "object"
      ? [objects]
      : [];

  return entries
    .map((entry) => normalizeTaxRule(entry))
    .filter((entry) => entry.id !== null || entry.name !== null);
}
