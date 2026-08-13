/* TOOLKIT — assets/js/tools/lorem-ipsum.js */
(function initLoremIpsum() {
  const countSlider = document.getElementById('loremCount');
  const countVal    = document.getElementById('loremCountVal');
  const genBtn      = document.getElementById('loremGenBtn');
  const clearBtn    = document.getElementById('loremClearBtn');
  const copyBtn     = document.getElementById('loremCopyBtn');
  const output      = document.getElementById('loremOutput');
  if (!countSlider) return;

  const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nulla facilisi mauris eu iaculis felis pellentesque lectus nisl at bibendum augue ultrices erat'.split(' ');

  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function word() { return WORDS[Math.floor(Math.random() * WORDS.length)]; }
  function sentence() {
    const len = rnd(8, 18);
    const words = Array.from({length: len}, () => word());
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return words.join(' ') + '.';
  }
  function paragraph() {
    return Array.from({length: rnd(4, 8)}, sentence).join(' ');
  }

  countSlider.addEventListener('input', () => { countVal.textContent = countSlider.value; });

  genBtn.addEventListener('click', () => {
    const n    = parseInt(countSlider.value, 10);
    const type = document.querySelector('input[name="loremType"]:checked')?.value || 'words';
    let text = '';
    if (type === 'words')      text = Array.from({length: n}, word).join(' ') + '.';
    if (type === 'sentences')  text = Array.from({length: n}, sentence).join(' ');
    if (type === 'paragraphs') text = Array.from({length: n}, paragraph).join('\n\n');
    output.textContent = text;
  });

  clearBtn.addEventListener('click', () => { output.textContent = ''; });
  copyBtn.addEventListener('click', () => copyToClipboard(output.textContent, 'Lorem ipsum text'));
})();
