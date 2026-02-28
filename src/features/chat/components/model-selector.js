import { state } from '../../../state.js';
import { api } from '../../../shared/services/api.js';

export const CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', icon: '🌐' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', icon: '🧠' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', icon: '⚡' },
];

export function ModelSelector() {
  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
  const currentModelId = activeSession?.settings?.model || CLAUDE_MODELS[0].id;
  const currentModel = CLAUDE_MODELS.find(m => m.id === currentModelId) || CLAUDE_MODELS[0];

  return `
    <div class="model-selector relative inline-block text-left" id="model-selector-container">
      <button type="button" class="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-medium text-slate-500 dark:text-text-muted hover:bg-slate-200/50 dark:hover:bg-border/30 transition-all active:scale-95 whitespace-nowrap" id="model-selector-btn">
        <span class="text-base leading-none translate-y-[-1px] opacity-90" id="current-model-icon">${currentModel.icon}</span>
        <span class="tracking-tight" id="current-model-name">${currentModel.name}</span>
        <svg class="w-3.5 h-3.5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      
      <div class="hidden absolute bottom-full left-0 mb-2 min-w-[180px] bg-white dark:bg-bg-card border border-slate-200 dark:border-border rounded-xl shadow-xl z-[100] overflow-hidden" id="model-selector-dropdown">
        <div class="py-1" id="model-list-container">
          <!-- Will be rendered dynamically -->
        </div>
      </div>
    </div>
  `;
}

export function initModelSelector() {
  const btn = document.getElementById('model-selector-btn');
  const dropdown = document.getElementById('model-selector-dropdown');
  const listContainer = document.getElementById('model-list-container');
  
  if (!btn || !dropdown || !listContainer) return;

  function renderModelList() {
    const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
    const currentModelId = activeSession?.settings?.model || CLAUDE_MODELS[0].id;

    listContainer.innerHTML = CLAUDE_MODELS.map(model => {
      const isSelected = currentModelId === model.id;
      return `
        <button class="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 dark:hover:bg-bg-card-hover flex items-center justify-between group transition-colors whitespace-nowrap gap-4 ${isSelected ? 'text-neo-green-readable font-semibold bg-neo-green/5' : 'text-slate-600 dark:text-text-secondary'}" data-model-id="${model.id}">
          <div class="flex items-center gap-2.5">
            <span class="text-base">${model.icon}</span>
            <span>${model.name}</span>
          </div>
          ${isSelected ? '<span class="text-[10px]">●</span>' : ''}
        </button>
      `;
    }).join('');

    // Re-attach listeners to dropdown buttons
    listContainer.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const modelId = button.getAttribute('data-model-id');
        const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
        
        if (activeSession) {
          if (!activeSession.settings) activeSession.settings = {};
          
          activeSession.settings.model = modelId;
          
          const label = button.querySelector('span:not(.text-base)').textContent;
          const icon = button.querySelector('.text-base').textContent;
          
          const labelEl = document.getElementById('current-model-name');
          const iconEl = document.getElementById('current-model-icon');
          if (labelEl) labelEl.textContent = label;
          if (iconEl) iconEl.textContent = icon;
          
          // Refresh list to update selection markers
          renderModelList();

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

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpening = dropdown.classList.contains('hidden');
    if (isOpening) {
      // Close other dropdowns
      document.getElementById('network-dropdown')?.classList.add('hidden');
      const walletDropdown = document.getElementById('wallet-selector-dropdown');
      if (walletDropdown) {
        walletDropdown.classList.replace('opacity-100', 'opacity-0');
        walletDropdown.classList.replace('scale-100', 'scale-95');
        walletDropdown.classList.add('pointer-events-none');
      }
      
      renderModelList();
    }
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });
}
