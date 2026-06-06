<template>
  <div v-if="site.loaded" class="storefront">
    <header class="sf-header">
      <div class="sf-container bar">
        <router-link to="/" class="brand">
          <img v-if="content?.logoUrl" :src="content.logoUrl" alt="logo" class="logo" />
          <span class="name">{{ content?.companyName }}</span>
        </router-link>
        <nav class="nav">
          <router-link to="/">Home</router-link>
          <router-link to="/booking">Boeken</router-link>
          <el-button type="primary" round size="small" @click="$router.push('/booking')">Afspraak maken</el-button>
        </nav>
      </div>
    </header>

    <main>
      <router-view />
    </main>

    <footer class="sf-footer">
      <div class="sf-container foot">
        <div>
          <strong>{{ content?.companyName }}</strong>
          <p>{{ content?.description }}</p>
        </div>
        <div class="social">
          <a v-if="content?.social.facebook" :href="content.social.facebook" target="_blank"><el-icon><Share /></el-icon> Facebook</a>
          <a v-if="content?.social.instagram" :href="content.social.instagram" target="_blank"><el-icon><Camera /></el-icon> Instagram</a>
          <a v-if="content?.social.x" :href="content.social.x" target="_blank"><el-icon><ChatLineRound /></el-icon> X</a>
        </div>
        <router-link to="/admin" class="admin-link">Admin →</router-link>
      </div>
    </footer>

    <!-- Demo helper: switch tenant to showcase white-label theming -->
    <TenantSwitcher />
  </div>
  <el-skeleton v-else :rows="8" animated style="padding: 40px" />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSiteStore } from '@/stores/site';
import TenantSwitcher from '@/components/TenantSwitcher.vue';

const site = useSiteStore();
const content = computed(() => site.content);

onMounted(() => {
  if (!site.loaded) site.bootstrap();
});
</script>

<style scoped>
.sf-header { position: sticky; top: 0; z-index: 10; background: var(--app-color-bg); border-bottom: 1px solid var(--el-border-color-light); }
.bar { display: flex; align-items: center; justify-content: space-between; height: 64px; }
.brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--app-color-text); }
.logo { height: 36px; width: 36px; border-radius: var(--app-radius); }
.name { font-family: var(--app-font-heading); font-weight: 700; font-size: 1.2rem; }
.nav { display: flex; align-items: center; gap: 18px; }
.nav a { text-decoration: none; color: var(--app-color-text); }
.sf-footer { background: var(--el-fill-color-darker); padding: 40px 24px; margin-top: 40px; }
.foot { display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; align-items: center; }
.social { display: flex; gap: 16px; }
.social a { text-decoration: none; display: flex; align-items: center; gap: 6px; }
.admin-link { color: var(--el-text-color-secondary); text-decoration: none; }
</style>
