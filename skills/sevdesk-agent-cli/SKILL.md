---
name: sevdesk-agent-cli
description: "Sevdesk bookkeeping automation via a global CLI, with read-first discovery, voucher intake, transaction matching, invoice/order/contact workflows, and delete-guarded mutations."
---

# sevdesk-agent-cli

## When to use
Use this skill when tasks involve sevdesk API access from this workspace, especially when an agent must:
- inspect business/accounting state via read-only endpoints,
- search contacts, invoices, vouchers, or transactions without improvising raw API filters,
- create or update contacts, quotes, invoices, and vouchers through typed workflows,
- match vouchers against bank transactions and prepare or execute bookings,
- execute write endpoints quickly while keeping DELETE operations explicitly guarded,
- produce a context snapshot for later agent runs.

## Preconditions
- Ensure the CLI is globally available on `PATH` once per machine:
  - preferred: `npm install -g @codecell-germany/sevdesk-agent-skill`
  - Codex bootstrap helper: `npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent-skill install --force`
  - verify: `sevdesk-agent --help`
- If `sevdesk-agent` is still not found after install:
  - check the npm global prefix: `npm config get prefix`
  - add `<prefix>/bin` to `PATH` for the current shell if needed
- Temporary fallback without global install:
  - `npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent --help`
- For skill-aware agent environments, install the skill payload explicitly:
  - `sevdesk-agent-skill install --force`
- API token is available in env:
  - `SEVDESK_API_TOKEN=<token>`
- Optional env:
  - `SEVDESK_BASE_URL` (default `https://my.sevdesk.de/api/v1`)
  - `SEVDESK_USER_AGENT`
- `SEVDESK_ALLOW_WRITE=true` (required only for `DELETE` operations, unless `--allow-write` is used)

## First-run detection
Run this before the first real bookkeeping workflow on a machine:

```bash
sevdesk-agent --help
sevdesk-agent doctor --json
sevdesk-agent read bookkeepingSystemVersion --output json
```

Treat the environment as not ready if any of these are true:

- `sevdesk-agent` is not available on `PATH`
- `SEVDESK_API_TOKEN` is missing
- `doctor` reports a failed check
- `bookkeepingSystemVersion` cannot be read successfully

If setup is incomplete, install the public package first, verify the token, and only then continue to `read`, `find-*`, or write workflows.

## Core workflow
1. Discover operation ids:
   - `sevdesk-agent ops list --read-only`
   - `sevdesk-agent op-show <operationId>`
   - `sevdesk-agent ops-quirks`
   - stable parser output: `sevdesk-agent ops-quirks --json-array`
2. Run read calls first:
   - `sevdesk-agent read <operationId> --query key=value`
   - `sevdesk-agent read find-contact --query term="<name>" --output json` (alias for top-level find-contact)
   - `sevdesk-agent read resolve-billing-contact --query term="<name>" --output json` (alias for helper command)
   - `sevdesk-agent read find-invoice --query term="<text>" --query deepScan=true --output json` (alias for helper command)
   - `sevdesk-agent read find-transaction --query amount=119 --query booked=false --output json` (alias for helper command)
   - `sevdesk-agent read match-transaction --query voucherId=<id> --output json` (alias for helper command)
   - local contact search helper: `sevdesk-agent find-contact <term> --output json`
   - billing helper: `sevdesk-agent resolve-billing-contact <term> --output json`
   - invoice text search: `sevdesk-agent find-invoice <term> --deep-scan --output json`
   - transaction search: `sevdesk-agent find-transaction "<text>" --amount <n> --booked false --output json`
   - voucher-to-transaction matching: `sevdesk-agent match-transaction --voucher-id <id> --output json`
   - semantic transaction matching: `sevdesk-agent transaction find-match --supplier "<name>" --amount <n> --date <yyyy-mm-dd> --direction expense --output json`
   - account guidance: `sevdesk-agent accounting resolve --account-number 4210 --scope expense --output json`
   - tax-rule guidance: `sevdesk-agent accounting resolve-tax-rule --tax-rule 1 --output json`
   - voucher inspection: `sevdesk-agent voucher inspect --id <id> --output json`
   - by default, read responses are normalized for known live API quirks
   - Shell quoting: params like `contact[id]` should be quoted: `--query 'contact[id]=123'`
   - Invoice date filters (observed): in our tests, `getInvoices` works with `startDate`/`endDate` as Unix timestamps (seconds). ISO dates like `2026-01-01` may return empty results.
      Example: `sevdesk-agent read getInvoices --query startDate=1767225600 --query endDate=1769903999 --output json`
   - Generate a full read-op reference doc: `sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md`
3. For write calls:
   - `POST` / `PUT` / `PATCH`: `sevdesk-agent write <operationId> ...`
   - ergonomic entity edits:
     - `sevdesk-agent order edit --order-id <id> ... --verify`
     - `sevdesk-agent contact edit --contact-id <id> ... --verify`
   - multipart writes are available with `--form-field key=value` and `--form-file file=/path/to/file`
   - `DELETE`: `sevdesk-agent write <operationId> --execute --confirm-execute yes --allow-write ...`
   - for `createContact` / `createOrder`, local preflight validation runs by default
   - for `createInvoiceByFactory`, preflight also validates invoice/delivery date consistency (`--auto-fix-delivery-date` available)
   - for `voucherFactorySaveVoucher` and `bookVoucher`, local preflight validates the high-risk accounting fields before the API call
   - add `--verify` to run read-only post-write checks (including `createInvoiceByFactory`, `voucherFactorySaveVoucher` and `bookVoucher`)
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
   - `sevdesk-agent read orderGetPdf --path orderId=<id> --decode-pdf output/<file>.pdf --suppress-content`
   - `preventSendBy=1` wird standardmäßig gesetzt (`--no-safe-pdf` deaktiviert das)
5. Handoff:
   - `sevdesk-agent context snapshot --include-default`

## Additional invoice helpers
- Installment from existing invoice:
  - `sevdesk-agent create-invoice-installment --from-invoice <id> --percent 70 --label "..." [--execute --verify]`
- Clone invoice for recurring workflows:
  - `sevdesk-agent invoice clone --from <id> --date <...> --period <...> with selective position overrides`
- Safe invoice replacement when generic invoice mutation is not available:
  - `sevdesk-agent invoice recreate --from <id> --patch-file payloads/invoice.patch.json --verify`
- Voucher intake from local PDF:
  - `sevdesk-agent create-voucher-from-pdf --file /absolute/path/to/beleg.pdf --reference-voucher-id <id> --policy gross-fallback ... [--execute --verify]`
- Voucher booking helpers:
  - `sevdesk-agent voucher inspect --id <id> --output json`
  - `sevdesk-agent voucher book-existing --voucher-id <id> --transaction-id <id> --direction expense [--execute --verify]`
  - `sevdesk-agent book-voucher --voucher-id <id> --check-account-id <id> --amount <n> --direction expense [--transaction-id <id>] [--difference-reason payment-fees --difference-amount 2.95] [--execute --verify]`
  - `sevdesk-agent assign-voucher-to-transaction --voucher-id <id> --check-account-id <id> --transaction-id <id> --amount <n> --direction expense [--execute --verify]`
  - `sevdesk-agent expense process-paid --file /absolute/path/to/beleg.pdf --transaction-id <id> --reference-voucher-id <id> --policy gross-fallback --direction expense ... [--execute --verify]`
  - Special-case escalation: `sevdesk-agent expense process-paid --file /absolute/path/to/reparatur.pdf --transaction-id <id> --policy damage-settlement --output json`
- Self-check and command sync:
  - `sevdesk-agent doctor --json`

## Guardrails
- Default behavior is workflow-friendly: `POST`/`PUT`/`PATCH` run directly; `DELETE` is blocked unless guard flags are set.
- In production workflows, prefer read-only tests and read-only probes first.
- For `*GetPdf` endpoints, responses are typically JSON wrapped in `data.objects` (often containing `filename`, `mimetype`, and base64 `content`).
- for `orderGetPdf` / `invoiceGetPdf`, CLI now applies `preventSendBy=1` by default (safe PDF mode).
- use `--decode-pdf <path>` for direct PDF file output without `jq`/`base64`.
- with `--decode-pdf`, use `--suppress-content` (default) to keep large base64 payload out of CLI output.
- `create-voucher-from-pdf`, `book-voucher` and `assign-voucher-to-transaction` are dry-run by default; real writes happen only with `--execute`.
- `voucher book-existing` and `expense process-paid` are also dry-run by default; use `--execute` only after checking the derived payload.
- `book-voucher`, `assign-voucher-to-transaction`, `voucher book-existing` and `expense process-paid` support `--direction auto|expense|revenue`. For negative bank/card transactions, `--direction expense` is usually the safe default.
- `expense process-paid` supports `--reference-voucher-id` to derive account/tax defaults from a known good voucher.
- `expense process-paid --policy actual-eur-charge` uses the absolute transaction amount as the gross voucher amount when no explicit amount is given.
- `expense process-paid --policy gross-fallback` detects 0,01-EUR drift between net-derived gross and the actual transaction amount and switches to gross mode automatically.
- `expense process-paid --policy damage-settlement` intentionally returns a manual-UI escalation instead of improvising a fragile automation path.
- `book-voucher` and related helpers can forward `differenceReason`, `differenceAmount` and `feeAmount` for payment-fee or small-difference cases. Treat this as sevdesk-version dependent and verify the result immediately.
- `order edit`, `contact edit` and `invoice recreate` execute directly like normal `PUT`/`POST` flows; use `--verify` to validate the result immediately.
- When a write response or built-in verification returns `ok: false`, the CLI now exits with a non-zero shell status. Do not treat that as success in automation.
- If the server returns a non-JSON binary content-type (pdf/xml/zip/csv), the CLI prints metadata (`binary`, `bytes`, `contentType`) instead of raw bytes.
- Runtime-required query quirks are enforced for selected operations (e.g. `contactCustomerNumberAvailabilityCheck` requires `customerNumber` at runtime).
- Use `op-show` or `ops-quirks` to see operation-specific runtime quirks.
- `ops-quirks --json` returns an object mapping; for stable array parsing use `ops-quirks --json-array`.
- if you need invoice mutation guidance and `updateInvoice` is missing, run `sevdesk-agent docs invoice-edit`.
- if you need to change invoice content, prefer `sevdesk-agent invoice recreate --from <id> ...` over guessing a raw `updateInvoice` payload.
- for numbering/finalization sequence after invoice creation, run `sevdesk-agent docs invoice-finalize`.

## References
- Command cheat sheet: `references/command-cheatsheet.md`
- Offer/order write notes (live behavior): `knowledge/SEVDESK_ORDER_WRITE_LEARNINGS.md`
