interface ValidationResult {
  errors: string[];
  warnings: string[];
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

export function validateWritePreflight(
  operationId: string,
  body: unknown
): ValidationResult {
  if (operationId === "createContact") {
    return validateCreateContact(body);
  }

  if (operationId === "createOrder") {
    return validateCreateOrder(body);
  }

  return { errors: [], warnings: [] };
}
