<template>
  <section class="sf-section cta" :style="bg">
    <div class="overlay" v-if="props.block.bgImage" />
    <div class="sf-container inner">
      <h2>{{ props.block.title }}</h2>
      <p v-if="props.block.text">{{ props.block.text }}</p>
      <el-button type="primary" size="large" round @click="go">{{ props.block.buttonLabel || 'Boek nu' }}</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{ block: Record<string, any> }>();
const router = useRouter();
const bg = computed(() =>
  props.block.bgImage
    ? { backgroundImage: `url(${props.block.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, var(--app-color-primary), var(--app-color-accent))` },
);
const go = () => router.push({ name: 'booking' });
</script>

<style scoped>
.cta { position: relative; color: #fff; text-align: center; }
.overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
.inner { position: relative; z-index: 1; }
.cta h2 { font-size: 2.2rem; margin: 0 0 10px; }
.cta p { margin: 0 0 22px; opacity: 0.95; font-size: 1.1rem; }
</style>
