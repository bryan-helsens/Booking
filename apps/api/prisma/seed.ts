/**
 * Seed: two white-label tenants with distinct branding, theme tokens,
 * pages (JSON layout), services and feature flags — to demonstrate that
 * the whole storefront is database-driven, nothing hardcoded.
 *
 *   Tenant "acme"   → "Acme Wellness Spa"  (warm, light, rounded)
 *   Tenant "studio" → "Studio Noir Barber" (dark, sharp, bold)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SQLite stores JSON as string (see src/common/json.ts).
const J = (v: unknown) => JSON.stringify(v ?? null);

// ─── Component registry: the blocks the page builder knows about ───
const COMPONENTS = [
  {
    type: 'hero',
    label: 'Hero',
    icon: 'Sunny',
    category: 'header',
    propsSchema: {
      title: { type: 'string', label: 'Titel' },
      subtitle: { type: 'string', label: 'Subtitel' },
      ctaLabel: { type: 'string', label: 'Knop tekst' },
      bgImage: { type: 'string', label: 'Achtergrond URL' },
      align: { type: 'select', label: 'Uitlijning', options: ['left', 'center'] },
    },
    defaults: {
      title: 'Welkom',
      subtitle: 'Boek vandaag nog je afspraak',
      ctaLabel: 'Boek nu',
      bgImage: '',
      align: 'center',
    },
  },
  {
    type: 'services',
    label: 'Diensten',
    icon: 'List',
    category: 'content',
    propsSchema: {
      title: { type: 'string', label: 'Titel' },
      columns: { type: 'number', label: 'Kolommen' },
    },
    defaults: { title: 'Onze diensten', columns: 3 },
  },
  {
    type: 'richtext',
    label: 'Tekstblok',
    icon: 'Document',
    category: 'content',
    propsSchema: {
      heading: { type: 'string', label: 'Kop' },
      body: { type: 'textarea', label: 'Tekst' },
    },
    defaults: { heading: 'Over ons', body: 'Vertel hier je verhaal.' },
  },
  {
    type: 'booking',
    label: 'Boekingsformulier',
    icon: 'Calendar',
    category: 'booking',
    propsSchema: {
      title: { type: 'string', label: 'Titel' },
    },
    defaults: { title: 'Maak een afspraak' },
  },
  {
    type: 'testimonials',
    label: 'Reviews',
    icon: 'Star',
    category: 'content',
    propsSchema: {
      title: { type: 'string', label: 'Titel' },
    },
    defaults: { title: 'Wat klanten zeggen' },
  },
  {
    type: 'contact',
    label: 'Contact',
    icon: 'Message',
    category: 'footer',
    propsSchema: {
      title: { type: 'string', label: 'Titel' },
    },
    defaults: { title: 'Contact' },
  },
];

const FEATURE_KEYS = [
  'payments',
  'reviews',
  'waitlist',
  'coupons',
  'giftcards',
  'email',
  'sms',
];

async function seedComponents() {
  for (const c of COMPONENTS) {
    const data = { label: c.label, icon: c.icon, category: c.category, propsSchema: J(c.propsSchema), defaults: J(c.defaults) };
    await prisma.componentDefinition.upsert({
      where: { type: c.type },
      update: data,
      create: { type: c.type, ...data },
    });
  }
}

interface TenantSeed {
  slug: string;
  name: string;
  host: string;
  mode: 'light' | 'dark';
  tokens: Record<string, any>;
  content: any;
  services: any[];
  pageSections: any[];
  features: Record<string, boolean>;
}

const TENANTS: TenantSeed[] = [
  {
    slug: 'acme',
    name: 'Acme Wellness Spa',
    host: 'acme.localhost',
    mode: 'light',
    tokens: {
      colorPrimary: '#0ea5a4',
      colorSecondary: '#f59e0b',
      colorAccent: '#ec4899',
      colorBg: '#ffffff',
      colorText: '#1f2937',
      fontBody: "'Inter', system-ui, sans-serif",
      fontHeading: "'Poppins', system-ui, sans-serif",
      radius: 16,
    },
    content: {
      companyName: 'Acme Wellness Spa',
      description: 'Ontspan, herstel en kom tot rust in onze wellness spa.',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Acme&backgroundColor=0ea5a4',
      faviconUrl: '',
      contact: { email: 'hallo@acmespa.nl', phone: '+31 20 123 4567', address: 'Kalverstraat 1, Amsterdam' },
      seo: { title: 'Acme Wellness Spa — Boek je behandeling', description: 'Massage, sauna en meer.', keywords: 'spa, wellness, massage', ogImage: '' },
      social: { facebook: 'https://facebook.com/acme', instagram: 'https://instagram.com/acme', x: '', linkedin: '' },
    },
    services: [
      { name: 'Ontspanningsmassage', description: '60 min volledige lichaamsmassage.', durationMin: 60, priceCents: 7500, capacity: 1, bufferAfter: 15 },
      { name: 'Hot Stone Therapie', description: 'Warme stenen behandeling.', durationMin: 90, priceCents: 11000, capacity: 1, bufferAfter: 15 },
      { name: 'Gezichtsbehandeling', description: 'Verzorgende facial.', durationMin: 45, priceCents: 6000, capacity: 2 },
    ],
    pageSections: [
      { id: 's1', type: 'hero', visible: true, props: { title: 'Welkom bij Acme Wellness', subtitle: 'Even helemaal tot rust komen.', ctaLabel: 'Boek je behandeling', bgImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600', align: 'center' } },
      { id: 's2', type: 'services', visible: true, props: { title: 'Onze behandelingen', columns: 3 } },
      { id: 's3', type: 'booking', visible: true, props: { title: 'Maak een afspraak' } },
      { id: 's4', type: 'testimonials', visible: true, props: { title: 'Wat onze gasten zeggen' } },
      { id: 's5', type: 'contact', visible: true, props: { title: 'Bezoek ons' } },
    ],
    features: { payments: false, reviews: true, waitlist: true, coupons: true, giftcards: false, email: true, sms: false },
  },
  {
    slug: 'studio',
    name: 'Studio Noir Barber',
    host: 'studio.localhost',
    mode: 'dark',
    tokens: {
      colorPrimary: '#eab308',
      colorSecondary: '#64748b',
      colorAccent: '#ef4444',
      colorBg: '#0f172a',
      colorText: '#e2e8f0',
      fontBody: "'Roboto', system-ui, sans-serif",
      fontHeading: "'Oswald', system-ui, sans-serif",
      radius: 2,
    },
    content: {
      companyName: 'Studio Noir Barber',
      description: 'Premium grooming voor de moderne man.',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Noir&backgroundColor=eab308',
      faviconUrl: '',
      contact: { email: 'info@studionoir.nl', phone: '+31 10 765 4321', address: 'Coolsingel 42, Rotterdam' },
      seo: { title: 'Studio Noir — Barbershop', description: 'Knippen, baard, hot towel shave.', keywords: 'barber, kapper, baard', ogImage: '' },
      social: { facebook: '', instagram: 'https://instagram.com/studionoir', x: 'https://x.com/studionoir', linkedin: '' },
    },
    services: [
      { name: 'Classic Cut', description: 'Knippen incl. styling.', durationMin: 30, priceCents: 3000, capacity: 1, bufferAfter: 5 },
      { name: 'Baard Trim', description: 'Baard bijwerken & verzorgen.', durationMin: 20, priceCents: 2000, capacity: 1 },
      { name: 'Hot Towel Shave', description: 'Klassieke scheerbeurt.', durationMin: 45, priceCents: 4000, capacity: 1, bufferAfter: 10 },
    ],
    pageSections: [
      { id: 's1', type: 'hero', visible: true, props: { title: 'STUDIO NOIR', subtitle: 'Sharp cuts. No compromise.', ctaLabel: 'Book a chair', bgImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600', align: 'left' } },
      { id: 's2', type: 'services', visible: true, props: { title: 'Services', columns: 3 } },
      { id: 's3', type: 'richtext', visible: true, props: { heading: 'Craftsmanship', body: 'Al 15 jaar het adres voor de scherpste cuts van Rotterdam.' } },
      { id: 's4', type: 'booking', visible: true, props: { title: 'Book your slot' } },
      { id: 's5', type: 'contact', visible: true, props: { title: 'Find us' } },
    ],
    features: { payments: false, reviews: false, waitlist: false, coupons: true, giftcards: true, email: true, sms: false },
  },
];

function defaultBusinessHours(tenantId: string) {
  // Mon-Fri 09:00-17:00, Sat 10:00-15:00, Sun closed.
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    if (weekday === 0) return { tenantId, weekday, openMin: 0, closeMin: 0, isClosed: true };
    if (weekday === 6) return { tenantId, weekday, openMin: 600, closeMin: 900, isClosed: false };
    return { tenantId, weekday, openMin: 540, closeMin: 1020, isClosed: false };
  });
}

async function seedTenant(t: TenantSeed) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: t.slug },
    update: { name: t.name },
    create: { slug: t.slug, name: t.name },
  });

  await prisma.domain.upsert({
    where: { host: t.host },
    update: {},
    create: { host: t.host, tenantId: tenant.id },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: `admin@${t.slug}.nl` } },
    update: {},
    create: { tenantId: tenant.id, email: `admin@${t.slug}.nl`, password: 'demo1234', name: 'Admin', role: 'owner' },
  });

  await prisma.themeConfig.upsert({
    where: { tenantId: tenant.id },
    update: { mode: t.mode, tokens: J(t.tokens) },
    create: { tenantId: tenant.id, mode: t.mode, tokens: J(t.tokens) },
  });

  const contentData = {
    companyName: t.content.companyName,
    description: t.content.description,
    logoUrl: t.content.logoUrl,
    faviconUrl: t.content.faviconUrl,
    contact: J(t.content.contact),
    seo: J(t.content.seo),
    social: J(t.content.social),
  };
  await prisma.siteContent.upsert({
    where: { tenantId: tenant.id },
    update: contentData,
    create: { tenantId: tenant.id, ...contentData },
  });

  const pageConfig = J({ version: 1, sections: t.pageSections });
  await prisma.page.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'home' } },
    update: { config: pageConfig },
    create: { tenantId: tenant.id, slug: 'home', title: 'Home', config: pageConfig },
  });

  for (const key of FEATURE_KEYS) {
    await prisma.featureFlag.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key } },
      update: { enabled: !!t.features[key] },
      create: { tenantId: tenant.id, key, enabled: !!t.features[key] },
    });
  }

  // Reset & recreate services + hours for idempotent seeding.
  await prisma.service.deleteMany({ where: { tenantId: tenant.id } });
  for (const s of t.services) {
    await prisma.service.create({ data: { tenantId: tenant.id, ...s } });
  }

  await prisma.businessHours.deleteMany({ where: { tenantId: tenant.id } });
  for (const bh of defaultBusinessHours(tenant.id)) {
    await prisma.businessHours.create({ data: bh });
  }

  console.log(`  ✓ ${t.name}  (slug: ${t.slug}, host: ${t.host})`);
}

async function main() {
  console.log('Seeding component registry...');
  await seedComponents();
  console.log('Seeding tenants...');
  for (const t of TENANTS) await seedTenant(t);
  console.log('Done. Demo logins: admin@acme.nl / admin@studio.nl  (password: demo1234)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
