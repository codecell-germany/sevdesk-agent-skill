import { describe, expect, it } from "vitest";

import { assertWriteAllowed } from "../../src/lib/guards";

describe("assertWriteAllowed", () => {
  it("allows GET without execute", () => {
    expect(() =>
      assertWriteAllowed({ method: "GET", allowWrite: false })
    ).not.toThrow();
  });

  it("blocks write without execute", () => {
    expect(() =>
      assertWriteAllowed({ method: "POST", allowWrite: true })
    ).toThrow("Write blocked: add --execute");
  });

  it("blocks write without confirm yes", () => {
    expect(() =>
      assertWriteAllowed({
        method: "PUT",
        execute: true,
        confirmExecute: "no",
        allowWrite: true,
      })
    ).toThrow("--confirm-execute yes");
  });

  it("blocks write when allowWrite is false", () => {
    expect(() =>
      assertWriteAllowed({
        method: "DELETE",
        execute: true,
        confirmExecute: "yes",
        allowWrite: false,
      })
    ).toThrow("SEVDESK_ALLOW_WRITE=true");
  });

  it("allows write with all guards", () => {
    expect(() =>
      assertWriteAllowed({
        method: "PATCH",
        execute: true,
        confirmExecute: "yes",
        allowWrite: true,
      })
    ).not.toThrow();
  });
});
