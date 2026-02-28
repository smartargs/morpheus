import * as sessionService from '../services/session.service.js';
import * as mcpService from '../services/mcp.service.js';
import * as llmService from '../services/llm.service.js';
import { broadcastToSession } from '../utils/broadcast.js';

export const sendMessage = async (req, res) => {
  const { message, sessionId } = req.body;
  const session = sessionId ? sessionService.getSession(sessionId) : sessionService.getOrCreateDefaultSession();
  
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (!message) return res.status(400).json({ error: 'Message required' });

  res.json({ sessionId: session.id, status: 'processing' });

  try {
    const tools = await mcpService.listTools();
    await llmService.runAgentLoop(session, message, tools, (event) => {
      broadcastToSession(session.id, event);
    });
  } catch (err) {
    broadcastToSession(session.id, { type: 'error', error: err.message });
  }
};

export const approveEvent = (req, res) => {
  const { sessionId, approved } = req.body;
  const { eventId } = req.params;
  const session = sessionId ? sessionService.getSession(sessionId) : sessionService.getOrCreateDefaultSession();

  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (!session.pendingApproval || session.pendingApproval.eventId !== eventId) {
    return res.status(404).json({ error: 'No pending approval with that ID' });
  }

  if (approved) {
    session.pendingApproval.resolve();
    sessionService.addEvent(session.id, { type: 'approval_granted', eventId });
  } else {
    session.pendingApproval.reject(new Error('Rejected'));
    sessionService.addEvent(session.id, { type: 'approval_rejected', eventId });
  }
  session.pendingApproval = null;

  res.json({ status: approved ? 'approved' : 'rejected' });
};

export const stopAgent = (req, res) => {
  const { sessionId } = req.body;
  const session = sessionId ? sessionService.getSession(sessionId) : sessionService.getOrCreateDefaultSession();
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (session.abortController) {
    session.abortController.abort();
    res.json({ status: 'stopping' });
  } else {
    res.json({ status: 'not_running' });
  }
};
