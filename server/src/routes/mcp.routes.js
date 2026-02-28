import { Router } from 'express';
import * as mcpController from '../controllers/mcp.controller.js';

const router = Router();

router.get('/tools', mcpController.listTools);

export default router;
