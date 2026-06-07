/**
 * Subscription plans. Each plan gates which feature flags a tenant may enable
 * and sets soft limits. Prices are illustrative; wire real Stripe price IDs via
 * STRIPE_PRICE_<PLAN> env vars.
 */
export interface Plan {
  id: 'free' | 'starter' | 'pro';
  label: string;
  priceCents: number; // per month
  features: string[]; // feature-flag keys this plan unlocks
  limits: { staff: number; services: number };
  highlight?: boolean;
  stripePriceId?: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    label: 'Free',
    priceCents: 0,
    features: ['reviews', 'email'],
    limits: { staff: 2, services: 3 },
  },
  {
    id: 'starter',
    label: 'Starter',
    priceCents: 2900,
    features: ['reviews', 'email', 'coupons', 'giftcards', 'waitlist'],
    limits: { staff: 5, services: 25 },
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
  },
  {
    id: 'pro',
    label: 'Pro',
    priceCents: 7900,
    features: ['reviews', 'email', 'coupons', 'giftcards', 'waitlist', 'payments', 'sms'],
    limits: { staff: 50, services: 200 },
    highlight: true,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
];

export const planById = (id?: string): Plan => PLANS.find((p) => p.id === id) || PLANS[0];
export const planAllows = (id: string | undefined, feature: string): boolean => planById(id).features.includes(feature);
