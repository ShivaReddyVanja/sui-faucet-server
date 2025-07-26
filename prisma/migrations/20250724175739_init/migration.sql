-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('success', 'failed');

-- CreateTable
CREATE TABLE "FaucetRequest" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "txHash" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "failureReason" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaucetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaucetConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cooldownSeconds" INTEGER NOT NULL,
    "faucetAmount" DECIMAL(65,30) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxRequestsPerIp" INTEGER NOT NULL,
    "maxRequestsPerWallet" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaucetConfig_pkey" PRIMARY KEY ("id")
);
