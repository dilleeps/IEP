import { GoalProgress } from '../goal/goal.model.js';
import { Service } from '../service/service.model.js';
import { SmartPrompt } from '../smart-prompts/smart-prompts.model.js';
import { IepDocument } from '../document/document.model.js';
import { DocumentRepository } from '../document/document.repo.js';
import { GoalRepository } from '../goal/goal.repo.js';
import { ChildProfile } from '../child/child.model.js';
import type { DisabilitySourceTracking, ProfileUpdateLogEntry } from '../child/child.model.js';
import { AppError } from '../shared/errors/appError.js';
import { logger } from '../config/logger.js';
import { getSequelize } from '../config/sequelize.js';
import { ExtractionResult } from './types/promptschema.js';

/**
 * NormalizationService converts JSONB extraction data to normalized database records.
 * Called when parent finalizes the IEP extraction.
 */
export class NormalizationService {
  private docRepo: DocumentRepository;
  private goalRepo: GoalRepository;

  constructor() {
    this.docRepo = new DocumentRepository();
    this.goalRepo = new GoalRepository();
  }

  /**
   * Finalize extraction: Convert JSONB to normalized tables
   */
  async finalizeExtraction(documentId: string, userId: string): Promise<{
    goalsCreated: number;
    servicesCreated: number;
    promptsCreated: number;
  }> {
    const doc = await this.docRepo.findById(documentId);
    if (!doc) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    if (!doc.metadata?.extraction) {
      throw new AppError('No extraction data found', 400, 'NO_EXTRACTION_DATA');
    }

    if (doc.extractionStatus === 'finalized') {
      throw new AppError('Extraction already finalized', 400, 'ALREADY_FINALIZED');
    }

    const extraction: ExtractionResult = doc.metadata.extraction;

    const sequelize = getSequelize();
    const transaction = await sequelize.transaction();

    try {
      let goalsCreated = 0;
      let servicesCreated = 0;
      let promptsCreated = 0;

      // ── Clean up any records from a previous finalization ─────────────────
      // This allows re-finalization after re-analysis without duplicates.
      const prevGoals = await GoalProgress.count({ where: { documentId: doc.id }, transaction } as any);
      if ((prevGoals as unknown as number) > 0) {
        await GoalProgress.destroy({ where: { documentId: doc.id }, transaction } as any);
        logger.info(`Cleared ${prevGoals} old goals for document ${doc.id} before re-finalization`);
      }
      const prevServices = await Service.count({ where: { documentId: doc.id }, transaction } as any);
      if ((prevServices as unknown as number) > 0) {
        await Service.destroy({ where: { documentId: doc.id }, transaction } as any);
        logger.info(`Cleared ${prevServices} old services for document ${doc.id} before re-finalization`);
      }

      // ── Deduplicate goals within the extraction ───────────────────────────
      // The AI may sometimes extract the same goal more than once. Keep only the
      // first occurrence of each (goalName.toLowerCase() + domain) pair.
      const uniqueGoals = (() => {
        const seen = new Set<string>();
        return (extraction.goals ?? []).filter(g => {
          const key = `${(g.goalName || g.goalText || '').toLowerCase().slice(0, 120)}|${(g.domain || 'other').toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      })();

      // Valid domain values accepted by the GoalProgress model validator
      const VALID_DOMAINS = new Set([
        'reading', 'math', 'writing', 'behavior', 'social', 'communication',
        'motor', 'adaptive', 'self_care_independent_living', 'vocational',
        'transition', 'social_emotional', 'speech_language',
        'occupational_therapy', 'physical_therapy', 'other',
      ]);

      // Create goal records
      for (const goalData of uniqueGoals) {
        const goalText = goalData.goalText || goalData.goalName || '';
        const goalName = (goalData.goalName || goalText).substring(0, 100);
        if (!goalName) {
          logger.warn(`Skipping goal with no goalName or goalText for document ${doc.id}`);
          continue;
        }
        const rawDomain = (goalData.domain || '').toLowerCase().trim().replace(/\s+/g, '_');
        const domain   = VALID_DOMAINS.has(rawDomain) ? rawDomain : 'other';

        // DB-level safety: skip if this exact goal already exists for this document
        // (guards against partial-commit retries)
        const existing = await GoalProgress.findOne({
          where: { documentId: doc.id, goalName, domain },
          transaction,
        });
        if (existing) {
          logger.warn(`Skipping duplicate goal "${goalName}" (${domain}) for document ${doc.id}`);
          continue;
        }

        // Use goal-level startDate if available, otherwise fall back to IEP document dates.
        // This ensures the progress bar can calculate expected progress based on the IEP period.
        const goalStartDate = goalData.startDate
          ? new Date(goalData.startDate)
          : (doc.iepStartDate ? new Date(doc.iepStartDate) : undefined);
        const goalTargetDate = doc.iepEndDate ? new Date(doc.iepEndDate) : undefined;

        await this.goalRepo.create({
          userId,
          childId: doc.childId,
          documentId: doc.id,
          goalText,
          goalName,
          domain,
          baseline: goalData.baseline,
          target: goalData.target,
          measurementMethod: goalData.measurementMethod,
          criteria: goalData.criteria,
          frequency: goalData.frequency,
          startDate: goalStartDate,
          targetDate: goalTargetDate,
          status: 'in_progress',
          progressPercentage: 0,
          currentValue: goalData.baseline || '0',
          targetValue: goalData.target || '100',
          notes: '',
          milestonesData: {},
          lastUpdated: new Date(),
        } as any, { transaction });

        goalsCreated++;
      }

      // ── Deduplicate services within the extraction ────────────────────────
      // Keep only the first entry per serviceType.
      const uniqueServices = (() => {
        const seen = new Set<string>();
        return (extraction.services ?? []).filter(s => {
          const key = (s.serviceType || '').toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      })();

      // Create service records
      for (const serviceData of uniqueServices) {
        // DB-level safety: skip if already exists for this document
        const existingSvc = await Service.findOne({
          where: { documentId: doc.id, serviceType: serviceData.serviceType },
          transaction,
        });
        if (existingSvc) {
          logger.warn(`Skipping duplicate service "${serviceData.serviceType}" for document ${doc.id}`);
          continue;
        }

        await Service.create({
          documentId: doc.id,
          childId: doc.childId,
          serviceType: serviceData.serviceType as any,
          provider: serviceData.provider,
          minutesPerSession: serviceData.minutesPerSession,
          sessionsPerWeek: serviceData.sessionsPerWeek,
          startDate: serviceData.startDate ? new Date(serviceData.startDate) : new Date(),
          endDate: serviceData.endDate ? new Date(serviceData.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'active',
          totalSessionsPlanned: 0,
          totalSessionsDelivered: 0,
          metadata: {},
        } as any, { transaction });

        servicesCreated++;
      }

      // ── Create SmartPrompts from red flags and legal lens ─────────────────
      // NOTE: Collected here for use AFTER the transaction commits.
      // SmartPrompt creation runs outside the transaction to avoid Sequelize
      // internal Object.keys() failures blocking the core finalization.
      const redFlagStrings: string[] = [];
      const rawRedFlags: string[] = (extraction.redFlags as unknown as string[] | undefined) || [];
      for (const flag of rawRedFlags) {
        const flagStr = typeof flag === 'string' ? flag : (flag as any)?.description || (flag as any)?.text || String(flag ?? '');
        if (flagStr && flagStr !== '[object Object]') redFlagStrings.push(flagStr);
      }
      const legalLensStr = (extraction as any).legalLens as string | undefined;

      // Mark document as finalized
      await this.docRepo.update(documentId, {
        extractionStatus: 'finalized',
        analysisStatus: 'completed',
        version: (doc.version || 0) + 1,
      } as any);

      await transaction.commit();

      // ── SmartPrompts (outside transaction — non-fatal side effect) ────────
      if (userId && doc.childId) {
        try {
          const promptTitlesSeen = new Set<string>();
          for (const flagStr of redFlagStrings) {
            const title = flagStr.slice(0, 200);
            if (!title || promptTitlesSeen.has(title.toLowerCase())) continue;
            promptTitlesSeen.add(title.toLowerCase());

            const existingPrompt = await SmartPrompt.findOne({
              where: { userId, childId: doc.childId, title } as any,
            });
            if (existingPrompt) continue;

            await SmartPrompt.create({
              userId,
              childId: doc.childId,
              promptType: 'compliance_alert',
              category: 'iep',
              priority: 'high',
              title,
              message: flagStr,
              actionable: true,
              actionUrl: `/iep/${doc.id}`,
              actionLabel: 'View IEP Document',
              contextData: { documentId: doc.id, fileName: doc.fileName, source: 'extraction' },
              acknowledged: false,
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            } as any);
            promptsCreated++;
          }

          if (legalLensStr && legalLensStr.trim()) {
            const title = `Legal Perspective: ${legalLensStr.slice(0, 150)}`;
            if (!promptTitlesSeen.has(title.toLowerCase())) {
              promptTitlesSeen.add(title.toLowerCase());
              const existing = await SmartPrompt.findOne({
                where: { userId, childId: doc.childId, title } as any,
              });
              if (!existing) {
                await SmartPrompt.create({
                  userId,
                  childId: doc.childId,
                  promptType: 'advocacy_tip',
                  category: 'advocacy',
                  priority: 'medium',
                  title,
                  message: legalLensStr,
                  actionable: true,
                  actionUrl: `/advocacy`,
                  actionLabel: 'Explore Advocacy Lab',
                  contextData: { documentId: doc.id, fileName: doc.fileName, source: 'legal_lens' },
                  acknowledged: false,
                  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                } as any);
                promptsCreated++;
              }
            }
          }
        } catch (promptErr) {
          logger.warn(`SmartPrompt creation failed for document ${documentId} — prompts skipped`, { promptErr });
        }
      }

      // ── Smart profile update (outside transaction so it never blocks finalization) ─
      // Rules:
      //  • primaryDisability / secondaryDisability: locked after first set — never
      //    overwritten. Source document is recorded in disabilitySourceTracking.
      //  • otherDisabilities array: additive — new labels are merged in; old ones
      //    never removed. Each new label records its source document.
      //  • disabilities (broad compat array): union of all three tiers.
      //  • grade: updated freely from newer documents.
      //  • lastIepDate: advances only (never goes backward).
      //  • Every change is appended to profileUpdateLog with timestamp + version.
      try {
        const child = await ChildProfile.findByPk(doc.childId);
        if (child) {
          const now = new Date().toISOString();
          const sourceDoc = { documentId: doc.id, fileName: doc.fileName };
          const profileUpdate: Record<string, any> = {};
          const changes: Record<string, { from: unknown; to: unknown }> = {};

          // ── Disability source tracking ─────────────────────────────────────
          const srcTracking: DisabilitySourceTracking = {
            others: [],
            ...(child.disabilitySourceTracking || {}),
          };

          // Primary — IEP document supersedes manual entry
          if (extraction.primaryDisability && extraction.primaryDisability !== child.primaryDisability) {
            profileUpdate.primaryDisability = extraction.primaryDisability;
            changes.primaryDisability = { from: child.primaryDisability ?? null, to: extraction.primaryDisability };
            srcTracking.primaryDisability = { ...sourceDoc, setAt: now };
          }

          // Secondary — IEP document supersedes manual entry
          if (extraction.secondaryDisability && extraction.secondaryDisability !== child.secondaryDisability) {
            profileUpdate.secondaryDisability = extraction.secondaryDisability;
            changes.secondaryDisability = { from: child.secondaryDisability ?? null, to: extraction.secondaryDisability };
            srcTracking.secondaryDisability = { ...sourceDoc, setAt: now };
          }

          // Others — additive merge with per-label source tracking
          const allExtractedOthers: string[] = (extraction.otherDisabilities || []).filter(Boolean);
          const existingOtherLabels = new Set((child.otherDisabilities || []).map(s => s.toLowerCase()));
          const newOthers: string[] = [];
          for (const label of allExtractedOthers) {
            if (!existingOtherLabels.has(label.toLowerCase())) {
              newOthers.push(label);
              srcTracking.others.push({ label, ...sourceDoc, addedAt: now });
            }
          }
          if (newOthers.length > 0) {
            const merged = [...(child.otherDisabilities || []), ...newOthers];
            profileUpdate.otherDisabilities = merged;
            changes.otherDisabilities = { from: child.otherDisabilities, to: merged };
          }

          // Rebuild broad disabilities array (primary + secondary + others)
          {
            const allLabels: string[] = [
              profileUpdate.primaryDisability ?? child.primaryDisability,
              profileUpdate.secondaryDisability ?? child.secondaryDisability,
              ...((profileUpdate.otherDisabilities ?? child.otherDisabilities) || []),
            ].filter((v): v is string => Boolean(v) && v !== 'null' && v !== 'undefined');

            const uniqueLabels = Array.from(new Set(allLabels));
            const existingDisabilities = child.disabilities || [];
            if (JSON.stringify(uniqueLabels) !== JSON.stringify(existingDisabilities)) {
              profileUpdate.disabilities = uniqueLabels;
              if (!changes.otherDisabilities) {
                changes.disabilities = { from: existingDisabilities, to: uniqueLabels };
              }
            }
          }

          // Save updated source tracking (always, even if no label changed, in case
          // we updated the setAt for a field that was previously untracked)
          profileUpdate.disabilitySourceTracking = srcTracking;

          // Name — update if still a placeholder or not set
          const isPlaceholderName = !child.name || child.name.startsWith('New Child');
          if (extraction.studentName && isPlaceholderName) {
            changes.name = { from: child.name, to: extraction.studentName };
            profileUpdate.name = extraction.studentName;
          }

          // Date of birth — set if not already set; also calculate age
          if (extraction.studentDob) {
            const dob = new Date(extraction.studentDob);
            if (!isNaN(dob.getTime())) {
              if (!child.dateOfBirth) {
                changes.dateOfBirth = { from: null, to: dob.toISOString() };
                profileUpdate.dateOfBirth = dob;
              }
              // Calculate age from DOB
              const today = new Date();
              let calculatedAge = today.getFullYear() - dob.getFullYear();
              const monthDiff = today.getMonth() - dob.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                calculatedAge--;
              }
              if (calculatedAge >= 0 && calculatedAge !== child.age) {
                changes.age = { from: child.age ?? null, to: calculatedAge };
                profileUpdate.age = calculatedAge;
              }
            }
          }

          // Grade — update freely
          if (extraction.grade && extraction.grade !== child.grade) {
            changes.grade = { from: child.grade, to: extraction.grade };
            profileUpdate.grade = extraction.grade;
          }

          // School name — update freely (may change between IEPs)
          if (extraction.schoolName && extraction.schoolName !== child.schoolName) {
            changes.schoolName = { from: child.schoolName ?? null, to: extraction.schoolName };
            profileUpdate.schoolName = extraction.schoolName;
          }

          // School district — update freely (may change between IEPs)
          if (extraction.schoolDistrict && extraction.schoolDistrict !== child.schoolDistrict) {
            changes.schoolDistrict = { from: child.schoolDistrict ?? null, to: extraction.schoolDistrict };
            profileUpdate.schoolDistrict = extraction.schoolDistrict;
          }

          // Home address — update if extracted and not already set
          if (extraction.homeAddress && !child.homeAddress) {
            changes.homeAddress = { from: null, to: extraction.homeAddress };
            profileUpdate.homeAddress = extraction.homeAddress;
          }

          // Phone number — update if extracted and not already set
          if (extraction.phoneNumber && !child.phoneNumber) {
            changes.phoneNumber = { from: null, to: extraction.phoneNumber };
            profileUpdate.phoneNumber = extraction.phoneNumber;
          }

          // Country — update if extracted and not already set
          if (extraction.country && !child.country) {
            changes.country = { from: null, to: extraction.country };
            profileUpdate.country = extraction.country;
          }

          // lastIepDate — advance only
          if (extraction.iepStartDate) {
            const newDate = new Date(extraction.iepStartDate);
            if (!child.lastIepDate || newDate > child.lastIepDate) {
              changes.lastIepDate = { from: child.lastIepDate?.toISOString() ?? null, to: newDate.toISOString() };
              profileUpdate.lastIepDate = newDate;
            }
          }

          // nextIepReviewDate — set from IEP end date if not already set or if newer
          if (extraction.iepEndDate) {
            const reviewDate = new Date(extraction.iepEndDate);
            if (!isNaN(reviewDate.getTime()) && (!child.nextIepReviewDate || reviewDate > child.nextIepReviewDate)) {
              changes.nextIepReviewDate = { from: child.nextIepReviewDate?.toISOString() ?? null, to: reviewDate.toISOString() };
              profileUpdate.nextIepReviewDate = reviewDate;
            }
          }

          // Accommodations summary — update from extraction
          if (extraction.accommodations && extraction.accommodations.length > 0) {
            const accSummary = extraction.accommodations.map(a => `• ${a}`).join('\n');
            if (accSummary !== child.accommodationsSummary) {
              changes.accommodationsSummary = { from: child.accommodationsSummary, to: accSummary };
              profileUpdate.accommodationsSummary = accSummary;
            }
          }

          // Services summary — update from extraction
          if (extraction.services && extraction.services.length > 0) {
            const svcSummary = extraction.services
              .map(s => {
                const name = s.serviceType?.replace(/_/g, ' ') || 'Unknown service';
                const details: string[] = [];
                if (s.minutesPerSession) details.push(`${s.minutesPerSession} min/session`);
                if (s.sessionsPerWeek) details.push(`${s.sessionsPerWeek}x/week`);
                if (s.provider) details.push(s.provider);
                return `• ${name}${details.length ? ` (${details.join(', ')})` : ''}`;
              })
              .join('\n');
            if (svcSummary !== child.servicesSummary) {
              changes.servicesSummary = { from: child.servicesSummary, to: svcSummary };
              profileUpdate.servicesSummary = svcSummary;
            }
          }

          // ── Append profile update log entry ───────────────────────────────
          if (Object.keys(changes).length > 0) {
            const existingLog: ProfileUpdateLogEntry[] = Array.isArray(child.profileUpdateLog)
              ? child.profileUpdateLog
              : [];
            const newVersion = (existingLog[existingLog.length - 1]?.version ?? 0) + 1;
            profileUpdate.profileUpdateLog = [
              ...existingLog,
              {
                version: newVersion,
                at: now,
                documentId: doc.id,
                fileName: doc.fileName,
                changes,
              } satisfies ProfileUpdateLogEntry,
            ];

            await child.update(profileUpdate);
            logger.info(`Updated child profile ${doc.childId} from document ${documentId} (v${newVersion})`, { changes });
          }
        }
      } catch (profileError) {
        // Profile update failure should not block finalization
        logger.error('Failed to update child profile during finalization', profileError);
      }
      // ─────────────────────────────────────────────────────────────────────

      logger.info(`Finalized extraction for document ${documentId}: ${goalsCreated} goals, ${servicesCreated} services, ${promptsCreated} prompts`);

      return { goalsCreated, servicesCreated, promptsCreated };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to finalize extraction', error);
      throw error;
    }
  }

  /**
   * Check if document is ready for finalization
   */
  async canFinalize(documentId: string): Promise<{
    canFinalize: boolean;
    reasons: string[];
  }> {
    const doc = await this.docRepo.findById(documentId);
    if (!doc) {
      return {
        canFinalize: false,
        reasons: ['Document not found'],
      };
    }

    const reasons: string[] = [];

    if (doc.extractionStatus === 'finalized') {
      reasons.push('Already finalized');
    }

    if (!doc.metadata?.extraction) {
      reasons.push('No extraction data');
    }

    // pending_review means ready for parent review → CAN be finalized
    // Do NOT block finalization for pending_review status

    return {
      canFinalize: reasons.length === 0,
      reasons,
    };
  }
}
