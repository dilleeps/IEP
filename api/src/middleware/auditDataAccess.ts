import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate.js';

interface AuditDataAccessOptions {
  entityType: string;
  piiFields?: string[];
  methods?: string[];
}

/**
 * Lightweight audit trail for successful data reads.
 */
export function auditDataAccess(options: AuditDataAccessOptions) {
  const methods = (options.methods || ['GET']).map((method) => method.toUpperCase());

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!methods.includes(req.method.toUpperCase())) {
      return next();
    }

    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            const { AuditLogService } = await import('../audit/audit.service.js');

            await AuditLogService.log({
              userId: req.user?.id,
              action: 'data_accessed',
              entityType: options.entityType,
              entityId: req.params.id || req.params.childId || undefined,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'] as string | undefined,
              requestMethod: req.method,
              requestPath: req.originalUrl,
              piiAccessed: true,
              piiFields: options.piiFields || [],
              status: 'success',
              metadata: {
                query: req.query,
              },
            });
          } catch (error) {
            // Never block API responses due to audit failures.
            console.error('Data access audit log failed:', error);
          }
        });
      }

      return originalJson(body);
    };

    next();
  };
}
