(function initMetaTags() {
  'use strict';

  const titleEl    = document.getElementById('metaTitle');
  const descEl     = document.getElementById('metaDesc');
  const kwEl       = document.getElementById('metaKw');
  const authorEl   = document.getElementById('metaAuthor');
  const robotsEl   = document.getElementById('metaRobots');
  const canonEl    = document.getElementById('metaCanon');
  const langEl     = document.getElementById('metaLang');
  const themeEl    = document.getElementById('metaTheme');
  const generatorEl = document.getElementById('metaGenerator');
  const ogTitleEl  = document.getElementById('metaOgTitle');
  const ogDescEl   = document.getElementById('metaOgDesc');
  const ogImageEl  = document.getElementById('metaOgImage');
  const ogTypeEl   = document.getElementById('metaOgType');
  const ogSiteEl   = document.getElementById('metaOgSite');
  const twitterCardEl = document.getElementById('metaTwitterCard');
  const twitterEl  = document.getElementById('metaTwitter');
  const twitterCreatorEl = document.getElementById('metaTwitterCreator');
  const outputEl   = document.getElementById('metaOutput');
  const titleCount = document.getElementById('titleCount');
  const descCount  = document.getElementById('descCount');

  if (!titleEl) return;

  function updateCount(el, countEl, limit) {
    const len = [...el.value].length;
    countEl.textContent = `${len}/${limit}`;
    countEl.style.color = len > limit ? '#f87171' : len >= limit * 0.8 ? '#facc15' : 'rgba(255,255,255,.45)';
  }

  function escapeAttribute(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }

  function absoluteUrl(value, fieldName) {
    if (!value) return '';
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      return url.href;
    } catch {
      throw new Error(`${fieldName} must be an absolute http(s) URL.`);
    }
  }

  function generate() {
    const title    = titleEl.value.trim();
    const desc     = descEl.value.trim();
    const kw       = kwEl.value.trim();
    const author   = authorEl.value.trim();
    const robots   = robotsEl.value;
    const lang     = langEl.value.trim();
    const theme    = themeEl.value;
    const generator = generatorEl.value.trim();
    const ogTitle  = ogTitleEl.value.trim() || title;
    const ogDesc   = ogDescEl.value.trim() || desc;
    const ogType   = ogTypeEl.value;
    const ogSite   = ogSiteEl.value.trim();
    const twitterCard = twitterCardEl.value;
    const twitter  = twitterEl.value.trim();
    const twitterCreator = twitterCreatorEl.value.trim();
    let canon;
    let ogImage;

    try {
      canon = absoluteUrl(canonEl.value.trim(), 'Canonical URL');
      ogImage = absoluteUrl(ogImageEl.value.trim(), 'Open Graph image URL');
    } catch (error) {
      outputEl.value = '';
      if (typeof showToast === 'function') showToast(error.message, 'error');
      return;
    }

    const lines = [
      '<meta charset="UTF-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
    ];
    if (lang) lines.push(`<meta http-equiv="content-language" content="${escapeAttribute(lang)}" />`);
    if (title) lines.push(`<title>${escapeAttribute(title)}</title>`);
    if (desc) lines.push(`<meta name="description" content="${escapeAttribute(desc)}" />`);
    if (kw) lines.push(`<meta name="keywords" content="${escapeAttribute(kw)}" />`);
    if (author) lines.push(`<meta name="author" content="${escapeAttribute(author)}" />`);
    if (robots) lines.push(`<meta name="robots" content="${escapeAttribute(robots)}" />`);
    if (generator) lines.push(`<meta name="generator" content="${escapeAttribute(generator)}" />`);
    if (theme) lines.push(`<meta name="theme-color" content="${escapeAttribute(theme)}" />`);
    if (canon) lines.push(`<link rel="canonical" href="${escapeAttribute(canon)}" />`);
    if (ogTitle || ogDesc || canon || ogImage) {
      if (ogTitle) lines.push(`<meta property="og:title" content="${escapeAttribute(ogTitle)}" />`);
      if (ogDesc) lines.push(`<meta property="og:description" content="${escapeAttribute(ogDesc)}" />`);
      lines.push(`<meta property="og:type" content="${escapeAttribute(ogType)}" />`);
      if (canon) lines.push(`<meta property="og:url" content="${escapeAttribute(canon)}" />`);
      if (ogImage) lines.push(`<meta property="og:image" content="${escapeAttribute(ogImage)}" />`);
      if (ogSite) lines.push(`<meta property="og:site_name" content="${escapeAttribute(ogSite)}" />`);
      lines.push(`<meta name="twitter:card" content="${escapeAttribute(twitterCard)}" />`);
      if (ogTitle) lines.push(`<meta name="twitter:title" content="${escapeAttribute(ogTitle)}" />`);
      if (ogDesc) lines.push(`<meta name="twitter:description" content="${escapeAttribute(ogDesc)}" />`);
      if (ogImage) lines.push(`<meta name="twitter:image" content="${escapeAttribute(ogImage)}" />`);
      if (twitter) lines.push(`<meta name="twitter:site" content="${escapeAttribute(twitter)}" />`);
      if (twitterCreator) lines.push(`<meta name="twitter:creator" content="${escapeAttribute(twitterCreator)}" />`);
    }
    outputEl.value = lines.join('\n');
  }

  titleEl.addEventListener('input', () => { updateCount(titleEl, titleCount, 60); generate(); });
  descEl.addEventListener('input',  () => { updateCount(descEl, descCount, 160); generate(); });
  [kwEl, authorEl, robotsEl, canonEl, langEl, themeEl, generatorEl, ogTitleEl, ogDescEl, ogImageEl, ogTypeEl, ogSiteEl, twitterCardEl, twitterEl, twitterCreatorEl]
    .forEach(el => { el.addEventListener('input', generate); el.addEventListener('change', generate); });

  document.getElementById('copyMetaBtn').addEventListener('click', () => {
    copyToClipboard(outputEl.value, 'Meta tags');
  });

  generate();
})();
