#!/usr/bin/env bash
#
# Transcode camera masters into web-ready derivatives.
#
# The masters in public/media/<Project>/ are 4K at 40-113 Mbps and total ~27GB.
# They are gitignored and must never be served directly. This script produces
# three derivatives per project into public/media/derived/<slug>/:
#
#   loop.mp4    ~10s, silent, long-side 1920, CRF 28 -> the ambient loop used
#               by the home reel and the /stories card previews.
#   film.mp4    full piece, long-side 1920, CRF 23 + AAC -> the fullscreen player.
#   poster.jpg  a single frame from the loop's start point.
#
# Encoding rules that matter (see docs/plan/05-real-media.md):
#   - `-movflags +faststart` so playback can begin before the file is complete.
#   - Loops carry NO audio track: they are never audible, so it is pure waste.
#   - Long side is capped at 1920 rather than forcing 16:9, because the sources
#     include vertical (1080x1920) and ultrawide (4096x1716) pieces and their
#     real aspect ratios drive the layout.
#
# Usage:
#   ./scripts/encode-media.sh                        # everything
#   ./scripts/encode-media.sh loops                  # loops + posters only (fast)
#   ./scripts/encode-media.sh films                  # films only (slow)
#   ./scripts/encode-media.sh all shoreline-f150-raptor   # one project only
#
# The optional second argument limits the run to a single slug, so re-cutting
# one piece does not mean re-encoding the whole slate.

set -uo pipefail
export PATH="/opt/homebrew/bin:$PATH"

MEDIA="$(cd "$(dirname "$0")/.." && pwd)/public/media"
OUT="$MEDIA/derived"
MODE="${1:-all}"
ONLY="${2:-}"

# Cap the long side at 1920 while preserving aspect ratio, keeping dims even.
SCALE="scale='if(gt(iw,ih),1920,-2)':'if(gt(iw,ih),-2,1920)'"

# slug | source (relative to public/media) | loop start seconds
#
# COMMENTED LINES ARE HELD BACK, NOT DEAD. Every one of them is a vertical cut —
# social edits at 9:16 — and the site has no format for them yet: story films
# render in a landscape frame and the home reel is full-bleed, so a 9:16 piece
# either pillarboxes or gets cropped to its middle third. They are encoded the
# moment there is somewhere to put them; uncomment and re-run.
#
# Sources live under Stories/ since the masters were reorganised into
# Stories/ and Stills/. Nothing else about the film pipeline changed.
read -r -d '' JOBS <<'EOF'
blazar-mantis-133x|Stories/Blazar/MANTIS/Ronin 4D + MANTIS 1.33X | Real-World Test.MOV|111
blazar-mantis-135|Stories/Blazar/MANTIS/Blazar MANTIS 135mm T3.2 First Look.mp4|1
blazar-mantis-25-100|Stories/Blazar/MANTIS/Blazar MANTIS 25mm & 100mm Lens Test _ Classic Car Show_2160p.mp4|0
nozomio-folk-doordash|Stories/Nozomio/V2 Folk DoorDash Credit Giveway Promo.mp4|6
fd-2022-buy-now-japan|Stories/Formula Drift 2022 - Buy Now Japan/SLC/FD SLC Final Cut.mp4|8.5
shoreline-f150-raptor|Stories/Shoreline Motoring/F150/Shoreline F150 Raptor R new music edit final.mp4|37
88-silo|Stories/88/88 - Final final final.mp4|18
los-lamentos|Stories/Los Lamentos/Los Lamentos Promo Final.mp4|30
hotpit-autofest|Stories/Hotpit Autofest/Elliot Bright - Driver Showcase.mp4|25
blaque-diamond-model-s|Stories/Blaque Diamond Wheels/Model S Plaid/Tesla_Model_S_Plaid_Blaque_Diamond_Wheels_BD_F29_Gloss_Black YT Vid.mp4|14
born-to-ride|Stories/Born to Ride/Born To Ride - Loren Henley, Gabriel Bendana.mp4|46
#fd-slc-promo|Stories/Formula Drift 2022 - Buy Now Japan/SLC/FD SLC Promo Reel.mp4|11
#fd-slc-follow-e46|Stories/Formula Drift 2022 - Buy Now Japan/SLC/Follow e46.mov|8
#fd-slc-follow-hurst|Stories/Formula Drift 2022 - Buy Now Japan/SLC/Wat Follow Hurst Multicam.mov|8
blazar-mantis-5-lens|Stories/Blazar/MANTIS/Blazar Mantis 25mm and 100mm Test + Full 5-Lens Set Comparison.mp4|150
#blazar-apex-l|Stories/Blazar/APEX-L/APEX L AF Test Final2.mp4|6
#blazar-beetle|Stories/Blazar/BEETLE/Cine Gear Blazar Beetle Impressions Pt. 1 Brady Bessette and Marcus Gram.mp4|20
#blazar-app|Stories/Blazar/Socials Content/Blazar App Video final12.mp4|8
shoreline-amg-gt|Stories/Shoreline Motoring/AMG GT/2016_Mercedes_AMG_GT_S_Brushed_Black_Blaque_Diamond_Wheels_BD_F25_Gloss_Black_YT_VIDEO.mov|20
blaque-diamond-raptor|Stories/Blaque Diamond Wheels/2018 Ford F150 Raptor BDO728/Exports/2018_Ford_F150_Raptor_Blaque_Diamond_Wheels_BD_O728_Textured_Black_YT.mp4|15
blaque-diamond-model-3|Stories/Blaque Diamond Wheels/3/2022_Tesla_Model_3_BD_F29_20in_Brushed_Silver_Flyaway_Garage.mov|15
blaque-diamond-q50|Stories/Blaque Diamond Wheels/Q/Q Edit Final Cut 2.mov|20
hotpit-irw-r1|Stories/Hotpit Autofest/HotPit IRW R1 Final Updated End Card.mp4|120
#88-silo-promo|Stories/88/Silo 88 final promo.mp4|4
joby-website-reel|Stories/JOBY/JOBY Joshua Tree Shoot/Joshua Tree Video Content/JOBY WEBSITE REEL 2 products.mp4|1
#joby-telepod|Stories/JOBY/JOBY Joshua Tree Shoot/Joshua Tree Video Content/JOBY Telepod - Mobile REEL.mp4|4
EOF

mkdir -p "$OUT"

# Split on the FIRST and LAST delimiter rather than every one: a master's
# filename can itself contain a pipe (the Ronin 4D piece does), and splitting on
# all of them would truncate the path mid-name and report a missing source.
# The slug and the start time never contain one, so the ends are unambiguous.
while IFS= read -r line; do
  [ -z "${line:-}" ] && continue
  # A commented job is one that is deliberately not on the site yet. Leaving it
  # in place, in order, beats deleting it and rediscovering the source path and
  # loop point later.
  case "$line" in \#*) continue ;; esac
  slug="${line%%|*}"
  rest="${line#*|}"
  src="${rest%|*}"
  start="${rest##*|}"
  [ -n "$ONLY" ] && [ "$slug" != "$ONLY" ] && continue
  input="$MEDIA/$src"
  dir="$OUT/$slug"
  mkdir -p "$dir"

  if [ ! -f "$input" ]; then
    echo "!! MISSING SOURCE: $src"
    continue
  fi

  if [ "$MODE" = "all" ] || [ "$MODE" = "loops" ]; then
    echo ">> loop   $slug"
    ffmpeg -nostdin -v error -y -ss "$start" -t 10 -i "$input" \
      -vf "$SCALE" -an \
      -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p \
      -movflags +faststart "$dir/loop.mp4" </dev/null

    echo ">> poster $slug"
    ffmpeg -nostdin -v error -y -ss "$start" -i "$input" -frames:v 1 \
      -vf "$SCALE" -q:v 4 "$dir/poster.jpg" </dev/null
  fi

  if [ "$MODE" = "all" ] || [ "$MODE" = "films" ]; then
    echo ">> film   $slug"
    ffmpeg -nostdin -v error -y -i "$input" \
      -vf "$SCALE" \
      -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
      -c:a aac -b:a 128k -ac 2 \
      -movflags +faststart "$dir/film.mp4" </dev/null
  fi
done <<< "$JOBS"

echo "=== derived output ==="
du -sh "$OUT" 2>/dev/null
find "$OUT" -type f \( -name '*.mp4' -o -name '*.jpg' \) -exec ls -lh {} \; \
  | awk '{printf "%8s  %s\n", $5, $9}' | sed "s|$OUT/||"
