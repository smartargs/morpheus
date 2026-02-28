// Settings Feature API
export const settingsApi = {
  async getTools() {
    const res = await fetch('/api/tools');
    return res.json();
  }
};
