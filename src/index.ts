import express, { Request, Response } from 'express';
import { config } from './config';
import logger from './logger';
import { requestTestnetSui } from './faucet';
import { FaucetRequest } from './types';
import cors from "cors"
import { ipLimiter, walletLimiter } from './middlewares/ratelimiters';
import dotenv from "dotenv";

const app = express();
dotenv.config();
app.use(cors())
app.set('trust proxy', true);
app.use(express.json());



app.post('/api/faucet',  [ipLimiter, walletLimiter], async (req: Request, res: Response) => {
  const { walletAddress }: FaucetRequest = req.body;

  // Basic wallet address validation (Sui addresses are 64 hex chars with 0x prefix)
  if (!walletAddress || !/^0x[a-fA-F0-9]{64}$/.test(walletAddress)) {
    logger.warn(`Invalid wallet address: ${walletAddress}`);
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    const success = await requestTestnetSui(walletAddress);
    if (success) {
      res.status(200).json({ message: 'SUI tokens sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send SUI tokens' });
    }
  } catch (error:any) {
    logger.error(`Error in faucet endpoint: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});
const port = process.env.PORT || config.port;

app.listen(port, () => {
  logger.info(`Server running on port ${config.port}`);
});