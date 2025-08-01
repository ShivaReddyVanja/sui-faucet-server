import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { configLoader } from './../utils/faucetConfigLoader';

dotenv.config();

const url = process.env.CACHE_URL || 'localhost';
export const redisClient = new Redis({
  host:url,
  port: 6379,
  enableOfflineQueue: false,
  tls: {},
});

// These will be initialized later
let ipRateLimiter: RateLimiterRedis;
let walletRateLimiter: RateLimiterRedis;

// Call this once AFTER config is loaded
export async function initRateLimiters() {
  const config = configLoader.get(); // Now it's safe

  ipRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'faucet_ip',
    points: config.maxRequestsPerIp,
    duration: config.cooldownSeconds,
    blockDuration: config.cooldownSeconds,
  });

  walletRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'faucet_wallet',
    points: config.maxRequestsPerWallet,
    duration: config.cooldownSeconds,
    blockDuration: config.cooldownSeconds,
  });

  console.log('[RateLimiter] Initialized');
}

type KeyFunction = (req: Request) => string;

const rateLimitMiddleware = (
  limiterGetter: () => RateLimiterRedis,
  keyFn: KeyFunction
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn(req);

    try {
      await limiterGetter().consume(key);
      next();
    } catch (rejRes: any) {
      const msBeforeNext = typeof rejRes?.msBeforeNext === 'number' ? rejRes.msBeforeNext : 0;
      const retryAfter = Math.ceil(msBeforeNext / 1000);
      const retryAt = isFinite(msBeforeNext)
        ? new Date(Date.now() + msBeforeNext).toISOString()
        : null;

      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        retryAfter,
        retryAt,
        error: 'Rate limit exceeded. Please try again later.',
        key,
      });
    }
  };
};

export const ipLimiter = rateLimitMiddleware(() => ipRateLimiter, (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  return Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] || req.ip || 'unknown-ip';
});

export const walletLimiter = rateLimitMiddleware(() => walletRateLimiter, (req) => req.body.walletAddress);
