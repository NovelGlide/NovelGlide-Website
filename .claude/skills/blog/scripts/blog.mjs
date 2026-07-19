#!/usr/bin/env node
// blog.mjs — publish / list blog posts in the Notion "Blog Posts" DB.
//
// Auth: uses the machine-local `ntn` CLI (same login the DB was created with),
// NOT the website's NOTION_BLOG_TOKEN (that Vercel var is Sensitive and cannot
// be read locally). So this runs wherever `ntn login` is valid.
//
//   node blog.mjs list [--all]                 # list Published (or --all) rows
//   node blog.mjs validate-tags <manifest>     # check tag slugs have labels
//   node blog.mjs publish <manifest> [--commit] # dry-run unless --commit
//
// Gotchas baked in: `ntn api` POST/PATCH HANGS unless stdin is closed, so every
// call spawns with stdin ignored. Notion multi_select matches option names
// case-insensitively — keep tag slugs lowercase.

import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, mkdtempSync, writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const MESSAGES_DIR = path.join(REPO_ROOT, "messages");
const LOCALES = ["en", "ja", "zh-tw", "zh-cn"];

const DB_ID =
  process.env.NOTION_BLOG_DB_ID || "869b0ec1-a2ab-4aba-952f-c56dc53edd7a";

// --- ntn transport -------------------------------------------------------

function ntnBin() {
  const candidates = [
    process.env.NTN_BIN,
    process.env.NTN_INSTALL_DIR && path.join(process.env.NTN_INSTALL_DIR, "ntn"),
    path.join(os.homedir(), "development", "ntn", "ntn"),
    "ntn",
  ].filter(Boolean);
  for (const c of candidates) {
    if (c === "ntn" || existsSync(c)) return c;
  }
  return "ntn";
}
const NTN = ntnBin();

// Run ntn with stdin IGNORED (the load-bearing fix for the POST/PATCH hang).
function ntn(args) {
  const r = spawnSync(NTN, args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (r.status !== 0 && !r.stdout) {
    throw new Error(`ntn ${args[0]} failed: ${r.stderr || r.error || "unknown"}`);
  }
  return r.stdout;
}

function api(apiPath, method, body) {
  const args = ["api", apiPath, "-X", method];
  if (body !== undefined) args.push("-d", JSON.stringify(body));
  const out = ntn(args);
  const json = JSON.parse(out);
  if (json.object === "error") {
    throw new Error(`Notion API ${json.status} ${json.code}: ${json.message}`);
  }
  return json;
}

let _dsId = null;
function dataSourceId() {
  if (!_dsId) {
    const db = api(`v1/databases/${DB_ID}`, "GET");
    _dsId = db.data_sources?.[0]?.id;
    if (!_dsId) throw new Error("Blog DB has no data source.");
  }
  return _dsId;
}

// --- reads ---------------------------------------------------------------

function plain(prop) {
  if (prop?.type === "title") return prop.title.map((t) => t.plain_text).join("");
  if (prop?.type === "rich_text") return prop.rich_text.map((t) => t.plain_text).join("");
  return "";
}

function queryPosts(publishedOnly) {
  const filter = publishedOnly
    ? {property: "Status", select: {equals: "Published"}}
    : undefined;
  const rows = [];
  let cursor;
  do {
    const body = {sorts: [{property: "Date", direction: "descending"}], page_size: 100};
    if (filter) body.filter = filter;
    if (cursor) body.start_cursor = cursor;
    const res = api(`v1/data_sources/${dataSourceId()}/query`, "POST", body);
    for (const row of res.results) {
      const p = row.properties;
      rows.push({
        id: row.id,
        title: plain(p.Title),
        slug: plain(p.Slug),
        locale: p.Locale?.select?.name ?? "",
        status: p.Status?.select?.name ?? "",
        date: p.Date?.date?.start ?? "",
        tags: (p.Tags?.multi_select ?? []).map((t) => t.name),
      });
    }
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return rows;
}

// --- tag validation (mirror the build's fail-loud TagList) ---------------

function tagLabels() {
  const byLocale = {};
  for (const loc of LOCALES) {
    const msgs = JSON.parse(readFileSync(path.join(MESSAGES_DIR, `${loc}.json`), "utf8"));
    byLocale[loc] = msgs.Tags ?? {};
  }
  return byLocale;
}

function validateTags(tags) {
  if (!tags?.length) return [];
  const labels = tagLabels();
  const missing = [];
  for (const slug of tags) {
    const gaps = LOCALES.filter((loc) => !(slug in labels[loc]));
    if (gaps.length) missing.push({slug, locales: gaps});
  }
  return missing;
}

// --- publish -------------------------------------------------------------

function createRow({slug, date, status, tags, locale, title, description}) {
  const props = {
    Title: {title: [{text: {content: title}}]},
    Slug: {rich_text: [{text: {content: slug}}]},
    Locale: {select: {name: locale}},
    Status: {select: {name: status}},
  };
  if (date) props.Date = {date: {start: date}};
  if (description) props.Description = {rich_text: [{text: {content: description}}]};
  if (tags?.length) props.Tags = {multi_select: tags.map((name) => ({name}))};
  const page = api("v1/pages", "POST", {
    parent: {type: "data_source_id", data_source_id: dataSourceId()},
    properties: props,
  });
  return page.id;
}

function setBody(pageId, markdown) {
  // ntn converts Markdown → Notion blocks. Pass via a temp file arg would still
  // be a CLI string; --content takes the markdown directly.
  ntn(["pages", "edit", pageId, "--content", markdown]);
}

function publish(manifest, commit) {
  const {slug, date, status = "Published", tags = [], translations} = manifest;
  if (!slug) throw new Error("manifest.slug is required");
  if (!translations || !Object.keys(translations).length) {
    throw new Error("manifest.translations must have at least one locale");
  }

  const missing = validateTags(tags);
  if (missing.length) {
    console.error("✗ Missing tag labels (add Tags.<slug> to messages/<locale>.json):");
    for (const m of missing) console.error(`   "${m.slug}" → ${m.locales.join(", ")}`);
    console.error("These would FAIL the site build (fail-loud TagList). Fix before publishing.");
    process.exit(1);
  }

  const plan = Object.entries(translations).map(([locale, t]) => ({
    locale,
    title: t.title,
    hasBody: Boolean(t.body),
  }));
  console.log(`Post "${slug}" · status=${status} · date=${date ?? "—"} · tags=[${tags.join(", ")}]`);
  for (const p of plan) {
    console.log(`  ${commit ? "→" : "·"} ${p.locale}: "${p.title}"${p.hasBody ? "" : "  (no body)"}`);
  }
  if (!commit) {
    console.log("\nDRY RUN — re-run with --commit to create these rows.");
    return;
  }

  const created = [];
  for (const [locale, t] of Object.entries(translations)) {
    if (!t.title) throw new Error(`translations.${locale}.title is required`);
    const id = createRow({slug, date, status, tags, locale, title: t.title, description: t.description});
    if (t.body) setBody(id, t.body);
    created.push({locale, id});
    console.log(`  ✓ ${locale} → ${id}`);
  }
  console.log(`\nPublished ${created.length} row(s). Live on the next Vercel deploy / within the ISR window.`);
}

// --- cli -----------------------------------------------------------------

function loadManifest(p) {
  if (!p) throw new Error("manifest path required");
  return JSON.parse(readFileSync(path.resolve(p), "utf8"));
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === "list") {
    const rows = queryPosts(!rest.includes("--all"));
    for (const r of rows) {
      console.log(`${r.status.padEnd(9)} ${r.locale.padEnd(6)} ${r.slug.padEnd(20)} ${r.date.padEnd(11)} [${r.tags.join(", ")}]  ${r.title}`);
    }
    console.log(`\n${rows.length} row(s).`);
  } else if (cmd === "validate-tags") {
    const m = loadManifest(rest[0]);
    const missing = validateTags(m.tags ?? []);
    if (!missing.length) {
      console.log(`✓ All tag slugs [${(m.tags ?? []).join(", ")}] have labels in every locale.`);
    } else {
      for (const x of missing) console.error(`✗ "${x.slug}" missing in: ${x.locales.join(", ")}`);
      process.exit(1);
    }
  } else if (cmd === "publish") {
    const commit = rest.includes("--commit");
    const manifestPath = rest.find((a) => !a.startsWith("--"));
    publish(loadManifest(manifestPath), commit);
  } else {
    console.log("usage: node blog.mjs <list [--all] | validate-tags <manifest> | publish <manifest> [--commit]>");
    process.exit(cmd ? 1 : 0);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
