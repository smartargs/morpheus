import { walletsApi } from '../../wallets/wallets-api.js';
import { state, updateState } from '../../../state.js';

export function WalletSelector() {
  return `
    <div class="relative wallet-selector-container">
      <button 
        id="wallet-selector-btn"
        class="p-3 aspect-square flex items-center justify-center rounded-xl bg-white dark:bg-bg-card border border-slate-200 dark:border-border text-slate-500 hover:text-neo-green transition-all shadow-sm hover:shadow-md"
        title="Select Wallets"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
      </button>
      
      <div 
        id="wallet-selector-dropdown" 
        class="absolute bottom-full left-0 mb-3 w-72 max-h-[400px] overflow-y-auto bg-white dark:bg-bg-sidebar border border-slate-200 dark:border-border rounded-2xl shadow-2xl transition-all scale-95 opacity-0 pointer-events-none z-[100] origin-bottom-left"
      >
        <div class="p-4 border-b border-slate-100 dark:border-border/50">
          <h3 class="text-sm font-bold tracking-tight">Active Wallets</h3>
          <p class="text-[11px] text-slate-400">Select wallets for the agent to use</p>
        </div>
        <div id="wallet-selector-list" class="p-2 space-y-1">
          <!-- Will be rendered from state -->
        </div>
        <div class="p-3 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-border/50 flex justify-between items-center">
          <span id="selected-count" class="text-[10px] font-bold text-neo-green uppercase tracking-wider">0 selected</span>
          <a href="#wallets" class="text-[10px] font-bold text-slate-400 hover:text-neo-green transition-colors uppercase tracking-wider">Manage All →</a>
        </div>
      </div>
    </div>
  `;
}

export async function initWalletSelector() {
  const btn = document.getElementById('wallet-selector-btn');
  const dropdown = document.getElementById('wallet-selector-dropdown');
  
  if (!btn || !dropdown) return;

  const toggleDropdown = async (e) => {
    e.stopPropagation();
    const isOpening = !dropdown.classList.contains('opacity-100');
    
    if (isOpening) {
      // Refresh state from server if empty
      if (state.wallets.length === 0) {
        const wallets = await walletsApi.getWallets();
        updateState({ wallets });
      }
      renderWalletList();
      dropdown.classList.replace('opacity-0', 'opacity-100');
      dropdown.classList.replace('scale-95', 'scale-100');
      dropdown.classList.remove('pointer-events-none');
    } else {
      dropdown.classList.replace('opacity-100', 'opacity-0');
      dropdown.classList.replace('scale-100', 'scale-95');
      dropdown.classList.add('pointer-events-none');
    }
  };

  btn.addEventListener('click', toggleDropdown);

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.replace('opacity-100', 'opacity-0');
      dropdown.classList.replace('scale-100', 'scale-95');
      dropdown.classList.add('pointer-events-none');
    }
  });

  function renderWalletList() {
    const list = document.getElementById('wallet-selector-list');
    const countEl = document.getElementById('selected-count');
    if (!list || !countEl) return;

    const selected = state.wallets.filter(w => w.selected);
    countEl.textContent = `${selected.length} selected`;

    if (state.wallets.length === 0) {
      list.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs italic">No wallets found</div>`;
      return;
    }

    list.innerHTML = state.wallets.map(w => `
      <div class="wallet-item flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-bg-card transition-all group cursor-pointer" data-id="${w.id}">
        <div class="w-8 h-8 rounded-lg ${w.selected ? 'bg-neo-green/10 text-neo-green' : 'bg-slate-100 dark:bg-bg-secondary text-slate-400'} flex items-center justify-center transition-colors group-hover:bg-neo-green/20">
          <span class="text-xs font-bold">${w.label[0].toUpperCase()}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[12px] font-bold truncate ${w.selected ? 'text-neo-green' : 'text-slate-700 dark:text-text-primary'}">${w.label}</div>
          <div class="text-[10px] text-slate-400 truncate">${w.address.slice(0, 6)}...${w.address.slice(-6)}</div>
        </div>
        <div class="w-5 h-5 rounded-md border-2 ${w.selected ? 'bg-neo-green border-neo-green' : 'border-slate-200 dark:border-border'} flex items-center justify-center transition-all group-hover:border-neo-green/50">
          ${w.selected ? '<svg class="w-3 h-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="M20 6L9 17l-5-5"/></svg>' : ''}
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.wallet-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = item.dataset.id;
        
        // Update LOCAL state ONLY (instant UI!)
        const updatedWallets = state.wallets.map(w => {
          if (w.id === id) return { ...w, selected: !w.selected };
          return w;
        });
        
        updateState({ wallets: updatedWallets });
        renderWalletList();
        
        // Optionally: Pulsing to server in background without waiting or blocking
        const selectedIds = updatedWallets.filter(w => w.selected).map(w => w.id);
        walletsApi.updateWalletSelection(selectedIds).catch(err => console.error('[Wallets] Soft failure syncing selection:', err));
      });
    });
  }
}
