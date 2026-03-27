import { apiRequest } from "@/lib/http";
import { config } from "@/lib/config";
import type {
  BookConsultationPayload,
  ConsultationItem,
  ConsultationSlot,
} from "./types";

interface SlotsResponse {
  slots: ConsultationSlot[];
}

interface ConsultationsResponse {
  consultations: ConsultationItem[];
}

export class ConsultationDataService {
  async listAvailableSlots(token: string, date?: string): Promise<ConsultationSlot[]> {
    const url = date
      ? config.api.endpoints.consultation.availableSlotsForDate(date)
      : config.api.endpoints.consultation.availableSlots;

    const response = await apiRequest<SlotsResponse>(url, {
      method: "GET",
      token,
    });
    return response.slots;
  }

  async bookConsultation(token: string, payload: BookConsultationPayload): Promise<ConsultationItem> {
    return apiRequest<ConsultationItem>(config.api.endpoints.consultation.book, {
      method: "POST",
      token,
      body: payload,
    });
  }

  async listMyConsultations(token: string): Promise<ConsultationItem[]> {
    const response = await apiRequest<ConsultationsResponse>(config.api.endpoints.consultation.mine, {
      method: "GET",
      token,
    });
    return response.consultations;
  }

  async cancelMyConsultation(token: string, consultationId: string): Promise<ConsultationItem> {
    return apiRequest<ConsultationItem>(config.api.endpoints.consultation.cancelMine(consultationId), {
      method: "POST",
      token,
    });
  }
}

const consultationServiceInstance = new ConsultationDataService();

export function getConsultationService(): ConsultationDataService {
  return consultationServiceInstance;
}
