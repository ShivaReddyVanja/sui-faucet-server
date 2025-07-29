import express from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import logger from '../logger';
import { LoginSchema } from '../services/validation';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/adminAuth';
import { generateAccessToken, generateRefreshToken, revokeRefreshToken, verifyRefreshToken, verifyWalletSignature } from '../utils/auth';


const router = express();

// Login endpoint
router.post('/admin/login', async (req, res) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: z.treeifyError(parseResult.error),
      });
    }

    const {walletAddress, message, signature, signedBytes } = parseResult.data;
   
    // Verify signature
    const isValidSignature = await verifyWalletSignature(message, signature,signedBytes);
    if (!isValidSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if admin user exists
    let adminUser = await prisma.adminUser.findUnique({
      where: { walletAddress },
    });

    //if not an admin
    if (!adminUser) {
      return res.status(403).json({ error: 'Unauthorized wallet address' });
    }

    if (!adminUser.isActive) {
      return res.status(401).json({ error: 'Admin account is deactivated' });
    }

    // Update last login
    await prisma.adminUser.update({
      where: { walletAddress },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken(walletAddress, adminUser.role);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        walletAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      accessToken,
      user: {
        walletAddress: adminUser.walletAddress,
        role: adminUser.role,
      },
    });
  } catch (error: any) {
    logger.error('Login failed:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});


// Refresh token endpoint
router.post('/admin/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const isValid = await verifyRefreshToken(refreshToken);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Get admin user
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { adminUser: true },
    });

    if (!tokenRecord || !tokenRecord.adminUser) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(
      tokenRecord.adminUser.walletAddress,
      tokenRecord.adminUser.role
    );

    res.json({
      success: true,
      accessToken,
      user: {
        walletAddress: tokenRecord.adminUser.walletAddress,
        role: tokenRecord.adminUser.role,
      },
    });
  } catch (error: any) {
    logger.error('Token refresh failed:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});



// Logout endpoint
router.post('/admin/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Revoke refresh token
      await revokeRefreshToken(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    logger.error('Logout failed:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});



// Get current user info
router.get('/admin/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { walletAddress: req.user.walletAddress },
    });

    if (!adminUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    res.json({
      success: true,
      user: {
        walletAddress: adminUser.walletAddress,
        role: adminUser.role,
        lastLoginAt: adminUser.lastLoginAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get user info:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router; 