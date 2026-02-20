import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function shouldAutoProtectPdf(operationId: string): boolean {
  return operationId === "orderGetPdf" || operationId === "invoiceGetPdf";
}

export function applySafePdfQueryDefaults(
  operationId: string,
  query: Record<string, string>,
  safePdfEnabled: boolean
): { query: Record<string, string>; applied: boolean } {
  if (!safePdfEnabled || !shouldAutoProtectPdf(operationId)) {
    return { query, applied: false };
  }

  if (query.preventSendBy !== undefined && query.preventSendBy !== "") {
    return { query, applied: false };
  }

  return {
    query: {
      ...query,
      preventSendBy: "1",
    },
    applied: true,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function extractBase64PdfContent(value: unknown): string | null {
  const top = asRecord(value);
  if (!top) {
    return null;
  }

  // normalized read output often returns the pdf object directly.
  const directContent = top.content;
  if (typeof directContent === "string" && directContent.trim() !== "") {
    return directContent;
  }

  const objects = asRecord(top.objects);
  if (objects?.content && typeof objects.content === "string") {
    return objects.content;
  }

  return null;
}

export async function decodePdfToFile(
  targetPath: string,
  base64Content: string
): Promise<string> {
  const outputPath = path.resolve(process.cwd(), targetPath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  const buffer = Buffer.from(base64Content, "base64");
  await writeFile(outputPath, buffer);
  return outputPath;
}
