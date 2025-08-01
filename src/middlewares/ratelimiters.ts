import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { configLoader } from './../utils/faucetConfigLoader';

dotenv.config();

const url = process.env.CACHE_URL || 'localhost';

export const redisClient = new Redis({
  host: url,
  port: 6379,
  enableOfflineQueue: false,
  tls: {},
});

let ipRateLimiter: RateLimiterRedis;
let walletRateLimiter: RateLimiterRedis;

export async function initRateLimiters() {
  const config = configLoader.get();

  ipRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'faucet_ip',
    points: config.maxRequestsPerIp,
    duration: config.cooldownSeconds,
    blockDuration: 0, // important: avoid hard blocking
  });

  walletRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'faucet_wallet',
    points: config.maxRequestsPerWallet,
    duration: config.cooldownSeconds,
    blockDuration: 0, // important: avoid hard blocking
  });

  console.log('[RateLimiter] Initialized');
}

// Get IP from request headers
function getIpKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  return Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0] || req.ip || 'unknown-ip';
}

// Combined IP + Wallet limiter middleware
export async function faucetRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ipKey = getIpKey(req);
  const walletKey = req.body.walletAddress;

  // Check IP first
  try {
    await ipRateLimiter.consume(ipKey);
  } catch (ipRej: any) {
    const ms = ipRej?.msBeforeNext || 0;
    const retryAfter = Math.ceil(ms / 1000);
    const retryAt = new Date(Date.now() + ms).toISOString();

    return res.status(429).set('Retry-After', retryAfter.toString()).json({
      error: 'Too many requests from this IP. Please try again later.',
      retryAfter,
      retryAt,
      key: ipKey,
      type: 'ip',
    });
  }

  // Then check Wallet
  try {
    await walletRateLimiter.consume(walletKey);
  } catch (walletRej: any) {
    const ms = walletRej?.msBeforeNext || 0;
    const retryAfter = Math.ceil(ms / 1000);
    const retryAt = new Date(Date.now() + ms).toISOString();

    return res.status(429).set('Retry-After', retryAfter.toString()).json({
      error: 'Too many requests for this wallet. Please try again later.',
      retryAfter,
      retryAt,
      key: walletKey,
      type: 'wallet',
    });
  }

  // Allowed
  next();
}
