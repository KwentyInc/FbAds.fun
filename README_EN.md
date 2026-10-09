<div align="center">

[🇷🇺 Русский](README.md) | [🇺🇸 English]

<a href="https://fbads.fun"><img src="docs/screenshots/accounts-en.svg" alt="ParserAccs" width="100%" style="border-radius: 8px;"></a>

# ParserAccs

**One bookmark for bulk work in Facebook Ads Manager**

Accounts overview · CSV · AutoRules · CloneAds

[![Website](https://img.shields.io/badge/Website-fbads.fun-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://fbads.fun)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Language](https://img.shields.io/badge/Language-JavaScript-yellow?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)

</div>

---

ParserAccs runs right inside Ads Manager and brings your daily tools into one window — no extensions, no installs, no servers.

| Module | What it does | Access |
|---|---|---|
| **📊 Accounts** | Balances, spend, limits, billing, statuses, ads and Business Manager | Read-only |
| **⚙️ AutoRules** | Export, transfer and bulk management of automated rules | Writes after confirmation |
| **🧬 CloneAds** | Clone campaigns, ad sets, ads and creatives between accounts | **Beta**, writes after confirmation |

> [!IMPORTANT]
> ParserAccs is not a Meta product and is not affiliated with Facebook. Double-check selected accounts and settings before bulk changes.

## ⚡ Install in a minute

1. Open **[fbads.fun](https://fbads.fun)**.
2. Show the bookmarks bar: `Ctrl + Shift + B` (macOS: `⌘ + Shift + B`).
3. Choose **RU / EN**.
4. Drag the **📌 ParserAccs** button to the bookmarks bar.
5. Open Facebook Ads Manager and click the bookmark.

Can't drag? Click **"Copy code"**, create a regular bookmark and paste the code into the URL field.

> [!TIP]
> The bookmark updates itself — no need to reinstall it after new releases.

## ✨ Features

### 📊 Accounts

- one table with all available ad accounts;
- IDs without the `act_` prefix, **Copy IDs** and Excel-ready CSV export;
- name, status, currency, balance and daily limit;
- lifetime spend and spend for a period: Today, Yesterday, 7/14/30 days, months, Lifetime and custom dates;
- billing threshold and linked Business Manager;
- active and disapproved ads;
- search, filters and multi-column sorting;
- selection is kept while filtering and sorting;
- refresh data without closing the window.

Changing the period recomputes spend right over the table:

<a href="https://fbads.fun/docs/screenshots/recount.svg"><img src="docs/screenshots/recount.svg" alt="Spend recompute" width="820" style="border-radius: 8px;"></a>

### ⚙️ AutoRules

Transfers automated rules from a donor account to the selected accounts.

- pick individual rules and import into many accounts at once;
- rule filters and per-account counters;
- money thresholds converted to the target account currency;
- import as `PAUSED`;
- bulk enable, disable and delete;
- export and import rules as JSON;
- detailed color-coded operation log.

> [!NOTE]
> `SCHEDULED` rule hours are not shifted automatically because of DST. The time-zone difference is shown in the log for manual review.

<a href="https://fbads.fun/docs/screenshots/autorules.svg"><img src="docs/screenshots/autorules.svg" alt="ParserAccs AutoRules" width="820" style="border-radius: 8px;"></a>

### 🧬 CloneAds — beta

Clones selected campaigns from a donor account into one or more target accounts.

- campaigns, ad sets, ads and creatives;
- export and import the structure as JSON;
- Fan Page, pixel and Instagram mapping;
- images and multi-language assets (where the API allows);
- campaign status `PAUSED` or `ACTIVE`, safe draft mode;
- Fan Page override and random budget within a range;
- naming: original, ID replace, Find/Replace or macro templates;
- Stop button, error log and protection against re-processing.

> [!WARNING]
> Keep campaigns `PAUSED`, use draft mode and review everything in Ads Manager before launch. CloneAds is experimental: some formats may need manual fixes.

<a href="https://fbads.fun/docs/screenshots/cloneads.svg"><img src="docs/screenshots/cloneads.svg" alt="ParserAccs CloneAds" width="820" style="border-radius: 8px;"></a>

## 🔐 Security

- The **Accounts** tab only reads data.
- AutoRules and CloneAds ask for confirmation before any change.
- The token is taken from your open Ads Manager session and is **never sent anywhere** except the official Graph API on your behalf.
- The code is open; every release is verified by checksum.

## 🌐 Languages

Russian and English. Pick the language on the landing page; inside ParserAccs it switches without a restart.

<details>
<summary>🛠 Technical architecture & Development (click to expand)</summary>

### Delivery

```text
src/*.js
   ↓ npm run build
parseraccs.js
   ↓ packaging + SHA-256
manifest + Open Graph chunk
   ↓ Cloudflare Workers / fbads.fun
stable bookmark loader
```

The bookmark stores a small loader, not the whole program. On launch it:

1. fetches the published ParserAccs version (manifest + chunk via Facebook's Open Graph cache);
2. verifies the SHA-256 of the content;
3. stores a working copy in `localStorage`;
4. falls back to the cache if the fresh version is temporarily unavailable.

### Build

Requires Node.js 20+.

```bash
git clone https://github.com/KwentyInc/ParserAccs.git
cd ParserAccs
npm ci
npm run check
npm run build
```

| Command | What it does |
|---|---|
| `npm run build:payload` | builds `parseraccs.js` from `src/` |
| `npm run check` | checks the build is up to date and valid |
| `npm run build` | creates the ready-to-deploy `dist/` |

### Deploy

Cloudflare Workers builds and publishes the landing page and package on every push to `main`. After deploy, `scripts/fb-rescrape.cjs` refreshes Facebook's cache automatically. To do it manually, use the [Sharing Debugger](https://developers.facebook.com/tools/debug/) for:

```text
https://fbads.fun/parseraccs/latest/manifest
https://fbads.fun/parseraccs/latest/og/chunk-001
```

More details in [HOSTING.md](HOSTING.md).

### Source layout

```text
src/i18n.js       token, translations and shared data
src/accounts.js   accounts and metrics loading
src/modal.js      UI skeleton
src/rules.js      AutoRules
src/clone*.js     CloneAds
src/styles.js     UI styles
src/bindings.js   events, table and export
```

</details>

## ☕ Support the project

> 💚 **ParserAccs is free, open-source and ad-free.**
> If it saves you time — you can buy the author a coffee ☕
>
> 🟥 **USDT TRC-20 (Tron):** `TVGbahTRp8QjrU4pHxrop7VNdQ5xhoTngZ`
>
> 🔷 **USDT ERC-20 (Ethereum):** `0x3A0a4287A488C6C8BCFBc8e8acD1409b8ffE48E0`
>
> 📱 QR codes are in the [Donate section on fbads.fun](https://fbads.fun/#donate). Thank you! 🙏

## 📄 License

[MIT](LICENSE) · Author: [Kwenty](https://t.me/kw33nty)
