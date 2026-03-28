// src/modules/plans/plan.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PlanService } from './plan.service.js';
import { createPaymentGateway } from '../counselor/payment-gateway.service.js';

const service = new PlanService();
const paymentGateway = createPaymentGateway();

export class PlanController {
  // Public: active plans for login page (no auth)
  listPublic = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.listPublic();
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  // Admin: all plans
  listAdmin = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.listAdmin();
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await service.getById(req.params.id);
      res.json(plan);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const plan = await service.create(req.body, userId);
      res.status(201).json(plan);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await service.update(req.params.id, req.body);
      res.json(plan);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // Create Stripe checkout session for a subscription plan
  createCheckout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const plan = await service.getById(req.params.id);

      if (!paymentGateway.createSubscriptionCheckout) {
        res.status(501).json({ error: 'Subscription checkout not available' });
        return;
      }

      const baseUrl = process.env.HOST_URL || (process.env.APP_ENVIRONMENT === 'production' ? 'https://askiep.com' : 'https://dev.askiep.com');
      const result = await paymentGateway.createSubscriptionCheckout({
        planName: plan.name,
        planSlug: plan.slug,
        amountCents: plan.priceCents,
        currency: 'usd',
        billingPeriod: plan.billingPeriod,
        userId: user.id,
        userEmail: user.email,
        successUrl: `${baseUrl}/billing?session_id={CHECKOUT_SESSION_ID}&plan=${plan.slug}`,
        cancelUrl: `${baseUrl}/billing?cancelled=true`,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
