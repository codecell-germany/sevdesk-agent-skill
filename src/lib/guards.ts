import type { HttpMethod } from "./types";

interface WriteGuardInput {
  method: HttpMethod;
  execute?: boolean;
  confirmExecute?: string;
  allowWrite: boolean;
}

export function assertWriteAllowed(input: WriteGuardInput): void {
  if (input.method === "GET") {
    return;
  }

  if (!input.execute) {
    throw new Error(
      "Write blocked: add --execute to allow non-read operations."
    );
  }

  if (input.confirmExecute !== "yes") {
    throw new Error(
      'Write blocked: add --confirm-execute yes to confirm non-read operations.'
    );
  }

  if (!input.allowWrite) {
    throw new Error(
      "Write blocked: set SEVDESK_ALLOW_WRITE=true (or --allow-write) for non-read operations."
    );
  }
}
