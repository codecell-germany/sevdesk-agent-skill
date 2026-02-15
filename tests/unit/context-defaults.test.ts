import { describe, expect, it } from "vitest";

import { DEFAULT_CONTEXT_OPERATION_IDS } from "../../src/lib/context";
import { getOperation } from "../../src/lib/catalog";

describe("default context operation set", () => {
  it("contains only read operations without required path params", () => {
    for (const operationId of DEFAULT_CONTEXT_OPERATION_IDS) {
      const operation = getOperation(operationId);
      expect(operation.method).toBe("GET");

      const requiredPathParams = operation.params.filter(
        (param) => param.in === "path" && param.required
      );

      expect(requiredPathParams.length).toBe(0);
    }
  });
});
