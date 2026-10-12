#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

pattern='\b(bg|text|border|outline|ring|fill|stroke|from|to|via|divide|placeholder|caret|decoration|accent|shadow)-((slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}|white|black)\b'

violations=$(grep -rEno --include='*.ts' --include='*.tsx' --exclude-dir=generated "$pattern" src || true)

if [ -n "$violations" ]; then
  count=$(printf '%s\n' "$violations" | wc -l | tr -d ' ')
  {
    printf '\nForbidden native Tailwind colors (%s). Use a DSFR decision instead (var(--…) / colors.decisions.*):\n\n' "$count"
    printf '%s\n' "$violations"
    printf '\nSee the palette in Storybook: Design Tokens / Couleurs.\n'
  } >&2
  exit 1
fi

echo 'OK: no native Tailwind colors.'
