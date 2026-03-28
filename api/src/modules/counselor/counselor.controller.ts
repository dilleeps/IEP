import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate.js';
import { CounselorServiceService } from './counselor.service.js';
import type {
  AvailabilityWindowResponse,
  CounselorAppointmentResponse,
  CounselorCatalogServiceResponse,
  CounselorDirectoryItemResponse,
  CounselorServiceMetadataResponse,
  CounselorProfileResponse,
  CounselorServiceResponse,
} from './counselor.types.js';

function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

export class CounselorController {
  private service: CounselorServiceService;

  constructor() {
    this.service = new CounselorServiceService();
  }

  listServices = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.listServices(req.user!.id);
      res.json({
        services: items.map((item) => this.toServiceResponse(item)),
      });
    } catch (error) {
      next(error);
    }
  };

  getGoogleConnectUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getGoogleConnectUrl(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  handleGoogleOAuthCallback = async (req: Request, res: Response, _next: NextFunction) => {
    const query = req.query as { code: string; state: string };
    const redirectUrl = await this.service.completeGoogleOAuthCallback(query.code, query.state);
    res.redirect(302, redirectUrl);
  };

  getServiceMetadata = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const metadata = await this.service.getServiceMetadata();
      res.json(this.toServiceMetadataResponse(metadata));
    } catch (error) {
      next(error);
    }
  };

  listCounselors = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.listActiveCounselors();
      res.json({
        counselors: items.map((item) => this.toCounselorDirectoryItem(item)),
      });
    } catch (error) {
      next(error);
    }
  };

  listCounselorSlots = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const date = req.query.date as string;
      const duration = Number(req.query.duration) || 60;
      const result = await this.service.listCounselorSlots(req.params.counselorId, { date, duration });
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  listCatalogServices = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.listCatalogServices();
      res.json({
        services: items.map((item) => this.toCatalogServiceResponse(item)),
      });
    } catch (error) {
      next(error);
    }
  };

  listCatalogSlots = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.listCatalogSlots(req.params.id, req.query as { date: string });
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  createParentAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const created = await this.service.createParentAppointment(req.user!.id, req.body);
      res.status(201).json(this.toAppointmentResponse(created));
    } catch (error) {
      next(error);
    }
  };

  listParentAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.listParentAppointments(req.user!.id);
      res.json({
        appointments: items.map((item) => this.toAppointmentResponse(item)),
      });
    } catch (error) {
      next(error);
    }
  };

  updateParentAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await this.service.updateParentAppointment(req.user!.id, req.params.id, req.body);
      res.json(this.toAppointmentResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  markParentAppointmentPaid = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await this.service.markParentAppointmentPaid(req.user!.id, req.params.id, req.body);
      res.json(this.toAppointmentResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  createParentPaymentSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const session = await this.service.createParentPaymentSession(req.user!.id, req.params.id);
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  };

  createService = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const created = await this.service.createService(req.user!.id, req.body);
      res.status(201).json(this.toServiceResponse(created));
    } catch (error) {
      next(error);
    }
  };

  updateService = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await this.service.updateService(req.user!.id, req.params.id, req.body);
      res.json(this.toServiceResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  deleteService = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteService(req.user!.id, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  listAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const windows = await this.service.listAvailability(req.user!.id);
      res.json({
        windows: windows.map((window) => this.toAvailabilityResponse(window)),
      });
    } catch (error) {
      next(error);
    }
  };

  replaceAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const windows = await this.service.replaceAvailability(req.user!.id, req.body);
      res.json({
        windows: windows.map((window) => this.toAvailabilityResponse(window)),
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await this.service.getProfile(req.user!.id);
      res.json(this.toProfileResponse(profile));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await this.service.updateProfile(req.user!.id, req.body);
      res.json(this.toProfileResponse(profile));
    } catch (error) {
      next(error);
    }
  };

  listAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.listAppointments(req.user!.id);
      res.json({
        appointments: items.map((item) => this.toAppointmentResponse(item)),
      });
    } catch (error) {
      next(error);
    }
  };

  updateAppointmentStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await this.service.updateAppointmentStatus(req.user!.id, req.params.id, req.body);
      res.json(this.toAppointmentResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  updateAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await this.service.updateCounselorAppointment(req.user!.id, req.params.id, req.body);
      res.json(this.toAppointmentResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  createAppointmentMeetLink = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await this.service.createCounselorAppointmentMeetLink(req.user!.id, req.params.id);
      res.json(this.toAppointmentResponse(updated));
    } catch (error) {
      next(error);
    }
  };

  private toServiceResponse(item: any): CounselorServiceResponse {
    return {
      id: item.id,
      name: item.name,
      serviceType: item.serviceType,
      durationMinutes: item.durationMinutes,
      priceCents: item.priceCents,
      paymentRequired: item.paymentRequired,
      description: item.description || '',
      createdAt: new Date(item.createdAt).toISOString(),
      updatedAt: new Date(item.updatedAt).toISOString(),
    };
  }

  private toAvailabilityResponse(item: any): AvailabilityWindowResponse {
    return {
      id: item.id,
      day: item.day,
      startTime: normalizeTime(item.startTime),
      endTime: normalizeTime(item.endTime),
      label: item.label,
    };
  }

  private toProfileResponse(item: any): CounselorProfileResponse {
    return {
      userId: item.userId,
      bio: item.bio || '',
      timezone: item.timezone || 'America/New_York',
      credentials: item.credentials || '',
      specializations: item.specializations || [],
      paymentEnabled: !!item.paymentEnabled,
      googleConnected: !!item.googleConnected,
      updatedAt: new Date(item.updatedAt).toISOString(),
    };
  }

  private toServiceMetadataResponse(input: any): CounselorServiceMetadataResponse {
    return {
      categories: (input.categories || []).map((item: any) => ({
        id: item.id,
        department: item.department,
        examples: item.examples,
        iconKey: item.iconKey,
      })),
      templates: (input.templates || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        serviceType: item.serviceType,
        durationMinutes: item.durationMinutes,
        priceCents: item.priceCents,
        paymentRequired: item.paymentRequired,
        description: item.description || '',
      })),
      durations: input.durations || [],
      customOption: input.customOption || 'Custom',
      filterAllLabel: input.filterAllLabel || 'All Departments',
    };
  }

  private toAppointmentResponse(item: any): CounselorAppointmentResponse {
    return {
      id: item.id,
      childId: item.childId,
      counselorId: item.counselorId,
      counselorServiceId: item.counselorServiceId ?? null,
      iepDocumentId: item.iepDocumentId || null,
      supportingDocumentIds: item.supportingDocumentIds || [],
      parentName: item.parentName,
      childName: item.childName,
      serviceName: item.serviceName,
      durationMinutes: item.durationMinutes,
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString() : null,
      status: item.status,
      paymentStatus: item.paymentStatus,
      paymentReference: item.paymentReference || null,
      meetLink: item.meetLink || null,
      calendarEventId: item.calendarEventId || null,
      counselorMessage: item.counselorMessage || '',
      notes: item.notes || '',
      createdAt: new Date(item.createdAt).toISOString(),
      updatedAt: new Date(item.updatedAt).toISOString(),
    };
  }

  private toCounselorDirectoryItem(user: any): CounselorDirectoryItemResponse {
    const profile = user.counselorProfile;
    return {
      id: user.id,
      displayName: user.displayName || 'Counselor',
      bio: profile?.bio || '',
      credentials: profile?.credentials || '',
      specializations: profile?.specializations || [],
      timezone: profile?.timezone || 'America/New_York',
    };
  }

  private toCatalogServiceResponse(item: any): CounselorCatalogServiceResponse {
    const counselor = item.counselor;
    const profile = counselor?.counselorProfile;

    return {
      id: item.id,
      name: item.name,
      serviceType: item.serviceType,
      durationMinutes: item.durationMinutes,
      priceCents: item.priceCents,
      paymentRequired: item.paymentRequired,
      description: item.description || '',
      counselor: {
        id: counselor?.id,
        displayName: counselor?.displayName || 'Counselor',
        bio: profile?.bio || '',
        credentials: profile?.credentials || '',
        specializations: profile?.specializations || [],
        timezone: profile?.timezone || 'America/New_York',
        paymentEnabled: !!profile?.paymentEnabled,
        googleConnected: !!profile?.googleConnected,
      },
    };
  }
}
