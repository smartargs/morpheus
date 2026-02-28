/**
 * Tools that interact with the Dora Explorer API (COZ)
 */

async function withRetry(action, maxRetries = 3, delay = 1000) {
  let lastError = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (err) {
      lastError = err;
      if (err.message.includes('429')) {
        console.warn(`[DoraAPI] Rate limited (429), retrying in ${delay * (i + 1)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function get_committee_info(args, session) {
  const network = session?.settings?.network || args.network || 'mainnet';
  const url = `https://dora.coz.io/api/v2/neo3/${network}/committee`;
  
  return await withRetry(async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    
    return {
      success: true,
      network,
      committee: data
    };
  }, 3, 1000).catch(err => ({
    success: false,
    error: `Failed to fetch committee info: ${err.message}`
  }));
}
