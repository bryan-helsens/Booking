<template>
  <section class="sf-section testimonials" v-if="reviews.length">
    <div class="sf-container">
      <h2 class="sf-heading">{{ props.block.title || 'Wat klanten zeggen' }}</h2>
      <div class="avg" v-if="avg">
        <el-rate :model-value="avg" disabled allow-half />
        <span>{{ avg.toFixed(1) }} / 5 · {{ reviews.length }} reviews</span>
      </div>
      <div class="sf-accent-bar" />
      <el-row :gutter="24">
        <el-col v-for="r in reviews" :key="r.id" :xs="24" :md="8">
          <el-card class="sf-card review" shadow="never">
            <el-icon class="quote-mark" :size="28"><ChatDotSquare /></el-icon>
            <el-rate :model-value="r.rating" disabled />
            <p class="quote">"{{ r.quote }}"</p>
            <strong>{{ r.author }}</strong>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api/client';

const props = defineProps<{ block: Record<string, any> }>();
const reviews = ref<Array<{ id: string; author: string; rating: number; quote: string }>>([]);

onMounted(async () => {
  const { data } = await api.get('/reviews');
  reviews.value = data;
});

const avg = computed(() =>
  reviews.value.length ? reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length : 0,
);
</script>

<style scoped>
.testimonials { background: var(--el-fill-color-light); }
.avg { display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--el-text-color-secondary); margin-bottom: 8px; }
.review { height: 100%; position: relative; }
.quote-mark { color: var(--app-color-primary); opacity: 0.4; }
.quote { font-style: italic; margin: 10px 0; line-height: 1.6; }
</style>
