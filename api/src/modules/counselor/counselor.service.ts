import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { appenv } from '../../config/appenv.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../shared/errors/appError.js';
import { sendHtmlEmail } from '../../shared/notification/email.js';
import { createMeetingInvite } from '../../shared/notification/calendar.js';
import { COUNSELOR_DAYS } from './counselor.types.js';
import type {
  CatalogSlotAvailabilityResponse,
  CreateCounselorAppointmentDto,
  CounselorDay,
  ListCatalogSlotsQueryDto,
  CreateCounselorServiceDto,
  ReplaceAvailabilityDto,
  ReplaceAvailabilityWindowDto,
  UpdateParentCounselorAppointmentDto,
  MarkParentCounselorAppointmentPaidDto,
  UpdateCounselorAppointmentDto,
  UpdateCounselorAppointmentStatusDto,
  UpdateCounselorProfileDto,
  UpdateCounselorServiceDto,
} from './counselor.types.js';
import { CounselorRepository } from './counselor.repo.js';
import { GoogleCalendarService } from './google-calendar.service.js';
import {
  createPaymentGateway,
  type PaymentGatewayProvider,
} from './payment-gateway.service.js';

const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 8 * 60;
const MAX_WINDOWS_PER_DAY = 8;
const SLOT_INTERVAL_MINUTES = 15;

const DAY_BY_INDEX: CounselorDay[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

function getAutoLabel(startTime: string): string {
  const [h] = startTime.split(':').map(Number);
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h <= 23) return 'Evening';
  return 'Night';
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function parseDateOnly(value: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Invalid date value. Expected YYYY-MM-DD', 400, 'INVALID_DATE');
  }
  return parsed;
}

function getDayFromDate(date: Date): CounselorDay {
  return DAY_BY_INDEX[date.getUTCDay()];
}

function dateKeyUTC(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function timeOfDateUTC(date: Date): string {
  return `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
}

function startOfTodayUTC(): Date {
  return parseDateOnly(dateKeyUTC(new Date()));
}

export class CounselorServiceService {
  private repo: CounselorRepository;
  private googleCalendarService: GoogleCalendarService;
  private paymentGateway: PaymentGatewayProvider;

  constructor(repo = new CounselorRepository()) {
    this.repo = repo;
    this.googleCalendarService = new GoogleCalendarService();
    this.paymentGateway = createPaymentGateway();
  }

  async getGoogleConnectUrl(counselorId: string): Promise<{ url: string }> {
    if (!this.googleCalendarService.isConfigured()) {
      throw new AppError('Google Calendar integration is not available in this environment', 400, 'GOOGLE_OAUTH_NOT_CONFIGURED');
    }

    const state = jwt.sign(
      {
        purpose: 'counselor-google-connect',
        counselorId,
      },
      appenv.get('JWT_SECRET'),
      { expiresIn: '15m' },
    );

    return {
      url: this.googleCalendarService.buildConnectUrl(state),
    };
  }

  async completeGoogleOAuthCallback(code: string, state: string): Promise<string> {
    try {
      const payload = jwt.verify(state, appenv.get('JWT_SECRET')) as { purpose: string; counselorId: string };
      if (!payload || payload.purpose !== 'counselor-google-connect' || !payload.counselorId) {
        throw new AppError('Invalid OAuth state', 400, 'INVALID_GOOGLE_OAUTH_STATE');
      }

      const tokenResponse = await this.googleCalendarService.exchangeCodeForToken(code);
      const existingToken = await this.repo.findGoogleTokenByUserId(payload.counselorId);

      let refreshToken = tokenResponse.refreshToken;
      if (!refreshToken && existingToken?.encryptedRefreshToken) {
        refreshToken = this.decryptToken(existingToken.encryptedRefreshToken);
      }

      const googleEmail = await this.googleCalendarService.getGoogleEmail(tokenResponse.accessToken);

      await this.repo.upsertGoogleToken(payload.counselorId, {
        googleEmail,
        encryptedAccessToken: this.encryptToken(tokenResponse.accessToken),
        encryptedRefreshToken: refreshToken ? this.encryptToken(refreshToken) : null,
        scope: tokenResponse.scope,
        tokenType: tokenResponse.tokenType,
        accessTokenExpiresAt: tokenResponse.expiresIn
          ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
          : null,
      });

      await this.repo.updateProfile(payload.counselorId, {
        googleConnected: true,
      });

      return this.googleCalendarService.getSuccessRedirectUrl();
    } catch (error) {
      logger.error('Google OAuth callback failed', { error });
      return this.googleCalendarService.getFailureRedirectUrl();
    }
  }

  async getServiceMetadata() {
    const { categories, templates } = await this.repo.getServiceMetadata();

    const durationSet = new Set<number>(templates.map((item) => item.durationMinutes));
    [15, 20, 30, 45, 60, 90, 120].forEach((value) => durationSet.add(value));

    return {
      categories,
      templates,
      durations: Array.from(durationSet).sort((a, b) => a - b),
      customOption: 'Custom',
      filterAllLabel: 'All Departments',
    };
  }

  async listActiveCounselors() {
    return this.repo.listActiveCounselors();
  }

  async listCatalogServices() {
    return this.repo.listCatalogServices();
  }

  async listCounselorSlots(counselorId: string, query: { date: string; duration: number }): Promise<CatalogSlotAvailabilityResponse> {
    const counselorUser = await this.repo.findUserById(counselorId);
    if (!counselorUser || counselorUser.role !== 'COUNSELOR') {
      throw new AppError('Counselor not found', 404, 'COUNSELOR_NOT_FOUND');
    }

    const date = parseDateOnly(query.date);
    if (date.getTime() < startOfTodayUTC().getTime()) {
      throw new AppError('Cannot fetch slots for past dates', 400, 'INVALID_DATE');
    }

    const { day, availableSlots } = await this.getAvailableSlotsForDate(counselorId, query.duration, date);
    return {
      date: query.date,
      day,
      counselorId,
      counselorServiceId: null,
      serviceDurationMinutes: query.duration,
      availableSlots,
    };
  }

  async createParentAppointment(parentUserId: string, payload: CreateCounselorAppointmentDto) {
    const parent = await this.repo.findUserById(parentUserId);
    if (!parent) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Resolve from service, or direct counselor booking (no service)
    let resolvedCounselorId: string;
    let resolvedServiceId: string | null;
    let resolvedServiceName: string;
    let resolvedDurationMinutes: number;
    let paymentStatus: 'NOT_REQUIRED' | 'PENDING' | 'PAID';

    if (payload.counselorServiceId) {
      const service = await this.repo.findServiceById(payload.counselorServiceId);
      if (!service) {
        throw new AppError('Counselor service not found', 404, 'COUNSELOR_SERVICE_NOT_FOUND');
      }
      resolvedCounselorId = service.counselorId;
      resolvedServiceId = service.id;
      resolvedServiceName = service.name;
      resolvedDurationMinutes = service.durationMinutes;
      paymentStatus = service.priceCents === null || !service.paymentRequired ? 'NOT_REQUIRED' : 'PENDING';
    } else if (payload.counselorId) {
      const counselorUser = await this.repo.findUserById(payload.counselorId);
      if (!counselorUser || counselorUser.role !== 'COUNSELOR') {
        throw new AppError('Counselor not found', 404, 'COUNSELOR_NOT_FOUND');
      }
      resolvedCounselorId = payload.counselorId;
      resolvedServiceId = null;
      resolvedServiceName = payload.serviceName || 'Counseling Session';
      resolvedDurationMinutes = payload.durationMinutes || 60;
      paymentStatus = 'NOT_REQUIRED';
    } else {
      throw new AppError('Either counselorServiceId or counselorId must be provided', 400, 'INVALID_APPOINTMENT');
    }

    const child = await this.repo.findChildForParent(parentUserId, payload.childId);
    if (!child) {
      throw new AppError('Child not found', 404, 'CHILD_NOT_FOUND');
    }

    const iepDocumentId = payload.iepDocumentId || null;
    const supportingDocumentIds = payload.supportingDocumentIds || [];

    await this.validateAppointmentDocuments(parentUserId, payload.childId, iepDocumentId, supportingDocumentIds);

    const notes = normalizeText(payload.notes || '');
    const scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt) : null;

    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
      throw new AppError('Invalid scheduledAt value', 400, 'INVALID_APPOINTMENT');
    }

    if (scheduledAt) {
      this.validateScheduledAtNotPast(scheduledAt);
      await this.validateScheduledSlot({
        counselorId: resolvedCounselorId,
        durationMinutes: resolvedDurationMinutes,
        scheduledAt,
      });
    }

    const appointment = await this.repo.createAppointment({
      counselorId: resolvedCounselorId,
      parentUserId,
      childId: child.id,
      counselorServiceId: resolvedServiceId,
      iepDocumentId,
      supportingDocumentIds,
      parentName: parent.displayName,
      childName: child.name,
      serviceName: resolvedServiceName,
      durationMinutes: resolvedDurationMinutes,
      scheduledAt,
      notes,
      paymentStatus,
    });

    // Fire-and-forget: notify parent the request was received
    void this.notifyAppointmentRequested(
      parent.email,
      parent.displayName,
      resolvedServiceName,
      child.name,
    );

    return appointment;
  }

  async listCatalogSlots(counselorServiceId: string, query: ListCatalogSlotsQueryDto): Promise<CatalogSlotAvailabilityResponse> {
    const service = await this.repo.findServiceById(counselorServiceId);
    if (!service) {
      throw new AppError('Counselor service not found', 404, 'COUNSELOR_SERVICE_NOT_FOUND');
    }

    const date = parseDateOnly(query.date);
    if (date.getTime() < startOfTodayUTC().getTime()) {
      throw new AppError('Cannot fetch slots for past dates', 400, 'INVALID_DATE');
    }

    const { day, availableSlots } = await this.getAvailableSlotsForDate(
      service.counselorId,
      service.durationMinutes,
      date,
    );

    return {
      date: query.date,
      day,
      counselorId: service.counselorId,
      counselorServiceId,
      serviceDurationMinutes: service.durationMinutes,
      availableSlots,
    };
  }

  async listParentAppointments(parentUserId: string) {
    return this.repo.listAppointmentsByParent(parentUserId);
  }

  async updateParentAppointment(
    parentUserId: string,
    appointmentId: string,
    payload: UpdateParentCounselorAppointmentDto,
  ) {
    const current = await this.repo.findAppointmentByParent(parentUserId, appointmentId);
    if (!current) {
      throw new AppError('Counselor appointment not found', 404, 'COUNSELOR_APPOINTMENT_NOT_FOUND');
    }

    if (current.status === 'COMPLETED' || current.status === 'CANCELLED') {
      throw new AppError('Completed or cancelled appointments cannot be updated', 400, 'INVALID_APPOINTMENT_UPDATE');
    }

    const nextPayload: {
      status?: 'CANCELLED' | 'REQUESTED';
      scheduledAt?: Date | null;
      notes?: string;
    } = {};

    if (payload.cancel === true) {
      nextPayload.status = 'CANCELLED';
      nextPayload.scheduledAt = null;
      nextPayload.notes = normalizeText(payload.notes || current.notes || '');
      (nextPayload as Record<string, unknown>).paymentStatus = 'NOT_REQUIRED';
      (nextPayload as Record<string, unknown>).paymentReference = null;
      (nextPayload as Record<string, unknown>).meetLink = null;
      (nextPayload as Record<string, unknown>).calendarEventId = null;
      (nextPayload as Record<string, unknown>).counselorMessage = '';
    } else {
      const hasScheduledAt = payload.scheduledAt !== undefined;
      const hasNotes = payload.notes !== undefined;

      if (!hasScheduledAt && !hasNotes) {
        throw new AppError('No changes provided for appointment update', 400, 'INVALID_APPOINTMENT_UPDATE');
      }

      if (hasScheduledAt) {
        if (payload.scheduledAt === null) {
          nextPayload.scheduledAt = null;
        } else {
          const scheduledAt = new Date(payload.scheduledAt as string);
          if (Number.isNaN(scheduledAt.getTime())) {
            throw new AppError('Invalid scheduledAt value', 400, 'INVALID_APPOINTMENT_UPDATE');
          }

          this.validateScheduledAtNotPast(scheduledAt);

          await this.validateScheduledSlot({
            counselorId: current.counselorId,
            durationMinutes: current.durationMinutes,
            scheduledAt,
            excludeAppointmentId: current.id,
          });

          nextPayload.scheduledAt = scheduledAt;
        }

        nextPayload.status = 'REQUESTED';
      }

      if (hasNotes) {
        nextPayload.notes = normalizeText(payload.notes || '');
      }
    }

    const updated = await this.repo.updateAppointmentByParent(parentUserId, appointmentId, nextPayload);
    if (!updated) {
      throw new AppError('Counselor appointment not found', 404, 'COUNSELOR_APPOINTMENT_NOT_FOUND');
    }

    // Fire-and-forget: notify counselor when parent cancels
    if (nextPayload.status === 'CANCELLED') {
      void this.notifyAppointmentCancelledByParent({
        counselorId: current.counselorId,
        serviceName: current.serviceName,
        childName: current.childName,
        parentName: current.parentName,
      });
    }

    return updated;
  }

  async markParentAppointmentPaid(
    parentUserId: string,
    appointmentId: string,
    payload: MarkParentCounselorAppointmentPaidDto,
  ) {
    const current = await this.repo.findAppointmentByParent(parentUserId, appointmentId);
    if (!current) {
      throw new AppError('Counselor appointment not found', 404, 'COUNSELOR_APPOINTMENT_NOT_FOUND');
    }
    if (current.status !== 'ACCEPTED') {
      throw new AppError('Only accepted appointments can be paid', 400, 'INVALID_APPOINTMENT_PAYMENT');
    }
    if (current.paymentStatus !== 'PENDING') {
      throw new AppError('Appointment does not require pending payment', 400, 'INVALID_APPOINTMENT_PAYMENT');
    }

    const paymentReference = await this.getPaymentReferenceFromPayload(payload);

    const updated = await this.repo.markAppointmentPaidByParent(parentUserId, appointmentId, {
      paymentReference,
    });

    if (!updated) {
      throw new AppError('Counselor appointment not found', 404, 'COUNSELOR_APPOINTMENT_NOT_FOUND');
    }

    if (updated.status === 'ACCEPTED' && updated.scheduledAt && (!updated.meetLink || !updated.calendarEventId)) {
      try {
        const meeting = await this.createOrUpdateMeetingForAcceptedAppointment(updated);
        if (meeting) {
          const next = await this.repo.updateAppointmentByParent(parentUserId, appointmentId, {
            meetLink: meeting.meetLink,
            calendarEventId: meeting.eventId,
          });
          if (next) {
            // Fire-and-forget: payment confirmed email with meet link
            void this.notifyPaymentConfirmed({
              parentUserId,
              counselorId: next.counselorId,
              serviceName: next.serviceName,
              childName: next.childName,
              durationMinutes: next.durationMinutes,
              scheduledAt: next.scheduledAt,
              meetLink: next.meetLink,
            });
            return next;
          }
        }
      } catch (error) {
        logger.warn('Unable to provision Google meeting after payment update', {
          appointmentId,
          error,
        });
      }
    }

    // Fire-and-forget: payment confirmed email (with Teams invite if no Google meet link)
    void this.notifyPaymentConfirmed({
      parentUserId,
      counselorId: updated.counselorId,
      serviceName: updated.serviceName,
      childName: updated.childName,
      durationMinutes: updated.durationMinutes,
      scheduledAt: updated.scheduledAt,
      meetLink: updated.meetLink,
    });

    return updated;
  }

  async createParentPaymentSession(parentUserId: string, appointmentId: string) {
    const current = await this.repo.findAppointmentByParent(parentUserId, appointmentId);
    if (!current) {
      throw new AppError('Counselor appointment not found', 404, 'COUNSELOR_APPOINTMENT_NOT_FOUND');
    }
    if (current.status !== 'ACCEPTED') {
      throw new AppError('Only accepted appointments can be paid', 400, 'INVALID_APPOINTMENT_PAYMENT');
    }
    if (current.paymentStatus !== 'PENDING') {
      throw new AppError('Appointment does not require pending payment', 400, 'INVALID_APPOINTMENT_PAYMENT');
    }

    const service = await this.repo.findServiceById(current.counselorServiceId);
    const amountCents = service?.priceCents ?? 0;
    if (amountCents <= 0) {
      throw new AppError('This appointment has no payable amount', 400, 'INVALID_APPOINTMENT_PAYMENT');
    }

    const session = await this.paymentGateway.createCheckoutSession({
      appointmentId: current.id,
      amountCents,
      currency: 'USD',
    });

    return {
      appointmentId: current.id,
      sessionId: session.sessionId,
      gateway: session.gateway,
      status: session.status,
      amountCents: session.amountCents,
      currency: session.currency,
      checkoutUrl: session.checkoutUrl,
      expiresAt: session.expiresAt,
    };
  }

  async listServices(counselorId: string) {
    return this.repo.listServices(counselorId);
  }

  async createService(counselorId: string, payload: CreateCounselorServiceDto) {
    return this.repo.createService(counselorId, {
      ...payload,
      name: normalizeText(payload.name),
      serviceType: normalizeText(payload.serviceType),
      description: normalizeText(payload.description || ''),
      paymentRequired: payload.priceCents === null ? false : payload.paymentRequired,
    });
  }

  async updateService(counselorId: string, serviceId: string, payload: UpdateCounselorServiceDto) {
    const nextPayload: UpdateCounselorServiceDto = {
      ...payload,
    };

    if (typeof payload.name === 'string') {
      nextPayload.name = normalizeText(payload.name);
    }

    if (typeof payload.serviceType === 'string') {
      nextPayload.serviceType = normalizeText(payload.serviceType);
    }

    if (typeof payload.description === 'string') {
      nextPayload.description = normalizeText(payload.description);
    }

    if (payload.priceCents === null) {
      nextPayload.paymentRequired = false;
    }

    const updated = await this.repo.updateService(counselorId, serviceId, nextPayload);

    if (!updated) {
      throw new AppError('Counselor service not found', 404, 'COUNSELOR_SERVICE_NOT_FOUND');
    }

    return updated;
  }

  async deleteService(counselorId: string, serviceId: string): Promise<void> {
    const deletedCount = await this.repo.deleteService(counselorId, serviceId);
    if (deletedCount === 0) {
      throw new AppError('Counselor service not found', 404, 'COUNSELOR_SERVICE_NOT_FOUND');
    }
  }

  async listAvailability(counselorId: string) {
    return this.repo.listAvailability(counselorId);
  }

  async replaceAvailability(counselorId: string, payload: ReplaceAvailabilityDto) {
    this.validateAvailabilityWindows(payload.windows);

    const normalizedWindows: ReplaceAvailabilityWindowDto[] = payload.windows.map((window) => ({
      ...window,
      label: normalizeText(window.label || getAutoLabel(window.startTime)),
    }));

    return this.repo.replaceAvailability(counselorId, normalizedWindows);
  }

  async getProfile(counselorId: string) {
    const profile = await this.repo.findOrCreateProfile(counselorId);
    const user = await this.repo.findUserById(counselorId);

    if (user?.provider === 'google' && !profile.googleConnected) {
      return this.repo.updateProfile(counselorId, { googleConnected: true });
    }

    return profile;
  }

  async updateProfile(counselorId: string, payload: UpdateCounselorProfileDto) {
    const nextPayload: UpdateCounselorProfileDto = {
      ...payload,
    };

    if (typeof payload.bio === 'string') {
      nextPayload.bio = payload.bio.trim();
    }

    if (typeof payload.timezone === 'string') {
      nextPayload.timezone = payload.timezone.trim();
    }

    if (typeof payload.credentials === 'string') {
      nextPayload.credentials = payload.credentials.trim();
    }

    if (Array.isArray(payload.specializations)) {
      nextPayload.specializations = payload.specializations.map((item) => item.trim()).filter(Boolean);
    }

    return this.repo.updateProfile(counselorId, nextPayload);
  }

  async listAppointments(counselorId: string) {
    return this.repo.listAppointments(counselorId);
  }

  async updateAppointmentStatus(
    counselorId: string,
    appointmentId: string,
    payload: UpdateCounselorAppointmentStatusDto,
  ) {
    const updated = await this.updateCounselorAppointment(counselorId, appointmentId, payload);

    return updated;
  }

  async updateCounselorAppointment(
    counselorId: string,
    appointmentId: string,
    payload: UpdateCounselorAppointmentDto,
  ) {
    const current = await this.repo.findAppointmentByCounselor(counselorId, appointmentId);

    if (!current) {
      throw new AppError('Counselor appointment not found', 404, 'COUNSELOR_APPOINTMENT_NOT_FOUND');
    }

    if (current.status === 'COMPLETED' || current.status === 'CANCELLED') {
      throw new AppError('Completed or cancelled appointments cannot be updated', 400, 'INVALID_APPOINTMENT_UPDATE');
    }

    const nextPayload: Record<string, unknown> = {};
    let scheduledChanged = false;

    if (payload.status !== undefined) {
      nextPayload.status = payload.status;
    }

    if (payload.scheduledAt !== undefined) {
      if (payload.scheduledAt === null) {
        nextPayload.scheduledAt = null;
      } else {
        const scheduledAt = new Date(payload.scheduledAt);
        if (Number.isNaN(scheduledAt.getTime())) {
          throw new AppError('Invalid scheduledAt value', 400, 'INVALID_APPOINTMENT_UPDATE');
        }

        this.validateScheduledAtNotPast(scheduledAt);

        await this.validateScheduledSlot({
          counselorId: current.counselorId,
          durationMinutes: current.durationMinutes,
          scheduledAt,
          excludeAppointmentId: current.id,
        });

        nextPayload.scheduledAt = scheduledAt;
        scheduledChanged = true;

        if (payload.status === undefined) {
          nextPayload.status = 'ACCEPTED';
        }
      }
    }

    if (payload.counselorMessage !== undefined) {
      nextPayload.counselorMessage = normalizeText(payload.counselorMessage || '');
    }

    const nextStatus = (nextPayload.status as string | undefined) || current.status;
    if (nextStatus === 'CANCELLED') {
      nextPayload.paymentStatus = 'NOT_REQUIRED';
      nextPayload.paymentReference = null;
      nextPayload.meetLink = null;
      nextPayload.calendarEventId = null;
      nextPayload.scheduledAt = null;
    }

    const nextScheduledAt = (nextPayload.scheduledAt as Date | null | undefined) === undefined
      ? current.scheduledAt
      : (nextPayload.scheduledAt as Date | null);

    if (nextStatus === 'ACCEPTED' && nextScheduledAt) {
      const meeting = await this.createOrUpdateMeetingForAcceptedAppointment(current, nextScheduledAt);
      if (meeting) {
        nextPayload.meetLink = meeting.meetLink;
        nextPayload.calendarEventId = meeting.eventId;
      }
    }

    const updated = await this.repo.updateAppointmentByCounselor(counselorId, appointmentId, nextPayload);

    if (!updated) {
      throw new AppError('Counselor appointment not found', 404, 'COUNSELOR_APPOINTMENT_NOT_FOUND');
    }

    // Fire-and-forget notifications based on status transition
    if (nextStatus === 'ACCEPTED' && nextScheduledAt) {
      void this.notifyAppointmentAccepted({
        parentUserId: current.parentUserId,
        counselorId: current.counselorId,
        childName: current.childName,
        serviceName: current.serviceName,
        durationMinutes: current.durationMinutes,
        scheduledAt: nextScheduledAt,
        meetLink: (nextPayload.meetLink as string | null) ?? current.meetLink,
        counselorMessage: (nextPayload.counselorMessage as string | undefined) ?? current.counselorMessage ?? '',
      });
    } else if (nextStatus === 'CANCELLED') {
      void this.notifyAppointmentCancelledByCounselor({
        parentUserId: current.parentUserId,
        serviceName: current.serviceName,
        childName: current.childName,
        counselorMessage: (nextPayload.counselorMessage as string | undefined) ?? current.counselorMessage ?? '',
      });
    } else if (nextStatus === 'COMPLETED') {
      void this.notifyAppointmentCompleted({
        parentUserId: current.parentUserId,
        serviceName: current.serviceName,
        childName: current.childName,
      });
    }

    return updated;
  }

  async createCounselorAppointmentMeetLink(counselorId: string, appointmentId: string) {
    const current = await this.repo.findAppointmentByCounselor(counselorId, appointmentId);

    if (!current) {
      throw new AppError('Counselor appointment not found', 404, 'COUNSELOR_APPOINTMENT_NOT_FOUND');
    }

    if (current.status !== 'ACCEPTED' || !current.scheduledAt) {
      throw new AppError(
        'Meet link can be created only for accepted appointments with a scheduled time',
        400,
        'INVALID_MEET_LINK_CREATE',
      );
    }

    const meeting = await this.createOrUpdateMeetingForAcceptedAppointment(current);
    if (!meeting || !meeting.meetLink) {
      throw new AppError('Unable to create meet link. Please try again.', 400, 'MEET_LINK_NOT_AVAILABLE');
    }

    const updated = await this.repo.updateAppointmentByCounselor(counselorId, appointmentId, {
      meetLink: meeting.meetLink,
      calendarEventId: meeting.eventId,
    });

    if (!updated) {
      throw new AppError('Counselor appointment not found', 404, 'COUNSELOR_APPOINTMENT_NOT_FOUND');
    }

    return updated;
  }

  private validateAvailabilityWindows(windows: ReplaceAvailabilityWindowDto[]): void {
    const byDay = new Map<string, ReplaceAvailabilityWindowDto[]>();

    for (const day of COUNSELOR_DAYS) {
      byDay.set(day, []);
    }

    for (const window of windows) {
      const dayWindows = byDay.get(window.day);
      if (!dayWindows) {
        throw new AppError(`Invalid day: ${window.day}`, 400, 'INVALID_DAY');
      }
      dayWindows.push(window);
    }

    for (const [day, dayWindows] of byDay.entries()) {
      if (dayWindows.length > MAX_WINDOWS_PER_DAY) {
        throw new AppError(
          `Maximum ${MAX_WINDOWS_PER_DAY} windows are allowed per day. Problem day: ${day}.`,
          400,
          'INVALID_AVAILABILITY',
        );
      }

      const sorted = [...dayWindows].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

      for (let i = 0; i < sorted.length; i += 1) {
        const current = sorted[i];
        const start = toMinutes(current.startTime);
        const end = toMinutes(current.endTime);

        if (start >= end) {
          throw new AppError('End time must be after start time.', 400, 'INVALID_AVAILABILITY');
        }

        const duration = end - start;
        if (duration < MIN_DURATION_MINUTES) {
          throw new AppError(
            `Minimum duration is ${MIN_DURATION_MINUTES} minutes.`,
            400,
            'INVALID_AVAILABILITY',
          );
        }

        if (duration > MAX_DURATION_MINUTES) {
          throw new AppError(
            `Maximum duration is ${MAX_DURATION_MINUTES / 60} hours.`,
            400,
            'INVALID_AVAILABILITY',
          );
        }

        const next = sorted[i + 1];
        if (next && overlaps(current.startTime, current.endTime, next.startTime, next.endTime)) {
          throw new AppError(
            `Availability windows overlap on ${day}: ${current.startTime}-${current.endTime} and ${next.startTime}-${next.endTime}.`,
            400,
            'INVALID_AVAILABILITY',
          );
        }
      }
    }
  }

  private async validateAppointmentDocuments(
    parentUserId: string,
    childId: string,
    iepDocumentId: string | null,
    supportingDocumentIds: string[],
  ): Promise<void> {
    if (iepDocumentId) {
      const document = await this.repo.findIepDocumentForParentChild(parentUserId, childId, iepDocumentId);
      if (!document) {
        throw new AppError('Selected IEP document was not found for this child', 400, 'INVALID_IEP_DOCUMENT');
      }
    }

    const uniqueSupportingIds = Array.from(new Set(supportingDocumentIds));
    for (const docId of uniqueSupportingIds) {
      const document = await this.repo.findIepDocumentForParentChild(parentUserId, childId, docId);
      if (!document) {
        throw new AppError('One or more supporting documents are invalid for this child', 400, 'INVALID_SUPPORTING_DOCUMENT');
      }
    }
  }

  private async validateScheduledSlot(input: {
    counselorId: string;
    durationMinutes: number;
    scheduledAt: Date;
    excludeAppointmentId?: string;
  }): Promise<void> {
    const date = parseDateOnly(dateKeyUTC(input.scheduledAt));
    const selectedTime = timeOfDateUTC(input.scheduledAt);

    const { availableSlots } = await this.getAvailableSlotsForDate(
      input.counselorId,
      input.durationMinutes,
      date,
      input.excludeAppointmentId,
    );

    if (!availableSlots.includes(selectedTime)) {
      throw new AppError(
        'Selected slot is not available for this counselor on the chosen date',
        400,
        'SLOT_NOT_AVAILABLE',
      );
    }
  }

  private validateScheduledAtNotPast(scheduledAt: Date): void {
    if (scheduledAt.getTime() < Date.now()) {
      throw new AppError('Scheduled time must be in the future', 400, 'INVALID_APPOINTMENT_DATE');
    }
  }

  private async getAvailableSlotsForDate(
    counselorId: string,
    durationMinutes: number,
    date: Date,
    excludeAppointmentId?: string,
  ): Promise<{ day: CounselorDay; availableSlots: string[] }> {
    const day = getDayFromDate(date);
    const [windows, acceptedAppointments] = await Promise.all([
      this.repo.listAvailability(counselorId),
      this.repo.listAcceptedAppointmentsForCounselor(
        counselorId,
        date,
        new Date(date.getTime() + 24 * 60 * 60 * 1000),
        excludeAppointmentId,
      ),
    ]);

    const dayWindows = windows.filter((window) => window.day === day);
    if (dayWindows.length === 0) {
      return { day, availableSlots: [] };
    }

    const acceptedRanges = acceptedAppointments
      .filter((item) => item.scheduledAt)
      .map((item) => {
        const startDate = item.scheduledAt as Date;
        const startTime = timeOfDateUTC(startDate);
        const endTime = pad2(Math.floor((toMinutes(startTime) + item.durationMinutes) / 60))
          + ':'
          + pad2((toMinutes(startTime) + item.durationMinutes) % 60);

        return {
          startTime,
          endTime,
        };
      });

    const availableSlots = new Set<string>();

    for (const window of dayWindows) {
      const startMinutes = toMinutes(window.startTime.slice(0, 5));
      const endMinutes = toMinutes(window.endTime.slice(0, 5));

      for (let cursor = startMinutes; cursor + durationMinutes <= endMinutes; cursor += SLOT_INTERVAL_MINUTES) {
        const slotStart = `${pad2(Math.floor(cursor / 60))}:${pad2(cursor % 60)}`;
        const slotEndMinutes = cursor + durationMinutes;
        const slotEnd = `${pad2(Math.floor(slotEndMinutes / 60))}:${pad2(slotEndMinutes % 60)}`;

        const isBlocked = acceptedRanges.some((range) => overlaps(slotStart, slotEnd, range.startTime, range.endTime));
        if (!isBlocked) {
          availableSlots.add(slotStart);
        }
      }
    }

    return {
      day,
      availableSlots: Array.from(availableSlots).sort((a, b) => toMinutes(a) - toMinutes(b)),
    };
  }

  private getTokenEncryptionKey(): Buffer {
    const source = appenv.get('GOOGLE_TOKEN_ENCRYPTION_KEY') || appenv.get('JWT_SECRET');
    return createHash('sha256').update(source).digest();
  }

  private encryptToken(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getTokenEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  private decryptToken(value: string): string {
    const [ivBase64, authTagBase64, encryptedBase64] = value.split('.');
    if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
      throw new AppError('Invalid encrypted token format', 500, 'INVALID_GOOGLE_TOKEN');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getTokenEncryptionKey(),
      Buffer.from(ivBase64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedBase64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  private async getValidGoogleAccessToken(counselorId: string): Promise<string | null> {
    const token = await this.repo.findGoogleTokenByUserId(counselorId);
    if (!token) {
      return null;
    }

    const now = Date.now();
    const expiresAt = token.accessTokenExpiresAt ? new Date(token.accessTokenExpiresAt).getTime() : 0;
    if (expiresAt > now + 60_000) {
      return this.decryptToken(token.encryptedAccessToken);
    }

    if (!token.encryptedRefreshToken) {
      return null;
    }

    const refreshed = await this.googleCalendarService.refreshAccessToken(this.decryptToken(token.encryptedRefreshToken));
    await this.repo.upsertGoogleToken(counselorId, {
      googleEmail: token.googleEmail,
      encryptedAccessToken: this.encryptToken(refreshed.accessToken),
      encryptedRefreshToken: refreshed.refreshToken ? this.encryptToken(refreshed.refreshToken) : token.encryptedRefreshToken,
      scope: refreshed.scope,
      tokenType: refreshed.tokenType,
      accessTokenExpiresAt: refreshed.expiresIn ? new Date(Date.now() + refreshed.expiresIn * 1000) : null,
    });

    return refreshed.accessToken;
  }

  private async createOrUpdateMeetingForAcceptedAppointment(
    appointment: {
      id: string;
      counselorId: string;
      parentUserId: string;
      childName: string;
      serviceName: string;
      durationMinutes: number;
      notes: string;
      counselorMessage: string;
      scheduledAt: Date | null;
      calendarEventId: string | null;
      meetLink: string | null;
    },
    overrideScheduledAt?: Date,
  ): Promise<{ eventId: string; meetLink: string | null } | null> {
    const profile = await this.repo.findOrCreateProfile(appointment.counselorId);

    // If Google Calendar isn't configured or the counselor hasn't connected, generate a Jitsi Meet fallback link
    if (!profile.googleConnected || !this.googleCalendarService.isConfigured()) {
      const shortId = appointment.id.replace(/-/g, '').slice(0, 12);
      const meetLink = `https://meet.jit.si/askiep-${shortId}`;
      return { eventId: `jitsi-${shortId}`, meetLink };
    }

    const scheduledAt = overrideScheduledAt || appointment.scheduledAt;
    if (!scheduledAt) {
      return null;
    }

    const accessToken = await this.getValidGoogleAccessToken(appointment.counselorId);
    if (!accessToken) {
      return null;
    }

    const parent = await this.repo.findUserById(appointment.parentUserId);
    const attendees = parent?.email ? [parent.email] : [];
    const startAt = scheduledAt.toISOString();
    const endAt = new Date(scheduledAt.getTime() + appointment.durationMinutes * 60 * 1000).toISOString();
    const description = [
      `Parent: ${parent?.displayName || 'Parent'}`,
      `Child: ${appointment.childName}`,
      appointment.counselorMessage ? `Counselor message: ${appointment.counselorMessage}` : '',
      appointment.notes ? `Parent notes: ${appointment.notes}` : '',
    ].filter(Boolean).join('\n');

    if (appointment.calendarEventId) {
      const updated = await this.googleCalendarService.updateCalendarEvent({
        accessToken,
        eventId: appointment.calendarEventId,
        summary: `${appointment.serviceName} - ${appointment.childName}`,
        description,
        timezone: profile.timezone || 'America/New_York',
        startAt,
        endAt,
        attendees,
      });

      return {
        eventId: updated.eventId,
        meetLink: updated.meetLink || appointment.meetLink,
      };
    }

    return this.googleCalendarService.createCalendarEvent({
      accessToken,
      summary: `${appointment.serviceName} - ${appointment.childName}`,
      description,
      timezone: profile.timezone || 'America/New_York',
      startAt,
      endAt,
      attendees,
    });
  }

  private async getPaymentReferenceFromPayload(payload: MarkParentCounselorAppointmentPaidDto): Promise<string> {
    if (payload.paymentSessionId) {
      const result = await this.paymentGateway.confirmCheckoutSession(payload.paymentSessionId);
      return normalizeText(result.transactionReference);
    }

    return normalizeText(payload.dummyTransactionRef || `DUMMY-${Date.now()}`);
  }

  // ─── Notification Helpers ────────────────────────────────────────────────────

  /** Fire-and-forget HTML email via Microsoft Graph. Logs on failure. */
  private sendNotificationEmail(toEmail: string, subject: string, html: string): void {
    sendHtmlEmail(toEmail, subject, html).catch((err) => {
      logger.warn('Failed to send notification email', { toEmail, subject, error: err });
    });
  }

  /** Fire-and-forget Teams meeting invite via Microsoft Graph. Logs on failure. */
  private sendTeamsCalendarInvite(
    toEmail: string,
    subject: string,
    bodyContent: string,
    scheduledAt: Date,
    durationMinutes: number,
    timezone: string,
  ): void {
    const endAt = new Date(scheduledAt.getTime() + durationMinutes * 60_000);
    const toLocalIso = (d: Date) => d.toISOString().slice(0, 19);
    createMeetingInvite({
      toEmail,
      subject,
      bodyContent,
      startDateTime: toLocalIso(scheduledAt),
      endDateTime: toLocalIso(endAt),
      timeZone: timezone,
      isOnlineMeeting: true,
    }).catch((err) => {
      logger.warn('Failed to send Teams calendar invite', { toEmail, subject, error: err });
    });
  }

  /** Fire-and-forget: notify parent their appointment request was submitted. */
  private async notifyAppointmentRequested(
    parentEmail: string,
    parentName: string,
    serviceName: string,
    childName: string,
  ): Promise<void> {
    const html = `
      <p>Hi ${parentName},</p>
      <p>Your appointment request for <strong>${serviceName}</strong> for <strong>${childName}</strong> has been submitted.</p>
      <p>You will be notified once the counselor reviews and accepts your request.</p>
      <p>Thank you,<br/>The IEP App Team</p>
    `;
    this.sendNotificationEmail(parentEmail, `Appointment Request Submitted: ${serviceName}`, html);
  }

  /** Fire-and-forget: acceptance email + Teams calendar invite to parent. */
  private async notifyAppointmentAccepted(params: {
    parentUserId: string;
    counselorId: string;
    childName: string;
    serviceName: string;
    durationMinutes: number;
    scheduledAt: Date;
    meetLink: string | null;
    counselorMessage: string;
  }): Promise<void> {
    try {
      const [parent, profile] = await Promise.all([
        this.repo.findUserById(params.parentUserId),
        this.repo.findOrCreateProfile(params.counselorId),
      ]);
      if (!parent?.email) return;

      const timezone = profile.timezone || 'Asia/Kolkata';
      const readableTime = params.scheduledAt.toLocaleString('en-US', {
        timeZone: timezone,
        dateStyle: 'full',
        timeStyle: 'short',
      });
      const meetLinkHtml = params.meetLink
        ? `<p><strong>Join Meeting:</strong> <a href="${params.meetLink}">${params.meetLink}</a></p>`
        : '<p>A meeting link will be shared with you before the session.</p>';
      const msgHtml = params.counselorMessage
        ? `<p><strong>Message from counselor:</strong> ${params.counselorMessage}</p>`
        : '';

      const html = `
        <p>Hi ${parent.displayName},</p>
        <p>Your appointment for <strong>${params.serviceName}</strong> for <strong>${params.childName}</strong> has been <strong>accepted</strong>.</p>
        <p><strong>Date &amp; Time:</strong> ${readableTime} (${timezone})</p>
        <p><strong>Duration:</strong> ${params.durationMinutes} minutes</p>
        ${msgHtml}
        ${meetLinkHtml}
        <p>Thank you,<br/>The IEP App Team</p>
      `;

      this.sendNotificationEmail(parent.email, `Appointment Confirmed: ${params.serviceName}`, html);
      this.sendTeamsCalendarInvite(
        parent.email,
        `${params.serviceName} — ${params.childName}`,
        html,
        params.scheduledAt,
        params.durationMinutes,
        timezone,
      );
    } catch (err) {
      logger.warn('Failed to send appointment accepted notifications', { params, error: err });
    }
  }

  /** Fire-and-forget: notify parent when counselor cancels the appointment. */
  private async notifyAppointmentCancelledByCounselor(params: {
    parentUserId: string;
    serviceName: string;
    childName: string;
    counselorMessage: string;
  }): Promise<void> {
    try {
      const parent = await this.repo.findUserById(params.parentUserId);
      if (!parent?.email) return;
      const msgHtml = params.counselorMessage
        ? `<p><strong>Counselor's message:</strong> ${params.counselorMessage}</p>`
        : '';
      const html = `
        <p>Hi ${parent.displayName},</p>
        <p>Your appointment for <strong>${params.serviceName}</strong> for <strong>${params.childName}</strong> has been <strong>cancelled</strong> by the counselor.</p>
        ${msgHtml}
        <p>Please book a new appointment at your convenience.</p>
        <p>Thank you,<br/>The IEP App Team</p>
      `;
      this.sendNotificationEmail(parent.email, `Appointment Cancelled: ${params.serviceName}`, html);
    } catch (err) {
      logger.warn('Failed to send counselor-cancelled notification', { params, error: err });
    }
  }

  /** Fire-and-forget: notify counselor when parent cancels the appointment. */
  private async notifyAppointmentCancelledByParent(params: {
    counselorId: string;
    serviceName: string;
    childName: string;
    parentName: string;
  }): Promise<void> {
    try {
      const counselor = await this.repo.findUserById(params.counselorId);
      if (!counselor?.email) return;
      const html = `
        <p>Hi ${counselor.displayName},</p>
        <p>The parent <strong>${params.parentName}</strong> has cancelled their appointment for <strong>${params.serviceName}</strong> for <strong>${params.childName}</strong>.</p>
        <p>Thank you,<br/>The IEP App Team</p>
      `;
      this.sendNotificationEmail(counselor.email, `Appointment Cancelled by Parent: ${params.serviceName}`, html);
    } catch (err) {
      logger.warn('Failed to send parent-cancelled notification', { params, error: err });
    }
  }

  /** Fire-and-forget: notify parent when appointment is marked completed. */
  private async notifyAppointmentCompleted(params: {
    parentUserId: string;
    serviceName: string;
    childName: string;
  }): Promise<void> {
    try {
      const parent = await this.repo.findUserById(params.parentUserId);
      if (!parent?.email) return;
      const html = `
        <p>Hi ${parent.displayName},</p>
        <p>Your appointment for <strong>${params.serviceName}</strong> for <strong>${params.childName}</strong> has been marked as <strong>completed</strong>.</p>
        <p>We hope the session was helpful. Feel free to book another appointment anytime.</p>
        <p>Thank you,<br/>The IEP App Team</p>
      `;
      this.sendNotificationEmail(parent.email, `Appointment Completed: ${params.serviceName}`, html);
    } catch (err) {
      logger.warn('Failed to send appointment completed notification', { params, error: err });
    }
  }

  /** Fire-and-forget: payment confirmed email + Teams calendar invite when no Google meet link. */
  private async notifyPaymentConfirmed(params: {
    parentUserId: string;
    counselorId: string;
    serviceName: string;
    childName: string;
    durationMinutes: number;
    scheduledAt: Date | null;
    meetLink: string | null;
  }): Promise<void> {
    try {
      const [parent, profile] = await Promise.all([
        this.repo.findUserById(params.parentUserId),
        this.repo.findOrCreateProfile(params.counselorId),
      ]);
      if (!parent?.email) return;

      const timezone = profile.timezone || 'Asia/Kolkata';
      const readableTime = params.scheduledAt
        ? params.scheduledAt.toLocaleString('en-US', { timeZone: timezone, dateStyle: 'full', timeStyle: 'short' })
        : 'To be scheduled';
      const meetLinkHtml = params.meetLink
        ? `<p><strong>Join Meeting:</strong> <a href="${params.meetLink}">${params.meetLink}</a></p>`
        : '';

      const html = `
        <p>Hi ${parent.displayName},</p>
        <p>Your payment for <strong>${params.serviceName}</strong> for <strong>${params.childName}</strong> has been confirmed.</p>
        <p><strong>Date &amp; Time:</strong> ${readableTime}${params.scheduledAt ? ` (${timezone})` : ''}</p>
        <p><strong>Duration:</strong> ${params.durationMinutes} minutes</p>
        ${meetLinkHtml}
        <p>Thank you,<br/>The IEP App Team</p>
      `;

      this.sendNotificationEmail(parent.email, `Payment Confirmed: ${params.serviceName}`, html);

      // Send Teams calendar invite if scheduled but no Google Meet link yet
      if (params.scheduledAt && !params.meetLink) {
        this.sendTeamsCalendarInvite(
          parent.email,
          `${params.serviceName} — ${params.childName}`,
          html,
          params.scheduledAt,
          params.durationMinutes,
          timezone,
        );
      }
    } catch (err) {
      logger.warn('Failed to send payment confirmed notifications', { params, error: err });
    }
  }
}
