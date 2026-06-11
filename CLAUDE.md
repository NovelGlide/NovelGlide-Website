# CLAUDE.md

## What This Is

NovelGlide's public marketing + privacy site — the human-facing web
presence for the NovelGlide EPUB reader app (the app itself lives in the
sibling repo `../NovelGlide-Flutter/`). Next.js 15 (App Router) + React 19
+ next-intl, hosted on **Vercel at `https://novelglide.kai-wu.net`**.

**The store listings' privacy-policy URL points at this site** (the
Vercel page), not at any CDN or raw markdown host. That indirection is
deliberate — see §Privacy Content Is Not In This Repo: the content source
behind the page can move without ever touching a store setting.

## Deploy

**Push to `main` → Vercel auto-deploys to production.** CI is already
wired on the Vercel side; there is no manual deploy step and no
`vercel.json` in the repo (the project config lives in the Vercel
dashboard). Don't add a deploy workflow — pushing `main` is the deploy.

- `npm run dev` — local dev server (`next dev --turbopack`, port 3000).
- `npm run build` — `next build --turbopack && next-sitemap`. The
  `next-sitemap` step reads `VERCEL_PROJECT_PRODUCTION_URL`, a
  Vercel-injected env var, so the sitemap's `siteUrl` is only correct in
  the Vercel build environment (locally it resolves to `https://undefined`
  — harmless, expected).
- `npm run lint` — eslint.

## Privacy Content Is Not In This Repo (the load-bearing quirk)

The privacy-policy page does **not** bundle its own markdown. It fetches
the document **client-side from the R2 CDN** at render time:

```
src/app/privacy-policy/privacy_policy_content.tsx   ('use client')
  → LocaleUtils.getManualUrl('privacy-policy', locale)   // builds the R2 URL
  → HttpRepository.fetchMarkdown(url)                      // plain fetch() + .text()
  → MarkdownViewer                                         // react-markdown render
```

The fetched URL is
`https://novelglide-cdn.kai-wu.net/privacy-policy/<resourceLocale>.md`
(Cloudflare R2 + custom domain). Consequences a contributor must know:

- **The markdown content lives in the Flutter repo, not here.** It is
  authored under `../NovelGlide-Flutter/cdn-resources/privacy-policy/`
  and published to R2 by that repo's `publish-content.yml` GitHub
  Action. The app and this website **share** the same R2-hosted
  documents. To change the privacy text, edit it there — editing
  anything in *this* repo will not change what the page shows.
- **Locale → resource-file mapping.** This site's locales are
  `en` / `zh-tw` / `zh-cn` / `ja` (next-intl; see
  `src/i18n/support_locales.ts`). The R2 files use richer BCP-47 tags,
  so `LocaleUtils.mapToResourceLocale` maps `zh-tw → zh-Hant-TW` and
  `zh-cn → zh-Hans-CN`; `en` / `ja` pass through unchanged. The R2 file
  set must carry every mapped tag or that locale shows the error state.
- **CORS-gated.** This is a browser-side cross-origin fetch, so R2 must
  allow this site's origin (`https://novelglide.kai-wu.net` + localhost
  for dev). R2 echoes the matched `Origin` with `vary: Origin`. If the
  origin is not in R2's allowed list, the fetch fails CORS and the page
  renders `ErrorComponent`.
- **No fallback.** If R2 is unreachable or CORS is misconfigured, the
  page shows `ErrorComponent` — there is no bundled copy to fall back to.
  `fetchMarkdown` throws on a non-`ok` response; the content component's
  `.catch` surfaces the error state.

`messages/{en,ja,zh-cn,zh-tw}.json` (the next-intl catalogs) **are**
in-repo — but they hold only the site's **UI chrome** strings (nav,
headings, the word "Privacy Policy"), never the privacy document itself.
Don't confuse the two.

## Static-Resource Host Topology

NovelGlide's online static resources span **three hosts** — easy to
confuse, so the full reference lives in the Notion KB page **"Static
Resource Hosting Topology"**. The short version relevant here:

| Host | Platform | Role |
|---|---|---|
| `novelglide.kai-wu.net` | Vercel (**this repo**) | human-facing marketing + privacy page; the store privacy URL points here |
| `novelglide-cdn.kai-wu.net` | Cloudflare R2 | app + this site fetch shared content (privacy docs, OPDS catalog, brand fonts) from here |
| `novelglide.github.io` | GitHub Pages | legacy shared-content host — **being retired** (content migrated to R2) |

So this site is the **presentation** of the privacy policy; R2 is its
**content source**; the store setting points at this site and never has
to change when the content source moves.

## Structure

Loosely mirrors the app's clean-architecture layering:

- `src/app/` — Next.js App Router (pages, layout, locale routing,
  `privacy-policy/`).
- `src/domain/http_repository.ts` — the fetch contract (static facade).
- `src/data/http_repository_data.ts` — the actual `fetch()` impl.
- `src/presentation/` — shared components (nav, footer, markdown viewer,
  loading / error states).
- `src/i18n/` — next-intl wiring (`request.ts`, `support_locales.ts`,
  `change_locale.ts`) + `locale_utils.ts` (the R2 URL builder + locale
  mapping above).
- `messages/` — next-intl UI-string catalogs (chrome only — see above).

## What This Is Not

- **Not where privacy-policy content is authored** — that is the Flutter
  repo's `cdn-resources/privacy-policy/`, published to R2. This repo only
  *renders* it.
- **Not the app** — the EPUB reader is `../NovelGlide-Flutter/`. This is
  the marketing/legal web surface only.
- **Not a CMS** — content is plain markdown fetched from R2; there is no
  authoring UI here.
