// src/modules/plans/plan.service.ts
import { v4 as uuidv4 } from 'uuid';
import { PlanRepository } from './plan.repo.js';
import { CreatePlanDto, UpdatePlanDto, PlanResponse, PlansListResponse } from './plan.types.js';
import { AppError } from '../../shared/errors/appError.js';
import { SubscriptionPlan } from './plan.model.js';

function formatPrice(cents: number, period: string): string {
  if (cents === 0) return '$0/month';
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars}/${period}`;
}

function formatYearlyMonthly(yearlyCents: number): string {
  const monthly = (yearlyCents / 100 / 12).toFixed(2);
  return `$${monthly}/month`;
}

function toResponse(plan: SubscriptionPlan): PlanResponse {
  const regularPriceCents = plan.limits?.regularPriceCents as number | undefined;
  const yearlyPriceCents = plan.limits?.yearlyPriceCents as number | undefined;
  const yearlyRegularPriceCents = plan.limits?.yearlyRegularPriceCents as number | undefined;
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    priceCents: plan.priceCents,
    price: formatPrice(plan.priceCents, plan.billingPeriod),
    regularPrice: regularPriceCents ? formatPrice(regularPriceCents, plan.billingPeriod) : undefined,
    regularPriceCents: regularPriceCents ?? undefined,
    yearlyPriceCents: yearlyPriceCents ?? undefined,
    yearlyPrice: yearlyPriceCents ? formatPrice(yearlyPriceCents, 'year') : undefined,
    yearlyRegularPrice: yearlyRegularPriceCents ? formatPrice(yearlyRegularPriceCents, 'year') : undefined,
    yearlyRegularPriceCents: yearlyRegularPriceCents ?? undefined,
    yearlyMonthlyPrice: yearlyPriceCents ? formatYearlyMonthly(yearlyPriceCents) : undefined,
    billingPeriod: plan.billingPeriod,
    features: plan.features,
    limits: plan.limits,
    color: plan.color,
    badgeText: plan.badgeText,
    isFeatured: plan.isFeatured,
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
    targetAudience: plan.targetAudience,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export class PlanService {
  private repo: PlanRepository;

  constructor() {
    this.repo = new PlanRepository();
  }

  async listPublic(): Promise<PlansListResponse> {
    const plans = await this.repo.findAll(true);
    return { plans: plans.map(toResponse), total: plans.length };
  }

  async listAdmin(): Promise<PlansListResponse> {
    const plans = await this.repo.findAll(false);
    return { plans: plans.map(toResponse), total: plans.length };
  }

  async getById(id: string): Promise<PlanResponse> {
    const plan = await this.repo.findById(id);
    if (!plan) throw new AppError('Plan not found', 404);
    return toResponse(plan);
  }

  async create(dto: CreatePlanDto, createdBy?: string): Promise<PlanResponse> {
    const existing = await this.repo.findBySlug(dto.slug);
    if (existing) throw new AppError('A plan with this slug already exists', 400);

    const plan = await this.repo.create({
      id: uuidv4(),
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      priceCents: dto.priceCents,
      billingPeriod: dto.billingPeriod ?? 'month',
      features: dto.features,
      limits: dto.limits ?? {},
      color: dto.color,
      badgeText: dto.badgeText,
      isFeatured: dto.isFeatured ?? false,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
      targetAudience: dto.targetAudience,
      createdBy,
    });

    return toResponse(plan);
  }

  async update(id: string, dto: UpdatePlanDto): Promise<PlanResponse> {
    if (dto.slug) {
      const existing = await this.repo.findBySlug(dto.slug);
      if (existing && existing.id !== id) {
        throw new AppError('A plan with this slug already exists', 400);
      }
    }

    const plan = await this.repo.update(id, dto);
    if (!plan) throw new AppError('Plan not found', 404);
    return toResponse(plan);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new AppError('Plan not found', 404);
  }
}
