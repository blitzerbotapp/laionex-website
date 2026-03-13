# Zoho Calendar Integration – Make.com Setup

Damit gebuchte Slots und **alle** Kalender-Einträge (Geschäftsessen, andere Meetings) berücksichtigt werden:

## Option A: Zoho → Google Sheet (empfohlen)

**Make-Szenario:** Zoho Calendar → Google Sheet

1. Neues Szenario in Make
2. **Trigger:** Zeitplan (z.B. alle 10 Minuten)
3. **Modul:** Zoho Calendar – "Get free/busy details"
   - `uemail`: deine Zoho-Calendar-E-Mail
   - `sdate`: Startdatum (z.B. heute)
   - `edate`: Enddatum (z.B. +60 Tage)
4. **Modul:** Iterator über die Busy-Zeiten
5. **Modul:** Google Sheets – "Add row"
   - Spreadsheet: Laionex Buchungen
   - Tab: z.B. "Busy" (neuer Tab)
   - Spalten: date (YYYY-MM-DD), time (HH:mm)

Die Website liest bereits aus dem Sheet. Ein zweiter Tab "Busy" mit Zoho-Daten müsste in die Abfrage einbezogen werden.

## Option B: Webhook für Zoho-Busy-Slots

**Make-Szenario:** Webhook empfängt Datum → Zoho abfragen → Antwort zurückgeben

1. Neues Szenario in Make
2. **Trigger:** Webhook (Custom)
3. **Modul:** Zoho Calendar – "Get user's free/busy details"
   - `uemail`: deine Zoho-E-Mail
   - `sdate`: `{{1.date}}T000000` (aus Webhook-Body)
   - `edate`: `{{1.date}}T235959`
4. **Modul:** "Respond to Webhook"
   - Status: 200
   - Body: `{ "busy": ["09:00", "10:00", "11:00"] }` (aus Zoho-Response parsen)

5. In **buchen.html** `BUSY_SLOTS_WEBHOOK` auf die Webhook-URL setzen.

## Google Sheet – Freigabe

Das Sheet muss öffentlich lesbar sein:
- Freigeben → "Jeder mit dem Link" → **Betrachter**
- Ohne Anmeldung muss der CSV-Export funktionieren
