/* rot13.js — Toolkit */
(function initRot13() {
  'use strict';

  var inputEl  = document.getElementById('rot13Input');
  var outputEl = document.getElementById('rot13Output');
  var applyBtn = document.getElementById('rot13ApplyBtn');
  var swapBtn  = document.getElementById('rot13SwapBtn');
  var clearBtn = document.getElementById('rot13ClearBtn');
  var copyBtn  = document.getElementById('rot13CopyBtn');

  if (!inputEl) return;

  // ─── ROT13 algorithm ───────────────────────────────────────────────────────
  function rot13(str) {
    return str.replace(/[a-zA-Z]/g, function(c) {
      var base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
  }

  // ─── Live update ───────────────────────────────────────────────────────────
  inputEl.addEventListener('input', function() {
    outputEl.value = rot13(inputEl.value);
  });

  applyBtn.addEventListener('click', function() {
    var val = inputEl.value;
    if (!val) { showToast('Input is empty.', 'error'); return; }
    outputEl.value = rot13(val);
    showToast('ROT13 applied!', 'success');
  });

  // ─── Swap input / output ───────────────────────────────────────────────────
  swapBtn.addEventListener('click', function() {
    var tmp        = inputEl.value;
    inputEl.value  = outputEl.value;
    outputEl.value = rot13(inputEl.value);
    if (!inputEl.value) outputEl.value = tmp;
  });

  clearBtn.addEventListener('click', function() {
    inputEl.value  = '';
    outputEl.value = '';
    inputEl.focus();
  });

  copyBtn.addEventListener('click', function() {
    if (!outputEl.value) { showToast('Nothing to copy.', 'error'); return; }
    copyToClipboard(outputEl.value, 'ROT13 output');
  });
})();
