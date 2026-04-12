import { Router } from 'express';
import { fetchOllamaModels } from '../services/ollama.service.js';
import { getSettings } from '../services/session.service.js';

const router = Router();

router.get('/ollama/models', async (req, res) => {
  const baseURL = req.query.endpoint || getSettings().ollamaEndpoint || 'http://localhost:11434';

  try {
    const models = await fetchOllamaModels(baseURL);
    res.json(models);
  } catch (err) {
    res.json([]);
  }
});

export default router;
