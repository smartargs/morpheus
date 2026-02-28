// Tool Item Component for Settings
import { esc } from '../../../shared/utils/helpers.js';

export function ToolItem({ tool }) {
  const params = tool.inputSchema?.properties
    ? Object.entries(tool.inputSchema.properties)
        .map(([key, val]) => {
          const required = (tool.inputSchema.required || []).includes(key);
          return `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-bg-input border ${required ? 'border-neo-green/30 text-slate-800 dark:text-text-primary' : 'border-slate-200 dark:border-border text-slate-500 dark:text-text-muted'} font-mono text-[11px] font-medium transition-colors hover:border-neo-green/50">
              ${esc(key)}
              <span class="text-[9px] opacity-60 font-sans">${esc(val.type || '')}</span>
            </span>`;
        })
        .join('')
    : '<span class="text-[11px] text-slate-400 dark:text-text-muted italic">No parameters</span>';

  return `
    <div class="bg-white dark:bg-bg-card border border-slate-200 dark:border-border rounded-xl overflow-hidden transition-all hover:border-slate-300 dark:hover:border-border-light tool-item">
      <div class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-bg-card-hover transition-colors tool-header">
        <div class="font-mono text-[13px] font-bold text-neo-green-readable">${esc(tool.name)}</div>
        <span class="text-slate-400 dark:text-text-muted text-[11px] transition-transform activity-chevron">▼</span>
      </div>
      <div class="hidden px-4 pb-4 animate-fade-slide tool-body">
        <p class="text-[13.5px] text-slate-600 dark:text-text-secondary leading-relaxed mb-4">${esc(tool.description || 'No description')}</p>
        <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-muted mb-2.5">Input Parameters</div>
        <div class="flex flex-wrap gap-2">${params}</div>
      </div>
    </div>
  `;
}

export function initToolItem(el) {
  const header = el.querySelector('.tool-header');
  if (!header) return;
  
  header.addEventListener('click', () => {
    const body = el.querySelector('.tool-body');
    const chevron = el.querySelector('.activity-chevron');
    const isExpanded = el.classList.contains('expanded');
    
    el.classList.toggle('expanded');
    body.classList.toggle('hidden', isExpanded);
    chevron.style.transform = !isExpanded ? 'rotate(180deg)' : '';
  });
}
