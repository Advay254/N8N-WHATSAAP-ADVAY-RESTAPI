import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../types/api';
import { logger } from '../utils/apiLogger';

const prisma = new PrismaClient();

// Re-export AuthenticatedRequest so routes can import it from here.
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    apiKey: string;
    isActive?: boolean;
  };
  sessionId?: string;
  startTime?: number;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') ||
                  req.header('X-API-Key') ||
                  req.query.apiKey as string;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        timestamp: new Date().toISOString()
      });
    }

    // Check if it's a JWT token or API key
    if (token.startsWith('ey')) {
      // JWT token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            role: true,
            apiKey: true,
            isActive: true
          }
        });

        if (!user || !user.isActive) {
          return res.status(401).json({
            success: false,
            error: 'Invalid token or user not active.',
            timestamp: new Date().toISOString()
          });
        }

        req.user = user;
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid JWT token.',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // API Key
      const user = await prisma.user.findUnique({
        where: { apiKey: token },
        select: {
          id: true,
          email: true,
          role: true,
          apiKey: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key or user not active.',
          timestamp: new Date().toISOString()
        });
      }

      req.user = user;
    }

    // Log API usage
    await logApiUsage(req);

    next();
  } catch (error) {
    logger.error('Auth middleware error:' + error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
      timestamp: new Date().toISOString()
    });
  }
};

export const adminMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.',
      timestamp: new Date().toISOString()
    });
  }
  next();
};

export const sessionMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.params.sessionId || req.body.sessionId || req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required.',
        timestamp: new Date().toISOString()
      });
    }

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: {
        sessionId,
        userId: req.user!.id
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied.',
        timestamp: new Date().toISOString()
      });
    }

    req.sessionId = sessionId;
    next();
  } catch (error) {
    logger.error('Session middleware error:' + error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during session validation.',
      timestamp: new Date().toISOString()
    });
  }
};

const logApiUsage = async (req: AuthenticatedRequest) => {
  try {
    const startTime = Date.now();
    req.startTime = startTime;

    await prisma.apiUsage.create({
      data: {
        userId: req.user!.id,
        endpoint: req.path,
        method: req.method,
        status: 0,
        duration: 0,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Error logging API usage:' + error);
  }
};

export const responseMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send;

  res.send = function(data) {
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    if (req.user) {
      updateApiUsage(req.user.id, req.path, req.method, res.statusCode, duration);
    }

    return originalSend.call(this, data);
  };

  next();
};

const updateApiUsage = async (
  userId: string,
  endpoint: string,
  method: string,
  status: number,
  duration: number
) => {
  try {
    const usage = await prisma.apiUsage.findFirst({
      where: {
        userId,
        endpoint,
        method,
        status: 0
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (usage) {
      await prisma.apiUsage.update({
        where: { id: usage.id },
        data: {
          status,
          duration
        }
      });
    }
  } catch (error) {
    logger.error('Error updating API usage:' + error);
  }
};

export const createRateLimit = (windowMs: number, max: number) => {
  const requests = new Map();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    const userRequests = requests.get(key) || [];
    const validRequests = userRequests.filter((time: number) => time > windowStart);

    if (validRequests.length >= max) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        timestamp: new Date().toISOString()
      });
    }

    validRequests.push(now);
    requests.set(key, validRequests);
    next();
  };
};
          
