// Chat View
import { state, updateState } from '../../state.js';
import { api } from '../../shared/services/api.js';
import { chatApi } from './chat-api.js';
import { TextArea } from '../../shared/components/input.js';
import { Button } from '../../shared/components/button.js';
import { EmptyState } from '../../shared/components/empty-state.js';
import { ActivityCard, initActivityCard } from './components/activity-card.js';
import { WalletSelector, initWalletSelector } from './components/wallet-selector.js';
import { ModelSelector, initModelSelector } from './components/model-selector.js';
import { NetworkSelector, initNetworkSelector } from './components/network-selector.js';
import { parseMarkdown, esc } from '../../shared/utils/helpers.js';

export async function renderChat() {
  const app = document.getElementById('app');
  if (!app) return;

  // Ensure we have sessions and an active one
  await initSessions();

  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
  const network = activeSession?.settings?.network || 'testnet';
  let networkColor = network === 'mainnet' 
    ? (activeSession?.settings?.mainnetColor || state.settings.mainnetColor || '#ef4444')
    : (activeSession?.settings?.testnetColor || state.settings.testnetColor || '#00e599');

  // If specific green is hard to read on light backgrounds, adjust it
  if (networkColor === '#00e599' && !document.documentElement.classList.contains('dark')) {
     networkColor = '#008055'; 
  }

  app.innerHTML = `
    <div class="flex-1 flex flex-col h-full bg-white dark:bg-transparent min-w-0 transition-all">
      <div class="chat-header px-9 py-3 border-b border-slate-200 dark:border-border flex justify-between items-center transition-colors">
        <div class="flex items-center gap-2.5">
          <div class="w-3 h-3 rounded-[3px] shadow-sm shrink-0" style="background-color: ${networkColor}"></div>
          <span class="font-bold text-slate-800 dark:text-text-primary truncate max-w-[300px]" id="active-session-name">Chat</span>
        </div>
        <div class="flex gap-2">
           ${Button({
             id: 'delete-chat-btn',
             variant: 'ghost',
             className: 'text-red-500 hover:text-red-600 p-1.5 transition-colors',
             title: 'Delete Chat',
             icon: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>'
           })}
        </div>
      </div>

      <div class="flex-1 flex flex-col border-[3px] bg-white dark:bg-bg-secondary shadow-md overflow-hidden min-w-0 transition-all" style="border-color: ${networkColor}66">
        <div class="chat-messages flex-1 overflow-y-auto px-[17px] py-6 flex flex-col gap-4" id="chat-messages">
          <div class="flex-1 flex items-center justify-center opacity-50"><div class="animate-pulse">Loading conversation...</div></div>
        </div>
      </div>

      <div class="px-4 pt-5 pb-6 border-t border-slate-300 dark:border-border bg-white dark:bg-bg-secondary w-full overflow-visible">
        <div class="w-full group overflow-visible">
          <div class="flex flex-col bg-transparent dark:bg-bg-input border border-slate-300 dark:border-border-light rounded-2xl focus-within:border-neo-green/60 focus-within:shadow-[0_0_0_1px_rgba(0,229,153,0.3),0_0_20px_rgba(0,229,153,0.15)] focus-within:z-10 transition-all shadow-sm hover:shadow-md relative overflow-visible">
            <!-- Text Input -->
            ${TextArea({
              id: 'chat-input',
              placeholder: 'Ask Morpheus anything...',
              className: 'min-h-[60px] max-h-[160px] border-none bg-transparent focus:ring-0 focus:border-none rounded-t-2xl px-5 py-4 text-[15px] leading-relaxed text-slate-800 dark:text-text-primary shadow-none'
            })}
            
            <div class="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-border/30 bg-slate-50/50 dark:bg-white/5 rounded-b-2xl">
              <div class="flex items-center gap-1">
                ${WalletSelector()}
                <div class="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1"></div>
                ${ModelSelector()}
              </div>
              
              <div class="flex items-center gap-2">
                ${Button({
                  id: 'stop-btn',
                  variant: 'danger',
                  className: 'hidden items-center justify-center p-2 rounded-xl text-sm transition-all',
                  icon: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>'
                })}
                ${Button({
                  id: 'send-btn',
                  variant: 'primary',
                  className: 'w-10 h-10 rounded-xl flex items-center justify-center p-0 shadow-lg ring-1 ring-white/10',
                  style: `background-color: ${networkColor}; color: ${network === 'mainnet' ? 'white' : 'black'}; box-shadow: 0 10px 15px -3px ${networkColor}40`,
                  icon: '<svg class="w-5 h-5 translate-x-[1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
`;

  initChatListeners();
  initWalletSelector();
  initModelSelector();
  await loadActiveSession();
}

async function initSessions() {
  if (state.sessions.length === 0) {
    const sessions = await api.getSessions();
    updateState({ sessions });
  }
  
  const { sessions } = state;
  if (!state.activeSessionId && sessions.length > 0) {
    state.activeSessionId = sessions[0].id;
    localStorage.setItem('activeSessionId', state.activeSessionId);
  } else if (!state.activeSessionId || !sessions.find(s => s.id === state.activeSessionId)) {
    const newSession = await api.createSession('New Chat', 'mainnet');
    state.sessions = [newSession];
    state.activeSessionId = newSession.id;
    localStorage.setItem('activeSessionId', state.activeSessionId);
  }
}

function initChatListeners() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const stopBtn = document.getElementById('stop-btn');
  const deleteBtn = document.getElementById('delete-chat-btn');

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  sendBtn?.addEventListener('click', handleSendMessage);
  stopBtn?.addEventListener('click', () => chatApi.stopAgent(state.activeSessionId));
  
  deleteBtn?.addEventListener('click', async () => {
    if (confirm('Delete this chat permanently?')) {
      const idToDelete = state.activeSessionId;
      try {
        await api.deleteSession(idToDelete);
        
        // Update state locally
        state.sessions = state.sessions.filter(s => s.id !== idToDelete);
        state.activeSessionId = state.sessions[0]?.id || null;
        localStorage.setItem('activeSessionId', state.activeSessionId);
        
        // Refresh sidebar list without full reload
        import('../../main.js').then(m => {
          if (m.renderGlobalSessionList) m.renderGlobalSessionList();
        });
        
        // Refresh chat view
        await renderChat();
      } catch (err) {
        console.error('Failed to delete chat:', err);
        alert('Failed to delete chat session.');
      }
    }
  });

  updateStopBtn();
}

export async function switchSession(id) {
  const session = state.sessions.find(s => s.id === id);
  updateState({ 
    activeSessionId: id,
    isAgentRunning: !!session?.isRunning
  });
  localStorage.setItem('activeSessionId', id);
  await renderChat();
}

async function loadActiveSession() {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  
  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
  document.getElementById('active-session-name').textContent = activeSession?.name || 'Chat';
  
  // Sync global running state
  updateState({ isAgentRunning: !!activeSession?.isRunning });
  updateStopBtn();

  // Check cache first
  const cached = state.sessionCache[state.activeSessionId];
  if (cached && activeSession && cached.updatedAt === activeSession.updatedAt) {
    console.log('[Cache] Loading from cache:', state.activeSessionId);
    renderEvents(container, cached.events);
    
    // Restore thinking indicator if session is running
    if (activeSession?.isRunning) {
      appendThinking(container);
    }
    return;
  }

  try {
    const details = await api.getSessionDetails(state.activeSessionId);
    
    // Sync global settings from the session data to the global state
    if (details.settings) {
      updateState({ settings: { ...state.settings, ...details.settings } });
    }

    // Update the session in the session list to ensure it has latest settings
    const idx = state.sessions.findIndex(s => s.id === state.activeSessionId);
    if (idx !== -1) {
      state.sessions[idx].settings = details.settings;
    }

    // Update cache
    state.sessionCache[state.activeSessionId] = {
      updatedAt: activeSession?.updatedAt || Date.now(),
      events: details.events
    };

    renderEvents(container, details.events);
    
    // Restore thinking indicator if session is running
    if (activeSession?.isRunning) {
      appendThinking(container);
    }
  } catch (err) {
    container.innerHTML = `<p class="p-8 text-center text-red-400">Error loading session: ${err.message}</p>`;
  }
}

function renderEvents(container, events) {
  container.innerHTML = '';
  
  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
  const network = activeSession?.settings?.network || 'testnet';
  const networkDisplay = network.charAt(0).toUpperCase() + network.slice(1);
  const networkColor = network === 'mainnet' ? '#ef4444' : '#00e599';

  if (events.length === 0) {
    container.innerHTML = EmptyState({
      id: 'chat-empty',
      icon: '◆',
      title: 'Morpheus',
      message: `I'm ready to help you on <span class="font-bold" style="color: ${networkColor}">${networkDisplay}</span>. Ask me anything about the Neo N3 blockchain — check balances, transfer assets, or navigate the Matrix.`
    });
    return;
  }

  events.forEach(ev => {
    if (ev.type === 'agent_message') appendBubble(container, 'assistant', ev.content, { model: ev.model });
    else if (ev.type === 'user_message' || ev.role === 'user') appendBubble(container, 'user', ev.content);
    else if (ev.type === 'tool_call') appendToolCall(container, ev);
    else if (ev.type === 'tool_result' || ev.type === 'tool_error') updateToolResult(container, ev);
    else if (ev.type === 'approval_needed') {
       // Only show interactive approval if it's the last event of its kind
       const handled = events.some(e => (e.type === 'approval_granted' || e.type === 'approval_rejected') && e.eventId === ev.eventId);
       if (!handled) appendApproval(container, ev);
    }
  });
  
  container.scrollTop = container.scrollHeight;
}

async function handleSendMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg || state.isAgentRunning) return;

  input.value = '';
  input.style.height = 'auto';

  const chatMessages = document.getElementById('chat-messages');
  const empty = document.getElementById('chat-empty');
  if (empty) empty.remove();

  appendBubble(chatMessages, 'user', msg);
  
  // Optimistically update cache
  if (state.sessionCache[state.activeSessionId]) {
    state.sessionCache[state.activeSessionId].events.push({
      type: 'user_message',
      content: msg,
      timestamp: Date.now()
    });
  }

  try {
    const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
    const model = currentSession?.settings?.model;
    await chatApi.sendMessage(msg, state.activeSessionId, model);
    const isDefaultName = currentSession && (currentSession.name === 'New Chat' || currentSession.name.startsWith('Chat '));
    
    // If it was a default name, it likely got auto-renamed on the backend
    if (isDefaultName) {
      import('../../main.js').then(async m => {
        const updatedSessions = await m.renderGlobalSessionList(true);
        const updated = updatedSessions.find(s => s.id === state.activeSessionId);
        const titleEl = document.getElementById('active-session-name');
        if (titleEl && updated) {
          titleEl.textContent = updated.name;
        }
      });
    }
  } catch (err) {
    appendBubble(chatMessages, 'assistant', `⚠️ Failed to send: ${err.message}`);
  }
}

export function updateStopBtn() {
  const stopBtn = document.getElementById('stop-btn');
  const sendBtn = document.getElementById('send-btn');
  if (!stopBtn || !sendBtn) return;
  
  if (state.isAgentRunning) {
    stopBtn.style.display = 'flex';
    sendBtn.style.display = 'none';
  } else {
    stopBtn.style.display = 'none';
    sendBtn.style.display = 'flex';
  }
}

export function appendBubble(container, role, text, options = {}) {
  if (!container) return;
  const wrapper = document.createElement('div');
  wrapper.className = `flex w-full mb-1 ${role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-slide`;
  
  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
  const network = activeSession?.settings?.network || 'testnet';
  const networkColor = network === 'mainnet' 
    ? (activeSession?.settings?.mainnetColor || state.settings.mainnetColor || '#ef4444')
    : (activeSession?.settings?.testnetColor || state.settings.testnetColor || '#00e599');

  const containerDiv = document.createElement('div');
  containerDiv.className = `max-w-[85%] md:max-w-[75%] flex flex-col ${role === 'user' ? 'items-end' : 'items-start'}`;

  // Mini label for model if available
  if (role === 'assistant' && options.model) {
     const modelLabel = document.createElement('div');
     modelLabel.className = 'text-[9.5px] font-bold tracking-tight uppercase text-slate-400 dark:text-text-muted mb-1 ml-2 opacity-80';
     modelLabel.textContent = options.model;
     containerDiv.appendChild(modelLabel);
  }

  const div = document.createElement('div');

  div.className = `w-full px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed shadow-sm ${
    role === 'user'
      ? 'bg-slate-200/80 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-br-sm'
      : 'bg-slate-100 dark:bg-bg-card text-slate-800 dark:text-text-primary border border-slate-200 dark:border-border rounded-bl-sm'
  }`;
  
  div.innerHTML = role === 'assistant' ? parseMarkdown(text) : esc(text);
  
  containerDiv.appendChild(div);
  wrapper.appendChild(containerDiv);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}

export function appendThinking(container) {
  if (!container || container.querySelector('.thinking-indicator')) return;
  const div = document.createElement('div');
  div.className = 'thinking-indicator self-start flex items-center gap-3 px-4 py-2.5 text-slate-400 dark:text-text-muted text-[13.5px] animate-fade-slide';
  div.innerHTML = `<div class="flex gap-1.5">
    <span class="w-1.5 h-1.5 bg-neo-green rounded-full animate-bounce"></span>
    <span class="w-1.5 h-1.5 bg-neo-green rounded-full animate-bounce [animation-delay:0.15s]"></span>
    <span class="w-1.5 h-1.5 bg-neo-green rounded-full animate-bounce [animation-delay:0.3s]"></span>
  </div> <span>Agent is thinking...</span>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

export function removeThinking(container) {
  if (!container) return;
  const el = container.querySelector('.thinking-indicator');
  if (el) el.remove();
}

export function appendToolCall(container, event) {
  if (!container) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'flex w-full justify-start animate-fade-slide mb-2';
  
  const temp = document.createElement('div');
  temp.innerHTML = ActivityCard({ event });
  const el = temp.firstElementChild;
  initActivityCard(el);
  
  wrapper.appendChild(el);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}

export function updateToolResult(container, event) {
  if (!container) return;
  
  // Try to find the specific card by callEventId, fallback to last card
  let card = null;
  if (event.callEventId) {
    card = container.querySelector(`.activity-card[data-event-id="${event.callEventId}"]`);
  }
  
  if (!card) {
    const cards = container.querySelectorAll('.activity-card');
    card = cards[cards.length - 1];
  }
  
  if (!card) return;

  if (!event.success) {
    card.classList.remove('border-l-neo-green');
    card.classList.add('border-l-red-500');
  }

  const statusEl = card.querySelector('.activity-status');
  if (statusEl) {
    statusEl.textContent = event.success !== false ? 'Completed' : 'Failed';
    statusEl.classList.remove('text-slate-500', 'dark:text-text-muted');
    statusEl.classList.add(event.success !== false ? 'text-neo-green-readable' : 'text-red-500');
  }

  const body = card.querySelector('.activity-body');
  const chevron = card.querySelector('.activity-chevron');
  if (body) {
    const resultText = event.result || event.error || '(No result)';
    const statusLabel = event.success !== false ? '✓ Success' : '✗ Error';
    const statusClass = event.success !== false ? 'text-neo-green-readable' : 'text-red-500';
    
    body.innerHTML += `<div class="mt-3 pt-3 border-t border-slate-200/50 dark:border-border/30">
      <div class="font-bold ${statusClass} mb-1 text-[11px] uppercase tracking-wider">${statusLabel}</div>
      <div class="text-slate-500 dark:text-text-secondary">${esc(resultText)}</div>
    </div>`;
  }
}

export function appendApproval(container, event) {
  if (!container) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'flex w-full justify-start animate-fade-slide mb-4';
  
  const id = event.eventId; // ID of tool_call we are approving
  const div = document.createElement('div');
  div.className = 'w-full max-w-[720px] bg-slate-50/50 dark:bg-bg-input border-2 border-neo-green/20 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col gap-3.5';
  div.id = `approval-${id}`;

  const header = `
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-neo-green/10 flex items-center justify-center text-neo-green-readable text-xs">⚠️</div>
      <div class="flex flex-col">
        <span class="text-[10px] font-bold uppercase tracking-widest text-neo-green-readable leading-none mb-1">Approval Required</span>
        <span class="text-[14px] font-bold text-slate-700 dark:text-text-primary leading-tight">Action: ${esc(event.toolName)}</span>
      </div>
    </div>
  `;

  const body = `
    <div class="bg-white/50 dark:bg-black/20 rounded-xl p-3 border border-slate-200/50 dark:border-border/30">
      <div class="text-[9px] font-bold text-slate-400 dark:text-text-muted uppercase tracking-wider mb-2">Technical Arguments</div>
      <pre class="text-[11px] font-mono text-slate-600 dark:text-text-secondary whitespace-pre-wrap break-all leading-relaxed">${esc(JSON.stringify(event.toolArgs, null, 2))}</pre>
    </div>
  `;

  const buttons = `
    <div class="flex gap-2.5 justify-end approval-actions">
      <button class="px-5 py-2.5 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5 transition-all reject-btn active:scale-95">Reject</button>
      <button class="px-7 py-2.5 rounded-xl text-[12px] font-bold bg-neo-green text-black hover:opacity-90 transition-all shadow-lg shadow-neo-green/20 active:scale-95 approve-btn">Approve & Execute</button>
    </div>
  `;

  div.innerHTML = header + body + buttons;
  
  const approveBtn = div.querySelector('.approve-btn');
  const rejectBtn = div.querySelector('.reject-btn');
  const actionArea = div.querySelector('.approval-actions');

  const handleDecision = async (approved) => {
    try {
      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      
      const session = state.sessions.find(s => s.id === state.activeSessionId);
      if (!session) return;

      actionArea.innerHTML = `<div class="flex items-center gap-2 group">
        <span class="w-1.5 h-1.5 rounded-full ${approved ? 'bg-neo-green animate-pulse' : 'bg-red-500'}"></span>
        <div class="text-[11px] font-bold uppercase tracking-widest ${approved ? 'text-neo-green-readable' : 'text-red-500'} py-1">
          ${approved ? 'Confirming Authorization...' : 'Cancelling Operation...'}
        </div>
      </div>`;
      
      await chatApi.respondApproval(id, approved, state.activeSessionId);
    } catch (err) {
      console.error('Failed to respond to approval:', err);
      actionArea.innerHTML = `<span class="text-xs text-red-500">Failed to send decision. Try again.</span>`;
    }
  };

  if (approveBtn) approveBtn.onclick = () => handleDecision(true);
  if (rejectBtn) rejectBtn.onclick = () => handleDecision(false);

  wrapper.appendChild(div);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}
