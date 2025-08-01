import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import logger from '../logger';
import dotenv from "dotenv";

dotenv.config();

export interface AuthenticatedRequest extends Request {
  user?: {
    walletAddress: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET;
if(!JWT_SECRET){
  throw new Error("JWT_SECRET secret not found in .env file,please add it, to generate one run | openssl rand -base64 64 | in terminal")
}

// Discord bot secret for secure identification
const DISCORD_BOT_SECRET = process.env.DISCORD_BOT_SECRET;
if(!DISCORD_BOT_SECRET){
  throw new Error("DISCORD_BOT_SECRET not found in .env file, please add it. Generate with: openssl rand -hex 32")
}



// Middleware to verify JWT access token or Discord bot requests
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  // For Discord bot requests without auth header (role-based access)
  if (!token) {
    // Check if this is a Discord bot request with secret verification
    const userAgent = req.headers['user-agent'] || '';
    const botSecret = req.headers['x-discord-bot-secret'];
    const isDiscordBot = userAgent.includes('Discord-Bot') && botSecret === DISCORD_BOT_SECRET;
    
    if (isDiscordBot) {
      // Trust Discord bot requests since role validation happens on Discord side
      req.user = {
        walletAddress: 'discord_admin',
        role: 'admin',
      };
      next();
      return;
    }
    
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Try JWT verification (for website authentication)
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      role: string;
    };

    const adminUser = await prisma.adminUser.findUnique({
      where: { walletAddress: decoded.sub },
    });

    if (!adminUser || !adminUser.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive admin user' });
    }

    req.user = {
      walletAddress: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
