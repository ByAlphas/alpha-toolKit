/* ascii.js — Toolkit */
(function initAscii() {
  'use strict';

  var inputEl       = document.getElementById('asciiInput');
  var convertBtn    = document.getElementById('asciiConvertBtn');
  var tableWrap     = document.getElementById('asciiTableWrap');
  var tableBody     = document.getElementById('asciiTableBody');
  var codeInputEl   = document.getElementById('asciiCodeInput');
  var baseSelect    = document.getElementById('asciiBaseSelect');
  var reverseBtn    = document.getElementById('asciiReverseBtn');
  var reverseResult = document.getElementById('asciiReverseResult');
  var reverseChar   = document.getElementById('asciiReverseChar');

  if (!inputEl) return;

  var ROW_LIMIT = 500;

  // ─── Text → code point table ───────────────────────────────────────────────
  function renderTable(str) {
    var chars = Array.from(str).slice(0, ROW_LIMIT);
    var rows  = '';

    chars.forEach(function(ch) {
      var code = ch.codePointAt(0);
      var disp = code < 32 ? '<span style="opacity:.45;font-size:.75rem;">U+' + code.toString(16).toUpperCase().padStart(4,'0') + '</span>' : escapeHTML(ch);
      rows += '<tr style="border-bottom:1px solid var(--border,rgba(255,255,255,.06));">'
        + '<td class="font-mono" style="padding:.45rem .75rem;">' + disp + '</td>'
        + '<td class="font-mono" style="padding:.45rem .75rem;">' + code + '</td>'
        + '<td class="font-mono" style="padding:.45rem .75rem;">0x' + code.toString(16).toUpperCase() + '</td>'
        + '<td class="font-mono" style="padding:.45rem .75rem;">0o' + code.toString(8) + '</td>'
        + '<td class="font-mono" style="padding:.45rem .75rem;">' + code.toString(2).padStart(8,'0') + '</td>'
        + '</tr>';
    });

    if (str.length > ROW_LIMIT) {
      rows += '<tr><td colspan="5" style="padding:.5rem .75rem;opacity:.55;font-size:.8rem;">… ' + (str.length - ROW_LIMIT) + ' more characters truncated</td></tr>';
    }

    tableBody.innerHTML = rows;
    tableWrap.style.display = 'block';
  }

  convertBtn.addEventListener('click', function() {
    var val = inputEl.value;
    if (!val) { showToast('Enter some text first.', 'error'); return; }
    renderTable(val);
  });

  inputEl.addEventListener('input', function() {
    if (tableWrap.style.display !== 'none') renderTable(inputEl.value);
  });

  // ─── Code point → character ────────────────────────────────────────────────
  reverseBtn.addEventListener('click', function() {
    var raw  = codeInputEl.value.trim();
    var base = parseInt(baseSelect.value, 10);
    if (!raw) { showToast('Enter a code point value.', 'error'); return; }

    // Strip common prefixes
    var clean = raw.replace(/^0x/i, '').replace(/^0o/i, '').replace(/^0b/i, '');
    var code  = parseInt(clean, base);

    if (isNaN(code) || code < 0) {
      showToast('Invalid code point value.', 'error');
      return;
    }

    try {
      var ch = String.fromCodePoint(code);
      reverseChar.textContent = ch;
      reverseResult.style.display = 'block';
    } catch (e) {
      showToast('Code point out of range.', 'error');
    }
  });

  codeInputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') reverseBtn.click();
  });
})();
