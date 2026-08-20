#!/usr/bin/env bash
#
# Pick a handful of supporting stills per project and downscale them for web.
#
# Sources, in order of preference:
#
#   1. The delivered full-resolution set, sampled evenly across the whole take
#      so the selection is not six near-identical frames of one setup.
#   2. A client-supplied web set, only where no full-res folder exists.
#
# THIS ORDER USED TO BE THE OTHER WAY ROUND, on the reasoning that the web sets
# ("WEB VERSION", "2023 Website Version") are curated selects and already sized
# for the web. The first half was true and the second half was the problem:
# those files cap out at 1920px, and /stills/<slug> opens on a full-bleed
# banner, which on a 2x display at a 1440px window wants 2880. The pictures
# arrived soft.
#
# Checked before switching, because changing a source folder changes what is on
# the site: for Shoreline and Blaque Diamond the full-res folders hold THE SAME
# PHOTOGRAPHS in the same order, frame number for frame number. Only the
# resolution differs, so the selection is unchanged.
#
# Output is 2560px on the long side, JPEG, written to
# public/media/derived/<slug>/stills/NN.<hash>.jpg.
#
# 2560 rather than 1600: it covers the banner at a 1440px window on a 2x
# display at 0.89 device pixels per pixel, which reads sharp, and it covers the
# lightbox, which shows a frame at up to 88vw. Going further doubles the bytes
# for a difference nobody can see.
#
# FILENAMES ARE CONTENT-ADDRESSED — the eight hex characters are a hash of the
# encoded bytes. R2 serves these `immutable, max-age=1y` and re-uploading an
# object does not change what a cache already holds, so a re-encode has to
# arrive at a new URL or the old frames stay in front of everyone for a year.
# Hashing the bytes means that happens by construction: change the image and
# the name changes; change nothing and it does not.
#
# This replaced a `?v=n` revision map, which next/image rejects outright — a
# query string on an image src has to be enumerated in `images.localPatterns`
# and `remotePatterns[].search`, exactly, per value. The manifest below already
# carries the real filenames, so there is nothing for the app to construct.
#
# ffmpeg does the conversion rather than sips because the Shoreline web set is
# AVIF, which sips will not read.
#
# Usage: ./scripts/encode-stills.sh [slug]

set -uo pipefail
export PATH="/opt/homebrew/bin:$PATH"

MEDIA="$(cd "$(dirname "$0")/.." && pwd)/public/media"
OUT="$MEDIA/derived"
ONLY="${1:-}"
COUNT=6

# Cap the long side at 2560 while preserving aspect ratio, keeping dims even.
SCALE="scale='if(gt(iw,ih),2560,-2)':'if(gt(iw,ih),-2,2560)'"

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
EOF

while IFS='|' read -r slug folder; do
  [ -z "${slug:-}" ] && continue
  [ -n "$ONLY" ] && [ "$slug" != "$ONLY" ] && continue

  src="$MEDIA/$folder"
  dest="$OUT/$slug/stills"

  if [ ! -d "$src" ]; then
    echo "!! MISSING FOLDER: $folder"
    continue
  fi

  mkdir -p "$dest"
  rm -f "$dest"/*.jpg 2>/dev/null

  # macOS ships bash 3.2, which has no `mapfile` — build the array the portable
  # way, and read line-by-line so spaces in filenames survive.
  all=()
  while IFS= read -r line; do
    all+=("$line")
  done < <(find "$src" -maxdepth 1 -type f \
             \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.avif' -o -iname '*.webp' -o -iname '*.png' \) \
             | sort)

  total=${#all[@]}
  [ "$total" -eq 0 ] && { echo "!! no photos in $folder"; continue; }

  step=$(( total / COUNT )); [ "$step" -lt 1 ] && step=1
  i=0; n=1
  while [ "$i" -lt "$total" ] && [ "$n" -le "$COUNT" ]; do
    # Encode to a temp name first: the hash has to be taken from the finished
    # bytes, and the leading dot keeps it out of the manifest's glob if a run
    # is interrupted here.
    tmp="$dest/.encoding.jpg"
    ffmpeg -nostdin -v error -y -i "${all[$i]}" -vf "$SCALE" -q:v 3 "$tmp" </dev/null
    hash=$(shasum -a 256 "$tmp" | cut -c1-8)
    mv "$tmp" "$dest/$(printf '%02d' "$n").$hash.jpg"
    i=$(( i + step )); n=$(( n + 1 ))
  done
  echo ">> $slug: $(( n - 1 )) stills from $total  <-  $folder"
done <<< "$JOBS"

echo "=== stills ==="
find "$OUT" -name '*.jpg' -path '*/stills/*' | wc -l | xargs echo "files:"

# ---------------------------------------------------------------------------
# Emit a manifest of real dimensions.
#
# Shoots mix orientations — Blazar and JOBY both contain portrait frames — so
# a single declared aspect ratio per project would size half the gallery wrong.
# The images live in R2 and are gitignored, but this manifest is metadata, so
# it is written into src/content/ where it IS tracked and can be imported.
#
# Regenerated on every run; do not hand-edit.
# ---------------------------------------------------------------------------
MANIFEST="$(cd "$(dirname "$0")/.." && pwd)/src/content/stills.generated.ts"
{
  echo "// GENERATED by scripts/encode-stills.sh — do not edit by hand."
  echo "//"
  echo "// Real pixel dimensions for each supporting still, so layout can reserve the"
  echo "// correct box per image rather than assuming one aspect ratio per project."
  echo ""
  echo "export interface StillMeta {"
  echo "  file: string;"
  echo "  width: number;"
  echo "  height: number;"
  echo "}"
  echo ""
  echo "export const stillsManifest: Record<string, StillMeta[]> = {"
  for dir in "$OUT"/*/stills; do
    [ -d "$dir" ] || continue
    slug=$(basename "$(dirname "$dir")")
    printf '  "%s": [\n' "$slug"
    for f in "$dir"/*.jpg; do
      [ -f "$f" ] || continue
      dims=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$f" 2>/dev/null)
      w=${dims%x*}; h=${dims#*x}
      printf '    { file: "%s", width: %s, height: %s },\n' "$(basename "$f")" "$w" "$h"
    done
    echo "  ],"
  done
  echo "};"
} > "$MANIFEST"

echo "manifest: $(basename "$MANIFEST") written"
