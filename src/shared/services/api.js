// Shared Settings API
export const api = {
  async getSettings(sessionId) {
    const url = sessionId ? `/api/settings?sessionId=${sessionId}` : '/api/settings';
    const res = await fetch(url);
    return res.json();
  },

  async updateSettings(settings, sessionId) {
    const body = { ...settings };
    if (sessionId) body.sessionId = sessionId;
    return fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  async getSessions() {
    const res = await fetch('/api/sessions');
    return res.json();
  },

  async createSession(name, network) {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, network }),
    });
    return res.json();
  },

  async getSessionDetails(id) {
    const res = await fetch(`/api/sessions/${id}`);
    return res.json();
  },

  async deleteSession(id) {
    return fetch(`/api/sessions/${id}`, { method: 'DELETE' });
  }
};
