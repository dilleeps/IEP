import { AppError } from '../../shared/errors/appError.js';
import { AuditLogService } from '../audit/audit.service.js';
import { UserConsent } from './consent.model.js';

interface RecordConsentParams {
  userId: string;
  consentType: string;
  consentText: string;
  consentVersion: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class ConsentService {
  async recordConsent(params: RecordConsentParams) {
    const { userId, consentType, consentText, consentVersion, ipAddress, userAgent } = params;

    if (!userId) {
      throw new AppError('User is required', 400, 'USER_REQUIRED');
    }

    const timestamp = new Date();

    const existing = await UserConsent.findOne({
      where: {
        userId,
        consentType,
        consentVersion,
      },
    });

    if (existing) {
      await existing.update({
        consentGiven: true,
        consentText,
        consentedAt: timestamp,
        revokedAt: null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      } as any);
    } else {
      await UserConsent.create({
        userId,
        consentType,
        consentGiven: true,
        consentText,
        consentVersion,
        consentedAt: timestamp,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      } as any);
    }

    await AuditLogService.log({
      userId,
      action: 'consent.accepted',
      entityType: 'consent',
      entityId: userId,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
      status: 'success',
      metadata: {
        consentType,
        consentVersion,
        consentText,
        consentedAt: timestamp.toISOString(),
      },
    });

    return { consentedAt: timestamp };
  }
}
