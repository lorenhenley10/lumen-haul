# Media hosting — Cloudflare R2

The site's media does not live in the repository. It is served from a
Cloudflare R2 bucket behind a custom domain, and the repo holds only code.

## Why

The camera masters are ~27GB of 4K at 40-113 Mbps, with single files up to
5.5GB. Those never ship anywhere — they are archived locally by hand and are
excluded by both `.gitignore` and `.vercelignore`.

The *derived* media (~430MB of loops, films, posters and stills) was initially
committed to git so the site could go live. That worked but is the wrong home
for it: it inflates every clone, is re-uploaded on every Vercel deploy, and
pushes three files past GitHub's 50MB advisory limit. R2 fixes all three and
charges nothing for egress.

## The three moving parts

| Piece | Where | Purpose |
|---|---|---|
| Masters | Local disk only | Archive. Never uploaded, never deployed |
| Derived media | R2 bucket, root level | What the site serves |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | Vercel env var | Points the app at the bucket |

The bucket's layout mirrors `public/media/derived/` exactly:

```
<slug>/loop.mp4        10s silent ambient loop
<slug>/film.mp4        full piece with audio
<slug>/poster.jpg      poster frame
<slug>/stills/NN.<hash>.jpg   supporting photography
```

So a local path `/media/derived/blazar-mantis-135/loop.mp4` becomes
`https://media.lumenhaul.com/blazar-mantis-135/loop.mp4`. Nothing else in the
codebase changes — `src/content/media.ts` reads the base URL once, and
`next.config.ts` derives the `next/image` remote host from the same value.

**Unset the variable and everything falls back to `/public`**, so local
development needs no configuration and works offline.

## One-time setup

1. **Create the bucket** — Cloudflare dashboard → R2 → Create bucket,
   named `lumen-haul-media`.

2. **Connect a custom domain** — bucket → Settings → Public access →
   Connect Domain → `media.lumenhaul.com`. Since `lumenhaul.com` already uses
   Cloudflare nameservers this needs no DNS work.

   Do **not** use the `r2.dev` development URL. Cloudflare rate-limits it and
   explicitly does not support it for production traffic.

3. **Create an API token** — R2 → Manage API Tokens → Create, with
   *Object Read & Write* on that bucket.

4. **Configure rclone locally.** Run this yourself so the secrets go straight
   into rclone's config file and never appear anywhere else:

   ```bash
   rclone config create r2 s3 provider=Cloudflare \
     access_key_id=<KEY> \
     secret_access_key=<SECRET> \
     endpoint=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   ```

5. **Upload:**

   ```bash
   ./scripts/sync-r2.sh --dry-run   # check first
   ./scripts/sync-r2.sh
   ```

6. **Point the site at it** — set the variable on Vercel for all environments,
   then redeploy:

   ```bash
   vercel env add NEXT_PUBLIC_MEDIA_BASE_URL production
   # value: https://media.lumenhaul.com
   ```

## Ordering matters

The live site currently serves media from the git repo. **Do not remove media
from git until R2 is confirmed serving it**, or production breaks between the
two steps. The safe order is:

1. Upload to R2
2. Set the Vercel variable and redeploy
3. Verify the live site loads media from `media.lumenhaul.com`
4. *Then* untrack the media and, optionally, purge it from git history

## Adding or re-cutting media later

```bash
./scripts/encode-media.sh      # masters -> loops, films, posters
./scripts/encode-stills.sh     # masters -> supporting stills
./scripts/sync-r2.sh           # push derivatives to R2
```

Then update `src/content/projects.ts` if the slate itself changed. Because the
sync uses `--checksum`, unchanged files are not re-uploaded.

## Cache behaviour

Uploads carry `Cache-Control: public, max-age=31536000, immutable`. Filenames
are stable and their contents only change when a piece is genuinely re-cut, so
long caching is safe. If you replace a file in place and need it live
immediately, purge that path in the Cloudflare cache.
