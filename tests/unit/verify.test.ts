import { describe, expect, it, vi } from "vitest";

import { runWriteVerification } from "../../src/lib/verify";
import type { SevdeskClient } from "../../src/lib/client";

describe("runWriteVerification", () => {
  it("verifies createContact with expected customer number/parent/address", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: {
            id: "100",
            customerNumber: "7001",
            parent: { id: "88", objectName: "Contact" },
          },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: [{ id: "500" }],
        },
      });

    const client = { request } as unknown as SevdeskClient;
    const verification = await runWriteVerification({
      operationId: "createContact",
      client,
      body: {
        contact: {
          customerNumber: "7001",
          parent: { id: "88", objectName: "Contact" },
        },
      },
      writeResponse: {
        ok: true,
        status: 201,
        headers: {},
        data: { objects: { id: "100" } },
      },
    });

    expect(verification?.type).toBe("createContact");
    expect(verification?.ok).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("returns null for unsupported operation", async () => {
    const client = { request: vi.fn() } as unknown as SevdeskClient;
    const verification = await runWriteVerification({
      operationId: "updateInvoice",
      client,
      body: {},
      writeResponse: {
        ok: true,
        status: 200,
        headers: {},
        data: {},
      },
    });

    expect(verification).toBeNull();
  });
});
