import { Router } from 'express';
import * as walletController from '../controllers/wallet.controller.js';

const router = Router();

router.get('/wallets', walletController.list);
router.post('/wallets', walletController.create);
router.post('/wallets/import', walletController.importW);
router.put('/wallets/selection', walletController.updateSelection);

export default router;
