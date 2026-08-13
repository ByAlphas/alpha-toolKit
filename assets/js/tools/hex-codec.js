/* hex-codec.js — Toolkit */
(function initHexCodec() {
  'use strict';

  var inputEl   = document.getElementById('hexInput');
  var outputEl  = document.getElementById('hexOutput');
  var spacesChk = document.getElementById('hexSpaces');
  var encodeBtn = document.getElementById('hexEncodeBtn');
  var decodeBtn = document.getElementById('hexDecodeBtn');
  var clearBtn  = document.getElementById('hexClearBtn');
  var copyBtn   = document.getElementById('hexCopyBtn');

  if (!inputEl) return;

  // ─── Encode ────────────────────────────────────────────────────────────────
  function textToHex(str) {
    var sep  = spacesChk.checked ? ' ' : '';
    var hex  = [];
    for (var i = 0; i < str.length; i++) {
      hex.push(str.charCodeAt(i).toString(16).padStart(2, '0'));
    }
    return hex.join(sep);
  }

  // ─── Decode ────────────────────────────────────────────────────────────────
  function hexToText(hex) {
    hex = hex.replace(/\s+/g, '');
    if (hex.length % 2 !== 0) throw new Error('Hex string length must be even.');
    if (!/^[0-9a-fA-F]+$/.test(hex)) throw new Error('Invalid hex characters found.');
    var chars = [];
    for (var i = 0; i < hex.length; i += 2) {
      chars.push(String.fromCharCode(parseInt(hex.substr(i, 2), 16)));
    }
    return chars.join('');
  }

  // ─── Events ────────────────────────────────────────────────────────────────
  encodeBtn.addEventListener('click', function() {
    var val = inputEl.value;
    if (!val) { showToast('Input is empty.', 'error'); return; }
    outputEl.value = textToHex(val);
    showToast('Encoded to hex!', 'success');
  });

  decodeBtn.addEventListener('click', function() {
    var val = inputEl.value.trim();
    if (!val) { showToast('Input is empty.', 'error'); return; }
    try {
      outputEl.value = hexToText(val);
      showToast('Decoded from hex!', 'success');
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
    copyToClipboard(outputEl.value, 'Hex output');
  });
})();
