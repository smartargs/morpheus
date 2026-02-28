import * as mcpService from '../services/mcp.service.js';

export const listTools = async (req, res) => {
  try {
    const tools = await mcpService.listTools();
    res.json(tools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
