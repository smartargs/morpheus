// Main Entry Point
import { state, updateState } from './state.js';
import { connectWs } from './shared/services/websocket.js';
import { initTheme, setTheme } from './shared/services/theme.js';
import { api } from './shared/services/api.js';

// Feature Views
import { renderChat } from './features/chat/chat.js';
import { renderWallets } from './features/wallets/wallets.js';
import { renderHistory } from './features/history/history.js';
import { renderSettings } from './features/settings/settings.js';
import { formatTimeAgo } from './shared/utils/helpers.js';

// Global Session List Renderer
export async function renderGlobalSessionList(force = false) {
  const container = document.getElementById('global-session-list');
  if (!container) return;

  try {
    let sessions = state.sessions;
    if (force || sessions.length === 0) {
      sessions = await api.getSessions();
      updateState({ sessions });
    }
    
    if (!state.activeSessionId && sessions.length > 0) {
      updateState({ activeSessionId: sessions[0].id });
      localStorage.setItem('activeSessionId', sessions[0].id);
    }

    container.innerHTML = sessions.map(s => {
      const active = s.id === state.activeSessionId;
      const timeHint = formatTimeAgo(s.updatedAt);
      
      return `
        <div class="px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer truncate flex items-center justify-between group ${
          active 
            ? 'bg-neo-green/10 text-neo-green border border-neo-green/20 shadow-sm' 
            : 'text-slate-500 dark:text-text-secondary hover:bg-slate-200/50 dark:hover:bg-bg-card/50'
        }" data-id="${s.id}">
          <div class="flex items-center gap-2 flex-1 truncate">
            <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${s.settings?.network === 'mainnet' ? (s.settings?.mainnetColor || '#ef4444') : (s.settings?.testnetColor || '#00e599')}"></span>
            <span class="truncate">${s.name}</span>
          </div>
          ${timeHint ? `<span class="text-[10px] opacity-60 font-normal ml-2 shrink-0">${timeHint}</span>` : ''}
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        if (id === state.activeSessionId && state.currentPage === 'chat') return;
        
        updateState({ activeSessionId: id });
        localStorage.setItem('activeSessionId', id);
        
        if (state.currentPage !== 'chat') {
           location.hash = '#chat';
        } else {
           renderChat();
        }
        renderGlobalSessionList();
      });
    });
    return sessions;
  } catch (err) {
    console.error('Failed to load sessions:', err);
    return [];
  }
}

// Global New Chat handler
async function handleGlobalNewChat() {
  try {
    const newSession = await api.createSession('New Chat');
    state.sessions.unshift(newSession);
    updateState({ activeSessionId: newSession.id });
    localStorage.setItem('activeSessionId', newSession.id);
    
    if (state.currentPage !== 'chat') {
       location.hash = '#chat';
    } else {
       renderChat();
    }
    renderGlobalSessionList();
  } catch (err) {
    console.error('Failed to create new chat:', err);
  }
}

// ─── Router ─────────────────────────────────────

function navigate(page) {
  updateState({ currentPage: page });

  // Update sidebar active state
  const sidebar = document.getElementById('sidebar');
  sidebar?.querySelectorAll('.nav-link').forEach((a) => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  // Refresh sessions list to sync active state in sidebar
  renderGlobalSessionList();

  // Render current view
  switch (page) {
    case 'chat':    renderChat(); break;
    case 'wallets': renderWallets(); break;
    case 'history': renderHistory(); break;
    case 'settings': renderSettings(); break;
    default: renderChat();
  }
}

function onHashChange() {
  const hash = location.hash.slice(1) || 'chat';
  navigate(hash);
}

// ─── UI Initialization ──────────────────────────

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const close = document.getElementById('sidebar-close');
  const overlay = document.getElementById('sidebar-overlay');
  const themeCycle = document.getElementById('theme-cycle');

  if (!sidebar) return;

  const toggleSidebar = () => {
    const isOpen = sidebar.classList.toggle('open');
    sidebar.classList.toggle('-translate-x-full');
    overlay?.classList.toggle('hidden');
    
    // Hide hamburger toggle when sidebar is open
    if (toggle) {
      toggle.style.display = isOpen ? 'none' : 'flex';
    }
  };

  toggle?.addEventListener('click', toggleSidebar);
  close?.addEventListener('click', toggleSidebar);
  overlay?.addEventListener('click', toggleSidebar);

  themeCycle?.addEventListener('click', () => {
    const themes = ['light', 'dark'];
    const currentIdx = themes.indexOf(state.settings.theme || 'dark');
    const next = themes[(currentIdx + 1) % themes.length];
    setTheme(next);
    
    // Minimal background sync
    api.updateSettings({ ...state.settings, theme: next }, state.activeSessionId).catch(() => {});
  });

  document.getElementById('global-new-chat-btn')?.addEventListener('click', handleGlobalNewChat);

  // Close sidebar on mobile navigation
  sidebar.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (overlay && !overlay.classList.contains('hidden')) toggleSidebar();
    });
  });
}

// ─── Boot ───────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTheme();
  connectWs();
  renderGlobalSessionList();
  
  window.addEventListener('hashchange', onHashChange);
  onHashChange();

  // Periodically refresh just the time hints in the sidebar
  setInterval(() => renderGlobalSessionList(), 30000);
});
