import * as walletService from '../services/wallet.service.js';

export const list = async (req, res) => {
  try {
    const wallets = await walletService.listWalletsWithBalances();
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const wallet = await walletService.createWallet(req.body.label || 'New Wallet');
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const importW = (req, res) => {
  const { label, address, wif } = req.body;
  if (!address) return res.status(400).json({ error: 'Address required' });
  const wallet = walletService.importWallet(label || 'Imported', address, wif);
  res.json(wallet);
};

export const updateSelection = (req, res) => {
  const { walletIds } = req.body;
  const selected = walletService.updateSelection(walletIds || []);
  res.json(selected);
};
