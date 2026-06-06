import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, getTenant, setTenant } from '@/api/client';
import { applyTokens } from '@/theme/applyTokens';
import type { ThemeConfig, SiteContent, FeatureMap } from '@/types';

/**
 * Central store for the active tenant's database-driven configuration:
 * theme tokens, content, and feature flags. Nothing here is hardcoded —
 * it all comes from the API for the resolved tenant.
 */
export const useSiteStore = defineStore('site', () => {
  const tenant = ref<{ id: string; slug: string; name: string } | null>(null);
  const theme = ref<ThemeConfig | null>(null);
  const content = ref<SiteContent | null>(null);
  const features = ref<FeatureMap>({});
  const settings = ref<any>({ bookingRules: {}, regional: { currency: 'EUR', locale: 'nl-NL' }, formFields: [] });
  const loaded = ref(false);

  async function bootstrap() {
    const { data } = await api.get('/site');
    tenant.value = data.tenant;
    theme.value = data.theme;
    content.value = data.content;
    features.value = data.features || {};
    if (data.settings) settings.value = data.settings;
    if (theme.value) applyTokens(theme.value.tokens, theme.value.mode);
    if (content.value) updateDocumentMeta();
    loaded.value = true;
  }

  /** Format a price (in cents) using the tenant's currency + locale. */
  function formatMoney(cents: number) {
    const r = settings.value?.regional || {};
    try {
      return new Intl.NumberFormat(r.locale || 'nl-NL', { style: 'currency', currency: r.currency || 'EUR' }).format((cents || 0) / 100);
    } catch {
      return `€ ${((cents || 0) / 100).toFixed(2)}`;
    }
  }

  async function saveSettings(payload: any) {
    const { data } = await api.put('/settings', payload);
    settings.value = data;
    return data;
  }

  function switchTenant(slug: string) {
    setTenant(slug);
    loaded.value = false;
    return bootstrap();
  }

  function currentTenant() {
    return getTenant();
  }

  /** Live preview from the builder/theme editor (no persistence). */
  function previewTokens(tokens: any, mode: 'light' | 'dark') {
    applyTokens(tokens, mode);
  }

  function restoreTheme() {
    if (theme.value) applyTokens(theme.value.tokens, theme.value.mode);
  }

  async function saveTheme(tokens: any, mode: 'light' | 'dark') {
    const { data } = await api.put('/theme', { tokens, mode });
    theme.value = data;
    applyTokens(data.tokens, data.mode);
  }

  async function saveContent(payload: SiteContent) {
    const { data } = await api.put('/content', payload);
    content.value = data;
    updateDocumentMeta();
  }

  async function saveFeatures(map: FeatureMap) {
    const { data } = await api.put('/features', map);
    features.value = data;
  }

  function updateDocumentMeta() {
    if (!content.value) return;
    const c = content.value;
    const title = c.seo?.title || c.companyName;
    document.title = title;
    setMeta('name', 'description', c.seo?.description || c.description || '');
    // Open Graph + Twitter card for nice social sharing previews.
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', c.seo?.description || c.description || '');
    setMeta('property', 'og:type', 'website');
    if (c.seo?.ogImage || c.logoUrl) setMeta('property', 'og:image', c.seo?.ogImage || c.logoUrl);
    setMeta('name', 'twitter:card', 'summary_large_image');
    if (c.faviconUrl) {
      const link = (document.querySelector("link[rel='icon']") as HTMLLinkElement) || createLink();
      link.href = c.faviconUrl;
    }
  }

  function isEnabled(key: string) {
    return !!features.value[key];
  }

  return {
    tenant, theme, content, features, settings, loaded,
    bootstrap, switchTenant, currentTenant, formatMoney, saveSettings,
    previewTokens, restoreTheme, saveTheme, saveContent, saveFeatures, isEnabled,
  };
});

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}
function createLink() {
  const l = document.createElement('link');
  l.setAttribute('rel', 'icon');
  document.head.appendChild(l);
  return l;
}
