#!/usr/bin/env bash
#
# Sync web-ready media to Cloudflare R2.
#
# Only the DERIVED media goes to R2 — the ~430MB of loops, films, posters and
# stills that the site actually serves. The ~27GB of camera masters in
# public/media/<Project>/ are archived locally by hand and are deliberately not
# uploaded; they are gitignored and never deployed either.
#
# Files land at the bucket ROOT, mirroring public/media/derived/ exactly, so a
# URL reads https://media.lumenhaul.com/<slug>/loop.mp4 and the only difference
# between local and production is the NEXT_PUBLIC_MEDIA_BASE_URL prefix.
#
# CREDENTIALS ARE NEVER STORED HERE. This reads an rclone remote you configure
# once, locally, so the secrets stay in rclone's own config:
#
#   rclone config create r2 s3 provider=Cloudflare \
#     access_key_id=<KEY> secret_access_key=<SECRET> \
#     endpoint=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
#
# Usage:
#   ./scripts/sync-r2.sh              # upload / update
#   ./scripts/sync-r2.sh --dry-run    # show what would change
#
# Override the bucket or remote name with R2_BUCKET / R2_REMOTE.

set -euo pipefail
export PATH="/opt/homebrew/bin:$PATH"

BUCKET="${R2_BUCKET:-lumen-haul-media}"
REMOTE="${R2_REMOTE:-r2}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/public/media/derived"

if ! command -v rclone >/dev/null 2>&1; then
  echo "rclone not installed. Run: brew install rclone" >&2
  exit 1
fi

if ! rclone listremotes 2>/dev/null | grep -q "^${REMOTE}:$"; then
  echo "rclone remote '${REMOTE}:' is not configured — see the header of this file." >&2
  exit 1
fi

if [ ! -d "$SRC" ]; then
  echo "No derived media at $SRC. Run ./scripts/encode-media.sh first." >&2
  exit 1
fi

echo "Syncing $(du -sh "$SRC" | cut -f1) of derived media -> ${REMOTE}:${BUCKET}/"

# --checksum instead of the default mtime comparison: re-encoding rewrites
# timestamps even when the bytes are unchanged, and re-uploading 430MB for no
# reason is wasteful.
#
# The long immutable Cache-Control is safe because these filenames are stable
# and their contents only change when the media itself is re-cut — at which
# point the file genuinely should be re-fetched.
rclone sync "$SRC" "${REMOTE}:${BUCKET}" \
  --checksum \
  --transfers 8 \
  --checkers 16 \
  --progress \
  --s3-no-check-bucket \
  --header-upload "Cache-Control: public, max-age=31536000, immutable" \
  "$@"

echo
echo "Done. Verify with:"
echo "  rclone ls ${REMOTE}:${BUCKET} | head"
