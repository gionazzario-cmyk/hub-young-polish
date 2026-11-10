#!/bin/bash
# HUB Young Polish — installa il restyling nella copia locale dell'app.
# Non tocca libri, annotazioni o account: modifica solo index.html + 2 file.
set -euo pipefail

APP="${1:-/Applications/HUB Young.app}"
RES="$APP/Contents/Resources/app.nw"
SRC="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$RES" ]; then
  echo "✗ App non trovata in: $APP"
  echo "  Uso: ./installa.command \"/Applications/HUB Young.app\""
  exit 1
fi

if [ ! -w "$RES/index.html" ]; then
  echo "✗ Non ho i permessi per scrivere in $RES"
  echo "  Prova: sudo ./installa.command \"$APP\""
  exit 1
fi

if grep -q "hub-young-polish.css" "$RES/index.html" 2>/dev/null; then
  echo "→ La patch risulta già installata. Aggiorno solo i file."
else
  cp "$RES/index.html" "$RES/index.html.ny-backup"
  echo "✓ Backup creato: index.html.ny-backup"
fi

cp "$SRC/hub-young-polish.css" "$RES/hub-young-polish.css"
cp "$SRC/hub-young-polish.js" "$RES/hub-young-polish.js"

python3 - "$RES/index.html" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
if 'hub-young-polish.css' not in s:
    s = s.replace('</head>',
        '  <link rel="stylesheet" href="hub-young-polish.css">\n</head>', 1)
if 'hub-young-polish.js' not in s:
    s = s.replace('</body>',
        '  <script type="text/javascript" src="hub-young-polish.js"></script>\n</body>', 1)
open(p, 'w', encoding='utf-8').write(s)
print('✓ index.html aggiornato')
PY

# La firma originale non è più valida dopo la modifica: rifirmo in locale (ad-hoc)
if command -v codesign >/dev/null 2>&1; then
  xattr -cr "$APP" 2>/dev/null || true
  if codesign --force --deep --sign - "$APP" >/dev/null 2>&1; then
    echo "✓ Firma locale rigenerata"
  else
    echo "! Firma non rigenerata (non blocca l'avvio, di solito)"
  fi
fi

echo
echo "Fatto. Riavvia HUB Young per vedere le modifiche."
read -r -p "Riavvio adesso? [S/n] " ans
case "${ans:-s}" in
  [sSyY]*)
    osascript -e 'quit app "HUB Young"' >/dev/null 2>&1 || true
    sleep 1
    pkill -TERM -f "HUB Young.app/Contents/MacOS/HUB Young" >/dev/null 2>&1 || true
    sleep 2
    open -a "$APP" 2>/dev/null || open "$APP"
    echo "→ Riavviata."
    ;;
  *) echo "→ Riavvio manuale quando vuoi." ;;
esac
