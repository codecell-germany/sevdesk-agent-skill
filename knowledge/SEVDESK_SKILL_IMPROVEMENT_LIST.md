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

### Offen (nicht Teil dieser Umsetzungsrunde)
- [ ] P1.6 `create-offer` High-Level Kommando
- [ ] P1.8 Nummern-Generator `next-order-number`
- [ ] P2.11 Safety-Profile (`--profile ...`)
