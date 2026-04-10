# SevDesk Edit Capability Guide

## Stand vom 10.04.2026

Diese Notiz beschreibt den tatsächlichen Stand der Editierbarkeit im aktuellen SevDesk-CLI und was für einen verlässlichen Agenten-Workflow noch fehlt.

## Update vom 10.04.2026

Seit dieser Revision sind folgende High-Level-Workflows im CLI ergänzt:

- `sevdesk-agent order edit --order-id <id> ...`
- `sevdesk-agent contact edit --contact-id <id> ...`
- `sevdesk-agent invoice recreate --from <id> ...`

Damit gilt:

- Angebote/Orders sind jetzt nicht nur über Low-Level-`write updateOrder`, sondern auch ergonomisch editierbar.
- Kontakte sind jetzt nicht nur über Low-Level-`write updateContact`, sondern auch ergonomisch editierbar.
- Für Rechnungen gibt es weiterhin **keine** generische `updateInvoice`-Route, aber jetzt einen expliziten sicheren Fallback über `invoice recreate`.

## 1. Was im aktuellen API-Katalog vorhanden ist

### Rechnungen
Vorhanden:
- `createInvoiceByFactory` -> neue Rechnung anlegen
- `getInvoiceById` -> Rechnung lesen
- `getInvoicePositionsById` -> Positionen lesen
- `invoiceResetToDraft` -> Status zurück auf Entwurf
- `invoiceResetToOpen` -> Status zurück auf offen
- `invoiceRender` -> Dokument neu rendern
- `cancelInvoice` -> stornieren
- `invoiceSendBy` / `sendInvoiceViaEMail` -> Versand
- `bookInvoice` -> Zahlungen buchen
- `updateInvoiceTemplate` -> `PUT /Invoice/{invoiceId}/changeParameter`

Nicht vorhanden:
- **kein generisches `updateInvoice`**
- **keine `updateInvoicePosition`-Route**
- **keine `deleteInvoicePosition`-Route**
- **keine `deleteInvoice`-Route**

Praktische Folge:
- Eine Rechnung kann aktuell **nicht generisch wie ein Angebot oder Kontakt editiert** werden.
- Es gibt nur statusbasierte Aktionen und eine spezielle `changeParameter`-Route, deren Umfang im CLI heute nicht als robuster allgemeiner Edit-Workflow modelliert ist.

### Angebote / Orders
Vorhanden:
- `updateOrder` -> Angebot direkt editierbar
- `updateOrderPosition` -> Positionsänderung möglich
- `deleteOrderPos` -> Position löschbar
- `deleteOrder` -> Angebot löschbar
- `updateOrderTemplate` -> Template-/Parameteränderung

Praktische Folge:
- Angebote sind im Katalog deutlich besser editierbar als Rechnungen.

### Kontakte
Vorhanden:
- `updateContact`
- `updateContactAddress`
- `deleteContact`
- `deleteContactAddress`

Praktische Folge:
- Kontakte und Adressen sind generisch editierbar.

## 2. Was daraus für Agenten folgt

### Rechnungen
Ein Agent kann aktuell zuverlässig:
- neue Rechnungen anlegen
- Rechnungen lesen
- PDF rendern
- Status wechseln
- Rechnungen stornieren
- Zahlungen buchen

Ein Agent kann aktuell **nicht zuverlässig generisch**:
- Header ändern
- Adressblock ändern
- Positionen ersetzen
- einzelne Positionen löschen
- Rechnung komplett löschen
- eine bestehende Rechnung wie ein Objekt patchen

### Angebote
Ein Agent kann Angebote heute bereits sinnvoll editieren, wenn der CLI-Wrapper die Operationen sauber exponiert.

### Kontakte
Ein Agent kann Kontakte bereits sinnvoll editieren.

## 3. Klare Empfehlung für den Entwickler

## A. Rechnungen: High-Level-Edit-Workflow einführen

Nicht nur Low-Level-Operations freigeben, sondern einen robusten Workflow:

### Neues Kommando
- `sevdesk-agent invoice edit --invoice-id <id> ...`

### Ziel
Ein Agent soll gezielt diese Änderungen durchführen können:
- `--header`
- `--head-text`
- `--foot-text`
- `--address`
- `--invoice-date`
- `--delivery-date`
- `--time-to-pay`
- Positionen hinzufügen, ersetzen, entfernen

### Empfohlene interne Logik
1. Rechnung lesen
- `getInvoiceById`
- `getInvoicePositionsById`

2. Status prüfen
- wenn nicht editierbar: je nach Prozess `invoiceResetToDraft`

3. Edit-Strategie wählen

#### Strategie 1: Native Mutation, wenn SevDesk das wirklich trägt
- prüfen, welche Felder `updateInvoiceTemplate` tatsächlich akzeptiert
- nur dann für Header-/Template-nahe Felder verwenden

#### Strategie 2: Korrigierte Ersatzrechnung erzeugen
Wenn Rechnung inhaltlich geändert werden muss und keine sichere Native-Mutation existiert:
- alte Rechnung bleibt bestehen oder wird gemäß Prozess storniert
- neue Rechnung wird aus altem Read-Modell rekonstruiert
- gewünschte Änderungen werden angewendet
- Ergebnis wird als neue Entwurfsrechnung geschrieben

Diese Strategie muss im CLI **explizit eingebaut** werden, statt Agenten dazu zu zwingen, Rohpayloads manuell zu bauen.

### Umsetzungsstand
- `sevdesk-agent invoice recreate --from <id> --patch-file <json> --verify` ist umgesetzt.
- `invoice edit` als direkte generische Mutation bleibt bewusst offen, bis der Feldumfang von `updateInvoiceTemplate` sauber verifiziert ist.

### Wichtige Guardrails
- niemals Final-/Buchungszustände blind überschreiben
- vor Mutation immer Status lesen
- nach Mutation immer verifizieren:
  - Header
  - Positionen
  - Summen
  - Status
  - Kontakt/Empfänger

## B. Angebote: Edit-Workflow ergonomisch machen

Da die API es schon kann, fehlt hier vor allem Komfort.

### Umsetzungsstand
- `sevdesk-agent order edit --order-id <id> ... --verify` ist umgesetzt.
- Positionsspezifische High-Level-Kommandos (`order add-pos`, `order replace-pos`) bleiben offen.

### Verify einbauen
Nach `updateOrder` und `updateOrderPosition` direkt prüfen:
- Kopfdaten korrekt?
- Positionen korrekt?
- Summen plausibel?

## C. Kontakte: High-Level-Fix-Kommandos ergänzen

Die Basisoperationen sind da, aber für Agenten sind diese Workflows zu kleinteilig.

### Umsetzungsstand
- `sevdesk-agent contact edit --contact-id <id> ... --verify` ist umgesetzt.
- Der Workflow kann optional genau eine bestehende Rechnungsadresse mit aktualisieren.
- Struktur-Kommandos wie `contact link-person-to-company` bleiben offen.

### Verify einbauen
- Parent korrekt?
- Customer number korrekt?
- Rechnungsadresse korrekt?
- Kommunikationswege vorhanden?

## 4. Technische Mindestanforderungen für verlässliche Editierbarkeit

Der Entwickler sollte für **alle editierbaren Entitäten** ein einheitliches Muster schaffen:

1. `read-before-write` erzwingen
2. preflight auf erlaubte Status
3. High-Level-Patch-Modell statt Roh-JSON von Hand
4. strukturierte Verifikation nach Write
5. klarer Fallback, wenn API keine echte Mutation erlaubt

## 5. Konkrete Lücken, die zuerst geschlossen werden sollten

### Nächste Priorität 1
- `invoice edit` nur für nachweislich unterstützte `updateInvoiceTemplate`-Felder
- verifizierte Unterstützung für klar erlaubte Header-/Layout-Änderungen bei Rechnungen

### Nächste Priorität 2
- `order position`-Operationen mit Verify kombinieren

### Nächste Priorität 3
- Kontakt-High-Level-Workflows für Firmen + Ansprechpartner + mehrere Adressen

## 6. Kurzfazit

Ja, die Aussage ist nach Prüfung weiterhin richtig:
- **Eine Rechnung ist aktuell nicht generisch editierbar wie Angebot oder Kontakt.**
- Dafür fehlt eine echte `updateInvoice`-Route und es fehlen Positions-Mutationsrouten.
- Der CLI sollte deshalb einen expliziten, sicheren High-Level-Workflow für Rechnungsänderungen einführen.

## 7. Konkrete Repo-Änderungen für den Entwickler

Wenn der Entwickler das im bestehenden CLI sauber einführen will, sind diese Stellen relevant:

### API-Katalog und Routing
- `src/data/operations.json`
  - neue Invoice-Update-Operationen ergänzen, **falls** SevDesk sie anbietet
  - sonst den fehlenden Stand explizit dokumentiert lassen

### CLI-Einstiegspunkte
- `src/index.ts`
  - neue High-Level-Kommandos ergänzen:
    - `invoice edit`
    - `invoice recreate`
    - `order edit`
    - `contact edit`
  - bestehende Low-Level-Writes nicht ersetzen, sondern durch ergonomische Workflows ergänzen

### Preflight
- `src/lib/preflight.ts`
  - Patch-/Edit-Validierung ergänzen
  - z. B. erlaubte Felder, Statusregeln, Positionslogik

### Verify
- `src/lib/verify.ts`
  - nach Edit-Writes prüfen:
    - Header
    - Adressblock
    - Positionen
    - Summen
    - Status

### Fehlerhinweise und Remediation
- `src/lib/remediation.ts`
  - klare Hinweise für nicht editierbare Rechnungszustände
  - Hinweis auf Fallback `recreate` statt unsicherer Mutation

### Doku
- `src/lib/docs.ts`
  - `invoice-edit`-Guide erweitern
- `skills/sevdesk-agent-cli/references/command-cheatsheet.md`
  - neue Edit-Kommandos ergänzen
- `README.md`
  - echte Edit-Beispiele aufnehmen

## 8. Empfohlene Umsetzungsreihenfolge

1. `order edit` und `contact edit` ergonomisch bauen
- umgesetzt

2. `invoice recreate` bauen
- umgesetzt

3. `invoice edit` nur für klar unterstützte Felder freischalten
- weiterhin offen

4. danach erst feingranulare Rechnungspositions-Workflows ergänzen
- weiterhin offen
