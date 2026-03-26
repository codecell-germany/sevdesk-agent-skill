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
- Bootstrap the local CLI shim once per machine:
  - `npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent-skill install --force`
- After bootstrap, use the installed CLI path:
  - `~/.codex/bin/sevdesk-agent --help`
- Optional:
  - if `~/.codex/bin` is on `PATH`, plain `sevdesk-agent ...` also works
  - without bootstrap, the immediate fallback is still the npm runner: `npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent --help`
- API token is available in env:
  - `SEVDESK_API_TOKEN=<token>`
- Optional env:
  - `SEVDESK_BASE_URL` (default `https://my.sevdesk.de/api/v1`)
  - `SEVDESK_USER_AGENT`
  - `SEVDESK_ALLOW_WRITE=true` (required only for `DELETE` operations, unless `--allow-write` is used)

## Core workflow
1. Discover operation ids:
   - `~/.codex/bin/sevdesk-agent ops list --read-only`
   - `~/.codex/bin/sevdesk-agent op-show <operationId>`
   - `~/.codex/bin/sevdesk-agent ops-quirks`
   - stable parser output: `~/.codex/bin/sevdesk-agent ops-quirks --json-array`
2. Run read calls first:
   - `~/.codex/bin/sevdesk-agent read <operationId> --query key=value`
   - `~/.codex/bin/sevdesk-agent read find-contact --query term="<name>" --output json` (alias for top-level find-contact)
   - `~/.codex/bin/sevdesk-agent read resolve-billing-contact --query term="<name>" --output json` (alias for helper command)
   - `~/.codex/bin/sevdesk-agent read find-invoice --query term="<text>" --query deepScan=true --output json` (alias for helper command)
   - `~/.codex/bin/sevdesk-agent read find-transaction --query amount=119 --query booked=false --output json` (alias for helper command)
   - `~/.codex/bin/sevdesk-agent read match-transaction --query voucherId=<id> --output json` (alias for helper command)
   - local contact search helper: `~/.codex/bin/sevdesk-agent find-contact <term> --output json`
   - billing helper: `~/.codex/bin/sevdesk-agent resolve-billing-contact <term> --output json`
   - invoice text search: `~/.codex/bin/sevdesk-agent find-invoice <term> --deep-scan --output json`
   - transaction search: `~/.codex/bin/sevdesk-agent find-transaction "<text>" --amount <n> --booked false --output json`
   - voucher-to-transaction matching: `~/.codex/bin/sevdesk-agent match-transaction --voucher-id <id> --output json`
   - by default, read responses are normalized for known live API quirks
   - Shell quoting: params like `contact[id]` should be quoted: `--query 'contact[id]=123'`
   - Invoice date filters (observed): in our tests, `getInvoices` works with `startDate`/`endDate` as Unix timestamps (seconds). ISO dates like `2026-01-01` may return empty results.
      Example: `~/.codex/bin/sevdesk-agent read getInvoices --query startDate=1767225600 --query endDate=1769903999 --output json`
   - Generate a full read-op reference doc: `~/.codex/bin/sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md`
3. For write calls:
   - `POST` / `PUT` / `PATCH`: `~/.codex/bin/sevdesk-agent write <operationId> ...`
   - multipart writes are available with `--form-field key=value` and `--form-file file=/path/to/file`
   - `DELETE`: `~/.codex/bin/sevdesk-agent write <operationId> --execute --confirm-execute yes --allow-write ...`
   - for `createContact` / `createOrder`, local preflight validation runs by default
   - for `createInvoiceByFactory`, preflight also validates invoice/delivery date consistency (`--auto-fix-delivery-date` available)
   - for `voucherFactorySaveVoucher` and `bookVoucher`, local preflight validates the high-risk accounting fields before the API call
   - add `--verify` to run read-only post-write checks (including `createInvoiceByFactory`, `voucherFactorySaveVoucher` and `bookVoucher`)
   - for createContact workflows, prefer `--verify-contact` (includes customerNumber mismatch checks; auto-fix enabled by default and can be disabled via `--no-fix-contact`)
4. Persist agent handoff context:
   - stdout (default): `~/.codex/bin/sevdesk-agent context snapshot`
   - optional file export: `~/.codex/bin/sevdesk-agent context snapshot --output .context/sevdesk-context-snapshot.json`

## Standard runbook: Kontakt + Angebot + PDF
1. Discovery:
   - `~/.codex/bin/sevdesk-agent ops list --read-only`
   - `~/.codex/bin/sevdesk-agent op-show createContact`
   - `~/.codex/bin/sevdesk-agent op-show createOrder`
2. Kontakt finden/erstellen:
   - `~/.codex/bin/sevdesk-agent find-contact "<name or customerNumber>" --output json`
   - `~/.codex/bin/sevdesk-agent write createContact ... --verify-contact`
3. Angebot erstellen:
   - `~/.codex/bin/sevdesk-agent write createOrder ... --verify`
4. PDF export ohne Status-Nebeneffekt:
   - `~/.codex/bin/sevdesk-agent read orderGetPdf --path orderId=<id> --decode-pdf output/<file>.pdf --suppress-content`
   - `preventSendBy=1` wird standardmäßig gesetzt (`--no-safe-pdf` deaktiviert das)
5. Handoff:
   - `~/.codex/bin/sevdesk-agent context snapshot --include-default`

## Additional invoice helpers
- Installment from existing invoice:
  - `~/.codex/bin/sevdesk-agent create-invoice-installment --from-invoice <id> --percent 70 --label "..." [--execute --verify]`
- Clone invoice for recurring workflows:
  - `~/.codex/bin/sevdesk-agent invoice clone --from <id> --date <...> --period <...> with selective position overrides`
- Voucher intake from local PDF:
  - `~/.codex/bin/sevdesk-agent create-voucher-from-pdf --file /absolute/path/to/beleg.pdf ... [--execute --verify]`
- Voucher booking helpers:
  - `~/.codex/bin/sevdesk-agent book-voucher --voucher-id <id> --check-account-id <id> --amount <n> [--transaction-id <id>] [--execute --verify]`
  - `~/.codex/bin/sevdesk-agent assign-voucher-to-transaction --voucher-id <id> --check-account-id <id> --transaction-id <id> --amount <n> [--execute --verify]`
- Self-check and command sync:
  - `~/.codex/bin/sevdesk-agent doctor --json`

## Guardrails
- Default behavior is workflow-friendly: `POST`/`PUT`/`PATCH` run directly; `DELETE` is blocked unless guard flags are set.
- In production workflows, prefer read-only tests and read-only probes first.
- For `*GetPdf` endpoints, responses are typically JSON wrapped in `data.objects` (often containing `filename`, `mimetype`, and base64 `content`).
- for `orderGetPdf` / `invoiceGetPdf`, CLI now applies `preventSendBy=1` by default (safe PDF mode).
- use `--decode-pdf <path>` for direct PDF file output without `jq`/`base64`.
- with `--decode-pdf`, use `--suppress-content` (default) to keep large base64 payload out of CLI output.
- `create-voucher-from-pdf`, `book-voucher` and `assign-voucher-to-transaction` are dry-run by default; real writes happen only with `--execute`.
- If the server returns a non-JSON binary content-type (pdf/xml/zip/csv), the CLI prints metadata (`binary`, `bytes`, `contentType`) instead of raw bytes.
- Runtime-required query quirks are enforced for selected operations (e.g. `contactCustomerNumberAvailabilityCheck` requires `customerNumber` at runtime).
- Use `op-show` or `ops-quirks` to see operation-specific runtime quirks.
- `ops-quirks --json` returns an object mapping; for stable array parsing use `ops-quirks --json-array`.
- if you need invoice mutation guidance and `updateInvoice` is missing, run `~/.codex/bin/sevdesk-agent docs invoice-edit`.
- for numbering/finalization sequence after invoice creation, run `~/.codex/bin/sevdesk-agent docs invoice-finalize`.

## References
- Command cheat sheet: `references/command-cheatsheet.md`
- Offer/order write notes (live behavior): `knowledge/SEVDESK_ORDER_WRITE_LEARNINGS.md`
