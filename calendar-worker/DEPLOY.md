# Deploy – einmalig ausführen

Du brauchst:
1. **Cloudflare-Account** (kostenlos): https://dash.cloudflare.com/sign-up
2. **Deine Kalender-iCal-URL** (Zoho oder Google, öffentlich)

---

## Schritt 1: API-Token erstellen

1. Öffne: https://dash.cloudflare.com/profile/api-tokens
2. **Create Token** → Template **"Edit Cloudflare Workers"** wählen
3. **Continue to summary** → **Create Token**
4. Token kopieren (wird nur einmal angezeigt)

---

## Schritt 2: Deploy ausführen

Im Terminal (im Ordner `calendar-worker`):

```bash
# Token setzen (ersetz XXX durch deinen Token)
export CLOUDFLARE_API_TOKEN="dein-token-hier"

# Worker deployen
npm run deploy
```

Nach dem Deploy siehst du die URL, z.B.:
`https://laionex-calendar.DEIN-SUBDOMAIN.workers.dev`

---

## Schritt 3: ICS-URL hinterlegen

```bash
npx wrangler secret put ICS_URL
```

Eingabe: deine öffentliche Kalender-URL, z.B.:
- Zoho: `https://calendar.zoho.com/feed/...`
- Google: `https://calendar.google.com/calendar/ical/.../public/basic.ics`

---

## Schritt 4: URL in buchen.html eintragen

Die Worker-URL (aus Schritt 2) in `buchen.html` bei `BUSY_SLOTS_WEBHOOK` eintragen.

---

**Alternativ:** Wenn du den Token nicht in der Konsole setzen willst, kannst du `wrangler login` ausführen – dann öffnet sich der Browser und du verbindest deinen Account. Danach funktioniert `npm run deploy` ohne Token.
