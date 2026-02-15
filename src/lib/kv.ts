import { readFile } from "node:fs/promises";

export function parseKeyValuePairs(pairs: string[] = []): Record<string, string> {
  const out: Record<string, string> = {};

  for (const pair of pairs) {
    const index = pair.indexOf("=");
    if (index < 1) {
      throw new Error(`Invalid key=value input: ${pair}`);
    }

    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1);

    if (!key) {
      throw new Error(`Invalid key=value input (empty key): ${pair}`);
    }

    out[key] = value;
  }

  return out;
}

export async function readJsonFile(path: string): Promise<unknown> {
  const content = await readFile(path, "utf8");
  return JSON.parse(content);
}

export function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
