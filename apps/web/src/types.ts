export interface ThemeTokens {
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBg: string;
  colorText: string;
  fontBody: string;
  fontHeading: string;
  radius: number;
  [key: string]: any;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  tokens: ThemeTokens;
  draft?: ThemeTokens | null;
}

export interface SiteContent {
  companyName: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  contact: { email: string; phone: string; address: string };
  seo: { title: string; description: string; keywords: string; ogImage: string };
  social: { facebook: string; instagram: string; x: string; linkedin: string };
}

export interface Section {
  id: string;
  type: string;
  visible: boolean;
  props: Record<string, any>;
}

export interface PageConfig {
  version: number;
  sections: Section[];
}

export interface ComponentDefinition {
  type: string;
  label: string;
  icon: string;
  category: string;
  propsSchema: Record<string, { type: string; label: string; options?: string[] }>;
  defaults: Record<string, any>;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  capacity: number;
  bufferBefore: number;
  bufferAfter: number;
  isActive: boolean;
}

export interface Slot {
  startsAt: string;
  endsAt: string;
  available: boolean;
}

export interface Booking {
  id: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string;
  service?: { name: string };
}

export type FeatureMap = Record<string, boolean>;
