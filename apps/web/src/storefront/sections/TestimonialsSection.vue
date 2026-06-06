<template>
  <section class="sf-section testimonials">
    <div class="sf-container">
      <h2 class="title">{{ props.title || 'Wat klanten zeggen' }}</h2>
      <el-row :gutter="20">
        <el-col v-for="(t, i) in items" :key="i" :xs="24" :md="8">
          <el-card class="sf-card" shadow="never">
            <el-rate :model-value="t.rating" disabled />
            <p class="quote">"{{ t.quote }}"</p>
            <strong>{{ t.author }}</strong>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ props: Record<string, any> }>();
// Demo reviews — in production these come from the Review table / feature.
const items = [
  { rating: 5, quote: 'Fantastische ervaring, kom zeker terug!', author: 'Sanne' },
  { rating: 5, quote: 'Vriendelijk personeel en top service.', author: 'Mark' },
  { rating: 4, quote: 'Makkelijk online te boeken.', author: 'Iris' },
];
</script>

<style scoped>
.testimonials { background: var(--el-fill-color-light); }
.title { text-align: center; font-size: 2rem; margin-bottom: 36px; }
.quote { font-style: italic; margin: 12px 0; }
</style>
