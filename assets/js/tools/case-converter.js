/* TOOLKIT — assets/js/tools/case-converter.js */
(function initCaseConverter() {
  const input    = document.getElementById('caseInput');
  const grid     = document.getElementById('caseGrid');
  if (!input) return;

  const CASES = [
    { label: 'UPPERCASE',    key: 'upper',    fn: t => t.toUpperCase() },
    { label: 'lowercase',    key: 'lower',    fn: t => t.toLowerCase() },
    { label: 'Title Case',   key: 'title',    fn: t => t.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) },
    { label: 'Sentence case',key: 'sentence', fn: t => t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()) },
    { label: 'camelCase',    key: 'camel',    fn: t => t.toLowerCase().replace(/[\s_-]+(\w)/g, (_, c) => c.toUpperCase()) },
    { label: 'PascalCase',   key: 'pascal',   fn: t => t.toLowerCase().replace(/(?:^|\s|_|-)(\w)/g, (_, c) => c.toUpperCase()) },
    { label: 'snake_case',   key: 'snake',    fn: t => t.trim().replace(/[\s-]+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase() },
    { label: 'kebab-case',   key: 'kebab',    fn: t => t.trim().replace(/[\s_]+/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() },
  ];

  function buildGrid(text) {
    grid.innerHTML = '';
    if (!text.trim()) return;
    CASES.forEach(({ label, fn }) => {
      const result = fn(text);
      const card = document.createElement('div');
      card.className = 'case-card';
      card.innerHTML = `
        <div class="case-card-header">
          <span class="case-type-label">${label}</span>
          <button class="icon-btn case-copy-btn" aria-label="Copy ${label}" title="Copy">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
        <div class="case-value">${result}</div>`;
      card.querySelector('.case-copy-btn').addEventListener('click', () => copyToClipboard(result, label));
      grid.appendChild(card);
    });
  }

  input.addEventListener('input', () => buildGrid(input.value));
})();
