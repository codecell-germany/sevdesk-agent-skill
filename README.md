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
- Finance backoffice automation with reproducible agent runs
- Multi-agent bookkeeping workflows with explicit state handoff

## Installation

### 1. Install the skill

```bash
npx skills add codecell-germany/sevdesk-agent-skill -g --skill sevdesk-agent-cli --agent '*' -y
```

### 2. Bootstrap the local CLI once

```bash
npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent-skill install --force
```

This installs the skill payload into `~/.codex/skills/` and the runnable CLI shim into:

```bash
~/.codex/bin/sevdesk-agent
```

### 3. Use the CLI

```bash
~/.codex/bin/sevdesk-agent --help
```

Optional: if `~/.codex/bin` is on your `PATH`, you can also use:

```bash
sevdesk-agent --help
```

## Quick start

Requirements:

- Node.js >= 20
- `SEVDESK_API_TOKEN`

```bash
export SEVDESK_API_TOKEN="..."
~/.codex/bin/sevdesk-agent read bookkeepingSystemVersion --output json
```

## Workflow examples

### Contact creation and verification

```bash
~/.codex/bin/sevdesk-agent find-contact "Muster GmbH" --output json
~/.codex/bin/sevdesk-agent read resolve-billing-contact --query term="Muster GmbH" --output json
~/.codex/bin/sevdesk-agent write createContact --body-file payloads/contact.create.json --verify-contact
```

### Quote creation and PDF export

```bash
~/.codex/bin/sevdesk-agent write createOrder --body-file payloads/order.create.json --verify
~/.codex/bin/sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer-12345.pdf --suppress-content --output json
```

### Invoice creation

```bash
~/.codex/bin/sevdesk-agent write createInvoiceByFactory --body-file payloads/invoice.create.json --verify
~/.codex/bin/sevdesk-agent docs invoice-finalize
```

### Installment invoice from an existing invoice

```bash
~/.codex/bin/sevdesk-agent create-invoice-installment \
  --from-invoice 12345 \
  --percent 70 \
  --label "Installment Phase 2" \
  --execute \
  --verify
```

### Recurring invoice clone

```bash
~/.codex/bin/sevdesk-agent invoice clone \
  --from 12345 \
  --period monthly \
  --override-position-price 0=199.00 \
  --execute \
  --verify
```

### Invoice search across headers and positions

```bash
~/.codex/bin/sevdesk-agent find-invoice "acf" --deep-scan --output json
~/.codex/bin/sevdesk-agent read find-invoice --query term="acf" --query deepScan=true --output json
```

## CLI overview

- `~/.codex/bin/sevdesk-agent ops list --read-only`
- `~/.codex/bin/sevdesk-agent op-show <operationId>`
- `~/.codex/bin/sevdesk-agent read <operationId> ...`
- `~/.codex/bin/sevdesk-agent write <operationId> ...`
- `~/.codex/bin/sevdesk-agent find-contact <term> ...`
- `~/.codex/bin/sevdesk-agent resolve-billing-contact <term> ...`
- `~/.codex/bin/sevdesk-agent find-invoice <term> ...`
- `~/.codex/bin/sevdesk-agent create-invoice-installment ...`
- `~/.codex/bin/sevdesk-agent invoice clone ...`
- `~/.codex/bin/sevdesk-agent doctor --json`
- `~/.codex/bin/sevdesk-agent context snapshot ...`

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
- Backoffice-Automatisierung für Finance-Teams
- Multi-Agent-Buchhaltungsabläufe mit explizitem Handoff

## Installation

### 1. Skill installieren

```bash
npx skills add codecell-germany/sevdesk-agent-skill -g --skill sevdesk-agent-cli --agent '*' -y
```

### 2. Lokales CLI einmal bootstrapen

```bash
npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent-skill install --force
```

Dadurch wird der Skill nach `~/.codex/skills/` installiert und der ausführbare CLI-Shim nach:

```bash
~/.codex/bin/sevdesk-agent
```

### 3. CLI verwenden

```bash
~/.codex/bin/sevdesk-agent --help
```

Optional: wenn `~/.codex/bin` auf deinem `PATH` liegt, funktioniert auch:

```bash
sevdesk-agent --help
```

## Schnellstart

Voraussetzungen:

- Node.js >= 20
- `SEVDESK_API_TOKEN`

```bash
export SEVDESK_API_TOKEN="..."
~/.codex/bin/sevdesk-agent read bookkeepingSystemVersion --output json
```

## Workflow-Beispiele

### Kontakt anlegen und verifizieren

```bash
~/.codex/bin/sevdesk-agent find-contact "Muster GmbH" --output json
~/.codex/bin/sevdesk-agent read resolve-billing-contact --query term="Muster GmbH" --output json
~/.codex/bin/sevdesk-agent write createContact --body-file payloads/contact.create.json --verify-contact
```

### Angebot erstellen und PDF exportieren

```bash
~/.codex/bin/sevdesk-agent write createOrder --body-file payloads/order.create.json --verify
~/.codex/bin/sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer-12345.pdf --suppress-content --output json
```

### Rechnung erstellen

```bash
~/.codex/bin/sevdesk-agent write createInvoiceByFactory --body-file payloads/invoice.create.json --verify
~/.codex/bin/sevdesk-agent docs invoice-finalize
```

### Abschlagsrechnung aus bestehender Rechnung

```bash
~/.codex/bin/sevdesk-agent create-invoice-installment \
  --from-invoice 12345 \
  --percent 70 \
  --label "Abschlag Phase 2" \
  --execute \
  --verify
```

### Wiederkehrende Rechnung klonen

```bash
~/.codex/bin/sevdesk-agent invoice clone \
  --from 12345 \
  --period monthly \
  --override-position-price 0=199.00 \
  --execute \
  --verify
```

### Rechnungssuche über Header und Positionen

```bash
~/.codex/bin/sevdesk-agent find-invoice "acf" --deep-scan --output json
~/.codex/bin/sevdesk-agent read find-invoice --query term="acf" --query deepScan=true --output json
```

## CLI-Überblick

- `~/.codex/bin/sevdesk-agent ops list --read-only`
- `~/.codex/bin/sevdesk-agent op-show <operationId>`
- `~/.codex/bin/sevdesk-agent read <operationId> ...`
- `~/.codex/bin/sevdesk-agent write <operationId> ...`
- `~/.codex/bin/sevdesk-agent find-contact <term> ...`
- `~/.codex/bin/sevdesk-agent resolve-billing-contact <term> ...`
- `~/.codex/bin/sevdesk-agent find-invoice <term> ...`
- `~/.codex/bin/sevdesk-agent create-invoice-installment ...`
- `~/.codex/bin/sevdesk-agent invoice clone ...`
- `~/.codex/bin/sevdesk-agent doctor --json`
- `~/.codex/bin/sevdesk-agent context snapshot ...`

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
