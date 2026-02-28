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
  const indicator = document.getElementById('theme-toggle-indicator');
  if (!container || !indicator) return;
  
  const isDark = theme === 'dark';
  indicator.style.transform = isDark ? 'translateX(100%)' : 'translateX(0)';
  
  const buttons = container.querySelectorAll('.theme-opt');
  buttons.forEach(btn => {
    const active = btn.dataset.theme === theme;
    
    // Clear previous dynamic classes
    btn.classList.remove('text-slate-900', 'text-slate-500', 'text-black', 'text-text-secondary', 'font-bold');
    
    if (active) {
      btn.classList.add('font-bold');
      if (isDark) {
        btn.classList.add('text-black'); // Black text on green background
      } else {
        btn.classList.add('text-slate-900'); // Dark slate on white background
      }
    } else {
      if (isDark) {
        btn.classList.add('text-text-secondary');
      } else {
        btn.classList.add('text-slate-500');
      }
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
  const saved = state.settings.theme || localStorage.getItem('theme') || 'dark';
  setTheme(saved);
}
