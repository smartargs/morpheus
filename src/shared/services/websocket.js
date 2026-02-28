// WebSocket Service
import { state, updateState } from '../../state.js';
import * as chatFeature from '../../features/chat/chat.js';
import { api } from './api.js';
import { chatApi } from '../../features/chat/chat-api.js';

export function connectWs() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  state.ws = new WebSocket(`${proto}://${location.host}/ws`);

  state.ws.onopen = () => console.log('[WS] Connected');
  state.ws.onclose = () => {
    console.log('[WS] Disconnected, reconnecting...');
    setTimeout(connectWs, 2000);
  };
  state.ws.onerror = (e) => console.error('[WS] Error', e);

  state.ws.onmessage = (e) => {
    const event = JSON.parse(e.data);
    handleEvent(event);
  };
}

function handleEvent(event) {
  const chatMessages = document.getElementById('chat-messages');

  // Add to cache if session exists
  if (event.sessionId && state.sessionCache[event.sessionId]) {
    const cache = state.sessionCache[event.sessionId];
    // Don't cache transient events like 'thinking' or 'agent_done'
    const persistentTypes = ['agent_message', 'user_message', 'tool_call', 'tool_result', 'tool_error'];
    if (persistentTypes.includes(event.type)) {
      cache.events.push(event);
      cache.updatedAt = Date.now(); // Update local time as proxy
    }
  }

  // If this event isn't for the current session, ignore UI updates
  if (event.sessionId && event.sessionId !== state.activeSessionId) {
    return;
  }

  switch (event.type) {
    case 'thinking':
      if (chatMessages) chatFeature.appendThinking(chatMessages);
      
      // Update session specific state
      const sThinking = state.sessions.find(s => s.id === event.sessionId);
      if (sThinking) sThinking.isRunning = true;
      
      if (event.sessionId === state.activeSessionId) {
        updateState({ isAgentRunning: true });
        chatFeature.updateStopBtn();
      }
      break;

    case 'agent_message':
      if (chatMessages) {
        chatFeature.removeThinking(chatMessages);
        chatFeature.appendBubble(chatMessages, 'assistant', event.content, { model: event.model });
      }
      break;

    case 'tool_call':
      if (chatMessages) {
        chatFeature.removeThinking(chatMessages);
        chatFeature.appendToolCall(chatMessages, event);
      }
      break;

    case 'tool_result':
      if (chatMessages) chatFeature.updateToolResult(chatMessages, event);
      break;

    case 'tool_error':
      if (chatMessages) chatFeature.updateToolResult(chatMessages, { ...event, success: false, result: event.error });
      break;

    case 'approval_needed':
      showApprovalModal(event);
      break;

    case 'agent_done':
    case 'agent_stopped':
      if (chatMessages) chatFeature.removeThinking(chatMessages);
      
      const sDone = state.sessions.find(s => s.id === event.sessionId);
      if (sDone) sDone.isRunning = false;

      if (event.sessionId === state.activeSessionId) {
        updateState({ isAgentRunning: false });
        chatFeature.updateStopBtn();
      }
      break;

    case 'error':
      if (chatMessages) {
        chatFeature.removeThinking(chatMessages);
        chatFeature.appendBubble(chatMessages, 'assistant', `⚠️ Error: ${event.error}`);
      }
      
      const sErr = state.sessions.find(s => s.id === event.sessionId);
      if (sErr) sErr.isRunning = false;

      if (event.sessionId === state.activeSessionId) {
        updateState({ isAgentRunning: false });
        chatFeature.updateStopBtn();
      }
      break;
  }
}

function showApprovalModal(event) {
  const modal = document.getElementById('approval-modal');
  const body = document.getElementById('approval-body');
  if (!modal || !body) return;

  updateState({ pendingApprovalEventId: event.eventId });
  body.textContent = `Tool: ${event.toolName}\n\nArgs:\n${JSON.stringify(event.toolArgs, null, 2)}`;
  modal.style.display = 'block';

  document.getElementById('approval-approve').onclick = () => respondApproval(true);
  document.getElementById('approval-reject').onclick = () => respondApproval(false);
}

async function respondApproval(approved) {
  const modal = document.getElementById('approval-modal');
  modal.style.display = 'none';
  if (state.pendingApprovalEventId) {
    try {
      await chatApi.respondApproval(state.pendingApprovalEventId, approved, state.activeSessionId);
    } catch {
      // ignore
    }
    updateState({ pendingApprovalEventId: null });
  }
}
