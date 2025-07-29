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

// Middleware to verify JWT access token
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
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
    logger.error('JWT verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
