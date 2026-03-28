// src/modules/plans/plan.types.ts

export interface PlanResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  price: string; // formatted, e.g. "$14.99"
  regularPrice?: string; // formatted regular price for strikethrough, e.g. "$14.99/month"
  regularPriceCents?: number;
  yearlyPriceCents?: number;
  yearlyPrice?: string;           // formatted, e.g. "$99.90/year"
  yearlyRegularPrice?: string;    // formatted regular yearly price for strikethrough
  yearlyRegularPriceCents?: number;
  yearlyMonthlyPrice?: string;    // effective monthly price when billed yearly, e.g. "$8.33/month"
  billingPeriod: string;
  features: string[];
  limits: Record<string, number>;
  color?: string;
  badgeText?: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  targetAudience?: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface UpdatePlanDto {
  name?: string;
  slug?: string;
  description?: string;
  priceCents?: number;
  billingPeriod?: string;
  features?: string[];
  limits?: Record<string, number>;
  color?: string;
  badgeText?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  targetAudience?: string;
}

export interface PlansListResponse {
  plans: PlanResponse[];
  total: number;
}
