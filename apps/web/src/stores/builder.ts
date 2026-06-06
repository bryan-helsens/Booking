import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';
import type { ComponentDefinition, PageConfig, Section } from '@/types';

let _seq = 0;
const uid = () => `s${Date.now().toString(36)}${_seq++}`;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** Drives the visual page builder: component registry, draft layout, undo/redo. */
export const useBuilderStore = defineStore('builder', () => {
  const components = ref<ComponentDefinition[]>([]);
  const pages = ref<Array<{ slug: string; title: string }>>([]);
  const config = ref<PageConfig>({ version: 1, sections: [] });
  const slug = ref('home');
  const selectedId = ref<string | null>(null);
  const dirty = ref(false);

  // Undo/redo history of config snapshots.
  const past = ref<string[]>([]);
  const future = ref<string[]>([]);
  const canUndo = ref(false);
  const canRedo = ref(false);

  function snapshot() {
    past.value.push(JSON.stringify(config.value));
    if (past.value.length > 50) past.value.shift();
    future.value = [];
    dirty.value = true;
    refreshFlags();
  }
  function refreshFlags() {
    canUndo.value = past.value.length > 0;
    canRedo.value = future.value.length > 0;
  }
  function undo() {
    if (!past.value.length) return;
    future.value.push(JSON.stringify(config.value));
    config.value = JSON.parse(past.value.pop() as string);
    dirty.value = true;
    refreshFlags();
  }
  function redo() {
    if (!future.value.length) return;
    past.value.push(JSON.stringify(config.value));
    config.value = JSON.parse(future.value.pop() as string);
    dirty.value = true;
    refreshFlags();
  }

  async function loadComponents() {
    if (components.value.length) return;
    const { data } = await api.get('/components');
    components.value = data;
  }

  async function loadPages() {
    const { data } = await api.get('/pages');
    pages.value = data.map((p: any) => ({ slug: p.slug, title: p.title }));
  }

  async function loadPage(pageSlug = 'home') {
    slug.value = pageSlug;
    await Promise.all([loadComponents(), loadPages()]);
    const { data } = await api.get(`/pages/${pageSlug}?draft=true`);
    config.value = (data.draftConfig || data.config) as PageConfig;
    selectedId.value = config.value.sections[0]?.id ?? null;
    past.value = [];
    future.value = [];
    dirty.value = false;
    refreshFlags();
  }

  async function createPage(title: string) {
    const pageSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    await api.put(`/pages/${pageSlug}`, { title, config: { version: 1, sections: [] } });
    await loadPages();
    await loadPage(pageSlug);
  }

  function defFor(type: string) {
    return components.value.find((c) => c.type === type);
  }

  function makeSection(type: string): Section {
    const def = defFor(type);
    return { id: uid(), type, visible: true, props: clone(def?.defaults || {}) };
  }

  function addSection(type: string) {
    snapshot();
    const section = makeSection(type);
    config.value.sections.push(section);
    selectedId.value = section.id;
  }

  function removeSection(id: string) {
    snapshot();
    config.value.sections = config.value.sections.filter((s) => s.id !== id);
    if (selectedId.value === id) selectedId.value = config.value.sections[0]?.id ?? null;
  }

  function toggleVisible(id: string) {
    snapshot();
    const s = config.value.sections.find((x) => x.id === id);
    if (s) s.visible = !s.visible;
  }

  function selected() {
    return config.value.sections.find((s) => s.id === selectedId.value) || null;
  }

  function markDirty() {
    dirty.value = true;
  }

  async function saveDraft() {
    await api.put(`/pages/${slug.value}`, { draftConfig: clone(config.value) });
    dirty.value = false;
  }

  async function publish() {
    await api.put(`/pages/${slug.value}`, { draftConfig: clone(config.value) });
    await api.post(`/pages/${slug.value}/publish`);
    dirty.value = false;
  }

  return {
    components, pages, config, slug, selectedId, dirty, canUndo, canRedo,
    loadComponents, loadPages, loadPage, createPage, defFor, makeSection,
    addSection, removeSection, toggleVisible, selected, markDirty,
    snapshot, undo, redo, saveDraft, publish,
  };
});
