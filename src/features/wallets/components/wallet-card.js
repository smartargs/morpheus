// Wallet Card Component
import { esc } from '../../../shared/utils/helpers.js';

function formatBalance(amount, decimals) {
  if (amount === undefined || amount === null) return '—';
  const val = Number(amount) / Math.pow(10, decimals);
  return val.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function renderAssetList(assets) {
  // Defensive filter for non-zero or valid amounts
  const activeAssets = (assets || []).filter(a => a.amount && a.amount !== '0');
  
  if (activeAssets.length === 0) return '<div class="text-[11px] text-text-muted italic px-1">No assets</div>';
  
  return activeAssets.map(a => `
    <div class="flex justify-between items-center py-1 border-b border-border/10 last:border-0 hover:bg-white/[0.02] px-1 rounded transition-colors">
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="text-[11px] font-bold text-text-secondary truncate">${esc(a.symbol || '???')}</span>
      </div>
      <span class="text-[12px] font-mono text-neo-green-readable font-medium">${formatBalance(a.amount, a.decimals || 0)}</span>
    </div>
  `).join('');
}

export function WalletCard({ wallet }) {
  const activeClasses = 'border-slate-200 dark:border-border bg-white dark:bg-bg-card';
  
  const balances = wallet.balances || {};
  const testnet = balances.testnet || { nep17: [], nep11: [] };
  const mainnet = balances.mainnet || { nep17: [], nep11: [] };

  return `
    <div class="wallet-card border ${activeClasses} rounded-xl p-5 transition-all hover:border-slate-300 dark:hover:border-border-light flex flex-col h-full group/card cursor-pointer relative" data-id="${wallet.id}">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2 group/label max-w-[90%]">
          <span class="font-bold text-slate-800 dark:text-text-primary translate-y-[1px] text-[15px] truncate wallet-label-text">${esc(wallet.label)}</span>
          <input type="text" class="hidden wallet-label-input bg-slate-100 dark:bg-bg-input border border-neo-green rounded px-2 py-0.5 text-[14px] w-full font-bold outline-none" value="${esc(wallet.label)}" />
          <button class="edit-label-btn opacity-0 group-hover/card:opacity-100 p-1 text-slate-400 hover:text-neo-green-readable transition-all" title="Edit Label">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </div>
      <div class="font-mono text-[11px] text-slate-400 dark:text-text-muted mb-4 break-all bg-slate-50 dark:bg-bg-primary/40 p-2 rounded border border-border/10 focus-within:border-border transition-colors">${esc(wallet.address)}</div>
      
      <div class="grid grid-cols-2 gap-4 flex-1">
        <!-- Testnet Section -->
        <div class="flex flex-col">
          <div class="flex items-center gap-1.5 mb-2">
             <span class="w-1.5 h-1.5 rounded-full bg-neo-green ring-4 ring-neo-green/10"></span>
             <span class="text-[10px] font-bold uppercase tracking-widest text-text-muted">Testnet</span>
          </div>
          <div class="bg-slate-50/50 dark:bg-bg-primary/20 rounded-lg p-2.5 border border-border/10">
            ${renderAssetList(testnet.nep17)}
            ${testnet.nep11.length > 0 ? `
              <div class="mt-2 pt-2 border-t border-border/30">
                <div class="text-[9px] font-bold text-text-muted uppercase mb-1">NFTs</div>
                <div class="text-[11px] text-neo-green-readable">${testnet.nep11.length} Items</div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Mainnet Section -->
        <div class="flex flex-col">
          <div class="flex items-center gap-1.5 mb-2">
             <span class="w-1.5 h-1.5 rounded-full bg-red-500 ring-4 ring-red-500/10"></span>
             <span class="text-[10px] font-bold uppercase tracking-widest text-text-muted">Mainnet</span>
          </div>
          <div class="bg-slate-50/50 dark:bg-bg-primary/20 rounded-lg p-2.5 border border-border/10">
            ${renderAssetList(mainnet.nep17)}
            ${mainnet.nep11.length > 0 ? `
              <div class="mt-2 pt-2 border-t border-border/30">
                <div class="text-[9px] font-bold text-text-muted uppercase mb-1">NFTs</div>
                <div class="text-[11px] text-red-400">${mainnet.nep11.length} Items</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}
