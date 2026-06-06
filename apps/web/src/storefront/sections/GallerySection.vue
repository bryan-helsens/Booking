<template>
  <section class="sf-section gallery">
    <div class="sf-container">
      <h2 class="sf-heading">{{ props.block.title || 'Galerij' }}</h2>
      <div class="sf-accent-bar" />
      <div class="grid">
        <el-image
          v-for="(src, i) in images"
          :key="i"
          :src="src"
          fit="cover"
          class="g-img"
          :preview-src-list="images"
          :initial-index="i"
          hide-on-click-modal
        >
          <template #error>
            <div class="ph"><el-icon :size="28"><Picture /></el-icon></div>
          </template>
        </el-image>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ block: Record<string, any> }>();
const images = computed(() =>
  String(props.block.images || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
);
</script>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.g-img { width: 100%; height: 220px; border-radius: var(--app-radius); overflow: hidden; cursor: pointer; }
.ph { width: 100%; height: 220px; display: flex; align-items: center; justify-content: center; background: var(--el-fill-color); color: var(--el-text-color-secondary); border-radius: var(--app-radius); }
</style>
