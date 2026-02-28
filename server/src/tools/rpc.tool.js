import * as rpcService from '../services/rpc.service.js';
import { LOCAL_TOOL_DEFINITIONS } from './definitions.js';

/**
 * Executes an RPC tool by mapping its schema-defined parameters to a positional array
 * for the Neo N3 node, as required by the JSON-RPC spec.
 */
export async function executeRpcTool(toolName, toolArgs, session) {
  const method = toolName.replace('rpc_', '');
  const network = toolArgs.network || session?.settings?.network || 'testnet';
  
  // Find the tool definition to get the correct positional order
  const def = LOCAL_TOOL_DEFINITIONS.find(d => d.name === toolName);
  const rpcParams = [];

  if (def?.input_schema?.properties) {
    const propKeys = Object.keys(def.input_schema.properties);
    for (const key of propKeys) {
      if (key !== 'network' && toolArgs[key] !== undefined) {
        rpcParams.push(toolArgs[key]);
      }
    }
  }

  try {
    const result = await rpcService.queryRpc(method, rpcParams, network);
    return {
      success: true,
      method,
      network,
      result
    };
  } catch (err) {
    return {
      success: false,
      error: `RPC call failed: ${err.message}`
    };
  }
}
