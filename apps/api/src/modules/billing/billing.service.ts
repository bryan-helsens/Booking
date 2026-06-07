import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context.service';
import { PLANS, planById } from '../../common/plans';

/**
 * Subscription billing. Works in "demo mode" out of the box (upgrades apply
 * immediately, no payment) and switches to real Stripe Checkout/Billing when
 * STRIPE_SECRET_KEY is configured.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe?: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
  ) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      this.logger.log('Billing: Stripe enabled');
    } else {
      this.logger.warn('Billing: demo mode (set STRIPE_SECRET_KEY for live payments)');
    }
  }

  private tenant() {
    return this.prisma.tenant.findUnique({ where: { id: this.ctx.id } });
  }

  async get() {
    const t = await this.tenant();
    return {
      plan: t?.plan || 'free',
      status: t?.subscriptionStatus || 'active',
      trialEndsAt: t?.trialEndsAt || null,
      plans: PLANS,
      stripeEnabled: !!this.stripe,
    };
  }

  async checkout(planId: string, origin: string) {
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan || plan.id === 'free') throw new BadRequestException('Invalid plan');
    const tenant = await this.tenant();
    if (!tenant) throw new BadRequestException('Tenant not found');

    // Demo mode: apply immediately.
    if (!this.stripe || !plan.stripePriceId) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { plan: plan.id, subscriptionStatus: 'active', trialEndsAt: null },
      });
      return { demo: true, plan: plan.id };
    }

    // Live: create a Stripe Checkout session.
    let customerId = tenant.stripeCustomerId || undefined;
    if (!customerId) {
      const customer = await this.stripe.customers.create({ name: tenant.name, metadata: { tenantId: tenant.id } });
      customerId = customer.id;
      await this.prisma.tenant.update({ where: { id: tenant.id }, data: { stripeCustomerId: customerId } });
    }
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${origin}/admin/billing?success=1`,
      cancel_url: `${origin}/admin/billing?canceled=1`,
      metadata: { tenantId: tenant.id, plan: plan.id },
    });
    return { url: session.url };
  }

  async downgradeToFree() {
    const tenant = await this.tenant();
    if (this.stripe && tenant?.stripeSubscriptionId) {
      await this.stripe.subscriptions.cancel(tenant.stripeSubscriptionId).catch(() => undefined);
    }
    await this.prisma.tenant.update({
      where: { id: this.ctx.id },
      data: { plan: 'free', subscriptionStatus: 'canceled', stripeSubscriptionId: null },
    });
    return { plan: 'free' };
  }

  async portal(origin: string) {
    const tenant = await this.tenant();
    if (!this.stripe || !tenant?.stripeCustomerId) return { demo: true };
    const session = await this.stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${origin}/admin/billing`,
    });
    return { url: session.url };
  }

  /** Stripe webhook — keeps tenant.plan in sync with subscription state. */
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) return { received: true };
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (e) {
      throw new BadRequestException(`Webhook signature failed: ${(e as Error).message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session;
      const tenantId = s.metadata?.tenantId;
      const plan = s.metadata?.plan;
      if (tenantId && plan) {
        await this.prisma.tenant.update({
          where: { id: tenantId },
          data: { plan, subscriptionStatus: 'active', stripeSubscriptionId: (s.subscription as string) || null },
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const t = await this.prisma.tenant.findFirst({ where: { stripeSubscriptionId: sub.id } });
      if (t) await this.prisma.tenant.update({ where: { id: t.id }, data: { plan: 'free', subscriptionStatus: 'canceled' } });
    }
    return { received: true };
  }
}

export { planById };
