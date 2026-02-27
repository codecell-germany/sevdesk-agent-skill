import { describe, expect, it, vi } from "vitest";

import {
  runWriteVerification,
  verifyAndMaybeFixCreateContact,
} from "../../src/lib/verify";
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

  it("can auto-fix createContact customerNumber mismatch", async () => {
    const request = vi
      .fn()
      // initial verification read: /Contact/{id}
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: {
            id: "100",
            customerNumber: "7000",
            parent: { id: "88", objectName: "Contact" },
          },
        },
      })
      // initial verification read: /ContactAddress
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: { objects: [{ id: "500" }] },
      })
      // auto-fix write: PUT /Contact/{id}
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: { objects: { id: "100" } },
      })
      // re-verify read: /Contact/{id}
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
      // re-verify read: /ContactAddress
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: { objects: [{ id: "500" }] },
      });

    const client = { request } as unknown as SevdeskClient;
    const result = await verifyAndMaybeFixCreateContact({
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
      autoFixCustomerNumber: true,
    });

    expect(result.verification.ok).toBe(true);
    expect(result.autoFix.attempted).toBe(true);
    expect(result.autoFix.changed).toBe(true);
    expect(result.autoFix.ok).toBe(true);
    expect(result.autoFix.afterCustomerNumber).toBe("7001");
    expect(request).toHaveBeenCalledTimes(5);
  });

  it("skips auto-fix when disabled", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: {
          objects: {
            id: "100",
            customerNumber: "7000",
            parent: { id: "88", objectName: "Contact" },
          },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {},
        data: { objects: [{ id: "500" }] },
      });

    const client = { request } as unknown as SevdeskClient;
    const result = await verifyAndMaybeFixCreateContact({
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
      autoFixCustomerNumber: false,
    });

    expect(result.verification.ok).toBe(false);
    expect(result.autoFix.attempted).toBe(false);
    expect(result.autoFix.reason).toContain("disabled");
    expect(request).toHaveBeenCalledTimes(2);
  });
});
