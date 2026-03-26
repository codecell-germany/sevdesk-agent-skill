# Sevdesk Accounting Automation Concept

Stand: 2026-03-26 (nach Umsetzung des Buchhaltungs-MVP)

## Ziel

Dieses Konzept bewertet, was ein agentischer Sevdesk-Workflow heute bereits kann, welche Lücken für eine grundlegende autonome Buchhaltung noch bestehen und was als realistisch umsetzbares Minimum zuerst gebaut werden sollte.

"Grundlegend alles machen" bedeutet hier nicht vollständige steuerliche Autonomie für jeden Sonderfall, sondern:

- Eingangsbelege aufnehmen
- Belege in Sevdesk anlegen
- Belege mit Banktransaktionen abgleichen
- Standardfälle kontieren und buchen
- Ergebnisse verifizieren und exportieren
- Sonderfälle sauber in Freigabe geben

## Kurzfazit

Der aktuelle Stand reicht bereits für:

- Kontakte, Angebote, Rechnungen und viele Reads/Writes in Sevdesk
- sichere Discovery über Operation-IDs
- Verifikation in Teilen der Rechnungs- und Kontakt-Workflows
- Report-/Export-Endpunkte auf Low-Level-Basis
- Lesen von Transaktionen und Belegen über die API-Katalog-Abdeckung

Der aktuelle Stand reicht jetzt für einen grundlegenden technischen Buchhaltungsfluss:

1. Beleg als lokale PDF aufnehmen
2. Datei nach Sevdesk hochladen
3. Voucher anlegen
4. passende Transaktionen suchen und matchen
5. Voucher gegen eine Transaktion buchen
6. Ergebnis verifizieren

Der zentrale verbleibende Engpass ist nicht mehr das Tooling, sondern das fachliche Regelwerk:

- Kontierungslogik
- Freigabegrenzen
- Sonderfallbehandlung
- Steuerberater-/Mandantenregeln

Ohne diese Regeln kann ein Agent technisch sauber arbeiten, aber nicht autonom fachlich korrekt für alle Fälle entscheiden.

## Bewertung der Wunschliste

### 1. Technische Fähigkeiten im Tooling

#### PDF-/Datei-Upload für Belege
Status: umgesetzt

- `voucherUploadFile` (`POST /Voucher/Factory/uploadTempFile`) ist jetzt im CLI praktisch nutzbar.
- Der Client unterstützt `multipart/form-data`.
- Low-Level: `sevdesk-agent write voucherUploadFile --form-file file=/absolute/path/to/beleg.pdf`
- High-Level: `sevdesk-agent create-voucher-from-pdf ...`

Bewertung:
- Der frühere Kern-Blocker ist beseitigt.
- Damit ist ein durchgängiger PDF-zu-Voucher-Workflow technisch möglich.

#### Beleg anlegen inkl. Datei anhängen in einem sauberen Workflow
Status: umgesetzt als MVP

- Low-Level-Endpunkte für Voucher sind vorhanden (`voucherFactorySaveVoucher`, `updateVoucher`, `bookVoucher`, `voucherResetToDraft`, `voucherResetToOpen`).
- Zusätzlich existiert jetzt ein robuster High-Level-Workflow:
  - `create-voucher-from-pdf`
  - Dry-Run standardmäßig
  - Upload + Anlage + Verify bei `--execute`

Bewertung:
- Für Standardfälle jetzt operativ nutzbar.
- Für echte Autonomie fehlen nur noch Kontierungsregeln/Freigaben.

#### Transaktionen lesen und filtern
Status: umgesetzt als MVP

- `getTransactions` ist vorhanden.
- Zusätzlich existiert `exportTransactions`.
- Neue workflow-taugliche Helfer:
  - `find-transaction`
  - `match-transaction`

Bewertung:
- Für ein grundlegendes System ausreichend zugänglich.
- Muss durch bessere Helfer ergänzt werden.

#### Beleg mit Transaktion verknüpfen
Status: umgesetzt über den Buchungsschritt

- Die offizielle API belegt die Transaktionsverknüpfung im `bookVoucher`-Schritt.
- Das CLI exponiert dafür jetzt:
  - `book-voucher`
  - `assign-voucher-to-transaction`
- Ein separater „link only“-Write ohne Buchung bleibt bewusst außen vor, solange er API-seitig nicht eindeutig dokumentiert ist.

Bewertung:
- Umsetzbar.
- Sollte Teil des ersten Voucher-Workflow-Pakets sein.

#### Kontierung/Buchung setzen
Status: API-seitig vorhanden, fachlich unvollständig

- Voucher-Operationen und Buchungs-Endpoints sind vorhanden.
- Fachlich fehlt jedoch das Regelwerk, nach dem kontiert werden soll.

Bewertung:
- Technisch umsetzbar.
- Fachlich ohne Mandanten-/Steuerberaterlogik nicht autonom betreibbar.

#### Verifikation nach jeder Buchung
Status: umgesetzt für den MVP

- Verifikation existiert heute für Kontakt-, Rechnungs- und jetzt auch Voucher-/Buchungs-Workflows.
- Verify deckt jetzt ab:
  - `voucherFactorySaveVoucher`
  - `bookVoucher`

Bewertung:
- Muss gebaut werden.
- Ohne Verify ist autonome Buchung zu riskant.

#### High-Level-Kommandos
Status: als MVP umgesetzt

Die geforderten Kommandos sind fachlich sinnvoll und passen genau zur Lücke zwischen OpenAPI-Abdeckung und operativer Nutzbarkeit.

- `create-voucher-from-pdf`: vorhanden
- `find-transaction`: vorhanden
- `match-transaction`: vorhanden
- `assign-voucher-to-transaction`: vorhanden
- `book-voucher`: vorhanden

Bewertung:
- Sehr sinnvoll.
- Das ist der eigentliche Produktisierungsschritt.

#### Robuste Exportfunktionen
Status: Low-Level vorhanden, High-Level fehlt

Vorhanden:
- `exportTransactions`
- `exportVoucher`
- `exportInvoice`
- `exportDatevCSV`
- `exportDatevXML`
- `reportVoucher`
- `reportInvoice`
- `reportOrder`

Nicht vorhanden:
- klare Sammelkommandos für Monatsreporting, offene Posten, USt-Auswertung und Management-Exports

Bewertung:
- Für einen MVP nachrangig, aber für Monatsbetrieb sehr wertvoll.

### 2. Vollständiger Zugriff auf Daten

#### Innerhalb Sevdesk
Status: weitgehend gut

Bereits gut abgedeckt oder im Katalog vorhanden:
- Kontakte
- Rechnungen
- Angebote/Orders
- Voucher/Belege
- CheckAccounts
- CheckAccountTransactions
- Exporte und Reports

Einschränkungen:
- nicht jeder fachliche Workflow ist als High-Level-Kommando ausgebaut
- die fachliche Kontierung bleibt regelabhängig

#### Außerhalb Sevdesk
Status: nicht Teil des aktuellen CLI-Kerns

Nicht im aktuellen CLI enthalten:
- Mail-Inbox-Verarbeitung
- Dateisystem-/Cloud-Inbox-Scanning als fester Workflow
- Vertrags-/Abo-Verzeichnis
- Kreditkartenquellen außerhalb Sevdesk

Bewertung:
- Für "komplette Buchhaltung" nötig
- aber nicht Teil des Minimal-Sets im Sevdesk-CLI selbst
- sollte als vorgeschaltete Input-Layer konzipiert werden

### 3. Buchungsregeln
Status: organisatorisch zwingend, technisch noch nicht modelliert

Der Agent hat hier völlig recht.

Ohne verbindliche Regeln kann man nicht autonom buchen, sondern nur Vorschläge erzeugen.

Fehlend ist aktuell:
- maschinenlesbares Regelwerk
- Buchungsklassen / Kontierungslogik
- Tax-/USt-Fälle als Regeln
- Sonderfalllisten
- Freigabepflichten

Bewertung:
- Nicht optional.
- Sollte als Konfigurationsschicht gebaut werden, nicht hart im Code.

### 4. Freigabeprozess
Status: fachlich nötig, im CLI noch nicht als Modus modelliert

Der CLI hat bereits DELETE-Grenzen und Verify-Mechaniken.
Was fehlt, ist ein fachlicher Freigabeprozess für Buchhaltung.

Sinnvolle Betriebsmodi:
- `read-only`
- `suggest-only`
- `prepare-and-link`
- `auto-book-standard`

Bewertung:
- Sehr gut umsetzbar.
- Sollte als Safety-/Approval-Profil gebaut werden.

### 5. Saubere Eingangsquellen
Status: außerhalb des Sevdesk-CLI, aber operativ entscheidend

Der Agent kann keine saubere Buchhaltung machen, wenn Belege überall verstreut liegen.

Bewertung:
- Kein Kernfeature des Sevdesk-CLI
- aber zwingende Voraussetzung für produktiven Einsatz
- sollte als feste Inbox-Definition dokumentiert werden

### 6. Fachliche Leitplanken
Status: außerhalb des Sevdesk-CLI, aber zwingend

Rechtsform, USt-System, Ist-/Soll-Versteuerung, Reverse-Charge-Regeln und Reportingpflichten gehören nicht in die API-Discovery, sondern in ein Mandantenprofil.

Bewertung:
- Muss vor echter Autonomie definiert werden
- sollte in einer maschinenlesbaren Profil-Datei landen

## Was ich davon konkret umsetzen würde

## Phase 1: Minimum Viable Accounting Automation

Ziel:
Ein Agent kann Standard-Eingangsbelege grundlegend Ende zu Ende verarbeiten, solange Regeln und Freigaben sauber vorliegen.

### A. Technische Basis im CLI

1. Multipart-/Datei-Upload im HTTP-Client
- umgesetzt
- `multipart/form-data` wird jetzt generisch im Client unterstützt
- Datei-Upload für `voucherUploadFile` ist produktiv nutzbar

2. Voucher-Upload-Workflow
- umgesetzt
- neues Kommando: `create-voucher-from-pdf`
- Schritte:
  - PDF validieren
  - Datei hochladen
  - Voucher anlegen
  - Upload mit Voucher verknüpfen
  - Ergebnis lesen und optional verifizieren

3. Transaktions-Discovery
- umgesetzt
- neues Kommando: `find-transaction`
- Filter auf:
  - Betrag
  - Datumsspanne
  - Gegenpartei
  - Verwendungszweck
  - Status / ungebucht

4. Matching-Workflow
- umgesetzt
- neues Kommando: `match-transaction`
- Output:
  - Kandidatenliste mit Score
  - Begründung je Match
  - vorgeschlagener Folge-Befehl für den Buchungsschritt

5. Verknüpfungs-Workflow
- umgesetzt
- neues Kommando: `assign-voucher-to-transaction`
- Zweck:
  - ausgewählten Voucher mit ausgewählter Transaktion über den offiziellen Buchungspfad verbinden
  - Ergebnis sofort rereaden
  - Validierung, ob Zahlung/Buchungsstatus konsistent ist

6. Buchungs-Workflow
- umgesetzt
- neues Kommando: `book-voucher`
- enthält:
  - Dry-Run als Standard
  - Preflight
  - Ausführung nur mit `--execute`
  - Verify
  - strukturierte Fehlerhinweise

7. Voucher-Verify
- umgesetzt
- Verify deckt jetzt mindestens ab:
  - Voucher existiert
  - Datei wurde verknüpft
  - Betrag ist plausibel
  - Buchungsstatus ist konsistent
  - gezahlter Betrag wurde übernommen

### B. Fachliche Konfiguration

8. Mandantenprofil als Datei
- z. B. `config/accounting-profile.json`
- enthält:
  - Land
  - Rechtsform
  - Ist-/Soll-Versteuerung
  - Standardsteuerfälle
  - Freigaberegeln
  - Reportingpräferenzen

9. Buchungsregeln als Datei
- z. B. `config/booking-rules.yaml`
- Regeln wie:
  - Software-Abo -> Konto X
  - Hardware < Schwelle -> Konto Y
  - Bewirtung -> manuelle Freigabe
  - Reverse Charge -> Sonderfall / Prüfschritt

10. Freigabeprofile
- z. B. `suggest`, `prepare`, `autobook-standard`
- damit der Agent nicht rät, sondern innerhalb klarer Grenzen operiert

### C. Minimale Reports

11. High-Level-Exportkommandos
- `export-open-items`
- `export-vouchers-month`
- `export-transactions-month`
- `monthly-report`

Für einen MVP genügt dabei zuerst:
- CSV/JSON aus existierenden Export-/Report-Endpunkten
- keine perfekte BI-Schicht

## Was damit danach praktisch möglich wäre

Mit Phase 1 wäre der Agent in der Lage, Standardfälle der laufenden Buchhaltung grundlegend zu übernehmen:

- Eingangsrechnung als PDF aufnehmen
- Voucher in Sevdesk anlegen
- wahrscheinliche Banktransaktion finden
- Verknüpfung vorbereiten oder ausführen
- Standardkontierung anwenden
- Buchung verifizieren
- Monatslisten und Kontrollausgaben erzeugen
- Sonderfälle in Freigabe geben

Das wäre ein echter operativer Startpunkt.

## Was danach noch fehlt, um "komplett" zu sein

Für eine wirklich vollständige Übernahme fehlen danach noch:

- externe Inbox-Integration (Mail, Cloud, Dateisystem)
- wiederkehrende Kosten-/Vertragslogik
- Kreditkarten- und Nebenkontoquellen außerhalb Sevdesk
- Mahn-/Forderungslogik
- Management-Reporting mit Liquidität, Cashflow, USt-Zahllast
- enger abgestimmtes Steuerberater-Regelwerk

Das ist eher Phase 2 und Phase 3, nicht MVP.

## Priorisierte Umsetzung ab jetzt

### P0
1. Regeldatei für Kontierung und Freigaben
2. Freigabeprofile / Safety-Profile
3. Monats-Exports und einfache Reporting-Helfer

### P1
4. Inbox-Integration außerhalb Sevdesk
5. Wiederkehrende Kostenlogik
6. Reporting- und Steuerungsdashboard

### P2
7. Mail-/Cloud-Connectoren
8. Vertrags- und Aboverwaltung
9. weitergehende Management-Reports

## Empfehlung

Wenn das Ziel ist, dass ein Agent zeitnah grundlegend die Buchhaltung übernehmen kann, würde ich nicht versuchen, sofort "komplett alles" zu bauen.

Der sinnvollste erste Scope ist:

- PDF-Upload
- Voucher-Anlage
- Transaktionssuche
- Voucher-zu-Transaktion-Verknüpfung
- Standardbuchung
- Verify
- Regelwerk + Freigabeprofile

Damit entsteht ein belastbarer Standardfall-Workflow für Eingangsbelege.

Alles darüber hinaus ist sinnvoll, aber erst im zweiten Schritt wirtschaftlich.
