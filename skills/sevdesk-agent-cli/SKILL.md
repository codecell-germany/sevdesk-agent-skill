---
name: sevdesk-agent-cli
description: "Sevdesk: invoices/quotes/contacts via a read-first CLI (DELETE-guarded) + context snapshots for agent handoffs."
---

# sevdesk-agent-cli

## When to use
Use this skill when tasks involve sevdesk API access from this workspace, especially when an agent must:
- inspect business/accounting state via read-only endpoints,
- execute write endpoints quickly while keeping DELETE operations explicitly guarded,
- produce a context snapshot for later agent runs.

## Preconditions
- CLI is runnable, either:
  - from a checkout of this repo: `npm install && npm run build` (then run `sevdesk-agent ...`), or
  - via npx (no local build, run from outside this repo folder): `npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent --help`
- if `sevdesk-agent ...` fails with `permission denied`, run the same command via:
  - `node dist/index.js <command> ...`
- API token is available in env:
  - `SEVDESK_API_TOKEN=<token>`
- Optional env:
  - `SEVDESK_BASE_URL` (default `https://my.sevdesk.de/api/v1`)
  - `SEVDESK_USER_AGENT`
  - `SEVDESK_ALLOW_WRITE=true` (required only for `DELETE` operations, unless `--allow-write` is used)

## Core workflow
1. Discover operation ids:
   - `sevdesk-agent ops list --read-only`
   - `sevdesk-agent op-show <operationId>`
   - `sevdesk-agent ops-quirks`
   - stable parser output: `sevdesk-agent ops-quirks --json-array`
2. Run read calls first:
   - `sevdesk-agent read <operationId> --query key=value`
   - local contact search helper: `sevdesk-agent find-contact <term> --output json`
   - by default, read responses are normalized for known live API quirks
   - Shell quoting: params like `contact[id]` should be quoted: `--query 'contact[id]=123'`
   - Invoice date filters (observed): in our tests, `getInvoices` works with `startDate`/`endDate` as Unix timestamps (seconds). ISO dates like `2026-01-01` may return empty results.
      Example: `sevdesk-agent read getInvoices --query startDate=1767225600 --query endDate=1769903999 --output json`
   - Generate a full read-op reference doc: `sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md`
3. For write calls:
   - `POST` / `PUT` / `PATCH`: `sevdesk-agent write <operationId> ...`
   - `DELETE`: `sevdesk-agent write <operationId> --execute --confirm-execute yes --allow-write ...`
   - for `createContact` / `createOrder`, local preflight validation runs by default
   - add `--verify` to run read-only post-write checks
   - for createContact workflows, prefer `--verify-contact` (includes customerNumber mismatch checks; auto-fix enabled by default and can be disabled via `--no-fix-contact`)
4. Persist agent handoff context:
   - stdout (default): `sevdesk-agent context snapshot`
   - optional file export: `sevdesk-agent context snapshot --output .context/sevdesk-context-snapshot.json`

## Standard runbook: Kontakt + Angebot + PDF
1. Discovery:
   - `sevdesk-agent ops list --read-only`
   - `sevdesk-agent op-show createContact`
   - `sevdesk-agent op-show createOrder`
2. Kontakt finden/erstellen:
   - `sevdesk-agent find-contact "<name or customerNumber>" --output json`
   - `sevdesk-agent write createContact ... --verify-contact`
3. Angebot erstellen:
   - `sevdesk-agent write createOrder ... --verify`
4. PDF export ohne Status-Nebeneffekt:
   - `sevdesk-agent read orderGetPdf --path orderId=<id> --decode-pdf output/<file>.pdf`
   - `preventSendBy=1` wird standardmäßig gesetzt (`--no-safe-pdf` deaktiviert das)
5. Handoff:
   - `sevdesk-agent context snapshot --include-default`

## Guardrails
- Default behavior is workflow-friendly: `POST`/`PUT`/`PATCH` run directly; `DELETE` is blocked unless guard flags are set.
- In production workflows, prefer read-only tests and read-only probes first.
- For `*GetPdf` endpoints, responses are typically JSON wrapped in `data.objects` (often containing `filename`, `mimetype`, and base64 `content`). The CLI does not automatically write files to disk.
- for `orderGetPdf` / `invoiceGetPdf`, CLI now applies `preventSendBy=1` by default (safe PDF mode).
- use `--decode-pdf <path>` for direct PDF file output without `jq`/`base64`.
- If the server returns a non-JSON binary content-type (pdf/xml/zip/csv), the CLI prints metadata (`binary`, `bytes`, `contentType`) instead of raw bytes.
- Runtime-required query quirks are enforced for selected operations (e.g. `contactCustomerNumberAvailabilityCheck` requires `customerNumber` at runtime).
- Use `op-show` or `ops-quirks` to see operation-specific runtime quirks.
- `ops-quirks --json` returns an object mapping; for stable array parsing use `ops-quirks --json-array`.
- if you need invoice mutation guidance and `updateInvoice` is missing, run `sevdesk-agent docs invoice-edit`.

## References
- Command cheat sheet: `references/command-cheatsheet.md`
- Offer/order write notes (live behavior): `knowledge/SEVDESK_ORDER_WRITE_LEARNINGS.md`
