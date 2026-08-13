/* TOOLKIT — assets/js/tools/password.js */
(function initPasswordGenerator() {
  const CHARS = {
    upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower:   'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
  };
  const AMBIGUOUS = /[0Ol1I|]/g;

  const lengthSlider   = document.getElementById('pwdLength');
  const lengthVal      = document.getElementById('pwdLengthVal');
  const optUpper       = document.getElementById('optUpper');
  const optLower       = document.getElementById('optLower');
  const optNumbers     = document.getElementById('optNumbers');
  const optSymbols     = document.getElementById('optSymbols');
  const optAmbiguous   = document.getElementById('optAmbiguous');
  const genBtn         = document.getElementById('pwdGenBtn');
  const output         = document.getElementById('pwdOutput');
  const copyBtn        = document.getElementById('pwdCopyBtn');
  const strengthLabel  = document.getElementById('strengthLabel');
  const bars           = [1, 2, 3, 4].map(i => document.getElementById(`sb${i}`));

  if (!lengthSlider) return;

  function updateLengthSlider() {
    const pct = ((lengthSlider.value - lengthSlider.min) / (lengthSlider.max - lengthSlider.min)) * 100;
    lengthSlider.style.setProperty('--val', pct + '%');
    lengthVal.textContent = lengthSlider.value;
  }

  lengthSlider.addEventListener('input', updateLengthSlider);
  updateLengthSlider();

  function buildCharset() {
    let charset = '';
    if (optUpper.checked)   charset += CHARS.upper;
    if (optLower.checked)   charset += CHARS.lower;
    if (optNumbers.checked) charset += CHARS.numbers;
    if (optSymbols.checked) charset += CHARS.symbols;

    if (optAmbiguous.checked) {
      charset = charset.replace(AMBIGUOUS, '');
    }
    return charset;
  }

  function generatePassword() {
    const charset = buildCharset();
    if (!charset.length) {
      showToast('Select at least one character type', 'error');
      return;
    }

    const length = parseInt(lengthSlider.value, 10);
    let password = '';

    // Guarantee one character from each selected type
    const required = [];
    if (optUpper.checked)   required.push(getChar(CHARS.upper));
    if (optLower.checked)   required.push(getChar(CHARS.lower));
    if (optNumbers.checked) required.push(getChar(CHARS.numbers));
    if (optSymbols.checked) required.push(getChar(CHARS.symbols));

    function getChar(pool) {
      let p = optAmbiguous.checked ? pool.replace(AMBIGUOUS, '') : pool;
      if (!p.length) p = pool;
      return p[secureRandInt(p.length)];
    }

    for (let i = 0; i < length; i++) {
      password += charset[secureRandInt(charset.length)];
    }

    // Replace first N chars with required chars so all types are present
    const pwdArr = password.split('');
    required.forEach((ch, i) => {
      // Splice into a random position
      const pos = secureRandInt(length);
      pwdArr[pos] = ch;
    });

    password = pwdArr.join('');
    output.textContent = password;
    updateStrength(password, charset.length);
  }

  function updateStrength(pwd, charsetSize) {
    const len     = pwd.length;
    const entropy = len * Math.log2(charsetSize || 2);

    let level, label, cls;
    if      (entropy < 40)  { level = 0; label = 'Weak';   cls = 's-weak'; }
    else if (entropy < 70)  { level = 1; label = 'Fair';   cls = 's-fair'; }
    else if (entropy < 100) { level = 2; label = 'Good';   cls = 's-good'; }
    else                    { level = 3; label = 'Strong';  cls = 's-strong'; }

    bars.forEach((bar, i) => {
      bar.className = 'strength-bar';
      if (i <= level) bar.classList.add(`active-${level}`);
    });

    strengthLabel.className = `strength-label ${cls}`;
    strengthLabel.textContent = label;
  }

  genBtn.addEventListener('click', generatePassword);
  copyBtn.addEventListener('click', () => copyToClipboard(output.textContent, 'Password'));

  // Generate on page load
  generatePassword();
})();
