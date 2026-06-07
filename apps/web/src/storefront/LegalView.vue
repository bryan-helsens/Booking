<template>
  <section class="sf-section">
    <div class="sf-container narrow" v-if="doc">
      <h1 class="sf-heading">{{ doc.title }}</h1>
      <div class="sf-accent-bar" />
      <p class="updated">Laatst bijgewerkt: {{ doc.updated }}</p>
      <p class="intro">{{ doc.intro }}</p>

      <div v-for="(s, i) in doc.sections" :key="i" class="block">
        <h3>{{ s.h }}</h3>
        <p v-for="(p, j) in s.body" :key="j">{{ p }}</p>
      </div>

      <el-alert type="info" :closable="false" show-icon style="margin-top: 24px"
        title="Dit is een sjabloon ter illustratie en geen juridisch advies. Laat de definitieve tekst door een jurist controleren." />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSiteStore } from '@/stores/site';
import { privacyDoc, termsDoc } from './legal';

const route = useRoute();
const site = useSiteStore();
const doc = computed(() => {
  const content = site.content;
  if (!content) return null;
  return route.name === 'terms' ? termsDoc(content) : privacyDoc(content);
});
</script>

<style scoped>
.narrow { max-width: 760px; }
.updated { color: var(--el-text-color-secondary); font-size: 0.85rem; text-align: center; }
.intro { font-size: 1.05rem; line-height: 1.7; }
.block { margin-top: 22px; }
.block h3 { margin: 0 0 8px; }
.block p { color: var(--el-text-color-regular); line-height: 1.7; margin: 0 0 8px; }
</style>
