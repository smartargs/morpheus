import { v4 as uuidv4 } from 'uuid';
import { callTool } from './mcp.service.js';
import db from '../database/sqlite.js';
import * as neonService from './neonjs.service.js';

const wallets = new Map();
const selectedWalletIds = new Set();

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
  return Array.from(wallets.values()).map((w) => ({
    ...w,
    selected: selectedWalletIds.has(w.id),
  }));
}

export function getSelectedWallets() {
  return Array.from(wallets.values()).filter((w) => selectedWalletIds.has(w.id));
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
    selectedWalletIds.delete(id);
  }
  return deleted;
}

export function updateSelection(walletIds = []) {
  selectedWalletIds.clear();
  for (const id of walletIds) {
    if (wallets.has(id)) selectedWalletIds.add(id);
  }
  return getSelectedWallets();
}

/**
 * Data Aggregation & Logic
 */

export async function getBalance(address) {
  try {
    const result = await callTool('get_balance', { address });
    const content = result.content?.[0]?.text;
    try {
      return JSON.parse(content);
    } catch {
      return { raw: content };
    }
  } catch {
    return { neo: '—', gas: '—', error: 'Could not fetch balance' };
  }
}

export async function listWalletsWithBalances() {
  const all = listWallets();
  return await Promise.all(
    all.map(async (w) => {
      const balance = await getBalance(w.address);
      return { ...w, balance };
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
