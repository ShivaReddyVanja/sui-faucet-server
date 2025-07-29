import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { fromBase64 } from '@mysten/sui/utils';
import logger from '../logger';
import { randomBytes } from 'crypto';


const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT secret not found in .env file")
}

//verify the wallet signature
export const verifyWalletSignature = async (
    message: string,
    signature: string,
    signedBytes: string,
    expectedAddress?: string
): Promise<boolean> => {
    try {
        // Validate inputs
        if (!message || !signature || !signedBytes) {
            logger.warn('Invalid signature verification inputs', { message, signature, signedBytes });
            return false;
        }

        // Convert the signed bytes back to Uint8Array using the new function
        const messageBytes = fromBase64(signedBytes);

        // Verify the signature and recover the address
        const recoveredPublicKey = await verifyPersonalMessageSignature(messageBytes, signature);

        if (!recoveredPublicKey) {
            logger.warn('Failed to recover public key from signature');
            return false;
        }

        // Get the address from the recovered public key
        const recoveredAddress = recoveredPublicKey.toSuiAddress();

        // If an expected address is provided, verify it matches
        if (expectedAddress) {
            // Normalize addresses for comparison (ensure both have 0x prefix)
            const normalizedExpected = expectedAddress.startsWith('0x') ? expectedAddress : `0x${expectedAddress}`;
            const normalizedRecovered = recoveredAddress.startsWith('0x') ? recoveredAddress : `0x${recoveredAddress}`;

            if (normalizedExpected !== normalizedRecovered) {
                logger.warn('Address mismatch', {
                    expected: normalizedExpected,
                    recovered: normalizedRecovered
                });
                return false;
            }
        }

        logger.info('Signature verified successfully', { recoveredAddress });
        return true;

    } catch (error: unknown) {
        logger.error('Signature verification error:', error);
        return false;
    }
};


// Generate access token
export const generateAccessToken = (walletAddress: string, role: string): string => {
    const payload = {
        sub: walletAddress,
        role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    };

    return jwt.sign(payload, JWT_SECRET);
};

// Generate refresh token
export const generateRefreshToken = (): string => {
    return randomBytes(32).toString('hex');
};

// Verify refresh token
export const verifyRefreshToken = async (token: string): Promise<boolean> => {
    try {
        const refreshToken = await prisma.refreshToken.findUnique({
            where: { token },
        });

        if (!refreshToken || refreshToken.isRevoked || refreshToken.expiresAt < new Date()) {
            return false;
        }

        return true;
    } catch (error) {
        logger.error('Refresh token verification failed:', error);
        return false;
    }
};

// Revoke refresh token
export const revokeRefreshToken = async (token: string): Promise<void> => {
    try {
        await prisma.refreshToken.update({
            where: { token },
            data: { isRevoked: true },
        });
    } catch (error) {
        logger.error('Failed to revoke refresh token:', error);
    }
};

// Clean up expired refresh tokens
export const cleanupExpiredTokens = async (): Promise<void> => {
    try {
        await prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    } catch (error) {
        logger.error('Failed to cleanup expired tokens:', error);
    }
};
