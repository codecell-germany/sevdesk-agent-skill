import type { CliConfig } from "./types";

interface LoadConfigOptions {
  xVersion?: string;
  allowWriteOverride?: boolean;
  requireToken?: boolean;
}

export function loadConfig(options: LoadConfigOptions = {}): CliConfig {
  const token = process.env.SEVDESK_API_TOKEN ?? "";
  const baseUrl =
    process.env.SEVDESK_BASE_URL?.trim() || "https://my.sevdesk.de/api/v1";
  const userAgent =
    process.env.SEVDESK_USER_AGENT?.trim() || "sevdesk-agent-cli/0.1.0";
  const allowWrite =
    options.allowWriteOverride || process.env.SEVDESK_ALLOW_WRITE === "true";

  if (options.requireToken !== false && !token) {
    throw new Error(
      "SEVDESK_API_TOKEN is missing. Export token before calling sevdesk endpoints."
    );
  }

  return {
    baseUrl,
    token,
    userAgent,
    xVersion: options.xVersion,
    allowWrite,
  };
}
