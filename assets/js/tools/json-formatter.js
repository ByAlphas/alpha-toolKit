/* TOOLKIT — assets/js/tools/json-formatter.js */
(function initJSONFormatter() {
  const input     = document.getElementById('jsonInput');
  const output    = document.getElementById('jsonOutput');
  const errorEl   = document.getElementById('jsonError');
  const statusEl  = document.getElementById('jsonStatus');
  const beatifyBtn = document.getElementById('jsonBeautifyBtn');
  const minifyBtn = document.getElementById('jsonMinifyBtn');
  const validateBtn = document.getElementById('jsonValidateBtn');
  const copyBtn   = document.getElementById('jsonCopyBtn');
  const clearBtn  = document.getElementById('jsonClearBtn');
  if (!input) return;

  function clearState() {
    errorEl.hidden = true; errorEl.textContent = '';
    statusEl.hidden = true; statusEl.textContent = '';
    statusEl.className = 'status-badge';
  }

  function parseJSON() {
    const raw = input.value.trim();
    if (!raw) { showToast('Please enter JSON to process', 'error'); return null; }
    try { return JSON.parse(raw); } catch (e) {
      clearState();
      const msg = e.message.replace(/^JSON\.parse: /, '').replace(/^Unexpected token /, 'Unexpected token: ');
      errorEl.textContent = msg;
      errorEl.hidden = false;
      statusEl.textContent = '✕ Invalid JSON';
      statusEl.className = 'status-badge status-badge--invalid';
      statusEl.hidden = false;
      output.value = '';
      return null;
    }
  }

  function showValid(text) {
    clearState();
    output.value = text;
    statusEl.textContent = '✓ Valid JSON';
    statusEl.className = 'status-badge status-badge--valid';
    statusEl.hidden = false;
  }

  beatifyBtn.addEventListener('click', () => {
    const parsed = parseJSON(); if (!parsed) return;
    showValid(JSON.stringify(parsed, null, 2));
  });

  minifyBtn.addEventListener('click', () => {
    const parsed = parseJSON(); if (!parsed) return;
    showValid(JSON.stringify(parsed));
  });

  validateBtn.addEventListener('click', () => {
    const parsed = parseJSON(); if (!parsed) return;
    showValid(output.value || JSON.stringify(parsed, null, 2));
    showToast('JSON is valid ✓', 'success');
  });

  copyBtn.addEventListener('click', () => copyToClipboard(output.value, 'JSON'));
  clearBtn.addEventListener('click', () => { input.value = ''; output.value = ''; clearState(); });

  input.addEventListener('keydown', e => { if ((e.ctrlKey||e.metaKey) && e.key==='Enter') { beatifyBtn.click(); e.preventDefault(); } });
})();
