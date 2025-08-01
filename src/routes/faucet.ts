  import express, { Request, Response } from 'express';
  import logger from './../logger';
  import { requestTestnetSui } from './../services/requestFaucet';
  import { FaucetRequest } from './../types';
  import { faucetRateLimiter} from './../middlewares/ratelimiters';
  import { PrismaClient } from './../generated/prisma';
  import { configLoader } from '../utils/faucetConfigLoader';
  import { FaucetRequestSchema } from '../services/validation';


  const router = express();
  const prisma = new PrismaClient();

  router.post('/faucet', faucetRateLimiter, async (req: Request, res: Response) => {
    const config = await configLoader.get();
    if (!config.enabled) {
      return res.status(403).json({ status: 'error', error: 'Faucet is disabled' });
    }

    const parseResult = FaucetRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      logger.warn('Invalid faucet request:', parseResult.error.flatten());
      return res.status(400).json({
        status: 'error',
        error: 'Invalid request',
        issues: parseResult.error.flatten().fieldErrors,
      });
    }

    const { walletAddress}: FaucetRequest = req.body;

    // Extract IP address (same logic as ipLimiter)
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] || req.ip || 'unknown-ip';

    try {
      const amount = config.faucetAmount;
      const result = await requestTestnetSui(walletAddress, ipAddress, amount);
      const transaction = await prisma.faucetRequest.create({
        data: {
          walletAddress,
          ipAddress,
          txHash: result.success ? result.txDigest : null,
          amount, // in MIST (1 SUI = 10^9 MIST)
          status: result.success ? 'success' : 'failed',
          failureReason: result.success ? null : 'transaction_failed',
          userAgent: req.headers['user-agent'] || 'unknown',
        },
      });
      logger.info('Saved transaction in db', transaction);

      if (result.success) {
        return res.status(200).json({
          status: 'success',
          message: 'SUI tokens sent successfully',
          tx: result.txDigest,
        });
      } else {
        return res.status(500).json({
          status: 'error',
          error: 'Failed to send SUI tokens',
        });
      }
    } catch (error: any) {
      logger.error(`Error in faucet endpoint for wallet ${walletAddress}, IP ${ipAddress}: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        error: 'Internal server error',
      });
    }
  });

  export default router;