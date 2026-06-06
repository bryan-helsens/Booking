<template>
  <DynamicRenderer v-if="config" :config="config" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api/client';
import DynamicRenderer from './DynamicRenderer.vue';
import type { PageConfig } from '@/types';

const config = ref<PageConfig | null>(null);

onMounted(async () => {
  // Storefront renders the PUBLISHED config for this tenant's page.
  const { data } = await api.get('/pages/home');
  config.value = data.config;
});
</script>
