<template>
  <section class="sf-section faq">
    <div class="sf-container narrow">
      <h2 class="sf-heading">{{ props.block.title || 'Veelgestelde vragen' }}</h2>
      <div class="sf-accent-bar" />
      <el-collapse v-model="active" class="faq-list">
        <el-collapse-item v-for="(item, i) in items" :key="i" :name="i">
          <template #title>
            <span class="q">{{ item.q }}</span>
          </template>
          <div class="answer">{{ item.a }}</div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{ block: Record<string, any> }>();
const active = ref<number[]>([0]);
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
.narrow { max-width: 760px; }
.faq-list {
  border: none;
  --el-collapse-border-color: transparent;
}
.faq-list :deep(.el-collapse-item) {
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--app-radius);
  overflow: hidden;
  background: var(--el-bg-color);
}
.faq-list :deep(.el-collapse-item__header) {
  padding: 4px 18px;
  height: 58px;
  font-size: 1.02rem;
  border-bottom: none;
  background: transparent;
}
.faq-list :deep(.el-collapse-item__wrap) { border-bottom: none; background: transparent; }
.faq-list :deep(.el-collapse-item__content) { padding: 0 18px 18px; }
.q { font-weight: 600; color: var(--app-color-text); }
.answer { color: var(--el-text-color-secondary); line-height: 1.7; }
</style>
