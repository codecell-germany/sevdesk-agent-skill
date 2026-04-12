function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function hasFailedVerification(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => hasFailedVerification(entry));
  }

  const record = asRecord(value);
  if (!record) {
    return false;
  }

  if (hasOwn(record, "ok") && record.ok === false) {
    return true;
  }

  return Object.values(record).some((entry) => hasFailedVerification(entry));
}

