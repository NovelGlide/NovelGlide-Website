---
name: blog
description: >-
  Publish and manage NovelGlide marketing-blog posts in the Notion "Blog Posts"
  database (the source of truth the website renders at build time). Covers the
  whole authoring flow — model a post as per-locale rows sharing one slug,
  validate slug-tags against the UI catalogs, create the rows + set the Markdown
  body, and verify — plus listing existing posts. Use whenever the task is to
  write / publish / draft / translate / list a blog article for
  novelglide.kai-wu.net.
  TRIGGER: "publish a blog post", "new blog post", "add a blog article",
  "draft a post", "write a blog post", "translate a post", "list blog posts",
  "發文", "發一篇部落格", "新增文章", "寫一篇部落格", "草稿", "翻譯文章",
  "列出部落格文章", "/blog".
  NOT for: editing the blog's CODE/layout (that's normal Next.js work under
  src/app/[locale]/blog/); privacy-policy content (that lives in the Flutter
  repo's cdn-resources/, not Notion).
---

# blog — publish & manage marketing-blog posts

The blog is **Notion-backed**: posts live in the Notion "Blog Posts" database and
the website renders them as static HTML (SSG + ISR). This skill is how an agent
**writes to that database**. The rendering side is documented in the root
`CLAUDE.md` §Blog.

## Auth (important)

Writes go through the machine-local **`ntn` CLI** (the same login the DB was
created with) — **not** the website's `NOTION_BLOG_TOKEN`. That Vercel var is
marked *Sensitive* and cannot be read locally, and it is read-only anyway. So
publishing works wherever `ntn login` is valid; nothing to pass through. (If
`ntn` is missing: it's Notion's official CLI, see the Flutter repo's
`.claude/skills/archivist/references/ntn.md`.)

The script resolves the DB id from `$NOTION_BLOG_DB_ID` or falls back to the
known id. It never needs the token.

## The data model (read before authoring)

- **One row = one (article × locale).** A post that exists in N languages is N
  rows that **share the same `Slug`** (a language-neutral key) and differ by
  `Locale`. A single-language post is one row.
- The website mints a URL **only for locales that actually have a row**
  (`/[locale]/blog/<slug>`, `en` prefix-free) — so there is no duplicate content
  and no phantom translations. Don't create a locale row unless you have a real
  translation for it.
- **Body lives in the Notion page content** (blocks). The script sets it from
  Markdown; `ntn` converts Markdown → blocks. Keep it to the common subset
  (headings, paragraphs, lists, quotes, code, links, images).
- Properties: `Title`, `Slug`, `Locale` (`en`/`ja`/`zh-tw`/`zh-cn`), `Status`
  (`Draft`/`Published` — only Published renders), `Date` (publish date + sort),
  `Description` (meta description / OG text), `Cover` (files — optional OG /
  listing image), `Tags` (multi_select of **slugs**).

## Tags are SLUGS with a fail-loud label mapping

Tags on the row are **language-neutral slugs** (lowercase, e.g. `announcement`,
`release-notes`). The website shows a per-locale label from the `Tags` namespace
in `messages/<locale>.json`. **A slug with no label THROWS during the site build**
(the `TagList` component is deliberately fail-loud — it never renders a raw
slug). Therefore:

> **Every tag slug MUST have a `Tags.<slug>` entry in all four
> `messages/{en,ja,zh-tw,zh-cn}.json` before you publish**, or the deploy breaks.

`node scripts/blog.mjs validate-tags <manifest>` checks this; `publish` runs the
same check and refuses to `--commit` if any label is missing. If you introduce a
new tag slug, add its four labels (that's a code change — commit it) first.

## Publishing flow

1. **Write the post.** Author a manifest JSON (schema below) — one entry per
   locale you actually have. Keep each locale's copy native and on-tone (match
   the register of the existing `messages/*.json`; Chinese uses full-width
   punctuation; zh-tw is Taiwan Traditional, zh-cn Simplified, ja natural keigo).
2. **New tag slug?** Add `Tags.<slug>` to all four `messages/*.json` and commit.
3. **Validate:** `node .claude/skills/blog/scripts/blog.mjs validate-tags <manifest>`.
4. **Dry-run:** `node .claude/skills/blog/scripts/blog.mjs publish <manifest>` —
   prints the plan, creates nothing.
5. **Commit:** re-run with `--commit`. It creates one row per locale (shared
   slug), sets each body, and prints the new page ids.
6. **Verify:** `node .claude/skills/blog/scripts/blog.mjs list` (or `--all` to
   include Drafts). The post is live on the next Vercel deploy / within the ISR
   1h window — verify on the site, not locally (no token locally).

Publish as `Draft` first if it needs review; flip to `Published` in the Notion UI
(or re-run publish with `status: "Published"` on a fresh slug — the script
creates, it does not update existing rows).

## Manifest schema

```json
{
  "slug": "reading-tips",
  "date": "2026-07-20",
  "status": "Published",
  "tags": ["announcement"],
  "translations": {
    "en":    { "title": "…", "description": "…", "body": "## Heading\n\nMarkdown…" },
    "zh-tw": { "title": "…", "description": "…", "body": "## 標題\n\n內文…" }
  }
}
```

- `slug` — lowercase, url-safe, shared across all translations of the post.
- `translations` — at least one locale; each needs `title`; `description` and
  `body` are optional (no body = an empty post page).
- Omit locales you don't have a real translation for.

## Cover / OG image

- Set `Cover` (a files property) in the Notion UI if the post has a hero image —
  the website uses it as the listing thumbnail and the social-share (OG) card.
- No cover → the site auto-generates a branded title card (`opengraph-image.tsx`).
- The script does not upload cover files; add them in Notion.

## Commands

| Command | What |
|---|---|
| `node .claude/skills/blog/scripts/blog.mjs list [--all]` | List Published (or all) rows |
| `node .claude/skills/blog/scripts/blog.mjs validate-tags <manifest>` | Check tag slugs have labels in every locale |
| `node .claude/skills/blog/scripts/blog.mjs publish <manifest> [--commit]` | Dry-run (default) or create the rows + bodies |

## What this skill is NOT

- Not the blog's rendering code — that's normal Next.js work under
  `src/app/[locale]/blog/` + `src/{domain,data}/blog_*` (see root `CLAUDE.md`).
- Not privacy-policy content — that is Markdown in the **Flutter** repo's
  `cdn-resources/`, published to R2, not Notion.
- Not an updater — it creates rows. Edit an existing post's properties/status in
  the Notion UI (or `ntn`); the slug-tag rule still applies.
