import { v4 as uuidv4 } from 'uuid';
import db from '../database/sqlite.js';

const sessions = new Map();
const globalSettings = {
  network: 'testnet',
  model: 'claude-sonnet-4-6',
  testnetColor: '#008055',
  mainnetColor: '#ef4444',
  theme: 'dark'
};

function persistGlobalSettings() {
  db.prepare('DELETE FROM global_settings').run();
  db.prepare('INSERT INTO global_settings (value) VALUES (?)').run(JSON.stringify(globalSettings));
}

// Helper to save a session to DB
function persistSession(session) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO sessions (id, name, conversationHistory, events, settings, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    session.id,
    session.name,
    JSON.stringify(session.conversationHistory),
    JSON.stringify(session.events),
    JSON.stringify(session.settings),
    session.createdAt,
    session.updatedAt
  );
}

// Load existing sessions from DB on startup
export function loadSessions() {
  const stmt = db.prepare('SELECT * FROM sessions ORDER BY createdAt DESC');
  const rows = stmt.all();
  for (const row of rows) {
    sessions.set(row.id, {
      ...row,
      conversationHistory: JSON.parse(row.conversationHistory),
      events: JSON.parse(row.events),
    settings: {
      mode: 'supervised',
      systemInstructions: '',
      selectedWalletIds: [],
    },
    abortController: null,
    pendingApproval: null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  });
}

// Load global settings
const globalSettingsStmt = db.prepare('SELECT * FROM global_settings LIMIT 1');
const globalSettingsRow = globalSettingsStmt.get();
if (globalSettingsRow) {
  Object.assign(globalSettings, JSON.parse(globalSettingsRow.value));
} else {
  // Initialize default global settings
  persistGlobalSettings();
}

function generateShortId(length = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function listSessions() {
  return Array.from(sessions.values()).map(s => ({
    id: s.id,
    name: s.name,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt || s.createdAt,
    settings: s.settings,
    isRunning: !!s.abortController
  })).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createSession(name) {
  const id = uuidv4();
  const shortId = generateShortId();
  const session = {
    id,
    name: name || `Chat ${shortId}`,
    conversationHistory: [],
    events: [],
    settings: {
      mode: 'supervised',
      systemInstructions: '',
      selectedWalletIds: [],
    },
    abortController: null,
    pendingApproval: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  sessions.set(id, session);
  persistSession(session);
  return session;
}

export function getSession(id) {
  return sessions.get(id);
}

export function getOrCreateDefaultSession() {
  if (sessions.size === 0) return createSession();
  return Array.from(sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

export function deleteSession(id) {
  const deleted = sessions.delete(id);
  if (deleted) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  }
  return deleted;
}

export function addMessage(sessionId, role, content) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  if (role === 'user' && typeof content === 'string' && 
     (session.name === 'New Chat' || session.name.startsWith('Chat ')) && 
     session.conversationHistory.length === 0) {
    const snippet = content.slice(0, 30).trim();
    if (snippet) {
      session.name = snippet + (content.length > 30 ? '...' : '');
    }
  }

  session.conversationHistory.push({ role, content });
  session.updatedAt = Date.now();
  persistSession(session);
}

export function addEvent(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return;
  const fullEvent = {
    id: uuidv4(),
    timestamp: Date.now(),
    sessionId,
    ...event,
  };
  session.events.push(fullEvent);
  session.updatedAt = Date.now();
  persistSession(session);
  return fullEvent;
}

export function getHistory(sessionId) {
  const session = sessions.get(sessionId);
  return session ? session.events : [];
}

export function getAllHistory() {
  const all = [];
  for (const session of sessions.values()) {
    all.push(...session.events);
  }
  return all.sort((a, b) => b.timestamp - a.timestamp);
}

export function updateSettings(sessionId, newSettings) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  // Extract global settings
  const globalKeys = ['network', 'model', 'testnetColor', 'mainnetColor', 'theme'];
  let globalChanged = false;
  globalKeys.forEach(key => {
    if (key in newSettings) {
      globalSettings[key] = newSettings[key];
      delete newSettings[key];
      globalChanged = true;
    }
  });

  if (globalChanged) persistGlobalSettings();

  // Apply other session-specific settings
  Object.assign(session.settings, newSettings);
  session.updatedAt = Date.now();
  persistSession(session);
  return { ...session.settings, ...globalSettings };
}

export function getSettings(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return globalSettings;
  return { ...session.settings, ...globalSettings };
}
