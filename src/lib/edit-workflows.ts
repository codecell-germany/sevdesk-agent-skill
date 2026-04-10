function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as T;
}

function extractWrappedPatch(
  body: unknown,
  wrappedKey: string
): Record<string, unknown> {
  const root = asRecord(body);
  if (!root) {
    return {};
  }
  const wrapped = asRecord(root[wrappedKey]);
  return stripUndefined({ ...(wrapped ?? root) });
}

function extractArrayFromPatch(body: unknown, key: string): Record<string, unknown>[] {
  const root = asRecord(body);
  if (!root) {
    return [];
  }
  return asArray(root[key])
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

function ensureNonEmptyPatch(
  patch: Record<string, unknown>,
  label: string
): Record<string, unknown> {
  if (Object.keys(patch).length === 0) {
    throw new Error(`${label}: no editable fields provided.`);
  }
  return patch;
}

export function buildOrderEditPatch(options: {
  patchBody?: unknown;
  orderNumber?: string;
  header?: string;
  headText?: string;
  footText?: string;
  address?: string;
  orderDate?: string;
  status?: number;
  currency?: string;
  customerInternalNote?: string;
  timeToPay?: number;
  taxText?: string;
  contactId?: string;
  contactPersonId?: string;
}): Record<string, unknown> {
  const patch = extractWrappedPatch(options.patchBody, "order");
  const merged = stripUndefined({
    ...patch,
    ...(options.orderNumber !== undefined
      ? { orderNumber: options.orderNumber }
      : {}),
    ...(options.header !== undefined ? { header: options.header } : {}),
    ...(options.headText !== undefined ? { headText: options.headText } : {}),
    ...(options.footText !== undefined ? { footText: options.footText } : {}),
    ...(options.address !== undefined ? { address: options.address } : {}),
    ...(options.orderDate !== undefined ? { orderDate: options.orderDate } : {}),
    ...(options.status !== undefined ? { status: options.status } : {}),
    ...(options.currency !== undefined ? { currency: options.currency } : {}),
    ...(options.customerInternalNote !== undefined
      ? { customerInternalNote: options.customerInternalNote }
      : {}),
    ...(options.timeToPay !== undefined
      ? { timeToPay: options.timeToPay }
      : {}),
    ...(options.taxText !== undefined ? { taxText: options.taxText } : {}),
    ...(options.contactId
      ? {
          contact: {
            id: options.contactId,
            objectName: "Contact",
          },
        }
      : {}),
    ...(options.contactPersonId
      ? {
          contactPerson: {
            id: options.contactPersonId,
            objectName: "SevUser",
          },
        }
      : {}),
  });

  return ensureNonEmptyPatch(merged, "order edit");
}

export function buildContactEditPatch(options: {
  patchBody?: unknown;
  name?: string;
  surename?: string;
  familyname?: string;
  name2?: string;
  customerNumber?: string;
  parentId?: string;
  description?: string;
  vatNumber?: string;
  taxNumber?: string;
  bankAccount?: string;
  status?: number;
  exemptVat?: boolean;
}): Record<string, unknown> {
  const patch = extractWrappedPatch(options.patchBody, "contact");
  const merged = stripUndefined({
    ...patch,
    ...(options.name !== undefined ? { name: options.name } : {}),
    ...(options.surename !== undefined ? { surename: options.surename } : {}),
    ...(options.familyname !== undefined
      ? { familyname: options.familyname }
      : {}),
    ...(options.name2 !== undefined ? { name2: options.name2 } : {}),
    ...(options.customerNumber !== undefined
      ? { customerNumber: options.customerNumber }
      : {}),
    ...(options.parentId !== undefined
      ? options.parentId
        ? { parent: { id: options.parentId, objectName: "Contact" } }
        : { parent: null }
      : {}),
    ...(options.description !== undefined
      ? { description: options.description }
      : {}),
    ...(options.vatNumber !== undefined ? { vatNumber: options.vatNumber } : {}),
    ...(options.taxNumber !== undefined ? { taxNumber: options.taxNumber } : {}),
    ...(options.bankAccount !== undefined
      ? { bankAccount: options.bankAccount }
      : {}),
    ...(options.status !== undefined ? { status: options.status } : {}),
    ...(options.exemptVat !== undefined
      ? { exemptVat: options.exemptVat }
      : {}),
  });

  return ensureNonEmptyPatch(merged, "contact edit");
}

export function buildContactAddressEditPatch(options: {
  patchBody?: unknown;
  contactId?: string;
  street?: string;
  zip?: string;
  city?: string;
  countryId?: string;
  categoryId?: string;
  name?: string;
  name2?: string;
  name3?: string;
  name4?: string;
}): Record<string, unknown> {
  const patch = extractWrappedPatch(options.patchBody, "contactAddress");
  const merged = stripUndefined({
    ...patch,
    ...(options.contactId
      ? { contact: { id: options.contactId, objectName: "Contact" } }
      : {}),
    ...(options.street !== undefined ? { street: options.street } : {}),
    ...(options.zip !== undefined ? { zip: options.zip } : {}),
    ...(options.city !== undefined ? { city: options.city } : {}),
    ...(options.countryId !== undefined
      ? {
          country: {
            id: options.countryId,
            objectName: "StaticCountry",
          },
        }
      : {}),
    ...(options.categoryId !== undefined
      ? {
          category: {
            id: options.categoryId,
            objectName: "Category",
          },
        }
      : {}),
    ...(options.name !== undefined ? { name: options.name } : {}),
    ...(options.name2 !== undefined ? { name2: options.name2 } : {}),
    ...(options.name3 !== undefined ? { name3: options.name3 } : {}),
    ...(options.name4 !== undefined ? { name4: options.name4 } : {}),
  });

  return ensureNonEmptyPatch(merged, "contact edit address");
}

export function buildInvoiceRecreatePayload(options: {
  sourceInvoice: Record<string, unknown>;
  sourcePositions: Record<string, unknown>[];
  patchBody?: unknown;
  invoiceDate: string;
  deliveryDate: string;
  label: string;
  header?: string;
  headText?: string;
  footText?: string;
  address?: string;
  contactId?: string;
  customerInternalNote?: string;
  invoiceType?: string;
  timeToPay?: number;
}): Record<string, unknown> {
  const invoicePatchRoot = asRecord(options.patchBody);
  const invoicePatch =
    asRecord(invoicePatchRoot?.invoice) ?? stripUndefined({ ...(invoicePatchRoot ?? {}) });
  const positionPatch = extractArrayFromPatch(options.patchBody, "invoicePosSave");

  const invoice = stripUndefined({
    objectName: "Invoice",
    mapAll: true,
    status: 100,
    invoiceType:
      options.invoiceType ??
      (String(options.sourceInvoice.invoiceType ?? "").trim() || "RE"),
    invoiceDate: options.invoiceDate,
    deliveryDate: options.deliveryDate,
    currency: String(options.sourceInvoice.currency ?? "").trim() || "EUR",
    taxText: String(options.sourceInvoice.taxText ?? "").trim() || "Umsatzsteuer",
    taxType: String(options.sourceInvoice.taxType ?? "").trim() || "default",
    showNet:
      typeof options.sourceInvoice.showNet === "boolean"
        ? options.sourceInvoice.showNet
        : true,
    address: options.address ?? String(options.sourceInvoice.address ?? "").trim(),
    header:
      options.header ??
      `${options.label} ${
        String(options.sourceInvoice.invoiceNumber ?? "").trim() ||
        String(options.sourceInvoice.id ?? "").trim()
      }`,
    headText:
      options.headText ??
      (String(options.sourceInvoice.headText ?? "").trim() || undefined),
    footText:
      options.footText ??
      (String(options.sourceInvoice.footText ?? "").trim() || undefined),
    customerInternalNote:
      options.customerInternalNote ??
      `${options.label} von Rechnung ${
        String(options.sourceInvoice.invoiceNumber ?? "").trim() ||
        String(options.sourceInvoice.id ?? "").trim()
      }`,
    timeToPay:
      options.timeToPay ??
      (typeof options.sourceInvoice.timeToPay === "number"
        ? options.sourceInvoice.timeToPay
        : undefined),
    ...(asRecord(options.sourceInvoice.contactPerson)
      ? { contactPerson: asRecord(options.sourceInvoice.contactPerson) }
      : {}),
    ...(asRecord(options.sourceInvoice.taxRule)
      ? { taxRule: asRecord(options.sourceInvoice.taxRule) }
      : {}),
    ...(asRecord(options.sourceInvoice.addressCountry)
      ? { addressCountry: asRecord(options.sourceInvoice.addressCountry) }
      : {}),
    ...(options.contactId
      ? {
          contact: {
            id: options.contactId,
            objectName: "Contact",
          },
        }
      : asRecord(options.sourceInvoice.contact)
        ? { contact: asRecord(options.sourceInvoice.contact) }
        : {}),
    ...invoicePatch,
  });

  const invoicePosSave =
    positionPatch.length > 0
      ? positionPatch
      : options.sourcePositions.map((position, index) =>
          stripUndefined({
            objectName: "InvoicePos",
            mapAll: true,
            name:
              String(position.name ?? "").trim() || `Position ${index + 1}`,
            text: String(position.text ?? "").trim() || undefined,
            quantity: position.quantity ?? 1,
            price: position.price ?? position.priceNet ?? 0,
            taxRate: position.taxRate ?? 19,
            unity:
              asRecord(position.unity) ?? {
                id: 1,
                objectName: "Unity",
              },
            ...(asRecord(position.part) ? { part: asRecord(position.part) } : {}),
          })
        );

  return {
    invoice,
    invoicePosSave,
  };
}
