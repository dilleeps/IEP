// src/modules/plans/stripe-webhook.routes.ts
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '../auth/user.model.js';
import { logger } from '../../config/logger.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    logger.error('Stripe webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  const stripe = new Stripe(stripeSecretKey);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    logger.error(`Stripe webhook signature verification failed: ${err.message}`);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  logger.info(`Stripe webhook received: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planSlug = session.metadata?.planSlug;

        if (userId && planSlug) {
          await User.update(
            { subscriptionPlanSlug: planSlug } as any,
            { where: { id: userId } },
          );
          logger.info(`User ${userId} subscribed to plan: ${planSlug}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // If subscription becomes inactive, downgrade to free
        if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
          const user = await User.findOne({ where: { stripeCustomerId: customerId } as any });
          if (user) {
            await user.update({ subscriptionPlanSlug: 'informed_parent' } as any);
            logger.info(`User ${user.id} downgraded to free (subscription ${subscription.status})`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await User.findOne({ where: { stripeCustomerId: customerId } as any });
        if (user) {
          await user.update({ subscriptionPlanSlug: 'informed_parent' } as any);
          logger.info(`User ${user.id} subscription cancelled, downgraded to free`);
        }
        break;
      }

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    logger.error(`Error processing Stripe webhook ${event.type}: ${err.message}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
