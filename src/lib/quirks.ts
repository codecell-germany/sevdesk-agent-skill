import quirks from "../data/runtime-quirks.json";

export interface OperationQuirk {
  runtimeRequiredQuery?: string[];
  unwrapObjects?: boolean;
  coerceObjectsArray?: boolean;
  coerceObjectsNumber?: boolean;
  notes?: string;
}

const QUIRKS = quirks as Record<string, OperationQuirk>;

export function getOperationQuirk(operationId: string): OperationQuirk | undefined {
  return QUIRKS[operationId];
}

export function listOperationQuirks(): Record<string, OperationQuirk> {
  return QUIRKS;
}

export function validateRuntimeReadQuery(
  operationId: string,
  query: Record<string, string>
): string[] {
  const quirk = getOperationQuirk(operationId);
  if (!quirk?.runtimeRequiredQuery || quirk.runtimeRequiredQuery.length === 0) {
    return [];
  }

  return quirk.runtimeRequiredQuery.filter((name) => {
    const value = query[name];
    return value === undefined || value === "";
  });
}

export function normalizeReadData(operationId: string, rawData: unknown): {
  normalizedData: unknown;
  warnings: string[];
} {
  const quirk = getOperationQuirk(operationId);
  if (!quirk) {
    return { normalizedData: rawData, warnings: [] };
  }

  const warnings: string[] = [];
  let normalizedData = rawData;

  if (quirk.unwrapObjects) {
    if (
      rawData &&
      typeof rawData === "object" &&
      !Array.isArray(rawData) &&
      Object.prototype.hasOwnProperty.call(rawData, "objects")
    ) {
      normalizedData = (rawData as Record<string, unknown>).objects;
      warnings.push("Applied quirk: unwrapped data.objects");
    }
  }

  if (quirk.coerceObjectsArray) {
    if (
      rawData &&
      typeof rawData === "object" &&
      !Array.isArray(rawData) &&
      Object.prototype.hasOwnProperty.call(rawData, "objects")
    ) {
      const objectsValue = (rawData as Record<string, unknown>).objects;
      if (objectsValue !== undefined && !Array.isArray(objectsValue)) {
        normalizedData = [objectsValue];
        warnings.push("Applied quirk: coerced objects object to array");
      }
    }
  }

  if (quirk.coerceObjectsNumber) {
    if (
      rawData &&
      typeof rawData === "object" &&
      !Array.isArray(rawData) &&
      Object.prototype.hasOwnProperty.call(rawData, "objects")
    ) {
      const objectsValue = (rawData as Record<string, unknown>).objects;
      if (typeof objectsValue === "string" && /^-?\d+(\.\d+)?$/.test(objectsValue)) {
        normalizedData = Number(objectsValue);
        warnings.push("Applied quirk: coerced objects string to number");
      }
    }
  }

  return { normalizedData, warnings };
}
