#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";

import { getCatalog, getOperation, listOperations } from "./lib/catalog";
import { SevdeskClient } from "./lib/client";
import { loadConfig } from "./lib/config";
import {
  buildContextSnapshot,
  writeContextSnapshot,
  DEFAULT_CONTEXT_OPERATION_IDS,
} from "./lib/context";
import { assertWriteAllowed } from "./lib/guards";
import { parseKeyValuePairs, readJsonFile, toPrettyJson } from "./lib/kv";
import { resolvePathTemplate } from "./lib/path";
import {
  getOperationQuirk,
  listOperationQuirks,
  normalizeReadData,
  validateRuntimeReadQuery,
} from "./lib/quirks";
import type { SevdeskResponse } from "./lib/types";

function fail(message: string): never {
  throw new Error(message);
}

async function printResponse(
  response: SevdeskResponse,
  outputMode: "pretty" | "json" | "raw",
  savePath?: string,
  extras: Record<string, unknown> = {}
): Promise<void> {
  const payload = {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    data: response.data,
    ...extras,
  };

  if (savePath) {
    await writeFile(savePath, toPrettyJson(payload), "utf8");
  }

  if (outputMode === "json") {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  if (outputMode === "raw") {
    if (typeof response.data === "string") {
      process.stdout.write(`${response.data}\n`);
      return;
    }
    process.stdout.write(`${JSON.stringify(response.data)}\n`);
    return;
  }

  process.stdout.write(`${toPrettyJson(payload)}\n`);
}

const program = new Command();

program
  .name("sevdesk-agent")
  .description("Agent-focused sevdesk CLI (TypeScript)")
  .version("0.1.0");

program
  .command("ops")
  .description("Operation catalog helpers")
  .command("list")
  .description("List known operations from the OpenAPI-derived catalog")
  .option("--method <method>", "Filter by HTTP method, e.g. GET")
  .option("--tag <tag>", "Filter by tag/domain, e.g. Invoice")
  .option("--read-only", "Only show GET operations", false)
  .option("--json", "Output as JSON", false)
  .action((opts) => {
    const items = listOperations({
      method: opts.method,
      tag: opts.tag,
      readOnly: opts.readOnly,
    });

    if (opts.json) {
      process.stdout.write(`${JSON.stringify(items)}\n`);
      return;
    }

    const lines = items.map(
      (entry) =>
        `${entry.operationId}\t${entry.method}\t${entry.path}\t${entry.tags.join(",")}`
    );

    process.stdout.write(`${lines.join("\n")}\n`);
  });

program
  .command("ops-quirks")
  .description("List runtime quirks learned from live API behavior")
  .option("--json", "Output as JSON", false)
  .action((opts) => {
    const quirks = listOperationQuirks();

    if (opts.json) {
      process.stdout.write(`${JSON.stringify(quirks)}\n`);
      return;
    }

    const lines = Object.entries(quirks).map(([operationId, quirk]) => {
      const parts = [];
      if (quirk.runtimeRequiredQuery?.length) {
        parts.push(`runtimeRequiredQuery=${quirk.runtimeRequiredQuery.join(",")}`);
      }
      if (quirk.unwrapObjects) {
        parts.push("unwrapObjects=true");
      }
      if (quirk.coerceObjectsArray) {
        parts.push("coerceObjectsArray=true");
      }
      if (quirk.coerceObjectsNumber) {
        parts.push("coerceObjectsNumber=true");
      }
      return `${operationId}\t${parts.join(" ")}\t${quirk.notes ?? ""}`;
    });

    process.stdout.write(`${lines.join("\n")}\n`);
  });

program
  .command("op-show <operationId>")
  .description("Show operation details")
  .action((operationId: string) => {
    const operation = getOperation(operationId);
    const quirk = getOperationQuirk(operationId) ?? null;
    process.stdout.write(`${toPrettyJson({ ...operation, runtimeQuirk: quirk })}\n`);
  });

program
  .command("read <operationId>")
  .description("Execute a read-only (GET) operation by operationId")
  .option("--path <pair...>", "Path params as key=value")
  .option("--query <pair...>", "Query params as key=value")
  .option("--header <pair...>", "Additional headers as key=value")
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--normalize", "Apply known runtime response normalization", true)
  .option("--no-normalize", "Disable response normalization")
  .option("--output <mode>", "pretty|json|raw", "pretty")
  .option("--save <file>", "Save full response to file")
  .action(async (operationId: string, opts) => {
    const operation = getOperation(operationId);
    if (operation.method !== "GET") {
      fail(`Operation ${operationId} is ${operation.method}, use write command instead.`);
    }

    const pathParams = parseKeyValuePairs(opts.path ?? []);
    const queryParams = parseKeyValuePairs(opts.query ?? []);
    const headerParams = parseKeyValuePairs(opts.header ?? []);
    const missingRuntimeQuery = validateRuntimeReadQuery(operationId, queryParams);
    if (missingRuntimeQuery.length > 0) {
      fail(
        `Missing runtime-required query params for ${operationId}: ${missingRuntimeQuery.join(
          ", "
        )}`
      );
    }

    const resolvedPath = resolvePathTemplate(operation.path, pathParams);
    const config = loadConfig({ xVersion: opts.xVersion });
    const client = new SevdeskClient(config);

    const response = await client.request({
      method: "GET",
      path: resolvedPath,
      query: queryParams,
      headers: headerParams,
    });

    if (!opts.normalize) {
      await printResponse(response, opts.output, opts.save);
      return;
    }

    const normalization = normalizeReadData(operationId, response.data);
    await printResponse(response, opts.output, opts.save, {
      normalizedData: normalization.normalizedData,
      normalizationWarnings: normalization.warnings,
      runtimeQuirk: getOperationQuirk(operationId) ?? null,
    });
  });

program
  .command("write <operationId>")
  .description("Execute a non-GET operation with explicit safety guards")
  .option("--path <pair...>", "Path params as key=value")
  .option("--query <pair...>", "Query params as key=value")
  .option("--header <pair...>", "Additional headers as key=value")
  .option("--body-file <file>", "JSON file for request body")
  .option("--body-json <json>", "Inline JSON request body")
  .option("--x-version <version>", "Optional sevdesk X-Version header")
  .option("--execute", "Enable non-read execution", false)
  .option("--confirm-execute <value>", "Must be 'yes'", "")
  .option("--allow-write", "Allow writes without env flag", false)
  .option("--output <mode>", "pretty|json|raw", "pretty")
  .option("--save <file>", "Save full response to file")
  .action(async (operationId: string, opts) => {
    const operation = getOperation(operationId);

    const config = loadConfig({
      xVersion: opts.xVersion,
      allowWriteOverride: Boolean(opts.allowWrite),
    });

    assertWriteAllowed({
      method: operation.method,
      execute: Boolean(opts.execute),
      confirmExecute: opts.confirmExecute,
      allowWrite: config.allowWrite,
    });

    const pathParams = parseKeyValuePairs(opts.path ?? []);
    const queryParams = parseKeyValuePairs(opts.query ?? []);
    const headerParams = parseKeyValuePairs(opts.header ?? []);
    const resolvedPath = resolvePathTemplate(operation.path, pathParams);

    let body: unknown = undefined;
    if (opts.bodyFile) {
      body = await readJsonFile(opts.bodyFile);
    }
    if (opts.bodyJson) {
      body = JSON.parse(opts.bodyJson);
    }

    const client = new SevdeskClient(config);
    const response = await client.request({
      method: operation.method,
      path: resolvedPath,
      query: queryParams,
      headers: headerParams,
      body,
    });

    await printResponse(response, opts.output, opts.save);
  });

program
  .command("context")
  .description("Context utilities for agent workflows")
  .command("snapshot")
  .description("Capture read-only API + planning context (stdout by default)")
  .option("--op <operationId...>", "Specific read operationIds to include")
  .option("--include-default", "Include standard context operation set", true)
  .option("--no-include-default", "Disable default operation set")
  .option("--include-plans", "Embed task_plan/findings/progress from Plans/", true)
  .option("--no-include-plans", "Skip plan markdown embedding")
  .option("--max-objects <n>", "Max objects per list response", "20")
  .option("--output <file>", "Optional output file path")
  .action(async (opts) => {
    const selected = new Set<string>();

    if (opts.includeDefault) {
      for (const op of DEFAULT_CONTEXT_OPERATION_IDS) {
        selected.add(op);
      }
    }

    for (const op of opts.op ?? []) {
      selected.add(op);
    }

    if (selected.size === 0) {
      fail("No operations selected. Use --include-default or --op.");
    }

    const maxObjects = Number.parseInt(opts.maxObjects, 10);
    if (!Number.isFinite(maxObjects) || maxObjects < 1) {
      fail("--max-objects must be an integer >= 1.");
    }

    const config = loadConfig();
    const client = new SevdeskClient(config);

    const payload = await buildContextSnapshot({
      rootDir: process.cwd(),
      operationIds: [...selected],
      includePlans: Boolean(opts.includePlans),
      maxObjects,
      client,
    });

    if (opts.output) {
      const outputPath = path.resolve(process.cwd(), opts.output);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeContextSnapshot(outputPath, payload);

      process.stdout.write(
        `${toPrettyJson({
          snapshot: outputPath,
          operationCount: selected.size,
          catalogSize: getCatalog().length,
        })}\n`
      );
      return;
    }

    process.stdout.write(`${toPrettyJson(payload)}\n`);
  });

program.parseAsync(process.argv).catch((error) => {
  process.stderr.write(`[sevdesk-agent] ${error.message}\n`);
  process.exitCode = 1;
});
