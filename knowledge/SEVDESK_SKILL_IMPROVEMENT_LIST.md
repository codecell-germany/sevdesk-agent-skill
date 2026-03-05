# sevdesk-agent-cli: Verbesserungsliste (aus Praxis-Workflows)

Stand: 2026-02-20

## Ziel
Den Ablauf `Kontakt anlegen -> Angebot erstellen -> PDF ausgeben` robust, reproduzierbar und fehlerarm machen.

## P0 (sofort, hohe Wirkung)

1. CLI-PDF-Schutz gegen Nebenwirkungen
- Problem: `orderGetPdf` kann Status/`sendDate` verändern.
- Verbesserung: Default `preventSendBy=1` für `orderGetPdf`/`invoiceGetPdf` (oder `--safe-pdf` standardmäßig aktiv).
- Akzeptanz: PDF-Export ändert bei Standardaufruf keinen Dokumentstatus.

2. Preflight-Validierung für `createOrder`/`createContact`
- Problem: generische `400/23000` Fehler bei unklaren Payload-Problemen.
- Verbesserung: lokale Pflichtfeld-Checks und klare Fehltexte vor API-Call.
- Akzeptanz: fehlende/inkonsistente Felder werden mit konkreter Meldung abgelehnt.

3. Verifizierungsmodus nach Write
- Problem: Folgefehler werden erst spät erkannt (z. B. falsche `customerNumber`, falscher Empfänger).
- Verbesserung: `--verify` für Writes:
  - Kontakt: `customerNumber`, `parent`, Adresse prüfen
  - Angebot: `order.contact.id`, Positionen, Summen, Status prüfen
- Akzeptanz: Write-Befehl liefert zusätzlich eine kompakte Verify-Zusammenfassung.

4. Stabiler CLI-Startweg
- Problem: `sevdesk-agent` kann lokal `permission denied` liefern.
- Verbesserung: Startup-Fallback/Hint auf `node dist/index.js ...` im CLI-Fehlerfall.
- Akzeptanz: Nutzer bekommt immer einen funktionierenden Startbefehl vorgeschlagen.

## P1 (kurzfristig)

5. `find-contact` Kommando
- Problem: `getContacts --query search=...` ist in der Praxis unzuverlässig.
- Verbesserung: `find-contact` mit lokaler Filterlogik über `name`, `name2`, `surename`, `familyname`, `customerNumber`.
- Akzeptanz: reproduzierbare Trefferliste mit Score/Sortierung.

6. `create-offer` High-Level Kommando
- Problem: `createOrder` Payload ist komplex und fehleranfällig.
- Verbesserung: geführtes Kommando (Kontakt, Header, Positionen, Empfängeradresse, Defaults).
- Akzeptanz: Standard-Angebot ohne manuelle JSON-Datei möglich.

7. Direkter PDF-Decode im CLI
- Problem: aktueller Flow braucht `jq` + `base64 -D`.
- Verbesserung: Option `--decode-pdf <path>` bei `read orderGetPdf`/`read invoiceGetPdf`.
- Akzeptanz: ein Kommando erzeugt direkt eine nutzbare PDF-Datei.

8. Nummern-Generator für Angebote
- Problem: Angebotsnummer wird derzeit oft manuell abgeleitet.
- Verbesserung: Helper `next-order-number --type AN --period YYYYMM`.
- Akzeptanz: keine Kollisionen in Standardläufen.

## P2 (mittelfristig)

9. Workflow-Template im Skill
- Verbesserung: festes Runbook in `SKILL.md`:
  - Discovery
  - Kontakt (Firma + Person)
  - Verify
  - Angebot
  - Verify + PDF + Snapshot
- Akzeptanz: jeder Agentlauf folgt derselben Reihenfolge.

10. Quirk-Normalisierung erweitern
- Problem: `ops-quirks --json` Shape ist Object-Mapping, oft falsch als Array geparst.
- Verbesserung: Dokumentation + Beispielparser standardisieren.
- Akzeptanz: alle Knowledge-Beispiele verwenden `to_entries[]`.

11. Safety-Profile
- Verbesserung: Presets wie `--profile safe-read`, `--profile offer-write`.
- Akzeptanz: weniger Parametertippfehler, konsistente Guardrails.

## Konkrete Skill-Textänderungen (empfohlen)

1. In `skills/sevdesk-agent-cli/SKILL.md` ergänzen:
- expliziter Fallback `node dist/index.js ...`
- Pflicht-Hinweis auf `preventSendBy=1` beim PDF-Export
- Standardprozess „Kontakt + Angebot“ als eigene Sektion

2. In `knowledge/SEVDESK_ORDER_WRITE_LEARNINGS.md` beibehalten/erweitern:
- bekannte Edge Cases
- verifizierte Payload-Muster
- Nachkontrollen nach Write

## Priorisierte Umsetzung

1. P0.1 PDF-Schutz
2. P0.2 Preflight-Validator
3. P0.3 Verify-Modus
4. P1.5 `find-contact`
5. P1.7 PDF-Decode

## Umsetzungsstatus (2026-02-20)

### Erledigt
- [x] **P0.1 PDF-Schutz**
  - `read orderGetPdf` / `read invoiceGetPdf` setzen standardmäßig `preventSendBy=1` (`--safe-pdf` default on).
  - deaktivierbar via `--no-safe-pdf`.
- [x] **P0.2 Preflight-Validierung**
  - lokale Validatoren für `write createContact` und `write createOrder`.
  - klare Fehltexte vor API-Call.
- [x] **P0.3 Verify-Modus**
  - `write ... --verify` ergänzt.
  - `createContact`: Prüft `customerNumber`, `parent`, `addressCount`.
  - `createOrder`: Prüft `order.contact.id`, Positionen, Status, `sumNet` (wenn ableitbar).
- [x] **P1.5 find-contact**
  - neues Kommando `find-contact <term> --output pretty|json --limit <n>`.
  - lokales Scoring auf `name`, `name2`, `surename`, `familyname`, `customerNumber`.
- [x] **P1.7 PDF-Decode**
  - `read orderGetPdf|invoiceGetPdf --decode-pdf <path>` schreibt direkt PDF-Datei.

### Zusätzlich umgesetzt
- [x] Stabiler Start-Hinweis:
  - CLI-Fehlerausgabe enthält Fallback: `node dist/index.js <command>`.
- [x] Skill/Cheatsheet aktualisiert:
  - Runbook „Kontakt + Angebot + PDF“ in `skills/sevdesk-agent-cli/SKILL.md`.
  - `ops-quirks --json` Mapping-Hinweis (`to_entries[]`) dokumentiert.

### Nachgezogen (2026-02-20, Runde 2)
- [x] `ops-quirks --json-array`
  - liefert stabiles Array-Format für Parser (`[{ operationId, ...quirk }]`).
- [x] `--verify-contact` für `write createContact`
  - dedizierte Verify-Pipeline für Kontaktanlage.
  - standardmäßig mit CustomerNumber-Auto-Fix via `updateContact` bei Mismatch.
  - deaktivierbar via `--no-fix-contact`.
- [x] Rechnung-Edit-Transparenz
  - `updateInvoice` wird bei Nutzung explizit als „nicht vorhanden“ erklärt.
  - neues Runbook-Kommando: `sevdesk-agent docs invoice-edit`.

### Offen (nicht Teil dieser Umsetzungsrunde)
- [ ] P1.6 `create-offer` High-Level Kommando
- [ ] P1.8 Nummern-Generator `next-order-number`
- [ ] P2.11 Safety-Profile (`--profile ...`)

## OpenAPI Coverage Audit (2026-02-27)

- Quelle: `https://api.sevdesk.de/openapi.yaml`
- Ergebnis:
  - OpenAPI Operationen: 154
  - In CLI-Katalog vorhanden (`src/data/operations.json`): 154/154
  - Method/Path/Tag-Mismatch: 0
- Aktueller funktionaler Caveat:
  - `voucherUploadFile` (`POST /Voucher/Factory/uploadTempFile`) erwartet `form-data` mit Binärdatei.
  - CLI-Client sendet derzeit nur JSON-Body (`Content-Type: application/json`).
  - Folge: Endpoint ist im Katalog sichtbar, aber praktisch nicht nutzbar, bis Multipart/Form-Data unterstützt wird.
- Detaillierter Einzel-Check:
  - `knowledge/OPENAPI_CLI_COVERAGE_CHECKLIST.md`
  - `knowledge/OPENAPI_CLI_COVERAGE_CHECKLIST.json`

## Workflow-Änderung: Delete-only Guard (2026-02-27)

- Bisher: alle non-GET Operationen waren mit Write-Guard blockiert.
- Neu: nur `DELETE` Operationen sind guarded.
  - Required: `--execute --confirm-execute yes` + `SEVDESK_ALLOW_WRITE=true` (oder `--allow-write`)
- `POST` / `PUT` / `PATCH` laufen direkt (inkl. bestehender Preflight/Verify-Features).
- Ziel: weniger Reibung in Agent-Workflows bei gleichzeitiger Absicherung destruktiver Aktionen.

## Umsetzung aus Prozess-Feedback Rechnung (2026-02-27)

- [x] `createInvoiceByFactory` Verify erweitert
  - Prüft jetzt: `invoice.contact.id`, Positionen, `status`, `taxRule`, `sumNet/sumTax/sumGross`, `invoiceNumber`.
- [x] PDF-Output entschlackt bei `--decode-pdf`
  - Neue Read-Option: `--suppress-content` (default aktiv), entfernt base64-`content` aus CLI-Output.
- [x] Rechnung-Finalisierung als Runbook ergänzt
  - Neues Kommando: `sevdesk-agent docs invoice-finalize`.

## Prozess-Feedback: Rechnung erzeugen (2026-02-27)

### Was gut war
1. Read-first Ablauf war stabil
- Discovery + Analyse (`ops list`, `op-show`, `ops-quirks`, Reads auf Kontakte/Rechnungen) funktionierten zuverlässig.

2. Rechnungserstellung per Factory-Endpoint funktionierte im ersten Write
- `createInvoiceByFactory` lieferte sauber `201` mit `invoice.id`.
- Einfache 1-Positions-Rechnung ließ sich ohne API-Fehler erzeugen.

3. Empfängersteuerung ist gut lösbar
- Person als Unterkontakt konnte direkt als Rechnungsempfänger gesetzt werden (`invoice.contact.id`).
- Explizites multiline-`invoice.address` stabilisierte die PDF-Anschrift.

4. PDF-Export technisch zuverlässig
- `invoiceGetPdf --decode-pdf <path>` erzeugte lokal sofort eine nutzbare PDF-Datei.

5. Kontext-Handoff gut gelöst
- `context snapshot` lieferte die Übergabe-Datei konsistent.

### Was nicht gut war
1. Sehr große stdout-Ausgabe bei PDF-Reads trotz `--decode-pdf`
- Die API liefert weiterhin base64 im JSON-Body; das bläht CLI-Ausgabe und Agent-Context stark auf.

2. Kein Verify-Modul für Rechnungsanlage
- `--verify` bei `createInvoiceByFactory` meldete: `No built-in verification`.
- Dadurch fehlen automatische Nachprüfungen (Empfänger, Positionen, Summen, Status, Nummerierung).

3. Unklare Finalisierung/Nummerierung
- `invoiceRender` gab `201`, aber Rechnung blieb `status=100` und `invoiceNumber=null`.
- Für den Agenten ist der finale Weg zur Nummerierung nicht hinreichend geführt (Render vs. Send/Finalize).

4. `op-show` ist für komplexe Writes zu dünn
- Pflichtfelder/Schema für `createInvoiceByFactory` mussten aus OpenAPI separat gelesen werden.
- Das kostet Zeit und erhöht Fehlerwahrscheinlichkeit.

### Konkrete Verbesserungen (Backlog)

#### P0
1. `createInvoiceByFactory` Verify implementieren
- Prüfen: `contact.id`, Positionsanzahl, `sumNet/sumTax/sumGross`, `status`, `invoiceNumber`, `taxRule`.

2. `invoice-finalize` Runbook/Command ergänzen
- Klarer, robuster Ablauf: Draft -> Nummerierung/Finalstatus -> PDF ohne Seiteneffekte.
- Ergebnis soll maschinenlesbar bestätigen, dass Nummer vergeben wurde.

3. PDF-Read-Output entschlacken
- Option wie `--suppress-content` oder automatisches Entfernen von `data.objects.content` bei `--decode-pdf`.

#### P1
4. `op-show --schema` oder `docs write-op <operationId>`
- Zeigt Required-Felder + Minimal-Beispielpayload direkt aus CLI.

5. `create-invoice` High-Level Kommando
- Geführter Aufruf analog Angebots-Workflow (Empfänger, Positionen, Steuer, Adresse, Verify, PDF).

## Umsetzung aus User-Feedback (2026-03-05)

Quelle: direktes Praxis-Feedback zu robusteren Rechnungs-/Kontakt-Workflows.

### Ergebnisübersicht

- [x] `find-contact` konsistent gemacht
  - Top-Level bleibt erhalten: `sevdesk-agent find-contact <term>`
  - Read-Alias ergänzt: `sevdesk-agent read find-contact --query term=<term>`
  - Ziel: weniger Fehlaufrufe in agentischen Flows.

- [x] Rechnungssuche über Positionstexte ergänzt
  - Neues Kommando: `sevdesk-agent find-invoice <term> --deep-scan`
  - Alias: `sevdesk-agent search-invoices <term>`
  - Felder: `invoiceNumber`, `header`, `address`, `customerInternalNote`, optional Positionen (`name`, `text`).

- [x] Native Abschlagsrechnung aus Vorlage
  - Neues Kommando: `sevdesk-agent create-invoice-installment --from-invoice <id> --percent <n> --label "<text>"`
  - Erstellt Payload aus Quellrechnung + Positionen mit prozentual skalierten Preisen.
  - Dry-run standardmäßig; API-Write nur mit `--execute`.

- [x] Klare Datumsvalidierung vor Write
  - Preflight für `createInvoiceByFactory` validiert `invoiceDate`, `deliveryDate`, `deliveryDateUntil`.
  - Konkrete Fehlhinweise vor API-Call.
  - Optionaler Auto-Fix: `--auto-fix-delivery-date` (setzt `deliveryDate = invoiceDate + 1 Tag`).

- [x] Kontakt-/Ansprechpartner-Auflösung vereinfacht
  - Neues Kommando: `sevdesk-agent resolve-billing-contact <term>`
  - Liefert empfohlene `contact.id` plus Address-Preview.

- [x] Clone-Funktion für wiederkehrende Rechnungen
  - Neues Kommando: `sevdesk-agent invoice clone --from <id> --period monthly|yearly|weekly|daily`
  - Selektive Positions-Preis-Overrides via `--override-position-price <index>=<price>`.

- [x] Strukturiertere Fehlerausgaben
  - Bei bekannten 4xx-Fehlern werden `remediationHints` ergänzt.
  - Beispiele: Datumsrelation, fehlende Positionen, Tax-Mismatch, fehlender Kontakt, Auth/404.

- [x] Skill-Doku und CLI-Verhalten synchronisiert
  - `skills/sevdesk-agent-cli/SKILL.md` aktualisiert.
  - `skills/sevdesk-agent-cli/references/command-cheatsheet.md` aktualisiert.
  - Self-check ergänzt: `sevdesk-agent doctor` / `sevdesk-agent self-check`.
  - Agent-Prompt angepasst: `skills/sevdesk-agent-cli/agents/openai.yaml`.

### Offene Punkte aus Feedback (bewusst nicht Teil dieser Runde)

- [ ] High-level `create-offer` Wizard (interaktives Guided Command)
- [ ] `next-order-number` Helper
- [ ] `op-show --schema` / `docs write-op <operationId>` mit Required-Feldern aus Schema
- [ ] Safety-Profile (`--profile safe-read`, `--profile offer-write`)
