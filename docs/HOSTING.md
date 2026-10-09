# FbAds.fun hosting

The bookmark contains a small stable loader. Releases build one `fbads.js` payload, publish it as Open Graph chunks under `dist/app` (`https://fbads.fun/app/latest/manifest`), verify SHA-256 in the loader, and cache the last working payload in `localStorage`.

Bookmarks installed before the rename still point to `https://fbads.fun/parseraccs/latest/manifest`, so every release is also published to that legacy path. Both paths always serve the same build.

## Build

```bash
npm ci
npm run check
npm run build
```

Output directory: `dist` (deployed by Cloudflare Workers Builds on every push to `main`).

## Deployment secrets

Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` under GitHub → Settings → Secrets and variables → Actions.

## Facebook OG refresh without a token

`scripts/fb-rescrape.cjs` re-scrapes all OG URLs automatically when `FB_APP_ID`/`FB_APP_SECRET` are set. Otherwise open the URLs listed in `dist/scrape-urls.json` (also printed by the build) in Facebook Sharing Debugger and click **Scrape Again**. Refresh the manifest first, then every chunk URL. Users keep the same bookmarklet; the loader picks up the new build automatically.
