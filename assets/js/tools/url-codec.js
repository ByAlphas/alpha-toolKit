/* TOOLKIT — assets/js/tools/url-codec.js */
(function initURLCodec() {
  const input    = document.getElementById('urlInput');
  const output   = document.getElementById('urlOutput');
  const errorEl  = document.getElementById('urlError');
  const encBtn   = document.getElementById('urlEncodeBtn');
  const decBtn   = document.getElementById('urlDecodeBtn');
  const copyBtn  = document.getElementById('urlCopyBtn');
  const clearBtn = document.getElementById('urlClearBtn');
  if (!input) return;

  function clearErr() { errorEl.hidden = true; errorEl.textContent = ''; }

  encBtn.addEventListener('click', () => {
    clearErr();
    const val = input.value;
    if (!val) { errorEl.textContent = 'Input is empty.'; errorEl.hidden = false; return; }
    try { output.value = encodeURIComponent(val); }
    catch (e) { errorEl.textContent = 'Encoding failed: ' + e.message; errorEl.hidden = false; }
  });

  decBtn.addEventListener('click', () => {
    clearErr();
    const val = input.value.trim();
    if (!val) { errorEl.textContent = 'Input is empty.'; errorEl.hidden = false; return; }
    try { output.value = decodeURIComponent(val); }
    catch (e) { errorEl.textContent = 'Invalid percent-encoded string — ' + e.message; errorEl.hidden = false; output.value = ''; }
  });

  copyBtn.addEventListener('click', () => copyToClipboard(output.value, 'URL'));
  clearBtn.addEventListener('click', () => { input.value = ''; output.value = ''; clearErr(); });
})();
