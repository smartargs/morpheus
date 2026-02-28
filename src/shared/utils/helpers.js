// Utility helpers

/**
 * Escapes HTML characters to prevent XSS.
 */
export function esc(str) {
  if (str === null || str === undefined) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}
/**
 * Formats a timestamp into a relative "time ago" string.
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Simple markdown parser for chat bubbles.
 */
export function parseMarkdown(text) {
  if (!text) return '';
  
  // 1. Escape HTML to prevent XSS (using our existing esc function)
  let html = esc(text);

  // 2. Headers: ## text
  html = html.replace(/^(#{1,6})\s+(.*)$/gm, (match, hashes, content) => {
    const level = hashes.length;
    const styles = {
      1: 'text-lg font-bold text-neo-green mb-2 mt-1',
      2: 'text-[15px] font-bold text-slate-800 dark:text-text-primary mb-1.5 mt-1',
      3: 'text-[14px] font-bold text-slate-700 dark:text-text-secondary mb-1 mt-0.5',
      4: 'text-[13px] font-bold text-slate-600 dark:text-text-secondary mb-1'
    };
    return `<div class="${styles[level] || styles[4]}">${content}</div>`;
  });

  // 3. Code Blocks: \`\`\`text\`\`\`
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="my-3 p-3.5 rounded-xl bg-slate-900/5 dark:bg-black/20 border border-slate-200/50 dark:border-border/50 text-[12px] font-mono overflow-x-auto leading-relaxed shadow-inner">$1</pre>');

  // 4. Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 5. Italics: *text* or _text_
  html = html.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

  // 6. Inline Code: `text`
  html = html.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[0.85em] font-mono">$1</code>');

  // 7. Bullet Lists: - item
  html = html.replace(/(?:\n|^)\s*-\s+(.*?)(?=(?:\n\s*-\s+)|$|\n\n)/g, (match, content) => {
    return `<div class="flex gap-2.5 mt-1.5 mb-1 ml-1.5">
      <span class="text-neo-green font-bold text-[10px] mt-1 shrink-0">◆</span>
      <span class="flex-1">${content}</span>
    </div>`;
  });

  // 8. Ordered Lists: 1. item
  html = html.replace(/(?:\n|^)\s*(\d+)\.\s+(.*?)(?=(?:\n\s*\d+\.\s+)|$|\n\n)/g, (match, num, content) => {
    return `<div class="flex gap-2.5 mt-1.5 mb-1 ml-1.5">
      <span class="text-neo-green font-bold text-[11px] mt-0.5 shrink-0">${num}.</span>
      <span class="flex-1">${content}</span>
    </div>`;
  });

  // 9. Horizontal Rules: ---
  html = html.replace(/\n---\n/g, '<div class="h-px bg-slate-200 dark:bg-border my-4"></div>');

  // 10. Paragraphs and Line Breaks
  // Replace double newlines with a structured gap
  html = html.replace(/\n\n+/g, '<div class="h-3"></div>');
  
  // Replace remaining single newlines with <br>
  html = html.replace(/\n/g, '<br>');

  // Final cleanup: remove <br> immediately following or preceding modular blocks
  html = html.replace(/<\/div><br>/g, '</div>');
  html = html.replace(/<\/pre><br>/g, '</pre>');
  html = html.replace(/<br><div/g, '<div');
  html = html.replace(/<br><pre/g, '<pre');

  return html.trim();
}
