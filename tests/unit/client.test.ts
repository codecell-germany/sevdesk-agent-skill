import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { SevdeskClient } from "../../src/lib/client";

describe("SevdeskClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends JSON bodies with application/json", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ objects: { id: "1" } }), {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new SevdeskClient({
      baseUrl: "https://my.sevdesk.de/api/v1",
      token: "token",
      userAgent: "test-agent",
      allowWrite: false,
    });

    await client.request({
      method: "POST",
      path: "/Contact",
      body: { contact: { name: "Example" } },
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json"
    );
    expect(init.body).toBe(JSON.stringify({ contact: { name: "Example" } }));
  });

  it("sends multipart form-data bodies without forcing JSON content-type", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "sevdesk-client-"));
    const filePath = path.join(tempDir, "voucher.pdf");
    await writeFile(filePath, "pdf-bytes");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ objects: { filename: "hash.pdf" } }), {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new SevdeskClient({
      baseUrl: "https://my.sevdesk.de/api/v1",
      token: "token",
      userAgent: "test-agent",
      allowWrite: false,
    });

    await client.request({
      method: "POST",
      path: "/Voucher/Factory/uploadTempFile",
      formData: {
        file: { filePath },
        label: "voucher",
      },
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
    const body = init.body as FormData;
    expect(body.get("label")).toBe("voucher");
    expect(body.get("file")).toBeInstanceOf(File);

    await rm(tempDir, { recursive: true, force: true });
  });
});
