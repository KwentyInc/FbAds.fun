# FbAds.fun hosting

The bookmark contains a small stable loader. Releases build one `parseraccs.js` payload, publish it as Open Graph chunks under `dist/parseraccs`, verify SHA-256 in the loader, and cache the last working payload in `localStorage`.

## Build

```bash
npm ci
npm run check
npm run build
```

Cloudflare Pages output directory: `dist`.

## Deployment secrets

Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` under GitHub → Settings → Secrets and variables → Actions.

## Facebook OG refresh without a token

After each deploy, open the URLs printed in the GitHub Actions job summary in Facebook Sharing Debugger and click **Scrape Again**. Refresh the manifest first, then every chunk URL. Users keep the same bookmarklet; the loader picks up the new build automatically.
