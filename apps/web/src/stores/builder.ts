import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';
import type { ComponentDefinition, PageConfig, Section } from '@/types';

let _seq = 0;
const uid = () => `s${Date.now().toString(36)}${_seq++}`;

/** Drives the visual page builder: component registry + draft layout. */
export const useBuilderStore = defineStore('builder', () => {
  const components = ref<ComponentDefinition[]>([]);
  const config = ref<PageConfig>({ version: 1, sections: [] });
  const slug = ref('home');
  const selectedId = ref<string | null>(null);
  const dirty = ref(false);

  async function loadComponents() {
    if (components.value.length) return;
    const { data } = await api.get('/components');
    components.value = data;
  }

  async function loadPage(pageSlug = 'home') {
    slug.value = pageSlug;
    await loadComponents();
    const { data } = await api.get(`/pages/${pageSlug}?draft=true`);
    config.value = (data.draftConfig || data.config) as PageConfig;
    selectedId.value = config.value.sections[0]?.id ?? null;
    dirty.value = false;
  }

  function defFor(type: string) {
    return components.value.find((c) => c.type === type);
  }

  function addSection(type: string) {
    const def = defFor(type);
    const section: Section = { id: uid(), type, visible: true, props: { ...(def?.defaults || {}) } };
    config.value.sections.push(section);
    selectedId.value = section.id;
    dirty.value = true;
  }

  function removeSection(id: string) {
    config.value.sections = config.value.sections.filter((s) => s.id !== id);
    if (selectedId.value === id) selectedId.value = config.value.sections[0]?.id ?? null;
    dirty.value = true;
  }

  function toggleVisible(id: string) {
    const s = config.value.sections.find((x) => x.id === id);
    if (s) { s.visible = !s.visible; dirty.value = true; }
  }

  function selected() {
    return config.value.sections.find((s) => s.id === selectedId.value) || null;
  }

  function markDirty() {
    dirty.value = true;
  }

  async function saveDraft() {
    await api.put(`/pages/${slug.value}`, { draftConfig: JSON.parse(JSON.stringify(config.value)) });
    dirty.value = false;
  }

  async function publish() {
    await api.put(`/pages/${slug.value}`, { draftConfig: JSON.parse(JSON.stringify(config.value)) });
    await api.post(`/pages/${slug.value}/publish`);
    dirty.value = false;
  }

  return {
    components, config, slug, selectedId, dirty,
    loadComponents, loadPage, defFor, addSection, removeSection,
    toggleVisible, selected, markDirty, saveDraft, publish,
  };
});
