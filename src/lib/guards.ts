import type { HttpMethod } from "./types";

interface WriteGuardInput {
  method: HttpMethod;
  execute?: boolean;
  confirmExecute?: string;
  allowWrite: boolean;
}

export function assertWriteAllowed(input: WriteGuardInput): void {
  // Guard only destructive operations.
  if (input.method !== "DELETE") {
    return;
  }

  if (!input.execute) {
    throw new Error(
      "Delete blocked: add --execute for DELETE operations."
    );
  }

  if (input.confirmExecute !== "yes") {
    throw new Error(
      "Delete blocked: add --confirm-execute yes to confirm DELETE operations."
    );
  }

  if (!input.allowWrite) {
    throw new Error(
      "Delete blocked: set SEVDESK_ALLOW_WRITE=true (or --allow-write) for DELETE operations."
    );
  }
}
