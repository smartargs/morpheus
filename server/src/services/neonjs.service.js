import { wallet, CONST, sc, tx, u } from '@cityofzion/neon-js';
import { NETWORK_CONFIG } from '../config/networks.js';
import * as rpcService from './rpc.service.js';

/**
 * Low-level Neo N3 blockchain operations using neon-js.
 */

export function createNewAccount() {
  const account = new wallet.Account();
  return {
    address: account.address,
    publicKey: account.publicKey,
    wif: account.WIF
  };
}

export function parseWif(wif) {
  try {
    const account = new wallet.Account(wif);
    return {
      address: account.address,
      publicKey: account.publicKey
    };
  } catch (err) {
    throw new Error(`Invalid WIF: ${err.message}`);
  }
}

export async function transferTokens(fromWif, toAddress, amount, asset, network = 'testnet') {
  const config = NETWORK_CONFIG[network] || NETWORK_CONFIG.testnet;
  const fromAccount = new wallet.Account(fromWif);
  
  let assetHash = asset;
  if (asset.toUpperCase() === 'NEO') assetHash = CONST.NATIVE_CONTRACT_HASH.NeoToken;
  if (asset.toUpperCase() === 'GAS') assetHash = CONST.NATIVE_CONTRACT_HASH.GasToken;
  
  const script = sc.createScript({
    scriptHash: assetHash,
    operation: 'transfer',
    args: [
      sc.ContractParam.hash160(fromAccount.address),
      sc.ContractParam.hash160(toAddress),
      amount,
      sc.ContractParam.any(),
    ],
  });

  const currentHeight = await rpcService.withRpcFailover(network, 'getblockcount');
  
  const transaction = new tx.Transaction({
    signers: [{
      account: fromAccount.scriptHash,
      scopes: tx.WitnessScope.CalledByEntry,
    }],
    validUntilBlock: currentHeight + 1000,
    script: script,
  });

  // Calculate fees using RPC
  const invokeResponse = await rpcService.withRpcFailover(network, 'invokescript', [
    u.HexString.fromHex(transaction.script).toString(),
    [{
      account: fromAccount.scriptHash,
      scopes: tx.WitnessScope.CalledByEntry,
    }]
  ]);
  
  if (invokeResponse.state !== 'HALT') {
    throw new Error(`Transfer simulation failed: ${invokeResponse.exception}`);
  }
  
  transaction.systemFee = u.BigInteger.fromNumber(invokeResponse.gasconsumed);

  const feePerByteResponse = await rpcService.withRpcFailover(network, 'invokefunction', [
    CONST.NATIVE_CONTRACT_HASH.PolicyContract,
    'getFeePerByte'
  ]);
  
  const feePerByte = u.BigInteger.fromNumber(feePerByteResponse.stack[0].value);
  const transactionByteSize = transaction.serialize().length / 2 + 109;
  const witnessProcessingFee = u.BigInteger.fromNumber(1000390);
  
  transaction.networkFee = feePerByte.mul(transactionByteSize).add(witnessProcessingFee);

  const signedTransaction = transaction.sign(fromAccount, config.magic);
  return await rpcService.withRpcFailover(network, 'sendrawtransaction', [
    u.HexString.fromHex(signedTransaction.serialize(true)).toString()
  ]);
}
