import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SevdeskClient } from "../../src/lib/client";
import {
  buildContextSnapshot,
  writeContextSnapshot,
  type ContextSnapshotPayload,
} from "../../src/lib/context";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

describe("context snapshot", () => {
  it("builds payload with truncation and skip reasons", async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "sevdesk-context-"));
    tempDirs.push(rootDir);

    const planDir = path.join(rootDir, "Plans", "alpha");
    await mkdir(planDir, { recursive: true });
    await writeFile(path.join(planDir, "task_plan.md"), "# Plan", "utf8");

    const request = vi.fn(async () => ({
      status: 200,
      ok: true,
      headers: {},
      data: { objects: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    }));

    const client = { request } as unknown as SevdeskClient;

    const payload = await buildContextSnapshot({
      rootDir,
      operationIds: ["getInvoices", "invoiceGetPdf", "createContact"],
      includePlans: true,
      maxObjects: 2,
      client,
    });

    expect(payload.operationIds).toEqual([
      "getInvoices",
      "invoiceGetPdf",
      "createContact",
    ]);
    expect(payload.planning["Plans/alpha/task_plan.md"]).toBe("# Plan");
    expect(request).toHaveBeenCalledTimes(1);

    expect(payload.apiResults[0]).toMatchObject({
      operationId: "getInvoices",
      ok: true,
      status: 200,
    });
    expect(payload.apiResults[0].data).toMatchObject({
      truncated: true,
      originalObjectCount: 3,
      objects: [{ id: 1 }, { id: 2 }],
    });
    expect(payload.apiResults[1]).toMatchObject({
      operationId: "invoiceGetPdf",
      skipped: true,
      reason: "requires-path-params",
    });
    expect(payload.apiResults[2]).toMatchObject({
      operationId: "createContact",
      skipped: true,
      reason: "not-read-operation",
    });
  });

  it("writes payload to file only when requested", async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "sevdesk-context-"));
    tempDirs.push(rootDir);

    const payload: ContextSnapshotPayload = {
      generatedAt: "2026-02-12T00:00:00.000Z",
      projectRoot: rootDir,
      operationIds: ["getInvoices"],
      planning: {},
      apiResults: [{ operationId: "getInvoices", ok: true }],
      notes: {
        readOnly: true,
        maxObjectsPerResponse: 20,
        purpose: "test",
      },
    };

    const outputPath = path.join(rootDir, "snapshot.json");
    await writeContextSnapshot(outputPath, payload);

    const written = JSON.parse(await readFile(outputPath, "utf8")) as ContextSnapshotPayload;
    expect(written).toEqual(payload);
  });
});
