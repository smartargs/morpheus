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
            ${ThemeToggleOption('system', '💻 System', state.settings.theme)}
          </div>
        </div>

        <div class="settings-section">
          <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-2.5">Agent Mode</label>
          <div class="inline-flex bg-slate-100 dark:bg-bg-input p-1 rounded-xl border border-slate-200 dark:border-border" id="mode-toggle">
            ${ModeToggleOption('supervised', '🔒 Supervised', state.settings.mode)}
            ${ModeToggleOption('autonomous', '🤖 Autonomous', state.settings.mode)}
          </div>
        </div>

        <div class="settings-section">
          <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-2.5">Network</label>
          <select class="bg-slate-100 dark:bg-bg-input border border-slate-200 dark:border-border-light rounded-xl px-4 py-2.5 text-slate-900 dark:text-text-primary outline-none cursor-pointer focus:ring-2 focus:ring-neo-green/20 focus:border-neo-green min-w-[200px] text-[14px]" id="network-select">
            <option value="testnet" ${state.settings.network === 'testnet' ? 'selected' : ''}>Testnet</option>
            <option value="mainnet" ${state.settings.network === 'mainnet' ? 'selected' : ''}>Mainnet</option>
          </select>
        </div>

        <div class="settings-section">
          <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-2.5">System Instructions</label>
          ${TextArea({
            id: 'system-instructions',
            value: esc(state.settings.systemInstructions || ''),
            placeholder: 'e.g. You are a helpful Neo N3 assistant focused on DeFi...',
            className: 'min-h-[120px]'
          })}
        </div>

        ${Button({ id: 'save-settings-btn', label: 'Save Settings', className: 'min-w-[150px] justify-center' })}

        <div class="pt-8 border-t border-slate-200 dark:border-border">
          <label class="block text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-secondary mb-1">Available MCP Tools</label>
          <p class="text-[13px] text-slate-500 dark:text-text-secondary mb-4">Tools the agent can invoke via the Neo N3 MCP server.</p>
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
    
    const btn = document.getElementById('save-settings-btn');
    if (!btn) return;
    const originalText = btn.innerHTML;
    btn.textContent = 'Saving...';
    try {
      await api.updateSettings(state.settings, state.activeSessionId);
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

  document.getElementById('network-select')?.addEventListener('change', (e) => {
    state.settings.network = e.target.value;
    const badge = document.getElementById('network-label');
    if (badge) badge.textContent = state.settings.network === 'mainnet' ? 'Mainnet' : 'Testnet';
  });

  document.getElementById('save-settings-btn')?.addEventListener('click', handleSave);

  const badge = document.getElementById('network-label');
  if (badge) badge.textContent = state.settings.network === 'mainnet' ? 'Mainnet' : 'Testnet';
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
