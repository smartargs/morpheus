// Settings View
import { api } from '../../shared/services/api.js';
import { settingsApi } from './settings-api.js';
import { state } from '../../state.js';
import { esc } from '../../shared/utils/helpers.js';
import { setTheme } from '../../shared/services/theme.js';
import { Button } from '../../shared/components/button.js';
import { TextArea } from '../../shared/components/input.js';
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

        ${Button({ id: 'save-settings-btn', label: 'Save Settings', className: 'min-w-[150px] justify-center' })}

        <div class="pt-8 border-t border-slate-200 dark:border-border">
          <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-1">Available MCP Tools</label>
          <p class="text-[13px] text-slate-500 dark:text-text-secondary mb-4">Functional modules that Morpheus can use to interact with the Neo N3 blockchain.</p>
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

  const handleSave = async () => {
    const inst = document.getElementById('system-instructions');
    if (inst) state.settings.systemInstructions = inst.value;
    
    const mainColor = document.getElementById('mainnet-color');
    const testColor = document.getElementById('testnet-color');
    if (mainColor) state.settings.mainnetColor = mainColor.value;
    if (testColor) state.settings.testnetColor = testColor.value;
    
    const btn = document.getElementById('save-settings-btn');
    if (!btn) return;
    const originalText = btn.innerHTML;
    btn.textContent = 'Saving...';
    try {
      await api.updateSettings(state.settings, state.activeSessionId);
      
      // Update the session in the local list so sidebar/cues sync
      const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (activeSession) {
        activeSession.settings = { ...state.settings };
      }

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
    
    // Sync to all sessions for live preview
    const isMainnet = inputEl.id === 'mainnet-color';
    if (isMainnet) state.settings.mainnetColor = inputEl.value;
    else state.settings.testnetColor = inputEl.value;

    state.sessions.forEach(session => {
      if (!session.settings) session.settings = {};
      if (isMainnet) session.settings.mainnetColor = inputEl.value;
      else session.settings.testnetColor = inputEl.value;
    });

    // Re-render sidebar to show changes immediately for all chats
    import('../../main.js').then(m => m.renderGlobalSessionList());
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
    
    container.innerHTML = '';
    tools.forEach(t => {
      const temp = document.createElement('div');
      temp.innerHTML = ToolItem({ tool: t });
      const el = temp.firstElementChild;
      initToolItem(el);
      container.appendChild(el);
    });
  } catch {
    container.innerHTML = '<p class="text-[13px] text-red-400">Could not load tools.</p>';
  }
}
