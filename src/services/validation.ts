import { z } from 'zod';

export const AdminConfigSchema = z.object({
  cooldownSeconds: z.number().int().positive().optional(),
  faucetAmount: z.number().positive().optional(),
  maxRequestsPerIp: z.number().int().nonnegative().optional(),
  maxRequestsPerWallet: z.number().int().nonnegative().optional(),
  enabled: z.boolean().optional(),
});

export const FaucetRequestSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Sui wallet address'),
  cfTurnstileToken: z.string().min(1, 'Turnstile token is required'),
});

// Validation schema for login
export const LoginSchema = z.object({
  walletAddress: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().min(1),
  signedBytes: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});