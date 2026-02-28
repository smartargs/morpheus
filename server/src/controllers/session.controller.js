import * as sessionService from '../services/session.service.js';

export const list = (req, res) => {
  res.json(sessionService.listSessions());
};

export const create = (req, res) => {
  const { name } = req.body;
  const session = sessionService.createSession(name);
  res.json(session);
};

export const getOne = (req, res) => {
  const session = sessionService.getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
};

export const remove = (req, res) => {
  sessionService.deleteSession(req.params.id);
  res.json({ success: true });
};

export const getHistory = (req, res) => {
  const { sessionId } = req.query;
  if (sessionId) {
    res.json(sessionService.getHistory(sessionId));
  } else {
    res.json(sessionService.getAllHistory());
  }
};

export const getSettings = (req, res) => {
  const { sessionId } = req.query;
  const session = sessionId ? sessionService.getSession(sessionId) : sessionService.getOrCreateDefaultSession();
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(sessionService.getSettings(session.id));
};

export const updateSettings = (req, res) => {
  const { sessionId } = req.body;
  const session = sessionId ? sessionService.getSession(sessionId) : sessionService.getOrCreateDefaultSession();
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const updated = sessionService.updateSettings(session.id, req.body);
  res.json(updated);
};
