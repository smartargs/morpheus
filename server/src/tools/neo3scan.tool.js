/**
 * Tools that interact with the Neo3Scan API
 */

async function withRetry(action, maxRetries = 3, delay = 1000) {
  let lastError = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (err) {
      lastError = err;
      if (err.message.includes('429')) {
        console.warn(`[Neo3Scan] Rate limited (429), retrying in ${delay * (i + 1)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function get_statistics(args, session) {
  const network = args.network || session?.settings?.network || 'mainnet';
  const baseUrl = network.toLowerCase() === 'testnet' 
    ? 'https://testnet.neo3scan.com/neotube-api'
    : 'https://www.neo3scan.com/neotube-api';
    
  const url = `${baseUrl}/v1/statistics`;
  
  return await withRetry(async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    
    if (result.status !== 'success') {
      throw new Error(`Neo3Scan error: ${result.message || 'Unknown error'}`);
    }
    
    return {
      success: true,
      network,
      statistics: result.data
    };
  }, 3, 1000).catch(err => ({
    success: false,
    error: `Failed to fetch Neo3Scan statistics: ${err.message}`
  }));
}

export async function get_asset_infos(args, session) {
  const network = args.network || session?.settings?.network || 'mainnet';
  const baseUrl = network.toLowerCase() === 'testnet' 
    ? 'https://testnet.neo3scan.com/neotube-api'
    : 'https://www.neo3scan.com/neotube-api';
    
  const url = `${baseUrl}/v1/rpc`;
  
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'GetAssetInfos',
    params: {
      Standard: args.standard || 'NEP17',
      Limit: args.limit || 20,
      Skip: args.skip || 0
    }
  };
  
  return await withRetry(async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    
    if (result.error) throw new Error(`Neo3Scan RPC error: ${result.error.message || 'Unknown error'}`);
    
    return {
      success: true,
      network,
      assets: result.result?.result || [],
      totalCount: result.result?.totalCount || 0
    };
  }, 3, 1500).catch(err => ({
    success: false,
    error: `Failed to fetch asset infos: ${err.message}`
  }));
}
