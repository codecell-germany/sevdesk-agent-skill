import { describe, expect, it } from "vitest";

import {
  applySafePdfQueryDefaults,
  extractBase64PdfContent,
} from "../../src/lib/pdf";

describe("pdf helpers", () => {
  it("applies preventSendBy=1 for PDF operations by default", () => {
    const result = applySafePdfQueryDefaults("orderGetPdf", {}, true);
    expect(result.applied).toBe(true);
    expect(result.query.preventSendBy).toBe("1");
  });

  it("does not override existing preventSendBy", () => {
    const result = applySafePdfQueryDefaults(
      "invoiceGetPdf",
      { preventSendBy: "0" },
      true
    );
    expect(result.applied).toBe(false);
    expect(result.query.preventSendBy).toBe("0");
  });

  it("extracts base64 PDF content from direct and wrapped responses", () => {
    expect(extractBase64PdfContent({ content: "abc" })).toBe("abc");
    expect(extractBase64PdfContent({ objects: { content: "xyz" } })).toBe("xyz");
  });
});
