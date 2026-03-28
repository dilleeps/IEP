import { AuditLog } from './audit.model.js';

interface AuditLogInput {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  piiAccessed?: boolean;
  piiFields?: string[];
  status: 'success' | 'failure';
  errorMessage?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class AuditLogService {
  static async log(input: AuditLogInput): Promise<void> {
    try {
      await AuditLog.create({
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues,
        // Backward compatible mapping for legacy callers using `changes`/`metadata`.
        newValues: input.newValues || input.changes || input.metadata,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        requestMethod: input.requestMethod,
        requestPath: input.requestPath,
        piiAccessed: input.piiAccessed ?? false,
        piiFields: input.piiFields,
        status: input.status,
        errorMessage: input.errorMessage,
      } as any);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging failures shouldn't block the main operation
    }
  }
}
