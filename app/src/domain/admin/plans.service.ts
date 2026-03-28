import { apiRequest } from '@/lib/http';
import { config } from '@/lib/config';

export interface PlanResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  price: string;
  regularPrice?: string;
  regularPriceCents?: number;
  yearlyPriceCents?: number;
  yearlyPrice?: string;
  yearlyRegularPrice?: string;
  yearlyRegularPriceCents?: number;
  yearlyMonthlyPrice?: string;
  billingPeriod: string;
  features: string[];
  limits: Record<string, number>;
  color?: string;
  badgeText?: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  targetAudience?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlansListResponse {
  plans: PlanResponse[];
  total: number;
}

export interface CreatePlanDto {
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  billingPeriod?: string;
  features: string[];
  limits?: Record<string, number>;
  color?: string;
  badgeText?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  targetAudience?: string;
}

export type UpdatePlanDto = Partial<CreatePlanDto>;

const getToken = () => {
  try {
    const sessionData = sessionStorage.getItem('askiep.session');
    if (!sessionData) return '';
    const session = JSON.parse(sessionData);
    return session?.accessToken || '';
  } catch {
    return '';
  }
};

export const planService = {
  // Public — no auth needed (login page)
  async getPublicPlans(): Promise<PlansListResponse> {
    const response = await fetch(
      config.api.resolveUrl(config.api.endpoints.plans.public)
    );
    if (!response.ok) throw new Error('Failed to fetch plans');
    return response.json() as Promise<PlansListResponse>;
  },

  async adminListPlans(): Promise<PlansListResponse> {
    return apiRequest<PlansListResponse>(
      config.api.endpoints.plans.adminList,
      { token: getToken() }
    );
  },

  async adminGetPlan(id: string): Promise<PlanResponse> {
    return apiRequest<PlanResponse>(
      config.api.endpoints.plans.adminGet.replace(':id', id),
      { token: getToken() }
    );
  },

  async adminCreatePlan(data: CreatePlanDto): Promise<PlanResponse> {
    return apiRequest<PlanResponse>(config.api.endpoints.plans.adminCreate, {
      method: 'POST',
      token: getToken(),
      body: data,
    });
  },

  async adminUpdatePlan(id: string, data: UpdatePlanDto): Promise<PlanResponse> {
    return apiRequest<PlanResponse>(
      config.api.endpoints.plans.adminUpdate.replace(':id', id),
      {
        method: 'PATCH',
        token: getToken(),
        body: data,
      }
    );
  },

  async adminDeletePlan(id: string): Promise<void> {
    await apiRequest<void>(
      config.api.endpoints.plans.adminDelete.replace(':id', id),
      {
        method: 'DELETE',
        token: getToken(),
      }
    );
  },
};
