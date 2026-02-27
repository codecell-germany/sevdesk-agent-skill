import { describe, expect, it } from "vitest";

import { assertWriteAllowed } from "../../src/lib/guards";

describe("assertWriteAllowed", () => {
  it("allows GET without guards", () => {
    expect(() =>
      assertWriteAllowed({ method: "GET", allowWrite: false })
    ).not.toThrow();
  });

  it("allows POST without guards", () => {
    expect(() =>
      assertWriteAllowed({ method: "POST", allowWrite: true })
    ).not.toThrow();
  });

  it("allows PUT without guards", () => {
    expect(() =>
      assertWriteAllowed({
        method: "PUT",
        allowWrite: false,
      })
    ).not.toThrow();
  });

  it("blocks DELETE without execute", () => {
    expect(() =>
      assertWriteAllowed({ method: "DELETE", allowWrite: true })
    ).toThrow("Delete blocked: add --execute");
  });

  it("blocks DELETE without confirm yes", () => {
    expect(() =>
      assertWriteAllowed({
        method: "DELETE",
        execute: true,
        confirmExecute: "no",
        allowWrite: true,
      })
    ).toThrow("--confirm-execute yes");
  });

  it("blocks DELETE when allowWrite is false", () => {
    expect(() =>
      assertWriteAllowed({
        method: "DELETE",
        execute: true,
        confirmExecute: "yes",
        allowWrite: false,
      })
    ).toThrow("SEVDESK_ALLOW_WRITE=true");
  });

  it("allows DELETE with all guards", () => {
    expect(() =>
      assertWriteAllowed({
        method: "DELETE",
        execute: true,
        confirmExecute: "yes",
        allowWrite: true,
      })
    ).not.toThrow();
  });
});
