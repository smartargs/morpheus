// Settings View
import { api } from '../../shared/services/api.js';
import { settingsApi } from './settings-api.js';
import { state } from '../../state.js';
import { esc } from '../../shared/utils/helpers.js';
import { setTheme } from '../../shared/services/theme.js';
import { Button } from '../../shared/components/button.js';
import { Input, TextArea } from '../../shared/components/input.js';
import { ToolItem, initToolItem } from './components/tool-item.js';

export async function renderSettings() {
  const app = document.getElementById('app');
  
  try {
    const data = await api.getSettings(state.activeSessionId);
    Object.assign(state.settings, data);
  } catch { /* use defaults */ }

  app.innerHTML = `
    <div class="p-8 pb-12 max-w-[1000px] w-full mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-bold tracking-tight mb-1">Settings</h1>
        <p class="text-[14px] text-slate-500 dark:text-text-secondary">Configure agent behavior, appearance, and network.</p>
      </div>

      <div class="space-y-8">
        <div class="settings-section">
          <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-2.5">Theme Mode</label>
          <div class="inline-flex bg-slate-100 dark:bg-bg-input p-1 rounded-xl border border-slate-200 dark:border-border" id="theme-toggle">
            ${ThemeToggleOption('light', '☀️ Light', state.settings.theme)}
            ${ThemeToggleOption('dark', '🌙 Dark', state.settings.theme)}
          </div>
        </div>

        <div class="settings-section">
          <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-2.5">Agent Mode</label>
          <div class="inline-flex bg-slate-100 dark:bg-bg-input p-1 rounded-xl border border-slate-200 dark:border-border" id="mode-toggle">
            ${ModeToggleOption('supervised', '🔒 Supervised', state.settings.mode)}
            ${ModeToggleOption('autonomous', '🤖 Autonomous', state.settings.mode)}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div class="settings-section">
            <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-2.5">Mainnet Branding</label>
            <div class="flex items-center gap-3 p-1.5 bg-slate-100 dark:bg-bg-input rounded-xl border border-slate-200 dark:border-border">
              <input type="color" id="mainnet-color" value="${state.settings.mainnetColor || '#ef4444'}" class="w-10 h-8 rounded-lg bg-transparent border-none cursor-pointer">
              <span class="text-[13px] font-mono text-slate-500 dark:text-text-secondary uppercase">${state.settings.mainnetColor || '#ef4444'}</span>
            </div>
          </div>

          <div class="settings-section">
            <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-2.5">Testnet Branding</label>
            <div class="flex items-center gap-3 p-1.5 bg-slate-100 dark:bg-bg-input rounded-xl border border-slate-200 dark:border-border">
              <input type="color" id="testnet-color" value="${state.settings.testnetColor || '#00e599'}" class="w-10 h-8 rounded-lg bg-transparent border-none cursor-pointer">
              <span class="text-[13px] font-mono text-slate-500 dark:text-text-secondary uppercase">${state.settings.testnetColor || '#00e599'}</span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-2.5">System Instructions</label>
          ${TextArea({
            id: 'system-instructions',
            value: esc(state.settings.systemInstructions || ''),
            placeholder: 'e.g. You are Morpheus, a helpful AI guide for Neo N3...',
            className: 'min-h-[120px]'
          })}
        </div>

        <div class="settings-section">
          <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-2.5">Ollama Endpoint</label>
          <p class="text-[13px] text-slate-500 dark:text-text-secondary mb-3">Connect to a local Ollama instance to use open-source models privately.</p>
          <div class="flex items-center gap-3">
            <div class="flex-1">
              ${Input({
                id: 'ollama-endpoint',
                value: esc(state.settings.ollamaEndpoint || 'http://localhost:11434'),
                placeholder: 'http://localhost:11434'
              })}
            </div>
            <button id="test-ollama-btn" class="px-4 py-2.5 text-[12px] font-medium rounded-xl border border-slate-200 dark:border-border text-slate-600 dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-bg-card-hover transition-colors whitespace-nowrap">
              Test Connection
            </button>
          </div>
          <p id="ollama-status" class="text-[12px] mt-2 hidden"></p>
        </div>

        ${Button({ id: 'save-settings-btn', label: 'Save Settings', className: 'min-w-[150px] justify-center' })}

        <div class="pt-8 border-t border-slate-200 dark:border-border">
          <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-1">Available Capabilities</label>
          <p class="text-[13px] text-slate-500 dark:text-text-secondary mb-4">Functional modules that Morpheus can use to interact with the Neo N3 blockchain and various web services.</p>
          <div id="tools-list" class="space-y-2">
            <p class="text-[13px] text-slate-400 dark:text-text-muted">Loading tools...</p>
          </div>
        </div>
      </div>
    </div>`;

  initSettingsListeners();
  await loadMcpTools();
}

function ThemeToggleOption(value, label, current) {
  const active = value === current;
  const classes = active ? 'bg-white dark:bg-neo-green shadow-sm text-slate-900 dark:text-black font-semibold' : 'text-slate-500 dark:text-text-secondary';
  return `<button class="px-5 py-2 text-[13px] font-medium rounded-lg transition-all toggle-option ${classes}" data-theme="${value}">${label}</button>`;
}

function ModeToggleOption(value, label, current) {
  const active = value === current;
  const classes = active ? 'bg-white dark:bg-neo-green shadow-sm text-slate-900 dark:text-black font-semibold' : 'text-slate-500 dark:text-text-secondary';
  return `<button class="px-5 py-2 text-[13px] font-medium rounded-lg transition-all toggle-option ${classes}" data-mode="${value}">${label}</button>`;
}

function initSettingsListeners() {
  document.querySelectorAll('#theme-toggle .toggle-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      setTheme(btn.dataset.theme);
      api.updateSettings({ ...state.settings, theme: btn.dataset.theme }).catch(() => {});
    });
  });

  // Ollama test connection
  document.getElementById('test-ollama-btn')?.addEventListener('click', async () => {
    const endpoint = document.getElementById('ollama-endpoint')?.value || 'http://localhost:11434';
    const statusEl = document.getElementById('ollama-status');
    if (!statusEl) return;

    statusEl.textContent = 'Connecting...';
    statusEl.className = 'text-[12px] mt-2 text-slate-400 dark:text-text-muted';
    statusEl.classList.remove('hidden');

    try {
      const res = await fetch(`/api/ollama/models?endpoint=${encodeURIComponent(endpoint)}`);
      const models = await res.json();
      if (models.length > 0) {
        statusEl.textContent = `Connected — ${models.length} model${models.length > 1 ? 's' : ''} available`;
        statusEl.className = 'text-[12px] mt-2 text-emerald-600 dark:text-neo-green';
      } else {
        statusEl.textContent = 'Connected but no models found. Pull a model with: ollama pull llama3.1:8b';
        statusEl.className = 'text-[12px] mt-2 text-amber-500';
      }
    } catch {
      statusEl.textContent = 'Could not connect to Ollama. Is it running?';
      statusEl.className = 'text-[12px] mt-2 text-red-500';
    }
  });

  const handleSave = async () => {
    const inst = document.getElementById('system-instructions');
    if (inst) state.settings.systemInstructions = inst.value;

    const mainColor = document.getElementById('mainnet-color');
    const testColor = document.getElementById('testnet-color');
    if (mainColor) state.settings.mainnetColor = mainColor.value;
    if (testColor) state.settings.testnetColor = testColor.value;

    const ollamaEndpoint = document.getElementById('ollama-endpoint');
    if (ollamaEndpoint) state.settings.ollamaEndpoint = ollamaEndpoint.value;
    
    const btn = document.getElementById('save-settings-btn');
    if (!btn) return;
    const originalText = btn.innerHTML;
    btn.textContent = 'Saving...';
    try {
      await api.updateSettings(state.settings, state.activeSessionId);
      
      // Update all sessions in local state to ensure sidebar syncs immediately
      state.sessions.forEach(session => {
        if (!session.settings) session.settings = {};
        session.settings.mainnetColor = state.settings.mainnetColor;
        session.settings.testnetColor = state.settings.testnetColor;
      });

      // Re-render sidebar to apply changes
      import('../../main.js').then(m => m.renderGlobalSessionList());

      btn.textContent = '✓ Saved';
      setTimeout(() => (btn.innerHTML = originalText), 1500);
    } catch {
      btn.textContent = 'Error';
      setTimeout(() => (btn.innerHTML = originalText), 1500);
    }
  };

  document.querySelectorAll('#mode-toggle .toggle-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mode-toggle .toggle-option').forEach((b) => {
        b.classList.remove('bg-white', 'dark:bg-neo-green', 'shadow-sm', 'text-slate-900', 'dark:text-black', 'font-semibold');
        b.classList.add('text-slate-500', 'dark:text-text-secondary');
      });
      btn.classList.add('bg-white', 'dark:bg-neo-green', 'shadow-sm', 'text-slate-900', 'dark:text-black', 'font-semibold');
      btn.classList.remove('text-slate-500', 'dark:text-text-secondary');
      state.settings.mode = btn.dataset.mode;
    });
  });


  const updateHexLabel = (inputEl) => {
    const label = inputEl.nextElementSibling;
    if (label) label.textContent = inputEl.value;
  };

  document.getElementById('mainnet-color')?.addEventListener('input', (e) => updateHexLabel(e.target));
  document.getElementById('testnet-color')?.addEventListener('input', (e) => updateHexLabel(e.target));

  document.getElementById('save-settings-btn')?.addEventListener('click', handleSave);
}

async function loadMcpTools() {
  const container = document.getElementById('tools-list');
  if (!container) return;

  try {
    const tools = await settingsApi.getTools();
    if (!tools.length) {
      container.innerHTML = '<p class="text-[13px] text-slate-400 dark:text-text-muted">No tools available — MCP server may not be connected.</p>';
      return;
    }

    const rpcTools = tools.filter(t => t.name?.startsWith('rpc_'));
    const otherTools = tools.filter(t => !t.name?.startsWith('rpc_'));

    container.innerHTML = '';
    if (otherTools.length) container.appendChild(buildToolGroup('Capabilities', otherTools, true));
    if (rpcTools.length) container.appendChild(buildToolGroup('RPC Methods', rpcTools, false));
  } catch {
    container.innerHTML = '<p class="text-[13px] text-red-400">Could not load tools.</p>';
  }
}

function buildToolGroup(title, tools, expanded) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tool-group border border-slate-200 dark:border-border rounded-xl overflow-hidden bg-white dark:bg-bg-card';
  wrapper.innerHTML = `
    <div class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-bg-card-hover transition-colors tool-group-header">
      <div class="flex items-center gap-2">
        <span class="text-[13px] font-bold uppercase tracking-wider text-slate-700 dark:text-text-primary">${esc(title)}</span>
        <span class="text-[11px] font-mono text-slate-400 dark:text-text-muted">${tools.length}</span>
      </div>
      <span class="text-slate-400 dark:text-text-muted text-[11px] transition-transform tool-group-chevron">▼</span>
    </div>
    <div class="tool-group-body px-3 pb-3 space-y-2 ${expanded ? '' : 'hidden'}"></div>
  `;

  const body = wrapper.querySelector('.tool-group-body');
  tools.forEach(t => {
    const temp = document.createElement('div');
    temp.innerHTML = ToolItem({ tool: t });
    const el = temp.firstElementChild;
    initToolItem(el);
    body.appendChild(el);
  });

  const header = wrapper.querySelector('.tool-group-header');
  const chevron = wrapper.querySelector('.tool-group-chevron');
  if (expanded) chevron.style.transform = 'rotate(180deg)';
  header.addEventListener('click', () => {
    const isHidden = body.classList.toggle('hidden');
    chevron.style.transform = isHidden ? '' : 'rotate(180deg)';
  });

  return wrapper;
}
