import type { CliConfig, SevdeskRequest, SevdeskResponse } from "./types";

function buildUrl(baseUrl: string, path: string, query: Record<string, string>) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.append(key, value);
  }

  return url;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  if (
    contentType.includes("application/pdf") ||
    contentType.includes("application/xml") ||
    contentType.includes("application/zip") ||
    contentType.includes("text/csv")
  ) {
    const buffer = await response.arrayBuffer();
    return {
      binary: true,
      bytes: buffer.byteLength,
      contentType,
    };
  }

  return response.text();
}

export class SevdeskClient {
  constructor(private readonly config: CliConfig) {}

  async request(req: SevdeskRequest): Promise<SevdeskResponse> {
    const url = buildUrl(this.config.baseUrl, req.path, req.query ?? {});

    const headers: Record<string, string> = {
      Authorization: this.config.token,
      "User-Agent": this.config.userAgent,
      Accept: "application/json",
      ...(req.headers ?? {}),
    };

    if (this.config.xVersion) {
      headers["X-Version"] = this.config.xVersion;
    }

    let body: string | undefined;
    if (req.body !== undefined) {
      body = JSON.stringify(req.body);
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const data = await parseResponseBody(response);

    return {
      ok: response.ok,
      status: response.status,
      headers: headersToRecord(response.headers),
      data,
    };
  }
}
