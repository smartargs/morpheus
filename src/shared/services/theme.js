// Theme Service
import { state } from '../../state.js';

export function setTheme(theme) {
  state.settings.theme = theme;
  localStorage.setItem('theme', theme);
  
  // Apply theme instantly by disabling transitions temporarily
  document.documentElement.classList.add('no-transitions');
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Update icons and settings UI if visible
  updateThemeIcons(theme);
  updateThemeToggleUI(theme);
  
  // Re-enable transitions after a tiny delay
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transitions');
    });
  });
}

export function updateThemeToggleUI(theme) {
  const container = document.getElementById('theme-toggle');
  if (!container) return;
  
  const buttons = container.querySelectorAll('.toggle-option');
  buttons.forEach(btn => {
    const active = btn.dataset.theme === theme;
    if (active) {
      btn.classList.add('bg-white', 'dark:bg-neo-green', 'shadow-sm', 'text-slate-900', 'dark:text-black', 'font-semibold');
      btn.classList.remove('text-slate-500', 'dark:text-text-secondary');
    } else {
      btn.classList.remove('bg-white', 'dark:bg-neo-green', 'shadow-sm', 'text-slate-900', 'dark:text-black', 'font-semibold');
      btn.classList.add('text-slate-500', 'dark:text-text-secondary');
    }
  });
}

function updateThemeIcons(theme) {
  const icons = {
    light: document.getElementById('theme-icon-light'),
    dark: document.getElementById('theme-icon-dark')
  };
  Object.values(icons).forEach(icon => icon?.classList.add('hidden'));
  icons[theme]?.classList.remove('hidden');
}

export function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  setTheme(saved);
}
