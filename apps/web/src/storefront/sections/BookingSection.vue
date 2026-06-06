<template>
  <section class="sf-section booking">
    <div class="sf-container inner">
      <h2 class="title">{{ props.title || 'Maak een afspraak' }}</h2>
      <p>Kies een dienst en een tijdstip dat jou uitkomt.</p>
      <el-button type="primary" size="large" round @click="goBook">Naar de boekingskalender</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
defineProps<{ props: Record<string, any> }>();
const router = useRouter();
const goBook = () => router.push({ name: 'booking' });
</script>

<style scoped>
.booking { background: linear-gradient(135deg, var(--app-color-primary), var(--app-color-secondary)); color: #fff; text-align: center; }
.title { font-size: 2rem; margin-bottom: 12px; }
.inner :deep(.el-button) { margin-top: 20px; }
</style>
