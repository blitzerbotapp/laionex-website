#!/bin/bash
# Verwendung: ./deploy.sh DEIN_CLOUDFLARE_API_TOKEN
# Oder: export CLOUDFLARE_API_TOKEN=xxx && ./deploy.sh

set -e
if [ -n "$1" ]; then
  export CLOUDFLARE_API_TOKEN="$1"
fi
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Bitte CLOUDFLARE_API_TOKEN setzen oder als Argument übergeben."
  echo "Token erstellen: https://dash.cloudflare.com/profile/api-tokens"
  exit 1
fi
npm run deploy
echo ""
echo "✅ Deploy fertig. Jetzt: npx wrangler secret put ICS_URL"
echo "   (Deine Kalender-iCal-URL eingeben)"
