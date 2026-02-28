import { Router } from 'express';
import sessionRoutes from './session.routes.js';
import walletRoutes from './wallet.routes.js';
import chatRoutes from './chat.routes.js';
import mcpRoutes from './mcp.routes.js';

const router = Router();

router.use(sessionRoutes);
router.use(walletRoutes);
router.use(chatRoutes);
router.use(mcpRoutes);

export default router;
