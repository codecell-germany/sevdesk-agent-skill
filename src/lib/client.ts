import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  CliConfig,
  SevdeskFormFile,
  SevdeskRequest,
  SevdeskResponse,
} from "./types";

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

function guessContentType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".xml":
      return "application/xml";
    case ".csv":
      return "text/csv";
    case ".zip":
      return "application/zip";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}

function isFormFile(value: string | SevdeskFormFile): value is SevdeskFormFile {
  return typeof value === "object" && value !== null && "filePath" in value;
}

async function buildMultipartFormData(
  input: Record<string, string | SevdeskFormFile>
): Promise<FormData> {
  const formData = new FormData();

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      formData.append(key, value);
      continue;
    }

    if (!isFormFile(value)) {
      continue;
    }

    const fileBuffer = await readFile(value.filePath);
    const filename = value.filename || path.basename(value.filePath);
    const contentType = value.contentType || guessContentType(filename);
    const blob = new Blob([fileBuffer], { type: contentType });
    formData.append(key, blob, filename);
  }

  return formData;
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

    if (req.body !== undefined && req.formData !== undefined) {
      throw new Error("SevdeskClient.request: use either body or formData, not both.");
    }

    let body: BodyInit | undefined;
    if (req.body !== undefined) {
      body = JSON.stringify(req.body);
      headers["Content-Type"] = "application/json";
    } else if (req.formData !== undefined) {
      body = await buildMultipartFormData(req.formData);
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
