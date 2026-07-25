#!/usr/bin/env bash
#
# Pick a handful of supporting stills per project and downscale them for web.
#
# The masters are 6-15MB each and there are hundreds of them. This takes an
# evenly-spread sample from each project's photo folder (so the selection is
# not just the first N frames of one setup) and writes 1600px-wide JPEGs into
# public/media/derived/<slug>/stills/.
#
# Usage: ./scripts/encode-stills.sh

set -uo pipefail
export PATH="/opt/homebrew/bin:$PATH"

MEDIA="$(cd "$(dirname "$0")/.." && pwd)/public/media"
OUT="$MEDIA/derived"
COUNT=6

# slug | folder holding the source photos (relative to public/media)
# Each still folder must belong to the SAME shoot as that project's main video.
# An earlier pass pulled Shoreline's stills from the AMG GT shoot and Blaque
# Diamond's from the F-150 Raptor shoot, which mislabels both — each of those
# clients has several vehicle shoots in one folder tree.
#
# Blazar is the one deliberate exception: its main video is the MANTIS 135mm
# piece and there are no MANTIS stills, so the APEX-L lifestyle set stands in
# as same-brand supporting material.
read -r -d '' JOBS <<'EOF'
blazar-mantis-135|Blazar/APEX-L
fd-2022-buy-now-japan|Formula Drift 2022 - Buy Now Japan/SLC/Photos
shoreline-f150-raptor|Shoreline Motoring/F150/Final Photos
blaque-diamond-model-s|Blaque Diamond Wheels/Model S Plaid/Final Photo Set/High Res
joby-joshua-tree|JOBY/JOBY Joshua Tree Shoot/JOBY Joshua Tree Product photos
EOF

while IFS='|' read -r slug folder; do
  [ -z "${slug:-}" ] && continue
  src="$MEDIA/$folder"
  dest="$OUT/$slug/stills"

  if [ ! -d "$src" ]; then
    echo "!! MISSING FOLDER: $folder"
    continue
  fi

  mkdir -p "$dest"
  rm -f "$dest"/*.jpg 2>/dev/null

  # Evenly spread the sample across the whole shoot rather than taking the
  # first N, which would all be near-identical frames of one setup.
  # NOTE: macOS ships bash 3.2, which has no `mapfile` — build the array the
  # portable way, and use a NUL-safe read so spaces in filenames survive.
  all=()
  while IFS= read -r line; do
    all+=("$line")
  done < <(find "$src" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) | sort)
  total=${#all[@]}
  [ "$total" -eq 0 ] && { echo "!! no photos in $folder"; continue; }

  step=$(( total / COUNT )); [ "$step" -lt 1 ] && step=1
  i=0; n=1
  while [ "$i" -lt "$total" ] && [ "$n" -le "$COUNT" ]; do
    out="$dest/$(printf '%02d' "$n").jpg"
    sips -Z 1600 -s format jpeg -s formatOptions 72 "${all[$i]}" --out "$out" >/dev/null 2>&1
    i=$(( i + step )); n=$(( n + 1 ))
  done
  echo ">> $slug: $(( n - 1 )) stills from $total"
done <<< "$JOBS"

echo "=== stills ==="
find "$OUT" -name '*.jpg' -path '*/stills/*' | wc -l | xargs echo "files:"
du -sh "$OUT" 2>/dev/null | awk '{print "derived total: " $1}'
