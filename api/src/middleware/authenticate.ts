import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../shared/errors/appError.js';
import { appenv } from '../config/appenv.js';
import { APP_USER_ROLES } from './roles.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isApproved: boolean;
    status?: string;
  };
}

function getBearerToken(authHeader?: string): string {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new AppError('No token provided', 401, 'UNAUTHORIZED');
  }

  return token;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
}

function parseTokenPayload(payload: jwt.JwtPayload | string): {
  sub: string;
  email: string;
  role: string;
  isApproved: boolean;
  status?: string;
} {
  if (!payload || typeof payload === 'string') {
    throw new AppError('Invalid token payload', 401, 'INVALID_TOKEN');
  }

  const sub = payload.sub;
  const email = payload.email;
  const role = payload.role;
  const status = payload.status;

  if (typeof sub !== 'string' || typeof email !== 'string' || typeof role !== 'string') {
    throw new AppError('Invalid token payload', 401, 'INVALID_TOKEN');
  }

  if (!(APP_USER_ROLES as readonly string[]).includes(role)) {
    throw new AppError('Invalid token role', 401, 'INVALID_TOKEN_ROLE');
  }

  const parsedStatus = typeof status === 'string' ? status : undefined;

  return {
    sub,
    email,
    role,
    isApproved: toBoolean(payload.isApproved),
    status: parsedStatus,
  };
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req.headers.authorization);
    const secret = appenv.get('JWT_SECRET');

    if (!secret) {
      throw new AppError('Server auth configuration error', 500, 'AUTH_CONFIG_ERROR');
    }

    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });
    const parsed = parseTokenPayload(payload);
    
    req.user = {
      id: parsed.sub,
      email: parsed.email,
      role: parsed.role,
      isApproved: parsed.isApproved,
      status: parsed.status,
    };

    if (req.user.status && req.user.status !== 'active') {
      throw new AppError('Account is not active', 403, 'ACCOUNT_NOT_ACTIVE');
    }

    // Check if user is approved (ADMIN and PARENT roles skip approval check)
    if (!req.user.isApproved && req.user.role !== 'PARENT' && req.user.role !== 'ADMIN') {
      throw new AppError('Account pending approval', 403, 'ACCOUNT_PENDING_APPROVAL');
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    } else if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }

    next(error);
  }
}
