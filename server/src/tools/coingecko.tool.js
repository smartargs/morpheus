/**
 * Tools that interact with the CoinGecko API
 */

async function withRetry(action, maxRetries = 3, delay = 2000) {
  let lastError = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (err) {
      lastError = err;
      if (err.message.includes('429')) {
        console.warn(`[CoinGecko] Rate limited (429), retrying in ${delay * (i + 1)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function get_asset_prices() {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=neo,gas&vs_currencies=usd&include_24hr_change=true';
  
  try {
    return await withRetry(async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      return {
        success: true,
        prices: {
          neo: {
            usd: data.neo?.usd,
            usd_24h_change: data.neo?.usd_24h_change
          },
          gas: {
            usd: data.gas?.usd,
            usd_24h_change: data.gas?.usd_24h_change
          }
        }
      };
    }, 3, 2000);
  } catch (err) {
    return {
      success: false,
      error: `Failed to fetch prices from CoinGecko: ${err.message}`
    };
  }
}
