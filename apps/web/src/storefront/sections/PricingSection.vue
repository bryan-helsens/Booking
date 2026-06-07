<template>
  <section class="sf-section">
    <div class="sf-container narrow">
      <h2 v-if="props.block.title" class="sf-heading">{{ props.block.title }}</h2>
      <div class="sf-accent-bar" />
      <div class="list">
        <div v-for="(it, i) in items" :key="i" class="item">
          <div class="left">
            <span class="name">{{ it.name }}</span>
            <span v-if="it.description" class="desc">{{ it.description }}</span>
          </div>
          <span class="dots" />
          <span class="price">{{ it.price }}</span>
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
.narrow { max-width: 720px; }
.list { display: flex; flex-direction: column; gap: 6px; }
.item { display: flex; align-items: baseline; gap: 10px; padding: 12px 0; border-bottom: 1px dashed var(--el-border-color-light); }
.left { display: flex; flex-direction: column; }
.name { font-weight: 600; }
.desc { color: var(--el-text-color-secondary); font-size: 0.9rem; }
.dots { flex: 1; border-bottom: 2px dotted var(--el-border-color); position: relative; top: -4px; }
.price { font-weight: 700; color: var(--app-color-primary); white-space: nowrap; }
</style>
