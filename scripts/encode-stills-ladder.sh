#!/usr/bin/env bash
#
# Cut the responsive width ladder for every still, so R2 serves the sizes
# instead of an optimizer generating them per request.
#
# WHY THIS EXISTS. next/image asks for a still at whatever width the layout
# needs, and something has to produce that width. Left to Vercel, every
# (photograph, width) pair is a billable Image Transformation against a 5,000
# a month allowance — and this site has 451 stills, so a single pass over the
# galleries can spend the month. Cloudflare's own transformation product has
# the same 5,000 ceiling and the same failure mode, so moving the work sideways
# buys nothing.
#
# Cutting the widths ONCE, here, removes the meter entirely. The files land in
# R2 beside the masters they came from, R2 charges nothing for egress, and a
# photograph costs the same to serve on its ten-thousandth view as its first.
#
# WHAT IT WRITES. Beside each gallery's stills, one folder per rung:
#
#   <slug>/stills/01.3b15debd.jpg        the 2560px master encode-stills.sh cut
#   <slug>/stills/w384/01.3b15debd.jpg   \
#   <slug>/stills/w640/01.3b15debd.jpg    | the same photograph, narrower
#   <slug>/stills/w1080/01.3b15debd.jpg   |
#   <slug>/stills/w1600/01.3b15debd.jpg  /
#
# The rung folders sit BELOW the stills folder rather than beside the files,
# because encode-stills.sh builds its manifest with `for f in "$dir"/*.jpg` —
# a rung written as `01.3b15debd.640.jpg` would be globbed in as a 452nd
# photograph. A subfolder cannot be.
#
# Filenames are unchanged within a rung, so src/lib/r2-image-loader.ts can find
# a rung by inserting one path segment and nothing has to be enumerated.
#
# WIDTH, NOT LONG SIDE. encode-stills.sh caps the long side, which is right for
# a master. A srcset `w` descriptor means the image's WIDTH, so a portrait
# frame's 640 rung is 640x960 and a landscape frame's is 640x427. Scaling by
# long side here would hand the browser a portrait at 640 that is really 427
# wide, and it would pick wrong.
#
# EVERY RUNG EXISTS FOR EVERY FRAME. The narrowest master on the site is 1706px
# (the portrait frames), so 1600 is the highest rung that is still a downscale
# for all 451. Above it the master itself is the rung — the loader returns the
# original URL rather than reaching for a file that would have to be upscaled
# to exist.
#
# Idempotent: a rung already cut is left alone, and a rung whose master has
# gone (a re-encode lands on a new content hash) is deleted. Safe to re-run,
# and cheap — encode-stills.sh calls it on the way out so the two never drift.
#
# Usage: ./scripts/encode-stills-ladder.sh [slug]

set -uo pipefail
export PATH="/opt/homebrew/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/media/derived"
ONLY="${1:-}"

# Keep in step with `deviceSizes`/`imageSizes` in next.config.ts. A width the
# browser can ask for and this list does not carry is a 404.
RUNGS="384 640 1080 1600"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not installed. Run: brew install ffmpeg" >&2
  exit 1
fi

if [ ! -d "$OUT" ]; then
  echo "No derived media at $OUT. Run ./scripts/encode-stills.sh first." >&2
  exit 1
fi

cut=0; kept=0; pruned=0

for dir in "$OUT"/*/stills; do
  [ -d "$dir" ] || continue
  slug=$(basename "$(dirname "$dir")")
  [ -n "$ONLY" ] && [ "$slug" != "$ONLY" ] && continue

  # Masters only: the glob is deliberately not recursive, so the rung folders
  # below this one are not themselves treated as sources.
  masters=()
  while IFS= read -r line; do
    masters+=("$line")
  done < <(find "$dir" -maxdepth 1 -type f -name '*.jpg' | sort)

  [ ${#masters[@]} -eq 0 ] && continue

  for w in $RUNGS; do
    rungdir="$dir/w$w"
    mkdir -p "$rungdir"

    # Prune first. A re-encode gives a frame a new content hash, which leaves
    # the old rung behind with nothing pointing at it — and `rclone sync` would
    # faithfully carry the orphan to R2 forever.
    for old in "$rungdir"/*.jpg; do
      [ -f "$old" ] || continue
      if [ ! -f "$dir/$(basename "$old")" ]; then
        rm -f "$old"; pruned=$(( pruned + 1 ))
      fi
    done

    for src in "${masters[@]}"; do
      dest="$rungdir/$(basename "$src")"
      if [ -f "$dest" ]; then
        kept=$(( kept + 1 ))
        continue
      fi
      # -q:v 3 matches the master encode. Downscales compress well enough that
      # a looser quality here would save kilobytes and cost visible grain on
      # the frames that are mostly sky or paintwork.
      ffmpeg -nostdin -v error -y -i "$src" \
        -vf "scale=$w:-2" -q:v 3 "$dest" </dev/null \
        && cut=$(( cut + 1 )) \
        || echo "!! failed: $slug $(basename "$src") @ ${w}w"
    done
  done

  echo ">> $slug: ${#masters[@]} frames x $(echo "$RUNGS" | wc -w | tr -d ' ') rungs"
done

echo
echo "=== ladder ==="
echo "cut:    $cut"
echo "kept:   $kept  (already present)"
echo "pruned: $pruned  (master no longer exists)"
echo "total:  $(find "$OUT" -path '*/stills/w*' -name '*.jpg' | wc -l | xargs) rung files"
echo "size:   $(du -sh "$OUT" | cut -f1) of derived media"
echo
echo "Publish with: ./scripts/sync-r2.sh"
