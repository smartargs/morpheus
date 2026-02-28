// Chat Feature API
export const chatApi = {
  async sendMessage(message, sessionId, model) {
    const body = { message };
    if (sessionId) body.sessionId = sessionId;
    if (model) body.model = model;
    return fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  async stopAgent(sessionId) {
    const body = {};
    if (sessionId) body.sessionId = sessionId;
    return fetch('/api/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },

  async respondApproval(eventId, approved, sessionId) {
    const body = { approved };
    if (sessionId) body.sessionId = sessionId;
    return fetch(`/api/approve/${eventId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
};
