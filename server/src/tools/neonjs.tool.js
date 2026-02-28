/**
 * Local tools using neon-js and wallet service
 * for private key operations.
 */
import * as walletService from '../services/wallet.service.js';

export async function create_wallet(args) {
  const { label } = args;
  const newWallet = await walletService.createWallet(label || 'Neo Wallet');
  return {
    success: true,
    message: `A new Neo N3 wallet has been created locally with the label "${newWallet.label}".`,
    wallet: {
      label: newWallet.label,
      address: newWallet.address,
      wif: '(Saved locally, only visible on the Wallets page)'
    }
  };
}

export async function transfer_assets(args, session) {
  const result = await walletService.performTransfer(
    args.fromAddress,
    args.toAddress,
    args.amount,
    args.asset,
    session.settings.network
  );
  return {
    success: true,
    result: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
  };
}
