<template>
  <section class="sf-section">
    <div class="sf-container">
      <el-row :gutter="40" align="middle" :class="{ reverse: props.block.imageSide === 'right' }">
        <el-col :xs="24" :md="12">
          <div class="img" :style="imgStyle">
            <span v-if="!props.block.image" class="ph"><el-icon :size="36"><Picture /></el-icon></span>
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <h2>{{ props.block.heading }}</h2>
          <p class="body">{{ props.block.body }}</p>
        </el-col>
      </el-row>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ block: Record<string, any> }>();
const imgStyle = computed(() =>
  props.block.image ? { backgroundImage: `url(${props.block.image})` } : { background: 'var(--el-fill-color)' },
);
</script>

<style scoped>
.reverse { flex-direction: row-reverse; }
.img { height: 320px; border-radius: var(--app-radius); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; }
.ph { color: var(--el-text-color-secondary); }
h2 { font-size: 2rem; margin: 0 0 14px; }
.body { color: var(--el-text-color-regular); line-height: 1.8; }
@media (max-width: 768px) { .img { margin-bottom: 16px; } }
</style>
