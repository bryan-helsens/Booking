<template>
  <section class="sf-section stats" :style="{ background: props.block.bgColor || 'var(--el-fill-color-light)' }">
    <div class="sf-container">
      <h2 v-if="props.block.title" class="sf-heading">{{ props.block.title }}</h2>
      <div class="grid">
        <div v-for="(s, i) in items" :key="i" class="stat">
          <div class="value">{{ s.value }}</div>
          <div class="label">{{ s.label }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ block: Record<string, any> }>();
const items = computed<any[]>(() => (Array.isArray(props.block.items) ? props.block.items : []));
</script>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 24px; text-align: center; }
.value { font-family: var(--app-font-heading); font-size: 2.6rem; font-weight: 800; color: var(--app-color-primary); }
.label { color: var(--el-text-color-secondary); margin-top: 4px; }
</style>
