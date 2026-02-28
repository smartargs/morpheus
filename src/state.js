export const state = {
  ws: null,
  isAgentRunning: false,
  pendingApprovalEventId: null,
  settings: {
    mode: 'supervised',
    systemInstructions: '',
    network: 'testnet',
    testnetColor: '#00e599', 
    mainnetColor: '#ef4444', // Red for Mainnet
    theme: localStorage.getItem('theme') || 'dark'
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
