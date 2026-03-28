import Stripe from 'stripe';

export type PaymentGatewayType = 'mock' | 'stripe';

export interface PaymentCheckoutSession {
  sessionId: string;
  gateway: PaymentGatewayType;
  status: 'created';
  amountCents: number;
  currency: string;
  checkoutUrl: string;
  expiresAt: string;
}

export interface PaymentTransactionResult {
  gateway: PaymentGatewayType;
  transactionReference: string;
}

export interface CreateCheckoutSessionInput {
  appointmentId: string;
  amountCents: number;
  currency: string;
}

export interface CreateSubscriptionCheckoutInput {
  planName: string;
  planSlug: string;
  amountCents: number;
  currency: string;
  billingPeriod: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionCheckoutResult {
  sessionId: string;
  gateway: PaymentGatewayType;
  checkoutUrl: string;
}

export interface PaymentGatewayProvider {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<PaymentCheckoutSession>;
  confirmCheckoutSession(sessionId: string): Promise<PaymentTransactionResult>;
  createSubscriptionCheckout?(input: CreateSubscriptionCheckoutInput): Promise<SubscriptionCheckoutResult>;
}

export class MockPaymentGatewayProvider implements PaymentGatewayProvider {
  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<PaymentCheckoutSession> {
    const sessionId = `mock_sess_${input.appointmentId.slice(0, 8)}_${Date.now()}`;

    return {
      sessionId,
      gateway: 'mock',
      status: 'created',
      amountCents: input.amountCents,
      currency: input.currency,
      checkoutUrl: `mock://checkout/${sessionId}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  async confirmCheckoutSession(sessionId: string): Promise<PaymentTransactionResult> {
    if (!sessionId.startsWith('mock_sess_')) {
      throw new Error('Invalid mock payment session id');
    }

    return {
      gateway: 'mock',
      transactionReference: `mock_txn_${sessionId.slice(-12)}_${Date.now()}`,
    };
  }

  async createSubscriptionCheckout(input: CreateSubscriptionCheckoutInput): Promise<SubscriptionCheckoutResult> {
    const sessionId = `mock_sub_${input.planSlug}_${Date.now()}`;
    return {
      sessionId,
      gateway: 'mock',
      checkoutUrl: `mock://subscription/${sessionId}`,
    };
  }
}

export class StripePaymentGatewayProvider implements PaymentGatewayProvider {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey);
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<PaymentCheckoutSession> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: input.currency,
            unit_amount: input.amountCents,
            product_data: {
              name: `Appointment ${input.appointmentId}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointmentId: input.appointmentId,
      },
      success_url: process.env.STRIPE_SUCCESS_URL ?? `${process.env.HOST_URL}/counselor/appointments?payment=success`,
      cancel_url: process.env.STRIPE_CANCEL_URL ?? `${process.env.HOST_URL}/counselor/appointments?payment=cancelled`,
    });

    return {
      sessionId: session.id,
      gateway: 'stripe',
      status: 'created',
      amountCents: input.amountCents,
      currency: input.currency,
      checkoutUrl: session.url!,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  async confirmCheckoutSession(sessionId: string): Promise<PaymentTransactionResult> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }

    return {
      gateway: 'stripe',
      transactionReference: (session.payment_intent as string) ?? session.id,
    };
  }

  async createSubscriptionCheckout(input: CreateSubscriptionCheckoutInput): Promise<SubscriptionCheckoutResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: input.amountCents > 0 ? 'subscription' : 'setup',
      customer_email: input.userEmail,
      line_items: input.amountCents > 0
        ? [
            {
              price_data: {
                currency: input.currency,
                recurring: {
                  interval: input.billingPeriod === 'year' ? 'year' : 'month',
                },
                unit_amount: input.amountCents,
                product_data: {
                  name: input.planName,
                  metadata: { planSlug: input.planSlug },
                },
              },
              quantity: 1,
            },
          ]
        : undefined,
      metadata: {
        userId: input.userId,
        planSlug: input.planSlug,
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    return {
      sessionId: session.id,
      gateway: 'stripe',
      checkoutUrl: session.url!,
    };
  }
}

/**
 * Factory to create the appropriate payment gateway based on env config.
 */
export function createPaymentGateway(): PaymentGatewayProvider {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    return new StripePaymentGatewayProvider(stripeKey);
  }
  return new MockPaymentGatewayProvider();
}
