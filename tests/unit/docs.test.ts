import { describe, expect, it } from "vitest";

import { renderReadOperationsMarkdown } from "../../src/lib/docs";
import type { OperationCatalogEntry } from "../../src/lib/types";

describe("docs", () => {
  it("renders a markdown doc with global rules and operation details", () => {
    const catalog: OperationCatalogEntry[] = [
      {
        operationId: "getInvoices",
        method: "GET",
        path: "/Invoice",
        tags: ["Invoice"],
        params: [
          { name: "startDate", in: "query", required: false },
          { name: "endDate", in: "query", required: false },
          { name: "contact[id]", in: "query", required: false },
        ],
        responseCodes: ["200"],
      },
    ];

    const md = renderReadOperationsMarkdown({ catalog, quirks: {} });

    expect(md).toContain("# Sevdesk Read Operations (GET)");
    expect(md).toContain("## Global Usage Rules");
    expect(md).toContain("Quote bracket params in shells");
    expect(md).toContain("### getInvoices");
    expect(md).toContain("Date filters");

    // No required query params: example should be minimal.
    expect(md).toContain("sevdesk-agent read getInvoices --output json");
  });
});

