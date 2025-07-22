import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import dotenv from "dotenv";

dotenv.config();

const url = process.env.CACHE_URL || "localhost";

const redisClient = new Redis({
  host: url, 
  port: 6379,
  enableOfflineQueue: false,
   tls: {},
});

export const ipRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'faucet_ip',
  points: 1, // 1 request
  duration: 24 * 60 * 60, // per 24 hours
  blockDuration: 24 * 60 * 60, // block for 24 hours after limit reached
});

export const walletRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'faucet_wallet',
  points: 1,
  duration: 24 * 60 * 60,
  blockDuration: 24 * 60 * 60,
});

type KeyFunction = (req: Request) => string;

const rateLimitMiddleware = (limiter: RateLimiterRedis, keyFn: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn(req);
    console.log(`[RateLimiter] Trying key: ${key}`);

    try {
      await limiter.consume(key);
      next();
    } catch (rejRes: any) {
      const msBeforeNext = typeof rejRes?.msBeforeNext === 'number' ? rejRes.msBeforeNext : 0;
      const retryAfter = Math.ceil(msBeforeNext / 1000);
      const retryAt = isFinite(msBeforeNext)
        ? new Date(Date.now() + msBeforeNext).toISOString()
        : null;

      console.warn(`[RateLimiter] Blocked key: ${key} — retry after ${retryAfter}s`);

      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        retryAfter,
        retryAt,
        error: 'Rate limit exceeded. Please try again later.',
      });
    }
  };
};

export const ipLimiter = rateLimitMiddleware(ipRateLimiter, (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  console.log(ip || req.ip ||'unknown-ip')
  return ip || req.ip || 'unknown-ip';
});

export const walletLimiter = rateLimitMiddleware(walletRateLimiter, (req) => req.body.walletAddress);

