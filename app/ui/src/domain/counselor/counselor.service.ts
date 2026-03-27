import { apiRequest } from "@/lib/http";
import { config } from "@/lib/config";
import type {
  CounselorAppointmentItem,
  CounselorCatalogServiceItem,
  CounselorDirectoryItem,
  CounselorGoogleConnectUrlResponse,
  CounselorPaymentSession,
  CounselorProfile,
  CounselorAvailabilityWindow,
  CounselorCatalogSlotAvailability,
  CreateCounselorAppointmentPayload,
  CounselorServiceMetadata,
  CounselorServiceItem,
  ReplaceAvailabilityPayload,
  SaveCounselorServicePayload,
  ConfirmDummyCounselorPaymentPayload,
  UpdateMyCounselorAppointmentPayload,
  UpdateCounselorAppointmentPayload,
  UpdateCounselorAppointmentStatusPayload,
  UpdateCounselorProfilePayload,
} from "./types";

interface CounselorServicesResponse {
  services: CounselorServiceItem[];
}

interface CounselorAvailabilityResponse {
  windows: CounselorAvailabilityWindow[];
}

interface CounselorAppointmentsResponse {
  appointments: CounselorAppointmentItem[];
}

interface CounselorCatalogResponse {
  services: CounselorCatalogServiceItem[];
}

export class CounselorDataService {
  async getGoogleConnectUrl(token: string): Promise<CounselorGoogleConnectUrlResponse> {
    return apiRequest<CounselorGoogleConnectUrlResponse>(config.api.endpoints.counselor.googleConnectUrl, {
      method: 'GET',
      token,
    });
  }

  async listServiceMetadata(token: string): Promise<CounselorServiceMetadata> {
    return apiRequest<CounselorServiceMetadata>(config.api.endpoints.counselor.serviceMetadata, {
      method: "GET",
      token,
    });
  }

  async listServices(token: string): Promise<CounselorServiceItem[]> {
    const response = await apiRequest<CounselorServicesResponse>(config.api.endpoints.counselor.services, {
      method: "GET",
      token,
    });

    return response.services;
  }

  async createService(token: string, payload: SaveCounselorServicePayload): Promise<CounselorServiceItem> {
    return apiRequest<CounselorServiceItem>(config.api.endpoints.counselor.services, {
      method: "POST",
      token,
      body: payload,
    });
  }

  async updateService(token: string, serviceId: string, payload: Partial<SaveCounselorServicePayload>): Promise<CounselorServiceItem> {
    return apiRequest<CounselorServiceItem>(config.api.endpoints.counselor.serviceById(serviceId), {
      method: "PATCH",
      token,
      body: payload,
    });
  }

  async deleteService(token: string, serviceId: string): Promise<void> {
    await apiRequest<void>(config.api.endpoints.counselor.serviceById(serviceId), {
      method: "DELETE",
      token,
    });
  }

  async listAvailability(token: string): Promise<CounselorAvailabilityWindow[]> {
    const response = await apiRequest<CounselorAvailabilityResponse>(config.api.endpoints.counselor.availability, {
      method: "GET",
      token,
    });

    return response.windows;
  }

  async replaceAvailability(token: string, payload: ReplaceAvailabilityPayload): Promise<CounselorAvailabilityWindow[]> {
    const response = await apiRequest<CounselorAvailabilityResponse>(config.api.endpoints.counselor.availability, {
      method: "PUT",
      token,
      body: payload,
    });

    return response.windows;
  }

  async getProfile(token: string): Promise<CounselorProfile> {
    return apiRequest<CounselorProfile>(config.api.endpoints.counselor.profile, {
      method: "GET",
      token,
    });
  }

  async updateProfile(token: string, payload: UpdateCounselorProfilePayload): Promise<CounselorProfile> {
    return apiRequest<CounselorProfile>(config.api.endpoints.counselor.profile, {
      method: "PUT",
      token,
      body: payload,
    });
  }

  async listAppointments(token: string): Promise<CounselorAppointmentItem[]> {
    const response = await apiRequest<CounselorAppointmentsResponse>(config.api.endpoints.counselor.appointments, {
      method: "GET",
      token,
    });

    return response.appointments;
  }

  async updateAppointmentStatus(
    token: string,
    appointmentId: string,
    payload: UpdateCounselorAppointmentStatusPayload,
  ): Promise<CounselorAppointmentItem> {
    return apiRequest<CounselorAppointmentItem>(config.api.endpoints.counselor.appointmentStatusById(appointmentId), {
      method: "PATCH",
      token,
      body: payload,
    });
  }

  async updateAppointment(
    token: string,
    appointmentId: string,
    payload: UpdateCounselorAppointmentPayload,
  ): Promise<CounselorAppointmentItem> {
    return apiRequest<CounselorAppointmentItem>(config.api.endpoints.counselor.appointmentById(appointmentId), {
      method: 'PATCH',
      token,
      body: payload,
    });
  }

  async createAppointmentMeetLink(token: string, appointmentId: string): Promise<CounselorAppointmentItem> {
    return apiRequest<CounselorAppointmentItem>(config.api.endpoints.counselor.appointmentMeetLinkById(appointmentId), {
      method: 'POST',
      token,
    });
  }

  async listCounselors(token: string): Promise<CounselorDirectoryItem[]> {
    const response = await apiRequest<{ counselors: CounselorDirectoryItem[] }>(
      config.api.endpoints.counselor.counselors,
      { method: 'GET', token },
    );
    return response.counselors;
  }

  async listCatalog(token: string): Promise<CounselorCatalogServiceItem[]> {
    const response = await apiRequest<CounselorCatalogResponse>(config.api.endpoints.counselor.catalog, {
      method: "GET",
      token,
    });

    return response.services;
  }

  async listCatalogSlots(token: string, counselorServiceId: string, date: string): Promise<CounselorCatalogSlotAvailability> {
    return apiRequest<CounselorCatalogSlotAvailability>(
      config.api.endpoints.counselor.catalogSlots(counselorServiceId, date),
      {
        method: "GET",
        token,
      },
    );
  }

  async listCounselorSlots(token: string, counselorId: string, date: string, duration: number): Promise<CounselorCatalogSlotAvailability> {
    return apiRequest<CounselorCatalogSlotAvailability>(
      config.api.endpoints.counselor.counselorSlots(counselorId, date, duration),
      {
        method: "GET",
        token,
      },
    );
  }

  async createAppointment(token: string, payload: CreateCounselorAppointmentPayload): Promise<CounselorAppointmentItem> {
    return apiRequest<CounselorAppointmentItem>(config.api.endpoints.counselor.parentAppointments, {
      method: "POST",
      token,
      body: payload,
    });
  }

  async listMyAppointments(token: string): Promise<CounselorAppointmentItem[]> {
    const response = await apiRequest<CounselorAppointmentsResponse>(config.api.endpoints.counselor.myAppointments, {
      method: "GET",
      token,
    });

    return response.appointments;
  }

  async updateMyAppointment(
    token: string,
    appointmentId: string,
    payload: UpdateMyCounselorAppointmentPayload,
  ): Promise<CounselorAppointmentItem> {
    return apiRequest<CounselorAppointmentItem>(config.api.endpoints.counselor.myAppointmentById(appointmentId), {
      method: "PATCH",
      token,
      body: payload,
    });
  }

  async confirmMyAppointmentPayment(
    token: string,
    appointmentId: string,
    payload: ConfirmDummyCounselorPaymentPayload,
  ): Promise<CounselorAppointmentItem> {
    return apiRequest<CounselorAppointmentItem>(config.api.endpoints.counselor.myAppointmentPaymentById(appointmentId), {
      method: 'PATCH',
      token,
      body: payload,
    });
  }

  async createMyAppointmentPaymentSession(token: string, appointmentId: string): Promise<CounselorPaymentSession> {
    return apiRequest<CounselorPaymentSession>(
      config.api.endpoints.counselor.myAppointmentPaymentSessionById(appointmentId),
      {
        method: 'POST',
        token,
      },
    );
  }
}

const counselorDataServiceInstance = new CounselorDataService();

export function getCounselorDataService(): CounselorDataService {
  return counselorDataServiceInstance;
}
