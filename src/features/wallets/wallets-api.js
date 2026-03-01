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

  async importJsonWallet(jsonData) {
    const res = await fetch('/api/wallets/import-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Import failed');
    }
    return res.json();
  },

  async updateWallet(id, updates) {
    return fetch(`/api/wallets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  },
};
