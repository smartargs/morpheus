// History View
import { historyApi } from './history-api.js';
import { esc } from '../../shared/utils/helpers.js';
import { state } from '../../state.js';
import { Input } from '../../shared/components/input.js';
import { EmptyState } from '../../shared/components/empty-state.js';
import { Badge } from '../../shared/components/badge.js';

export async function renderHistory() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="p-8 pb-12 max-w-[1000px] w-full mx-auto h-full flex flex-col">
      <div class="mb-6">
        <h1 class="text-2xl font-bold tracking-tight mb-1">History</h1>
        <p class="text-[14px] text-slate-500 dark:text-text-secondary">Full event log from all sessions.</p>
      </div>
      ${Input({
        id: 'history-search',
        placeholder: 'Filter events...',
        className: 'mb-5'
      })}
      <div class="flex-1 overflow-y-auto space-y-2.5" id="history-timeline">
        ${EmptyState({
          icon: '📜',
          title: 'No events yet',
          message: 'Start a chat to generate events.'
        })}
      </div>
    </div>`;

  const search = document.getElementById('history-search');
  search?.addEventListener('input', () => filterHistory(search.value));

  await loadHistory();
}

async function loadHistory() {
  const timeline = document.getElementById('history-timeline');
  if (!timeline) return;

  try {
    const events = await historyApi.getHistory();

    if (!events.length) {
      timeline.innerHTML = EmptyState({
        icon: '📜',
        title: 'No events yet',
        message: 'Start a chat to generate events.'
      });
      return;
    }

    state.historyEvents = events;
    renderTimeline(events);
  } catch {
    timeline.innerHTML = '<p style="color:var(--text-muted)">Could not load history.</p>';
  }
}

function renderTimeline(events) {
  const timeline = document.getElementById('history-timeline');
  if (!timeline) return;

  timeline.innerHTML = events
    .map(
      (ev) => {
        let badgeVariant = 'default';
        if (ev.type === 'error') badgeVariant = 'error';
        if (ev.type.includes('tool')) badgeVariant = 'success';

        return `
          <div class="group p-4 bg-white dark:bg-bg-card border border-slate-200 dark:border-border rounded-xl flex flex-col sm:flex-row gap-4 transition-all hover:border-neo-green/30 hover:shadow-lg hover:shadow-neo-green/5 animate-fade-slide">
            <div class="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-1.5 min-w-[100px]">
              <span class="text-[11px] font-bold text-slate-400 dark:text-text-muted uppercase tracking-wider">${new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              ${Badge({ label: ev.type.replace('_', ' '), variant: badgeVariant })}
            </div>
            <div class="flex-1 text-[13.5px] text-slate-700 dark:text-text-primary leading-relaxed break-all font-medium">${esc(ev.content || ev.toolName || ev.result || ev.error || '')}</div>
          </div>`;
      }
    )
    .join('');
}

function filterHistory(query) {
  const events = state.historyEvents || [];
  if (!query) return renderTimeline(events);
  const q = query.toLowerCase();
  const filtered = events.filter(
    (ev) =>
      ev.type.toLowerCase().includes(q) ||
      (ev.content || '').toLowerCase().includes(q) ||
      (ev.toolName || '').toLowerCase().includes(q) ||
      (ev.result || '').toLowerCase().includes(q)
  );
  renderTimeline(filtered);
}
