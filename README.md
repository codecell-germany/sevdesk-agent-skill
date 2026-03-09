# sevdesk-agent-skill

---

# English

## Purpose

`sevdesk-agent-skill` gives agents full remote control over a sevdesk bookkeeping system. The goal is to automate accounting workflows end to end: contacts, quotes, invoices, PDF exports, verification steps, and structured handoff between agents.

It is built for companies that want to run recurring accounting processes through agents instead of manual UI work.

## What it does

- Read and inspect the full sevdesk API through operation IDs.
- Execute write operations for contacts, quotes, invoices, and related bookkeeping workflows.
- Search contacts and invoices in a workflow-friendly way.
- Generate installment invoices and cloned recurring invoices from existing data.
- Export PDFs safely and decode them directly to files.
- Verify important writes immediately after execution.
- Capture context snapshots for multi-agent continuation.

## Main use cases

- Fully automated contact-to-quote workflows.
- Automated invoice generation from structured payloads or existing invoice templates.
- Recurring accounting processes such as monthly or yearly invoice creation.
- Agent handoffs where one agent discovers state and another agent finishes the workflow.
- Backoffice automation for finance teams that want reproducible, scriptable bookkeeping operations.

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
sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer-12345.pdf --output json
```

### Invoice creation

```bash
sevdesk-agent write createInvoiceByFactory --body-file payloads/invoice.create.json --verify
sevdesk-agent docs invoice-finalize
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
- `sevdesk-agent read <operationId> ...`
- `sevdesk-agent write <operationId> ...`
- `sevdesk-agent find-contact <term> ...`
- `sevdesk-agent resolve-billing-contact <term> ...`
- `sevdesk-agent find-invoice <term> ...`
- `sevdesk-agent create-invoice-installment ...`
- `sevdesk-agent invoice clone ...`
- `sevdesk-agent doctor --json`
- `sevdesk-agent context snapshot ...`

## Installation

Install the skill globally through skills.sh:

```bash
npx skills add codecell-germany/sevdesk-agent-skill -g --skill sevdesk-agent-cli --agent '*' -y
```

List skills in this repository:

```bash
npx skills add codecell-germany/sevdesk-agent-skill -l
```

Run the CLI directly from npm:

```bash
npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent --help
```

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

`sevdesk-agent-skill` gibt Agenten vollständige Fernsteuerung über ein sevdesk-Buchhaltungssystem. Ziel ist es, Buchhaltungsprozesse Ende zu Ende zu automatisieren: Kontakte, Angebote, Rechnungen, PDF-Exporte, Verifikationsschritte und strukturierte Übergaben zwischen Agenten.

Das Paket ist für Firmen gedacht, die wiederkehrende Buchhaltungsabläufe nicht mehr manuell in der UI abarbeiten wollen, sondern agentisch und reproduzierbar ausführen möchten.

## Was der Skill ermöglicht

- Die gesamte sevdesk-API über Operation-IDs lesen und steuern.
- Write-Workflows für Kontakte, Angebote, Rechnungen und angrenzende Buchhaltungsprozesse ausführen.
- Kontakte und Rechnungen workflow-tauglich suchen.
- Abschlagsrechnungen und wiederkehrende Rechnungen aus bestehenden Daten erzeugen.
- PDFs sicher exportieren und direkt als Datei schreiben.
- Wichtige Writes direkt nach dem Ausführen verifizieren.
- Context-Snapshots für Multi-Agent-Workflows erstellen.

## Typische Anwendungsfälle

- Vollautomatisierte Kontakt-zu-Angebot-Workflows.
- Automatisierte Rechnungserstellung aus Payloads oder vorhandenen Rechnungsvorlagen.
- Wiederkehrende Buchhaltungsprozesse wie monatliche oder jährliche Rechnungsstellung.
- Agent-Handoffs, bei denen ein Agent den Zustand analysiert und ein anderer Agent den Workflow abschließt.
- Backoffice-Automatisierung für Finance-Teams, die reproduzierbare und skriptbare Buchhaltungsprozesse wollen.

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
sevdesk-agent read orderGetPdf --path orderId=12345 --decode-pdf output/offer-12345.pdf --output json
```

### Rechnung erstellen

```bash
sevdesk-agent write createInvoiceByFactory --body-file payloads/invoice.create.json --verify
sevdesk-agent docs invoice-finalize
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
- `sevdesk-agent read <operationId> ...`
- `sevdesk-agent write <operationId> ...`
- `sevdesk-agent find-contact <term> ...`
- `sevdesk-agent resolve-billing-contact <term> ...`
- `sevdesk-agent find-invoice <term> ...`
- `sevdesk-agent create-invoice-installment ...`
- `sevdesk-agent invoice clone ...`
- `sevdesk-agent doctor --json`
- `sevdesk-agent context snapshot ...`

## Installation

Skill global über skills.sh installieren:

```bash
npx skills add codecell-germany/sevdesk-agent-skill -g --skill sevdesk-agent-cli --agent '*' -y
```

Skills in diesem Repository auflisten:

```bash
npx skills add codecell-germany/sevdesk-agent-skill -l
```

CLI direkt aus npm starten:

```bash
npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent --help
```

## Projektstruktur

- `src/`: CLI-Quellcode
- `skills/sevdesk-agent-cli/SKILL.md`: Skill-Definition
- `knowledge/`: begleitende Wissensdokumente und generierte Referenzen

## Tests

```bash
npm test
npm run test:live
```

## Lizenz

MIT
