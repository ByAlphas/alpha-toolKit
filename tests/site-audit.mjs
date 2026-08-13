#!/usr/bin/env node
/* Static contract checks for the published, dependency-free site. */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toolsDirectory = join(root, 'tools');
const toolPages = readdirSync(toolsDirectory)
  .filter((name) => name.endsWith('.html'))
  .sort()
  .map((name) => join(toolsDirectory, name));
const pages = [join(root, 'index.html'), join(root, '404.html'), ...toolPages];

assert.equal(toolPages.length, 100, `Expected 100 tool pages, found ${toolPages.length}.`);

const sharedStyles = [
  'assets/css/core.css',
  'assets/css/components.css',
  'assets/css/compatibility.css'
];

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const prefix = file.startsWith(toolsDirectory) ? '../' : '';
  const relativeName = file.slice(root.length + 1);

  assert(!/href="(?:\.\.\/)?style\.css"/.test(html), `${relativeName} still loads style.css.`);
  for (const stylesheet of sharedStyles) {
    assert(html.includes(`href="${prefix}${stylesheet}"`), `${relativeName} misses ${stylesheet}.`);
  }

  const pageStyle = file.endsWith('index.html')
    ? 'assets/css/pages/home.css'
    : 'assets/css/pages/tool.css';
  assert(html.includes(`href="${prefix}${pageStyle}"`), `${relativeName} misses its page stylesheet.`);

  const expansionStyle = `${prefix}assets/css/features/expansion-tools.css`;
  const isExpansionTool = html.includes('id="toolApp"');
  assert(isExpansionTool === html.includes(`href="${expansionStyle}"`),
    `${relativeName} has an incorrect expansion-tool stylesheet.`);
  if (isExpansionTool) {
    assert(html.includes('class="footer-inner"') && html.includes('class="footer-social"'),
      `${relativeName} does not use the complete shared footer shell.`);
  }

  assert(html.includes('class="nav-actions"'), `${relativeName} misses the compact shared header.`);
  assert(!html.includes('class="nav-links"'), `${relativeName} still contains retired navigation markup.`);

  const extensionIndex = html.indexOf(`${prefix}assets/js/core/i18n-expansion.js`);
  const runtimeIndex = html.indexOf(`${prefix}assets/js/core/i18n.js`);
  assert(extensionIndex !== -1 && runtimeIndex !== -1 && extensionIndex < runtimeIndex,
    `${relativeName} has an invalid i18n script order.`);
}

for (const asset of [
  ...sharedStyles,
  'assets/css/pages/home.css',
  'assets/css/pages/tool.css',
  'assets/css/features/expansion-tools.css',
  'assets/js/core/i18n-expansion.js',
  'assets/js/core/i18n.js'
]) {
  assert(existsSync(join(root, asset)), `Missing required asset: ${asset}`);
}

for (const stylesheet of [
  ...sharedStyles,
  'assets/css/pages/home.css',
  'assets/css/pages/tool.css',
  'assets/css/features/expansion-tools.css'
]) {
  const css = readFileSync(join(root, stylesheet), 'utf8');
  assert(!css.includes(':has('), `${stylesheet} uses a selector outside the site's compatibility baseline.`);
}

const sharedComponents = readFileSync(join(root, 'assets/css/components.css'), 'utf8');
assert(!/\.reveal\s*\{[^}]*opacity\s*:\s*0/i.test(sharedComponents),
  'Reveal elements must not start hidden; pages must remain usable before JavaScript runs.');
assert(sharedComponents.includes('.footer {') && sharedComponents.includes('.footer-bottom {'),
  'Shared footer styles must be available to the hub page.');

const toolPageStyles = readFileSync(join(root, 'assets/css/pages/tool.css'), 'utf8');
assert(!toolPageStyles.includes('/* ── Footer ───────────────────────────────────────────────── */'),
  'Footer styles belong in the shared component stylesheet, not the tool-page stylesheet.');

const serviceWorker = readFileSync(join(root, 'sw.js'), 'utf8');
for (const asset of [
  ...sharedStyles,
  'assets/css/pages/home.css',
  'assets/css/pages/tool.css',
  'assets/css/features/expansion-tools.css',
  'assets/js/core/i18n-expansion.js'
]) {
  assert(serviceWorker.includes(`'${asset}'`), `Service worker does not precache ${asset}.`);
}

const smoke = readFileSync(join(root, 'tests', 'smoke.html'), 'utf8');
assert(!smoke.includes('../style.css'), 'The smoke test still loads the retired stylesheet.');

const qrGenerator = readFileSync(join(root, 'assets/js/tools/qr-generator.js'), 'utf8');
assert(!qrGenerator.includes('alpha-qr.png'), 'QR downloads still use retired Alpha branding.');

const i18nCore = readFileSync(join(root, 'assets/js/core/i18n.js'), 'utf8');
const i18nExpansion = readFileSync(join(root, 'assets/js/core/i18n-expansion.js'), 'utf8');
for (const source of [
  'Generate SHA family digests from any text input using the Web Crypto API.',
  'Type or paste text to hash…',
  'Generate Hashes',
  'Hash Generator Tool'
]) {
  assert(i18nCore.includes(`'${source}'`) || i18nExpansion.includes(`'${source}'`),
    `Turkish i18n is missing the Hash Generator key: ${source}`);
}
assert(i18nExpansion.includes("'Cryptography': 'Kriptografi'"),
  'Turkish i18n is missing the Cryptography category translation.');

console.log(`Site audit passed: ${pages.length} published pages and ${toolPages.length} tools.`);
