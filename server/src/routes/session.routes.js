import { Router } from 'express';
import * as sessionController from '../controllers/session.controller.js';

const router = Router();

router.get('/sessions', sessionController.list);
router.post('/sessions', sessionController.create);
router.get('/sessions/:id', sessionController.getOne);
router.delete('/sessions/:id', sessionController.remove);

// Historically flat session-related routes
router.get('/history', sessionController.getHistory);
router.get('/settings', sessionController.getSettings);
router.put('/settings', sessionController.updateSettings);

export default router;
