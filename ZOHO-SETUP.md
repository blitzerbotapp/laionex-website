# Kalender-Sync für Buchungsseite

**Am einfachsten:** Cal.com – siehe [KALENDER-SETUP.md](KALENDER-SETUP.md). Ein Konto, Zoho verbinden, Link eintragen – fertig.

**Alternative (selbst hosten):** Cloudflare Worker + öffentlicher ICS-Feed

---

## Option A: Cloudflare Worker + ICS (empfohlen)

Dein Kalender (Zoho, Google, Outlook) bleibt die Single Source of Truth. Die Website holt die Verfügbarkeit direkt über einen kleinen Worker.

### 1. Kalender öffentlich machen

**Zoho Calendar:**
- Zoho Calendar → Einstellungen → Mein Kalender → Kalender bearbeiten
- Unter „Freigabe“ → Öffentlich machen
- **iCal-URL kopieren** (z.B. `https://calendar.zoho.com/feed/...`)

**Google Calendar:**
- Google Kalender → Kalender auswählen → Einstellungen
- „Öffentliche Adresse in iCal-Format“ kopieren  
  (z.B. `https://calendar.google.com/calendar/ical/.../public/basic.ics`)

### 2. Cloudflare Worker deployen

```bash
cd calendar-worker
npm init -y   # falls noch kein package.json
npx wrangler deploy
```

Beim ersten Mal: `npx wrangler login` (Browser öffnet sich, Cloudflare-Account verbinden).

### 3. ICS-URL hinterlegen

```bash
npx wrangler secret put ICS_URL
# Eingabe: deine iCal-URL (z.B. https://calendar.zoho.com/feed/...)
```

### 4. Worker-URL in buchen.html eintragen

Nach dem Deploy zeigt Wrangler die URL, z.B.:
`https://laionex-calendar.DEIN-SUBDOMAIN.workers.dev`

In `buchen.html` bei `BUSY_SLOTS_WEBHOOK` eintragen:
```javascript
const BUSY_SLOTS_WEBHOOK = 'https://laionex-calendar.xxx.workers.dev';
```

**Fertig.** Die Buchungsseite blendet belegte Slots automatisch aus.

---

## Option B: Make.com (falls du Make schon nutzt)

Falls du Make.com für andere Automatisierungen nutzt, kannst du stattdessen ein Webhook-Szenario bauen:

1. **Webhook** als Trigger (Custom webhook)
2. **HTTP** → Zoho Free/Busy API oder Google Calendar API
3. **Respond to Webhook** mit `{ "busy": ["09:00", "10:00"] }`

Die Webhook-URL muss **GET** mit `?date=YYYY-MM-DD` unterstützen.

Details siehe [Make-Szenario (ausführlich)](#make-szenario-ausführlich) unten.

---

## API-Format

Die Buchungsseite ruft auf:
```
GET BUSY_SLOTS_WEBHOOK?date=2026-03-16
```

Erwartete Antwort:
```json
{ "busy": ["09:00", "10:00", "14:00"] }
```

Die Slots `09:00`, `09:30`, `10:00`, … `16:30` werden mit deinem Kalender abgeglichen.

---

## Make-Szenario (ausführlich)

### Schritt 1: Webhook
- Make → Scenarios → Create
- **Webhooks** → **Custom webhook**
- Webhook-URL kopieren

### Schritt 2: HTTP – Zoho Free/Busy
- **HTTP** → Make a request
- URL: `https://calendar.zoho.com/api/v1/calendars/freebusy`
- Query: `uemail`, `sdate`, `edate`
- Auth: OAuth 2.0 (Zoho Connection)

### Schritt 3: Response mappen
- Zoho liefert `freebusy`-Array
- Daraus `["09:00", "10:00"]` bauen

### Schritt 4: Respond to Webhook
- Body: `{ "busy": [...] }`

**Hinweis:** Make-Webhooks erwarten standardmäßig POST. Die Buchungsseite nutzt GET mit Query-Parameter. Stelle sicher, dass dein Webhook auch GET mit `?date=YYYY-MM-DD` akzeptiert (bei Make oft über „Webhook-URL“ + Query möglich).
