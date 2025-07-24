import express, { Request, Response } from 'express';
import { config } from './config';
import logger from './logger';
import { requestTestnetSui } from './faucet';
import { FaucetRequest } from './types';
import cors from "cors"
import { ipLimiter, walletLimiter } from './middlewares/ratelimiters';
import dotenv from "dotenv";
import { initializeMongoDB } from './db';

const app = express();
dotenv.config();
app.use(cors())
// app.set('trust proxy', true);
app.use(express.json());

app.get("/",(req,res)=>{
  res.send("Hello server is fine");
})

app.post('/api/faucet',[ipLimiter,walletLimiter], async (req: Request, res: Response) => {

   // Safely check req.body before destructuring
    if (!req.body || typeof req.body !== 'object' || !('walletAddress' in req.body)) {
      logger.warn('Missing walletAddress in request body');
      return res.status(400).json({ error: 'walletAddress is required' });
    }

  const { walletAddress }: FaucetRequest = req.body;

    // Extract IP address (same logic as ipLimiter)
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] || req.ip || 'unknown-ip';

  // Basic wallet address validation (Sui addresses are 64 hex chars with 0x prefix)
  if (!walletAddress || !/^0x[a-fA-F0-9]{64}$/.test(walletAddress)) {
    logger.warn(`Invalid wallet address: ${walletAddress}`);
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    const success = await requestTestnetSui(walletAddress,ipAddress);
    if (success) {
      res.status(200).json({ message: 'SUI tokens sent successfully',tx:success.txDigest });
    } else {
      res.status(500).json({ error: 'Failed to send SUI tokens' });
    }
  } catch (error:any) {
    logger.error(`Error in faucet endpoint: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const port = process.env.PORT || config.port;

initializeMongoDB();

app.listen(port, () => {
  logger.info(`Server running on port ${config.port}`);
});