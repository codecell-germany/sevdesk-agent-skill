# SevDesk Minimal-Call Workflow (Kontakt -> Ansprechpartner -> Angebot)

Stand: 2026-03-04

## Ziel
So wenig API-Calls wie möglich, aber trotzdem sicher und reproduzierbar.

## Prinzip
- Nur zielgerichtete Reads auf den betroffenen Kunden.
- Keine globalen Listen-Reads (z. B. `getOrders --limit=500`) ohne zwingenden Grund.
- Writes nur für fehlende Daten.
- Nach jedem Write genau ein Verify-Read.

## Call-Budget (Richtwert)
- Discovery: 3 Calls
- Kundenprüfung: 2-3 Calls
- Anlage Firma + Adresse + Ansprechpartner + Angebot: 4-6 Writes
- Verifikation: 3 Reads
- PDF: 1 Read
- Snapshot: 1 Call

Gesamt: typischerweise 14-17 Calls.

## Standardablauf

### 1) Discovery (immer gleich)
1. `ops list --read-only`
2. `op-show createContact`
3. `ops-quirks`

### 2) Zielkontakt prüfen (nur konkret)
1. `find-contact "<kundenname>"`
2. Falls Treffer: `getContactById`
3. Falls Firma vorhanden: `getContactAddresses --query 'contact[id]=<id>'`
4. Ansprechpartner nur über Parent-Filter prüfen:
   - `getContacts --query limit=1000` lokal filtern auf `parent.id == <firmaId>`

Wichtig:
- `find-contact` ist ein eigenes Top-Level-Kommando.
- Nicht als `read` aufrufen (`sevdesk-agent read find-contact ...`), sonst `Unknown operationId`.

### 3) Kundendaten anlegen (nur wenn fehlend)

#### 3.1 Firma anlegen
Empfehlung aktuell (robuster Live-Path):
- `createContact` mit **flachem Body**
- falls Preflight blockt: `--no-preflight`

Beispielstruktur:
```json
{
  "objectName": "Contact",
  "name": "<Firma>",
  "status": 1000,
  "customerNumber": "<nummer>",
  "category": { "id": 3, "objectName": "Category" }
}
```

#### 3.2 Firmenadresse anlegen
- `createContactAddress` mit Kategorie `43` und `StaticCountry`.

#### 3.3 Kommunikationswege anlegen (optional, aber empfohlen)
- `createCommunicationWay` EMAIL (key `2`)
- `createCommunicationWay` WEB (key `2`)

#### 3.4 Ansprechpartner anlegen
- eigener Kontakt mit `parent` auf Firmenkontakt.
- customerNumber direkt prüfen; bei Mismatch sofort `updateContact`.

### 4) Angebot erstellen
1. `createOrder` mit:
   - `orderType: "AN"`
   - `contact.id` = Ansprechpartner-ID
   - `address` explizit (Firma + Person + Straße/PLZ/Ort)
2. Positionen möglichst kompakt (1-3 Positionen, klare Leistungszusammenfassung).

### 5) Verifikation
1. `getOrderById`
2. `getOrderPositionsById`
3. `getContactById` (Firma + Ansprechpartner)

### 6) PDF + Snapshot
1. `orderGetPdf --decode-pdf <output.pdf>`
2. `context snapshot --output .context/sevdesk-context-snapshot.json --include-default --include-plans --max-objects 20`

## Bekannte Stolpersteine
1. `createContact`:
- Preflight erwartet teils `contact`-Wrapper, Live-API funktioniert stabiler mit flachem Payload.
- Bis CLI vereinheitlicht ist: bei Fehlern gezielt auf `--no-preflight` wechseln.

2. Ansprechpartner-Nummern:
- kann unerwartet auf Firmennummer gesetzt werden.
- immer unmittelbar nach Erstellung prüfen und ggf. `updateContact` ausführen.

3. PDF-Response:
- enthält Base64-Content und kann stdout aufblasen.
- bei Agentläufen Ausgabe direkt mit `jq` auf Metadaten reduzieren.

4. Kontakt-Suche:
- `find-contact` priorisieren.
- Fallback bei Personen ohne Treffer: `getContacts --query depth=1` und lokal nach `surename`/`familyname` filtern.

## Do / Don't
- Do: nur kundenbezogene Reads.
- Do: sofortiges Verify nach jedem Write.
- Do: explizite Empfängeradresse im Angebot setzen.
- Don't: breit gestreute Such-Reads über fremde Kunden.
- Don't: doppelte Preflight-Experimente ohne Fallback-Strategie.
