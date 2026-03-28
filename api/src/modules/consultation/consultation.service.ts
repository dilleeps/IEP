import { randomUUID } from 'node:crypto';
import { logger } from '../../config/logger.js';
import { AppError } from '../../shared/errors/appError.js';
import { sendHtmlEmail, sendHtmlEmailWithCalendarInvite } from '../../shared/notification/email.js';
import { ConsultationRepository } from './consultation.repo.js';
import { addMinutes, generateRawSlots, hashSlot, pad2 } from './consultation.slots.js';
import type {
  AvailableSlotsQueryDto,
  CreateConsultationDto,
  CreateConsultationSlotDto,
  UpdateConsultationDto,
} from './consultation.types.js';
import { EXPERT_CONSULTATION_EMAIL } from './consultation.types.js';

export class ConsultationService {
  private repo = new ConsultationRepository();

  // ─── Slots (Admin) ───────────────────────────────────────────────────────

  async createSlot(dto: CreateConsultationSlotDto) {
    return this.repo.createSlot({
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      durationMinutes: dto.durationMinutes ?? 30,
    });
  }

  async createSlotsBulk(slots: CreateConsultationSlotDto[]) {
    return this.repo.createSlotsBulk(
      slots.map((s) => ({
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes ?? 30,
      })),
    );
  }

  async deleteSlot(slotId: string) {
    const deleted = await this.repo.deleteSlot(slotId);
    if (deleted === 0) {
      throw new AppError('Slot not found or already booked', 404);
    }
  }

  /**
   * Auto-generate available consultation time slots for a given date.
   * Filters out already-booked slots and randomly hides some to create scarcity.
   */
  async listAvailableSlots(query: AvailableSlotsQueryDto) {
    // If no specific date, return DB slots (backward-compat for admin / range queries)
    if (!query.date) {
      return this.repo.listAvailableSlots(query);
    }

    const dateStr = query.date;

    // Generate all possible slots for this date
    const allSlots = generateRawSlots(dateStr);
    if (allSlots.length === 0) return [];

    // Get booked slots for this date from DB (unavailable ones)
    const bookedSlots = await this.repo.listBookedSlotsForDate(dateStr);
    const bookedTimes = new Set(bookedSlots.map((s) => s.startTime.slice(0, 5)));

    // Filter out booked slots
    let available = allSlots.filter((s) => !bookedTimes.has(s.startTime));

    // For today, also filter out past time slots (EST = UTC-5)
    const now = new Date();
    const estOffset = -5 * 60; // EST is UTC-5
    const estNow = new Date(now.getTime() + (estOffset + now.getTimezoneOffset()) * 60000);
    const todayEST = `${estNow.getFullYear()}-${pad2(estNow.getMonth() + 1)}-${pad2(estNow.getDate())}`;

    if (dateStr === todayEST) {
      const currentTime = `${pad2(estNow.getHours())}:${pad2(estNow.getMinutes())}`;
      available = available.filter((s) => s.startTime > currentTime);
    }

    // Apply scarcity — randomly hide ~30-50% of slots to show "limited availability"
    available = available.filter((s) => {
      const h = hashSlot(dateStr, s.startTime);
      // Keep ~55-70% of slots, varies by date
      const dateSeed = hashSlot(dateStr, 'seed');
      const threshold = 0.30 + dateSeed * 0.20; // 30-50% removed
      return h >= threshold;
    });

    return available;
  }

  // ─── Parent Booking ───────────────────────────────────────────────────────

  async bookConsultation(parentUserId: string, dto: CreateConsultationDto) {
    // Validate child belongs to parent
    const child = await this.repo.findChildForParent(parentUserId, dto.childId);
    if (!child) {
      throw new AppError('Child not found or does not belong to you', 404);
    }

    let slot: any;

    // Handle auto-generated virtual slots (format: "auto:YYYY-MM-DD:HH:mm")
    if (dto.slotId.startsWith('auto:')) {
      // ID format: auto:2026-03-09:17:00 → split into [auto, date, HH, mm]
      const match = dto.slotId.match(/^auto:(\d{4}-\d{2}-\d{2}):(\d{2}:\d{2})$/);
      if (!match) {
        throw new AppError('Invalid slot identifier', 400);
      }
      const dateStr = match[1];
      const startTime = match[2];
      const endTime = addMinutes(startTime, 30);

      // Validate the slot is actually valid for this date
      const rawSlots = generateRawSlots(dateStr);
      const matchingSlot = rawSlots.find((s) => s.startTime === startTime);
      if (!matchingSlot) {
        throw new AppError('This time slot is not available on the selected date', 400);
      }

      // Check if already booked at this time
      const existingSlot = await this.repo.findSlotByDateTime(dateStr, startTime);
      if (existingSlot && !existingSlot.isAvailable) {
        throw new AppError('This consultation slot has already been taken by another parent. Please select a different time slot.', 409);
      }

      // Create the real DB slot for this auto-generated time
      if (!existingSlot) {
        slot = await this.repo.createSlot({
          date: dateStr,
          startTime,
          endTime,
          durationMinutes: 30,
        });
      } else {
        slot = existingSlot;
      }

      // Update dto to use the real slot ID
      dto = { ...dto, slotId: slot.id };
    } else {
      // Standard DB slot flow
      slot = await this.repo.findSlotById(dto.slotId);
      if (!slot) {
        throw new AppError('Consultation slot not found', 404);
      }

      if (!slot.isAvailable) {
        throw new AppError('This consultation slot has already been taken by another parent. Please select a different time slot.', 409);
      }
    }

    // Check if parent already has an active booking on this date
    const existingBooking = await this.repo.findActiveConsultationForParentOnDate(parentUserId, slot.date);
    if (existingBooking) {
      throw new AppError('You already have a consultation booked for this date. Please cancel your existing booking first or choose a different date.', 409);
    }

    // Get parent info
    const parent = await this.repo.findUserById(parentUserId);
    if (!parent) {
      throw new AppError('Parent user not found', 404);
    }

    const childName = (child as any).name || 'Child';

    try {
      const consultation = await this.repo.bookSlot(dto.slotId, {
        parentUserId,
        childId: dto.childId,
        parentName: (parent as any).displayName || (parent as any).email || 'Parent',
        parentEmail: (parent as any).email || '',
        childName,
        concernArea: dto.concernArea || 'General IEP Consultation',
        notes: dto.notes || '',
      });

      // Auto-generate a meeting link using consultation ID
      const roomCode = consultation.id.replace(/-/g, '').slice(0, 12);
      const meetLink = `https://meet.jit.si/AskIEP-${roomCode}`;
      await this.repo.updateConsultation(consultation.id, { meetLink } as any);

      // Send notification email to expert (fire-and-forget)
      this.sendBookingNotificationToExpert({ ...consultation.toJSON(), meetLink }, slot).catch((err) => {
        logger.error('Failed to send expert notification email', { error: err.message });
      });

      // Send confirmation email to parent (fire-and-forget)
      this.sendBookingConfirmationToParent({ ...consultation.toJSON(), meetLink }, slot).catch((err) => {
        logger.error('Failed to send parent confirmation email', { error: err.message });
      });

      // Re-fetch with slot info
      return this.repo.findConsultationById(consultation.id);
    } catch (err: any) {
      if (err.message === 'SLOT_UNAVAILABLE') {
        throw new AppError('This consultation slot was just booked by another parent. Please select a different time slot.', 409);
      }
      throw err;
    }
  }

  async listMyConsultations(parentUserId: string) {
    return this.repo.listConsultationsByParent(parentUserId);
  }

  async cancelMyConsultation(parentUserId: string, consultationId: string) {
    const result = await this.repo.cancelConsultation(consultationId, parentUserId);
    if (!result) {
      throw new AppError('Consultation not found or cannot be cancelled', 404);
    }

    // Notify expert about cancellation
    this.sendCancellationNotificationToExpert(result).catch((err) => {
      logger.error('Failed to send cancellation notification', { error: err.message });
    });

    return result;
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async listAllConsultations(status?: string) {
    return this.repo.listAllConsultations(status as any);
  }

  async updateConsultation(consultationId: string, dto: UpdateConsultationDto) {
    const payload: Record<string, unknown> = {};
    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.expertNotes !== undefined) payload.expertNotes = dto.expertNotes;
    if (dto.meetLink !== undefined) payload.meetLink = dto.meetLink;

    if (dto.status === 'CANCELLED') {
      payload.cancelledAt = new Date();
    }

    const result = await this.repo.updateConsultation(consultationId, payload as any);
    if (!result) {
      throw new AppError('Consultation not found', 404);
    }

    // If status changed to CONFIRMED, send confirmation email to parent
    if (dto.status === 'CONFIRMED') {
      this.sendStatusUpdateToParent(result, 'CONFIRMED').catch((err) => {
        logger.error('Failed to send status update email', { error: err.message });
      });
    }

    // If admin cancels, release the slot
    if (dto.status === 'CANCELLED') {
      await this.repo.updateConsultation(consultationId, { cancelledAt: new Date() } as any);
      // The slot release is handled differently for admin — we need to do it here
      const { ExpertConsultationSlot } = await import('./consultation.model.js');
      await ExpertConsultationSlot.update(
        { isAvailable: true },
        { where: { id: result.slotId } },
      );
    }

    return result;
  }

  // ─── ICS Calendar Invite Generator ───────────────────────────────────────

  private generateICS(opts: {
    uid: string;
    summary: string;
    description: string;
    date: string;       // YYYY-MM-DD
    startTime: string;  // HH:mm (EST)
    endTime: string;    // HH:mm (EST)
    organizerEmail: string;
    organizerName: string;
    attendeeEmail: string;
    attendeeName: string;
    location?: string;
    method?: 'REQUEST' | 'CANCEL';
  }): string {
    const method = opts.method || 'REQUEST';
    // Convert date + time to ICS format in EST (America/New_York)
    const dtStart = `${opts.date.replace(/-/g, '')}T${opts.startTime.replace(':', '')}00`;
    const dtEnd = `${opts.date.replace(/-/g, '')}T${opts.endTime.replace(':', '')}00`;
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z/, 'Z');
    // Escape special chars for ICS text
    const esc = (s: string) => s.replace(/[\\;,\n]/g, (c) => c === '\n' ? '\\n' : `\\${c}`);

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AskIEP//Consultation//EN',
      'CALSCALE:GREGORIAN',
      `METHOD:${method}`,
      'BEGIN:VEVENT',
      `UID:${opts.uid}@askiep.com`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=America/New_York:${dtStart}`,
      `DTEND;TZID=America/New_York:${dtEnd}`,
      `SUMMARY:${esc(opts.summary)}`,
      `DESCRIPTION:${esc(opts.description)}`,
      ...(opts.location ? [`LOCATION:${esc(opts.location)}`] : []),
      `ORGANIZER;CN=${esc(opts.organizerName)}:mailto:${opts.organizerEmail}`,
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${esc(opts.attendeeName)}:mailto:${opts.attendeeEmail}`,
      `STATUS:${method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'}`,
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  // ─── Email Notifications ─────────────────────────────────────────────────

  private async sendBookingNotificationToExpert(consultation: any, slot: any): Promise<void> {
    const fromEmail = process.env.FROM_EMAIL_ADDRESS || 'noreply@askiep.com';
    const subject = `New Consultation Booking: ${consultation.parentName} - ${slot.date}`;

    const html = `
      <h2>New Expert Consultation Booking</h2>
      <p>A parent has booked a one-to-one expert consultation:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr><td style="padding: 8px; font-weight: bold;">Parent:</td><td style="padding: 8px;">${consultation.parentName}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${consultation.parentEmail}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Child:</td><td style="padding: 8px;">${consultation.childName}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Date:</td><td style="padding: 8px;">${slot.date}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Time:</td><td style="padding: 8px;">${slot.startTime} - ${slot.endTime} EST</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Concern Area:</td><td style="padding: 8px;">${consultation.concernArea}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Notes:</td><td style="padding: 8px;">${consultation.notes || 'None'}</td></tr>
      </table>
      ${consultation.meetLink ? `<p style="margin-top: 16px;"><strong>Join Meeting:</strong> <a href="${consultation.meetLink}" style="color: #2563eb;">${consultation.meetLink}</a></p>` : ''}
      <p>Please review and confirm this consultation in the admin panel.</p>
    `;

    const ics = this.generateICS({
      uid: consultation.id || randomUUID(),
      summary: `IEP Consultation: ${consultation.parentName} - ${consultation.concernArea}`,
      description: `Parent: ${consultation.parentName}\\nChild: ${consultation.childName}\\nConcern: ${consultation.concernArea}\\nNotes: ${consultation.notes || 'None'}${consultation.meetLink ? `\\n\\nJoin: ${consultation.meetLink}` : ''}`,
      location: consultation.meetLink || undefined,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      organizerEmail: fromEmail,
      organizerName: 'AskIEP',
      attendeeEmail: EXPERT_CONSULTATION_EMAIL,
      attendeeName: 'IEP Expert',
    });

    await sendHtmlEmailWithCalendarInvite(
      EXPERT_CONSULTATION_EMAIL,
      subject,
      html,
      ics,
    );
  }

  private async sendBookingConfirmationToParent(consultation: any, slot: any): Promise<void> {
    if (!consultation.parentEmail) return;

    const fromEmail = process.env.FROM_EMAIL_ADDRESS || 'noreply@askiep.com';
    const subject = `Consultation Booked: ${slot.date} at ${slot.startTime} EST`;

    const html = `
      <h2>Consultation Booking Confirmed</h2>
      <p>Your one-to-one expert consultation has been booked successfully.</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr><td style="padding: 8px; font-weight: bold;">Date:</td><td style="padding: 8px;">${slot.date}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Time:</td><td style="padding: 8px;">${slot.startTime} - ${slot.endTime} EST</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Concern Area:</td><td style="padding: 8px;">${consultation.concernArea}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Child:</td><td style="padding: 8px;">${consultation.childName}</td></tr>
      </table>
      ${consultation.meetLink ? `<p style="margin-top: 16px;"><strong>Join Meeting:</strong> <a href="${consultation.meetLink}" style="color: #2563eb;">${consultation.meetLink}</a></p>` : ''}
      <p>A calendar invite has been added to this email.</p>
      <p><strong>Important:</strong> This consultation is a prerequisite before engaging an advocate. Our expert will guide you through the next steps.</p>
    `;

    const ics = this.generateICS({
      uid: consultation.id || randomUUID(),
      summary: `AskIEP Expert Consultation - ${consultation.concernArea}`,
      description: `Your IEP expert consultation with AskIEP.\\nConcern: ${consultation.concernArea}\\nChild: ${consultation.childName}${consultation.meetLink ? `\\n\\nJoin: ${consultation.meetLink}` : ''}`,
      location: consultation.meetLink || undefined,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      organizerEmail: fromEmail,
      organizerName: 'AskIEP',
      attendeeEmail: consultation.parentEmail,
      attendeeName: consultation.parentName,
    });

    await sendHtmlEmailWithCalendarInvite(
      consultation.parentEmail,
      subject,
      html,
      ics,
    );
  }

  private async sendCancellationNotificationToExpert(consultation: any): Promise<void> {
    const fromEmail = process.env.FROM_EMAIL_ADDRESS || 'noreply@askiep.com';
    const slot = consultation.slot;

    const html = `
      <h2>Consultation Cancelled</h2>
      <p>A parent has cancelled their consultation:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr><td style="padding: 8px; font-weight: bold;">Parent:</td><td style="padding: 8px;">${consultation.parentName}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Child:</td><td style="padding: 8px;">${consultation.childName}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Concern Area:</td><td style="padding: 8px;">${consultation.concernArea}</td></tr>
      </table>
      <p>The time slot has been released and is available for other bookings.</p>
    `;

    // Send cancellation ICS to remove from calendar
    if (slot) {
      const ics = this.generateICS({
        uid: consultation.id,
        summary: `CANCELLED: IEP Consultation - ${consultation.parentName}`,
        description: 'This consultation has been cancelled by the parent.',
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        organizerEmail: fromEmail,
        organizerName: 'AskIEP',
        attendeeEmail: EXPERT_CONSULTATION_EMAIL,
        attendeeName: 'IEP Expert',
        method: 'CANCEL',
      });

      await sendHtmlEmailWithCalendarInvite(
        EXPERT_CONSULTATION_EMAIL,
        `Consultation Cancelled: ${consultation.parentName}`,
        html,
        ics,
      );
    } else {
      await sendHtmlEmail(
        EXPERT_CONSULTATION_EMAIL,
        `Consultation Cancelled: ${consultation.parentName}`,
        html,
      );
    }
  }

  private async sendStatusUpdateToParent(consultation: any, newStatus: string): Promise<void> {
    if (!consultation.parentEmail) return;

    const slot = consultation.slot;
    const html = `
      <h2>Consultation ${newStatus}</h2>
      <p>Your expert consultation has been confirmed by our team.</p>
      ${slot ? `
      <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr><td style="padding: 8px; font-weight: bold;">Date:</td><td style="padding: 8px;">${slot.date}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Time:</td><td style="padding: 8px;">${slot.startTime} - ${slot.endTime} EST</td></tr>
      </table>
      ` : ''}
      ${consultation.meetLink ? `<p><strong>Meeting Link:</strong> <a href="${consultation.meetLink}">${consultation.meetLink}</a></p>` : ''}
      <p>Please be ready at the scheduled time. If you need to cancel, please do so at least 24 hours in advance.</p>
    `;

    await sendHtmlEmail(
      consultation.parentEmail,
      `Consultation Confirmed: ${slot?.date || 'Upcoming'}`,
      html,
    );
  }
}
