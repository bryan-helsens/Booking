/**
 * Seed: two white-label tenants with distinct branding, theme tokens,
 * pages (JSON layout), services and feature flags — to demonstrate that
 * the whole storefront is database-driven, nothing hardcoded.
 *
 *   Tenant "acme"   → "Acme Wellness Spa"  (warm, light, rounded)
 *   Tenant "studio" → "Studio Noir Barber" (dark, sharp, bold)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
  {
    type: 'gallery',
    label: 'Galerij',
    icon: 'Picture',
    category: 'content',
    propsSchema: {
      title: { type: 'string', label: 'Titel' },
      images: { type: 'textarea', label: 'Afbeeldings-URLs (één per regel)' },
    },
    defaults: { title: 'Galerij', images: '' },
  },
  {
    type: 'openinghours',
    label: 'Openingstijden',
    icon: 'Clock',
    category: 'content',
    propsSchema: {
      title: { type: 'string', label: 'Titel' },
    },
    defaults: { title: 'Openingstijden' },
  },
  {
    type: 'faq',
    label: 'FAQ',
    icon: 'QuestionFilled',
    category: 'content',
    propsSchema: {
      title: { type: 'string', label: 'Titel' },
      items: { type: 'textarea', label: 'Vraag|Antwoord (één per regel)' },
    },
    defaults: {
      title: 'Veelgestelde vragen',
      items: 'Hoe boek ik?|Kies een dienst en tijdslot via de boekingspagina.\nKan ik annuleren?|Ja, tot 24u van tevoren kosteloos.',
    },
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
  reviews: { author: string; rating: number; quote: string }[];
  coupons: { code: string; percentOff: number }[];
  settings?: any;
  staff?: { name: string; title?: string }[];
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
      { name: 'Ontspanningsmassage', description: '60 min volledige lichaamsmassage.', imageUrl: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600', durationMin: 60, priceCents: 7500, capacity: 1, bufferAfter: 15 },
      { name: 'Hot Stone Therapie', description: 'Warme stenen behandeling.', imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600', durationMin: 90, priceCents: 11000, capacity: 1, bufferAfter: 15 },
      { name: 'Gezichtsbehandeling', description: 'Verzorgende facial.', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600', durationMin: 45, priceCents: 6000, capacity: 2 },
    ],
    pageSections: [
      { id: 's1', type: 'hero', visible: true, props: { title: 'Welkom bij Acme Wellness', subtitle: 'Even helemaal tot rust komen.', ctaLabel: 'Boek je behandeling', bgImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600', align: 'center' } },
      { id: 's2', type: 'services', visible: true, props: { title: 'Onze behandelingen', columns: 3 } },
      { id: 's3', type: 'openinghours', visible: true, props: { title: 'Openingstijden' } },
      { id: 's4', type: 'booking', visible: true, props: { title: 'Maak een afspraak' } },
      { id: 's5', type: 'testimonials', visible: true, props: { title: 'Wat onze gasten zeggen' } },
      { id: 's6', type: 'faq', visible: true, props: { title: 'Veelgestelde vragen', items: 'Hoe boek ik een behandeling?|Kies een dienst en een tijdslot via de boekingspagina.\nKan ik kosteloos annuleren?|Ja, tot 24 uur van tevoren.\nBieden jullie cadeaubonnen aan?|Ja, neem contact op voor meer info.' } },
      { id: 's7', type: 'contact', visible: true, props: { title: 'Bezoek ons' } },
    ],
    features: { payments: false, reviews: true, waitlist: true, coupons: true, giftcards: false, email: true, sms: false },
    reviews: [
      { author: 'Sanne de Vries', rating: 5, quote: 'Heerlijk ontspannen! De massage was fantastisch en het personeel super vriendelijk.' },
      { author: 'Mark Jansen', rating: 5, quote: 'Top service van begin tot eind. Kom zeker terug.' },
      { author: 'Iris Bakker', rating: 4, quote: 'Makkelijk online te boeken en een prachtige locatie.' },
    ],
    coupons: [{ code: 'WELKOM10', percentOff: 10 }],
    settings: {
      bookingRules: { maxDaysAhead: 45, leadTimeMinutes: 120, slotIntervalMin: 0, cancellationHours: 24 },
      regional: { currency: 'EUR', locale: 'nl-NL', timezone: 'Europe/Amsterdam' },
      formFields: [{ key: 'phone', label: 'Telefoonnummer', type: 'text', required: true }],
      closures: [
        { from: '2026-07-20', to: '2026-08-03', label: 'Zomervakantie' },
        { from: '2026-12-25', to: '2026-12-26', label: 'Kerst' },
      ],
    },
    staff: [
      { name: 'Eva Smit', title: 'Massagetherapeut' },
      { name: 'Noor de Wit', title: 'Schoonheidsspecialist' },
    ],
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
      { name: 'Classic Cut', description: 'Knippen incl. styling.', imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600', durationMin: 30, priceCents: 3000, capacity: 1, bufferAfter: 5 },
      { name: 'Baard Trim', description: 'Baard bijwerken & verzorgen.', imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600', durationMin: 20, priceCents: 2000, capacity: 1 },
      { name: 'Hot Towel Shave', description: 'Klassieke scheerbeurt.', imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600', durationMin: 45, priceCents: 4000, capacity: 1, bufferAfter: 10 },
    ],
    pageSections: [
      { id: 's1', type: 'hero', visible: true, props: { title: 'STUDIO NOIR', subtitle: 'Sharp cuts. No compromise.', ctaLabel: 'Book a chair', bgImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600', align: 'left' } },
      { id: 's2', type: 'services', visible: true, props: { title: 'Services', columns: 3 } },
      { id: 's3', type: 'richtext', visible: true, props: { heading: 'Craftsmanship', body: 'Al 15 jaar het adres voor de scherpste cuts van Rotterdam.' } },
      { id: 's4', type: 'gallery', visible: true, props: { title: 'Our work', images: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600\nhttps://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600\nhttps://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600' } },
      { id: 's5', type: 'booking', visible: true, props: { title: 'Book your slot' } },
      { id: 's6', type: 'testimonials', visible: true, props: { title: 'Reviews' } },
      { id: 's7', type: 'contact', visible: true, props: { title: 'Find us' } },
    ],
    features: { payments: false, reviews: true, waitlist: false, coupons: true, giftcards: true, email: true, sms: false },
    reviews: [
      { author: 'Tom H.', rating: 5, quote: 'Scherpste fade van de stad. Vakmanschap.' },
      { author: 'Younes B.', rating: 5, quote: 'Hot towel shave is een aanrader. Echte ervaring.' },
    ],
    coupons: [{ code: 'NOIR15', percentOff: 15 }],
    settings: {
      bookingRules: { maxDaysAhead: 30, leadTimeMinutes: 60, slotIntervalMin: 0, cancellationHours: 12 },
      regional: { currency: 'EUR', locale: 'nl-NL', timezone: 'Europe/Amsterdam' },
      formFields: [],
    },
    staff: [
      { name: 'Sam', title: 'Master Barber' },
      { name: 'Younes', title: 'Barber' },
    ],
  },
  {
    slug: 'lumen',
    name: 'Lumen Tandartspraktijk',
    host: 'lumen.localhost',
    mode: 'light',
    tokens: { colorPrimary: '#2563eb', colorSecondary: '#0891b2', colorAccent: '#f97316', colorBg: '#ffffff', colorText: '#0f172a', fontBody: "'Inter', system-ui, sans-serif", fontHeading: "'Poppins', system-ui, sans-serif", radius: 12 },
    content: {
      companyName: 'Lumen Tandartspraktijk',
      description: 'Moderne tandheelkunde met een persoonlijke aanpak.',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Lumen&backgroundColor=2563eb',
      faviconUrl: '',
      contact: { email: 'info@lumentandarts.nl', phone: '+31 30 222 3344', address: 'Maliebaan 12, Utrecht' },
      seo: { title: 'Lumen Tandartspraktijk — Maak een afspraak', description: 'Controle, reiniging en behandelingen.', keywords: 'tandarts, gebitsreiniging, utrecht', ogImage: '' },
      social: { facebook: '', instagram: 'https://instagram.com/lumen', x: '', linkedin: 'https://linkedin.com/company/lumen' },
    },
    services: [
      { name: 'Periodieke controle', description: 'Halfjaarlijkse controle.', imageUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600', durationMin: 20, priceCents: 4000, capacity: 1, bufferAfter: 5 },
      { name: 'Gebitsreiniging', description: 'Professionele reiniging door de mondhygiënist.', imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600', durationMin: 45, priceCents: 7500, capacity: 1, bufferAfter: 10 },
      { name: 'Vulling', description: 'Wit composiet vulling.', imageUrl: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600', durationMin: 30, priceCents: 9000, capacity: 1, bufferAfter: 10 },
    ],
    pageSections: [
      { id: 's1', type: 'hero', visible: true, props: { title: 'Een gezonde glimlach begint hier', subtitle: 'Moderne, pijnvrije tandheelkunde in Utrecht.', ctaLabel: 'Plan je controle', bgImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1600', align: 'center' } },
      { id: 's2', type: 'services', visible: true, props: { title: 'Onze behandelingen', columns: 3 } },
      { id: 's3', type: 'openinghours', visible: true, props: { title: 'Openingstijden' } },
      { id: 's4', type: 'booking', visible: true, props: { title: 'Maak een afspraak' } },
      { id: 's5', type: 'testimonials', visible: true, props: { title: 'Wat patiënten zeggen' } },
      { id: 's6', type: 'contact', visible: true, props: { title: 'Contact' } },
    ],
    features: { payments: false, reviews: true, waitlist: true, coupons: false, giftcards: false, email: true, sms: false },
    reviews: [
      { author: 'Petra K.', rating: 5, quote: 'Eindelijk een tandarts zonder stress. Zeer vriendelijk team.' },
      { author: 'Hassan D.', rating: 5, quote: 'Snel geholpen en alles duidelijk uitgelegd.' },
    ],
    coupons: [],
    settings: {
      bookingRules: { maxDaysAhead: 90, leadTimeMinutes: 240, slotIntervalMin: 0, cancellationHours: 48 },
      regional: { currency: 'EUR', locale: 'nl-NL', timezone: 'Europe/Amsterdam' },
      formFields: [{ key: 'insurance', label: 'Zorgverzekeraar', type: 'text', required: false }],
    },
    staff: [
      { name: 'Dr. Mertens', title: 'Tandarts' },
      { name: 'Dr. Aydin', title: 'Tandarts' },
    ],
  },
  {
    slug: 'zen',
    name: 'Zen Yoga Studio',
    host: 'zen.localhost',
    mode: 'light',
    tokens: { colorPrimary: '#16a34a', colorSecondary: '#ca8a04', colorAccent: '#0d9488', colorBg: '#f7fdf9', colorText: '#1c3a2e', fontBody: "'Lato', system-ui, sans-serif", fontHeading: "'Playfair Display', serif", radius: 20 },
    content: {
      companyName: 'Zen Yoga Studio',
      description: 'Vind je balans. Yoga voor lichaam en geest.',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Zen&backgroundColor=16a34a',
      faviconUrl: '',
      contact: { email: 'hallo@zenyoga.nl', phone: '+31 20 555 7788', address: 'Prinsengracht 88, Amsterdam' },
      seo: { title: 'Zen Yoga Studio — Boek je les', description: 'Vinyasa, Yin en privélessen.', keywords: 'yoga, amsterdam, vinyasa, yin', ogImage: '' },
      social: { facebook: '', instagram: 'https://instagram.com/zenyoga', x: '', linkedin: '' },
    },
    services: [
      { name: 'Vinyasa Flow', description: 'Dynamische les voor alle niveaus.', imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', durationMin: 60, priceCents: 1800, capacity: 12, bufferAfter: 15 },
      { name: 'Yin Yoga', description: 'Rustige, diepe stretch.', imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600', durationMin: 75, priceCents: 2000, capacity: 10, bufferAfter: 15 },
      { name: 'Privéles', description: 'Persoonlijke begeleiding.', imageUrl: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=600', durationMin: 60, priceCents: 6000, capacity: 1 },
    ],
    pageSections: [
      { id: 's1', type: 'hero', visible: true, props: { title: 'Adem in. Kom thuis.', subtitle: 'Yoga voor lichaam en geest, midden in Amsterdam.', ctaLabel: 'Boek een les', bgImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1600', align: 'center' } },
      { id: 's2', type: 'services', visible: true, props: { title: 'Onze lessen', columns: 3 } },
      { id: 's3', type: 'gallery', visible: true, props: { title: 'Onze studio', images: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=600\nhttps://images.unsplash.com/photo-1552286450-4a669f880062?w=600\nhttps://images.unsplash.com/photo-1593810450967-f9c42742e326?w=600' } },
      { id: 's4', type: 'booking', visible: true, props: { title: 'Reserveer je matje' } },
      { id: 's5', type: 'testimonials', visible: true, props: { title: 'Ervaringen' } },
      { id: 's6', type: 'contact', visible: true, props: { title: 'Bezoek de studio' } },
    ],
    features: { payments: false, reviews: true, waitlist: true, coupons: true, giftcards: true, email: true, sms: false },
    reviews: [
      { author: 'Sophie M.', rating: 5, quote: 'Heerlijke sfeer en topdocenten. Mijn wekelijkse rustpunt.' },
      { author: 'Daan V.', rating: 4, quote: 'Fijne lessen, goed voor beginners.' },
    ],
    coupons: [{ code: 'NAMASTE', percentOff: 20 }],
    settings: {
      bookingRules: { maxDaysAhead: 30, leadTimeMinutes: 60, slotIntervalMin: 0, cancellationHours: 6 },
      regional: { currency: 'EUR', locale: 'nl-NL', timezone: 'Europe/Amsterdam' },
      formFields: [{ key: 'level', label: 'Ervaringsniveau', type: 'select', required: false, options: ['Beginner', 'Gemiddeld', 'Gevorderd'] }],
    },
    staff: [
      { name: 'Maya', title: 'Yogadocent' },
      { name: 'Lotte', title: 'Yin-specialist' },
    ],
  },
  {
    slug: 'ink',
    name: 'Ink & Co Tattoo',
    host: 'ink.localhost',
    mode: 'dark',
    tokens: { colorPrimary: '#dc2626', colorSecondary: '#a3a3a3', colorAccent: '#f59e0b', colorBg: '#0a0a0a', colorText: '#e5e5e5', fontBody: "'Roboto', system-ui, sans-serif", fontHeading: "'Oswald', system-ui, sans-serif", radius: 2 },
    content: {
      companyName: 'Ink & Co Tattoo',
      description: 'Custom tattoos by award-winning artists.',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Ink&backgroundColor=dc2626',
      faviconUrl: '',
      contact: { email: 'studio@inkco.nl', phone: '+31 10 999 0011', address: 'Witte de Withstraat 30, Rotterdam' },
      seo: { title: 'Ink & Co Tattoo — Book a session', description: 'Custom tattoos, consults en cover-ups.', keywords: 'tattoo, rotterdam, custom ink', ogImage: '' },
      social: { facebook: '', instagram: 'https://instagram.com/inkco', x: 'https://x.com/inkco', linkedin: '' },
    },
    services: [
      { name: 'Gratis consult', description: 'Bespreek je idee met een artist.', imageUrl: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600', durationMin: 30, priceCents: 0, capacity: 1 },
      { name: 'Kleine tattoo', description: 'Tot 10cm, één sessie.', imageUrl: 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=600', durationMin: 60, priceCents: 12000, capacity: 1, bufferAfter: 15 },
      { name: 'Sleeve sessie', description: 'Grote stukken, per sessie.', imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=600', durationMin: 180, priceCents: 45000, capacity: 1, bufferAfter: 30 },
    ],
    pageSections: [
      { id: 's1', type: 'hero', visible: true, props: { title: 'INK & CO', subtitle: 'Custom tattoos. Award-winning artists.', ctaLabel: 'Book a session', bgImage: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?w=1600', align: 'left' } },
      { id: 's2', type: 'services', visible: true, props: { title: 'Services', columns: 3 } },
      { id: 's3', type: 'gallery', visible: true, props: { title: 'Recent work', images: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=600\nhttps://images.unsplash.com/photo-1590246814883-57c511e76523?w=600\nhttps://images.unsplash.com/photo-1542727365-19732a80dcfd?w=600' } },
      { id: 's4', type: 'booking', visible: true, props: { title: 'Book your slot' } },
      { id: 's5', type: 'faq', visible: true, props: { title: 'FAQ', items: 'Doet het pijn?|Iedereen ervaart het anders; onze artists werken zo comfortabel mogelijk.\nHoe bereid ik me voor?|Goed eten, hydrateren en uitgerust komen.' } },
      { id: 's6', type: 'contact', visible: true, props: { title: 'Find the studio' } },
    ],
    features: { payments: false, reviews: true, waitlist: true, coupons: false, giftcards: true, email: true, sms: false },
    reviews: [
      { author: 'Milan R.', rating: 5, quote: 'Insane detail. Exactly what I wanted.' },
      { author: 'Eline T.', rating: 5, quote: 'Super clean studio and amazing artists.' },
    ],
    coupons: [],
    settings: {
      bookingRules: { maxDaysAhead: 120, leadTimeMinutes: 1440, slotIntervalMin: 0, cancellationHours: 48 },
      regional: { currency: 'EUR', locale: 'nl-NL', timezone: 'Europe/Amsterdam' },
      formFields: [
        { key: 'idea', label: 'Beschrijf je idee', type: 'textarea', required: true },
        { key: 'placement', label: 'Plaatsing op lichaam', type: 'text', required: false },
      ],
    },
    staff: [
      { name: 'Rico', title: 'Resident Artist' },
      { name: 'Vera', title: 'Fine-line Artist' },
    ],
  },
  {
    slug: 'pilates',
    name: 'Core & Co Pilates',
    host: 'pilates.localhost',
    mode: 'light',
    tokens: { colorPrimary: '#db2777', colorSecondary: '#f59e0b', colorAccent: '#14b8a6', colorBg: '#fffafc', colorText: '#3f2233', fontBody: "'Montserrat', system-ui, sans-serif", fontHeading: "'Poppins', system-ui, sans-serif", radius: 18 },
    content: {
      companyName: 'Core & Co Pilates',
      description: 'Sterker, soepeler en in balans — Pilates voor elk niveau.',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Core&backgroundColor=db2777',
      faviconUrl: '',
      contact: { email: 'hallo@coreandco.nl', phone: '+31 70 333 2211', address: 'Frederikstraat 5, Den Haag' },
      seo: { title: 'Core & Co Pilates — Boek je les', description: 'Reformer, Mat en privé Pilates in Den Haag.', keywords: 'pilates, reformer, den haag, mat pilates', ogImage: '' },
      social: { facebook: '', instagram: 'https://instagram.com/coreandco', x: '', linkedin: '' },
    },
    services: [
      { name: 'Reformer Pilates', description: 'Krachtige reformer-les in kleine groep.', imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600', durationMin: 50, priceCents: 2500, capacity: 6, bufferAfter: 10 },
      { name: 'Mat Pilates', description: 'Klassieke matwork voor core-stabiliteit.', imageUrl: 'https://images.unsplash.com/photo-1591258739299-21e0e9f0a3b6?w=600', durationMin: 45, priceCents: 1800, capacity: 12, bufferAfter: 10 },
      { name: 'Privé sessie', description: 'Een-op-een begeleiding op maat.', imageUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600', durationMin: 60, priceCents: 6500, capacity: 1 },
    ],
    pageSections: [
      { id: 's1', type: 'hero', visible: true, props: { title: 'Vind je kracht. Vind je balans.', subtitle: 'Pilates voor elk niveau, midden in Den Haag.', ctaLabel: 'Boek je eerste les', bgImage: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1600', align: 'center' } },
      { id: 's2', type: 'services', visible: true, props: { title: 'Onze lessen', columns: 3 } },
      { id: 's3', type: 'openinghours', visible: true, props: { title: 'Lesrooster & openingstijden' } },
      { id: 's4', type: 'booking', visible: true, props: { title: 'Reserveer je plek' } },
      { id: 's5', type: 'testimonials', visible: true, props: { title: 'Wat onze leden zeggen' } },
      { id: 's6', type: 'faq', visible: true, props: { title: 'Veelgestelde vragen', items: 'Heb ik ervaring nodig?|Nee, we hebben lessen voor elk niveau — ook complete beginners.\nWat moet ik meenemen?|Comfortabele kleding en antislip-sokken. De rest verzorgen wij.' } },
      { id: 's7', type: 'contact', visible: true, props: { title: 'Bezoek de studio' } },
    ],
    features: { payments: false, reviews: true, waitlist: true, coupons: true, giftcards: true, email: true, sms: false },
    reviews: [
      { author: 'Anouk P.', rating: 5, quote: 'Na drie maanden voel ik me sterker dan ooit. Fijne kleine groepen.' },
      { author: 'Wouter S.', rating: 5, quote: 'Top instructeurs en een rustige, mooie studio.' },
    ],
    coupons: [{ code: 'CORE10', percentOff: 10 }],
    settings: {
      bookingRules: { maxDaysAhead: 30, leadTimeMinutes: 90, slotIntervalMin: 0, cancellationHours: 12 },
      regional: { currency: 'EUR', locale: 'nl-NL', timezone: 'Europe/Amsterdam' },
      formFields: [{ key: 'level', label: 'Ervaringsniveau', type: 'select', required: false, options: ['Beginner', 'Gemiddeld', 'Gevorderd'] }],
    },
    staff: [
      { name: 'Carla', title: 'Pilates-instructeur' },
      { name: 'Femke', title: 'Reformer-specialist' },
    ],
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
  const settingsJson = J(t.settings || {});
  const tenant = await prisma.tenant.upsert({
    where: { slug: t.slug },
    update: { name: t.name, settings: settingsJson },
    create: { slug: t.slug, name: t.name, settings: settingsJson },
  });

  await prisma.domain.upsert({
    where: { host: t.host },
    update: {},
    create: { host: t.host, tenantId: tenant.id },
  });

  const passwordHash = await bcrypt.hash('demo1234', 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: `admin@${t.slug}.nl` } },
    update: { password: passwordHash },
    create: { tenantId: tenant.id, email: `admin@${t.slug}.nl`, password: passwordHash, name: 'Admin', role: 'owner' },
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
  await prisma.booking.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.staffMember.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.service.deleteMany({ where: { tenantId: tenant.id } });
  const serviceIds: string[] = [];
  for (const s of t.services) {
    const created = await prisma.service.create({ data: { tenantId: tenant.id, ...s } });
    serviceIds.push(created.id);
  }

  // Staff — connected to all of this tenant's services (demo).
  for (const st of t.staff || []) {
    await prisma.staffMember.create({
      data: {
        tenantId: tenant.id,
        name: st.name,
        title: st.title || '',
        imageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(st.name)}`,
        services: { connect: serviceIds.map((id) => ({ id })) },
      },
    });
  }

  await prisma.businessHours.deleteMany({ where: { tenantId: tenant.id } });
  for (const bh of defaultBusinessHours(tenant.id)) {
    await prisma.businessHours.create({ data: bh });
  }

  await prisma.review.deleteMany({ where: { tenantId: tenant.id } });
  for (const r of t.reviews) {
    await prisma.review.create({ data: { tenantId: tenant.id, ...r } });
  }

  for (const c of t.coupons) {
    await prisma.coupon.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: c.code } },
      update: { percentOff: c.percentOff, isActive: true },
      create: { tenantId: tenant.id, code: c.code, percentOff: c.percentOff },
    });
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
