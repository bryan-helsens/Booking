<template>
  <transition name="slide">
    <div v-if="show" class="cookie">
      <div class="sf-container inner">
        <p class="txt">
          We gebruiken noodzakelijke cookies om de site te laten werken. Met jouw toestemming gebruiken we ook
          analytische cookies om de site te verbeteren. Lees meer in onze
          <router-link to="/privacy">privacyverklaring</router-link>.
        </p>
        <div class="btns">
          <el-button size="small" @click="choose('necessary')">Alleen noodzakelijk</el-button>
          <el-button size="small" type="primary" @click="choose('all')">Alles accepteren</el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const KEY = 'booking.cookie-consent';
const show = ref(false);

onMounted(() => {
  if (!localStorage.getItem(KEY)) show.value = true;
});

function choose(level: 'necessary' | 'all') {
  localStorage.setItem(KEY, JSON.stringify({ level, at: new Date().toISOString() }));
  show.value = false;
  // Analytics scripts would be initialised here only when level === 'all'.
}
</script>

<style scoped>
.cookie { position: fixed; bottom: 0; left: 0; right: 0; z-index: 200; background: var(--el-bg-color); border-top: 1px solid var(--el-border-color); box-shadow: 0 -4px 20px rgba(0,0,0,0.1); }
.inner { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 16px 24px; flex-wrap: wrap; }
.txt { margin: 0; font-size: 0.9rem; color: var(--el-text-color-regular); flex: 1; min-width: 260px; }
.txt a { color: var(--app-color-primary); }
.btns { display: flex; gap: 10px; }
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateY(100%); opacity: 0; }
</style>
