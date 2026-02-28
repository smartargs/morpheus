// History Feature API
export const historyApi = {
  async getHistory() {
    const res = await fetch('/api/history');
    return res.json();
  }
};
