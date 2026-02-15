import type { OperationCatalogEntry, OperationParam } from "./types";
import type { OperationQuirk } from "./quirks";

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = out.get(key);
    if (existing) {
      existing.push(item);
    } else {
      out.set(key, [item]);
    }
  }
  return out;
}

function mdEscapeInline(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function renderParamRows(params: OperationParam[]): string {
  if (params.length === 0) {
    return "_(no params)_\n";
  }

  const lines = [
    "| Name | In | Required |",
    "|---|---|---|",
    ...params
      .slice()
      .sort((a, b) => {
        if (a.in !== b.in) return a.in.localeCompare(b.in);
        if (a.required !== b.required) return a.required ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((p) => {
        const req = p.required ? "yes" : "no";
        return `| \`${mdEscapeInline(p.name)}\` | \`${p.in}\` | ${req} |`;
      }),
  ];
  return `${lines.join("\n")}\n`;
}

function renderQuirk(quirk: OperationQuirk | undefined): string {
  if (!quirk) return "_(none)_\n";

  const parts: string[] = [];
  if (quirk.runtimeRequiredQuery?.length) {
    parts.push(`- runtimeRequiredQuery: ${quirk.runtimeRequiredQuery.map((q) => `\`${q}\``).join(", ")}`);
  }
  if (quirk.unwrapObjects) parts.push("- unwrapObjects: true");
  if (quirk.coerceObjectsArray) parts.push("- coerceObjectsArray: true");
  if (quirk.coerceObjectsNumber) parts.push("- coerceObjectsNumber: true");
  if (quirk.notes) parts.push(`- notes: ${quirk.notes}`);

  if (parts.length === 0) return "_(none)_\n";
  return `${parts.join("\n")}\n`;
}

function shellQuoteIfNeeded(pair: string): string {
  // Help users with params like contact[id]=123 which can be globbed by shells.
  return /[\[\]\s]/.test(pair) ? `'${pair.replaceAll("'", "'\\''")}'` : pair;
}

function renderExample(entry: OperationCatalogEntry): string {
  const pathParams = entry.params.filter((p) => p.in === "path");
  const queryParams = entry.params.filter((p) => p.in === "query");
  const requiredQueryParams = queryParams.filter((p) => p.required);

  const parts: string[] = ["sevdesk-agent read", entry.operationId];

  for (const p of pathParams) {
    const pair = `${p.name}=<${p.name}>`;
    parts.push("--path", shellQuoteIfNeeded(pair));
  }

  for (const p of requiredQueryParams) {
    const pair = `${p.name}=<value>`;
    parts.push("--query", shellQuoteIfNeeded(pair));
  }

  parts.push("--output", "json");

  const optionalQuery = queryParams
    .filter((p) => !p.required)
    .map((p) => `\`${p.name}\``)
    .sort((a, b) => a.localeCompare(b));

  const lines = [`\`\`\`bash\n${parts.join(" ")}\n\`\`\``];
  if (optionalQuery.length > 0) {
    lines.push(`Optional query params: ${optionalQuery.join(", ")}.`);
  }
  return `${lines.join("\n")}\n`;
}

function renderSpecialNotes(entry: OperationCatalogEntry): string[] {
  const notes: string[] = [];

  // Observed behavior (account-dependent): ISO date strings can yield empty results.
  if (entry.operationId === "getInvoices") {
    notes.push(
      "- Date filters (observed): in our tests, `startDate`/`endDate` work as Unix timestamps (seconds); ISO dates like `2026-01-01` returned empty results. Example: `startDate=1767225600` and `endDate=1769903999` for January 2026."
    );
  }

  if (entry.path.toLowerCase().includes("getpdf")) {
    notes.push(
      "- `*GetPdf` responses are typically JSON wrapped in `data.objects` (often containing `filename`, `mimetype`, and base64 `content`). The CLI does not automatically write files to disk."
    );
    notes.push(
      "- If an endpoint returns a non-JSON binary content-type (pdf/xml/zip/csv), the CLI prints metadata (`binary`, `bytes`, `contentType`) instead of raw bytes."
    );
  }

  return notes;
}

export function renderReadOperationsMarkdown(options: {
  catalog: OperationCatalogEntry[];
  quirks: Record<string, OperationQuirk>;
}): string {
  const readOps = options.catalog.filter((e) => e.method === "GET");

  // Group for easier navigation.
  const byTag = groupBy(readOps, (e) => (e.tags[0] ? e.tags[0] : "Other"));
  const tagNames = [...byTag.keys()].sort((a, b) => a.localeCompare(b));

  const lines: string[] = [];
  lines.push("# Sevdesk Read Operations (GET)");
  lines.push("");
  lines.push(
    "This file is generated from the OpenAPI-derived operation catalog shipped with this CLI (`src/data/operations.json` in the repo, `dist/data/operations.json` in the published package)."
  );
  lines.push("Generator: `sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md`.");
  lines.push("");
  lines.push("## Global Usage Rules");
  lines.push("- Discover operations: `sevdesk-agent ops list --read-only`");
  lines.push("- Inspect params and quirks: `sevdesk-agent op-show <operationId>`");
  lines.push("- Provide params via repeated flags: `--path key=value` and `--query key=value`");
  lines.push("- Quote bracket params in shells: `--query 'contact[id]=123'`");
  lines.push(
    "- If the server returns a non-JSON binary content-type (pdf/xml/zip/csv), the CLI prints metadata, not the raw bytes (see per-op notes)."
  );
  lines.push("");
  lines.push("## Runtime Quirks (Known)");
  lines.push("");
  const quirkIds = Object.keys(options.quirks).sort((a, b) => a.localeCompare(b));
  if (quirkIds.length === 0) {
    lines.push("_(none)_");
  } else {
    lines.push("| OperationId | Quirk |");
    lines.push("|---|---|");
    for (const id of quirkIds) {
      const quirk = options.quirks[id];
      const parts: string[] = [];
      if (quirk.runtimeRequiredQuery?.length) {
        parts.push(`runtimeRequiredQuery=${quirk.runtimeRequiredQuery.join(",")}`);
      }
      if (quirk.unwrapObjects) parts.push("unwrapObjects");
      if (quirk.coerceObjectsArray) parts.push("coerceObjectsArray");
      if (quirk.coerceObjectsNumber) parts.push("coerceObjectsNumber");
      const note = quirk.notes ? ` - ${quirk.notes}` : "";
      lines.push(`| \`${id}\` | ${mdEscapeInline(parts.join(" ") + note)} |`);
    }
  }
  lines.push("");
  lines.push("## Operations By Tag");
  lines.push("");
  for (const tag of tagNames) {
    const items = (byTag.get(tag) ?? []).slice().sort((a, b) => a.operationId.localeCompare(b.operationId));
    lines.push(`### ${tag}`);
    lines.push("");
    lines.push("| OperationId | Path |");
    lines.push("|---|---|");
    for (const op of items) {
      lines.push(`| \`${op.operationId}\` | \`${op.path}\` |`);
    }
    lines.push("");
  }

  lines.push("## Operation Details");
  lines.push("");
  const all = readOps.slice().sort((a, b) => a.operationId.localeCompare(b.operationId));
  for (const entry of all) {
    lines.push(`### ${entry.operationId}`);
    lines.push("");
    lines.push(`- Method: \`${entry.method}\``);
    lines.push(`- Path: \`${entry.path}\``);
    lines.push(`- Tags: ${entry.tags.map((t) => `\`${t}\``).join(", ") || "`(none)`"}`);
    lines.push("");
    lines.push("Params:");
    lines.push("");
    lines.push(renderParamRows(entry.params).trimEnd());
    lines.push("");
    lines.push("Runtime quirk:");
    lines.push("");
    lines.push(renderQuirk(options.quirks[entry.operationId]).trimEnd());
    lines.push("");

    const special = renderSpecialNotes(entry);
    if (special.length > 0) {
      lines.push("Notes:");
      lines.push("");
      lines.push(special.join("\n"));
      lines.push("");
    }

    lines.push("Example:");
    lines.push("");
    lines.push(renderExample(entry).trimEnd());
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function renderReadUsageText(): string {
  return [
    "Read-only usage quick guide:",
    "",
    "1. List GET operations:",
    "   sevdesk-agent ops list --read-only",
    "",
    "2. Inspect a specific operation (params + runtime quirks):",
    "   sevdesk-agent op-show getInvoices",
    "",
    "3. Execute a GET operation:",
    "   sevdesk-agent read bookkeepingSystemVersion --output json",
    "",
    "Notes:",
    "- Provide repeated params via --path/--query flags.",
    "- Quote bracket params in shells: --query 'contact[id]=123'.",
    "- Use `sevdesk-agent docs read-ops` to generate a full markdown reference under knowledge/.",
    "",
  ].join("\n");
}
