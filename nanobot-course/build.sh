#!/usr/bin/env bash
# Assemble _base.html + modules/*.html + _footer.html into index.html.
set -euo pipefail
cd "$(dirname "$0")"

OUT="index.html"
: > "$OUT"

# Everything in _base.html up to (not including) the placeholder line.
awk '/<!-- MODULES_PLACEHOLDER -->/{exit} {print}' _base.html >> "$OUT"

count=0
for f in modules/*.html; do
  [ -e "$f" ] || continue
  cat "$f" >> "$OUT"
  printf '\n' >> "$OUT"
  count=$((count + 1))
done

cat _footer.html >> "$OUT"

echo "Built $OUT from $count module file(s)."
