# sevdesk-agent command cheat sheet

## Build
```bash
npm install
npm run build
```

## Read-only discovery
```bash
sevdesk-agent ops list --read-only
sevdesk-agent op-show getInvoices
sevdesk-agent ops-quirks
sevdesk-agent ops-quirks --json-array
```

## Read call
```bash
sevdesk-agent read getInvoices --output pretty
sevdesk-agent read getContacts --query customerNumber=10001
sevdesk-agent read contactCustomerNumberAvailabilityCheck --query customerNumber=10001
sevdesk-agent find-contact nikolas --output json
sevdesk-agent read find-contact --query term=nikolas --output json
sevdesk-agent resolve-billing-contact "Muster GmbH" --output json
sevdesk-agent find-invoice acf --deep-scan --output json
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
sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer.pdf --suppress-content --output json
```

## Write call (`POST`/`PUT`/`PATCH` directly)
```bash
sevdesk-agent write createContact \
  --body-file ./payloads/contact.create.json \
  --verify-contact
```

Disable customerNumber auto-fix while still verifying:
```bash
sevdesk-agent write createContact --body-file ./payloads/contact.create.json --verify-contact --no-fix-contact
```

Preflight validation runs by default for:
- `createContact`
- `createOrder`
- `createInvoiceByFactory` (with invoice/delivery date checks)

Disable preflight (rare):
```bash
sevdesk-agent write createOrder --body-file ./payloads/order.json --no-preflight
```

Auto-fix invoice delivery date on create:
```bash
sevdesk-agent write createInvoiceByFactory \
  --body-file ./payloads/invoice.create.json \
  --auto-fix-delivery-date \
  --verify
```

Invoice create verification:
```bash
sevdesk-agent write createInvoiceByFactory --body-file ./payloads/invoice.create.json --verify
```

High-level invoice helpers:
```bash
sevdesk-agent create-invoice-installment \
  --from-invoice 12345 \
  --percent 70 \
  --label "Abschlag Phase 2" \
  --execute \
  --verify

sevdesk-agent invoice clone \
  --from 12345 \
  --period monthly \
  --override-position-price 0=199.00 \
  --execute \
  --verify
```

## Delete call (guarded)
```bash
sevdesk-agent write deleteOrder \
  --path orderId=12345 \
  --execute \
  --confirm-execute yes \
  --allow-write
```

Invoice edit workflow (no generic updateInvoice route):
```bash
sevdesk-agent docs invoice-edit
```

Invoice finalize workflow:
```bash
sevdesk-agent docs invoice-finalize
```

Self-check:
```bash
sevdesk-agent doctor --json
```

## Context snapshot for agent continuation
```bash
sevdesk-agent context snapshot
```

Optional: write snapshot to file
```bash
sevdesk-agent context snapshot \
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

CLI fallback when wrapper is not executable:
```bash
node dist/index.js <command> ...
```
