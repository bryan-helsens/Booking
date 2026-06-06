<template>
  <section class="hero" :class="`align-${props.block.align || 'center'}`">
    <div class="bg-gradient" />
    <img
      v-if="props.block.bgImage && !failed"
      :src="props.block.bgImage"
      class="bg-img"
      alt=""
      @error="failed = true"
    />
    <div class="overlay" />
    <div class="sf-container hero-inner">
      <h1 class="hero-title">{{ props.block.title }}</h1>
      <p class="hero-sub">{{ props.block.subtitle }}</p>
      <el-button type="primary" size="large" round @click="goBook">
        {{ props.block.ctaLabel || 'Boek nu' }}
        <el-icon class="el-icon--right"><Right /></el-icon>
      </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{ block: Record<string, any> }>();
const router = useRouter();
const failed = ref(false);

function goBook() {
  router.push({ name: 'booking' });
}
</script>

<style scoped>
.hero { position: relative; color: #fff; min-height: 70vh; display: flex; align-items: center; overflow: hidden; padding: 64px 24px; }
.bg-gradient { position: absolute; inset: 0; background: linear-gradient(135deg, var(--app-color-primary), var(--app-color-accent)); }
.bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.55)); }
.hero-inner { position: relative; z-index: 1; max-width: 760px; animation: rise 0.8s ease both; }
.align-center { text-align: center; }
.align-center .hero-inner { margin: 0 auto; }
.hero-title { font-size: clamp(2.2rem, 6vw, 3.6rem); margin: 0 0 14px; line-height: 1.1; text-shadow: 0 2px 20px rgba(0,0,0,0.25); }
.hero-sub { font-size: clamp(1rem, 2.5vw, 1.35rem); opacity: 0.96; margin: 0 0 30px; }
@keyframes rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
</style>
