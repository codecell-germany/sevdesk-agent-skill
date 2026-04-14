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
- Verbesserung: globales CLI auf `PATH` via `npm install -g @codecell-germany/sevdesk-agent-skill`; der Codex-Bootstrap bleibt nur noch als zusätzlicher Helper.
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
- explizite Einrichtung des globalen `sevdesk-agent`-CLI auf `PATH`
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
  - CLI-Fehlerausgabe enthält jetzt den globalen Installationshinweis für `sevdesk-agent`.
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

## CLI-Installations-Änderung (2026-03-28)

- Standardpfad für Agenten ist jetzt das globale CLI auf `PATH`:
  - `sevdesk-agent`
- Primärer Installationsweg:
  - `npm install -g @codecell-germany/sevdesk-agent-skill`
- Der Codex-Installer bleibt als ergänzender Helper bestehen:
  - `npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent-skill install --force`
- Ziel:
  - agentenübergreifend derselbe Aufruf für Codex, Claude, Gemini und andere Terminal-Agenten
  - keine dokumentierten Pfadaufrufe wie `~/.codex/bin/sevdesk-agent ...`

## OpenAPI Coverage Audit (2026-03-26)

- Quelle: `https://api.sevdesk.de/openapi.yaml`
- Ergebnis:
  - OpenAPI Operationen: 154
  - In CLI-Katalog vorhanden (`src/data/operations.json`): 154/154
  - Method/Path/Tag-Mismatch: 0
- Neuer Stand:
  - `voucherUploadFile` (`POST /Voucher/Factory/uploadTempFile`) ist jetzt im CLI auch praktisch nutzbar.
  - Der Client unterstützt `multipart/form-data`.
  - Low-Level-Nutzung: `sevdesk-agent write voucherUploadFile --form-file file=/absolute/path/to/beleg.pdf`
  - High-Level-Nutzung: `sevdesk-agent create-voucher-from-pdf ...`
- Detaillierter Einzel-Check:
  - `knowledge/OPENAPI_CLI_COVERAGE_CHECKLIST.md`
  - `knowledge/OPENAPI_CLI_COVERAGE_CHECKLIST.json`

## Buchhaltungs-MVP: Belege + Transaktionen (2026-03-26)

- [x] Multipart-Upload im HTTP-Client
  - `SevdeskClient` kann jetzt `formData` senden.
- [x] Generic multipart write support
  - `write <operationId>` unterstützt `--form-field` und `--form-file`.
- [x] `create-voucher-from-pdf`
  - validiert lokale Datei
  - dry-run standardmäßig
  - lädt Datei bei `--execute` hoch und erzeugt den Voucher
  - unterstützt `--verify`
- [x] `find-transaction`
  - serverseitige Filter + lokale Scoring-Hilfe
- [x] `match-transaction`
  - liest bestehenden Voucher
  - sucht passende Transaktionen
  - gibt Kandidaten + vorgeschlagenen `book-voucher`-Aufruf aus
- [x] `book-voucher`
  - dry-run standardmäßig
  - kapselt `bookVoucher`
  - unterstützt `--transaction-id` und `--verify`
- [x] `assign-voucher-to-transaction`
  - expliziter Workflowname für den Fall "Transaktion vorgeben und im selben Schritt buchen"
  - nutzt technisch ebenfalls den Sevdesk-Booking-Endpoint
- [x] Verify erweitert
  - `voucherFactorySaveVoucher`
  - `bookVoucher`
- [x] Preflight erweitert
  - `voucherFactorySaveVoucher`
  - `bookVoucher`

## Agenten-Ergonomie für Buchungsworkflows (2026-04-12)

- [x] Writes schlagen jetzt auf Shell-Ebene sauber fehl
  - wenn die HTTP-Antwort `ok: false` ist
  - oder wenn die eingebaute Verifikation `ok: false` zurückgibt
- [x] `bookVoucher`-Verifikation pollt jetzt auf Write-Propagation
  - bis Voucher-Status und `paidAmount` konsistent sind
  - liefert `attempts` und `pendingWritePropagation`
- [x] `voucher inspect`
  - aggregiert Voucher-Header, Summen, Status, Zahlstatus, Dokument und Positionen in einer Antwort
- [x] `voucher book-existing`
  - liest bestehenden Voucher und Transaktion
  - leitet das Booking-Payload daraus ab
  - dry-run standardmäßig, `--execute` für die echte Buchung
- [x] `transaction find-match`
  - semantischer Such-Wrapper für Lieferant/Betrag/Datum/Richtung
- [x] `transaction list-open-expenses`
  - schnelle Standardabfrage für offene Ausgabentransaktionen
- [x] `expense process-paid`
  - kombiniert PDF-Upload, Voucher-Anlage und Buchung gegen eine bestehende Transaktion
  - akzeptiert strukturierte Eingaben statt nur rohe Low-Level-Schritte

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

## Nachoptimierung (2026-03-05, Runde 2)

- [x] Read-Helper-Aliases für Workflow-Konsistenz erweitert
  - `read resolve-billing-contact --query term=...`
  - `read find-invoice --query term=... --query deepScan=true`
  - Ziel: gleiche Nutzungskonvention wie bei `read find-contact`, weniger Fehlaufrufe.

- [x] Preflight für `createInvoiceByFactory` weiter gehärtet
  - prüft jetzt zusätzlich:
    - `invoice.contact.id`
    - `invoice.invoiceType`
    - `invoice.status`
    - `invoicePosSave[*].quantity/price/taxRate` auf gültige Zahlenbereiche
  - Ziel: häufige 400/422 bereits vor API-Call abfangen.

## Edit-Workflows (2026-04-10)

- [x] `order edit` als High-Level-Workflow ergänzt
  - `sevdesk-agent order edit --order-id <id> ... --verify`
  - nutzt `updateOrder`
  - read-before-write, Preflight und Verify sind integriert

- [x] `contact edit` als High-Level-Workflow ergänzt
  - `sevdesk-agent contact edit --contact-id <id> ... --verify`
  - nutzt `updateContact`
  - kann optional genau eine bestehende `ContactAddress` mit aktualisieren
  - read-before-write, Preflight und Verify sind integriert

- [x] `invoice recreate` als sicherer Rechnungs-Fallback ergänzt
  - `sevdesk-agent invoice recreate --from <id> --patch-file <json> --verify`
  - nutzt bewusst `createInvoiceByFactory` statt einer nicht existierenden generischen `updateInvoice`-Route

- [x] Preflight/Verify für Update-Fälle erweitert
  - `updateOrder`
  - `updateContact`
  - `updateContactAddress`

- [x] Doku und Skill synchronisiert
  - README ergänzt
  - `skills/sevdesk-agent-cli/SKILL.md` ergänzt
  - Cheatsheet ergänzt
  - `knowledge/SEVDESK_EDIT_CAPABILITY_GUIDE.md` auf Umsetzungsstand aktualisiert

## Öffentliche Produktform und Release-Hygiene (2026-04-12)

- [x] README auf aktuelles CodeCell-Muster nachgezogen
  - klare Public Surface
  - Install + Verify + First Run weiter nach oben gezogen
  - bessere Abgrenzung zwischen CLI und Skill-Installer

- [x] npm-Metadaten modernisiert
  - aussagekräftigere Paketbeschreibung
  - `keywords`, `repository`, `homepage`, `bugs`

- [x] Skill-Kurzbeschreibung verbreitert
  - Listing beschreibt jetzt nicht mehr nur Kontakte/Angebote/Rechnungen
  - Voucher-, Matching- und Buchungs-Workflows werden als Teil der Produktoberfläche sichtbar

- [x] `prepack` gehärtet
  - Build + Unit-Tests + Doku-Refresh laufen vor dem Packen

- [x] npm-Dateiliste entschlackt
  - interne Prozess-/Publishing-Dokumente fliegen aus dem Paket
  - nur produktrelevante Artefakte bleiben in der öffentlichen npm-Auslieferung

## Buchhalter-Feedback Runde 2 (2026-04-14)

- [x] Richtungslogik für Buchungen gegen negative Bank-/Kartenbewegungen verbessert
  - `voucher book-existing`, `book-voucher`, `assign-voucher-to-transaction` und `expense process-paid` unterstützen jetzt `--direction auto|expense|revenue`
  - `book-existing` leitet das Vorzeichen standardmäßig aus Transaktion und `creditDebit` ab
  - `transaction find-match` bewertet Beträge jetzt auch absolut, damit negative Feed-Transaktionen zu positiven Voucher-Summen passen

- [x] `bookVoucher`-Preflight für reale Ausgabenbuchungen geöffnet
  - negative Beträge sind nicht mehr pauschal blockiert
  - Differenz-/Gebührenfelder werden validiert
  - fehlendes `accountingType.id` ist bei Voucher-Erstellung jetzt Warnung statt Hard-Block

- [x] `bookVoucher`-Verify gegen falsche Negativzustände gehärtet
  - prüft jetzt Betragshöhe über Absolutwert
  - markiert negative `paidAmount` explizit als Fehlzustand
  - `pendingWritePropagation` bleibt erhalten

- [x] Gebühren-/Differenzfelder an High-Level-Buchungsbefehlen ergänzt
  - `differenceReason`
  - `differenceAmount`
  - `feeAmount`
  - nutzbar in `book-voucher`, `assign-voucher-to-transaction`, `voucher book-existing`, `expense process-paid`

- [x] Neue Kontierungs-Resolver ergänzt
  - `sevdesk-agent accounting resolve --account-number ...`
  - `sevdesk-agent accounting resolve --account-datev-id ...`
  - `sevdesk-agent accounting resolve-tax-rule --tax-rule ...`
  - `forAccountNumber` fällt bei Fehlern automatisch auf `forExpense` / `forRevenue` / `forAllAccounts` zurück

- [x] Referenzvoucher- und Policy-Unterstützung für bezahlte Ausgaben ergänzt
  - `expense process-paid --reference-voucher-id <id>`
  - `--policy actual-eur-charge`
  - `--policy gross-fallback`
  - 0,01-EUR-Drift zwischen netto abgeleiteter Bruttosumme und Transaktion wird erkannt und kann automatisch auf Bruttologik wechseln

- [x] Semantische Eskalation für Schaden-/Versicherungsfälle ergänzt
  - `--policy damage-settlement` liefert bewusst einen `manual-ui-damage-settlement`-Block statt einen fragilen Automatisierungsversuch
  - ähnliche Muster (`Umsatzsteuerausgleich`, `Versicherung`, `Schadensersatz`, `Entschädigung`) werden in der Workflow-Logik und Remediation besonders markiert

- [x] Öffentliche Doku und Skill auf den neuen Buchungsmodus synchronisiert
  - README ergänzt um Direction-, Resolver-, Gebühren- und Sonderfall-Beispiele
  - `skills/sevdesk-agent-cli/SKILL.md` beschreibt die Richtungsauswahl, Referenzvoucher-Nutzung und den manuellen Eskalationspfad jetzt explizit
  - Cheatsheet und Agent-Prompt aktualisiert
