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
```

## Read call
```bash
sevdesk-agent read getInvoices --output pretty
sevdesk-agent read getContacts --query customerNumber=10001
sevdesk-agent read contactCustomerNumberAvailabilityCheck --query customerNumber=10001
sevdesk-agent find-contact nikolas --output json
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
sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer.pdf --output json
```

## Write call (explicitly guarded)
```bash
sevdesk-agent write createContact \
  --body-file ./payloads/contact.create.json \
  --execute \
  --confirm-execute yes \
  --allow-write \
  --verify
```

Preflight validation runs by default for:
- `createContact`
- `createOrder`

Disable preflight (rare):
```bash
sevdesk-agent write createOrder --body-file ./payloads/order.json --no-preflight --execute --confirm-execute yes --allow-write
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
