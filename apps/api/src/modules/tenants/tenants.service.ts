import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { toJson } from '../../common/json';
import { hashPassword } from '../../common/password';

/** Starter theme presets offered during onboarding. */
const STARTER_THEMES: Record<string, { mode: 'light' | 'dark'; tokens: any }> = {
  fresh: {
    mode: 'light',
    tokens: { colorPrimary: '#0ea5a4', colorSecondary: '#f59e0b', colorAccent: '#ec4899', colorBg: '#ffffff', colorText: '#1f2937', fontBody: "'Inter', system-ui, sans-serif", fontHeading: "'Poppins', system-ui, sans-serif", radius: 16 },
  },
  bold: {
    mode: 'dark',
    tokens: { colorPrimary: '#eab308', colorSecondary: '#64748b', colorAccent: '#ef4444', colorBg: '#0f172a', colorText: '#e2e8f0', fontBody: "'Roboto', system-ui, sans-serif", fontHeading: "'Oswald', system-ui, sans-serif", radius: 2 },
  },
  elegant: {
    mode: 'light',
    tokens: { colorPrimary: '#7c3aed', colorSecondary: '#0ea5e9', colorAccent: '#f43f5e', colorBg: '#faf5ff', colorText: '#1e1b4b', fontBody: "'Lato', system-ui, sans-serif", fontHeading: "'Playfair Display', serif", radius: 10 },
  },
};

const FEATURE_DEFAULTS: Record<string, boolean> = {
  payments: false, reviews: true, waitlist: false, coupons: false, giftcards: false, email: true, sms: false,
};

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Public list used by the demo tenant switcher / login screen. */
  list() {
    return this.prisma.tenant.findMany({ select: { slug: true, name: true }, orderBy: { createdAt: 'asc' } });
  }

  /** Self-service onboarding: create a tenant + all default data + admin user. */
  async create(input: { companyName: string; email: string; password: string; description?: string; theme?: string }) {
    const companyName = (input.companyName || '').trim();
    const email = (input.email || '').trim().toLowerCase();
    if (companyName.length < 2) throw new BadRequestException('Bedrijfsnaam is verplicht');
    if (!/.+@.+\..+/.test(email)) throw new BadRequestException('Ongeldig e-mailadres');
    if ((input.password || '').length < 6) throw new BadRequestException('Wachtwoord moet minstens 6 tekens zijn');

    const slug = await this.uniqueSlug(companyName);
    const preset = STARTER_THEMES[input.theme || 'fresh'] || STARTER_THEMES.fresh;
    const passwordHash = await hashPassword(input.password);

    const tenant = await this.prisma.tenant.create({
      data: {
        slug,
        name: companyName,
        // Start every new tenant on a 14-day Pro trial.
        plan: 'pro',
        subscriptionStatus: 'trialing',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const sections = [
      { id: 's1', type: 'hero', visible: true, props: { title: `Welkom bij ${companyName}`, subtitle: input.description || 'Boek vandaag nog je afspraak.', ctaLabel: 'Boek nu', bgImage: '', align: 'center' } },
      { id: 's2', type: 'services', visible: true, props: { title: 'Onze diensten', columns: 3 } },
      { id: 's3', type: 'openinghours', visible: true, props: { title: 'Openingstijden' } },
      { id: 's4', type: 'booking', visible: true, props: { title: 'Maak een afspraak' } },
      { id: 's5', type: 'contact', visible: true, props: { title: 'Contact' } },
    ];

    await this.prisma.$transaction([
      this.prisma.domain.create({ data: { host: `${slug}.localhost`, tenantId: tenant.id } }),
      this.prisma.user.create({ data: { tenantId: tenant.id, email, password: passwordHash, name: 'Admin', role: 'owner' } }),
      this.prisma.themeConfig.create({ data: { tenantId: tenant.id, mode: preset.mode, tokens: toJson(preset.tokens) } }),
      this.prisma.siteContent.create({
        data: {
          tenantId: tenant.id,
          companyName,
          description: input.description || '',
          contact: toJson({ email, phone: '', address: '' }),
          seo: toJson({ title: companyName, description: input.description || '', keywords: '', ogImage: '' }),
          social: toJson({ facebook: '', instagram: '', x: '', linkedin: '' }),
        },
      }),
      this.prisma.page.create({ data: { tenantId: tenant.id, slug: 'home', title: 'Home', config: toJson({ version: 1, sections }) } }),
      ...Object.entries(FEATURE_DEFAULTS).map(([key, enabled]) =>
        this.prisma.featureFlag.create({ data: { tenantId: tenant.id, key, enabled } }),
      ),
      this.prisma.service.create({ data: { tenantId: tenant.id, name: 'Standaard afspraak', description: 'Een eerste voorbeelddienst — pas aan in de admin.', durationMin: 30, priceCents: 5000, capacity: 1 } }),
      this.prisma.service.create({ data: { tenantId: tenant.id, name: 'Uitgebreide afspraak', description: 'Langere sessie.', durationMin: 60, priceCents: 9000, capacity: 1, bufferAfter: 15 } }),
      ...this.defaultHours(tenant.id).map((h) => this.prisma.businessHours.create({ data: h })),
    ]);

    const token = await this.jwt.signAsync(
      { sub: tenant.id, email, role: 'owner', tenantId: tenant.id },
      { secret: process.env.JWT_SECRET || 'demo-secret', expiresIn: '7d' },
    );

    return { tenant: { slug, name: companyName }, token, user: { email, name: 'Admin', role: 'owner' } };
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // strip accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'site';
    let slug = base;
    let n = 1;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) slug = `${base}-${++n}`;
    return slug;
  }

  private defaultHours(tenantId: string) {
    return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
      if (weekday === 0) return { tenantId, weekday, openMin: 0, closeMin: 0, isClosed: true };
      if (weekday === 6) return { tenantId, weekday, openMin: 600, closeMin: 900, isClosed: false };
      return { tenantId, weekday, openMin: 540, closeMin: 1020, isClosed: false };
    });
  }
}
