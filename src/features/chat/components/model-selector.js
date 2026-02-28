import { state } from '../../../state.js';
import { api } from '../../../shared/services/api.js';

export const CLAUDE_MODELS = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', icon: '⚡' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', icon: '🧠' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', icon: '🏎️' },
];

export function ModelSelector() {
  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
  const currentModelId = activeSession?.settings?.model || CLAUDE_MODELS[0].id;
  const currentModel = CLAUDE_MODELS.find(m => m.id === currentModelId) || CLAUDE_MODELS[0];

  return `
    <div class="model-selector relative inline-block text-left" id="model-selector-container">
      <button type="button" class="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 dark:text-text-muted hover:bg-slate-200/50 dark:hover:bg-border/30 transition-all active:scale-95" id="model-selector-btn">
        <span class="text-base leading-none translate-y-[-1px] opacity-90">${currentModel.icon}</span>
        <span class="tracking-tight">${currentModel.name}</span>
        <svg class="w-3.5 h-3.5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      
      <div class="hidden absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-bg-card border border-slate-200 dark:border-border rounded-xl shadow-xl z-50 overflow-hidden" id="model-selector-dropdown">
        <div class="py-1">
          ${CLAUDE_MODELS.map(model => `
            <button class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-bg-card-hover flex items-center justify-between group transition-colors ${currentModelId === model.id ? 'text-neo-green font-semibold bg-neo-green/5' : 'text-slate-600 dark:text-text-secondary'}" data-model-id="${model.id}">
              <div class="flex items-center gap-2.5">
                <span class="text-base">${model.icon}</span>
                <span>${model.name}</span>
              </div>
              ${currentModelId === model.id ? '<span class="text-[10px]">●</span>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

export function initModelSelector() {
  const btn = document.getElementById('model-selector-btn');
  const dropdown = document.getElementById('model-selector-dropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });

  dropdown.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', async () => {
      const modelId = button.getAttribute('data-model-id');
      const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
      
      if (activeSession) {
        // Optimistic update
        activeSession.settings.model = modelId;
        
        const label = button.querySelector('span:not(.text-base)').textContent;
        const icon = button.querySelector('.text-base').textContent;
        btn.querySelector('span:not(.opacity-70)').textContent = label;
        btn.querySelector('.opacity-70').textContent = icon;
        
        // Persist
        try {
          await api.updateSettings({ ...activeSession.settings, model: modelId }, state.activeSessionId);
        } catch (err) {
          console.error('Failed to update model setting:', err);
        }
      }
      
      dropdown.classList.add('hidden');
    });
  });
}
