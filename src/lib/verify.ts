import type { SevdeskClient } from "./client";
import type { SevdeskResponse } from "./types";

export interface VerifyCheck {
  check: string;
  ok: boolean;
  detail: string;
}

export interface VerifySummary {
  type: "createContact" | "createOrder";
  id: string;
  checks: VerifyCheck[];
  ok: boolean;
}

export interface ContactVerificationAutoFix {
  attempted: boolean;
  changed: boolean;
  ok: boolean;
  expectedCustomerNumber: string;
  beforeCustomerNumber: string;
  afterCustomerNumber: string;
  status: number | null;
  reason?: string;
  error?: string;
}

export interface VerifyContactWorkflowSummary {
  verification: VerifySummary;
  autoFix: ContactVerificationAutoFix;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toId(value: unknown): string {
  return String(value ?? "").trim();
}

function findPrimaryObject(data: unknown): Record<string, unknown> | null {
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

function extractCreatedId(data: unknown, preferredKeys: string[]): string | null {
  const primary = findPrimaryObject(data);
  if (!primary) {
    return null;
  }

  for (const key of preferredKeys) {
    const candidate = asRecord(primary[key]);
    if (candidate && toId(candidate.id)) {
      return toId(candidate.id);
    }
  }

  if (toId(primary.id)) {
    return toId(primary.id);
  }

  return null;
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

function expectedOrderNetFromBody(body: unknown): number | null {
  const payload = asRecord(body);
  if (!payload) {
    return null;
  }

  const positions = asArray(payload.orderPosSave);
  if (positions.length === 0) {
    return null;
  }

  let total = 0;
  for (const pos of positions) {
    const rec = asRecord(pos);
    if (!rec) {
      return null;
    }
    const quantity = toNumber(rec.quantity);
    const price = toNumber(rec.price);
    if (quantity === null || price === null) {
      return null;
    }
    total += quantity * price;
  }

  return total;
}

function approxEqual(left: number, right: number, eps = 0.01): boolean {
  return Math.abs(left - right) <= eps;
}

interface CreateContactVerificationDetails {
  summary: VerifySummary;
  expectedCustomerNumber: string;
  actualCustomerNumber: string;
}

async function collectCreateContactVerificationDetails(
  client: SevdeskClient,
  body: unknown,
  writeResponse: SevdeskResponse
): Promise<CreateContactVerificationDetails> {
  const contactId =
    extractCreatedId(writeResponse.data, ["contact", "objects"]) ??
    (() => {
      throw new Error("verify(createContact): unable to determine created contact id.");
    })();

  const expectedContact = asRecord(asRecord(body)?.contact);
  const expectedCustomerNumber = String(expectedContact?.customerNumber ?? "").trim();
  const expectedParent = asRecord(expectedContact?.parent);
  const expectedParentId = toId(expectedParent?.id);

  const contactResponse = await client.request({
    method: "GET",
    path: `/Contact/${contactId}`,
  });
  const contactObject = findPrimaryObject(contactResponse.data) ?? {};

  const actualCustomerNumber = toId(contactObject.customerNumber);
  const actualParent = asRecord(contactObject.parent);
  const actualParentId = toId(actualParent?.id);

  const addressesResponse = await client.request({
    method: "GET",
    path: "/ContactAddress",
    query: {
      "contact[id]": contactId,
      "contact[objectName]": "Contact",
    },
  });
  const addressCount = asArray(asRecord(addressesResponse.data)?.objects).length;

  const checks: VerifyCheck[] = [];
  checks.push({
    check: "customerNumber",
    ok: expectedCustomerNumber
      ? expectedCustomerNumber === actualCustomerNumber
      : actualCustomerNumber !== "",
    detail: expectedCustomerNumber
      ? `expected=${expectedCustomerNumber} actual=${actualCustomerNumber || "(empty)"}`
      : `actual=${actualCustomerNumber || "(empty)"}`,
  });

  checks.push({
    check: "parent",
    ok: expectedParentId ? expectedParentId === actualParentId : true,
    detail: expectedParentId
      ? `expectedParentId=${expectedParentId} actualParentId=${actualParentId || "(none)"}`
      : `actualParentId=${actualParentId || "(none)"}`,
  });

  checks.push({
    check: "address",
    ok: addressCount > 0,
    detail: `addressCount=${addressCount}`,
  });

  return {
    summary: {
      type: "createContact",
      id: contactId,
      checks,
      ok: checks.every((check) => check.ok),
    },
    expectedCustomerNumber,
    actualCustomerNumber,
  };
}

async function verifyCreateContact(
  client: SevdeskClient,
  body: unknown,
  writeResponse: SevdeskResponse
): Promise<VerifySummary> {
  const details = await collectCreateContactVerificationDetails(
    client,
    body,
    writeResponse
  );
  return details.summary;
}

async function verifyCreateOrder(
  client: SevdeskClient,
  body: unknown,
  writeResponse: SevdeskResponse
): Promise<VerifySummary> {
  const orderId =
    extractCreatedId(writeResponse.data, ["order", "objects"]) ??
    (() => {
      throw new Error("verify(createOrder): unable to determine created order id.");
    })();

  const expectedOrder = asRecord(asRecord(body)?.order);
  const expectedContactId = toId(asRecord(expectedOrder?.contact)?.id);
  const expectedStatus = toId(expectedOrder?.status);
  const expectedPosCount = asArray(asRecord(body)?.orderPosSave).length;
  const expectedNet = expectedOrderNetFromBody(body);

  const orderResponse = await client.request({
    method: "GET",
    path: `/Order/${orderId}`,
  });
  const orderObject = findPrimaryObject(orderResponse.data) ?? {};
  const actualContactId = toId(asRecord(orderObject.contact)?.id);
  const actualStatus = toId(orderObject.status);
  const actualSumNet = toNumber(orderObject.sumNet);

  const positionsResponse = await client.request({
    method: "GET",
    path: `/Order/${orderId}/getPositions`,
  });
  const actualPosCount = asArray(asRecord(positionsResponse.data)?.objects).length;

  const checks: VerifyCheck[] = [];
  checks.push({
    check: "order.contact.id",
    ok: expectedContactId ? expectedContactId === actualContactId : actualContactId !== "",
    detail: expectedContactId
      ? `expected=${expectedContactId} actual=${actualContactId || "(empty)"}`
      : `actual=${actualContactId || "(empty)"}`,
  });

  checks.push({
    check: "positions",
    ok: expectedPosCount > 0 ? actualPosCount >= expectedPosCount : actualPosCount > 0,
    detail: `expected>=${expectedPosCount} actual=${actualPosCount}`,
  });

  checks.push({
    check: "status",
    ok: expectedStatus ? expectedStatus === actualStatus : actualStatus !== "",
    detail: expectedStatus
      ? `expected=${expectedStatus} actual=${actualStatus || "(empty)"}`
      : `actual=${actualStatus || "(empty)"}`,
  });

  checks.push({
    check: "sumNet",
    ok:
      expectedNet === null || actualSumNet === null
        ? true
        : approxEqual(expectedNet, actualSumNet),
    detail:
      expectedNet === null || actualSumNet === null
        ? `expected=${expectedNet ?? "(n/a)"} actual=${actualSumNet ?? "(n/a)"}`
        : `expected=${expectedNet.toFixed(2)} actual=${actualSumNet.toFixed(2)}`,
  });

  return {
    type: "createOrder",
    id: orderId,
    checks,
    ok: checks.every((check) => check.ok),
  };
}

export async function runWriteVerification(options: {
  operationId: string;
  client: SevdeskClient;
  body: unknown;
  writeResponse: SevdeskResponse;
}): Promise<VerifySummary | null> {
  if (options.operationId === "createContact") {
    return verifyCreateContact(options.client, options.body, options.writeResponse);
  }

  if (options.operationId === "createOrder") {
    return verifyCreateOrder(options.client, options.body, options.writeResponse);
  }

  return null;
}

export async function verifyAndMaybeFixCreateContact(options: {
  client: SevdeskClient;
  body: unknown;
  writeResponse: SevdeskResponse;
  autoFixCustomerNumber: boolean;
}): Promise<VerifyContactWorkflowSummary> {
  let details = await collectCreateContactVerificationDetails(
    options.client,
    options.body,
    options.writeResponse
  );

  const autoFix: ContactVerificationAutoFix = {
    attempted: false,
    changed: false,
    ok: true,
    expectedCustomerNumber: details.expectedCustomerNumber,
    beforeCustomerNumber: details.actualCustomerNumber,
    afterCustomerNumber: details.actualCustomerNumber,
    status: null,
  };

  if (!options.autoFixCustomerNumber) {
    autoFix.reason = "auto-fix disabled";
    return { verification: details.summary, autoFix };
  }

  if (!details.expectedCustomerNumber) {
    autoFix.reason = "no expected customerNumber in payload";
    return { verification: details.summary, autoFix };
  }

  if (details.expectedCustomerNumber === details.actualCustomerNumber) {
    autoFix.reason = "customerNumber already matches";
    return { verification: details.summary, autoFix };
  }

  autoFix.attempted = true;

  const updateResponse = await options.client.request({
    method: "PUT",
    path: `/Contact/${details.summary.id}`,
    body: {
      contact: {
        id: details.summary.id,
        objectName: "Contact",
        customerNumber: details.expectedCustomerNumber,
      },
    },
  });
  autoFix.status = updateResponse.status;

  if (!updateResponse.ok) {
    autoFix.ok = false;
    autoFix.error = `updateContact failed with status ${updateResponse.status}`;
    return { verification: details.summary, autoFix };
  }

  details = await collectCreateContactVerificationDetails(
    options.client,
    options.body,
    options.writeResponse
  );
  autoFix.afterCustomerNumber = details.actualCustomerNumber;
  autoFix.changed = details.actualCustomerNumber === details.expectedCustomerNumber;
  autoFix.ok = autoFix.changed;
  if (!autoFix.changed) {
    autoFix.error = "customerNumber mismatch persists after updateContact";
  }

  return { verification: details.summary, autoFix };
}
