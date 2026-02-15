export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface OperationParam {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required: boolean;
  description?: string;
}

export interface OperationCatalogEntry {
  operationId: string;
  method: HttpMethod;
  path: string;
  tags: string[];
  params: OperationParam[];
  responseCodes: string[];
}

export interface SevdeskRequest {
  method: HttpMethod;
  path: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface SevdeskResponse {
  ok: boolean;
  status: number;
  headers: Record<string, string>;
  data: unknown;
}

export interface CliConfig {
  baseUrl: string;
  token: string;
  userAgent: string;
  xVersion?: string;
  allowWrite: boolean;
}
