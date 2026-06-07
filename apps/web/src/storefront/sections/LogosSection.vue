<template>
  <section class="sf-section logos" v-if="logos.length">
    <div class="sf-container">
      <h2 v-if="props.block.title" class="sub">{{ props.block.title }}</h2>
      <div class="row">
        <img v-for="(src, i) in logos" :key="i" :src="src" alt="" class="logo" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ block: Record<string, any> }>();
const logos = computed(() =>
  String(props.block.images || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
);
</script>

<style scoped>
.sub { text-align: center; color: var(--el-text-color-secondary); font-size: 1rem; font-weight: 500; margin: 0 0 24px; text-transform: uppercase; letter-spacing: 0.05em; }
.row { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 40px; }
.logo { height: 40px; max-width: 140px; object-fit: contain; filter: grayscale(1); opacity: 0.7; transition: filter 0.2s, opacity 0.2s; }
.logo:hover { filter: none; opacity: 1; }
</style>
