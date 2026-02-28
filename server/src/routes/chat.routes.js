import { Router } from 'express';
import * as chatController from '../controllers/chat.controller.js';

const router = Router();

router.post('/chat', chatController.sendMessage);
router.post('/stop', chatController.stopAgent);
router.post('/approve/:eventId', chatController.approveEvent);

export default router;
