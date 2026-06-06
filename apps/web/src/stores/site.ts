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
  const loaded = ref(false);

  async function bootstrap() {
    const { data } = await api.get('/site');
    tenant.value = data.tenant;
    theme.value = data.theme;
    content.value = data.content;
    features.value = data.features || {};
    if (theme.value) applyTokens(theme.value.tokens, theme.value.mode);
    if (content.value) updateDocumentMeta();
    loaded.value = true;
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
    document.title = content.value.seo?.title || content.value.companyName;
    const desc = document.querySelector('meta[name="description"]') || createMeta('description');
    desc.setAttribute('content', content.value.seo?.description || '');
    if (content.value.faviconUrl) {
      const link = (document.querySelector("link[rel='icon']") as HTMLLinkElement) || createLink();
      link.href = content.value.faviconUrl;
    }
  }

  function isEnabled(key: string) {
    return !!features.value[key];
  }

  return {
    tenant, theme, content, features, loaded,
    bootstrap, switchTenant, currentTenant,
    previewTokens, restoreTheme, saveTheme, saveContent, saveFeatures, isEnabled,
  };
});

function createMeta(name: string) {
  const m = document.createElement('meta');
  m.setAttribute('name', name);
  document.head.appendChild(m);
  return m;
}
function createLink() {
  const l = document.createElement('link');
  l.setAttribute('rel', 'icon');
  document.head.appendChild(l);
  return l;
}
