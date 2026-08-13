# Contributing to Toolkit

Thanks for helping improve Toolkit. The project is deliberately small at runtime: static HTML, CSS, and browser-native JavaScript. Contributions should preserve its core promise—private local processing, accessibility, and offline use after the first successful load.

## Ground rules

- Write code, comments, commit messages, and documentation in **English**.
- Keep every tool **client-side**. Do not add APIs, telemetry, trackers, remote processors, or runtime CDN dependencies.
- Keep every tool usable after the offline cache has been installed. Use browser APIs, self-hosted assets, and progressive enhancement.
- Do not store tool input or results. The only permitted persistent UI state is the selected language and optional recent-tool slugs.
- Avoid duplicate tools. Extend an existing tool when the use case and output meaning overlap.
- Treat English as the source locale and provide polished Turkish text for every new visible label, placeholder, description, status, error, and generated message.

## Before you start

1. Search the [live catalogue](https://abel0x.github.io/toolkit/#tools) and `assets/js/core/tools-data.js` for an existing equivalent.
2. Open an [issue](https://github.com/abel0x/toolkit/issues) for a feature, a new tool, or a non-trivial design change.
3. Keep a pull request focused: one tool, one bug fix, or one cohesive maintenance change.

For a bug report, include the browser/version, reproducible steps, expected result, and actual result. Security-sensitive findings belong in the private process described in [SECURITY.md](SECURITY.md), not a public issue.

## Local setup

No install step is required. Use a local HTTP server rather than opening files directly:

```bash
git clone https://github.com/abel0x/toolkit.git
cd toolkit
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080). The runtime has no npm dependency. Node.js is only used for the repository checks below.

## Adding or extending a tool

### 1. Decide the implementation shape

Use an existing, independently structured page as a starting point for a conventional tool. The 22 expansion tools share a generated shell and `assets/js/tools/expansion-tools.js`; use that route when the existing component system is a close fit.

Never copy a page without updating its title, description, canonical URL, Open Graph/Twitter values, breadcrumb, module path, and Turkish text.

### 2. Register the tool

Add complete metadata to `assets/js/core/tools-data.js` (or, for an expansion tool, `assets/js/core/extra-tools-data.js`):

```javascript
{
  name: 'Your Tool Name',
  slug: 'your-tool',
  cat: 'devtools',
  catLabel: 'Dev Tools',
  desc: 'A concise, browser-only description.',
  tags: ['searchable', 'keywords'],
  icon: '<svg ...>...</svg>',
}
```

The `slug` must be unique, match `tools/your-tool.html`, be present in `sitemap.xml`, and resolve through the live tool finder.

### 3. Create the page and module

Tool pages use the shared stylesheet modules and load shared scripts in this order at the end of `<body>`:

```html
<script src="../assets/js/core/utils.js" defer></script>
<script src="../assets/js/core/nav.js" defer></script>
<script src="../assets/js/core/i18n-expansion.js" defer></script>
<script src="../assets/js/core/i18n.js" defer></script>
<script src="../assets/js/core/tools-data.js" defer></script>
<script src="../assets/js/core/extra-tools-data.js" defer></script>
<script src="../assets/js/core/command-palette.js" defer></script>
<script src="../assets/js/tools/your-tool.js" defer></script>
```

Keep a conventional tool module isolated and strict:

```javascript
(function initYourTool() {
  'use strict';

  // Use the shared helpers such as showToast() and copyToClipboard().
  // Do not send or persist user-provided data.
}());
```

### 4. Add localisation as part of the feature

Visible English copy is the i18n source key. Add the matching Turkish value to `assets/js/core/i18n.js` for shared UI text or `assets/js/core/i18n-expansion.js` for tool-page and expansion copy. Use `ToolkitI18n.t(key, values)` for dynamic strings; do not concatenate language-dependent fragments.

Verify all of the following in both English and Turkish:

- headings, descriptions, labels, placeholders, help text, and buttons;
- empty, loading, success, and error states;
- generated results, including values interpolated into a sentence;
- titles, navigation labels, and accessible names.

### 5. Regenerate maintained output

Edit `_includes/_nav.html` for shared navigation, then run the narrow maintenance commands that match the change:

```bash
# Shared nav, visible count copy, and complete Service Worker precache.
python3 build.py --nav --tool-count --offline

# Only when changing the generated expansion-tool template or EXPANSION_PAGES.
python3 build.py --sync-expansion --offline
```

`--sync-expansion` rewrites generated expansion-page shells, so inspect its diff carefully. Do not manually increment every textual tool count; `--tool-count` owns the published static copies.

### 6. Validate before opening a PR

```bash
node tests/site-audit.mjs
node tests/expansion-e2e.mjs
```

The first check verifies published pages, metadata, assets, navigation, and tool data. The browser E2E suite starts a local server and Firefox itself and exercises all expansion tools on desktop, mobile, and both interface languages. For a conventional new tool, manually check it in current Firefox and a Chromium browser too.

## Style guide

- **JavaScript:** modern browser JavaScript, strict IIFE modules, no transpilation.
- **CSS:** use existing custom properties and the relevant modular stylesheet; do not add global one-off rules when a component or page module is appropriate.
- **HTML:** semantic landmarks, associated labels, usable keyboard controls, meaningful `aria-*` values, and `alt` text for informative images.
- **Copy:** short, direct English source language and natural Turkish—not word-for-word machine translation.
- **Formatting:** two spaces for HTML, CSS, and JavaScript; keep files UTF-8 with a final newline.

## Build helper reference

`build.py` uses only the Python standard library and maintains generated/static consistency.

| Flag | Purpose |
| --- | --- |
| `--nav` | Inject `_includes/_nav.html` into the published pages. |
| `--meta` | Add missing canonical, Open Graph, and Twitter metadata to tool pages. |
| `--scripts` | Migrate legacy script references to the modular pattern. |
| `--enhance` | Add shared i18n and tool-finder scripts to published pages. |
| `--styles` | Replace retired monolithic stylesheet references with page modules. |
| `--new-tools` | Create the generated expansion tool pages and sitemap entries. |
| `--sync-expansion` | Refresh existing generated expansion-page shells from the template. |
| `--offline` | Rebuild the complete service-worker precache manifest. |
| `--tool-count` | Synchronise published static tool-count copy. |
| `--all` | Run every maintenance task; review the resulting diff especially carefully. |

## Commit messages

Use a short imperative subject with a conventional prefix:

```text
feat: add json schema helper
fix: preserve HMAC key encoding
docs: clarify offline contribution checks
style: align tool footer spacing
```

Thank you for keeping Toolkit useful, local, and dependable.
