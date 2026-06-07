<template>
  <section class="sf-section">
    <div class="sf-container">
      <h2 v-if="props.block.title" class="sf-heading">{{ props.block.title }}</h2>
      <div class="sf-accent-bar" />
      <el-row :gutter="24">
        <el-col v-for="(f, i) in items" :key="i" :xs="24" :sm="12" :md="Math.max(6, Math.round(24 / Math.min(items.length || 1, 4)))">
          <div class="feature">
            <div class="ico"><el-icon :size="26"><component :is="f.icon || 'Star'" /></el-icon></div>
            <h4>{{ f.title }}</h4>
            <p>{{ f.text }}</p>
          </div>
        </el-col>
      </el-row>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ block: Record<string, any> }>();
const items = computed<any[]>(() => (Array.isArray(props.block.items) ? props.block.items : []));
</script>

<style scoped>
.feature { text-align: center; padding: 16px; margin-bottom: 12px; }
.ico { width: 56px; height: 56px; border-radius: 16px; background: var(--el-color-primary-light-9); color: var(--app-color-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
.feature h4 { margin: 0 0 6px; }
.feature p { color: var(--el-text-color-secondary); margin: 0; line-height: 1.6; }
</style>
