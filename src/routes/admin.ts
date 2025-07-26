import express from 'express';
import prisma from '../lib/prisma';
import { AdminConfigSchema } from './../services/validation';
import { configLoader } from '../utils/faucetConfigLoader';
import logger from '../logger';

const router = express();

router.post('/admin/config/update', async (req, res) => {
  const parseResult = AdminConfigSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: parseResult.error.flatten(),
    });
  }

  const validatedData = parseResult.data;

  try {
    const updated = await prisma.faucetConfig.update({
      where: { id: 1 },
      data: validatedData, // only valid + defined keys
    });

    await configLoader.reload();

    res.json({ success: true, config: updated });
  } catch (err: any) {
    logger.error('❌ Failed to update faucet config:', err.message);
    res.status(500).json({ error: 'Failed to update faucet config' });
  }
});

router.get('/admin/analytics', async (req, res) => {
  try {
    const [
      totalRequests,
      totalSuccess,
      totalFailed,
      totalTokensDispensed,
      recentRequests,
      topWallets,
      topIps,
    ] = await Promise.all([
      prisma.faucetRequest.count(),
      prisma.faucetRequest.count({ where: { status: 'success' } }),
      prisma.faucetRequest.count({ where: { status: 'failed' } }),
      prisma.faucetRequest.aggregate({
        _sum: { amount: true },
        where: { status: 'success' },
      }),
      prisma.faucetRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.faucetRequest.groupBy({
        by: ['walletAddress'],
        _count: true,
        orderBy: { _count: { walletAddress: 'desc' } },
        take: 5,
      }),
      prisma.faucetRequest.groupBy({
        by: ['ipAddress'],
        _count: true,
        orderBy: { _count: { ipAddress: 'desc' } },
        take: 5,
      }),
    ]);

    res.json({
      totals: {
        requests: totalRequests,
        success: totalSuccess,
        failed: totalFailed,
        tokensDispensed: totalTokensDispensed._sum.amount || 0,
      },
      recent: recentRequests,
      topWallets,
      topIps,
    });
  } catch (err: any) {
    logger.error('❌ Failed to fetch analytics:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/admin/analytics/timeseries', async (req, res) => {
  try {
    const range = (req.query.range as string) || '7d';
    const granularity = (req.query.granularity as string) || 'daily';

    // Parse time window
    let interval = `7 days`;
    if (range === '24h') interval = `24 hours`;
    if (range === '30d') interval = `30 days`;

    let timeTrunc = 'DATE("createdAt")';
    if (granularity === 'hourly') {
      timeTrunc = `DATE_TRUNC('hour', "createdAt")`;
    }

    const results = await prisma.$queryRawUnsafe<
      {
        time: string;
        total: number;
        success: number;
        failed: number;
        tokens: bigint;
      }[]
    >(`
      SELECT 
        ${timeTrunc} AS time,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'success') AS success,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed,
        SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) AS tokens
      FROM "FaucetRequest"
      WHERE "createdAt" >= NOW() - INTERVAL '${interval}'
      GROUP BY time
      ORDER BY time ASC
    `);
    // After fetching `results`
   const safeResults = results.map((row) => ({
  time: row.time,
  total: Number(row.total),                     // bigint → number
  success: Number(row.success),                 // bigint → number
  failed: Number(row.failed),                   // bigint → number
  tokens: Number(row.tokens?.toString() || 0),  // Decimal → number
}));


    res.json({ granularity, range, data: safeResults });

  } catch (err: any) {
    logger.error('❌ Failed to fetch timeseries analytics:', err);
    console.log(err)
    res.status(500).json({ error: 'Failed to fetch time-series analytics' });
  }
});
export default router;
