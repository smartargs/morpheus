import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

let client = null;
let transport = null;
let connecting = false;

export async function initMcpClient(network = 'testnet') {
  if (client) return client;
  if (connecting) return null;
  connecting = true;

  console.log('[MCP] Spawning Neo N3 MCP server via npx (this may take a moment)...');

  try {
    transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@r3e/neo-n3-mcp'],
      env: { ...process.env, NEO_NETWORK: network },
    });

    client = new Client({ name: 'neo-n3-assistant', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);
    console.log('[MCP] Connected to Neo N3 MCP server');
    connecting = false;
    return client;
  } catch (err) {
    console.warn(`[MCP] Failed to connect: ${err.message}`);
    connecting = false;
    client = null;
    transport = null;
    throw err;
  }
}

export async function listTools() {
  if (!client) return [];
  try {
    const result = await client.listTools();
    return result.tools;
  } catch (err) {
    console.warn('[MCP] listTools failed:', err.message);
    return [];
  }
}

export async function callTool(name, args = {}) {
  if (!client) throw new Error('MCP client not connected');
  const result = await client.callTool({ name, arguments: args });
  return result;
}

export function isMcpConnected() {
  return !!client;
}

export async function closeMcpClient() {
  if (transport) {
    try { await transport.close(); } catch { /* ignore */ }
    client = null;
    transport = null;
  }
}
