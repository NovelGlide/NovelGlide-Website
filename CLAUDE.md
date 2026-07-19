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
- `npm run build` — `next build --turbopack`. Sitemap + robots are **native
  routes** (`src/app/sitemap.ts` / `robots.ts`), not a post-build step —
  `next-sitemap` was removed.
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

## Blog (Notion-backed — the one dynamic, indexable surface)

Unlike the privacy page (client-fetched CSR, SEO doesn't matter), the **blog
is server-rendered for SEO** — its whole reason to exist is promotion. Posts
live in a **Notion database** and render as static HTML (SSG + ISR). To
**publish** a post, use the **`/blog` skill** (`.claude/skills/blog/`) — this
section is the rendering-side reference.

- **Source of truth — Notion "Blog Posts" DB.** Env (Vercel, Preview +
  Production, **Sensitive** so `vercel env pull` returns them EMPTY — they are
  unavailable locally by design): `NOTION_BLOG_TOKEN` (read-only integration
  scoped to just this DB) + `NOTION_BLOG_DB_ID`. No local token → `npm run
  build` locally fetches **zero posts** and the data layer degrades to empty
  (expected). **Verify blog content on the Vercel preview, not locally.**
- **Data model — one row per (article × locale).** `Title`, `Slug` (the
  language-neutral translation key), `Locale` (en/ja/zh-tw/zh-cn), `Status`
  (Draft/Published — only Published renders), `Date`, `Description` (meta/OG),
  `Cover` (files), `Tags` (multi_select of **slugs**). Rows sharing a `Slug`
  are translations of ONE post. The article **body is the Notion page blocks**,
  converted by `notion-to-md` and rendered through the shared `MarkdownViewer`.
- **No duplicate content.** `generateStaticParams` emits one page per published
  row → only real translations get a URL. Each post's hreflang lists exactly
  the locales that have it; canonical is self-referential (never
  cross-canonical translations). `localePrefix: 'as-needed'` keeps `en`
  prefix-free.
- **Tags = slugs + a fail-loud label mapping.** A row's `Tags` are
  language-neutral slugs; the display label comes from the `Tags` namespace in
  `messages/<locale>.json`. A slug with **no mapping THROWS during SSG**
  (`TagList`) — the build fails loudly rather than shipping a raw slug. So
  **every tag slug MUST have a `Tags.<slug>` entry in all four
  `messages/*.json`**, or the deploy breaks (the `/blog` skill validates this
  before publishing).
- **SEO surfaces.** `app/sitemap.ts` + `app/robots.ts` (native, reuse
  `BlogRepository`, per-URL hreflang), per-locale RSS at
  `/[locale]/blog/rss.xml`, and generated OG cards via
  `[slug]/opengraph-image.tsx` (cover-if-present else a title card; CJK titles
  load a per-locale Noto subset).
- **Deferred — Notion inline-image rehosting.** `notion-to-md` emits body
  images as Notion **signed URLs (~1h expiry)**; the ISR 1h window refreshes
  them, but a proper rehost-to-our-origin is a TODO (marked in
  `blog_repository_data.ts`) — do it when the first image-heavy post ships.

## Structure

Loosely mirrors the app's clean-architecture layering. Locale is **path-based**
(`src/app/[locale]/…`, next-intl `localePrefix: 'as-needed'`, so `en` is
prefix-free) — there is no locale cookie.

- `src/app/[locale]/` — App Router pages (home, `privacy-policy/`, `blog/`) +
  the root layout. `sitemap.ts` / `robots.ts` sit at `src/app/`.
- `src/domain/` + `src/data/` — static-facade repositories:
  `http_repository` (R2 markdown fetch) and `blog_repository` (Notion).
- `src/presentation/` — shared components (nav, footer, markdown viewer,
  tag list, loading / error states).
- `src/i18n/` — next-intl routing (`routing.ts`, `navigation.ts`,
  `request.ts`, `support_locales.ts`) + `alternates.ts` (the canonical /
  hreflang builder) + `locale_utils.ts` (R2 URL builder). `middleware.ts` is at
  the repo root.
- `src/config/site.ts` — the canonical production origin (`SITE_URL`).
- `messages/` — next-intl catalogs: UI chrome **and** the `Tags` label mapping
  (§Blog). Never the privacy / blog document bodies.

## What This Is Not

- **Not where privacy-policy content is authored** — that is the Flutter
  repo's `cdn-resources/privacy-policy/`, published to R2. This repo only
  *renders* it.
- **Not the app** — the EPUB reader is `../NovelGlide-Flutter/`. This is
  the marketing/legal web surface only.
- **Not a CMS for privacy** — privacy content is plain markdown fetched from
  R2; there is no authoring UI for it here. (The **blog** *is* Notion-backed —
  see §Blog — a separate, server-rendered surface; publish via the `/blog`
  skill.)
