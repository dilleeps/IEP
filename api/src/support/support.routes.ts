import { Router, Request, Response } from 'express';
import { sendEmail } from '../../shared/notification/email.js';

export const supportRouter = Router();

const SUPPORT_EMAIL = 'dilleeps@gmail.com';

/**
 * POST /api/v1/support/ticket
 * Sends a support ticket email to the support team
 */
supportRouter.post('/ticket', async (req: Request, res: Response) => {
  try {
    const { subject, message, userEmail, userName } = req.body;

    if (!subject || !message) {
      res.status(400).json({ error: 'Subject and message are required' });
      return;
    }

    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const emailBody = [
      `══════════════════════════════════════`,
      `   AskIEP Support Ticket`,
      `══════════════════════════════════════`,
      ``,
      `Ticket ID: ${ticketId}`,
      `Date: ${timestamp}`,
      ``,
      `── User Details ──────────────────────`,
      `Name: ${userName || 'Anonymous'}`,
      `Email: ${userEmail || 'Not provided'}`,
      ``,
      `── Ticket Details ───────────────────`,
      `Subject: ${subject}`,
      ``,
      `Message:`,
      message,
      ``,
      `══════════════════════════════════════`,
      `This ticket was submitted via AskIEP Support Chat.`,
      `Reply directly to ${userEmail || 'the user'} to respond.`,
    ].join('\n');

    const emailSubject = `[AskIEP Support] ${ticketId}: ${subject}`;

    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: emailSubject,
      body: emailBody,
    });

    res.json({
      success: true,
      ticketId,
      message: 'Support ticket submitted successfully',
    });
  } catch (error) {
    console.error('Failed to submit support ticket:', error);
    res.status(500).json({
      error: 'Failed to submit support ticket. Please try again later.',
    });
  }
});
