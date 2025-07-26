import prisma from '../lib/prisma';
import logger from '../logger';

type FaucetConfig = {
  cooldownSeconds: number;
  faucetAmount: number;
  enabled: boolean;
  maxRequestsPerIp: number;
  maxRequestsPerWallet: number;
};

let cachedConfig: FaucetConfig | null = null;

export const configLoader = {
  async load() {
    try {
      const config = await prisma.faucetConfig.findUnique({ where: { id: 1 } });

      if (!config) {
        throw new Error('FaucetConfig not found in database');
      }

      cachedConfig = {
        cooldownSeconds: config.cooldownSeconds,
        faucetAmount: Number(config.faucetAmount)*1000_000_000,
        enabled: config.enabled,
        maxRequestsPerIp: config.maxRequestsPerIp,
        maxRequestsPerWallet: config.maxRequestsPerWallet,
      };

      logger.info('Faucet config loaded and cached');
    } catch (error: any) {
      logger.error(`Failed to load faucet config: ${error.message}`);
    }
  },

  get(): FaucetConfig {
    if (!cachedConfig) {
      throw new Error('Faucet config not loaded yet');
    }
    return cachedConfig;
  },

  async reload() {
    logger.info('Reloading faucet config...');
    await this.load();
  },
};
