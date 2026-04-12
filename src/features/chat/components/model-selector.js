import { state } from '../../../state.js';
import { api } from '../../../shared/services/api.js';

export const CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', icon: '🌐' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', icon: '🧠' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', icon: '⚡' },
];

let ollamaModels = [];
let ollamaFetchedAt = 0;

async function refreshOllamaModels() {
  // Cache for 10 seconds
  if (Date.now() - ollamaFetchedAt < 10000) return;
  try {
    const models = await api.getOllamaModels();
    ollamaModels = models.map((m) => ({
      id: m.id,
      name: m.name,
      icon: '🦙',
      parameter_size: m.parameter_size,
    }));
    ollamaFetchedAt = Date.now();
  } catch {
    ollamaModels = [];
  }
}

function getAllModels() {
  return [...CLAUDE_MODELS, ...ollamaModels];
}

export function ModelSelector() {
  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
  const currentModelId = activeSession?.settings?.model || CLAUDE_MODELS[0].id;
  const allModels = getAllModels();
  const currentModel = allModels.find(m => m.id === currentModelId) || CLAUDE_MODELS[0];

  return `
    <div class="model-selector relative inline-block text-left" id="model-selector-container">
      <button type="button" class="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-medium text-slate-500 dark:text-text-muted hover:bg-slate-200/50 dark:hover:bg-border/30 transition-all active:scale-95 whitespace-nowrap" id="model-selector-btn">
        <span class="text-base leading-none translate-y-[-1px] opacity-90" id="current-model-icon">${currentModel.icon}</span>
        <span class="tracking-tight" id="current-model-name">${currentModel.name}</span>
        <svg class="w-3.5 h-3.5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      <div class="hidden absolute bottom-full left-0 mb-2 min-w-[220px] bg-white dark:bg-bg-card border border-slate-200 dark:border-border rounded-xl shadow-xl z-[100] overflow-hidden" id="model-selector-dropdown">
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

    let html = '';

    // Claude section
    html += `<div class="px-4 pt-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-text-muted">Claude</div>`;
    html += CLAUDE_MODELS.map(model => modelButton(model, currentModelId)).join('');

    // Ollama section
    html += `<div class="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-text-muted border-t border-slate-100 dark:border-border mt-1">Local (Ollama)</div>`;
    if (ollamaModels.length > 0) {
      html += ollamaModels.map(model => modelButton(model, currentModelId)).join('');
    } else {
      html += `<div class="px-4 py-2 text-[11px] text-slate-400 dark:text-text-muted italic">No models available</div>`;
    }

    listContainer.innerHTML = html;

    // Attach click listeners
    listContainer.querySelectorAll('button[data-model-id]').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const modelId = button.getAttribute('data-model-id');
        const activeSession = state.sessions.find(s => s.id === state.activeSessionId);

        if (activeSession) {
          if (!activeSession.settings) activeSession.settings = {};

          activeSession.settings.model = modelId;

          const label = button.querySelector('.model-name').textContent;
          const icon = button.querySelector('.model-icon').textContent;

          const labelEl = document.getElementById('current-model-name');
          const iconEl = document.getElementById('current-model-icon');
          if (labelEl) labelEl.textContent = label;
          if (iconEl) iconEl.textContent = icon;

          renderModelList();

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

  function modelButton(model, currentModelId) {
    const isSelected = currentModelId === model.id;
    const sizeLabel = model.parameter_size ? ` <span class="text-[10px] text-slate-400 dark:text-text-muted font-normal">${model.parameter_size}</span>` : '';
    return `
      <button class="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 dark:hover:bg-bg-card-hover flex items-center justify-between group transition-colors whitespace-nowrap gap-4 ${isSelected ? 'text-neo-green-readable font-semibold bg-neo-green/5' : 'text-slate-600 dark:text-text-secondary'}" data-model-id="${model.id}">
        <div class="flex items-center gap-2.5">
          <span class="text-base model-icon">${model.icon}</span>
          <span class="model-name">${model.name}</span>${sizeLabel}
        </div>
        ${isSelected ? '<span class="text-[10px]">●</span>' : ''}
      </button>
    `;
  }

  btn.addEventListener('click', async (e) => {
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

      // Fetch Ollama models before rendering
      await refreshOllamaModels();
      renderModelList();
    }
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });
}
