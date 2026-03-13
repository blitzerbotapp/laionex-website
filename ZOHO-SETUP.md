# Zoho Calendar – Make.com Setup (Schritt für Schritt)

Ich habe keinen direkten Zugriff auf Make.com. Folge dieser Anleitung – dauert ca. 10 Minuten.

---

## Voraussetzungen

- Make.com Konto
- Zoho Calendar Konto (E-Mail, mit der du eingeloggt bist)
- Zoho-Verbindung in Make (falls noch nicht: Make → Connections → Add → Zoho)

---

## Szenario erstellen

### Schritt 1: Neues Szenario

1. Make.com öffnen → **Scenarios** → **Create a new scenario**
2. Klick auf das **+** (erster Modul-Platz)

### Schritt 2: Webhook als Trigger

1. **Webhooks** suchen → **Custom webhook** wählen
2. **Add** klicken
3. **Show advanced settings** öffnen
4. **Expose webhook URL** aktivieren (falls nötig)
5. **Webhook-URL kopieren** – diese brauchst du später für `buchen.html`

### Schritt 3: Router (optional, für saubere Verarbeitung)

1. **+** nach dem Webhook → **Flow control** → **Router**
2. Eine Route reicht (Default)

### Schritt 4: HTTP – Zoho Free/Busy API

1. **+** nach Webhook/Router → **HTTP** → **Make a request**
2. Einstellungen:
   - **URL:** `https://calendar.zoho.com/api/v1/calendars/freebusy`
   - **Method:** GET
   - **Query string** (Add item):
     - `uemail` = deine Zoho-E-Mail (z.B. `lorenz@laionex.at`)
     - `sdate` = `{{1.body.date}}T000000` (aus Webhook-Body)
     - `edate` = `{{1.body.date}}T235959`
   - **Authentication:** OAuth 2.0
   - **Connection:** Zoho (neu anlegen oder vorhandene nutzen)

3. **Zoho Connection anlegen:**
   - Wenn noch keine: **Add** → Zoho auswählen
   - Scopes: mindestens `ZohoCalendar.freebusy.READ` oder `ZohoCalendar.freebusy.ALL`
   - OAuth durchführen

### Schritt 5: Zoho-Response verarbeiten

Die Zoho-API liefert z.B.:

```json
{
  "freebusy": [
    { "start": "20260316T090000", "end": "20260316T093000" },
    { "start": "20260316T100000", "end": "20260316T103000" }
  ]
}
```

Du musst daraus eine Liste von Zeiten wie `["09:00", "10:00"]` bauen.

**Option A – Set Variable (einfach):**  
Wenn die Zoho-Response anders aussieht, nutze **Tools → Set variable** und baue manuell ein Array.

**Option B – Iterator + Array aggregieren:**  
1. **Iterator** über `freebusy` (falls Array)  
2. Für jedes Element: Startzeit parsen (z.B. `20260316T090000` → `09:00`)  
3. **Array aggregator** oder **Set variable** mit allen Zeiten

### Schritt 6: Respond to Webhook

1. **+** nach dem HTTP-Modul → **Webhooks** → **Respond to webhook**
2. Einstellungen:
   - **Status:** 200
   - **Content type:** application/json
   - **Body:** z.B.  
     `{ "busy": [ "09:00", "10:00" ] }`  
     (Werte aus dem vorherigen Modul mappen)

3. **Body-Beispiel** (wenn du ein Array `busySlots` hast):  
   `{ "busy": {{busySlots}} }`

### Schritt 7: Speichern & aktivieren

1. **Save** (unten links)
2. Szenario **aktivieren** (Toggle)
3. Webhook-URL kopieren und in `buchen.html` bei `BUSY_SLOTS_WEBHOOK` eintragen

---

## Alternative: Nur Google Sheet (ohne Zoho-API)

Wenn die Zoho-API zu aufwendig ist:

1. **Make-Szenario:** Zeitplan (z.B. alle 15 Min)
2. **Zoho Calendar** – falls vorhanden: „List events“ oder ähnlich
3. **Google Sheets** – „Add row“ für jedes Event (date, time)

Die Website liest bereits aus dem Sheet. Wenn Zoho-Events dort landen, werden sie automatisch als belegt angezeigt.

---

## Nach dem Setup

Schick mir die **Webhook-URL**, dann trage ich sie in `buchen.html` ein und pushe die Änderung.
