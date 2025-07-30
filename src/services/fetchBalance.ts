import { SuiClient } from '@mysten/sui/client'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { bech32 } from 'bech32'
import { config } from '../config'
import logger from '../logger'

export async function getFaucetWalletBalance(): Promise<{
  success: boolean
  address?: string
  balance: string
}> {
  try {
    // 1. Decode the bech32 private key
    const bech32PrivateKey = config.faucetWalletPrivateKey
    const { prefix, words } = bech32.decode(bech32PrivateKey)

    if (prefix !== 'suiprivkey') {
      throw new Error('Invalid Sui private key prefix')
    }

    const privateKeyBytesWithFlag = bech32.fromWords(words)
    const privateKeyBytes = privateKeyBytesWithFlag.slice(1)
    const base64PrivateKey = Buffer.from(privateKeyBytes).toString('base64')

    // 2. Create keypair and extract address
    const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(base64PrivateKey, 'base64'))
    const address = keypair.getPublicKey().toSuiAddress()

    // 3. Fetch balance
    const client = new SuiClient({ url: config.suiTestnetRpc })
    const { totalBalance } = await client.getBalance({ owner: address })

    logger.info(`Faucet wallet balance for ${address}: ${totalBalance} MIST`)

    return {
      success: true,
      address,
      balance: totalBalance.toString(),
    }
  } catch (error: any) {
    logger.error(`Failed to fetch faucet wallet balance: ${error.message}`)
    return { success: false,balance:'0' }
  }
}
