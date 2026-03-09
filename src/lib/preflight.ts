interface ValidationResult {
  errors: string[];
  warnings: string[];
  normalizedBody?: unknown;
  autoFixes?: string[];
}

interface PreflightOptions {
  autoFixDeliveryDate?: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
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

function parseDateLike(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const d = new Date(millis);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  if (/^\d{10,13}$/.test(raw)) {
    const asNumber = Number(raw);
    if (Number.isFinite(asNumber)) {
      const millis = raw.length >= 13 ? asNumber : asNumber * 1000;
      const d = new Date(millis);
      return Number.isNaN(d.getTime()) ? null : d;
    }
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

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function validateCreateContact(body: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const payload = asRecord(body);
  if (!payload) {
    return {
      errors: [
        "createContact: request body must be an object with a `contact` object.",
      ],
      warnings,
    };
  }

  const contact = asRecord(payload.contact);
  if (!contact) {
    errors.push("createContact: missing required object `contact`.");
    return { errors, warnings };
  }

  const name = String(contact.name ?? "").trim();
  const surename = String(contact.surename ?? "").trim();
  const familyname = String(contact.familyname ?? "").trim();

  if (!name && !(surename && familyname)) {
    errors.push(
      "createContact: provide either `contact.name` (company) or both `contact.surename` and `contact.familyname` (person)."
    );
  }

  if (Object.prototype.hasOwnProperty.call(contact, "customerNumber")) {
    const customerNumber = String(contact.customerNumber ?? "").trim();
    if (!customerNumber) {
      errors.push("createContact: `contact.customerNumber` must not be empty.");
    }
  }

  if (Object.prototype.hasOwnProperty.call(contact, "parent")) {
    const parent = asRecord(contact.parent);
    if (!parent) {
      errors.push(
        "createContact: `contact.parent` must be an object with `id` and `objectName`."
      );
    } else {
      if (!String(parent.id ?? "").trim()) {
        errors.push("createContact: `contact.parent.id` is required when parent is set.");
      }
      if (!String(parent.objectName ?? "").trim()) {
        errors.push(
          "createContact: `contact.parent.objectName` is required when parent is set."
        );
      }
    }
  }

  if (!Object.prototype.hasOwnProperty.call(contact, "objectName")) {
    warnings.push(
      "createContact: `contact.objectName` is not set (often `Contact` in robust payloads)."
    );
  }

  return { errors, warnings };
}

function validateCreateOrder(body: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const payload = asRecord(body);
  if (!payload) {
    return {
      errors: ["createOrder: request body must be an object."],
      warnings,
    };
  }

  const order = asRecord(payload.order);
  if (!order) {
    errors.push("createOrder: missing required object `order`.");
    return { errors, warnings };
  }

  const contact = asRecord(order.contact);
  if (!contact) {
    errors.push("createOrder: `order.contact` is required and must include `id`.");
  } else {
    if (!String(contact.id ?? "").trim()) {
      errors.push("createOrder: `order.contact.id` is required.");
    }
    if (!String(contact.objectName ?? "").trim()) {
      warnings.push(
        "createOrder: `order.contact.objectName` is missing (usually `Contact`)."
      );
    }
  }

  const requiredStringFields = [
    "orderType",
    "orderDate",
    "currency",
    "orderNumber",
  ];

  for (const field of requiredStringFields) {
    const value = String(order[field] ?? "").trim();
    if (!value) {
      errors.push(`createOrder: \`order.${field}\` is required.`);
    }
  }

  if (!Object.prototype.hasOwnProperty.call(order, "status")) {
    errors.push("createOrder: `order.status` is required.");
  }

  const orderPosSave = payload.orderPosSave;
  if (!Array.isArray(orderPosSave) || orderPosSave.length === 0) {
    errors.push("createOrder: `orderPosSave` must be a non-empty array.");
    return { errors, warnings };
  }

  for (let index = 0; index < orderPosSave.length; index += 1) {
    const pos = asRecord(orderPosSave[index]);
    if (!pos) {
      errors.push(`createOrder: orderPosSave[${index}] must be an object.`);
      continue;
    }

    const name = String(pos.name ?? "").trim();
    const quantity = toNumber(pos.quantity);
    const price = toNumber(pos.price);
    if (!name) {
      errors.push(`createOrder: orderPosSave[${index}].name is required.`);
    }
    if (quantity === null || quantity <= 0) {
      errors.push(
        `createOrder: orderPosSave[${index}].quantity must be a number > 0.`
      );
    }
    if (price === null || price < 0) {
      errors.push(
        `createOrder: orderPosSave[${index}].price must be a number >= 0.`
      );
    }
  }

  return { errors, warnings };
}

function validateCreateInvoiceByFactory(
  body: unknown,
  options: PreflightOptions
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const autoFixes: string[] = [];

  const payload = asRecord(body);
  if (!payload) {
    return {
      errors: ["createInvoiceByFactory: request body must be an object."],
      warnings,
    };
  }

  const invoice = asRecord(payload.invoice);
  if (!invoice) {
    errors.push("createInvoiceByFactory: missing required object `invoice`.");
    return { errors, warnings };
  }

  const contact = asRecord(invoice.contact);
  if (!contact) {
    errors.push(
      "createInvoiceByFactory: `invoice.contact` is required and must include `id`."
    );
  } else if (!String(contact.id ?? "").trim()) {
    errors.push("createInvoiceByFactory: `invoice.contact.id` is required.");
  }

  if (!String(invoice.invoiceType ?? "").trim()) {
    errors.push("createInvoiceByFactory: `invoice.invoiceType` is required.");
  }

  if (!Object.prototype.hasOwnProperty.call(invoice, "status")) {
    errors.push("createInvoiceByFactory: `invoice.status` is required.");
  }

  const invoiceDate = parseDateLike(invoice.invoiceDate);
  const deliveryDate = parseDateLike(invoice.deliveryDate);
  const deliveryDateUntil = parseDateLike(invoice.deliveryDateUntil);

  if (invoice.invoiceDate !== undefined && !invoiceDate) {
    errors.push(
      "createInvoiceByFactory: `invoice.invoiceDate` is invalid. Use YYYY-MM-DD, DD.MM.YYYY or unix timestamp."
    );
  }
  if (invoice.deliveryDate !== undefined && !deliveryDate) {
    errors.push(
      "createInvoiceByFactory: `invoice.deliveryDate` is invalid. Use YYYY-MM-DD, DD.MM.YYYY or unix timestamp."
    );
  }

  const normalizedInvoice = { ...invoice };
  if (invoiceDate && deliveryDate && deliveryDate <= invoiceDate) {
    if (options.autoFixDeliveryDate) {
      const fixedDate = new Date(invoiceDate.getTime());
      fixedDate.setDate(fixedDate.getDate() + 1);
      normalizedInvoice.deliveryDate = formatDateISO(fixedDate);
      warnings.push(
        "createInvoiceByFactory: auto-fixed `invoice.deliveryDate` to be > `invoice.invoiceDate`."
      );
      autoFixes.push("invoice.deliveryDate");
    } else {
      errors.push(
        "createInvoiceByFactory: `invoice.deliveryDate` should be later than `invoice.invoiceDate`. Use `--auto-fix-delivery-date` or adjust dates."
      );
    }
  }

  if (deliveryDate && deliveryDateUntil && deliveryDateUntil < deliveryDate) {
    errors.push(
      "createInvoiceByFactory: `invoice.deliveryDateUntil` must be >= `invoice.deliveryDate`."
    );
  }

  const positions = payload.invoicePosSave;
  if (!Array.isArray(positions) || positions.length === 0) {
    errors.push("createInvoiceByFactory: `invoicePosSave` must be a non-empty array.");
  } else {
    for (let index = 0; index < positions.length; index += 1) {
      const pos = asRecord(positions[index]);
      if (!pos) {
        errors.push(`createInvoiceByFactory: invoicePosSave[${index}] must be an object.`);
        continue;
      }

      const quantity = toNumber(pos.quantity);
      const price = toNumber(pos.price);
      const taxRate = toNumber(pos.taxRate);

      if (quantity === null || quantity <= 0) {
        errors.push(
          `createInvoiceByFactory: invoicePosSave[${index}].quantity must be a number > 0.`
        );
      }
      if (price === null || price < 0) {
        errors.push(
          `createInvoiceByFactory: invoicePosSave[${index}].price must be a number >= 0.`
        );
      }
      if (taxRate === null || taxRate < 0) {
        errors.push(
          `createInvoiceByFactory: invoicePosSave[${index}].taxRate must be a number >= 0.`
        );
      }
    }
  }

  if (autoFixes.length > 0) {
    return {
      errors,
      warnings,
      normalizedBody: {
        ...payload,
        invoice: normalizedInvoice,
      },
      autoFixes,
    };
  }

  return { errors, warnings };
}

export function validateWritePreflight(
  operationId: string,
  body: unknown,
  options: PreflightOptions = {}
): ValidationResult {
  if (operationId === "createContact") {
    return validateCreateContact(body);
  }

  if (operationId === "createOrder") {
    return validateCreateOrder(body);
  }

  if (operationId === "createInvoiceByFactory") {
    return validateCreateInvoiceByFactory(body, options);
  }

  return { errors: [], warnings: [] };
}
