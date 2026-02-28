// Wallets Feature API
export const walletsApi = {
  async getWallets() {
    const res = await fetch('/api/wallets');
    return res.json();
  },

  async createWallet(label) {
    return fetch('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
  },

  async importWallet(label, address, wif) {
    return fetch('/api/wallets/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, address, wif }),
    });
  },

  async updateWalletSelection(ids) {
    return fetch('/api/wallets/selection', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletIds: ids }),
    });
  }
};
