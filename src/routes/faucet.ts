import express, { Request, Response } from 'express';
import logger from './../logger';
import { requestTestnetSui } from './../services/requestFaucet';
import { FaucetRequest } from './../types';
import { ipLimiter, walletLimiter } from './../middlewares/ratelimiters';
import { PrismaClient } from './../generated/prisma';
import { configLoader } from '../utils/faucetConfigLoader';
import { FaucetRequestSchema } from '../services/validation';

const router = express();
const prisma = new PrismaClient();


router.post('/faucet', [ipLimiter, walletLimiter], async (req: Request, res: Response) => {
    const config = await configLoader.get();
    if (!config.enabled) {
        return res.status(403).json({ error: 'Faucet is disabled' });
    }
    const parseResult = FaucetRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
    logger.warn('Invalid faucet request:', parseResult.error.flatten());
    return res.status(400).json({
      error: 'Invalid request',
      issues: parseResult.error.flatten().fieldErrors,
    });
  }

    const { walletAddress }: FaucetRequest = req.body;

    // Extract IP address (same logic as ipLimiter)
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] || req.ip || 'unknown-ip';


    try {
        const amount = config.faucetAmount;
        const result = await requestTestnetSui(walletAddress, ipAddress,amount );
        await prisma.faucetRequest.create({
            data: {
                walletAddress,
                ipAddress,
                txHash: result.success ? result.txDigest : null,
                amount, // in MIST (1 sui =10^9 MIST)
                status: result.success ? 'success' : 'failed',
                failureReason: result.success ? null : 'transaction_failed',
                userAgent: req.headers['user-agent'] || 'unknown',
            },
        });
        if (result.success) {
            res.status(200).json({ message: 'SUI tokens sent successfully', tx: result.txDigest });
        } else {
            res.status(500).json({ error: 'Failed to send SUI tokens' });
        }
    } catch (error: any) {
        logger.error(`Error in faucet endpoint: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;