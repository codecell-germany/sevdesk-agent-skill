# sevdesk-agent-skill

---

# English

## Purpose

`sevdesk-agent-skill` is an agent-first sevdesk toolkit for end-to-end bookkeeping workflows.
It gives agents a real CLI plus a skill payload so they can work through contacts, quotes, invoices, vouchers, transaction matching, booking preparation, PDF export, and multi-agent handoffs without relying on the sevdesk web UI.

## Public Surface

The public product surface is:

- `sevdesk-agent`
- `sevdesk-agent-skill`

`sevdesk-agent` is the operational CLI.
`sevdesk-agent-skill` installs the skill payload for skill-aware agent environments.

## Current Scope

- Full read access across the exposed sevdesk operation catalog through stable operation IDs
- Write workflows for contacts, orders, invoices, vouchers, and related accounting objects
- High-level discovery helpers for contacts, billing contacts, invoices, and bank transactions
- Voucher intake from local PDFs, transaction matching, booking helpers, and booking verification
- Template-based invoice flows such as installments and recurring clones
- High-level edit workflows for orders and contacts
- Safe invoice recreation when a generic invoice update route is not available
- Safe PDF export with direct file decoding
- Post-write verification to reduce workflow drift
- Context snapshots for structured agent handoff

## Installation

### 1. Install the package

```bash
npm install -g @codecell-germany/sevdesk-agent-skill
```

### 2. Verify the binaries

```bash
sevdesk-agent --help
sevdesk-agent-skill --help
```

After the global install, `sevdesk-agent` should be available directly on your `PATH`.

### 3. Install the skill payload

```bash
sevdesk-agent-skill install --force
```

This step is useful for Codex-style or other skill-aware agent environments that expect an installed local skill payload in addition to the global CLI.

## First Run

Requirements:

- Node.js `>= 20`
- `SEVDESK_API_TOKEN`

Recommended first-run sequence on a fresh machine:

```bash
export SEVDESK_API_TOKEN="..."
sevdesk-agent doctor --json
sevdesk-agent read bookkeepingSystemVersion --output json
sevdesk-agent ops list --read-only
```

If `doctor` fails or `bookkeepingSystemVersion` cannot be read, do not proceed to write workflows yet.
Fix installation, environment variables, or token configuration first.

## Example Workflows

### Contact creation and verification

```bash
sevdesk-agent find-contact "Muster GmbH" --output json
sevdesk-agent read resolve-billing-contact --query term="Muster GmbH" --output json
sevdesk-agent write createContact --body-file payloads/contact.create.json --verify-contact
```

### Quote creation and PDF export

```bash
sevdesk-agent write createOrder --body-file payloads/order.create.json --verify
sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer-12345.pdf --suppress-content --output json
```

### Invoice creation

```bash
sevdesk-agent write createInvoiceByFactory --body-file payloads/invoice.create.json --verify
sevdesk-agent docs invoice-finalize
```

### Order edit

```bash
sevdesk-agent order edit \
  --order-id 12345 \
  --header "Updated offer header" \
  --address $'Muster GmbH\nMusterstraße 1\n10115 Berlin' \
  --verify
```

### Contact edit

```bash
sevdesk-agent contact edit \
  --contact-id 987 \
  --customer-number KD-2026-1001 \
  --street "Musterstraße 1" \
  --zip 10115 \
  --city Berlin \
  --country-id 1 \
  --verify
```

### Voucher intake from a local PDF

```bash
sevdesk-agent create-voucher-from-pdf \
  --file /absolute/path/to/adobe-march-2026.pdf \
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
```

### Voucher and transaction matching

```bash
sevdesk-agent find-transaction "Adobe" --amount 119 --booked false --output json
sevdesk-agent match-transaction --voucher-id 901 --output json
sevdesk-agent transaction find-match --supplier "Adobe" --amount 119 --date 2026-03-10 --direction expense --output json
sevdesk-agent voucher inspect --id 901 --output json
sevdesk-agent voucher book-existing \
  --voucher-id 901 \
  --transaction-id 100 \
  --execute \
  --verify
sevdesk-agent assign-voucher-to-transaction \
  --voucher-id 901 \
  --check-account-id 5 \
  --transaction-id 100 \
  --amount 119 \
  --execute \
  --verify
```

### Paid expense in one workflow

```bash
sevdesk-agent expense process-paid \
  --file /absolute/path/to/adobe-march-2026.pdf \
  --transaction-id 100 \
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
```

### Installment invoice from an existing invoice

```bash
sevdesk-agent create-invoice-installment \
  --from-invoice 12345 \
  --percent 70 \
  --label "Installment Phase 2" \
  --execute \
  --verify
```

### Recurring invoice clone

```bash
sevdesk-agent invoice clone \
  --from 12345 \
  --period monthly \
  --override-position-price 0=199.00 \
  --execute \
  --verify
```

### Safe invoice recreation

```bash
sevdesk-agent invoice recreate \
  --from 12345 \
  --patch-file payloads/invoice.patch.json \
  --verify
```

## CLI Overview

- `sevdesk-agent ops list --read-only`
- `sevdesk-agent op-show <operationId>`
- `sevdesk-agent read <operationId> ...`
- `sevdesk-agent write <operationId> ...`
- `sevdesk-agent find-contact <term> ...`
- `sevdesk-agent resolve-billing-contact <term> ...`
- `sevdesk-agent find-invoice <term> ...`
- `sevdesk-agent find-transaction [term] ...`
- `sevdesk-agent match-transaction ...`
- `sevdesk-agent transaction find-match ...`
- `sevdesk-agent transaction list-open-expenses ...`
- `sevdesk-agent create-voucher-from-pdf ...`
- `sevdesk-agent voucher inspect ...`
- `sevdesk-agent voucher book-existing ...`
- `sevdesk-agent expense process-paid ...`
- `sevdesk-agent book-voucher ...`
- `sevdesk-agent assign-voucher-to-transaction ...`
- `sevdesk-agent create-invoice-installment ...`
- `sevdesk-agent order edit ...`
- `sevdesk-agent contact edit ...`
- `sevdesk-agent invoice clone ...`
- `sevdesk-agent invoice recreate ...`
- `sevdesk-agent doctor --json`
- `sevdesk-agent context snapshot ...`

## Testing

```bash
npm run build
npm run test:unit
npm pack
```

`test:live` is optional and should only be run with a real sevdesk token in a controlled environment.

## License

MIT

---

# Deutsch

## Zweck

`sevdesk-agent-skill` ist ein agentisches Toolkit für durchgängige sevdesk-Buchhaltungsworkflows.
Es liefert ein echtes CLI plus Skill-Payload, damit Agenten Kontakte, Angebote, Rechnungen, Voucher, Transaktions-Matching, Buchungsvorbereitung, PDF-Exporte und Multi-Agent-Übergaben ohne manuelle Arbeit in der sevdesk-Weboberfläche abwickeln können.

## Öffentliche Oberfläche

Die öffentliche Produktoberfläche besteht aus:

- `sevdesk-agent`
- `sevdesk-agent-skill`

`sevdesk-agent` ist das operative CLI.
`sevdesk-agent-skill` installiert den Skill-Payload für skill-fähige Agent-Umgebungen.

## Aktueller Umfang

- Vollständiger Lesezugriff auf den freigelegten sevdesk-Operationskatalog über stabile Operation-IDs
- Write-Workflows für Kontakte, Angebote, Rechnungen, Voucher und angrenzende Buchhaltungsobjekte
- High-Level-Discovery-Helfer für Kontakte, Rechnungsempfänger, Rechnungen und Banktransaktionen
- Voucher-Intake aus lokalen PDFs, Transaktions-Matching, Buchungs-Helper und Buchungs-Verifikation
- Vorlagenbasierte Rechnungsabläufe wie Abschläge und wiederkehrende Klone
- High-Level-Edit-Workflows für Angebote und Kontakte
- Sichere Rechnungs-Recreation, wenn keine generische Invoice-Update-Route verfügbar ist
- Sicherer PDF-Export mit direkter Dateiausgabe
- Verifikation nach Writes zur Reduktion von Workflow-Drift
- Context-Snapshots für strukturierte Agent-Übergaben

## Installation

### 1. Paket installieren

```bash
npm install -g @codecell-germany/sevdesk-agent-skill
```

### 2. Binaries prüfen

```bash
sevdesk-agent --help
sevdesk-agent-skill --help
```

Nach der globalen Installation sollte `sevdesk-agent` direkt über den `PATH` verfügbar sein.

### 3. Skill-Payload installieren

```bash
sevdesk-agent-skill install --force
```

Dieser Schritt ist sinnvoll für Codex-ähnliche oder andere skill-fähige Agent-Umgebungen, die zusätzlich zum globalen CLI einen lokal installierten Skill-Payload erwarten.

## Erster Start

Voraussetzungen:

- Node.js `>= 20`
- `SEVDESK_API_TOKEN`

Empfohlene Reihenfolge auf einem frischen System:

```bash
export SEVDESK_API_TOKEN="..."
sevdesk-agent doctor --json
sevdesk-agent read bookkeepingSystemVersion --output json
sevdesk-agent ops list --read-only
```

Wenn `doctor` fehlschlägt oder `bookkeepingSystemVersion` nicht gelesen werden kann, sollte noch kein Write-Workflow gestartet werden.
Zuerst Installation, Umgebungsvariablen oder Token-Konfiguration korrigieren.

## Beispiel-Workflows

### Kontakt anlegen und verifizieren

```bash
sevdesk-agent find-contact "Muster GmbH" --output json
sevdesk-agent read resolve-billing-contact --query term="Muster GmbH" --output json
sevdesk-agent write createContact --body-file payloads/contact.create.json --verify-contact
```

### Angebot anlegen und PDF exportieren

```bash
sevdesk-agent write createOrder --body-file payloads/order.create.json --verify
sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/angebot-12345.pdf --suppress-content --output json
```

### Rechnung anlegen

```bash
sevdesk-agent write createInvoiceByFactory --body-file payloads/invoice.create.json --verify
sevdesk-agent docs invoice-finalize
```

### Angebot bearbeiten

```bash
sevdesk-agent order edit \
  --order-id 12345 \
  --header "Aktualisierter Angebotskopf" \
  --address $'Muster GmbH\nMusterstraße 1\n10115 Berlin' \
  --verify
```

### Kontakt bearbeiten

```bash
sevdesk-agent contact edit \
  --contact-id 987 \
  --customer-number KD-2026-1001 \
  --street "Musterstraße 1" \
  --zip 10115 \
  --city Berlin \
  --country-id 1 \
  --verify
```

### Voucher aus lokalem PDF anlegen

```bash
sevdesk-agent create-voucher-from-pdf \
  --file /absolute/path/to/adobe-march-2026.pdf \
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
```

### Voucher und Transaktion matchen

```bash
sevdesk-agent find-transaction "Adobe" --amount 119 --booked false --output json
sevdesk-agent match-transaction --voucher-id 901 --output json
sevdesk-agent transaction find-match --supplier "Adobe" --amount 119 --date 2026-03-10 --direction expense --output json
sevdesk-agent voucher inspect --id 901 --output json
sevdesk-agent voucher book-existing \
  --voucher-id 901 \
  --transaction-id 100 \
  --execute \
  --verify
sevdesk-agent assign-voucher-to-transaction \
  --voucher-id 901 \
  --check-account-id 5 \
  --transaction-id 100 \
  --amount 119 \
  --execute \
  --verify
```

### Bezahlte Ausgabe in einem Workflow

```bash
sevdesk-agent expense process-paid \
  --file /absolute/path/to/adobe-march-2026.pdf \
  --transaction-id 100 \
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
```

### Abschlagsrechnung aus bestehender Rechnung

```bash
sevdesk-agent create-invoice-installment \
  --from-invoice 12345 \
  --percent 70 \
  --label "Abschlag Phase 2" \
  --execute \
  --verify
```

### Wiederkehrenden Rechnungsklon erzeugen

```bash
sevdesk-agent invoice clone \
  --from 12345 \
  --period monthly \
  --override-position-price 0=199.00 \
  --execute \
  --verify
```

### Rechnung sicher neu erzeugen

```bash
sevdesk-agent invoice recreate \
  --from 12345 \
  --patch-file payloads/invoice.patch.json \
  --verify
```

## CLI-Überblick

- `sevdesk-agent ops list --read-only`
- `sevdesk-agent op-show <operationId>`
- `sevdesk-agent read <operationId> ...`
- `sevdesk-agent write <operationId> ...`
- `sevdesk-agent find-contact <term> ...`
- `sevdesk-agent resolve-billing-contact <term> ...`
- `sevdesk-agent find-invoice <term> ...`
- `sevdesk-agent find-transaction [term] ...`
- `sevdesk-agent match-transaction ...`
- `sevdesk-agent transaction find-match ...`
- `sevdesk-agent transaction list-open-expenses ...`
- `sevdesk-agent create-voucher-from-pdf ...`
- `sevdesk-agent voucher inspect ...`
- `sevdesk-agent voucher book-existing ...`
- `sevdesk-agent expense process-paid ...`
- `sevdesk-agent book-voucher ...`
- `sevdesk-agent assign-voucher-to-transaction ...`
- `sevdesk-agent create-invoice-installment ...`
- `sevdesk-agent order edit ...`
- `sevdesk-agent contact edit ...`
- `sevdesk-agent invoice clone ...`
- `sevdesk-agent invoice recreate ...`
- `sevdesk-agent doctor --json`
- `sevdesk-agent context snapshot ...`

## Tests

```bash
npm run build
npm run test:unit
npm pack
```

`test:live` ist optional und sollte nur mit echtem sevdesk-Token in einer kontrollierten Umgebung laufen.

## Lizenz

MIT
