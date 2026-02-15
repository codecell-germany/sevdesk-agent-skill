import operations from "../data/operations.json";
import type { OperationCatalogEntry } from "./types";

const CATALOG = operations as OperationCatalogEntry[];
const BY_ID = new Map(CATALOG.map((entry) => [entry.operationId, entry]));

export function getCatalog(): OperationCatalogEntry[] {
  return CATALOG;
}

export function getOperation(operationId: string): OperationCatalogEntry {
  const entry = BY_ID.get(operationId);
  if (!entry) {
    throw new Error(`Unknown operationId: ${operationId}`);
  }
  return entry;
}

export function listOperations(filters: {
  method?: string;
  tag?: string;
  readOnly?: boolean;
}): OperationCatalogEntry[] {
  const methodFilter = filters.method?.toUpperCase();
  const tagFilter = filters.tag?.toLowerCase();

  return CATALOG.filter((entry) => {
    if (methodFilter && entry.method !== methodFilter) {
      return false;
    }
    if (filters.readOnly && entry.method !== "GET") {
      return false;
    }
    if (tagFilter) {
      return entry.tags.some((tag) => tag.toLowerCase() === tagFilter);
    }
    return true;
  });
}

export function isReadOperation(operationId: string): boolean {
  return getOperation(operationId).method === "GET";
}
