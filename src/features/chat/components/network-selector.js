import { state, updateState } from '../../../state.js';
import { api } from '../../../shared/services/api.js';

export function NetworkSelector() {
  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
  const currentNetwork = activeSession?.settings?.network || state.settings.network || 'testnet';
  const color = currentNetwork === 'mainnet' 
    ? (activeSession?.settings?.mainnetColor || state.settings.mainnetColor || '#ef4444') 
    : (activeSession?.settings?.testnetColor || state.settings.testnetColor || '#00e599');
  
  return `
    <div class="relative group" id="network-selector-container">
      <button id="network-selector-btn" class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-border/30 transition-all text-[12px] font-medium text-slate-500 dark:text-text-muted">
        <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${color}"></span>
        <span class="tracking-tight capitalize">${currentNetwork}</span>
        <svg class="w-3.5 h-3.5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      
      <div id="network-dropdown" class="absolute bottom-full left-0 mb-2 w-36 bg-white dark:bg-bg-card border border-slate-200 dark:border-border rounded-xl shadow-xl hidden z-50 overflow-hidden animate-fade-slide">
        <div class="p-1.5 flex flex-col gap-1">
          <button class="network-option w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-[12px] font-medium ${currentNetwork === 'testnet' ? 'text-neo-green bg-neo-green/5' : 'text-slate-600 dark:text-text-secondary'}" data-value="testnet">
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${activeSession?.settings?.testnetColor || state.settings.testnetColor || '#00e599'}"></span>
            Testnet
          </button>
          <button class="network-option w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-[12px] font-medium ${currentNetwork === 'mainnet' ? 'text-red-500 bg-red-500/5' : 'text-slate-600 dark:text-text-secondary'}" data-value="mainnet">
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${activeSession?.settings?.mainnetColor || state.settings.mainnetColor || '#ef4444'}"></span>
            Mainnet
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initNetworkSelector(onChanged) {
  const btn = document.getElementById('network-selector-btn');
  const dropdown = document.getElementById('network-dropdown');
  const options = document.querySelectorAll('.network-option');

  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpening = dropdown.classList.contains('hidden');
    if (isOpening) {
      // Close other dropdowns
      document.getElementById('model-selector-dropdown')?.classList.add('hidden');
      const walletDropdown = document.getElementById('wallet-selector-dropdown');
      if (walletDropdown) {
        walletDropdown.classList.replace('opacity-100', 'opacity-0');
        walletDropdown.classList.replace('scale-100', 'scale-95');
        walletDropdown.classList.add('pointer-events-none');
      }
    }
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => dropdown.classList.add('hidden'));

  options.forEach(opt => {
    opt.addEventListener('click', async () => {
      const value = opt.dataset.value;
      const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (!activeSession || value === activeSession.settings?.network) return;

      try {
        const newSettings = { ...activeSession.settings, network: value };
        await api.updateSettings(newSettings, state.activeSessionId);
        
        // Update local session state
        activeSession.settings = newSettings;
        
        // Update global settings for sync
        updateState({ settings: { ...state.settings, network: value } });
        
        // Refresh UI
        if (onChanged) onChanged(value);
      } catch (err) {
        console.error('Failed to update network:', err);
      }
    });
  });
}
