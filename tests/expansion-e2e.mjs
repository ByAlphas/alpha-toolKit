#!/usr/bin/env node
/*
 * Browser-level contract tests for the 22 locally implemented expansion tools.
 * Uses Firefox WebDriver BiDi directly, so no npm dependency or external
 * service is required. Run with: node tests/expansion-e2e.mjs
 */

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expansionTools = [
  'aes-gcm', 'rsa-keypair', 'pem-jwk', 'certificate-inspector', 'totp',
  'csp-generator', 'curl-builder', 'http-header-analyzer', 'cron-assistant',
  'unix-permissions', 'css-specificity', 'css-clamp', 'json-to-typescript',
  'json-to-markdown', 'xml-to-json', 'csv-viewer', 'unicode-inspector',
  'time-zone-converter', 'date-duration', 'image-compressor',
  'sitemap-generator', 'color-contrast'
];

const mimeTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.xml': 'application/xml; charset=utf-8'
};

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function unusedPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).on('error', reject));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function startServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', 'http://127.0.0.1');
      // This suite exercises tool UI. Use a no-op worker here so a long
      // precache installation cannot race the isolated test server; offline
      // manifest coverage is asserted separately by site-audit.mjs.
      if (url.pathname === '/sw.js') {
        response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end("self.addEventListener('install', () => self.skipWaiting()); self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));");
        return;
      }
      const pathname = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
      const target = resolve(root, `.${pathname}`);
      if (target !== root && !target.startsWith(`${root}${sep}`)) throw new Error('Forbidden');
      const file = await readFile(target);
      await stat(target);
      response.writeHead(200, {
        'Content-Type': mimeTypes[extname(target)] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      response.end(file);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).on('error', reject));
  return server;
}

class BidiClient {
  constructor(socket) {
    this.socket = socket;
    this.sequence = 0;
    this.pending = new Map();
    this.events = [];
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) { this.events.push(message); return; }
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      clearTimeout(request.timeout);
      if (message.error) request.reject(new Error(`${message.error}: ${message.message || ''}`));
      else request.resolve(message.result);
    });
  }

  call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for WebDriver BiDi: ${method}`));
      }, 30_000);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() { this.socket.close(); }
}

async function connectBidi(port) {
  let lastError;
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const socket = new WebSocket(`ws://127.0.0.1:${port}/session`);
      await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', reject, { once: true });
      });
      return new BidiClient(socket);
    } catch (error) {
      lastError = error;
      await sleep(100);
    }
  }
  throw lastError || new Error('Firefox did not expose WebDriver BiDi.');
}

async function evaluate(bidi, context, source) {
  const response = await bidi.call('script.evaluate', {
    expression: `Promise.resolve(${source}).then((value) => JSON.stringify(value))`,
    target: { context },
    awaitPromise: true,
    resultOwnership: 'none'
  });
  if (response.type !== 'success') throw new Error(`Browser evaluation failed: ${JSON.stringify(response)}`);
  if (response.result.type !== 'string') throw new Error(`Expected JSON result, received ${JSON.stringify(response.result)}`);
  return JSON.parse(response.result.value);
}

async function navigate(bidi, context, baseUrl, slug) {
  await bidi.call('browsingContext.navigate', {
    context,
    url: `${baseUrl}/tools/${slug}.html`,
    wait: 'complete'
  });
  return evaluate(bidi, context, `(() => {
    const footer = document.querySelector('.footer');
    const requiredStyles = ['core.css', 'components.css', 'compatibility.css', 'tool.css', 'expansion-tools.css'];
    return {
      title: document.title,
      app: Boolean(document.querySelector('#toolApp')),
      controls: document.querySelectorAll('#toolApp button, #toolApp input, #toolApp textarea, #toolApp select').length,
      footer: Boolean(footer?.querySelector('.footer-inner') && footer.querySelector('.footer-social') && footer.querySelector('.footer-bottom')),
      footerStyled: footer ? Number.parseFloat(getComputedStyle(footer).paddingTop) > 0 : false,
      styles: requiredStyles.every((name) => [...document.styleSheets].some((sheet) => sheet.href?.endsWith(name))),
      overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      languageReady: Boolean(window.ToolkitI18n && document.querySelector('.nav-language'))
    };
  })()`);
}

async function runTool(bidi, context, baseUrl, slug, body) {
  const page = await navigate(bidi, context, baseUrl, slug);
  assert.equal(page.app, true, `${slug}: the application root did not render.`);
  assert(page.controls > 0, `${slug}: no interactive controls rendered.`);
  assert.equal(page.footer, true, `${slug}: the complete shared footer is missing.`);
  assert.equal(page.footerStyled, true, `${slug}: footer CSS did not apply.`);
  assert.equal(page.styles, true, `${slug}: a required stylesheet did not load.`);
  assert.equal(page.overflow, true, `${slug}: desktop page has horizontal overflow.`);
  assert.equal(page.languageReady, true, `${slug}: language control did not initialise.`);

  const result = await evaluate(bidi, context, `(async () => {
    const wait = (milliseconds = 0) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const expect = (condition, message) => { if (!condition) throw new Error(message); };
    ${body}
  })()`);
  assert.equal(result.ok, true, `${slug}: ${result.message || 'functional assertion failed.'}`);

  const i18n = await evaluate(bidi, context, `(() => {
    window.ToolkitI18n.setLanguage('tr');
    const translated = document.documentElement.lang === 'tr' && document.querySelector('.footer-tagline')?.textContent.includes('tarayıcınızda');
    window.ToolkitI18n.setLanguage('en');
    return { ok: translated && document.documentElement.lang === 'en', message: 'Turkish language switch or English restore failed.' };
  })()`);
  assert.equal(i18n.ok, true, `${slug}: ${i18n.message}`);
}

const tests = {
  'aes-gcm': `
    const text = document.querySelector('#aesText');
    document.querySelector('#aesPass').value = 'correct horse battery staple';
    text.value = 'Toolkit round-trip ✓';
    document.querySelector('#aesEncrypt').click();
    for (let i = 0; i < 100 && !document.querySelector('#aesOutput').value; i++) await wait(50);
    const payload = document.querySelector('#aesOutput').value;
    expect(JSON.parse(payload).alg === 'AES-256-GCM', 'Encryption did not create an AES-GCM payload.');
    text.value = payload;
    document.querySelector('#aesDecrypt').click();
    for (let i = 0; i < 100 && document.querySelector('#aesOutput').value !== 'Toolkit round-trip ✓'; i++) await wait(50);
    return { ok: document.querySelector('#aesOutput').value === 'Toolkit round-trip ✓', message: 'AES decrypt did not restore the plaintext.' };`,
  'rsa-keypair': `
    document.querySelector('#rsaGenerate').click();
    for (let i = 0; i < 300 && !document.querySelector('#rsaPrivate').value; i++) await wait(50);
    const publicKey = document.querySelector('#rsaPublic').value;
    const privateKey = document.querySelector('#rsaPrivate').value;
    return { ok: publicKey.includes('BEGIN PUBLIC KEY') && privateKey.includes('BEGIN PRIVATE KEY'), message: 'RSA PEM export is incomplete.' };`,
  'pem-jwk': `
    const pair = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
    const source = JSON.stringify(await crypto.subtle.exportKey('jwk', pair.publicKey));
    document.querySelector('#pemInput').value = source;
    document.querySelector('#pemConvert').click();
    for (let i = 0; i < 100 && !document.querySelector('#pemOutput').value; i++) await wait(25);
    const pem = document.querySelector('#pemOutput').value;
    document.querySelector('#pemInput').value = pem;
    document.querySelector('#pemConvert').click();
    for (let i = 0; i < 100 && !document.querySelector('#pemOutput').value.startsWith('{'); i++) await wait(25);
    const converted = JSON.parse(document.querySelector('#pemOutput').value);
    return { ok: Boolean(pem.includes('BEGIN PUBLIC KEY') && converted.kty === 'RSA' && converted.n), message: 'PEM/JWK public-key round trip failed.' };`,
  'certificate-inspector': `
    document.querySelector('#certInput').value = '-----BEGIN CERTIFICATE-----\\nMAMCAQE=\\n-----END CERTIFICATE-----';
    document.querySelector('#certInspect').click();
    const output = document.querySelector('#certOutput').value;
    return { ok: output.includes('Certificate size: 5 bytes') && output.includes('SEQUENCE') && output.includes('INTEGER'), message: 'DER report was not generated.' };`,
  'totp': `
    document.querySelector('#totpSecret').value = 'JBSWY3DPEHPK3PXP';
    document.querySelector('#totpGenerate').click();
    for (let i = 0; i < 40 && !/^\\d{6}$/.test(document.querySelector('#totpCode').textContent); i++) await wait(25);
    return { ok: /^\\d{6}$/.test(document.querySelector('#totpCode').textContent) && /Refreshes in/.test(document.querySelector('#totpCountdown').textContent), message: 'TOTP code or countdown did not render.' };`,
  'csp-generator': `
    document.querySelector('#cspDirectives').value = "default-src 'self'\\nimg-src https: data:";
    document.querySelector('#cspBuild').click();
    return { ok: document.querySelector('#cspOutput').value === "Content-Security-Policy: default-src 'self'; img-src https: data:", message: 'CSP header output is incorrect.' };`,
  'curl-builder': `
    document.querySelector('#curlMethod').value = 'POST';
    document.querySelector('#curlUrl').value = 'https://api.example.test/items';
    document.querySelector('#curlHeaders').value = 'Content-Type: application/json';
    document.querySelector('#curlBody').value = '{"name":"Ada"}';
    document.querySelector('#curlBuild').click();
    const slash = String.fromCharCode(92);
    const expected = ['curl --request POST ' + slash, "  'https://api.example.test/items' " + slash, "  --header 'Content-Type: application/json' " + slash, '  --data ' + String.fromCharCode(39) + '{"name":"Ada"}' + String.fromCharCode(39)].join('\\n');
    return { ok: document.querySelector('#curlOutput').value === expected, message: 'cURL command does not preserve valid shell continuations.' };`,
  'http-header-analyzer': `
    document.querySelector('#headerInput').value = "HTTP/2 200 OK\\nContent-Security-Policy: default-src 'self'\\nStrict-Transport-Security: max-age=31536000";
    document.querySelector('#headerAnalyze').click();
    const text = document.querySelector('#headerResults').textContent;
    return { ok: text.includes('✓ Content-Security-Policy') && text.includes('✓ Strict-Transport-Security') && text.includes('○ X-Content-Type-Options'), message: 'Header presence report is incorrect.' };`,
  'cron-assistant': `
    document.querySelector('#cronInput').value = '0 0 * * 7';
    document.querySelector('#cronRun').click();
    const sundayScheduled = document.querySelectorAll('#cronResult li').length === 5;
    document.querySelector('#cronInput').value = '0 0 13 * 5';
    document.querySelector('#cronRun').click();
    const scheduled = document.querySelectorAll('#cronResult li').length === 5;
    document.querySelector('#cronInput').value = '61 * * * *';
    document.querySelector('#cronRun').click();
    await wait(20);
    const invalidReported = [...document.querySelectorAll('.toast-msg')].some((node) => node.textContent.includes('outside its allowed range'));
    return { ok: sundayScheduled && scheduled && invalidReported, message: 'Cron scheduling semantics or range validation failed.' };`,
  'unix-permissions': `
    const octal = document.querySelector('#permOctal');
    octal.value = '755'; octal.dispatchEvent(new Event('input', { bubbles: true }));
    const first = document.querySelector('#permSymbolic').textContent;
    const boxes = document.querySelectorAll('#permChecks input');
    boxes[7].click();
    return { ok: first === 'rwxr-xr-x' && octal.value === '757' && document.querySelector('#permSymbolic').textContent === 'rwxr-xrwx', message: 'Octal and checkbox permissions are out of sync.' };`,
  'css-specificity': `
    document.querySelector('#specificityInput').value = '#app .card:hover > h2::before';
    document.querySelector('#specificityRun').click();
    return { ok: document.querySelector('#specificityResult').textContent.startsWith('Specificity: 1-2-2'), message: 'Basic selector specificity is incorrect.' };`,
  'css-clamp': `
    document.querySelector('#clampMin').value = '16'; document.querySelector('#clampMax').value = '24';
    document.querySelector('#clampVmin').value = '320'; document.querySelector('#clampVmax').value = '1280';
    document.querySelector('#clampRun').click();
    return { ok: document.querySelector('#clampOutput').value === 'font-size: clamp(16px, calc(0.8333vw + 13.3333px), 24px);', message: 'clamp() calculation is incorrect.' };`,
  'json-to-typescript': `
    document.querySelector('#tsInput').value = '{"user":{"id":1,"active":true}}';
    document.querySelector('#tsRun').click();
    const output = document.querySelector('#tsOutput').value;
    return { ok: output.includes('type Root =') && output.includes('"id": number;') && output.includes('"active": boolean;'), message: 'TypeScript inference is incomplete.' };`,
  'json-to-markdown': `
    document.querySelector('#markdownJsonInput').value = '[{"name":"Ada","note":"a|b"},{"name":"Lin","active":true}]';
    document.querySelector('#markdownJsonRun').click();
    const output = document.querySelector('#markdownJsonOutput').value;
    return { ok: output.includes('| name | note | active |') && output.includes('a\\\\|b') && output.includes('| Lin |  | true |'), message: 'Markdown table conversion or escaping failed.' };`,
  'xml-to-json': `
    document.querySelector('#xmlJsonInput').value = '<person id="1"><name>Ada</name><role>Engineer</role></person>';
    document.querySelector('#xmlJsonRun').click();
    const output = JSON.parse(document.querySelector('#xmlJsonOutput').value);
    return { ok: output.person['@id'] === '1' && output.person.name['#text'] === 'Ada' && output.person.role['#text'] === 'Engineer', message: 'XML structure was not preserved in JSON.' };`,
  'csv-viewer': `
    document.querySelector('#csvViewerInput').value = 'name,note\\nAda,"hello, world"';
    document.querySelector('#csvViewerRun').click();
    const cells = [...document.querySelectorAll('#csvViewerResult td')].map((node) => node.textContent);
    return { ok: cells.join('|') === 'Ada|hello, world', message: 'Quoted CSV cell parsing failed.' };`,
  'unicode-inspector': `
    document.querySelector('#unicodeInput').value = 'e\\u0301👋';
    document.querySelector('#unicodeForm').value = 'NFC';
    document.querySelector('#unicodeRun').click();
    const output = document.querySelector('#unicodeOutput').value;
    return { ok: output.includes('Normalized (NFC): é👋') && output.includes('U+0301') && output.includes('U+1F44B'), message: 'Unicode normalization or code point inspection failed.' };`,
  'time-zone-converter': `
    document.querySelector('#zoneDate').value = '2026-01-15T12:00';
    document.querySelector('#zoneList').value = 'UTC\\nEurope/Istanbul\\nInvalid/Zone';
    document.querySelector('#zoneRun').click();
    const rows = [...document.querySelectorAll('#zoneResult p')].map((node) => node.textContent);
    return { ok: rows.length === 3 && rows[0].startsWith('UTC:') && rows[1].startsWith('Europe/Istanbul:') && rows[2].includes('unsupported time zone'), message: 'Time zone conversion result is incomplete.' };`,
  'date-duration': `
    document.querySelector('#durationStart').value = '2024-01-01';
    document.querySelector('#durationEnd').value = '2024-03-01';
    document.querySelector('#durationRun').click();
    return { ok: document.querySelector('#durationResult').textContent.startsWith('60 days • 8.57 weeks'), message: 'Leap-year date duration is incorrect.' };`,
  'image-compressor': `
    const canvas = document.createElement('canvas'); canvas.width = 20; canvas.height = 10;
    canvas.getContext('2d').fillRect(0, 0, 20, 10);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const transfer = new DataTransfer(); transfer.items.add(new File([blob], 'fixture.png', { type: 'image/png' }));
    const input = document.querySelector('#imageCompressInput'); input.files = transfer.files;
    document.querySelector('#imageMaxWidth').value = '10';
    document.querySelector('#imageFormat').value = 'image/jpeg';
    document.querySelector('#imageCompressRun').click();
    for (let i = 0; i < 100 && !document.querySelector('#imageCompressResult a'); i++) await wait(25);
    const result = document.querySelector('#imageCompressResult');
    return { ok: result.textContent.includes('20×10 → 10×5') && result.querySelector('a')?.download === 'compressed.jpeg', message: 'Local image compression did not produce a resized download.' };`,
  'sitemap-generator': `
    document.querySelector('#sitemapUrls').value = 'https://example.com/\\nhttps://example.com/about?x=1&y=2\\nhttps://example.com/';
    document.querySelector('#sitemapFreq').value = 'daily';
    document.querySelector('#sitemapPriority').value = '1.0';
    document.querySelector('#sitemapRun').click();
    const output = document.querySelector('#sitemapOutput').value;
    return { ok: (output.match(/<url>/g) || []).length === 2 && output.includes('about?x=1&amp;y=2') && output.includes('<changefreq>daily</changefreq>') && output.includes('<priority>1.0</priority>'), message: 'Sitemap output is not deduplicated or XML-safe.' };`,
  'color-contrast': `
    document.querySelector('#contrastForeground').value = '#ffffff';
    document.querySelector('#contrastBackground').value = '#000000';
    document.querySelector('#contrastRun').click();
    const output = document.querySelector('#contrastResult').textContent;
    return { ok: output.includes('Contrast ratio: 21.00:1') && output.includes('Normal text AA: Pass') && output.includes('AAA: Pass'), message: 'WCAG contrast calculation is incorrect.' };`
};

async function main() {
  const server = await startServer();
  const port = server.address().port;
  const browserPort = await unusedPort();
  const profile = await mkdtemp(join(tmpdir(), 'toolkit-e2e-'));
  const browser = spawn(process.env.FIREFOX_BINARY || 'firefox', [
    '--headless', '--remote-debugging-port', String(browserPort), '--profile', profile
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let browserError = '';
  browser.stderr.on('data', (chunk) => { browserError += chunk; });
  let bidi;

  try {
    bidi = await connectBidi(browserPort);
    await bidi.call('session.new', { capabilities: {} });
    await bidi.call('session.subscribe', { events: ['log.entryAdded'] });
    const tab = await bidi.call('browsingContext.create', { type: 'tab' });
    const baseUrl = `http://127.0.0.1:${port}`;
    await bidi.call('browsingContext.setViewport', { context: tab.context, viewport: { width: 1440, height: 900 }, devicePixelRatio: 1 });

    for (const slug of expansionTools) {
      await runTool(bidi, tab.context, baseUrl, slug, tests[slug]);
      process.stdout.write(`✓ ${slug}\n`);
    }

    await bidi.call('browsingContext.setViewport', { context: tab.context, viewport: { width: 390, height: 844 }, devicePixelRatio: 1 });
    for (const slug of expansionTools) {
      const page = await navigate(bidi, tab.context, baseUrl, slug);
      assert.equal(page.overflow, true, `${slug}: mobile page has horizontal overflow.`);
      assert.equal(page.footerStyled, true, `${slug}: mobile footer CSS did not apply.`);
    }

    const browserErrors = bidi.events.filter((event) => event.method === 'log.entryAdded' && event.params?.level === 'error');
    assert.equal(browserErrors.length, 0, `Browser console errors:\n${browserErrors.map((event) => event.params.text || JSON.stringify(event.params)).join('\n')}`);
    console.log(`Expansion E2E passed: ${expansionTools.length} tools across desktop, mobile, i18n and functional flows.`);
  } finally {
    try { await bidi?.call('session.end'); } catch {}
    bidi?.close();
    browser.kill('SIGTERM');
    await new Promise((resolve) => browser.once('exit', resolve));
    await new Promise((resolve) => server.close(resolve));
    await rm(profile, { recursive: true, force: true });
    if (browser.exitCode && !bidi) throw new Error(browserError || 'Firefox could not start.');
  }
}

await main();
