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

function toId(value: unknown): string {
  return toText(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseDateLike(value: unknown): Date | null {
  const raw = toText(value);
  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const ddmmyyyy = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const ts = Number(raw);
  if (Number.isFinite(ts) && /^\d{10,13}$/.test(raw)) {
    const millis = raw.length >= 13 ? ts : ts * 1000;
    const d = new Date(millis);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function scoreField(candidate: string, term: string): number {
  const normalizedCandidate = candidate.trim().toLowerCase();
  const normalizedTerm = term.trim().toLowerCase();
  if (!normalizedCandidate || !normalizedTerm) {
    return 0;
  }
  if (normalizedCandidate === normalizedTerm) {
    return 1000;
  }
  if (normalizedCandidate.startsWith(normalizedTerm)) {
    return 700;
  }
  if (normalizedCandidate.includes(normalizedTerm)) {
    return 300;
  }
  return 0;
}

export interface VoucherPayloadOptions {
  supplierId?: string;
  supplierName?: string;
  description?: string;
  voucherDate: string;
  deliveryDate?: string;
  currency?: string;
  status?: number;
  creditDebit: string;
  voucherType?: string;
  taxType: string;
  taxRuleId: string;
  taxRate: number;
  amount: number;
  net: boolean;
  accountDatevId: string;
  accountingTypeId: string;
  filename?: string;
  comment?: string;
  isAsset?: boolean;
}

export function buildVoucherPayloadFromTemplate(
  template: unknown,
  filename: string
): Record<string, unknown> {
  const payload = asRecord(structuredClone(template));
  if (!payload) {
    throw new Error("Voucher template must be a JSON object.");
  }

  payload.filename = filename;
  return payload;
}

export function buildVoucherPayloadFromArgs(
  options: VoucherPayloadOptions
): Record<string, unknown> {
  const grossAmount = options.net
    ? roundMoney(options.amount * (1 + options.taxRate / 100))
    : roundMoney(options.amount);
  const netAmount = options.net
    ? roundMoney(options.amount)
    : roundMoney(grossAmount / (1 + options.taxRate / 100));

  const voucher: Record<string, unknown> = {
    objectName: "Voucher",
    mapAll: true,
    status: options.status ?? 50,
    voucherType: options.voucherType ?? "VOU",
    creditDebit: options.creditDebit,
    taxType: options.taxType,
    taxRule: {
      id: options.taxRuleId,
      objectName: "TaxRule",
    },
    currency: options.currency ?? "EUR",
    voucherDate: options.voucherDate,
    deliveryDate: options.deliveryDate ?? options.voucherDate,
    description: options.description ?? "Voucher upload",
  };

  if (options.supplierId) {
    voucher.supplier = {
      id: options.supplierId,
      objectName: "Contact",
    };
  } else if (options.supplierName) {
    voucher.supplierName = options.supplierName;
  }

  const payload: Record<string, unknown> = {
    voucher,
    voucherPosSave: [
      {
        objectName: "VoucherPos",
        mapAll: true,
        accountDatev: {
          id: options.accountDatevId,
          objectName: "AccountDatev",
        },
        accountingType: {
          id: options.accountingTypeId,
          objectName: "AccountingType",
        },
        taxRate: options.taxRate,
        net: options.net,
        sumNet: netAmount,
        sumGross: grossAmount,
        ...(options.comment ? { comment: options.comment } : {}),
        ...(options.isAsset ? { isAsset: true } : {}),
      },
    ],
  };

  if (options.filename) {
    payload.filename = options.filename;
  }

  return payload;
}

export function extractUploadedFilename(data: unknown): string | null {
  const root = asRecord(data);
  const objects = asRecord(root?.objects);
  const filename = toText(objects?.filename);
  return filename || null;
}

export interface UploadedFileMetadata {
  filename: string | null;
  mimeType: string | null;
  documentId: string | null;
}

export function extractUploadedFileMetadata(data: unknown): UploadedFileMetadata {
  const root = asRecord(data);
  const objects = asRecord(root?.objects);

  return {
    filename: toText(objects?.filename) || null,
    mimeType:
      toText(objects?.mimeType) ||
      toText(objects?.mimetype) ||
      toText(objects?.type) ||
      null,
    documentId: toId(objects?.documentId) || toId(asRecord(objects?.document)?.id) || null,
  };
}

export interface TransactionMatchCriteria {
  term?: string;
  amount?: number | null;
  counterpart?: string;
  purpose?: string;
  voucherDate?: string;
  windowDays?: number;
}

export interface TransactionCandidate {
  id: string;
  score: number;
  reasons: string[];
  amount: number | null;
  valueDate: string | null;
  payeePayerName: string | null;
  paymtPurpose: string | null;
  status: string | null;
  checkAccountId: string | null;
}

export interface VoucherInspectPositionSummary {
  id: string | null;
  accountDatev: {
    id: string | null;
    name: string | null;
    number: string | null;
  };
  accountingType: {
    id: string | null;
    name: string | null;
    number: string | null;
  };
  taxRate: number | null;
  net: boolean | null;
  sumNet: number | null;
  sumGross: number | null;
  comment: string | null;
  isAsset: boolean;
}

export interface VoucherInspectSummary {
  id: string;
  status: string | null;
  statusLabel: string | null;
  payStatus: "open" | "partially-paid" | "paid" | "unknown";
  voucherDate: string | null;
  deliveryDate: string | null;
  description: string | null;
  supplier: {
    id: string | null;
    name: string | null;
  };
  currency: string | null;
  taxRule: {
    id: string | null;
    objectName: string | null;
  };
  taxType: string | null;
  document: {
    id: string | null;
    objectName: string | null;
  };
  totals: {
    net: number | null;
    tax: number | null;
    gross: number | null;
    paidAmount: number | null;
    openAmount: number | null;
  };
  positions: VoucherInspectPositionSummary[];
}

export interface ExistingVoucherBookingPlan {
  payload: Record<string, unknown> | null;
  voucher: {
    id: string;
    status: string | null;
    sumGross: number | null;
    paidAmount: number | null;
  };
  transaction: {
    id: string;
    status: string | null;
    amount: number | null;
    valueDate: string | null;
    payeePayerName: string | null;
    checkAccountId: string | null;
  };
  warnings: string[];
}

function statusLabel(status: string | null): string | null {
  switch (status) {
    case "50":
      return "draft";
    case "100":
      return "open";
    case "1000":
      return "paid";
    default:
      return status || null;
  }
}

function summarizeAccountRef(value: unknown): {
  id: string | null;
  name: string | null;
  number: string | null;
} {
  const record = asRecord(value);
  return {
    id: toId(record?.id) || null,
    name: toText(record?.name) || null,
    number:
      toText(record?.number) || toText(record?.accountNumber) || toText(record?.code) || null,
  };
}

export function summarizeVoucherInspect(
  voucher: Record<string, unknown>,
  positions: Record<string, unknown>[]
): VoucherInspectSummary {
  const supplier = asRecord(voucher.supplier);
  const document = asRecord(voucher.document);
  const taxRule = asRecord(voucher.taxRule);
  const gross = toNumber(voucher.sumGross);
  const paidAmount = toNumber(voucher.paidAmount);
  const openAmount =
    gross !== null && paidAmount !== null ? roundMoney(Math.max(gross - paidAmount, 0)) : null;

  let payStatus: "open" | "partially-paid" | "paid" | "unknown" = "unknown";
  if (gross !== null && paidAmount !== null) {
    if (paidAmount >= gross - 0.01) {
      payStatus = "paid";
    } else if (paidAmount > 0.01) {
      payStatus = "partially-paid";
    } else {
      payStatus = "open";
    }
  } else if (toText(voucher.status) === "1000") {
    payStatus = "paid";
  } else if (toText(voucher.status) === "50" || toText(voucher.status) === "100") {
    payStatus = "open";
  }

  return {
    id: toId(voucher.id),
    status: toText(voucher.status) || null,
    statusLabel: statusLabel(toText(voucher.status) || null),
    payStatus,
    voucherDate: toText(voucher.voucherDate) || null,
    deliveryDate: toText(voucher.deliveryDate) || null,
    description: toText(voucher.description) || null,
    supplier: {
      id: toId(supplier?.id) || null,
      name: toText(voucher.supplierName) || toText(supplier?.name) || null,
    },
    currency: toText(voucher.currency) || null,
    taxRule: {
      id: toId(taxRule?.id) || null,
      objectName: toText(taxRule?.objectName) || null,
    },
    taxType: toText(voucher.taxType) || null,
    document: {
      id: toId(document?.id) || null,
      objectName: toText(document?.objectName) || null,
    },
    totals: {
      net: toNumber(voucher.sumNet),
      tax: toNumber(voucher.sumTax),
      gross,
      paidAmount,
      openAmount,
    },
    positions: positions.map((position) => ({
      id: toId(position.id) || null,
      accountDatev: summarizeAccountRef(position.accountDatev),
      accountingType: summarizeAccountRef(position.accountingType),
      taxRate: toNumber(position.taxRate),
      net: typeof position.net === "boolean" ? position.net : null,
      sumNet: toNumber(position.sumNet),
      sumGross: toNumber(position.sumGross),
      comment: toText(position.comment) || null,
      isAsset: position.isAsset === true,
    })),
  };
}

export function buildBookExistingVoucherPlan(options: {
  voucher: Record<string, unknown>;
  transaction: Record<string, unknown>;
  amount?: number;
  date?: string;
  type: string;
  createFeed?: boolean;
}): ExistingVoucherBookingPlan {
  const voucherAmount = toNumber(options.voucher.sumGross);
  const transactionAmount = toNumber(options.transaction.amount);
  const resolvedAmount =
    typeof options.amount === "number"
      ? options.amount
      : voucherAmount ?? (transactionAmount !== null ? Math.abs(transactionAmount) : null);
  const valueDate = toText(options.transaction.valueDate) || null;
  const checkAccountId = toId(asRecord(options.transaction.checkAccount)?.id) || null;
  const warnings: string[] = [];

  if (resolvedAmount === null || resolvedAmount <= 0) {
    warnings.push("Unable to derive a positive booking amount from voucher or transaction.");
  }

  if (!checkAccountId) {
    warnings.push("Transaction has no checkAccount.id; booking payload cannot be built.");
  }

  if (voucherAmount !== null && transactionAmount !== null) {
    const delta = Math.abs(voucherAmount - Math.abs(transactionAmount));
    if (delta > 0.01) {
      warnings.push(
        `Voucher gross (${voucherAmount.toFixed(2)}) and transaction amount (${Math.abs(transactionAmount).toFixed(2)}) differ by ${delta.toFixed(2)}.`
      );
    }
  }

  if (toText(options.voucher.status) === "1000") {
    warnings.push("Voucher already appears paid/booked (status=1000).");
  }

  const payload =
    resolvedAmount !== null && resolvedAmount > 0 && checkAccountId
      ? buildBookVoucherPayload({
          amount: resolvedAmount,
          date: options.date || valueDate || formatDateISO(new Date()),
          type: options.type,
          checkAccountId,
          transactionId: toId(options.transaction.id),
          createFeed: options.createFeed,
        })
      : null;

  return {
    payload,
    voucher: {
      id: toId(options.voucher.id),
      status: toText(options.voucher.status) || null,
      sumGross: voucherAmount,
      paidAmount: toNumber(options.voucher.paidAmount),
    },
    transaction: {
      id: toId(options.transaction.id),
      status: toText(options.transaction.status) || null,
      amount: transactionAmount,
      valueDate,
      payeePayerName: toText(options.transaction.payeePayerName) || null,
      checkAccountId,
    },
    warnings,
  };
}

export function extractTransactionObjects(data: unknown): Record<string, unknown>[] {
  const root = asRecord(data);
  if (!root) {
    return [];
  }

  return asArray(root.objects)
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

export function buildTransactionMatchCriteriaFromVoucher(
  voucher: Record<string, unknown>,
  windowDays: number
): TransactionMatchCriteria {
  const supplier = asRecord(voucher.supplier);
  return {
    amount: toNumber(voucher.sumGross),
    counterpart: toText(voucher.supplierName) || toText(supplier?.name),
    purpose: toText(voucher.description),
    voucherDate: toText(voucher.voucherDate),
    windowDays,
  };
}

export function buildTransactionDateRange(
  baseDate: string,
  windowDays: number
): { startDate: string; endDate: string } | null {
  const date = parseDateLike(baseDate);
  if (!date) {
    return null;
  }

  const start = new Date(date.getTime());
  start.setDate(start.getDate() - Math.max(windowDays, 0));
  const end = new Date(date.getTime());
  end.setDate(end.getDate() + Math.max(windowDays, 0));

  return {
    startDate: formatDateISO(start),
    endDate: formatDateISO(end),
  };
}

export function matchTransactions(
  transactions: Record<string, unknown>[],
  criteria: TransactionMatchCriteria,
  limit: number
): TransactionCandidate[] {
  const normalizedLimit = Math.max(1, limit);
  const voucherDate = parseDateLike(criteria.voucherDate);
  const windowDays = Math.max(criteria.windowDays ?? 30, 0);

  const candidates = transactions
    .map((transaction) => {
      const payeePayerName = toText(transaction.payeePayerName);
      const paymtPurpose = toText(transaction.paymtPurpose);
      const amount = toNumber(transaction.amount);
      const valueDate = toText(transaction.valueDate);
      const date = parseDateLike(valueDate);
      const reasons: string[] = [];
      let score = 0;

      const terms = [criteria.term, criteria.counterpart, criteria.purpose]
        .map((value) => toText(value))
        .filter(Boolean);
      for (const term of terms) {
        const fieldScore = Math.max(
          scoreField(payeePayerName, term),
          scoreField(paymtPurpose, term)
        );
        if (fieldScore > 0) {
          score += fieldScore;
          reasons.push(`text:${term}`);
        }
      }

      if (criteria.amount !== null && criteria.amount !== undefined && amount !== null) {
        const delta = Math.abs(amount - criteria.amount);
        if (delta <= 0.01) {
          score += 900;
          reasons.push("amount:exact");
        } else if (delta <= 1) {
          score += 350;
          reasons.push("amount:near");
        } else if (delta <= 5) {
          score += 120;
          reasons.push("amount:loose");
        }
      }

      if (voucherDate && date) {
        const diffDays = Math.abs(date.getTime() - voucherDate.getTime()) / 86_400_000;
        if (diffDays <= 0.5) {
          score += 300;
          reasons.push("date:same-day");
        } else if (diffDays <= 3) {
          score += 180;
          reasons.push("date:near");
        } else if (diffDays <= 7) {
          score += 90;
          reasons.push("date:week");
        } else if (diffDays <= windowDays) {
          score += 30;
          reasons.push("date:window");
        }
      }

      if (score <= 0) {
        return null;
      }

      return {
        id: toId(transaction.id),
        score,
        reasons,
        amount,
        valueDate: valueDate || null,
        payeePayerName: payeePayerName || null,
        paymtPurpose: paymtPurpose || null,
        status: toText(transaction.status) || null,
        checkAccountId: toId(asRecord(transaction.checkAccount)?.id) || null,
      } satisfies TransactionCandidate;
    })
    .filter((candidate): candidate is TransactionCandidate => candidate !== null)
    .sort((left, right) => right.score - left.score)
    .slice(0, normalizedLimit);

  return candidates;
}

export function buildBookVoucherPayload(options: {
  amount: number;
  date: string;
  type: string;
  checkAccountId: string;
  transactionId?: string;
  createFeed?: boolean;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    amount: options.amount,
    date: options.date,
    type: options.type,
    checkAccount: {
      id: options.checkAccountId,
      objectName: "CheckAccount",
    },
  };

  if (options.transactionId) {
    payload.checkAccountTransaction = {
      id: options.transactionId,
      objectName: "CheckAccountTransaction",
    };
  }

  if (typeof options.createFeed === "boolean") {
    payload.createFeed = options.createFeed;
  }

  return payload;
}
