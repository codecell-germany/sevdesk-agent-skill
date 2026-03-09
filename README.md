# sevdesk-agent-skill

---

# English

## Overview

`sevdesk-agent-skill` is an agent-first CLI + skill package for sevdesk. It focuses on read-first workflows, API-complete operation discovery, safer writes, verification helpers, safe PDF export, and context snapshots for multi-agent handoffs.

## Core capabilities

- API operation coverage from the official OpenAPI catalog (`154` operations).
- Read-first execution model via `read <operationId>`.
- Direct `POST` / `PUT` / `PATCH` writes, with explicit guardrails only for `DELETE`.
- Preflight validation for high-impact writes:
  - `createContact`
  - `createOrder`
  - `createInvoiceByFactory`
- Post-write verification:
  - `--verify`
  - `--verify-contact`
- Helper workflows:
  - `find-contact`
  - `resolve-billing-contact`
  - `find-invoice` / `search-invoices`
  - `create-invoice-installment`
  - `invoice clone`
  - `doctor` / `self-check`
- Safe PDF export for `orderGetPdf` / `invoiceGetPdf` with `preventSendBy=1` by default.
- Direct PDF decoding with `--decode-pdf`.
- Runtime quirk handling via `ops-quirks` and normalized `read` output.
- Agent handoff snapshots via `context snapshot`.

## Why this improves agent workflows

- Discovery is deterministic: agents can inspect exact operation IDs instead of guessing endpoints.
- Contact and invoice lookup are more robust than relying on fragile server-side partial matches.
- Common write mistakes are caught before the API call.
- Verification reduces delayed failures in longer workflows.
- PDF export is safer by default and easier to consume as a file.

## Example workflows

### 1. Contact onboarding

```bash
sevdesk-agent find-contact "Muster GmbH" --output json
sevdesk-agent read find-contact --query term="Muster GmbH" --output json
sevdesk-agent read resolve-billing-contact --query term="Muster GmbH" --output json
sevdesk-agent write createContact --body-file payloads/contact.create.json --verify-contact
```

### 2. Quote creation and PDF export

```bash
sevdesk-agent write createOrder --body-file payloads/order.create.json --verify
sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer-12345.pdf --suppress-content --output json
```

### 3. Invoice creation and finalize runbook

```bash
sevdesk-agent write createInvoiceByFactory --body-file payloads/invoice.create.json --verify
sevdesk-agent docs invoice-finalize
```

### 4. Installment invoice from an existing invoice

```bash
sevdesk-agent create-invoice-installment \
  --from-invoice 12345 \
  --percent 70 \
  --label "Installment Phase 2" \
  --execute \
  --verify
```

### 5. Recurring invoice clone

```bash
sevdesk-agent invoice clone \
  --from 12345 \
  --period monthly \
  --override-position-price 0=199.00 \
  --execute \
  --verify
```

### 6. Invoice search across headers and positions

```bash
sevdesk-agent find-invoice "acf" --deep-scan --output json
sevdesk-agent read find-invoice --query term="acf" --query deepScan=true --output json
```

## Quick start

Requirements:

- Node.js >= 20
- `SEVDESK_API_TOKEN`

```bash
npm install
npm run build
export SEVDESK_API_TOKEN="..."
node dist/index.js read bookkeepingSystemVersion --output json
```

If the local wrapper is executable:

```bash
sevdesk-agent read bookkeepingSystemVersion --output json
```

## CLI overview

- `sevdesk-agent ops list --read-only`
- `sevdesk-agent op-show <operationId>`
- `sevdesk-agent ops-quirks --json-array`
- `sevdesk-agent read <operationId> ...`
- `sevdesk-agent write <operationId> ...`
- `sevdesk-agent find-contact <term> ...`
- `sevdesk-agent resolve-billing-contact <term> ...`
- `sevdesk-agent find-invoice <term> ...`
- `sevdesk-agent create-invoice-installment ...`
- `sevdesk-agent invoice clone ...`
- `sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md`
- `sevdesk-agent docs invoice-edit`
- `sevdesk-agent docs invoice-finalize`
- `sevdesk-agent doctor --json`
- `sevdesk-agent context snapshot ...`

## Guard model

- `GET`, `POST`, `PUT`, `PATCH` run directly.
- `DELETE` requires:
  - `--execute`
  - `--confirm-execute yes`
  - `SEVDESK_ALLOW_WRITE=true` or `--allow-write`

## Known caveat

- `voucherUploadFile` (`POST /Voucher/Factory/uploadTempFile`) expects `form-data` binary upload.
- The current CLI client sends JSON bodies, so this endpoint is visible in the catalog but not fully usable yet.

## Installation via skills.sh

Install the skill globally:

```bash
npx skills add codecell-germany/sevdesk-agent-skill -g --skill sevdesk-agent-cli --agent '*' -y
```

List skills in this repository:

```bash
npx skills add codecell-germany/sevdesk-agent-skill -l
```

## Package and npx usage

Install the skill payload into Codex home:

```bash
npx -y @codecell-germany/sevdesk-agent-skill install
```

Run the CLI directly from npm:

```bash
npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent --help
```

## Project structure

- `src/`: CLI source
- `src/data/operations.json`: operation catalog
- `src/data/runtime-quirks.json`: runtime quirks
- `skills/sevdesk-agent-cli/SKILL.md`: skill prompt
- `knowledge/`: knowledge docs

## Testing

```bash
npm test
npm run test:live
```

Live tests are read-only and require:

- `SEVDESK_LIVE_TESTS=1`
- `SEVDESK_API_TOKEN`

## Disclaimer

This project is not affiliated with sevdesk. "sevdesk" is a trademark of its owner.

## License

MIT

---

# Deutsch

## Überblick

`sevdesk-agent-skill` ist ein agentenorientiertes CLI- und Skill-Paket für sevdesk. Der Fokus liegt auf Read-first-Workflows, vollständiger API-Discovery, sichereren Writes, Verifikationshilfen, sicherem PDF-Export und Context-Snapshots für Agent-Handoffs.

## Kernfunktionen

- API-Abdeckung auf Basis des offiziellen OpenAPI-Katalogs (`154` Operationen).
- Read-first-Ausführung über `read <operationId>`.
- Direkte `POST` / `PUT` / `PATCH`-Writes, mit expliziten Guardrails nur für `DELETE`.
- Preflight-Validierung für wichtige Writes:
  - `createContact`
  - `createOrder`
  - `createInvoiceByFactory`
- Verifikation nach Writes:
  - `--verify`
  - `--verify-contact`
- Workflow-Helper:
  - `find-contact`
  - `resolve-billing-contact`
  - `find-invoice` / `search-invoices`
  - `create-invoice-installment`
  - `invoice clone`
  - `doctor` / `self-check`
- Sicherer PDF-Export für `orderGetPdf` / `invoiceGetPdf` mit `preventSendBy=1` als Default.
- Direktes PDF-Decoding mit `--decode-pdf`.
- Runtime-Quirk-Handling über `ops-quirks` und normalisierte `read`-Ausgaben.
- Agent-Handoff-Snapshots über `context snapshot`.

## Warum das Agent-Workflows verbessert

- Discovery ist reproduzierbar: Agenten können exakte Operation-IDs prüfen statt Endpunkte zu raten.
- Kontakt- und Rechnungssuche ist robuster als unsichere serverseitige Teilstring-Suchen.
- Häufige Payload-Fehler werden vor dem API-Call abgefangen.
- Verifikation reduziert Folgefehler in längeren Workflows.
- PDF-Export ist standardmäßig sicherer und direkt als Datei nutzbar.

## Beispiel-Workflows

### 1. Kontakt anlegen

```bash
sevdesk-agent find-contact "Muster GmbH" --output json
sevdesk-agent read find-contact --query term="Muster GmbH" --output json
sevdesk-agent read resolve-billing-contact --query term="Muster GmbH" --output json
sevdesk-agent write createContact --body-file payloads/contact.create.json --verify-contact
```

### 2. Angebot erstellen und PDF exportieren

```bash
sevdesk-agent write createOrder --body-file payloads/order.create.json --verify
sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer-12345.pdf --suppress-content --output json
```

### 3. Rechnung erstellen und Finalisierungs-Runbook nutzen

```bash
sevdesk-agent write createInvoiceByFactory --body-file payloads/invoice.create.json --verify
sevdesk-agent docs invoice-finalize
```

### 4. Abschlagsrechnung aus bestehender Rechnung erzeugen

```bash
sevdesk-agent create-invoice-installment \
  --from-invoice 12345 \
  --percent 70 \
  --label "Abschlag Phase 2" \
  --execute \
  --verify
```

### 5. Wiederkehrende Rechnung klonen

```bash
sevdesk-agent invoice clone \
  --from 12345 \
  --period monthly \
  --override-position-price 0=199.00 \
  --execute \
  --verify
```

### 6. Rechnungssuche über Header und Positionen

```bash
sevdesk-agent find-invoice "acf" --deep-scan --output json
sevdesk-agent read find-invoice --query term="acf" --query deepScan=true --output json
```

## Schnellstart

Voraussetzungen:

- Node.js >= 20
- `SEVDESK_API_TOKEN`

```bash
npm install
npm run build
export SEVDESK_API_TOKEN="..."
node dist/index.js read bookkeepingSystemVersion --output json
```

Wenn der lokale Wrapper ausführbar ist:

```bash
sevdesk-agent read bookkeepingSystemVersion --output json
```

## CLI-Überblick

- `sevdesk-agent ops list --read-only`
- `sevdesk-agent op-show <operationId>`
- `sevdesk-agent ops-quirks --json-array`
- `sevdesk-agent read <operationId> ...`
- `sevdesk-agent write <operationId> ...`
- `sevdesk-agent find-contact <term> ...`
- `sevdesk-agent resolve-billing-contact <term> ...`
- `sevdesk-agent find-invoice <term> ...`
- `sevdesk-agent create-invoice-installment ...`
- `sevdesk-agent invoice clone ...`
- `sevdesk-agent docs read-ops --output knowledge/READ_OPERATIONS.md`
- `sevdesk-agent docs invoice-edit`
- `sevdesk-agent docs invoice-finalize`
- `sevdesk-agent doctor --json`
- `sevdesk-agent context snapshot ...`

## Guard-Modell

- `GET`, `POST`, `PUT`, `PATCH` laufen direkt.
- `DELETE` benötigt:
  - `--execute`
  - `--confirm-execute yes`
  - `SEVDESK_ALLOW_WRITE=true` oder `--allow-write`

## Bekannte Einschränkung

- `voucherUploadFile` (`POST /Voucher/Factory/uploadTempFile`) erwartet `form-data` mit Binärdatei.
- Der aktuelle CLI-Client sendet JSON-Bodies, deshalb ist dieser Endpoint zwar im Katalog sichtbar, aber noch nicht vollständig nutzbar.

## Installation über skills.sh

Skill global installieren:

```bash
npx skills add codecell-germany/sevdesk-agent-skill -g --skill sevdesk-agent-cli --agent '*' -y
```

Skills in diesem Repository auflisten:

```bash
npx skills add codecell-germany/sevdesk-agent-skill -l
```

## Paket- und npx-Nutzung

Skill-Payload in Codex Home installieren:

```bash
npx -y @codecell-germany/sevdesk-agent-skill install
```

CLI direkt aus npm ausführen:

```bash
npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent --help
```

## Projektstruktur

- `src/`: CLI-Quellcode
- `src/data/operations.json`: Operation-Katalog
- `src/data/runtime-quirks.json`: Runtime-Quirks
- `skills/sevdesk-agent-cli/SKILL.md`: Skill-Prompt
- `knowledge/`: Wissensdokumente

## Tests

```bash
npm test
npm run test:live
```

Live-Tests sind read-only und benötigen:

- `SEVDESK_LIVE_TESTS=1`
- `SEVDESK_API_TOKEN`

## Hinweis

Dieses Projekt ist nicht mit sevdesk verbunden. "sevdesk" ist eine Marke des jeweiligen Eigentümers.

## Lizenz

MIT
