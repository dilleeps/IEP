import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate.js';
import { AppError } from '../shared/errors/appError.js';

export interface ResourceOwnershipOptions {
  resourceType: 'child' | 'document' | 'goal' | 'communication' | 'behavior' | 'letter' | 'compliance';
  paramName?: string; // defaults to 'id'
  allowRoles?: string[]; // roles that bypass ownership check
}

/**
 * Middleware to verify resource ownership
 * Ensures user can only access their own resources
 */
export function requireResourceOwnership(options: ResourceOwnershipOptions) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    // Admins and specified roles bypass ownership check
    if (options.allowRoles?.includes(req.user.role) || req.user.role === 'ADMIN') {
      return next();
    }

    const resourceId = req.params[options.paramName || 'id'];
    
    try {
      // Import service dynamically to avoid circular dependencies
      const servicePath = `../modules/${options.resourceType}/${options.resourceType}.service.js`;
      const { verifyOwnership } = await import(servicePath);
      const isOwner = await verifyOwnership(resourceId, req.user.id);
      
      if (!isOwner) {
        return next(new AppError('Access denied', 403, 'FORBIDDEN'));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}
