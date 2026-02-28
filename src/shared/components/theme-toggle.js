/**
 * Theme Toggle Component
 * A full-width pill toggle for switching between Light and Dark modes.
 */
import { state } from '../../state.js';
import { setTheme } from '../services/theme.js';
import { api } from '../services/api.js';

export function ThemeToggle() {
  const currentTheme = state.settings.theme || 'dark';
  
  return `
    <div id="theme-toggle" class="relative flex w-full bg-slate-100 dark:bg-bg-input rounded-lg p-0.5 cursor-pointer select-none border border-slate-200 dark:border-border/30" role="radiogroup" aria-label="Theme selection">
      <div id="theme-toggle-indicator" class="absolute top-0.5 left-0.5 w-[calc(50%-2px)] h-[calc(100%-4px)] bg-white dark:bg-neo-green rounded-md shadow-sm transition-transform duration-200 ease-out" style="transform: ${currentTheme === 'dark' ? 'translateX(100%)' : 'translateX(0)'}"></div>
      
      <button data-theme="light" class="theme-opt relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-[12px] font-bold rounded-md transition-colors ${currentTheme === 'light' ? 'text-slate-900' : 'text-slate-500'}">
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        <span>Light</span>
      </button>
      
      <button data-theme="dark" class="theme-opt relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-[12px] font-bold rounded-md transition-colors ${currentTheme === 'dark' ? 'text-black' : 'text-text-secondary'}">
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
        <span>Dark</span>
      </button>
    </div>
  `;
}

export function initThemeToggle(container) {
  if (!container) return;
  
  const toggle = container.querySelector('#theme-toggle');
  if (!toggle) return;
  
  toggle.addEventListener('click', (e) => {
    const opt = e.target.closest('.theme-opt');
    if (!opt) return;
    
    const theme = opt.dataset.theme;
    if (theme === state.settings.theme) return;
    
    setTheme(theme);
    
    // Sync with backend (background)
    api.updateSettings({ ...state.settings, theme }, state.activeSessionId).catch(() => {});
  });
}
