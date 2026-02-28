// Wallet Card Component
import { esc } from '../../../shared/utils/helpers.js';

export function WalletCard({ wallet }) {
  const isSelected = wallet.selected;
  const selectBorder = isSelected ? 'border-neo-green ring-1 ring-neo-green shadow-[0_0_16px_rgba(0,229,153,0.1)]' : 'border-slate-200 dark:border-border';
  
  return `
    <div class="wallet-card bg-white dark:bg-bg-card border ${selectBorder} rounded-xl p-5 transition-all hover:border-slate-300 dark:hover:border-border-light" data-id="${wallet.id}">
      <div class="flex items-center justify-between mb-3">
        <span class="font-bold text-slate-800 dark:text-text-primary translate-y-[1px]">${esc(wallet.label)}</span>
        <label class="flex items-center gap-2 cursor-pointer text-[13px] text-slate-500 dark:text-text-secondary">
          <input type="checkbox" ${isSelected ? 'checked' : ''} data-wallet-id="${wallet.id}" class="agent-select w-4.5 h-4.5 rounded border-slate-300 dark:border-border-light text-neo-green focus:ring-neo-green transition-all" />
          Agent
        </label>
      </div>
      <div class="font-mono text-[12px] text-slate-400 dark:text-text-secondary mb-4 break-all bg-slate-50 dark:bg-bg-primary/50 p-2 rounded">${esc(wallet.address)}</div>
      <div class="flex gap-6">
        <div class="flex flex-col">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-muted mb-0.5">NEO</span>
          <span class="text-base font-bold font-mono text-neo-green">${wallet.balance?.neo ?? wallet.balance?.raw ?? '—'}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-muted mb-0.5">GAS</span>
          <span class="text-base font-bold font-mono text-blue-500 dark:text-info">${wallet.balance?.gas ?? '—'}</span>
        </div>
      </div>
    </div>
  `;
}
