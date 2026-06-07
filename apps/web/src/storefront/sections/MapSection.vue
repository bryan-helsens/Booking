<template>
  <section class="sf-section">
    <div class="sf-container">
      <h2 v-if="props.block.title" class="sf-heading">{{ props.block.title }}</h2>
      <div class="map" :style="{ height: (props.block.height || 340) + 'px' }">
        <iframe v-if="address" :src="src" loading="lazy" frameborder="0" />
        <el-empty v-else description="Vul een adres in bij de instellingen" />
      </div>
      <div class="actions" v-if="address">
        <el-button type="primary" round tag="a" :href="directions" target="_blank">Routebeschrijving</el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSiteStore } from '@/stores/site';

const props = defineProps<{ block: Record<string, any> }>();
const site = useSiteStore();
// Falls back to the tenant's contact address when none is set on the block.
const address = computed(() => props.block.address || site.content?.contact?.address || '');
const src = computed(() => `https://maps.google.com/maps?q=${encodeURIComponent(address.value)}&z=15&output=embed`);
const directions = computed(() => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.value)}`);
</script>

<style scoped>
.map { border-radius: var(--app-radius); overflow: hidden; background: var(--el-fill-color); }
.map iframe { width: 100%; height: 100%; display: block; }
.actions { text-align: center; margin-top: 16px; }
</style>
