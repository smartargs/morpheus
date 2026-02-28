// Activity/Tool Card Component
import { esc } from '../../../shared/utils/helpers.js';

export function ActivityCard({ event }) {
  const statusIcon = event.critical ? '🔐' : '🔧';
  const args = typeof event.toolArgs === 'string' ? event.toolArgs : JSON.stringify(event.toolArgs, null, 2);
  const toolName = event.toolName || 'Tool Call';
  
  return `
    <div class="activity-card block w-full max-w-[720px] bg-white dark:bg-bg-card border border-slate-200 dark:border-border border-l-4 border-l-neo-green rounded-xl overflow-visible mb-4 shadow-sm animate-fade-slide" data-event-id="${event.id}" style="min-width: 120px;">
      <div class="flex items-center justify-between px-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-bg-card-hover transition-colors activity-header rounded-t-xl overflow-hidden" style="min-height: 52px; height: 52px;">
        <div class="flex items-center gap-3.5 min-w-0 h-full">
          <span class="text-xl flex-none leading-none flex items-center justify-center">${statusIcon}</span>
          <div class="flex flex-col justify-center min-w-0 overflow-hidden h-full">
            <span class="text-[11px] font-bold text-neo-green uppercase tracking-widest leading-tight truncate mb-0.5">${esc(toolName)}</span>
            <span class="text-[12px] text-slate-500 dark:text-text-secondary leading-tight activity-status italic">Executing...</span>
          </div>
        </div>
        <div class="flex items-center justify-center flex-none w-8 h-8 opacity-40">
           <span class="text-[10px] transition-transform activity-chevron">▼</span>
        </div>
      </div>
      <div class="hidden px-5 pb-4 font-mono text-[11px] leading-relaxed text-slate-500 dark:text-text-secondary whitespace-pre-wrap break-all border-t border-slate-100 dark:border-border/50 pt-3 activity-body">${esc(args)}</div>
    </div>`;
}

// Helper to attach listeners to ActivityCard
export function initActivityCard(el) {
  const header = el.querySelector('.activity-header');
  if (!header) return;
  
  header.addEventListener('click', () => {
    const body = el.querySelector('.activity-body');
    const chevron = el.querySelector('.activity-chevron');
    if (!body) return;
    
    const isHidden = body.classList.contains('hidden');
    body.classList.toggle('hidden', !isHidden);
    if (chevron) {
      chevron.style.transform = isHidden ? 'rotate(180deg)' : '';
    }
  });
}
