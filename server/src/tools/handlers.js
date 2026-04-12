import * as dora from './dora.tool.js';
import * as neonjs from './neonjs.tool.js';
import * as neo3scan from './neo3scan.tool.js';
import * as coingecko from './coingecko.tool.js';
import * as rpc from './rpc.tool.js';
import * as news from './news.tool.js';

/**
 * Dispatches to origin-based tool modules.
 */
export async function executeLocalTool(toolName, toolArgs, session) {
  const name = toolName;
  const args = toolArgs;
  
  // Handle RPC tools separately to keep the switch clean
  if (name.startsWith('rpc_')) {
    return await rpc.executeRpcTool(name, args, session);
  }

  switch (name) {
    // Coingecko Price Data
    case 'get_asset_prices':
      return await coingecko.get_asset_prices();

    // Dora API tools
    case 'get_committee_info':
      return await dora.get_committee_info(args, session);

    // Neo3Scan tools
    case 'get_statistics':
      return await neo3scan.get_statistics(args, session);
    case 'get_asset_infos':
      return await neo3scan.get_asset_infos(args, session);

    // NeonJS / Wallet tools
    case 'create_wallet':
      return await neonjs.create_wallet(args);
    case 'transfer_assets':
      return await neonjs.transfer_assets(args, session);

    // News
    case 'get_neo_news':
      return await news.get_neo_news(args);

    default:
      throw new Error(`Local tool handler for "${name}" not implemented.`);
  }
}
