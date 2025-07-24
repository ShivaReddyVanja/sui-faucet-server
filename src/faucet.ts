import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction as SuiTransaction } from '@mysten/sui/transactions';
import { config } from './config';
import logger from './logger';
import { bech32 } from 'bech32';
import { Transaction } from './models/transactions';

export async function requestTestnetSui(walletAddress: string, ipAddress: string): Promise<{ success: boolean; txDigest?: string }> {
  let txDigest: string | undefined;
  let success = false;

  try {
    // Initialize Sui client with testnet RPC
    const client = new SuiClient({ url: config.suiTestnetRpc });

    const bech32PrivateKey = config.faucetWalletPrivateKey;
    const { prefix, words } = bech32.decode(bech32PrivateKey);
    if (prefix !== 'suiprivkey') {
      throw new Error('Invalid Sui private key prefix');
    }

    const privateKeyBytesWithFlag = bech32.fromWords(words);
    const privateKeyBytes = privateKeyBytesWithFlag.slice(1);
    const base64PrivateKey = Buffer.from(privateKeyBytes).toString('base64');
    const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(base64PrivateKey, 'base64'));

    // Create a transaction to transfer 0.01 SUI
    const tx = new SuiTransaction();
    const [coin] = tx.splitCoins(tx.gas, [1_000_000_0]); // 0.01 SUI in MIST
    tx.transferObjects([coin], walletAddress);

    logger.info(`Requesting 0.01 SUI for address: ${walletAddress}`);

    // Execute the transaction
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
    });

    // Wait for transaction confirmation
    await client.waitForTransaction({
      digest: result.digest,
      options: { showEffects: true },
    });

    txDigest = result.digest;
    success = true;

    logger.info(`Successfully sent 0.01 SUI to ${walletAddress}, tx digest: ${result.digest}`);
  } catch (error: any) {
    logger.error(`Error processing faucet request for ${walletAddress}: ${error.message}`);
  }

  // Save transaction to database (success or failure)
  const response = await Transaction.create({
    walletAddress,
    ipAddress,
    txHash: txDigest || 'failed',
    amount: 1_000_000_0, // 0.01 SUI in MIST
    timestamp: new Date(),
    status: success ? 'success' : 'failed'
  });

 
  return { success, txDigest };
}