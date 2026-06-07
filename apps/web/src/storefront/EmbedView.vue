<template>
  <div class="embed">
    <BookingPage v-if="site.loaded" />
    <el-skeleton v-else :rows="6" animated style="padding: 24px" />
    <a class="powered" href="/" target="_blank">Powered by Booking Platform</a>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSiteStore } from '@/stores/site';
import BookingPage from './BookingPage.vue';

const site = useSiteStore();

onMounted(() => {
  if (!site.loaded) site.bootstrap();
});
</script>

<style scoped>
.embed { min-height: 100vh; background: var(--app-color-bg); }
.powered { display: block; text-align: center; padding: 16px; font-size: 0.8rem; color: var(--el-text-color-secondary); text-decoration: none; }
</style>
