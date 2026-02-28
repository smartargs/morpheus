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
    <div class="flex flex-wrap gap-3 mb-6 p-4 bg-slate-50 dark:bg-bg-card border border-slate-200 dark:border-border rounded-xl animate-fade-slide">
      ${Input({ id: 'import-label', placeholder: 'Label', className: 'flex-1 min-w-[150px]' })}
      ${Input({ id: 'import-address', placeholder: 'Address (N...)', className: 'flex-[2] min-w-[250px]' })}
      ${Input({ id: 'import-wif', placeholder: 'WIF (optional)', type: 'password', className: 'flex-1 min-w-[150px]' })}
      ${Button({ id: 'import-submit-btn', label: 'Import', className: 'px-6' })}
    </div>`;
    
  document.getElementById('import-submit-btn')?.addEventListener('click', async () => {
    const label = document.getElementById('import-label')?.value || 'Imported';
    const address = document.getElementById('import-address')?.value;
    const wif = document.getElementById('import-wif')?.value;
    if (!address) { alert('Address required'); return; }
    await walletsApi.importWallet(label, address, wif);
    container.innerHTML = '';
    await loadWallets(true);
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
