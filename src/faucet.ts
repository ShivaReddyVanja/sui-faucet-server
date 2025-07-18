import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { config } from './config';
import logger from './logger';
import { bech32 } from 'bech32';

export async function requestTestnetSui(walletAddress: string): Promise<boolean> {
    try {
        // Initialize Sui client with testnet RPC
        const client = new SuiClient({ url: config.suiTestnetRpc });

        const bech32PrivateKey = config.faucetWalletPrivateKey;

        const { prefix, words } = bech32.decode(bech32PrivateKey);

        // Ensure the prefix is correct
        if (prefix !== 'suiprivkey') {
            throw new Error('Invalid Sui private key prefix');
        }

        // 2. Convert 5-bit words to 8-bit bytes and extract the private key
        // The first byte of the data words is the signature scheme flag.
        // The rest are the private key bytes.
        const privateKeyBytesWithFlag = bech32.fromWords(words);
        const privateKeyBytes = privateKeyBytesWithFlag.slice(1); // Remove the flag byte

        // 3. Encode the private key bytes to Base64
        const base64PrivateKey = Buffer.from(privateKeyBytes).toString('base64');

        // Load faucet wallet keypair
        const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(base64PrivateKey, 'base64'));

        // Create a transaction to transfer 1 SUI
        const tx = new Transaction();
        const [coin] = tx.splitCoins(tx.gas, [1_000]); // 1 SUI in MIST (SUI has 9 decimals)
        tx.transferObjects([coin], walletAddress);

        logger.info(`Requesting 1 SUI for address: ${walletAddress}`);

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

        logger.info(`Successfully sent 1 SUI to ${walletAddress}, tx digest: ${result.digest}`);
        return true;
    } catch (error: any) {
        logger.error(`Error processing faucet request for ${walletAddress}: ${error.message}`);
        return false;
    }
}