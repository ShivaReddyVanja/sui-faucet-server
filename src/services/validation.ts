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
});

