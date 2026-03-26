#!/usr/bin/env node

import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";

import { getCatalog, getOperation, listOperations } from "./lib/catalog";
import { SevdeskClient } from "./lib/client";
import { loadConfig } from "./lib/config";
import {
  buildContextSnapshot,
  writeContextSnapshot,
  DEFAULT_CONTEXT_OPERATION_IDS,
} from "./lib/context";
import { assertWriteAllowed } from "./lib/guards";
import { parseKeyValuePairs, readJsonFile, toPrettyJson } from "./lib/kv";
import { resolvePathTemplate } from "./lib/path";
import {
  applySafePdfQueryDefaults,
  decodePdfToFile,
  extractBase64PdfContent,
  redactPdfContent,
  shouldAutoProtectPdf,
} from "./lib/pdf";
import { validateWritePreflight } from "./lib/preflight";
import {
  getOperationQuirk,
  listOperationQuirkEntries,
  listOperationQuirks,
  normalizeReadData,
  validateRuntimeReadQuery,
} from "./lib/quirks";
import {
  extractContactsFromListResponse,
  findContacts,
} from "./lib/find-contact";
import {
  runWriteVerification,
  verifyAndMaybeFixCreateContact,
} from "./lib/verify";
import { deriveRemediationHints } from "./lib/remediation";
import {
  renderInvoiceEditWorkflowText,
  renderInvoiceFinalizeWorkflowText,
  renderReadOperationsMarkdown,
  renderReadUsageText,
} from "./lib/docs";
import {
  buildClonedInvoicePayload,
  buildInstallmentInvoicePayload,
  extractObjectArray,
  extractPrimaryObject,
  parsePositionPriceOverrides,
  shiftDateByPeriod,
  todayISO,
} from "./lib/invoice-workflows";
import {
  buildBookVoucherPayload,
  buildTransactionDateRange,
  buildTransactionMatchCriteriaFromVoucher,
  buildVoucherPayloadFromArgs,
  buildVoucherPayloadFromTemplate,
  extractTransactionObjects,
  extractUploadedFilename,
  matchTransactions,
} from "./lib/voucher-workflows";
import type { SevdeskResponse } from "./lib/types";

function fail(message: string): never {
  throw new Error(message);
}

function getOperationOrFail(operationId: string) {
  try {
    return getOperation(operationId);
  } catch (error) {
    if (operationId === "updateInvoice") {
      fail(
        "Unknown operationId: updateInvoice. sevdesk has no generic invoice update route in this API catalog. Use `sevdesk-agent docs invoice-edit` for the recommended workflow."
      );
    }
    throw error;
  }
}

async function printResponse(
  response: SevdeskResponse,
  outputMode: "pretty" | "json" | "raw",
  savePath?: string,
  extras: Record<string, unknown> = {}
): Promise<void> {
  const payload = {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    data: response.data,
    ...extras,
  };

  if (savePath) {
    await writeFile(savePath, toPrettyJson(payload), "utf8");
  }

  if (outputMode === "json") {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  if (outputMode === "raw") {
    if (typeof response.data === "string") {
      process.stdout.write(`${response.data}\n`);
      return;
    }
    process.stdout.write(`${JSON.stringify(response.data)}\n`);
    return;
  }

  process.stdout.write(`${toPrettyJson(payload)}\n`);
}

function scoreField(candidate: string, term: string): number {
  if (!candidate) {
    return 0;
  }
  if (candidate === term) {
    return 1000;
  }
  if (candidate.startsWith(term)) {
    return 700;
  }
  if (candidate.includes(term)) {
    return 300;
  }
  return 0;
}

async function runFindContactByTerm(options: {
  term: string;
  limit: number;
  output: "pretty" | "json";
  xVersion?: string;
}): Promise<void> {
  const config = loadConfig({ xVersion: options.xVersion });
  const client = new SevdeskClient(config);
  const response = await client.request({
    method: "GET",
    path: "/Contact",
    query: { depth: "1" },
  });

  const contacts = extractContactsFromListResponse(response.data);
  const matches = findContacts(contacts, options.term, options.limit);

  const payload = {
    ok: response.ok,
    status: response.status,
    term: options.term,
    matchCount: matches.length,
    matches: matches.map((match) => ({
      score: match.score,
      id: match.id,
      displayName: match.displayName,
      customerNumber: match.customerNumber,
    })),
  };

  if (options.output === "json") {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  if (matches.length === 0) {
    process.stdout.write(`No contacts matched "${options.term}".\n`);
    return;
  }

  const lines = matches.map(
    (match) =>
      `${match.score}\t${match.id}\t${match.displayName}\t${match.customerNumber || "-"}`
  );
  process.stdout.write(
    `${`score\tid\tdisplayName\tcustomerNumber`}\n${lines.join("\n")}\n`
  );
}

async function runResolveBillingContactByTerm(options: {
  term: string;
  limit: number;
  output: "pretty" | "json";
  xVersion?: string;
}): Promise<void> {
  const config = loadConfig({ xVersion: options.xVersion });
  const client = new SevdeskClient(config);
  const contactsResponse = await client.request({
    method: "GET",
    path: "/Contact",
    query: { depth: "1" },
  });
  const contacts = extractContactsFromListResponse(contactsResponse.data);
  const matches = findContacts(contacts, options.term, options.limit);
  if (matches.length === 0) {
    if (options.output === "json") {
      process.stdout.write(
        `${JSON.stringify({
          ok: true,
          term: options.term,
          recommendation: null,
          matches: [],
        })}\n`
      );
    } else {
      process.stdout.write(`No contacts matched "${options.term}".\n`);
    }
    return;
  }

  const top = matches[0];
  const topContact = top.contact as Record<string, unknown>;
  const parent = (topContact.parent ?? null) as Record<string, unknown> | null;
  const parentId = parent ? String(parent.id ?? "").trim() : "";
  const hasPersonFields =
    String(topContact.surename ?? "").trim() !== "" ||
    String(topContact.familyname ?? "").trim() !== "";

  const recommendedContactId = top.id;
  const recommendedReason = hasPersonFields
    ? "Top match is a person; using person contact as billing recipient."
    : "Top match is a company; using company contact as billing recipient.";

  const addressResponse = await client.request({
    method: "GET",
    path: "/ContactAddress",
    query: {
      "contact[id]": recommendedContactId,
      "contact[objectName]": "Contact",
    },
  });
  let addressPreview = "";
  const ownAddresses = extractObjectArray(addressResponse.data);
  if (ownAddresses.length > 0) {
    addressPreview = buildAddressPreview(ownAddresses[0]);
  }

  if (!addressPreview && parentId) {
    const parentAddressResponse = await client.request({
      method: "GET",
      path: "/ContactAddress",
      query: {
        "contact[id]": parentId,
        "contact[objectName]": "Contact",
      },
    });
    const parentAddresses = extractObjectArray(parentAddressResponse.data);
    if (parentAddresses.length > 0) {
      addressPreview = buildAddressPreview(parentAddresses[0]);
    }
  }

  const payload = {
    ok: true,
    term: options.term,
    recommendation: {
      contact: {
        id: recommendedContactId,
        objectName: "Contact",
      },
      reason: recommendedReason,
      parentId: parentId || null,
      addressPreview: addressPreview || null,
    },
    candidates: matches.map((match) => ({
      score: match.score,
      id: match.id,
      displayName: match.displayName,
      customerNumber: match.customerNumber || null,
    })),
  };

  if (options.output === "json") {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  process.stdout.write(`Recommended contact.id: ${recommendedContactId}\n`);
  process.stdout.write(`Reason: ${recommendedReason}\n`);
  if (addressPreview) {
    process.stdout.write(`Address preview: ${addressPreview}\n`);
  }
  process.stdout.write(`Candidates:\n`);
  for (const candidate of payload.candidates) {
    process.stdout.write(
      `- ${candidate.score}\t${candidate.id}\t${candidate.displayName}\t${candidate.customerNumber ?? "-"}\n`
    );
  }
}

function parseBooleanLike(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  throw new Error(`Invalid boolean value: ${value}`);
}

function parseIntegerOrFail(raw: string, label: string, min = 1): number {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < min) {
    fail(`${label} must be an integer >= ${min}.`);
  }
  return parsed;
}

function parseNumberOrFail(raw: string, label: string, min?: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    fail(`${label} must be a valid number.`);
  }
  if (min !== undefined && parsed < min) {
    fail(`${label} must be >= ${min}.`);
  }
  return parsed;
}

async function ensureReadableFile(filePath: string): Promise<string> {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  await access(resolvedPath);
  return resolvedPath;
}

function emitPreflightDiagnostics(operationId: string, warnings: string[], autoFixes?: string[]) {
  if (warnings.length > 0) {
    process.stderr.write(
      `${warnings
        .map((warning) => `[sevdesk-agent] preflight warning (${operationId}): ${warning}`)
        .join("\n")}\n`
    );
  }
  if (autoFixes && autoFixes.length > 0) {
    process.stderr.write(
      `[sevdesk-agent] preflight auto-fixes (${operationId}): ${autoFixes.join(", ")}\n`
    );
  }
}

async function fetchTransactions(options: {
  client: SevdeskClient;
  baseQuery: Record<string, string>;
  maxTransactions: number;
}): Promise<Record<string, unknown>[]> {
  const transactions: Record<string, unknown>[] = [];
  let offset = 0;
  const pageSize = Math.min(100, options.maxTransactions);

  while (transactions.length < options.maxTransactions) {
    const response = await options.client.request({
      method: "GET",
      path: "/CheckAccountTransaction",
      query: {
        ...options.baseQuery,
        limit: String(Math.min(pageSize, options.maxTransactions - transactions.length)),
        offset: String(offset),
      },
    });
    const chunk = extractTransactionObjects(response.data);
    if (chunk.length === 0) {
      break;
    }
    transactions.push(...chunk);
    offset += chunk.length;
    if (chunk.length < pageSize) {
      break;
    }
  }

  return transactions;
}

async function runFindInvoiceByTerm(options: {
  term: string;
  limit: number;
  maxInvoices: number;
  deepScan: boolean;
  output: "pretty" | "json";
  xVersion?: string;
}): Promise<void> {
  const searchTerm = options.term.trim().toLowerCase();
  if (!searchTerm) {
    fail("Search term must not be empty.");
  }

  const config = loadConfig({ xVersion: options.xVersion });
  const client = new SevdeskClient(config);

  const invoices: Record<string, unknown>[] = [];
  let offset = 0;
  const pageSize = Math.min(100, options.maxInvoices);
  while (invoices.length < options.maxInvoices) {
    const response = await client.request({
      method: "GET",
      path: "/Invoice",
      query: {
        limit: String(Math.min(pageSize, options.maxInvoices - invoices.length)),
        offset: String(offset),
      },
    });
    const chunk = extractObjectArray(response.data);
    if (chunk.length === 0) {
      break;
    }
    invoices.push(...chunk);
    offset += chunk.length;
    if (chunk.length < pageSize) {
      break;
    }
  }

  const matches: Array<Record<string, unknown>> = [];
  for (const invoice of invoices) {
    const invoiceId = String(invoice.id ?? "").trim();
    if (!invoiceId) {
      continue;
    }

    const fields = {
      invoiceNumber: String(invoice.invoiceNumber ?? "").toLowerCase(),
      header: String(invoice.header ?? "").toLowerCase(),
      address: String(invoice.address ?? "").toLowerCase(),
      customerInternalNote: String(invoice.customerInternalNote ?? "").toLowerCase(),
    };

    const matchedFields = Object.entries(fields)
      .filter(([, value]) => value.includes(searchTerm))
      .map(([key]) => key);
    let score = Math.max(
      ...Object.values(fields).map((value) => scoreField(value, searchTerm)),
      0
    );

    const matchedPositions: string[] = [];
    if (options.deepScan) {
      const posResponse = await client.request({
        method: "GET",
        path: `/Invoice/${invoiceId}/getPositions`,
      });
      const positions = extractObjectArray(posResponse.data);
      for (const pos of positions) {
        const name = String(pos.name ?? "").toLowerCase();
        const text = String(pos.text ?? "").toLowerCase();
        const positionScore = Math.max(
          scoreField(name, searchTerm),
          scoreField(text, searchTerm)
        );
        if (positionScore > 0) {
          score = Math.max(score, positionScore + 50);
          matchedPositions.push(
            `${String(pos.name ?? "").trim()}${String(pos.text ?? "").trim() ? ` | ${String(pos.text ?? "").trim()}` : ""}`
          );
        }
      }
    }

    if (score === 0) {
      continue;
    }

    matches.push({
      score,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber ?? null,
      header: invoice.header ?? null,
      status: invoice.status ?? null,
      matchedFields,
      matchedPositions,
    });
  }

  matches.sort((a, b) => Number(b.score) - Number(a.score));
  const sliced = matches.slice(0, options.limit);
  const payload = {
    ok: true,
    term: options.term,
    scannedInvoices: invoices.length,
    matchCount: sliced.length,
    matches: sliced,
  };

  if (options.output === "json") {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  if (sliced.length === 0) {
    process.stdout.write(
      `No invoice matched "${options.term}" (scanned=${invoices.length}).\n`
    );
    return;
  }

  process.stdout.write(
    `score\tinvoiceId\tinvoiceNumber\theader\tstatus\tmatchedFields\tmatchedPositions\n`
  );
  for (const row of sliced) {
    process.stdout.write(
      `${row.score}\t${row.invoiceId}\t${row.invoiceNumber ?? "-"}\t${row.header ?? "-"}\t${row.status ?? "-"}\t${(row.matchedFields as string[]).join(",") || "-"}\t${(row.matchedPositions as string[]).length}\n`
    );
  }
}

async function runFindTransactionByFilters(options: {
  term?: string;
  amount?: number | null;
  dateFrom?: string;
  dateTo?: string;
  booked?: boolean | null;
  checkAccountId?: string;
  creditOnly: boolean;
  debitOnly: boolean;
  limit: number;
  maxTransactions: number;
  output: "pretty" | "json";
  xVersion?: string;
}): Promise<void> {
  const config = loadConfig({ xVersion: options.xVersion });
  const client = new SevdeskClient(config);
  const baseQuery: Record<string, string> = {};

  if (options.dateFrom) {
    baseQuery.startDate = options.dateFrom;
  }
  if (options.dateTo) {
    baseQuery.endDate = options.dateTo;
  }
  if (options.booked !== null && options.booked !== undefined) {
    baseQuery.isBooked = options.booked ? "1" : "0";
  }
  if (options.checkAccountId) {
    baseQuery["checkAccount[id]"] = options.checkAccountId;
    baseQuery["checkAccount[objectName]"] = "CheckAccount";
  }
  if (options.creditOnly) {
    baseQuery.onlyCredit = "1";
  }
  if (options.debitOnly) {
    baseQuery.onlyDebit = "1";
  }

  const transactions = await fetchTransactions({
    client,
    baseQuery,
    maxTransactions: options.maxTransactions,
  });

  const scored =
    (options.term && options.term.trim()) || options.amount !== null && options.amount !== undefined
      ? matchTransactions(
          transactions,
          {
            term: options.term,
            amount: options.amount,
          },
          options.limit
        )
      : transactions.slice(0, options.limit).map((transaction) => ({
          id: String(transaction.id ?? "").trim(),
          score: 0,
          reasons: [],
          amount:
            typeof transaction.amount === "number" || typeof transaction.amount === "string"
              ? Number(transaction.amount)
              : null,
          valueDate: String(transaction.valueDate ?? "").trim() || null,
          payeePayerName: String(transaction.payeePayerName ?? "").trim() || null,
          paymtPurpose: String(transaction.paymtPurpose ?? "").trim() || null,
          status: String(transaction.status ?? "").trim() || null,
          checkAccountId:
            String(
              (transaction.checkAccount as Record<string, unknown> | undefined)?.id ?? ""
            ).trim() || null,
        }));

  const payload = {
    ok: true,
    scannedTransactions: transactions.length,
    matchCount: scored.length,
    matches: scored,
  };

  if (options.output === "json") {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  if (scored.length === 0) {
    process.stdout.write(
      `No transactions matched the current filters (scanned=${transactions.length}).\n`
    );
    return;
  }

  process.stdout.write(
    "score\ttransactionId\tvalueDate\tamount\tpayeePayerName\tpurpose\tstatus\tcheckAccountId\n"
  );
  for (const match of scored) {
    process.stdout.write(
      `${match.score}\t${match.id}\t${match.valueDate ?? "-"}\t${match.amount ?? "-"}\t${match.payeePayerName ?? "-"}\t${match.paymtPurpose ?? "-"}\t${match.status ?? "-"}\t${match.checkAccountId ?? "-"}\n`
    );
  }
}

async function runMatchTransactionByVoucher(options: {
  voucherId: string;
  limit: number;
  windowDays: number;
  includeBooked: boolean;
  checkAccountId?: string;
  output: "pretty" | "json";
  xVersion?: string;
}): Promise<void> {
  const config = loadConfig({ xVersion: options.xVersion });
  const client = new SevdeskClient(config);
  const voucherResponse = await client.request({
    method: "GET",
    path: `/Voucher/${options.voucherId}`,
  });
  const voucher = extractPrimaryObject(voucherResponse.data);
  if (!voucher) {
    fail(`Voucher ${options.voucherId} not found or has unexpected response shape.`);
  }

  const criteria = buildTransactionMatchCriteriaFromVoucher(voucher, options.windowDays);
  const dateRange = criteria.voucherDate
    ? buildTransactionDateRange(criteria.voucherDate, options.windowDays)
    : null;

  const baseQuery: Record<string, string> = {};
  if (!options.includeBooked) {
    baseQuery.isBooked = "0";
  }
  if (options.checkAccountId) {
    baseQuery["checkAccount[id]"] = options.checkAccountId;
    baseQuery["checkAccount[objectName]"] = "CheckAccount";
  }
  if (dateRange) {
    baseQuery.startDate = dateRange.startDate;
    baseQuery.endDate = dateRange.endDate;
  }

  const transactions = await fetchTransactions({
    client,
    baseQuery,
    maxTransactions: 200,
  });
  const matches = matchTransactions(transactions, criteria, options.limit);
  const top = matches[0] ?? null;

  const suggestedBookCommand =
    top &&
    top.checkAccountId &&
    typeof criteria.amount === "number"
      ? `sevdesk-agent book-voucher --voucher-id ${options.voucherId} --check-account-id ${top.checkAccountId} --transaction-id ${top.id} --amount ${criteria.amount.toFixed(2)} --date ${top.valueDate ?? todayISO()} --execute --verify`
      : null;

  const payload = {
    ok: true,
    voucher: {
      id: String(voucher.id ?? options.voucherId),
      voucherDate: String(voucher.voucherDate ?? "").trim() || null,
      amount: criteria.amount,
      supplierName:
        String(voucher.supplierName ?? "").trim() ||
        String(
          (voucher.supplier as Record<string, unknown> | undefined)?.name ?? ""
        ).trim() ||
        null,
      description: String(voucher.description ?? "").trim() || null,
    },
    scannedTransactions: transactions.length,
    matchCount: matches.length,
    matches,
    suggestedBookCommand,
  };

  if (options.output === "json") {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  if (matches.length === 0) {
    process.stdout.write(
      `No transaction candidate matched voucher ${options.voucherId} (scanned=${transactions.length}).\n`
    );
    return;
  }

  process.stdout.write(
    "score\ttransactionId\tvalueDate\tamount\tpayeePayerName\tpurpose\treasons\tcheckAccountId\n"
  );
  for (const match of matches) {
    process.stdout.write(
      `${match.score}\t${match.id}\t${match.valueDate ?? "-"}\t${match.amount ?? "-"}\t${match.payeePayerName ?? "-"}\t${match.paymtPurpose ?? "-"}\t${match.reasons.join(",") || "-"}\t${match.checkAccountId ?? "-"}\n`
    );
  }
  if (suggestedBookCommand) {
    process.stdout.write(`Suggested book command:\n${suggestedBookCommand}\n`);
  }
}

function buildAddressPreview(address: Record<string, unknown> | null): string {
  if (!address) {
    return "";
  }

  const parts = [
    String(address.name ?? "").trim(),
    String(address.street ?? "").trim(),
    [
      String(address.zip ?? "").trim(),
      String(address.city ?? "").trim(),
    ]
      .filter(Boolean)
      .join(" "),
    String(address.country ?? "").trim(),
  ].filter(Boolean);

  return parts.join(", ");
}

function buildVoucherPayloadForPdfWorkflow(options: {
  filePath: string;
  filename: string;
  templateBody?: unknown;
  supplierId?: string;
  supplierName?: string;
  description?: string;
  voucherDate?: string;
  deliveryDate?: string;
  currency?: string;
  status?: number;
  creditDebit?: string;
  voucherType?: string;
  taxType?: string;
  taxRuleId?: string;
  taxRate?: number;
  amount?: number;
  net: boolean;
  accountDatevId?: string;
  accountingTypeId?: string;
  comment?: string;
  isAsset: boolean;
}): Record<string, unknown> {
  if (options.templateBody) {
    return buildVoucherPayloadFromTemplate(options.templateBody, options.filename);
  }

  if (!options.voucherDate) {
    fail("create-voucher-from-pdf: --voucher-date is required in simple mode.");
  }
  if (options.amount === undefined) {
    fail("create-voucher-from-pdf: --amount is required in simple mode.");
  }
  if (!options.taxType) {
    fail("create-voucher-from-pdf: --tax-type is required in simple mode.");
  }
  if (!options.taxRuleId) {
    fail("create-voucher-from-pdf: --tax-rule-id is required in simple mode.");
  }
  if (options.taxRate === undefined) {
    fail("create-voucher-from-pdf: --tax-rate is required in simple mode.");
  }
  if (!options.accountDatevId) {
    fail("create-voucher-from-pdf: --account-datev-id is required in simple mode.");
  }
  if (!options.accountingTypeId) {
    fail(
      "create-voucher-from-pdf: --accounting-type-id is required in simple mode."
    );
  }
  if (!options.supplierId && !options.supplierName) {
    fail(
      "create-voucher-from-pdf: provide either --supplier-id or --supplier-name in simple mode."
    );
  }

  return buildVoucherPayloadFromArgs({
    supplierId: options.supplierId,
    supplierName: options.supplierName,
    description: options.description || path.basename(options.filePath),
    voucherDate: options.voucherDate,
    deliveryDate: options.deliveryDate ?? options.voucherDate,
    currency: options.currency,
    status: options.status,
    creditDebit: options.creditDebit ?? "D",
    voucherType: options.voucherType,
    taxType: options.taxType,
    taxRuleId: options.taxRuleId,
    taxRate: options.taxRate,
    amount: options.amount,
    net: options.net,
    accountDatevId: options.accountDatevId,
    accountingTypeId: options.accountingTypeId,
    filename: options.filename,
    comment: options.comment,
    isAsset: options.isAsset,
  });
}

async function executeBookVoucherWorkflow(options: {
  client: SevdeskClient;
  voucherId: string;
  payload: unknown;
  verify: boolean;
  output: "pretty" | "json" | "raw";
  mode: "book" | "assign-and-book";
}): Promise<void> {
  const preflight = validateWritePreflight("bookVoucher", options.payload);
  if (preflight.errors.length > 0) {
    fail(
      [
        "Preflight validation failed for bookVoucher:",
        ...preflight.errors.map((error) => `- ${error}`),
      ].join("\n")
    );
  }
  emitPreflightDiagnostics("bookVoucher", preflight.warnings, preflight.autoFixes);

  const response = await options.client.request({
    method: "PUT",
    path: `/Voucher/${options.voucherId}/bookAmount`,
    body: options.payload,
  });

  const extras: Record<string, unknown> = {
    workflowMode: options.mode,
  };
  if (!response.ok) {
    const hints = deriveRemediationHints({
      operationId: "bookVoucher",
      status: response.status,
      data: response.data,
    });
    if (hints.length > 0) {
      extras.remediationHints = hints;
    }
  }

  if (options.verify) {
    try {
      const verification = await runWriteVerification({
        operationId: "bookVoucher",
        client: options.client,
        body: options.payload,
        writeResponse: response,
      });
      extras.verification =
        verification ??
        ({
          skipped: true,
          reason: "No built-in verification for bookVoucher",
        } as Record<string, unknown>);
    } catch (error) {
      extras.verification = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  await printResponse(response, options.output, undefined, extras);
}

async function executeCreateInvoiceFromPayload(options: {
  client: SevdeskClient;
  payload: unknown;
  verify: boolean;
  autoFixDeliveryDate: boolean;
  output: "pretty" | "json" | "raw";
}): Promise<void> {
  let payload = options.payload;
  const preflight = validateWritePreflight("createInvoiceByFactory", payload, {
    autoFixDeliveryDate: options.autoFixDeliveryDate,
  });
  if (preflight.errors.length > 0) {
    fail(
      [
        "Preflight validation failed for createInvoiceByFactory:",
        ...preflight.errors.map((error) => `- ${error}`),
      ].join("\n")
    );
  }
  if (preflight.warnings.length > 0) {
    process.stderr.write(
      `${preflight.warnings
        .map((warning) => `[sevdesk-agent] preflight warning: ${warning}`)
        .join("\n")}\n`
    );
  }
  if (preflight.normalizedBody !== undefined) {
    payload = preflight.normalizedBody;
  }

  const response = await options.client.request({
    method: "POST",
    path: "/Invoice/Factory/saveInvoice",
    body: payload,
  });

  const extras: Record<string, unknown> = {};
  if (!response.ok) {
    const hints = deriveRemediationHints({
      operationId: "createInvoiceByFactory",
      status: response.status,
      data: response.data,
    });
    if (hints.length > 0) {
      extras.remediationHints = hints;
    }
  }

  if (options.verify) {
    try {
      const verification = await runWriteVerification({
        operationId: "createInvoiceByFactory",
        client: options.client,
        body: payload,
        writeResponse: response,
      });
      extras.verification =
        verification ??
        ({
          skipped: true,
          reason: "No built-in verification for createInvoiceByFactory",
        } as Record<string, unknown>);
    } catch (error) {
      extras.verification = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  await printResponse(response, options.output, undefined, extras);
}

async function readInvoiceTemplate(options: {
  client: SevdeskClient;
  invoiceId: string;
}): Promise<{
  invoice: Record<string, unknown>;
  positions: Record<string, unknown>[];
}> {
  const invoiceResponse = await options.client.request({
    method: "GET",
    path: `/Invoice/${options.invoiceId}`,
  });
  const sourceInvoice = extractPrimaryObject(invoiceResponse.data);
  if (!sourceInvoice) {
    fail(`Invoice ${options.invoiceId} not found or has unexpected response shape.`);
  }

  const positionsResponse = await options.client.request({
    method: "GET",
    path: `/Invoice/${options.invoiceId}/getPositions`,
  });
  const sourcePositions = extractObjectArray(positionsResponse.data);
  if (sourcePositions.length === 0) {
    fail(`Invoice ${options.invoiceId} has no positions to clone/installment from.`);
  }

  return { invoice: sourceInvoice, positions: sourcePositions };
}

const program = new Command();

program
  .name("sevdesk-agent")
  .description("Agent-focused sevdesk CLI (TypeScript)")
  .version("0.1.7")
  .addHelpText(
    "after",
    [
      "",
      "Tips:",
      "- Discover ops: sevdesk-agent ops list --read-only",
      "- Inspect params: sevdesk-agent op-show <operationId>",
      "- Generate reference docs: sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md",
      "",
    ].join("\n")
  );

program
  .command("ops")
  .description("Operation catalog helpers")
  .command("list")
  .description("List known operations from the OpenAPI-derived catalog")
  .option("--method <method>", "Filter by HTTP method, e.g. GET")
  .option("--tag <tag>", "Filter by tag/domain, e.g. Invoice")
  .option("--read-only", "Only show GET operations", false)
  .option("--json", "Output as JSON", false)
  .action((opts) => {
    const items = listOperations({
      method: opts.method,
      tag: opts.tag,
      readOnly: opts.readOnly,
    });

    if (opts.json) {
      process.stdout.write(`${JSON.stringify(items)}\n`);
      return;
    }

    const lines = items.map(
      (entry) =>
        `${entry.operationId}\t${entry.method}\t${entry.path}\t${entry.tags.join(",")}`
    );

    process.stdout.write(`${lines.join("\n")}\n`);
  });

program
  .command("ops-quirks")
  .description("List runtime quirks learned from live API behavior")
  .option("--json", "Output as JSON", false)
  .option("--json-array", "Output as sorted array for stable parsing", false)
  .action((opts) => {
    if (opts.json && opts.jsonArray) {
      fail("Use either --json or --json-array, not both.");
    }

    const quirks = listOperationQuirks();
    const quirkEntries = listOperationQuirkEntries();

    if (opts.json) {
      process.stdout.write(`${JSON.stringify(quirks)}\n`);
      return;
    }

    if (opts.jsonArray) {
      process.stdout.write(`${JSON.stringify(quirkEntries)}\n`);
      return;
    }

    const lines = Object.entries(quirks).map(([operationId, quirk]) => {
      const parts = [];
      if (quirk.runtimeRequiredQuery?.length) {
        parts.push(`runtimeRequiredQuery=${quirk.runtimeRequiredQuery.join(",")}`);
      }
      if (quirk.unwrapObjects) {
        parts.push("unwrapObjects=true");
      }
      if (quirk.coerceObjectsArray) {
        parts.push("coerceObjectsArray=true");
      }
      if (quirk.coerceObjectsNumber) {
        parts.push("coerceObjectsNumber=true");
      }
      return `${operationId}\t${parts.join(" ")}\t${quirk.notes ?? ""}`;
    });

    process.stdout.write(`${lines.join("\n")}\n`);
  });

program
  .command("op-show <operationId>")
  .description("Show operation details")
  .action((operationId: string) => {
    const operation = getOperationOrFail(operationId);
    const quirk = getOperationQuirk(operationId) ?? null;
    process.stdout.write(`${toPrettyJson({ ...operation, runtimeQuirk: quirk })}\n`);
  });

async function runDoctor(opts: { json?: boolean; live?: boolean }): Promise<void> {
  const checks: Array<{ check: string; ok: boolean; detail: string }> = [];

  const catalogCount = getCatalog().length;
  checks.push({
    check: "catalog.count",
    ok: catalogCount > 0,
    detail: `operations=${catalogCount}`,
  });

  const criticalOps = [
    "getInvoices",
    "createInvoiceByFactory",
    "createOrder",
    "createContact",
  ];
  for (const op of criticalOps) {
    try {
      getOperation(op);
      checks.push({ check: `catalog.${op}`, ok: true, detail: "present" });
    } catch {
      checks.push({ check: `catalog.${op}`, ok: false, detail: "missing" });
    }
  }

  const quirkEntries = listOperationQuirkEntries();
  const sorted = [...quirkEntries.map((entry) => entry.operationId)].sort((a, b) =>
    a.localeCompare(b)
  );
  checks.push({
    check: "quirks.sorted-array",
    ok:
      quirkEntries.length === sorted.length &&
      quirkEntries.every((entry, index) => entry.operationId === sorted[index]),
    detail: `entries=${quirkEntries.length}`,
  });

  const tokenPresent = Boolean(process.env.SEVDESK_API_TOKEN);
  checks.push({
    check: "env.SEVDESK_API_TOKEN",
    ok: tokenPresent,
    detail: tokenPresent ? "present" : "missing",
  });

  if (opts.live) {
    if (!tokenPresent) {
      checks.push({
        check: "live.bookkeepingSystemVersion",
        ok: false,
        detail: "skipped (missing token)",
      });
    } else {
      try {
        const config = loadConfig();
        const client = new SevdeskClient(config);
        const response = await client.request({
          method: "GET",
          path: "/Tools/bookkeepingSystemVersion",
        });
        checks.push({
          check: "live.bookkeepingSystemVersion",
          ok: response.ok,
          detail: `status=${response.status}`,
        });
      } catch (error) {
        checks.push({
          check: "live.bookkeepingSystemVersion",
          ok: false,
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const payload = {
    ok: checks.every((entry) => entry.ok),
    checks,
    recommendations: [
      "Run `sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md` after behavior changes.",
      "Run `sevdesk-agent docs invoice-edit` and `sevdesk-agent docs invoice-finalize` for invoice workflow guidance.",
    ],
  };

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
  } else {
    process.stdout.write(`${toPrettyJson(payload)}\n`);
  }

  if (!payload.ok) {
    process.exitCode = 1;
  }
}

program
  .command("doctor")
  .description("Run local self-checks for catalog, quirks, env and optional live probe")
  .option("--json", "Output as JSON", false)
  .option("--live", "Include a live bookkeepingSystemVersion probe", false)
  .action(async (opts) => {
    await runDoctor({ json: Boolean(opts.json), live: Boolean(opts.live) });
  });

program
  .command("self-check")
  .description("Alias for doctor")
  .option("--json", "Output as JSON", false)
  .option("--live", "Include a live bookkeepingSystemVersion probe", false)
  .action(async (opts) => {
    await runDoctor({ json: Boolean(opts.json), live: Boolean(opts.live) });
  });

program
  .command("read <operationId>")
  .description("Execute a read-only (GET) operation by operationId")
  .option("--path <pair...>", "Path params as key=value")
  .option("--query <pair...>", "Query params as key=value")
  .option("--header <pair...>", "Additional headers as key=value")
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--normalize", "Apply known runtime response normalization", true)
  .option("--no-normalize", "Disable response normalization")
  .option(
    "--safe-pdf",
    "For orderGetPdf/invoiceGetPdf automatically apply preventSendBy=1 unless explicitly set",
    true
  )
  .option("--no-safe-pdf", "Disable automatic preventSendBy protection")
  .option(
    "--decode-pdf <file>",
    "For orderGetPdf/invoiceGetPdf: decode base64 PDF content and write directly to file"
  )
  .option(
    "--suppress-content",
    "With --decode-pdf: suppress base64 PDF content in CLI output",
    true
  )
  .option("--no-suppress-content", "Keep full base64 content in CLI output")
  .option("--output <mode>", "pretty|json|raw", "pretty")
  .option("--save <file>", "Save full response to file")
  .addHelpText(
    "after",
    [
      "",
      "Examples:",
      "  sevdesk-agent read bookkeepingSystemVersion --output json",
      "  sevdesk-agent read find-contact --query term='muster gmbh' --output json",
      "  sevdesk-agent read resolve-billing-contact --query term='muster gmbh' --output json",
      "  sevdesk-agent read find-invoice --query term='acf' --query deepScan=true --output json",
      "  sevdesk-agent read getInvoices --query startDate=1767225600 --query endDate=1769903999 --output json",
      "  sevdesk-agent read getInvoices --query 'contact[id]=123' --output json",
      "",
      "Tip: use `sevdesk-agent op-show <operationId>` for params and runtime quirks.",
      "",
    ].join("\n")
  )
  .action(async (operationId: string, opts) => {
    const pathParams = parseKeyValuePairs(opts.path ?? []);
    const queryParamsInput = parseKeyValuePairs(opts.query ?? []);
    const headerParams = parseKeyValuePairs(opts.header ?? []);

    if (operationId === "find-contact" || operationId === "findContact") {
      const term =
        queryParamsInput.term ??
        queryParamsInput.q ??
        queryParamsInput.search ??
        "";
      if (!term.trim()) {
        fail(
          "read find-contact requires a term. Example: sevdesk-agent read find-contact --query term='muster gmbh' --output json"
        );
      }

      const limitRaw = queryParamsInput.limit ?? "20";
      const limit = Number.parseInt(limitRaw, 10);
      if (!Number.isFinite(limit) || limit < 1) {
        fail("read find-contact: `limit` must be an integer >= 1.");
      }

      const outputMode: "pretty" | "json" =
        opts.output === "json" ? "json" : "pretty";
      await runFindContactByTerm({
        term,
        limit,
        output: outputMode,
        xVersion: opts.xVersion,
      });
      return;
    }

    if (
      operationId === "resolve-billing-contact" ||
      operationId === "resolveBillingContact"
    ) {
      const term =
        queryParamsInput.term ??
        queryParamsInput.q ??
        queryParamsInput.search ??
        "";
      if (!term.trim()) {
        fail(
          "read resolve-billing-contact requires a term. Example: sevdesk-agent read resolve-billing-contact --query term='muster gmbh' --output json"
        );
      }

      const limitRaw = queryParamsInput.limit ?? "10";
      const limit = Number.parseInt(limitRaw, 10);
      if (!Number.isFinite(limit) || limit < 1) {
        fail("read resolve-billing-contact: `limit` must be an integer >= 1.");
      }

      const outputMode: "pretty" | "json" =
        opts.output === "json" ? "json" : "pretty";
      await runResolveBillingContactByTerm({
        term,
        limit,
        output: outputMode,
        xVersion: opts.xVersion,
      });
      return;
    }

    if (
      operationId === "find-invoice" ||
      operationId === "search-invoices" ||
      operationId === "findInvoice" ||
      operationId === "searchInvoices"
    ) {
      const term =
        queryParamsInput.term ??
        queryParamsInput.q ??
        queryParamsInput.search ??
        "";
      if (!term.trim()) {
        fail(
          "read find-invoice requires a term. Example: sevdesk-agent read find-invoice --query term='acf' --output json"
        );
      }

      const limitRaw = queryParamsInput.limit ?? "20";
      const limit = Number.parseInt(limitRaw, 10);
      if (!Number.isFinite(limit) || limit < 1) {
        fail("read find-invoice: `limit` must be an integer >= 1.");
      }

      const maxInvoicesRaw = queryParamsInput.maxInvoices ?? "150";
      const maxInvoices = Number.parseInt(maxInvoicesRaw, 10);
      if (!Number.isFinite(maxInvoices) || maxInvoices < 1) {
        fail("read find-invoice: `maxInvoices` must be an integer >= 1.");
      }

      let deepScan = true;
      try {
        deepScan = parseBooleanLike(queryParamsInput.deepScan, true);
      } catch (error) {
        fail(`read find-invoice: ${(error as Error).message}`);
      }

      const outputMode: "pretty" | "json" =
        opts.output === "json" ? "json" : "pretty";
      await runFindInvoiceByTerm({
        term,
        limit,
        maxInvoices,
        deepScan,
        output: outputMode,
        xVersion: opts.xVersion,
      });
      return;
    }

    if (
      operationId === "find-transaction" ||
      operationId === "findTransaction"
    ) {
      const limit = parseIntegerOrFail(queryParamsInput.limit ?? "20", "read find-transaction: `limit`");
      const maxTransactions = parseIntegerOrFail(
        queryParamsInput.maxTransactions ?? "200",
        "read find-transaction: `maxTransactions`"
      );
      const amount =
        queryParamsInput.amount !== undefined
          ? parseNumberOrFail(queryParamsInput.amount, "read find-transaction: `amount`", 0)
          : null;
      const booked =
        queryParamsInput.booked !== undefined
          ? parseBooleanLike(queryParamsInput.booked, false)
          : null;
      const outputMode: "pretty" | "json" =
        opts.output === "json" ? "json" : "pretty";
      await runFindTransactionByFilters({
        term:
          queryParamsInput.term ??
          queryParamsInput.q ??
          queryParamsInput.search,
        amount,
        dateFrom: queryParamsInput.dateFrom,
        dateTo: queryParamsInput.dateTo,
        booked,
        checkAccountId: queryParamsInput.checkAccountId,
        creditOnly: parseBooleanLike(queryParamsInput.creditOnly, false),
        debitOnly: parseBooleanLike(queryParamsInput.debitOnly, false),
        limit,
        maxTransactions,
        output: outputMode,
        xVersion: opts.xVersion,
      });
      return;
    }

    if (
      operationId === "match-transaction" ||
      operationId === "matchTransaction"
    ) {
      const voucherId = queryParamsInput.voucherId ?? "";
      if (!voucherId.trim()) {
        fail(
          "read match-transaction requires `voucherId`. Example: sevdesk-agent read match-transaction --query voucherId=123 --output json"
        );
      }
      const limit = parseIntegerOrFail(
        queryParamsInput.limit ?? "10",
        "read match-transaction: `limit`"
      );
      const windowDays = parseIntegerOrFail(
        queryParamsInput.windowDays ?? "30",
        "read match-transaction: `windowDays`",
        0
      );
      const includeBooked = parseBooleanLike(queryParamsInput.includeBooked, false);
      const outputMode: "pretty" | "json" =
        opts.output === "json" ? "json" : "pretty";
      await runMatchTransactionByVoucher({
        voucherId,
        limit,
        windowDays,
        includeBooked,
        checkAccountId: queryParamsInput.checkAccountId,
        output: outputMode,
        xVersion: opts.xVersion,
      });
      return;
    }

    const operation = getOperationOrFail(operationId);
    if (operation.method !== "GET") {
      fail(`Operation ${operationId} is ${operation.method}, use write command instead.`);
    }

    if (opts.decodePdf && !shouldAutoProtectPdf(operationId)) {
      fail("--decode-pdf is currently supported only for orderGetPdf and invoiceGetPdf.");
    }

    const {
      query: queryParams,
      applied: safePdfApplied,
    } = applySafePdfQueryDefaults(
      operationId,
      queryParamsInput,
      Boolean(opts.safePdf)
    );
    const missingRuntimeQuery = validateRuntimeReadQuery(operationId, queryParams);
    if (missingRuntimeQuery.length > 0) {
      fail(
        `Missing runtime-required query params for ${operationId}: ${missingRuntimeQuery.join(
          ", "
        )}`
      );
    }

    const resolvedPath = resolvePathTemplate(operation.path, pathParams);
    const config = loadConfig({ xVersion: opts.xVersion });
    const client = new SevdeskClient(config);

    const response = await client.request({
      method: "GET",
      path: resolvedPath,
      query: queryParams,
      headers: headerParams,
    });

    const extras: Record<string, unknown> = {};
    if (safePdfApplied) {
      extras.safePdfApplied = true;
      extras.safePdfQuery = { preventSendBy: "1" };
    }

    if (!opts.normalize) {
      const responseForOutput =
        opts.decodePdf && opts.suppressContent
          ? { ...response, data: redactPdfContent(response.data) }
          : response;

      if (opts.decodePdf) {
        const base64Content = extractBase64PdfContent(response.data);
        if (!base64Content) {
          fail(
            "No base64 PDF content found in API response. Use --output json to inspect raw payload."
          );
        }
        extras.decodedPdfPath = await decodePdfToFile(opts.decodePdf, base64Content);
        if (opts.suppressContent) {
          extras.suppressedPdfContent = true;
        }
      }

      await printResponse(responseForOutput, opts.output, opts.save, extras);
      return;
    }

    const normalization = normalizeReadData(operationId, response.data);
    if (opts.decodePdf) {
      const base64Content =
        extractBase64PdfContent(normalization.normalizedData) ??
        extractBase64PdfContent(response.data);
      if (!base64Content) {
        fail(
          "No base64 PDF content found in API response. Use --output json to inspect raw payload."
        );
      }
      extras.decodedPdfPath = await decodePdfToFile(opts.decodePdf, base64Content);
      if (opts.suppressContent) {
        extras.suppressedPdfContent = true;
      }
    }

    const responseForOutput =
      opts.decodePdf && opts.suppressContent
        ? { ...response, data: redactPdfContent(response.data) }
        : response;
    const normalizedDataForOutput =
      opts.decodePdf && opts.suppressContent
        ? redactPdfContent(normalization.normalizedData)
        : normalization.normalizedData;

    await printResponse(responseForOutput, opts.output, opts.save, {
      ...extras,
      normalizedData: normalizedDataForOutput,
      normalizationWarnings: normalization.warnings,
      runtimeQuirk: getOperationQuirk(operationId) ?? null,
    });
  });

program
  .command("find-contact <term>")
  .description(
    "Find contacts by local scoring across name/name2/surename/familyname/customerNumber"
  )
  .option("--limit <n>", "Maximum matches", "20")
  .option("--output <mode>", "pretty|json", "pretty")
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .action(async (term: string, opts) => {
    const limit = Number.parseInt(String(opts.limit), 10);
    if (!Number.isFinite(limit) || limit < 1) {
      fail("--limit must be an integer >= 1.");
    }

    if (opts.output !== "pretty" && opts.output !== "json") {
      fail("--output must be either pretty or json.");
    }
    await runFindContactByTerm({
      term,
      limit,
      output: opts.output,
      xVersion: opts.xVersion,
    });
  });

program
  .command("resolve-billing-contact <term>")
  .description(
    "Resolve the most likely billing contact (company/person) and show address preview"
  )
  .option("--limit <n>", "Maximum matches to evaluate", "10")
  .option("--output <mode>", "pretty|json", "pretty")
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .action(async (term: string, opts) => {
    const limit = Number.parseInt(String(opts.limit), 10);
    if (!Number.isFinite(limit) || limit < 1) {
      fail("--limit must be an integer >= 1.");
    }
    if (opts.output !== "pretty" && opts.output !== "json") {
      fail("--output must be either pretty or json.");
    }

    await runResolveBillingContactByTerm({
      term,
      limit,
      output: opts.output,
      xVersion: opts.xVersion,
    });
  });

program
  .command("find-invoice <term>")
  .alias("search-invoices")
  .description(
    "Search invoices across header/address/notes and (optionally) position name/text"
  )
  .option("--limit <n>", "Maximum matches returned", "20")
  .option("--max-invoices <n>", "Maximum invoices scanned", "150")
  .option("--deep-scan", "Also scan invoice positions", true)
  .option("--no-deep-scan", "Skip scanning invoice positions")
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--output <mode>", "pretty|json", "pretty")
  .action(async (term: string, opts) => {
    const limit = Number.parseInt(String(opts.limit), 10);
    const maxInvoices = Number.parseInt(String(opts.maxInvoices), 10);
    if (!Number.isFinite(limit) || limit < 1) {
      fail("--limit must be an integer >= 1.");
    }
    if (!Number.isFinite(maxInvoices) || maxInvoices < 1) {
      fail("--max-invoices must be an integer >= 1.");
    }
    if (opts.output !== "pretty" && opts.output !== "json") {
      fail("--output must be either pretty or json.");
    }

    await runFindInvoiceByTerm({
      term,
      limit,
      maxInvoices,
      deepScan: Boolean(opts.deepScan),
      output: opts.output,
      xVersion: opts.xVersion,
    });
  });

program
  .command("find-transaction [term]")
  .description(
    "Search sevdesk transactions with server-side filters and optional local scoring"
  )
  .option("--amount <n>", "Preferred amount for local scoring")
  .option("--date-from <date>", "Server-side startDate filter")
  .option("--date-to <date>", "Server-side endDate filter")
  .option("--booked <bool>", "Filter booked/unbooked transactions (true|false)")
  .option("--check-account-id <id>", "Filter by sevdesk check account id")
  .option("--credit-only", "Only include credit transactions", false)
  .option("--debit-only", "Only include debit transactions", false)
  .option("--limit <n>", "Maximum matches returned", "20")
  .option("--max-transactions <n>", "Maximum transactions scanned", "200")
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--output <mode>", "pretty|json", "pretty")
  .action(async (term: string | undefined, opts) => {
    const limit = parseIntegerOrFail(String(opts.limit), "--limit");
    const maxTransactions = parseIntegerOrFail(
      String(opts.maxTransactions),
      "--max-transactions"
    );
    if (opts.output !== "pretty" && opts.output !== "json") {
      fail("--output must be either pretty or json.");
    }
    const amount =
      opts.amount !== undefined
        ? parseNumberOrFail(String(opts.amount), "--amount", 0)
        : null;
    const booked =
      opts.booked !== undefined
        ? parseBooleanLike(String(opts.booked), false)
        : null;

    await runFindTransactionByFilters({
      term: term?.trim() || undefined,
      amount,
      dateFrom: opts.dateFrom,
      dateTo: opts.dateTo,
      booked,
      checkAccountId: opts.checkAccountId,
      creditOnly: Boolean(opts.creditOnly),
      debitOnly: Boolean(opts.debitOnly),
      limit,
      maxTransactions,
      output: opts.output,
      xVersion: opts.xVersion,
    });
  });

program
  .command("match-transaction")
  .description(
    "Match unbooked sevdesk transactions to an existing voucher and suggest a booking command"
  )
  .requiredOption("--voucher-id <id>", "Sevdesk voucher id")
  .option("--limit <n>", "Maximum candidates returned", "10")
  .option("--window-days <n>", "Date search window around voucherDate", "30")
  .option("--include-booked", "Also scan already booked transactions", false)
  .option("--check-account-id <id>", "Optional sevdesk check account id filter")
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--output <mode>", "pretty|json", "pretty")
  .action(async (opts) => {
    const limit = parseIntegerOrFail(String(opts.limit), "--limit");
    const windowDays = parseIntegerOrFail(String(opts.windowDays), "--window-days", 0);
    if (opts.output !== "pretty" && opts.output !== "json") {
      fail("--output must be either pretty or json.");
    }

    await runMatchTransactionByVoucher({
      voucherId: String(opts.voucherId),
      limit,
      windowDays,
      includeBooked: Boolean(opts.includeBooked),
      checkAccountId: opts.checkAccountId,
      output: opts.output,
      xVersion: opts.xVersion,
    });
  });

program
  .command("create-voucher-from-pdf")
  .description(
    "Validate a local PDF, upload it to sevdesk and prepare/create a voucher (dry-run by default)"
  )
  .requiredOption("--file <path>", "Absolute or relative PDF path")
  .option("--body-file <file>", "JSON file with a saveVoucher payload template")
  .option("--supplier-id <id>", "Existing sevdesk supplier contact id")
  .option("--supplier-name <name>", "Supplier name when no contact id exists")
  .option("--description <text>", "Voucher description (defaults to filename)")
  .option("--voucher-date <date>", "Voucher date")
  .option("--delivery-date <date>", "Delivery date (defaults to voucher-date)")
  .option("--currency <code>", "Currency code", "EUR")
  .option("--status <status>", "Voucher status 50 or 100", "50")
  .option("--credit-debit <type>", "Voucher direction, usually D or C", "D")
  .option("--voucher-type <type>", "Voucher type, usually VOU", "VOU")
  .option("--tax-type <type>", "sevdesk taxType (e.g. default, ss)")
  .option("--tax-rule-id <id>", "sevdesk TaxRule id")
  .option("--tax-rate <n>", "Position tax rate")
  .option("--amount <n>", "Voucher amount for simple mode")
  .option("--net", "Interpret --amount as net amount", false)
  .option("--account-datev-id <id>", "Required in simple mode")
  .option("--accounting-type-id <id>", "Required in simple mode")
  .option("--comment <text>", "Optional voucher position comment")
  .option("--asset", "Mark voucher position as asset", false)
  .option("--execute", "Actually upload and create the voucher", false)
  .option("--verify", "Run post-write verification", false)
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--output <mode>", "pretty|json|raw", "pretty")
  .action(async (opts) => {
    if (opts.output !== "pretty" && opts.output !== "json" && opts.output !== "raw") {
      fail("--output must be pretty|json|raw.");
    }

    const absoluteFilePath = await ensureReadableFile(String(opts.file));
    const templateBody = opts.bodyFile ? await readJsonFile(String(opts.bodyFile)) : undefined;
    const filenamePlaceholder = "__uploaded_on_execute__.pdf";
    const payloadPreview = buildVoucherPayloadForPdfWorkflow({
      filePath: absoluteFilePath,
      filename: filenamePlaceholder,
      templateBody,
      supplierId: opts.supplierId,
      supplierName: opts.supplierName,
      description: opts.description,
      voucherDate: opts.voucherDate,
      deliveryDate: opts.deliveryDate,
      currency: opts.currency,
      status: parseIntegerOrFail(String(opts.status), "--status", 0),
      creditDebit: opts.creditDebit,
      voucherType: opts.voucherType,
      taxType: opts.taxType,
      taxRuleId: opts.taxRuleId,
      taxRate:
        opts.taxRate !== undefined
          ? parseNumberOrFail(String(opts.taxRate), "--tax-rate", 0)
          : undefined,
      amount:
        opts.amount !== undefined
          ? parseNumberOrFail(String(opts.amount), "--amount", 0)
          : undefined,
      net: Boolean(opts.net),
      accountDatevId: opts.accountDatevId,
      accountingTypeId: opts.accountingTypeId,
      comment: opts.comment,
      isAsset: Boolean(opts.asset),
    });

    const previewPreflight = validateWritePreflight(
      "voucherFactorySaveVoucher",
      payloadPreview
    );
    if (previewPreflight.errors.length > 0) {
      fail(
        [
          "Preflight validation failed for voucherFactorySaveVoucher:",
          ...previewPreflight.errors.map((error) => `- ${error}`),
        ].join("\n")
      );
    }
    emitPreflightDiagnostics(
      "voucherFactorySaveVoucher",
      previewPreflight.warnings,
      previewPreflight.autoFixes
    );

    if (!opts.execute) {
      process.stdout.write(
        `${toPrettyJson({
          dryRun: true,
          filePath: absoluteFilePath,
          upload: {
            skipped: true,
            filenamePlaceholder,
          },
          payload: payloadPreview,
        })}\n`
      );
      return;
    }

    const config = loadConfig({ xVersion: opts.xVersion });
    const client = new SevdeskClient(config);
    const uploadResponse = await client.request({
      method: "POST",
      path: "/Voucher/Factory/uploadTempFile",
      formData: {
        file: {
          filePath: absoluteFilePath,
        },
      },
    });

    if (!uploadResponse.ok) {
      const hints = deriveRemediationHints({
        operationId: "voucherUploadFile",
        status: uploadResponse.status,
        data: uploadResponse.data,
      });
      await printResponse(uploadResponse, opts.output, undefined, {
        workflowPhase: "upload",
        remediationHints: hints,
      });
      return;
    }

    const uploadedFilename = extractUploadedFilename(uploadResponse.data);
    if (!uploadedFilename) {
      fail(
        "Voucher upload succeeded but no sevdesk filename was returned. Inspect the raw upload response."
      );
    }

    const payload = buildVoucherPayloadForPdfWorkflow({
      filePath: absoluteFilePath,
      filename: uploadedFilename,
      templateBody,
      supplierId: opts.supplierId,
      supplierName: opts.supplierName,
      description: opts.description,
      voucherDate: opts.voucherDate,
      deliveryDate: opts.deliveryDate,
      currency: opts.currency,
      status: parseIntegerOrFail(String(opts.status), "--status", 0),
      creditDebit: opts.creditDebit,
      voucherType: opts.voucherType,
      taxType: opts.taxType,
      taxRuleId: opts.taxRuleId,
      taxRate:
        opts.taxRate !== undefined
          ? parseNumberOrFail(String(opts.taxRate), "--tax-rate", 0)
          : undefined,
      amount:
        opts.amount !== undefined
          ? parseNumberOrFail(String(opts.amount), "--amount", 0)
          : undefined,
      net: Boolean(opts.net),
      accountDatevId: opts.accountDatevId,
      accountingTypeId: opts.accountingTypeId,
      comment: opts.comment,
      isAsset: Boolean(opts.asset),
    });

    const preflight = validateWritePreflight("voucherFactorySaveVoucher", payload);
    if (preflight.errors.length > 0) {
      fail(
        [
          "Preflight validation failed for voucherFactorySaveVoucher:",
          ...preflight.errors.map((error) => `- ${error}`),
        ].join("\n")
      );
    }
    emitPreflightDiagnostics(
      "voucherFactorySaveVoucher",
      preflight.warnings,
      preflight.autoFixes
    );

    const response = await client.request({
      method: "POST",
      path: "/Voucher/Factory/saveVoucher",
      body: payload,
    });

    const extras: Record<string, unknown> = {
      upload: {
        status: uploadResponse.status,
        filename: uploadedFilename,
        filePath: absoluteFilePath,
      },
    };
    if (!response.ok) {
      const hints = deriveRemediationHints({
        operationId: "voucherFactorySaveVoucher",
        status: response.status,
        data: response.data,
      });
      if (hints.length > 0) {
        extras.remediationHints = hints;
      }
    }

    if (opts.verify) {
      try {
        const verification = await runWriteVerification({
          operationId: "voucherFactorySaveVoucher",
          client,
          body: payload,
          writeResponse: response,
        });
        extras.verification =
          verification ??
          ({
            skipped: true,
            reason: "No built-in verification for voucherFactorySaveVoucher",
          } as Record<string, unknown>);
      } catch (error) {
        extras.verification = {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    await printResponse(response, opts.output, undefined, extras);
  });

program
  .command("create-invoice-installment")
  .alias("createInvoiceInstallment")
  .description("Create an installment invoice from an existing invoice template")
  .requiredOption("--from-invoice <id>", "Source invoice id")
  .requiredOption("--percent <n>", "Installment percent, e.g. 70")
  .option("--label <text>", "Label used in header/internal note", "Abschlagsrechnung")
  .option("--invoice-date <date>", "Invoice date (default: today)")
  .option("--delivery-date <date>", "Delivery date (default: invoice-date)")
  .option("--invoice-type <type>", "Invoice type, default AR", "AR")
  .option(
    "--auto-fix-delivery-date",
    "Apply delivery date auto-fix in preflight (invoiceDate +1d)",
    false
  )
  .option("--execute", "Actually create invoice (default prints payload only)", false)
  .option("--verify", "Run post-write verification", false)
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--output <mode>", "pretty|json|raw", "pretty")
  .action(async (opts) => {
    const percent = Number(opts.percent);
    if (!Number.isFinite(percent) || percent <= 0) {
      fail("--percent must be a number > 0.");
    }
    if (opts.output !== "pretty" && opts.output !== "json" && opts.output !== "raw") {
      fail("--output must be pretty|json|raw.");
    }

    const config = loadConfig({ xVersion: opts.xVersion });
    const client = new SevdeskClient(config);
    const source = await readInvoiceTemplate({
      client,
      invoiceId: String(opts.fromInvoice),
    });

    const invoiceDate = String(opts.invoiceDate ?? todayISO());
    const deliveryDate = String(opts.deliveryDate ?? invoiceDate);
    const payload = buildInstallmentInvoicePayload({
      sourceInvoice: source.invoice,
      sourcePositions: source.positions,
      percent,
      label: String(opts.label),
      invoiceDate,
      deliveryDate,
      invoiceType: String(opts.invoiceType),
    });

    if (!opts.execute) {
      process.stdout.write(`${toPrettyJson({ dryRun: true, payload })}\n`);
      return;
    }

    await executeCreateInvoiceFromPayload({
      client,
      payload,
      verify: Boolean(opts.verify),
      autoFixDeliveryDate: Boolean(opts.autoFixDeliveryDate),
      output: opts.output,
    });
  });

const invoiceHelpers = program
  .command("invoice")
  .description("Invoice workflow helpers");

invoiceHelpers
  .command("clone")
  .description("Clone invoice into a new createInvoiceByFactory payload/write")
  .requiredOption("--from <id>", "Source invoice id")
  .option("--date <date>", "Target invoice date")
  .option("--period <period>", "Shift source invoice date (monthly|yearly|weekly|daily)")
  .option("--delivery-date <date>", "Target delivery date (default: invoice date)")
  .option("--label <text>", "Label used in header/internal note", "Clone")
  .option(
    "--override-position-price <pair...>",
    "Selective price overrides, format '<index>=<price>'"
  )
  .option(
    "--auto-fix-delivery-date",
    "Apply delivery date auto-fix in preflight (invoiceDate +1d)",
    false
  )
  .option("--execute", "Actually create cloned invoice (default prints payload only)", false)
  .option("--verify", "Run post-write verification", false)
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--output <mode>", "pretty|json|raw", "pretty")
  .action(async (opts) => {
    if (opts.output !== "pretty" && opts.output !== "json" && opts.output !== "raw") {
      fail("--output must be pretty|json|raw.");
    }

    const config = loadConfig({ xVersion: opts.xVersion });
    const client = new SevdeskClient(config);
    const source = await readInvoiceTemplate({
      client,
      invoiceId: String(opts.from),
    });

    const sourceDate = String(source.invoice.invoiceDate ?? todayISO());
    const invoiceDate = opts.date
      ? String(opts.date)
      : opts.period
        ? shiftDateByPeriod(sourceDate, String(opts.period))
        : todayISO();
    const deliveryDate = String(opts.deliveryDate ?? invoiceDate);
    const priceOverrides = parsePositionPriceOverrides(opts.overridePositionPrice ?? []);

    const payload = buildClonedInvoicePayload({
      sourceInvoice: source.invoice,
      sourcePositions: source.positions,
      invoiceDate,
      deliveryDate,
      label: String(opts.label),
      priceOverrides,
    });

    if (!opts.execute) {
      process.stdout.write(`${toPrettyJson({ dryRun: true, payload })}\n`);
      return;
    }

    await executeCreateInvoiceFromPayload({
      client,
      payload,
      verify: Boolean(opts.verify),
      autoFixDeliveryDate: Boolean(opts.autoFixDeliveryDate),
      output: opts.output,
    });
  });

program
  .command("book-voucher")
  .description(
    "Prepare/execute voucher booking via sevdesk bookVoucher (dry-run by default)"
  )
  .requiredOption("--voucher-id <id>", "Voucher id")
  .requiredOption("--check-account-id <id>", "Check account id used for booking")
  .requiredOption("--amount <n>", "Amount to book")
  .option("--date <date>", "Booking date (defaults to today)")
  .option("--type <type>", "Booking type", "FULL_PAYMENT")
  .option("--transaction-id <id>", "Existing checkAccountTransaction id for online accounts")
  .option("--create-feed", "Set createFeed=true", false)
  .option("--execute", "Actually book the voucher", false)
  .option("--verify", "Run post-book verification", false)
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--output <mode>", "pretty|json|raw", "pretty")
  .action(async (opts) => {
    if (opts.output !== "pretty" && opts.output !== "json" && opts.output !== "raw") {
      fail("--output must be pretty|json|raw.");
    }

    const payload = buildBookVoucherPayload({
      amount: parseNumberOrFail(String(opts.amount), "--amount", 0),
      date: String(opts.date ?? todayISO()),
      type: String(opts.type),
      checkAccountId: String(opts.checkAccountId),
      transactionId: opts.transactionId ? String(opts.transactionId) : undefined,
      createFeed: opts.createFeed ? true : undefined,
    });

    const preflight = validateWritePreflight("bookVoucher", payload);
    if (preflight.errors.length > 0) {
      fail(
        [
          "Preflight validation failed for bookVoucher:",
          ...preflight.errors.map((error) => `- ${error}`),
        ].join("\n")
      );
    }
    emitPreflightDiagnostics("bookVoucher", preflight.warnings, preflight.autoFixes);

    if (!opts.execute) {
      process.stdout.write(
        `${toPrettyJson({
          dryRun: true,
          voucherId: String(opts.voucherId),
          payload,
        })}\n`
      );
      return;
    }

    const config = loadConfig({ xVersion: opts.xVersion });
    const client = new SevdeskClient(config);
    await executeBookVoucherWorkflow({
      client,
      voucherId: String(opts.voucherId),
      payload,
      verify: Boolean(opts.verify),
      output: opts.output,
      mode: "book",
    });
  });

program
  .command("assign-voucher-to-transaction")
  .description(
    "Prepare/execute voucher booking against a specific transaction (sevdesk links during booking)"
  )
  .requiredOption("--voucher-id <id>", "Voucher id")
  .requiredOption("--check-account-id <id>", "Check account id used for booking")
  .requiredOption("--transaction-id <id>", "Existing checkAccountTransaction id")
  .requiredOption("--amount <n>", "Amount to book")
  .option("--date <date>", "Booking date (defaults to transaction/value date if known, else today)")
  .option("--type <type>", "Booking type", "FULL_PAYMENT")
  .option("--create-feed", "Set createFeed=true", false)
  .option("--execute", "Actually book/link the voucher", false)
  .option("--verify", "Run post-book verification", false)
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--output <mode>", "pretty|json|raw", "pretty")
  .action(async (opts) => {
    if (opts.output !== "pretty" && opts.output !== "json" && opts.output !== "raw") {
      fail("--output must be pretty|json|raw.");
    }

    const payload = buildBookVoucherPayload({
      amount: parseNumberOrFail(String(opts.amount), "--amount", 0),
      date: String(opts.date ?? todayISO()),
      type: String(opts.type),
      checkAccountId: String(opts.checkAccountId),
      transactionId: String(opts.transactionId),
      createFeed: opts.createFeed ? true : undefined,
    });

    const preflight = validateWritePreflight("bookVoucher", payload);
    if (preflight.errors.length > 0) {
      fail(
        [
          "Preflight validation failed for bookVoucher:",
          ...preflight.errors.map((error) => `- ${error}`),
        ].join("\n")
      );
    }
    emitPreflightDiagnostics("bookVoucher", preflight.warnings, preflight.autoFixes);

    if (!opts.execute) {
      process.stdout.write(
        `${toPrettyJson({
          dryRun: true,
          voucherId: String(opts.voucherId),
          workflowMode: "assign-and-book",
          payload,
        })}\n`
      );
      return;
    }

    const config = loadConfig({ xVersion: opts.xVersion });
    const client = new SevdeskClient(config);
    await executeBookVoucherWorkflow({
      client,
      voucherId: String(opts.voucherId),
      payload,
      verify: Boolean(opts.verify),
      output: opts.output,
      mode: "assign-and-book",
    });
  });

const docs = program.command("docs").description("Documentation helpers");

docs
  .command("read-ops")
  .description("Generate markdown reference for all read-only (GET) operations")
  .option("--tag <tag>", "Only include operations with this tag (case-insensitive)")
  .option("--output <file>", "Write markdown to a file instead of stdout")
  .action(async (opts) => {
    const tag = typeof opts.tag === "string" ? opts.tag.trim().toLowerCase() : "";
    const catalog = getCatalog().filter((op) => op.method === "GET");
    const filtered =
      tag.length > 0
        ? catalog.filter((op) => op.tags.some((t) => t.toLowerCase() === tag))
        : catalog;

    const markdown = renderReadOperationsMarkdown({
      catalog: filtered,
      quirks: listOperationQuirks(),
    });

    if (opts.output) {
      const outputPath = path.resolve(process.cwd(), String(opts.output));
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, markdown, "utf8");
      process.stdout.write(`${outputPath}\n`);
      return;
    }

    process.stdout.write(markdown);
  });

docs
  .command("usage")
  .description("Print a short read-only usage guide")
  .action(() => {
    process.stdout.write(renderReadUsageText());
  });

docs
  .command("invoice-edit")
  .description("Explain the recommended invoice edit workflow")
  .action(() => {
    process.stdout.write(renderInvoiceEditWorkflowText());
  });

docs
  .command("invoice-finalize")
  .description("Explain the recommended invoice finalize workflow")
  .action(() => {
    process.stdout.write(renderInvoiceFinalizeWorkflowText());
  });

program
  .command("write <operationId>")
  .description("Execute a non-GET operation (DELETE requires explicit guard)")
  .option("--path <pair...>", "Path params as key=value")
  .option("--query <pair...>", "Query params as key=value")
  .option("--header <pair...>", "Additional headers as key=value")
  .option("--body-file <file>", "JSON file for request body")
  .option("--body-json <json>", "Inline JSON request body")
  .option("--form-field <pair...>", "Multipart form field as key=value")
  .option("--form-file <pair...>", "Multipart form file as key=/path/to/file")
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--execute", "Required guard only for DELETE operations", false)
  .option(
    "--confirm-execute <value>",
    "Required value 'yes' only for DELETE operations",
    ""
  )
  .option(
    "--allow-write",
    "Allow DELETE without SEVDESK_ALLOW_WRITE=true",
    false
  )
  .option(
    "--preflight",
    "Validate payload for supported write operations before API call",
    true
  )
  .option(
    "--auto-fix-delivery-date",
    "With preflight: auto-fix createInvoiceByFactory deliveryDate to invoiceDate +1d when needed",
    false
  )
  .option("--no-preflight", "Disable local preflight validation")
  .option(
    "--verify",
    "After write, run read-only verification checks for supported operations",
    false
  )
  .option(
    "--verify-contact",
    "For createContact: run dedicated verification and customerNumber checks",
    false
  )
  .option(
    "--fix-contact",
    "With --verify-contact: auto-fix customerNumber mismatch via updateContact",
    true
  )
  .option(
    "--no-fix-contact",
    "With --verify-contact: disable automatic customerNumber fix"
  )
  .option("--output <mode>", "pretty|json|raw", "pretty")
  .option("--save <file>", "Save full response to file")
  .action(async (operationId: string, opts) => {
    const operation = getOperationOrFail(operationId);

    if (opts.verifyContact && operationId !== "createContact") {
      fail("--verify-contact is currently supported only for write createContact.");
    }

    const config = loadConfig({
      xVersion: opts.xVersion,
      allowWriteOverride: Boolean(opts.allowWrite),
    });

    const pathParams = parseKeyValuePairs(opts.path ?? []);
    const queryParams = parseKeyValuePairs(opts.query ?? []);
    const headerParams = parseKeyValuePairs(opts.header ?? []);
    const resolvedPath = resolvePathTemplate(operation.path, pathParams);

    let body: unknown = undefined;
    let formData: Record<string, string | { filePath: string }> | undefined;
    if (opts.bodyFile) {
      body = await readJsonFile(opts.bodyFile);
    }
    if (opts.bodyJson) {
      body = JSON.parse(opts.bodyJson);
    }
    if (
      (opts.bodyFile || opts.bodyJson) &&
      ((opts.formField && opts.formField.length > 0) ||
        (opts.formFile && opts.formFile.length > 0))
    ) {
      fail(
        "Use either JSON body options (--body-file/--body-json) or multipart options (--form-field/--form-file), not both."
      );
    }
    if (
      (opts.formField && opts.formField.length > 0) ||
      (opts.formFile && opts.formFile.length > 0)
    ) {
      formData = {};
      const fieldParams = parseKeyValuePairs(opts.formField ?? []);
      const fileParams = parseKeyValuePairs(opts.formFile ?? []);
      for (const [key, value] of Object.entries(fieldParams)) {
        formData[key] = value;
      }
      for (const [key, value] of Object.entries(fileParams)) {
        formData[key] = {
          filePath: await ensureReadableFile(value),
        };
      }
    }

    if (opts.preflight && formData === undefined) {
      const preflight = validateWritePreflight(operationId, body, {
        autoFixDeliveryDate: Boolean(opts.autoFixDeliveryDate),
      });
      if (preflight.errors.length > 0) {
        fail(
          [
            `Preflight validation failed for ${operationId}:`,
            ...preflight.errors.map((error) => `- ${error}`),
          ].join("\n")
        );
      }
      if (preflight.warnings.length > 0) {
        process.stderr.write(
          `${preflight.warnings
            .map((warning: string) => `[sevdesk-agent] preflight warning: ${warning}`)
            .join("\n")}\n`
        );
      }
      if (preflight.autoFixes && preflight.autoFixes.length > 0) {
        process.stderr.write(
          `[sevdesk-agent] preflight auto-fixes: ${preflight.autoFixes.join(", ")}\n`
        );
      }
      if (preflight.normalizedBody !== undefined) {
        body = preflight.normalizedBody;
      }
    } else if (opts.preflight && formData !== undefined) {
      process.stderr.write(
        `[sevdesk-agent] preflight skipped for ${operationId}: multipart form payloads are not validated locally yet.\n`
      );
    }

    assertWriteAllowed({
      method: operation.method,
      execute: Boolean(opts.execute),
      confirmExecute: opts.confirmExecute,
      allowWrite: config.allowWrite,
    });

    const client = new SevdeskClient(config);
    const response = await client.request({
      method: operation.method,
      path: resolvedPath,
      query: queryParams,
      headers: headerParams,
      body,
      formData,
    });

    const extras: Record<string, unknown> = {};
    if (!response.ok) {
      const hints = deriveRemediationHints({
        operationId,
        status: response.status,
        data: response.data,
      });
      if (hints.length > 0) {
        extras.remediationHints = hints;
      }
    }
    if (opts.verifyContact) {
      try {
        const contactVerification = await verifyAndMaybeFixCreateContact({
          client,
          body,
          writeResponse: response,
          autoFixCustomerNumber: Boolean(opts.fixContact),
        });

        extras.verification = contactVerification.verification;
        extras.verifyContact = {
          autoFix: contactVerification.autoFix,
        };
      } catch (error) {
        extras.verification = {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    } else if (opts.verify) {
      try {
        const verification = await runWriteVerification({
          operationId,
          client,
          body,
          writeResponse: response,
        });
        if (verification) {
          extras.verification = verification;
        } else {
          extras.verification = {
            skipped: true,
            reason: `No built-in verification for ${operationId}`,
          };
        }
      } catch (error) {
        extras.verification = {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    await printResponse(response, opts.output, opts.save, extras);
  });

program
  .command("context")
  .description("Context utilities for agent workflows")
  .command("snapshot")
  .description("Capture read-only API + planning context (stdout by default)")
  .option("--op <operationId...>", "Specific read operationIds to include")
  .option("--include-default", "Include standard context operation set", true)
  .option("--no-include-default", "Disable default operation set")
  .option("--include-plans", "Embed task_plan/findings/progress from Plans/", true)
  .option("--no-include-plans", "Skip plan markdown embedding")
  .option("--max-objects <n>", "Max objects per list response", "20")
  .option("--output <file>", "Optional output file path")
  .action(async (opts) => {
    const selected = new Set<string>();

    if (opts.includeDefault) {
      for (const op of DEFAULT_CONTEXT_OPERATION_IDS) {
        selected.add(op);
      }
    }

    for (const op of opts.op ?? []) {
      selected.add(op);
    }

    if (selected.size === 0) {
      fail("No operations selected. Use --include-default or --op.");
    }

    const maxObjects = Number.parseInt(opts.maxObjects, 10);
    if (!Number.isFinite(maxObjects) || maxObjects < 1) {
      fail("--max-objects must be an integer >= 1.");
    }

    const config = loadConfig();
    const client = new SevdeskClient(config);

    const payload = await buildContextSnapshot({
      rootDir: process.cwd(),
      operationIds: [...selected],
      includePlans: Boolean(opts.includePlans),
      maxObjects,
      client,
    });

    if (opts.output) {
      const outputPath = path.resolve(process.cwd(), opts.output);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeContextSnapshot(outputPath, payload);

      process.stdout.write(
        `${toPrettyJson({
          snapshot: outputPath,
          operationCount: selected.size,
          catalogSize: getCatalog().length,
        })}\n`
      );
      return;
    }

    process.stdout.write(`${toPrettyJson(payload)}\n`);
  });

program.parseAsync(process.argv).catch((error) => {
  process.stderr.write(`[sevdesk-agent] ${error.message}\n`);
  process.stderr.write(
    "[sevdesk-agent] Hint: bootstrap the local CLI shim with `npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent-skill install --force`, then run `~/.codex/bin/sevdesk-agent <command>`.\n"
  );
  process.exitCode = 1;
});
