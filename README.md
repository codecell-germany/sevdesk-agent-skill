# sevdesk-agent-skill

---

# English

## Purpose

`sevdesk-agent-skill` gives agents full remote control over a sevdesk bookkeeping system.
Its purpose is to automate accounting workflows end to end: contacts, quotes, invoices, PDF exports, verification steps, and structured handoffs between agents.

The skill is designed for companies that want to run bookkeeping processes through agents instead of manual UI work.

## What the skill enables

- Full read access across the sevdesk API through stable operation IDs
- Write workflows for contacts, quotes, invoices, and related accounting objects
- Reliable helper flows for contact lookup, billing contact resolution, and invoice discovery
- Voucher intake workflows including PDF-backed voucher creation, transaction search, matching, and booking
- Template-based invoice workflows such as installments and recurring clones
- Safe PDF export and direct file decoding
- Verification after writes to reduce workflow drift
- Context snapshots for multi-agent continuation

## Typical workflows

- Contact creation and enrichment
- Contact to quote workflows
- Quote to invoice workflows
- Installment invoice creation from existing invoices
- Recurring invoice generation from templates
- Incoming voucher intake from local PDFs
- Voucher-to-bank-transaction matching and booking preparation
- Finance backoffice automation with reproducible agent runs
- Multi-agent bookkeeping workflows with explicit state handoff

## Installation

### 1. Install the CLI

```bash
npm install -g @codecell-germany/sevdesk-agent-skill
```

### 2. Verify the installation

```bash
sevdesk-agent --help
```

After installation, the CLI should be available directly on your `PATH`.

### 3. Use the CLI

```bash
sevdesk-agent --help
```

## Quick start

Requirements:

- Node.js >= 20
- `SEVDESK_API_TOKEN`

```bash
export SEVDESK_API_TOKEN="..."
sevdesk-agent read bookkeepingSystemVersion --output json
```

## Workflow examples

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
sevdesk-agent assign-voucher-to-transaction \
  --voucher-id 901 \
  --check-account-id 5 \
  --transaction-id 100 \
  --amount 119 \
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

### Invoice search across headers and positions

```bash
sevdesk-agent find-invoice "acf" --deep-scan --output json
sevdesk-agent read find-invoice --query term="acf" --query deepScan=true --output json
```

## CLI overview

- `sevdesk-agent ops list --read-only`
- `sevdesk-agent op-show <operationId>`
- `sevdesk-agent read <operationId> ...`
- `sevdesk-agent write <operationId> ...`
- `sevdesk-agent find-contact <term> ...`
- `sevdesk-agent resolve-billing-contact <term> ...`
- `sevdesk-agent find-invoice <term> ...`
- `sevdesk-agent find-transaction [term] ...`
- `sevdesk-agent match-transaction ...`
- `sevdesk-agent create-voucher-from-pdf ...`
- `sevdesk-agent book-voucher ...`
- `sevdesk-agent assign-voucher-to-transaction ...`
- `sevdesk-agent create-invoice-installment ...`
- `sevdesk-agent invoice clone ...`
- `sevdesk-agent doctor --json`
- `sevdesk-agent context snapshot ...`

## Project structure

- `src/`: CLI source
- `skills/sevdesk-agent-cli/SKILL.md`: skill definition
- `knowledge/`: supporting knowledge and generated references

## Testing

```bash
npm test
npm run test:live
```

## License

MIT

---

# Deutsch

## Zweck

`sevdesk-agent-skill` gibt Agenten vollständige Fernsteuerung über ein sevdesk-Buchhaltungssystem.
Der Skill ist dafür gedacht, Buchhaltungsprozesse Ende zu Ende zu automatisieren: Kontakte, Angebote, Rechnungen, PDF-Exporte, Verifikationsschritte und strukturierte Übergaben zwischen Agenten.

Er richtet sich an Firmen, die Buchhaltungsabläufe nicht mehr manuell in der UI abarbeiten wollen, sondern agentisch und reproduzierbar steuern möchten.

## Was der Skill ermöglicht

- Vollständigen Lesezugriff auf die sevdesk-API über stabile Operation-IDs
- Write-Workflows für Kontakte, Angebote, Rechnungen und angrenzende Buchhaltungsobjekte
- Zuverlässige Helper-Flows für Kontaktsuche, Rechnungsempfänger-Auflösung und Rechnungssuche
- Voucher-Workflows für PDF-Belege, Transaktionssuche, Matching und Buchung
- Vorlagenbasierte Rechnungsabläufe wie Abschläge und wiederkehrende Klone
- Sicheren PDF-Export mit direkter Dateiausgabe
- Verifikation nach Writes zur Reduktion von Workflow-Drift
- Context-Snapshots für Multi-Agent-Weitergabe

## Typische Workflows

- Kontakte anlegen und anreichern
- Kontakt-zu-Angebot-Workflows
- Angebot-zu-Rechnung-Workflows
- Abschlagsrechnungen aus bestehenden Rechnungen erzeugen
- Wiederkehrende Rechnungen aus Vorlagen erzeugen
- Eingangsbelege als PDF in Sevdesk aufnehmen
- Belege mit Banktransaktionen matchen und buchen
- Backoffice-Automatisierung für Finance-Teams
- Multi-Agent-Buchhaltungsabläufe mit explizitem Handoff

## Installation

### 1. CLI installieren

```bash
npm install -g @codecell-germany/sevdesk-agent-skill
```

### 2. Installation prüfen

```bash
sevdesk-agent --help
```

Nach der Installation sollte das CLI direkt auf deinem `PATH` verfügbar sein.

### 3. CLI verwenden

```bash
sevdesk-agent --help
```

## Schnellstart

Voraussetzungen:

- Node.js >= 20
- `SEVDESK_API_TOKEN`

```bash
export SEVDESK_API_TOKEN="..."
sevdesk-agent read bookkeepingSystemVersion --output json
```

## Workflow-Beispiele

### Kontakt anlegen und verifizieren

```bash
sevdesk-agent find-contact "Muster GmbH" --output json
sevdesk-agent read resolve-billing-contact --query term="Muster GmbH" --output json
sevdesk-agent write createContact --body-file payloads/contact.create.json --verify-contact
```

### Angebot erstellen und PDF exportieren

```bash
sevdesk-agent write createOrder --body-file payloads/order.create.json --verify
sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer-12345.pdf --suppress-content --output json
```

### Rechnung erstellen

```bash
sevdesk-agent write createInvoiceByFactory --body-file payloads/invoice.create.json --verify
sevdesk-agent docs invoice-finalize
```

### Beleg aus lokalem PDF anlegen

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

### Beleg und Banktransaktion matchen

```bash
sevdesk-agent find-transaction "Adobe" --amount 119 --booked false --output json
sevdesk-agent match-transaction --voucher-id 901 --output json
sevdesk-agent assign-voucher-to-transaction \
  --voucher-id 901 \
  --check-account-id 5 \
  --transaction-id 100 \
  --amount 119 \
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

### Wiederkehrende Rechnung klonen

```bash
sevdesk-agent invoice clone \
  --from 12345 \
  --period monthly \
  --override-position-price 0=199.00 \
  --execute \
  --verify
```

### Rechnungssuche über Header und Positionen

```bash
sevdesk-agent find-invoice "acf" --deep-scan --output json
sevdesk-agent read find-invoice --query term="acf" --query deepScan=true --output json
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
- `sevdesk-agent create-voucher-from-pdf ...`
- `sevdesk-agent book-voucher ...`
- `sevdesk-agent assign-voucher-to-transaction ...`
- `sevdesk-agent create-invoice-installment ...`
- `sevdesk-agent invoice clone ...`
- `sevdesk-agent doctor --json`
- `sevdesk-agent context snapshot ...`

## Projektstruktur

- `src/`: CLI-Quellcode
- `skills/sevdesk-agent-cli/SKILL.md`: Skill-Definition
- `knowledge/`: unterstützende Knowledge-Dateien und generierte Referenzen

## Tests

```bash
npm test
npm run test:live
```

## Lizenz

MIT
