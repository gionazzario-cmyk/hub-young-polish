#!/bin/bash
# HUB Young Polish — rimuove il restyling e ripristina l'index.html originale.
set -euo pipefail

APP="${1:-/Applications/HUB Young.app}"
RES="$APP/Contents/Resources/app.nw"

if [ ! -d "$RES" ]; then
  echo "✗ App non trovata in: $APP"
  exit 1
fi

if [ -f "$RES/index.html.ny-backup" ]; then
  cp "$RES/index.html.ny-backup" "$RES/index.html"
  echo "✓ index.html originale ripristinato"
else
  echo "! Backup non trovato: rimuovo solo i riferimenti alla patch."
  python3 - "$RES/index.html" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
s = re.sub(r'\s*<link[^>]*hub-young-polish\.css[^>]*>', '', s)
s = re.sub(r'\s*<script[^>]*hub-young-polish\.js[^>]*></script>', '', s)
open(p, 'w', encoding='utf-8').write(s)
PY
fi

rm -f "$RES/hub-young-polish.css" "$RES/hub-young-polish.js"

if command -v codesign >/dev/null 2>&1; then
  xattr -cr "$APP" 2>/dev/null || true
  codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true
fi

echo "Fatto. Riavvia HUB Young."
