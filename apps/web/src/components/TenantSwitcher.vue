<template>
  <div class="switcher">
    <el-tooltip content="Demo: wissel van tenant om white-label theming te zien" placement="left">
      <el-select :model-value="current" size="small" style="width: 210px" @change="onChange">
        <el-option v-for="t in tenants" :key="t.slug" :label="t.name" :value="t.slug" />
        <el-option value="__new__" label="➕ Nieuwe site aanmaken" />
      </el-select>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api/client';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const router = useRouter();
const current = ref(site.currentTenant());
const tenants = ref<Array<{ slug: string; name: string }>>([]);

onMounted(async () => {
  const { data } = await api.get('/tenants');
  tenants.value = data;
});

async function onChange(slug: string) {
  if (slug === '__new__') {
    router.push('/get-started');
    return;
  }
  current.value = slug;
  await site.switchTenant(slug);
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
