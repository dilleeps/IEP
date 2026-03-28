import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate.js';
import { AppError } from '../shared/errors/appError.js';

interface ChildAccessOptions {
  paramName?: string;
  bodyField?: string;
  queryField?: string;
  required?: boolean;
  allowRoles?: string[];
}

function resolveChildId(req: AuthRequest, options: ChildAccessOptions): string | undefined {
  if (options.paramName) {
    const value = req.params[options.paramName];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }

  if (options.bodyField) {
    const value = req.body?.[options.bodyField];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }

  if (options.queryField) {
    const value = req.query?.[options.queryField];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }

  return undefined;
}

/**
 * Enforces that the authenticated user owns the child referenced by params/body/query.
 * ADMIN bypasses this check by default.
 */
export function requireChildAccess(options: ChildAccessOptions = {}) {
  const {
    paramName = 'childId',
    bodyField,
    queryField,
    required = true,
    allowRoles,
  } = options;

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      if (req.user.role === 'ADMIN' || allowRoles?.includes(req.user.role)) {
        return next();
      }

      const childId = resolveChildId(req, {
        paramName,
        bodyField,
        queryField,
      });

      if (!childId) {
        if (required) {
          throw new AppError('childId is required', 400, 'CHILD_ID_REQUIRED');
        }
        return next();
      }

      // Dynamic import to avoid tight module coupling.
      const { verifyOwnership } = await import('../child/child.service.js');
      const isOwner = await verifyOwnership(childId, req.user.id);

      if (!isOwner) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
