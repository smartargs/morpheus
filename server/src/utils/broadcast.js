const wsClients = new Set();

export function registerWsClient(ws) {
  wsClients.add(ws);
}

export function removeWsClient(ws) {
  wsClients.delete(ws);
}

export function broadcastToSession(sessionId, event) {
  const data = JSON.stringify({ ...event, sessionId });
  for (const ws of wsClients) {
    if (ws.readyState === 1) { // OPEN
      ws.send(data);
    }
  }
}
