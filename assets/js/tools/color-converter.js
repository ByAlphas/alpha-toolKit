/* TOOLKIT — assets/js/tools/color-converter.js */
(function initColorConverter() {
  const swatch  = document.getElementById('colorSwatch');
  const picker  = document.getElementById('colorPicker');
  const hexIn   = document.getElementById('colorHex');
  const rgbOut  = document.getElementById('colorRGB');
  const hslOut  = document.getElementById('colorHSL');
  const copyHex = document.getElementById('copyHex');
  const copyRGB = document.getElementById('copyRGB');
  const copyHSL = document.getElementById('copyHSL');
  if (!swatch) return;

  function hexToRGB(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    const n = parseInt(hex, 16);
    return isNaN(n) ? null : { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHSL(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max+min)/2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g-b)/d + (g<b?6:0)) / 6; break;
        case g: h = ((b-r)/d + 2) / 6; break;
        case b: h = ((r-g)/d + 4) / 6; break;
      }
    }
    return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
  }

  function update(hex) {
    const rgb = hexToRGB(hex);
    if (!rgb) return;
    const { r, g, b } = rgb;
    const hsl = rgbToHSL(r, g, b);
    swatch.style.background = hex;
    picker.value = hex;
    rgbOut.value = `rgb(${r}, ${g}, ${b})`;
    hslOut.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  }

  update('#6366f1');

  hexIn.addEventListener('input', () => {
    const v = hexIn.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) update(v);
  });

  picker.addEventListener('input', () => {
    hexIn.value = picker.value;
    update(picker.value);
  });

  copyHex.addEventListener('click', () => copyToClipboard(hexIn.value, 'HEX'));
  copyRGB.addEventListener('click', () => copyToClipboard(rgbOut.value, 'RGB'));
  copyHSL.addEventListener('click', () => copyToClipboard(hslOut.value, 'HSL'));
})();
