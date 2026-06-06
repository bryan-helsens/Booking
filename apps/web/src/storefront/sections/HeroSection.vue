<template>
  <section
    class="sf-section hero"
    :class="`align-${props.block.align || 'center'}`"
    :style="bgStyle"
  >
    <div class="overlay" v-if="props.block.bgImage" />
    <div class="sf-container hero-inner">
      <h1 class="hero-title">{{ props.block.title }}</h1>
      <p class="hero-sub">{{ props.block.subtitle }}</p>
      <el-button type="primary" size="large" round @click="goBook">
        {{ props.block.ctaLabel || 'Boek nu' }}
      </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{ block: Record<string, any> }>();
const router = useRouter();

const bgStyle = computed(() =>
  props.block.bgImage
    ? { backgroundImage: `url(${props.block.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, var(--app-color-primary), var(--app-color-accent))' },
);

function goBook() {
  router.push({ name: 'booking' });
}
</script>

<style scoped>
.hero { position: relative; color: #fff; min-height: 460px; display: flex; align-items: center; }
.overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.45); }
.hero-inner { position: relative; z-index: 1; }
.align-center { text-align: center; }
.align-center .hero-inner { margin: 0 auto; }
.hero-title { font-size: 3rem; margin: 0 0 12px; }
.hero-sub { font-size: 1.25rem; opacity: 0.95; margin: 0 0 28px; }
</style>
