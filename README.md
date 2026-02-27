# sevdesk-agent-skill

Agent-first CLI + skill package for sevdesk with a read-first workflow, API-complete operation catalog, verification helpers, safe PDF handling, and context snapshots.

## Core Capabilities

- API operation coverage from official OpenAPI (`154` operations in catalog).
- Read-first execution model (`read <operationId>`).
- Fast write workflows for `POST` / `PUT` / `PATCH` (no generic write blocker).
- Explicit delete guard for `DELETE` operations.
- Built-in preflight validation for high-impact writes (`createContact`, `createOrder`).
- Post-write verification (`--verify`, `--verify-contact`) including contact customer-number checks.
- Contact lookup helper with local scoring (`find-contact`).
- Safe PDF mode for `orderGetPdf` / `invoiceGetPdf` (`preventSendBy=1` default).
- Direct PDF file decode (`--decode-pdf`).
- Runtime quirk handling (`ops-quirks`, normalization in `read`).
- Handoff snapshots for multi-agent continuation (`context snapshot`).

## Why This Improves Agent Workflows

Typical agent pain points this tool removes:

- No more endpoint guessing: operation IDs are discoverable and inspectable.
- Less brittle contact search: local scoring beats unreliable server-side partial search patterns.
- Fewer malformed writes: preflight catches payload mistakes before API calls.
- Faster troubleshooting: verify modes immediately show if the write result matches intent.
- Safer document exports: PDF requests avoid accidental send/status side effects by default.

## Simplified Process Examples

### 1) New Contact Onboarding (Create + Verify)

```bash
sevdesk-agent find-contact "Muster GmbH" --output json
sevdesk-agent write createContact --body-file payloads/contact.create.json --verify-contact
```

What got simpler:
- Fast duplicate check.
- Immediate validation of persisted contact data.
- Optional auto-fix for customer number mismatch.

### 2) Offer Creation Flow (Kontakt -> Angebot -> PDF)

```bash
sevdesk-agent write createOrder --body-file payloads/order.create.json --verify
sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer-12345.pdf --output json
```

What got simpler:
- Preflight catches invalid order payload shape.
- Verify confirms recipient/positions/status after write.
- PDF is ready as a file without manual base64 piping.

### 3) Invoice State Repair (Action-based Invoice API)

```bash
sevdesk-agent read getInvoiceById --path invoiceId=98765 --output json
sevdesk-agent write invoiceResetToDraft --path invoiceId=98765
sevdesk-agent write invoiceRender --path invoiceId=98765
```

What got simpler:
- Clear action-based invoice workflow instead of searching for a non-existing generic `updateInvoice` route.

### 4) Controlled Deletion (Guarded)

```bash
sevdesk-agent write deleteOrder --path orderId=12345 --execute --confirm-execute yes --allow-write
```

What got simpler:
- Only destructive operations require guard confirmation.
- Regular write flows stay fast.

### 5) Agent Handoff Snapshot

```bash
sevdesk-agent context snapshot --include-default --max-objects 20 --output .context/sevdesk-context-snapshot.json
```

What got simpler:
- Next agent receives consistent context without ad-hoc manual exports.

## Quick Start

Requirements:
- Node.js >= 20
- `SEVDESK_API_TOKEN`

```bash
npm install
npm run build
export SEVDESK_API_TOKEN="..."
node dist/index.js read bookkeepingSystemVersion --output json
```

If local wrapper is executable:

```bash
sevdesk-agent read bookkeepingSystemVersion --output json
```

## CLI Overview

- `sevdesk-agent ops list --read-only`
- `sevdesk-agent op-show <operationId>`
- `sevdesk-agent ops-quirks --json-array`
- `sevdesk-agent read <operationId> ...`
- `sevdesk-agent write <operationId> ...`
- `sevdesk-agent find-contact <term> ...`
- `sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md`
- `sevdesk-agent docs invoice-edit`
- `sevdesk-agent context snapshot ...`

## Guard Model

- `GET`, `POST`, `PUT`, `PATCH`: executable directly.
- `DELETE`: requires explicit guard confirmation:
  - `--execute`
  - `--confirm-execute yes`
  - `SEVDESK_ALLOW_WRITE=true` or `--allow-write`

## Known Caveat

- `voucherUploadFile` (`POST /Voucher/Factory/uploadTempFile`) expects `form-data` binary upload.
- Current CLI client sends JSON request bodies, so this endpoint is cataloged but not fully usable yet.

## Install via skills.sh

Install the skill globally for all agents:

```bash
npx skills add codecell-germany/sevdesk-agent-skill -g --skill sevdesk-agent-cli --agent '*' -y
```

List skills in this repository:

```bash
npx skills add codecell-germany/sevdesk-agent-skill -l
```

## Package + npx usage

Install skill payload into Codex home:

```bash
npx -y @codecell-germany/sevdesk-agent-skill install
```

Run CLI directly from npm package:

```bash
npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent --help
```

## Project Structure

- CLI source: `src/`
- Operation catalog: `src/data/operations.json`
- Runtime quirks: `src/data/runtime-quirks.json`
- Skill prompt: `skills/sevdesk-agent-cli/SKILL.md`
- Knowledge docs: `knowledge/`

## Testing

```bash
npm test
npm run test:live
```

Live tests are read-only and require:
- `SEVDESK_LIVE_TESTS=1`
- `SEVDESK_API_TOKEN`

## Disclaimer

Not affiliated with sevdesk. "sevdesk" is a trademark of its owner.

## License

MIT
