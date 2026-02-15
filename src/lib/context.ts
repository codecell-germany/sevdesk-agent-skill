import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getOperation } from "./catalog";
import { resolvePathTemplate } from "./path";
import { toPrettyJson } from "./kv";
import type { SevdeskClient } from "./client";

export const DEFAULT_CONTEXT_OPERATION_IDS = [
  "bookkeepingSystemVersion",
  "getCheckAccounts",
  "getTransactions",
  "getContacts",
  "getParts",
  "getOrders",
  "getInvoices",
  "getCreditNotes",
  "getVouchers",
  "getTags",
  "forAllAccounts",
] as const;

interface SnapshotOptions {
  rootDir: string;
  operationIds: string[];
  includePlans: boolean;
  maxObjects: number;
  client: SevdeskClient;
}

export interface ContextSnapshotPayload {
  generatedAt: string;
  projectRoot: string;
  operationIds: string[];
  planning: Record<string, string>;
  apiResults: Array<Record<string, unknown>>;
  notes: {
    readOnly: boolean;
    maxObjectsPerResponse: number;
    purpose: string;
  };
}

function truncateObjects(data: unknown, maxObjects: number): unknown {
  if (!data || typeof data !== "object") {
    return data;
  }

  const candidate = data as { objects?: unknown[] };
  if (Array.isArray(candidate.objects) && candidate.objects.length > maxObjects) {
    return {
      ...candidate,
      objects: candidate.objects.slice(0, maxObjects),
      truncated: true,
      originalObjectCount: candidate.objects.length,
    };
  }

  return data;
}

async function readPlanningFiles(rootDir: string): Promise<Record<string, string>> {
  const plansRoot = path.join(rootDir, "Plans");
  const out: Record<string, string> = {};

  let entries: string[] = [];
  try {
    entries = await readdir(plansRoot);
  } catch {
    return out;
  }

  for (const entry of entries) {
    const dir = path.join(plansRoot, entry);
    for (const fileName of ["task_plan.md", "findings.md", "progress.md"]) {
      const filePath = path.join(dir, fileName);
      try {
        out[path.relative(rootDir, filePath)] = await readFile(filePath, "utf8");
      } catch {
        // ignore missing files
      }
    }
  }

  return out;
}

export async function buildContextSnapshot(
  options: SnapshotOptions
): Promise<ContextSnapshotPayload> {
  const apiResults: Array<Record<string, unknown>> = [];

  for (const operationId of options.operationIds) {
    const operation = getOperation(operationId);

    if (operation.method !== "GET") {
      apiResults.push({
        operationId,
        skipped: true,
        reason: "not-read-operation",
      });
      continue;
    }

    const requiredPathParams = operation.params.filter(
      (param) => param.in === "path" && param.required
    );

    if (requiredPathParams.length > 0) {
      apiResults.push({
        operationId,
        skipped: true,
        reason: "requires-path-params",
        requiredPathParams: requiredPathParams.map((param) => param.name),
      });
      continue;
    }

    const resolvedPath = resolvePathTemplate(operation.path, {});

    try {
      const response = await options.client.request({
        method: "GET",
        path: resolvedPath,
      });

      apiResults.push({
        operationId,
        method: operation.method,
        path: operation.path,
        status: response.status,
        ok: response.ok,
        data: truncateObjects(response.data, options.maxObjects),
      });
    } catch (error) {
      apiResults.push({
        operationId,
        method: operation.method,
        path: operation.path,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const planning = options.includePlans
    ? await readPlanningFiles(options.rootDir)
    : {};

  const payload: ContextSnapshotPayload = {
    generatedAt: new Date().toISOString(),
    projectRoot: options.rootDir,
    operationIds: options.operationIds,
    planning,
    apiResults,
    notes: {
      readOnly: true,
      maxObjectsPerResponse: options.maxObjects,
      purpose:
        "Agent-context snapshot for follow-up planning, automation, and deterministic continuation.",
    },
  };

  return payload;
}

export async function writeContextSnapshot(
  outputPath: string,
  payload: ContextSnapshotPayload
): Promise<void> {
  await writeFile(outputPath, toPrettyJson(payload), "utf8");
}
