<template>
  <section class="sf-section video">
    <div class="sf-container narrow">
      <h2 v-if="props.block.title" class="sf-heading">{{ props.block.title }}</h2>
      <div class="frame" v-if="embed">
        <iframe :src="embed" allowfullscreen frameborder="0" />
      </div>
      <el-empty v-else description="Plak een YouTube- of Vimeo-link in de instellingen" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ block: Record<string, any> }>();

// Convert a YouTube/Vimeo URL into an embeddable URL.
const embed = computed(() => {
  const url = String(props.block.url || '');
  const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return '';
});
</script>

<style scoped>
.narrow { max-width: 860px; }
.frame { position: relative; padding-top: 56.25%; border-radius: var(--app-radius); overflow: hidden; }
.frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; }
</style>
