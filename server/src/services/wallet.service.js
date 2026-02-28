import { wallet, CONST, rpc, sc, tx, u } from '@cityofzion/neon-js';
import { v4 as uuidv4 } from 'uuid';
import { callTool } from './mcp.service.js';
import { NETWORK_CONFIG } from '../config/networks.js';

const wallets = new Map();
const selectedWalletIds = new Set();

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
  const account = new wallet.Account();
  const newWallet = {
    id: uuidv4(),
    label,
    address: account.address,
    publicKey: account.publicKey,
    wif: account.WIF,
    createdAt: Date.now(),
  };
  wallets.set(newWallet.id, newWallet);
  return newWallet;
}

export function importWallet(label, address, wif = '') {
  let finalAddress = address;
  let publicKey = '';

  if (wif) {
    try {
      const account = new wallet.Account(wif);
      finalAddress = account.address;
      publicKey = account.publicKey;
    } catch (err) {
      console.warn('[WalletService] WIF provided but could not be parsed:', err.message);
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
  return newWallet;
}

export function updateSelection(walletIds = []) {
  selectedWalletIds.clear();
  for (const id of walletIds) {
    if (wallets.has(id)) selectedWalletIds.add(id);
  }
  return getSelectedWallets();
}

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

export async function performTransfer(fromAddress, toAddress, amount, asset, network = 'testnet') {
  const config = NETWORK_CONFIG[network] || NETWORK_CONFIG.testnet;
  const wif = getWifByAddress(fromAddress);
  
  if (!wif) throw new Error(`No private key (WIF) found for address ${fromAddress}. Please import it first.`);
  
  const fromAccount = new wallet.Account(wif);
  const rpcClient = new rpc.RPCClient(config.rpcUrl);
  
  let assetHash = asset;
  if (asset.toUpperCase() === 'NEO') assetHash = CONST.NATIVE_CONTRACT_HASH.NeoToken;
  if (asset.toUpperCase() === 'GAS') assetHash = CONST.NATIVE_CONTRACT_HASH.GasToken;
  
  const script = sc.createScript({
    scriptHash: assetHash,
    operation: 'transfer',
    args: [
      sc.ContractParam.hash160(fromAddress),
      sc.ContractParam.hash160(toAddress),
      amount,
      sc.ContractParam.any(),
    ],
  });

  const currentHeight = await rpcClient.getBlockCount();
  const transaction = new tx.Transaction({
    signers: [{
      account: fromAccount.scriptHash,
      scopes: tx.WitnessScope.CalledByEntry,
    }],
    validUntilBlock: currentHeight + 1000,
    script: script,
  });

  const invokeResponse = await rpcClient.invokeScript(u.HexString.fromHex(transaction.script), [{
    account: fromAccount.scriptHash,
    scopes: tx.WitnessScope.CalledByEntry,
  }]);
  if (invokeResponse.state !== 'HALT') throw new Error(`Transfer simulation failed: ${invokeResponse.exception}`);
  transaction.systemFee = u.BigInteger.fromNumber(invokeResponse.gasconsumed);

  const feePerByteResponse = await rpcClient.invokeFunction(CONST.NATIVE_CONTRACT_HASH.PolicyContract, 'getFeePerByte');
  const feePerByte = u.BigInteger.fromNumber(feePerByteResponse.stack[0].value);
  const transactionByteSize = transaction.serialize().length / 2 + 109;
  const witnessProcessingFee = u.BigInteger.fromNumber(1000390);
  transaction.networkFee = feePerByte.mul(transactionByteSize).add(witnessProcessingFee);

  const signedTransaction = transaction.sign(fromAccount, config.magic);
  return await rpcClient.sendRawTransaction(u.HexString.fromHex(signedTransaction.serialize(true)));
}
