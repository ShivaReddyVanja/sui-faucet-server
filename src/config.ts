import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  suiTestnetRpc: process.env.SUI_TESTNET_RPC || 'https://fullnode.testnet.sui.io:443',
  faucetWalletPrivateKey: process.env.FAUCET_WALLET_PRIVATE_KEY || '',
};