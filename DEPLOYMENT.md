# Deployment

Two Vercel projects from one repo: `cms/` and `web/`. CMS on a subdomain
(`cms.example.com`), web on the apex/`www`.

## 1. Provision services

- **Neon**: create a project + database. Copy the **pooled** connection string
  (host contains `-pooler`) for `DATABASE_URL`. Append `?sslmode=require`.
- **Media storage** (S3-compatible): Cloudflare R2, Vercel Blob (S3 API), Supabase
  Storage, or AWS S3. Create a bucket, an access key/secret, note the endpoint and
  the public base URL files are served from (`S3_PUBLIC_URL`).
- **Resend**: create an API key and verify your sending domain.
- **Umami** (optional): self-host (e.g. Dokploy/VPS) and note the script URL +
  website id. It is cookieless and loads without consent.

## 2. CMS project (Vercel)

- **Root directory**: `cms`
- **Install command**: `pnpm install` · **Build**: `pnpm build` (auto-detected)
- Env vars (from `cms/.env.example`): `DATABASE_URL`, `PAYLOAD_SECRET`,
  `NEXT_PUBLIC_SERVER_URL` (= the CMS public URL), `PUBLIC_WEB_URL`,
  `PAYLOAD_ALLOWED_ORIGINS` (your web domain), `PREVIEW_SECRET`, `S3_*`, `RESEND_API_KEY`,
  `DEPLOY_HOOK_URL` (see step 4).
- `cms/vercel.json` already raises the Payload API route timeout to 60s.

### Database setup

Migrations are file-based (`push: false`). From your machine, pointed at the Neon DB:

```bash
pnpm --filter cms migrate:create   # generate a migration from the schema
pnpm --filter cms migrate          # apply it (run against prod before first deploy)
pnpm --filter cms seed             # optional: starter content + admin user
```

After deploy: log in at `https://cms.example.com/admin`, change the seeded admin
password, and enable 2FA (Account → set up authenticator or email code).

## 3. Web project (Vercel)

- **Root directory**: `web`
- Env vars (from `web/.env.example`): `PUBLIC_SITE_URL` (web public URL),
  `PUBLIC_CMS_URL` (= CMS public URL), `PAYLOAD_API_KEY` (for draft preview),
  `PREVIEW_SECRET`, and optionally analytics IDs.
- The Astro Vercel adapter handles the build; public routes render on demand so published CMS
  edits show immediately without a web redeploy.

### Media serving (optional rewrite)

By default images are served straight from `S3_PUBLIC_URL`. To serve them under the
web domain instead (avoids cross-origin, hides the bucket), add a `web/vercel.json`:

```json
{ "rewrites": [{ "source": "/media/:path*", "destination": "https://media.example.com/uploads/:path*" }] }
```

and set the CMS `S3_PUBLIC_URL` to `https://www.example.com/media` so generated URLs match.

## 4. Optional rebuild hook

1. In the **web** Vercel project: Settings → Git → **Deploy Hooks** → create one for
   the production branch. Copy the URL.
2. Set it as `DEPLOY_HOOK_URL` in the **CMS** project env.

The live website no longer depends on this hook for fresh published content. Keep it if you want
an extra rebuild for search indexes, static assets, or future cached pages.

## 5. Post-deploy checks

- Homepage, about, blog list + a post, contact, legal pages render.
- `/sitemap-index.xml`, `/robots.txt`, `/llms.txt`, `/rss.xml` resolve.
- Submit the contact form → submission appears in CMS (Forms → Submissions) and the
  Resend notification arrives (enable email in CMS → Email Settings first).
- Admin login enforces 2FA; OG/JSON-LD present in page source.
