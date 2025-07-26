// //seed the initial faucet config details
// import prisma from "./../src/lib/prisma"

// async function main() {
//   await prisma.faucetConfig.upsert({
//     where: { id: 1 },
//     update: {},
//     create: {
//       cooldownSeconds: 86400,
//       faucetAmount: 0.1,
//       enabled: true,
//       maxRequestsPerIp: 1,
//       maxRequestsPerWallet: 1,
//     },
//   });
// }

// main().finally(() => prisma.$disconnect());


// prisma/seed.ts
import { PrismaClient } from '../src/generated/prisma';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  const statuses = ['success', 'failed'] as const;

  const data = Array.from({ length: 100 }).map(() => {
    const walletAddress = `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`;
    const ipAddress = faker.internet.ip();
    const txHash = `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`;
    const status = faker.helpers.arrayElement(statuses);
    const amount = 1_000_000_000; // 1 SUI in MIST
    const failureReason = status === 'failed' ? 'transaction_failed' : null;
    const userAgent = faker.internet.userAgent();
    const createdAt = faker.date.recent({ days: 7 });

    return {
      walletAddress,
      ipAddress,
      txHash: status === 'success' ? txHash : null,
      amount,
      status,
      failureReason,
      userAgent,
      createdAt,
    };
  });

  await prisma.faucetRequest.createMany({
    data,
    skipDuplicates: true,
  });

  console.log('🌱 Seeded 100 fake requests');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

