<template>
  <template v-for="section in renderable" :key="section.id">
    <div v-reveal>
      <component :is="resolve(section.type)" v-if="resolve(section.type)" :block="section.props" />
      <div v-else class="unknown sf-section">Onbekend component: {{ section.type }}</div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveSection } from './registry';
import { useSiteStore } from '@/stores/site';
import type { PageConfig } from '@/types';

const props = defineProps<{ config: PageConfig; respectFeatures?: boolean }>();
const site = useSiteStore();

// Sections that should only appear when their feature flag is enabled.
const FEATURE_GATE: Record<string, string> = { testimonials: 'reviews' };

const renderable = computed(() => {
  const respect = props.respectFeatures !== false;
  return (props.config?.sections || []).filter((s) => {
    if (!s.visible) return false;
    if (respect) {
      const gate = FEATURE_GATE[s.type];
      if (gate && !site.isEnabled(gate)) return false;
    }
    return true;
  });
});
const resolve = (type: string) => resolveSection(type);
</script>

<style scoped>
.unknown { text-align: center; color: var(--el-text-color-secondary); }
</style>
