import { LOCAL_TOOL_DEFINITIONS } from '../tools/definitions.js';

export const listTools = async (req, res) => {
  try {
    res.json(LOCAL_TOOL_DEFINITIONS);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
