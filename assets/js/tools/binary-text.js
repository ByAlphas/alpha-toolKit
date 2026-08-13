/* binary-text.js — Toolkit */
(function initBinaryText() {
  'use strict';

  var inputEl   = document.getElementById('binInput');
  var outputEl  = document.getElementById('binOutput');
  var spacesChk = document.getElementById('binSpaces');
  var encodeBtn = document.getElementById('binEncodeBtn');
  var decodeBtn = document.getElementById('binDecodeBtn');
  var clearBtn  = document.getElementById('binClearBtn');
  var copyBtn   = document.getElementById('binCopyBtn');

  if (!inputEl) return;

  // ─── Encode ────────────────────────────────────────────────────────────────
  function textToBinary(str) {
    var sep  = spacesChk.checked ? ' ' : '';
    var bins = [];
    for (var i = 0; i < str.length; i++) {
      bins.push(str.charCodeAt(i).toString(2).padStart(8, '0'));
    }
    return bins.join(sep);
  }

  // ─── Decode ────────────────────────────────────────────────────────────────
  function binaryToText(str) {
    var clean = str.replace(/\s+/g, ' ').trim();
    var parts;

    if (clean.indexOf(' ') !== -1) {
      parts = clean.split(' ');
    } else {
      // No spaces: split every 8 chars
      if (clean.length % 8 !== 0) throw new Error('Binary string length must be a multiple of 8 (or use spaces between bytes).');
      parts = clean.match(/.{1,8}/g) || [];
    }

    var chars = [];
    for (var i = 0; i < parts.length; i++) {
      var byte = parts[i];
      if (!/^[01]{8}$/.test(byte)) throw new Error('Invalid binary byte: "' + byte + '"');
      chars.push(String.fromCharCode(parseInt(byte, 2)));
    }
    return chars.join('');
  }

  // ─── Events ────────────────────────────────────────────────────────────────
  encodeBtn.addEventListener('click', function() {
    var val = inputEl.value;
    if (!val) { showToast('Input is empty.', 'error'); return; }
    outputEl.value = textToBinary(val);
    showToast('Encoded to binary!', 'success');
  });

  decodeBtn.addEventListener('click', function() {
    var val = inputEl.value.trim();
    if (!val) { showToast('Input is empty.', 'error'); return; }
    try {
      outputEl.value = binaryToText(val);
      showToast('Decoded from binary!', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  });

  clearBtn.addEventListener('click', function() {
    inputEl.value  = '';
    outputEl.value = '';
  });

  copyBtn.addEventListener('click', function() {
    if (!outputEl.value) { showToast('Nothing to copy.', 'error'); return; }
    copyToClipboard(outputEl.value, 'Binary output');
  });
})();
