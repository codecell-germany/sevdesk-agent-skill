function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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

function toText(value: unknown): string {
  return String(value ?? "").trim();
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseDateLike(value: unknown): Date | null {
  const raw = String(value ?? "").trim();
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

export function todayISO(): string {
  return formatDateISO(new Date());
}

export function shiftDateByPeriod(baseDate: string, period: string): string {
  const source = parseDateLike(baseDate) ?? new Date();
  const normalized = period.trim().toLowerCase();
  const out = new Date(source.getTime());

  if (normalized === "monthly" || normalized === "p1m") {
    out.setMonth(out.getMonth() + 1);
    return formatDateISO(out);
  }
  if (normalized === "yearly" || normalized === "p1y") {
    out.setFullYear(out.getFullYear() + 1);
    return formatDateISO(out);
  }
  if (normalized === "weekly" || normalized === "p1w") {
    out.setDate(out.getDate() + 7);
    return formatDateISO(out);
  }
  if (normalized === "daily" || normalized === "p1d") {
    out.setDate(out.getDate() + 1);
    return formatDateISO(out);
  }

  throw new Error(
    `Unsupported period '${period}'. Use monthly|yearly|weekly|daily (or P1M|P1Y|P1W|P1D).`
  );
}

function buildInvoicePositions(
  sourcePositions: Record<string, unknown>[],
  factor: number,
  textPrefix: string,
  priceOverrides: Record<number, number>
): Record<string, unknown>[] {
  return sourcePositions.map((position, index) => {
    const quantity = toNumber(position.quantity) ?? 1;
    const sourcePrice = toNumber(position.price) ?? toNumber(position.priceNet) ?? 0;
    const overriddenPrice = priceOverrides[index];
    const scaledPrice =
      overriddenPrice !== undefined ? overriddenPrice : roundMoney(sourcePrice * factor);

    const text = toText(position.text);
    const prefixedText = textPrefix ? `${textPrefix}${text ? ` | ${text}` : ""}` : text;

    return {
      objectName: "InvoicePos",
      mapAll: true,
      name: toText(position.name) || `Position ${index + 1}`,
      text: prefixedText,
      quantity,
      price: scaledPrice,
      taxRate: toNumber(position.taxRate) ?? 19,
      unity: asRecord(position.unity) ?? { id: 1, objectName: "Unity" },
      ...(asRecord(position.part) ? { part: asRecord(position.part) } : {}),
    };
  });
}

function baseInvoiceFromSource(
  sourceInvoice: Record<string, unknown>,
  invoiceDate: string,
  deliveryDate: string,
  invoiceType: string,
  headerLabel: string,
  internalNote: string
): Record<string, unknown> {
  const contact = asRecord(sourceInvoice.contact);
  const contactPerson = asRecord(sourceInvoice.contactPerson);
  const taxRule = asRecord(sourceInvoice.taxRule);
  const addressCountry = asRecord(sourceInvoice.addressCountry);

  return {
    objectName: "Invoice",
    mapAll: true,
    status: 100,
    invoiceType,
    invoiceDate,
    deliveryDate,
    currency: toText(sourceInvoice.currency) || "EUR",
    taxText: toText(sourceInvoice.taxText) || "Umsatzsteuer",
    taxType: toText(sourceInvoice.taxType) || "default",
    showNet:
      typeof sourceInvoice.showNet === "boolean" ? sourceInvoice.showNet : true,
    address: toText(sourceInvoice.address),
    customerInternalNote: internalNote,
    header: headerLabel,
    ...(contact ? { contact } : {}),
    ...(contactPerson ? { contactPerson } : {}),
    ...(taxRule ? { taxRule } : {}),
    ...(addressCountry ? { addressCountry } : {}),
  };
}

export function buildInstallmentInvoicePayload(options: {
  sourceInvoice: Record<string, unknown>;
  sourcePositions: Record<string, unknown>[];
  percent: number;
  label: string;
  invoiceDate: string;
  deliveryDate: string;
  invoiceType: string;
}): Record<string, unknown> {
  if (!Number.isFinite(options.percent) || options.percent <= 0) {
    throw new Error("percent must be > 0.");
  }

  const sourceNumber =
    toText(options.sourceInvoice.invoiceNumber) || toText(options.sourceInvoice.id);
  const label = toText(options.label) || "Abschlagsrechnung";
  const header = `${label} ${options.percent}%`;
  const internalNote = `${label} ${options.percent}% aus Vorlage ${sourceNumber}`;

  return {
    invoice: baseInvoiceFromSource(
      options.sourceInvoice,
      options.invoiceDate,
      options.deliveryDate,
      options.invoiceType,
      header,
      internalNote
    ),
    invoicePosSave: buildInvoicePositions(
      options.sourcePositions,
      options.percent / 100,
      `${label} ${options.percent}%`,
      {}
    ),
  };
}

export function parsePositionPriceOverrides(
  entries: string[]
): Record<number, number> {
  const out: Record<number, number> = {};

  for (const entry of entries) {
    const [idxRaw, priceRaw] = entry.split("=");
    const idx = Number(idxRaw);
    const price = Number(priceRaw);
    if (
      !Number.isInteger(idx) ||
      idx < 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      throw new Error(
        `Invalid override '${entry}'. Use '<index>=<price>' e.g. 0=99.95`
      );
    }
    out[idx] = roundMoney(price);
  }

  return out;
}

export function buildClonedInvoicePayload(options: {
  sourceInvoice: Record<string, unknown>;
  sourcePositions: Record<string, unknown>[];
  invoiceDate: string;
  deliveryDate: string;
  label: string;
  priceOverrides: Record<number, number>;
}): Record<string, unknown> {
  const sourceNumber =
    toText(options.sourceInvoice.invoiceNumber) || toText(options.sourceInvoice.id);
  const label = toText(options.label) || "Clone";
  const header = `${label} ${sourceNumber}`;
  const internalNote = `${label} von Rechnung ${sourceNumber}`;

  return {
    invoice: baseInvoiceFromSource(
      options.sourceInvoice,
      options.invoiceDate,
      options.deliveryDate,
      toText(options.sourceInvoice.invoiceType) || "RE",
      header,
      internalNote
    ),
    invoicePosSave: buildInvoicePositions(
      options.sourcePositions,
      1,
      `${label}`,
      options.priceOverrides
    ),
  };
}

export function extractPrimaryObject(data: unknown): Record<string, unknown> | null {
  const root = asRecord(data);
  if (!root) {
    return null;
  }

  const objects = root.objects;
  if (Array.isArray(objects)) {
    const first = objects.find(
      (entry) => entry && typeof entry === "object" && !Array.isArray(entry)
    );
    return asRecord(first);
  }

  const obj = asRecord(objects);
  if (obj) {
    return obj;
  }

  return root;
}

export function extractObjectArray(data: unknown): Record<string, unknown>[] {
  const root = asRecord(data);
  if (!root) {
    return [];
  }
  const objects = asArray(root.objects);
  return objects
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

