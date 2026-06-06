<template>
  <template v-for="section in visibleSections" :key="section.id">
    <component :is="resolve(section.type)" v-if="resolve(section.type)" :block="section.props" />
    <div v-else class="unknown sf-section">Onbekend component: {{ section.type }}</div>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveSection } from './registry';
import type { PageConfig } from '@/types';

const props = defineProps<{ config: PageConfig }>();
const visibleSections = computed(() => (props.config?.sections || []).filter((s) => s.visible));
const resolve = (type: string) => resolveSection(type);
</script>

<style scoped>
.unknown { text-align: center; color: var(--el-text-color-secondary); }
</style>
