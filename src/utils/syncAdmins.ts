// src/scripts/syncAdmins.ts
import prisma from '../lib/prisma';
import logger from '../logger';
import dotnev from "dotenv";

dotnev.config();

const Wallets = process.env.ADMIN_WALLETS

if(!Wallets){
    throw new Error("No admin wallet addresses found in the .env file,you cannot monitor or configure without admin access");
}

export const syncAdminsFromEnv = async () => {
  const adminWallets = Wallets
    .split(',')
    .map((addr) => addr.trim().toLowerCase())
    .filter(Boolean);

  if (adminWallets.length === 0) {
    logger.warn('No admin wallets found in ADMIN_WALLETS');
    return;
  }
  
  logger.info('Syncing admin wallets from .env:', adminWallets);

  const existingAdmins = await prisma.adminUser.findMany();
  const existingWallets = existingAdmins.map((a) => a.walletAddress.toLowerCase());

  // Create new admins if not present
  for (const wallet of adminWallets) {
    if (!existingWallets.includes(wallet)) {
      await prisma.adminUser.create({
        data: {
          walletAddress: wallet,
          role: 'admin',
          isActive: true,
        },
      });
      logger.info(`Created admin: ${wallet}`);
    }
  }

  // Delete admins not in the list
  for (const admin of existingAdmins) {
    const wallet = admin.walletAddress.toLowerCase();
    if (!adminWallets.includes(wallet)) {
      await prisma.adminUser.delete({
        where: { walletAddress: admin.walletAddress },
      });
      logger.info(`Removed admin: ${wallet}`);
    }
  }

  logger.info('✅ Admin sync completed');
};
