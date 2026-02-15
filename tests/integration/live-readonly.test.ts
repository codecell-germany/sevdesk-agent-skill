import { describe, expect, it } from "vitest";

import { SevdeskClient } from "../../src/lib/client";
import { loadConfig } from "../../src/lib/config";

const canRunLive =
  process.env.SEVDESK_LIVE_TESTS === "1" && !!process.env.SEVDESK_API_TOKEN;

if (!canRunLive) {
  describe.skip("live readonly sevdesk tests", () => {
    it("requires SEVDESK_LIVE_TESTS=1 and SEVDESK_API_TOKEN", () => {
      expect(true).toBe(true);
    });
  });
} else {
  describe("live readonly sevdesk tests", () => {
    const client = new SevdeskClient(loadConfig({ requireToken: true }));

    it("reads bookkeeping system version", async () => {
      const result = await client.request({
        method: "GET",
        path: "/Tools/bookkeepingSystemVersion",
      });

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
    });

    it("reads invoices list", async () => {
      const result = await client.request({
        method: "GET",
        path: "/Invoice",
      });

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
    });
  });
}
