import { describe, expect, it } from "vitest";

import { parseKeyValuePairs } from "../../src/lib/kv";

describe("parseKeyValuePairs", () => {
  it("parses key=value pairs", () => {
    expect(parseKeyValuePairs(["a=1", "b=hello"])) .toEqual({
      a: "1",
      b: "hello",
    });
  });

  it("keeps additional '=' in value", () => {
    expect(parseKeyValuePairs(["query=a=b=c"])) .toEqual({
      query: "a=b=c",
    });
  });

  it("throws on invalid pair", () => {
    expect(() => parseKeyValuePairs(["invalid"])) .toThrow(
      "Invalid key=value input"
    );
  });
});
