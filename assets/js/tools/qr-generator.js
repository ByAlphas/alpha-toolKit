/* TOOLKIT — assets/js/tools/qr-generator.js */
(function initQRGenerator() {
  const modeSelect   = document.getElementById('qrMode');
  const formEl       = document.getElementById('qrForm');
  const sizeSlider   = document.getElementById('qrSize');
  const sizeVal      = document.getElementById('qrSizeVal');
  const marginSlider = document.getElementById('qrMargin');
  const marginVal    = document.getElementById('qrMarginVal');
  const colorDark    = document.getElementById('qrColorDark');
  const colorLight   = document.getElementById('qrColorLight');
  const eccSelect    = document.getElementById('qrECC');
  const genBtn       = document.getElementById('qrGenBtn');
  const clearQRBtn   = document.getElementById('qrClearBtn');
  const output       = document.getElementById('qrOutput');
  const canvasWrap   = document.getElementById('qrCanvasWrap');
  const placeholder  = document.getElementById('qrPlaceholder');
  const actions      = document.getElementById('qrActions');
  const downloadBtn  = document.getElementById('qrDownloadBtn');
  const copyImgBtn   = document.getElementById('qrCopyImgBtn');
  if (!modeSelect) return;

  // Dynamic form templates
  const FORMS = {
    text:  `<div class="qr-form-group"><label for="qrText" class="control-label">Text Content</label><textarea id="qrText" class="textarea" rows="4" placeholder="Enter any text…"></textarea></div>`,
    url:   `<div class="qr-form-group"><label for="qrURL" class="control-label">URL</label><input id="qrURL" class="input-field" type="url" placeholder="https://example.com" /></div>`,
    email: `<div class="qr-form-group"><label for="qrEmail" class="control-label">Email Address</label><input id="qrEmail" class="input-field" type="email" placeholder="hello@example.com" /></div>
            <div class="qr-form-group"><label for="qrEmailSub" class="control-label">Subject (optional)</label><input id="qrEmailSub" class="input-field" placeholder="Hello from Toolkit" /></div>
            <div class="qr-form-group"><label for="qrEmailBody" class="control-label">Body (optional)</label><textarea id="qrEmailBody" class="textarea" rows="3" placeholder="Message body…"></textarea></div>`,
    phone: `<div class="qr-form-group"><label for="qrPhone" class="control-label">Phone Number</label><input id="qrPhone" class="input-field" type="tel" placeholder="+1234567890" /></div>`,
    sms:   `<div class="qr-form-group"><label for="qrSMSPhone" class="control-label">Phone Number</label><input id="qrSMSPhone" class="input-field" type="tel" placeholder="+1234567890" /></div>
            <div class="qr-form-group"><label for="qrSMSMsg" class="control-label">Message</label><textarea id="qrSMSMsg" class="textarea" rows="3" placeholder="Your message…"></textarea></div>`,
    wifi:  `<div class="qr-form-group"><label for="qrWifiSSID" class="control-label">Network Name (SSID)</label><input id="qrWifiSSID" class="input-field" placeholder="MyNetwork" /></div>
            <div class="qr-form-group"><label for="qrWifiPass" class="control-label">Password</label><input id="qrWifiPass" class="input-field" type="password" placeholder="Password" /></div>
            <div class="qr-form-group"><label for="qrWifiSec" class="control-label">Security</label><select id="qrWifiSec" class="select-field"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Open (No Password)</option></select></div>
            <div class="qr-form-group"><label class="checkbox-card" for="qrWifiHidden" style="display:inline-flex;"><input type="checkbox" id="qrWifiHidden"><span class="checkbox-indicator"></span><span class="checkbox-text">Hidden network</span></label></div>`,
  };

  function buildContent() {
    const mode = modeSelect.value;
    switch (mode) {
      case 'text':  return document.getElementById('qrText')?.value.trim() || '';
      case 'url':   return document.getElementById('qrURL')?.value.trim() || '';
      case 'email': {
        const e = document.getElementById('qrEmail')?.value.trim();
        const s = encodeURIComponent(document.getElementById('qrEmailSub')?.value.trim() || '');
        const b = encodeURIComponent(document.getElementById('qrEmailBody')?.value.trim() || '');
        return `mailto:${e}?subject=${s}&body=${b}`;
      }
      case 'phone': return `tel:${document.getElementById('qrPhone')?.value.trim()}`;
      case 'sms':   {
        const p = document.getElementById('qrSMSPhone')?.value.trim();
        const m = encodeURIComponent(document.getElementById('qrSMSMsg')?.value.trim() || '');
        return `sms:${p}?body=${m}`;
      }
      case 'wifi': {
        const ssid = document.getElementById('qrWifiSSID')?.value.trim();
        const pass = document.getElementById('qrWifiPass')?.value;
        const sec  = document.getElementById('qrWifiSec')?.value || 'WPA';
        const hidden = document.getElementById('qrWifiHidden')?.checked ? 'true' : 'false';
        return `WIFI:T:${sec};S:${ssid};P:${pass};H:${hidden};;`;
      }
      default: return '';
    }
  }

  modeSelect.addEventListener('change', () => {
    formEl.innerHTML = FORMS[modeSelect.value] || '';
  });
  formEl.innerHTML = FORMS['text'];

  sizeSlider.addEventListener('input', () => { sizeVal.textContent = sizeSlider.value + 'px'; });
  marginSlider.addEventListener('input', () => { marginVal.textContent = marginSlider.value; });

  let qrInstance = null;

  genBtn.addEventListener('click', () => {
    const content = buildContent();
    if (!content) { showToast('Please fill in the required fields', 'error'); return; }

    output.innerHTML = '';
    canvasWrap?.classList.remove('qr-canvas-wrap--ready');
    placeholder.style.display = 'none';

    const size    = parseInt(sizeSlider.value, 10);
    const margin  = parseInt(marginSlider.value, 10);
    const eccMap  = { L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M, Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H };
    const ecc     = eccMap[eccSelect.value] || QRCode.CorrectLevel.M;

    try {
      if (typeof QRCode === 'undefined') { showToast('QR library not loaded yet — please try again', 'error'); return; }
      qrInstance = new QRCode(output, {
        text: content,
        width: size,
        height: size,
        colorDark: colorDark.value,
        colorLight: colorLight.value,
        correctLevel: ecc,
      });
      canvasWrap?.classList.add('qr-canvas-wrap--ready');
      actions.hidden = false;
      showToast('QR code generated!', 'success');
    } catch (e) {
      showToast('Failed to generate QR: ' + e.message, 'error');
      placeholder.style.display = '';
      canvasWrap?.classList.remove('qr-canvas-wrap--ready');
    }
  });

  clearQRBtn.addEventListener('click', () => {
    output.innerHTML = '';
    canvasWrap?.classList.remove('qr-canvas-wrap--ready');
    placeholder.style.display = '';
    actions.hidden = true;
    modeSelect.value = 'text';
    formEl.innerHTML = FORMS['text'];
    showToast('Cleared', 'success');
  });

  downloadBtn.addEventListener('click', () => {
    const canvas = output.querySelector('canvas');
    const img    = output.querySelector('img');
    const src    = canvas ? canvas.toDataURL('image/png') : img?.src;
    if (!src) { showToast('No QR code to download', 'error'); return; }
    const a = document.createElement('a');
    a.download = 'toolkit-qr.png';
    a.href = src;
    a.click();
    showToast('Downloaded!', 'success');
  });

  copyImgBtn.addEventListener('click', async () => {
    const canvas = output.querySelector('canvas');
    if (!canvas) { showToast('No QR code to copy', 'error'); return; }
    try {
      canvas.toBlob(async (blob) => {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        showToast('Image copied!', 'success');
      });
    } catch (e) {
      showToast('Copy not supported in this browser', 'error');
    }
  });
})();
