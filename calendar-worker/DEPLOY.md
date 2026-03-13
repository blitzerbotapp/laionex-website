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

## Schritt 3: Secrets hinterlegen

**Für Cal.com-Proxy (API-Key geschützt):**
```bash
npx wrangler secret put CAL_COM_API_KEY
npx wrangler secret put CAL_COM_USERNAME
npx wrangler secret put CAL_COM_EVENT_SLUG
```
(Eingabe: dein Cal.com-Key, `laionex.ai`, `kostenloser-ki-analyse-call`)

**Oder für ICS-Kalender:**
```bash
npx wrangler secret put ICS_URL
```
(Eingabe: Zoho/Google iCal-URL)

---

## Schritt 4: URL in buchen.html eintragen

**Cal.com-Proxy:** `CAL_COM_PROXY_URL = 'https://laionex-calendar.xxx.workers.dev'`  
(Dann bleibt der API-Key im Worker, nicht im Client.)

---

**Alternativ:** Wenn du den Token nicht in der Konsole setzen willst, kannst du `wrangler login` ausführen – dann öffnet sich der Browser und du verbindest deinen Account. Danach funktioniert `npm run deploy` ohne Token.
