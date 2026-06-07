<template>
  <DynamicRenderer v-if="config" :config="config" />
  <div v-else class="loading sf-container">
    <el-skeleton animated>
      <template #template>
        <el-skeleton-item variant="image" style="width: 100%; height: 360px; border-radius: var(--app-radius)" />
        <div style="padding: 40px 0">
          <el-skeleton-item variant="h1" style="width: 40%" />
          <el-skeleton-item variant="text" style="width: 80%; margin-top: 16px" />
          <el-skeleton-item variant="text" style="width: 70%" />
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api/client';
import DynamicRenderer from './DynamicRenderer.vue';
import type { PageConfig } from '@/types';

const route = useRoute();
const config = ref<PageConfig | null>(null);

async function load(slug: string) {
  config.value = null;
  try {
    const { data } = await api.get(`/pages/${slug}`);
    config.value = data.config;
  } catch {
    config.value = { version: 1, sections: [] };
  }
}

onMounted(() => load((route.params.slug as string) || 'home'));
watch(() => route.params.slug, (s) => load((s as string) || 'home'));
</script>

<style scoped>
.loading { padding-top: 24px; }
</style>
