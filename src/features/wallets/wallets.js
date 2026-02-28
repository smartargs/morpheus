import { state, updateState } from '../../state.js';
import { walletsApi } from './wallets-api.js';
import { Button } from '../../shared/components/button.js';
import { Input } from '../../shared/components/input.js';
import { EmptyState } from '../../shared/components/empty-state.js';
import { WalletCard } from './components/wallet-card.js';

export async function renderWallets() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="p-8 pb-12 max-w-[1000px] w-full mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-bold tracking-tight mb-1">Wallets</h1>
        <p class="text-[14px] text-slate-500 dark:text-text-secondary">Manage wallets and select which ones the agent can use.</p>
      </div>
      <div class="flex gap-2.5 mb-6">
        ${Button({ id: 'create-wallet-btn', label: 'Create Wallet', icon: '+ ' })}
        ${Button({ id: 'import-wallet-btn', label: 'Import Wallet', variant: 'secondary' })}
        ${Button({ id: 'refresh-wallets-btn', label: 'Refresh', variant: 'secondary', icon: '↻ ' })}
      </div>
      <div id="import-form-container"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="wallet-grid">
        ${EmptyState({
          id: 'wallet-empty-initial',
          icon: '💳',
          title: 'No wallets yet',
          message: 'Create or import a wallet to get started.'
        })}
      </div>
    </div>`;

  document.getElementById('create-wallet-btn')?.addEventListener('click', handleCreateWallet);
  document.getElementById('import-wallet-btn')?.addEventListener('click', toggleImportForm);
  document.getElementById('refresh-wallets-btn')?.addEventListener('click', () => loadWallets(true));

  await loadWallets();
}

async function handleCreateWallet() {
  const btn = document.getElementById('create-wallet-btn');
  if (!btn) return;
  const originalText = btn.innerHTML;
  btn.textContent = 'Creating...';
  btn.disabled = true;
  try {
    await walletsApi.createWallet(`Wallet ${Date.now().toString(36)}`);
    await loadWallets(true);
  } catch (err) {
    alert('Failed to create wallet: ' + err.message);
  }
  btn.innerHTML = originalText;
  btn.disabled = false;
}

function toggleImportForm() {
  const container = document.getElementById('import-form-container');
  if (!container) return;
  if (container.innerHTML) { container.innerHTML = ''; return; }
  
  container.innerHTML = `
    <div class="mb-6 p-5 bg-slate-50 dark:bg-bg-card border border-slate-200 dark:border-border rounded-xl animate-fade-slide">
      <div class="flex gap-1 mb-4 bg-slate-100 dark:bg-bg-input p-1 rounded-lg inline-flex">
        <button class="import-tab px-4 py-1.5 text-[12px] font-medium rounded-md transition-all bg-white dark:bg-neo-green shadow-sm text-slate-900 dark:text-black" data-tab="manual">Manual</button>
        <button class="import-tab px-4 py-1.5 text-[12px] font-medium rounded-md transition-all text-slate-500 dark:text-text-secondary" data-tab="json">JSON File</button>
      </div>
      
      <div id="import-manual-panel">
        <div class="flex flex-wrap gap-3">
          ${Input({ id: 'import-label', placeholder: 'Label', className: 'flex-1 min-w-[150px]' })}
          ${Input({ id: 'import-address', placeholder: 'Address (N...)', className: 'flex-[2] min-w-[250px]' })}
          ${Input({ id: 'import-wif', placeholder: 'WIF (optional)', type: 'password', className: 'flex-1 min-w-[150px]' })}
          ${Button({ id: 'import-submit-btn', label: 'Import', className: 'px-6' })}
        </div>
      </div>

      <div id="import-json-panel" class="hidden">
        <div class="relative">
          <label for="import-json-file" class="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-slate-300 dark:border-border-light rounded-xl cursor-pointer hover:border-neo-green hover:bg-neo-green/5 transition-all group">
            <svg class="w-8 h-8 text-slate-400 dark:text-text-muted group-hover:text-neo-green transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span class="text-[13px] font-medium text-slate-500 dark:text-text-secondary group-hover:text-neo-green transition-colors">Click to upload a <code class="text-[11px] bg-slate-200 dark:bg-bg-input px-1.5 py-0.5 rounded">.json</code> wallet file</span>
            <span class="text-[11px] text-slate-400 dark:text-text-muted">Supports NEP-6 wallets, arrays, or single wallet objects</span>
          </label>
          <input type="file" id="import-json-file" accept=".json,application/json" class="sr-only" />
        </div>
        <div id="import-json-status" class="mt-3 hidden"></div>
      </div>
    </div>`;
    
  // Tab switching
  container.querySelectorAll('.import-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.import-tab').forEach(t => {
        t.classList.remove('bg-white', 'dark:bg-neo-green', 'shadow-sm', 'text-slate-900', 'dark:text-black');
        t.classList.add('text-slate-500', 'dark:text-text-secondary');
      });
      tab.classList.add('bg-white', 'dark:bg-neo-green', 'shadow-sm', 'text-slate-900', 'dark:text-black');
      tab.classList.remove('text-slate-500', 'dark:text-text-secondary');
      
      const isManual = tab.dataset.tab === 'manual';
      document.getElementById('import-manual-panel').classList.toggle('hidden', !isManual);
      document.getElementById('import-json-panel').classList.toggle('hidden', isManual);
    });
  });

  // Manual import
  document.getElementById('import-submit-btn')?.addEventListener('click', async () => {
    const label = document.getElementById('import-label')?.value || 'Imported';
    const address = document.getElementById('import-address')?.value;
    const wif = document.getElementById('import-wif')?.value;
    if (!address) { alert('Address required'); return; }
    await walletsApi.importWallet(label, address, wif);
    container.innerHTML = '';
    await loadWallets(true);
  });

  // JSON file import
  document.getElementById('import-json-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const status = document.getElementById('import-json-status');
    if (status) {
      status.classList.remove('hidden');
      status.innerHTML = `<div class="flex items-center gap-2 text-[13px] text-slate-500 dark:text-text-secondary"><span class="animate-pulse">◆</span> Reading ${file.name}...</div>`;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = await walletsApi.importJsonWallet(json);
      
      if (status) {
        status.innerHTML = `<div class="flex items-center gap-2 text-[13px] text-neo-green font-medium"><span>✓</span> Imported ${result.imported} wallet${result.imported !== 1 ? 's' : ''} from ${file.name}</div>`;
      }
      
      setTimeout(async () => {
        container.innerHTML = '';
        await loadWallets(true);
      }, 1500);
    } catch (err) {
      if (status) {
        status.innerHTML = `<div class="flex items-center gap-2 text-[13px] text-red-500 font-medium"><span>✕</span> ${err.message}</div>`;
      }
    }
  });
}

async function loadWallets(force = false) {
  const grid = document.getElementById('wallet-grid');
  if (!grid) return;

  try {
    // Only fetch if state is empty or on manual refresh (force)
    if (force || state.wallets.length === 0) {
      const wallets = await walletsApi.getWallets();
      updateState({ wallets });
    }

    if (!state.wallets.length) {
      grid.innerHTML = EmptyState({
        icon: '💳',
        title: 'No wallets yet',
        message: 'Create or import a wallet to get started.',
        className: 'col-span-full'
      });
      return;
    }

    grid.innerHTML = state.wallets
      .map((w) => WalletCard({ wallet: w }))
      .join('');

    grid.querySelectorAll('.agent-select').forEach((cb) => {
      cb.addEventListener('change', async () => {
        const id = cb.dataset.walletId;
        
        // Optimistic state update
        const updatedWallets = state.wallets.map(w => {
           if (w.id === id) return { ...w, selected: cb.checked };
           return w;
        });
        updateState({ wallets: updatedWallets });

        // Sync in background without re-fetching
        const selectedIds = updatedWallets.filter(w => w.selected).map(w => w.id);
        walletsApi.updateWalletSelection(selectedIds).catch(err => console.error('Failed to sync selection:', err));
      });
    });
  } catch {
    grid.innerHTML = '<p style="color:var(--text-muted);padding:20px">Could not load wallets.</p>';
  }
}
