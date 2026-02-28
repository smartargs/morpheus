export const state = {
  ws: null,
  isAgentRunning: false,
  pendingApprovalEventId: null,
  settings: {
    mode: 'supervised',
    systemInstructions: '',
    network: 'testnet',
    theme: localStorage.getItem('theme') || 'system'
  },
  currentPage: 'chat',
  activeSessionId: localStorage.getItem('activeSessionId') || null,
  sessions: [], // { id, name, createdAt, updatedAt }
  wallets: [], // { id, label, address, selected, ... }
  sessionCache: {}, // { sessionId: { updatedAt, events } }
  historyEvents: []
};

// State change notification simplified for this vanilla setup
export const updateState = (updates) => {
  Object.assign(state, updates);
};
