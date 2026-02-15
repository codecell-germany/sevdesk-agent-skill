---
name: sevdesk-agent-cli
description: Sevdesk: Rechnungen/Angebote/Kontakte via read-first CLI (guarded writes) + context snapshots for agent handoffs.
---

# sevdesk-agent-cli

## When to use
Use this skill when tasks involve sevdesk API access from this workspace, especially when an agent must:
- inspect business/accounting state via read-only endpoints,
- execute write endpoints with explicit guard confirmations,
- produce a context snapshot for later agent runs.

## Preconditions
- CLI is runnable, either:
  - from a checkout of this repo: `npm install && npm run build` (then run `sevdesk-agent ...`), or
  - via npx (no local build, run from outside this repo folder): `npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent --help`
- API token is available in env:
  - `SEVDESK_API_TOKEN=<token>`
- Optional env:
  - `SEVDESK_BASE_URL` (default `https://my.sevdesk.de/api/v1`)
  - `SEVDESK_USER_AGENT`
  - `SEVDESK_ALLOW_WRITE=true` (required for write execution)

## Core workflow
1. Discover operation ids:
   - `sevdesk-agent ops list --read-only`
   - `sevdesk-agent op-show <operationId>`
   - `sevdesk-agent ops-quirks`
2. Run read calls first:
   - `sevdesk-agent read <operationId> --query key=value`
   - by default, read responses are normalized for known live API quirks
   - Shell quoting: params like `contact[id]` should be quoted: `--query 'contact[id]=123'`
   - Invoice date filters (observed): in our tests, `getInvoices` works with `startDate`/`endDate` as Unix timestamps (seconds). ISO dates like `2026-01-01` may return empty results.
      Example: `sevdesk-agent read getInvoices --query startDate=1767225600 --query endDate=1769903999 --output json`
   - Generate a full read-op reference doc: `sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md`
3. For write calls, only with explicit confirmation:
   - `sevdesk-agent write <operationId> --execute --confirm-execute yes --allow-write ...`
4. Persist agent handoff context:
   - stdout (default): `sevdesk-agent context snapshot`
   - optional file export: `sevdesk-agent context snapshot --output .context/sevdesk-context-snapshot.json`

## Guardrails
- Default behavior is safe: non-GET calls are blocked unless all write guards are set.
- In production workflows, prefer read-only tests and read-only probes first.
- For `*GetPdf` endpoints, responses are typically JSON wrapped in `data.objects` (often containing `filename`, `mimetype`, and base64 `content`). The CLI does not automatically write files to disk.
- If the server returns a non-JSON binary content-type (pdf/xml/zip/csv), the CLI prints metadata (`binary`, `bytes`, `contentType`) instead of raw bytes.
- Runtime-required query quirks are enforced for selected operations (e.g. `contactCustomerNumberAvailabilityCheck` requires `customerNumber` at runtime).
- Use `op-show` or `ops-quirks` to see operation-specific runtime quirks.

## References
- Command cheat sheet: `references/command-cheatsheet.md`
