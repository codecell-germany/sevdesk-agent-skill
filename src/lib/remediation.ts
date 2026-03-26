function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function collectStrings(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectStrings(entry));
  }
  const rec = asRecord(value);
  if (!rec) {
    return [];
  }
  return Object.values(rec).flatMap((entry) => collectStrings(entry));
}

export function deriveRemediationHints(options: {
  operationId: string;
  status: number;
  data: unknown;
}): string[] {
  const allTexts = collectStrings(options.data)
    .map((value) => value.trim())
    .filter(Boolean);
  const joined = allTexts.join(" ").toLowerCase();

  const hints = new Set<string>();

  if (
    options.operationId === "createInvoiceByFactory" &&
    joined.includes("deliverydate") &&
    joined.includes("invoicedate")
  ) {
    hints.add(
      "Check `invoice.invoiceDate` and `invoice.deliveryDate`. For this workflow set deliveryDate > invoiceDate (or use `--auto-fix-delivery-date`)."
    );
  }

  if (joined.includes("at least one position")) {
    hints.add(
      "Ensure the payload contains at least one position entry (`orderPosSave` / `invoicePosSave` / `voucherPosSave`)."
    );
  }

  if (
    joined.includes("customernumber") &&
    (joined.includes("already") ||
      joined.includes("exists") ||
      joined.includes("duplicate") ||
      joined.includes("availability"))
  ) {
    hints.add(
      "Check customer number availability first (`contactCustomerNumberAvailabilityCheck`) and use `--verify-contact` after `createContact`."
    );
  }

  if (
    joined.includes("taxrule") ||
    joined.includes("taxtype") ||
    joined.includes("taxrate")
  ) {
    hints.add(
      "Validate taxRule/taxRate combinations for the account type (use sevdesk receipt guidance endpoints where applicable)."
    );
  }

  if (joined.includes("contact") && joined.includes("required")) {
    hints.add(
      "Provide a valid contact object (`contact.id` + `contact.objectName`) before moving invoice state beyond draft."
    );
  }

  if (options.operationId === "voucherUploadFile" && options.status === 400) {
    hints.add(
      "Use multipart upload (`--form-file file=/absolute/path/to/document.pdf`) or the high-level `create-voucher-from-pdf` workflow."
    );
  }

  if (
    options.operationId === "voucherFactorySaveVoucher" &&
    (joined.includes("accountdatev") || joined.includes("accountingtype"))
  ) {
    hints.add(
      "For sevdesk 2.0 voucher positions, provide both `accountDatev.id` and `accountingType.id`. Use the receipt guidance endpoints to choose a valid account."
    );
  }

  if (
    options.operationId === "bookVoucher" &&
    joined.includes("transaction")
  ) {
    hints.add(
      "For online accounts, pass `checkAccountTransaction.id`; for offline/register accounts, omit it and let sevdesk create the booking transaction."
    );
  }

  if (options.status === 401 || joined.includes("unauthorized")) {
    hints.add("Verify `SEVDESK_API_TOKEN` and account permissions for this operation.");
  }

  if (options.status === 404) {
    hints.add("Verify path IDs and object existence (`op-show <operationId>` for required params).");
  }

  return [...hints];
}
