import { v4 as uuidv4 } from 'uuid';
import { callTool } from './mcp.service.js';
import db from '../database/sqlite.js';
import * as neonService from './neonjs.service.js';

const wallets = new Map();

// Persistence Helpers
function persistWallet(w) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO wallets (id, label, address, publicKey, wif, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(w.id, w.label, w.address, w.publicKey, w.wif, w.createdAt);
}

export function loadWallets() {
  const stmt = db.prepare('SELECT * FROM wallets ORDER BY createdAt DESC');
  const rows = stmt.all();
  for (const row of rows) {
    wallets.set(row.id, { ...row });
  }
}

/**
 * High-level Wallet Management
 */

export function listWallets() {
  return Array.from(wallets.values());
}

export function getWalletsByIds(walletIds = []) {
  if (!walletIds || !Array.isArray(walletIds)) return [];
  return walletIds
    .map(id => wallets.get(id))
    .filter(Boolean);
}

export async function createWallet(label = 'New Wallet') {
  const account = neonService.createNewAccount();
  const newWallet = {
    id: uuidv4(),
    label,
    address: account.address,
    publicKey: account.publicKey,
    wif: account.wif,
    createdAt: Date.now(),
  };
  wallets.set(newWallet.id, newWallet);
  persistWallet(newWallet);
  return newWallet;
}

export function importWallet(label, address, wif = '') {
  let finalAddress = address;
  let publicKey = '';

  if (wif) {
    try {
      const parsed = neonService.parseWif(wif);
      finalAddress = parsed.address;
      publicKey = parsed.publicKey;
    } catch (err) {
      console.warn('[WalletService] WIF parsing failed:', err.message);
    }
  }

  const newWallet = {
    id: uuidv4(),
    label: label || 'Imported Wallet',
    address: finalAddress,
    wif,
    publicKey,
    createdAt: Date.now(),
  };
  wallets.set(newWallet.id, newWallet);
  persistWallet(newWallet);
  return newWallet;
}

export function removeWallet(id) {
  const deleted = wallets.delete(id);
  if (deleted) {
    db.prepare('DELETE FROM wallets WHERE id = ?').run(id);
  }
  return deleted;
}

export function updateWallet(id, updates) {
  const w = wallets.get(id);
  if (!w) return null;

  const updated = { ...w, ...updates };
  wallets.set(id, updated);
  persistWallet(updated);
  return updated;
}

/**
 * Data Aggregation & Logic
 */

import * as rpcService from './rpc.service.js';

export async function fetchNetworkBalances(address, network = 'testnet') {
  try {
    // Fetch NEP-17 balances
    const nep17Data = await rpcService.withRpcFailover(network, 'getnep17balances', [address]);
    const nep17Raw = Array.isArray(nep17Data?.balance) ? nep17Data.balance : [];
    
    // Filter out 0 balances (some nodes return them)
    const nep17 = nep17Raw.filter(b => b.amount && b.amount !== '0');
    
    // Fetch NEP-11 balances (NFTs)
    let nep11Raw = [];
    try {
      const nep11Data = await rpcService.withRpcFailover(network, 'getnep11balances', [address]);
      nep11Raw = Array.isArray(nep11Data?.balance) ? nep11Data.balance : [];
    } catch (e) {
      console.warn(`[WalletService] NEP-11 fetch failed on ${network}:`, e.message);
    }

    // Filter out 0 balances for NFTs too
    const nep11 = nep11Raw.filter(b => b.amount && b.amount !== '0');

    return { nep17, nep11 };
  } catch (err) {
    console.warn(`[WalletService] Balance fetch failed on ${network} for ${address}:`, err.message);
    return { nep17: [], nep11: [], error: err.message };
  }
}

export async function getBalancesForAddress(address) {
  const [testnet, mainnet] = await Promise.all([
    fetchNetworkBalances(address, 'testnet'),
    fetchNetworkBalances(address, 'mainnet')
  ]);

  return { testnet, mainnet };
}

export async function listWalletsWithBalances() {
  const all = listWallets();
  return await Promise.all(
    all.map(async (w) => {
      const balances = await getBalancesForAddress(w.address);
      return { ...w, balances };
    })
  );
}

export function getWifByAddress(address) {
  const w = Array.from(wallets.values()).find((w) => w.address === address);
  return w ? w.wif : null;
}

/**
 * Blockchain Actions
 */

export async function performTransfer(fromAddress, toAddress, amount, asset, network = 'testnet') {
  const wif = getWifByAddress(fromAddress);
  if (!wif) {
    throw new Error(`No private key (WIF) found for address ${fromAddress}. Please import it first.`);
  }
  
  return await neonService.transferTokens(wif, toAddress, amount, asset, network);
}
