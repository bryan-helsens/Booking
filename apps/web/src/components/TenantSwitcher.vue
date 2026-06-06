<template>
  <div class="switcher">
    <el-tooltip content="Demo: wissel van tenant om white-label theming te zien" placement="left">
      <el-select :model-value="current" size="small" style="width: 200px" @change="onChange">
        <el-option label="Acme Wellness Spa" value="acme" />
        <el-option label="Studio Noir Barber" value="studio" />
      </el-select>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const current = ref(site.currentTenant());

async function onChange(slug: string) {
  current.value = slug;
  await site.switchTenant(slug);
  // Reload so storefront pages re-fetch the new tenant's config.
  window.location.reload();
}
</script>

<style scoped>
.switcher {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 100;
  background: var(--el-bg-color);
  padding: 8px;
  border-radius: var(--app-radius);
  box-shadow: var(--el-box-shadow-light);
}
</style>
