import { NETWORK_CONFIG } from '../config/networks.js';

/**
 * Smart RPC Executor with failover using raw Fetch.
 * Supports both GET and POST as per Neo N3 docs.
 */
export async function withRpcFailover(network, method, params = [], preferGet = false) {
  const config = NETWORK_CONFIG[network] || NETWORK_CONFIG.testnet;
  const urls = config.rpcUrls;
  let lastError = null;

  for (const url of urls) {
    try {
      let response;
      if (preferGet) {
        // GET request format: ?jsonrpc=2.0&method=...&params=[...]&id=1
        const queryParams = new URLSearchParams({
          jsonrpc: '2.0',
          method: method,
          params: JSON.stringify(params),
          id: '1'
        });
        const getUrl = `${url.includes('?') ? url + '&' : url + '?'}${queryParams.toString()}`;
        response = await fetch(getUrl, { method: 'GET' });
      } else {
        // POST request format: JSON body
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method,
            params
          })
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message || 'RPC Error');
      }

      return result.result;
    } catch (err) {
      console.warn(`[RpcService] RPC ${preferGet ? 'GET' : 'POST'} call (${method}) failed on ${url}, trying next...`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All RPC endpoints failed for ${network}. Last error: ${lastError?.message}`);
}

/**
 * High-level RPC query helper.
 */
export async function queryRpc(method, params = [], network = 'testnet') {
  // We'll default to POST as it's more standard for N3 node interaction, 
  // but the service now supports GET if needed.
  return await withRpcFailover(network, method, params);
}
