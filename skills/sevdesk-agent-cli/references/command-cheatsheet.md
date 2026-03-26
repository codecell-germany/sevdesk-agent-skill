# sevdesk-agent command cheat sheet

## Bootstrap
```bash
npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent-skill install --force
~/.codex/bin/sevdesk-agent --help
```

Optional: if `~/.codex/bin` is on `PATH`, `sevdesk-agent ...` works directly.

## Build (repo checkout)
```bash
npm install
npm run build
```

## Read-only discovery
```bash
~/.codex/bin/sevdesk-agent ops list --read-only
~/.codex/bin/sevdesk-agent op-show getInvoices
~/.codex/bin/sevdesk-agent ops-quirks
~/.codex/bin/sevdesk-agent ops-quirks --json-array
```

## Read call
```bash
~/.codex/bin/sevdesk-agent read getInvoices --output pretty
~/.codex/bin/sevdesk-agent read getContacts --query customerNumber=10001
~/.codex/bin/sevdesk-agent read contactCustomerNumberAvailabilityCheck --query customerNumber=10001
~/.codex/bin/sevdesk-agent find-contact nikolas --output json
~/.codex/bin/sevdesk-agent read find-contact --query term=nikolas --output json
~/.codex/bin/sevdesk-agent resolve-billing-contact "Muster GmbH" --output json
~/.codex/bin/sevdesk-agent read resolve-billing-contact --query term="Muster GmbH" --output json
~/.codex/bin/sevdesk-agent find-invoice acf --deep-scan --output json
~/.codex/bin/sevdesk-agent read find-invoice --query term=acf --query deepScan=true --output json
~/.codex/bin/sevdesk-agent find-transaction "Adobe" --amount 119 --booked false --output json
~/.codex/bin/sevdesk-agent read find-transaction --query amount=119 --query booked=false --output json
~/.codex/bin/sevdesk-agent match-transaction --voucher-id 901 --output json
~/.codex/bin/sevdesk-agent read match-transaction --query voucherId=901 --output json
```

By default `read` includes:
- `normalizedData` (quirk-aware response normalization)
- `normalizationWarnings`
- `runtimeQuirk`

PDF safety defaults:
- `orderGetPdf` / `invoiceGetPdf` automatically apply `preventSendBy=1` unless explicitly overridden.
- disable only if needed: `--no-safe-pdf`

Direct PDF decode:
```bash
~/.codex/bin/sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer.pdf --suppress-content --output json
```

## Write call (`POST`/`PUT`/`PATCH` directly)
```bash
~/.codex/bin/sevdesk-agent write createContact \
  --body-file ./payloads/contact.create.json \
  --verify-contact
```

Disable customerNumber auto-fix while still verifying:
```bash
~/.codex/bin/sevdesk-agent write createContact --body-file ./payloads/contact.create.json --verify-contact --no-fix-contact
```

Preflight validation runs by default for:
- `createContact`
- `createOrder`
- `createInvoiceByFactory` (with invoice/delivery date checks)
- `voucherFactorySaveVoucher`
- `bookVoucher`

Disable preflight (rare):
```bash
~/.codex/bin/sevdesk-agent write createOrder --body-file ./payloads/order.json --no-preflight
```

Auto-fix invoice delivery date on create:
```bash
~/.codex/bin/sevdesk-agent write createInvoiceByFactory \
  --body-file ./payloads/invoice.create.json \
  --auto-fix-delivery-date \
  --verify
```

Invoice create verification:
```bash
~/.codex/bin/sevdesk-agent write createInvoiceByFactory --body-file ./payloads/invoice.create.json --verify
```

High-level invoice helpers:
```bash
~/.codex/bin/sevdesk-agent create-invoice-installment \
  --from-invoice 12345 \
  --percent 70 \
  --label "Abschlag Phase 2" \
  --execute \
  --verify

~/.codex/bin/sevdesk-agent invoice clone \
  --from 12345 \
  --period monthly \
  --override-position-price 0=199.00 \
  --execute \
  --verify
```

High-level voucher helpers:
```bash
~/.codex/bin/sevdesk-agent create-voucher-from-pdf \
  --file /absolute/path/to/beleg.pdf \
  --supplier-name "Adobe" \
  --voucher-date 2026-03-10 \
  --amount 119 \
  --tax-type default \
  --tax-rule-id 9 \
  --tax-rate 19 \
  --account-datev-id 700 \
  --accounting-type-id 33 \
  --execute \
  --verify

~/.codex/bin/sevdesk-agent book-voucher \
  --voucher-id 901 \
  --check-account-id 5 \
  --transaction-id 100 \
  --amount 119 \
  --execute \
  --verify

~/.codex/bin/sevdesk-agent assign-voucher-to-transaction \
  --voucher-id 901 \
  --check-account-id 5 \
  --transaction-id 100 \
  --amount 119 \
  --execute \
  --verify
```

Generic multipart write:
```bash
~/.codex/bin/sevdesk-agent write voucherUploadFile \
  --form-file file=/absolute/path/to/beleg.pdf \
  --output json
```

## Delete call (guarded)
```bash
~/.codex/bin/sevdesk-agent write deleteOrder \
  --path orderId=12345 \
  --execute \
  --confirm-execute yes \
  --allow-write
```

Invoice edit workflow (no generic updateInvoice route):
```bash
~/.codex/bin/sevdesk-agent docs invoice-edit
```

Invoice finalize workflow:
```bash
~/.codex/bin/sevdesk-agent docs invoice-finalize
```

Self-check:
```bash
~/.codex/bin/sevdesk-agent doctor --json
```

## Context snapshot for agent continuation
```bash
~/.codex/bin/sevdesk-agent context snapshot
```

Optional: write snapshot to file
```bash
~/.codex/bin/sevdesk-agent context snapshot \
  --output .context/sevdesk-context-snapshot.json \
  --include-default \
  --include-plans \
  --max-objects 20
```

## Tests
```bash
npm run test
npm run test:live
```

`test:live` is read-only and runs only if:
- `SEVDESK_LIVE_TESTS=1`
- `SEVDESK_API_TOKEN` is set
