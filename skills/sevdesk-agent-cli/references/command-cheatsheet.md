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
```

By default `read` includes:
- `normalizedData` (quirk-aware response normalization)
- `normalizationWarnings`
- `runtimeQuirk`

## Write call (explicitly guarded)
```bash
sevdesk-agent write createContact \
  --body-file ./payloads/contact.create.json \
  --execute \
  --confirm-execute yes \
  --allow-write
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
