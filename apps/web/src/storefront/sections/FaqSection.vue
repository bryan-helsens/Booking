<template>
  <section class="sf-section faq">
    <div class="sf-container narrow">
      <h2 class="sf-heading">{{ props.block.title || 'Veelgestelde vragen' }}</h2>
      <div class="sf-accent-bar" />
      <el-collapse accordion>
        <el-collapse-item v-for="(item, i) in items" :key="i" :title="item.q" :name="i">
          <div class="answer">{{ item.a }}</div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ block: Record<string, any> }>();
const items = computed(() =>
  String(props.block.items || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [q, ...rest] = line.split('|');
      return { q: q.trim(), a: rest.join('|').trim() };
    }),
);
</script>

<style scoped>
.narrow { max-width: 720px; }
.answer { color: var(--el-text-color-secondary); line-height: 1.6; }
</style>
