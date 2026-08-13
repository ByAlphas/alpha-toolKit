/* TOOLKIT — assets/js/tools/markdown.js */
(function initMarkdown() {
  const editor   = document.getElementById('mdInput');
  const preview  = document.getElementById('mdPreview');
  const copyBtn  = document.getElementById('mdCopyBtn');
  const clearBtn = document.getElementById('mdClearBtn');
  if (!editor) return;

  // Lightweight safe Markdown → HTML parser
  function parseMarkdown(md) {
    let html = md
      // Escape HTML in raw text (will undo for code blocks below)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Tables (basic)
    html = html.replace(/^(\|.+\|)\n(\|[\s:-]+\|)\n((?:\|.+\|\n?)+)/gm, (_, head, sep, body) => {
      const th = head.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map(r =>
        '<tr>' + r.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('') + '</tr>'
      ).join('');
      return `<table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    // Fenced code blocks
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`);

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // HR
    html = html.replace(/^([-*_]){3,}\s*$/gm, '<hr>');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Bold & italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const safe = url.replace(/javascript:/gi, '');
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;">');

    // Unordered lists (simple single-level)
    html = html.replace(/^[\*\-\+] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`);

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Paragraphs
    html = html.replace(/\n\n(?!<[a-z])/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs and wrapping artifacts
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>(<[ht][1-6r]|<ul|<ol|<block|<hr|<table)/g, '$1');
    html = html.replace(/(<\/[ht][1-6r]>|<\/ul>|<\/ol>|<\/blockquote>|<hr>|<\/table>)<\/p>/g, '$1');

    return html;
  }

  function render() {
    preview.innerHTML = parseMarkdown(editor.value);
  }

  // Default content
  editor.value = `# Welcome to Toolkit

Write **Markdown** here and see the live preview in real time.

## Features
- Live rendering
- **Bold**, *italic*, ~~strikethrough~~
- \`inline code\` and code blocks
- Blockquotes, tables, links and more

> Rendering is fully client-side. Nothing leaves your browser.

\`\`\`js
// Example code block
const msg = "Hello, Toolkit!";
console.log(msg);
\`\`\`

| Tool | Category |
| ---- | -------- |
| JSON Formatter | Dev Tools |
| UUID Generator | Generators |
`;

  render();
  editor.addEventListener('input', render);
  copyBtn.addEventListener('click', () => copyToClipboard(editor.value, 'Markdown'));
  clearBtn.addEventListener('click', () => { editor.value = ''; render(); });
})();
