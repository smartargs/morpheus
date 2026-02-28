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
      1: 'text-lg font-bold text-neo-green-readable mb-2 mt-1',
      2: 'text-[15px] font-bold text-slate-800 dark:text-text-primary mb-1.5 mt-1',
      3: 'text-[14px] font-bold text-slate-700 dark:text-text-secondary mb-1 mt-0.5',
      4: 'text-[13px] font-bold text-slate-600 dark:text-text-secondary mb-1'
    };
    return `<div class="${styles[level] || styles[4]}">${content}</div>`;
  });

  // 3. Code Blocks: \`\`\`text\`\`\`
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="my-3 p-3.5 rounded-xl bg-slate-900/5 dark:bg-black/20 border border-slate-200/50 dark:border-border/50 text-[12px] font-mono overflow-x-auto leading-relaxed shadow-inner">$1</pre>');

  // 3b. Tables: | col | col | ... rows
  html = html.replace(/((?:^\|.+\|[ ]*$\n?){2,})/gm, (tableBlock) => {
    const rows = tableBlock.trim().split('\n').filter(r => r.trim());
    // Need at least a header + separator + 1 data row, or header + data
    if (rows.length < 2) return tableBlock;
    
    const parseRow = (row) => row.split('|').slice(1, -1).map(c => c.trim());
    
    // Detect separator row (|---|---|)
    const isSeparator = (row) => /^\|[\s\-:|]+\|$/.test(row.trim());
    const sepIndex = rows.findIndex(r => isSeparator(r));
    
    let headerRow, dataRows;
    if (sepIndex === 1) {
      headerRow = parseRow(rows[0]);
      dataRows = rows.slice(2).map(parseRow);
    } else {
      // No separator — treat first row as header
      headerRow = parseRow(rows[0]);
      dataRows = rows.slice(1).filter(r => !isSeparator(r)).map(parseRow);
    }

    const thCells = headerRow.map(h => 
      `<th class="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-neo-green-readable whitespace-nowrap">${h}</th>`
    ).join('');
    
    const bodyRows = dataRows.map((cells, i) => {
      const zebra = i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-white/[0.02]';
      const tds = cells.map(c => 
        `<td class="px-3.5 py-2 text-[13px] text-slate-700 dark:text-text-secondary whitespace-nowrap">${c}</td>`
      ).join('');
      return `<tr class="${zebra}">${tds}</tr>`;
    }).join('');

    return `<div class="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-border"><table class="w-full border-collapse"><thead class="bg-slate-100/80 dark:bg-white/[0.04] border-b border-slate-200 dark:border-border"><tr>${thCells}</tr></thead><tbody class="divide-y divide-slate-100 dark:divide-border/50">${bodyRows}</tbody></table></div>`;
  });

  // 4. Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 5. Italics: *text* or _text_
  html = html.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

  // 6. Inline Code: `text`
  html = html.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[0.85em] font-mono">$1</code>');

  // 7. Bullet Lists: - item
  html = html.replace(/(?:\n|^)\s*-\s+(.*?)(?=(?:\n\s*-\s+)|$|\n\n)/g, (match, content) => {
    return `<div class="flex gap-2.5 mt-1.5 mb-1 ml-1.5">
      <span class="text-neo-green-readable font-bold text-[10px] mt-1 shrink-0">◆</span>
      <span class="flex-1">${content}</span>
    </div>`;
  });

  // 8. Ordered Lists: 1. item
  html = html.replace(/(?:\n|^)\s*(\d+)\.\s+(.*?)(?=(?:\n\s*\d+\.\s+)|$|\n\n)/g, (match, num, content) => {
    return `<div class="flex gap-2.5 mt-1.5 mb-1 ml-1.5">
      <span class="text-neo-green-readable font-bold text-[11px] mt-0.5 shrink-0">${num}.</span>
      <span class="flex-1">${content}</span>
    </div>`;
  });

  // 9. Horizontal Rules: ---
  html = html.replace(/\n---\n/g, '<div class="h-px bg-slate-200 dark:bg-border my-4"></div>');

  // 9b. Auto-link URLs
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,\s])/g;
  html = html.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-neo-green-readable hover:underline break-all">$1</a>');

  // 10. Paragraphs and Line Breaks
  // Replace double newlines with a structured gap
  html = html.replace(/\n\n+/g, '<div class="h-3"></div>');
  
  // Replace remaining single newlines with <br>
  html = html.replace(/\n/g, '<br>');

  // Final cleanup: remove <br> immediately following or preceding modular blocks
  html = html.replace(/<\/div><br>/g, '</div>');
  html = html.replace(/<\/pre><br>/g, '</pre>');
  html = html.replace(/<\/table><br>/g, '</table>');
  html = html.replace(/<br><div/g, '<div');
  html = html.replace(/<br><pre/g, '<pre');
  html = html.replace(/<br><table/g, '<table');

  return html.trim();
}
