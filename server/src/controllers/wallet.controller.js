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

export const importJson = (req, res) => {
  try {
    const data = req.body;
    const imported = [];

    // NEP-6 standard format: { name, accounts: [{ address, label, key, ... }] }
    if (data.accounts && Array.isArray(data.accounts)) {
      for (const acct of data.accounts) {
        const label = acct.label || data.name || 'NEP-6 Import';
        const address = acct.address;
        if (!address) continue;
        const w = walletService.importWallet(label, address, '');
        imported.push(w);
      }
    }
    // Array of wallet objects: [{ label, address, wif }, ...]
    else if (Array.isArray(data)) {
      for (const entry of data) {
        const address = entry.address;
        if (!address) continue;
        const w = walletService.importWallet(entry.label || 'Imported', address, entry.wif || '');
        imported.push(w);
      }
    }
    // Single wallet object: { label, address, wif }
    else if (data.address) {
      const w = walletService.importWallet(data.label || 'Imported', data.address, data.wif || '');
      imported.push(w);
    }
    else {
      return res.status(400).json({ error: 'Unrecognized wallet JSON format. Expected NEP-6, an array of wallets, or a single { address, wif } object.' });
    }

    res.json({ imported: imported.length, wallets: imported });
  } catch (err) {
    res.status(500).json({ error: `Failed to import: ${err.message}` });
  }
};

export const update = (req, res) => {
  const { id } = req.params;
  const updated = walletService.updateWallet(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Wallet not found' });
  res.json(updated);
};

