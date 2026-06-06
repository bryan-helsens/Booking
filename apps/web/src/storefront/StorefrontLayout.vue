<template>
  <div v-if="site.loaded" class="storefront">
    <header class="sf-header">
      <div class="sf-container bar">
        <router-link to="/" class="brand">
          <img v-if="content?.logoUrl" :src="content.logoUrl" alt="logo" class="logo" @error="logoErr = true" v-show="!logoErr" />
          <span class="name">{{ content?.companyName }}</span>
        </router-link>
        <nav class="nav desktop">
          <router-link to="/">Home</router-link>
          <router-link to="/booking">Boeken</router-link>
          <el-button type="primary" round size="small" @click="$router.push('/booking')">Afspraak maken</el-button>
        </nav>
        <el-button class="burger" text :icon="Menu" @click="drawer = true" />
      </div>
    </header>

    <el-drawer v-model="drawer" direction="rtl" size="70%" :with-header="false">
      <div class="drawer-nav">
        <span class="d-brand">{{ content?.companyName }}</span>
        <router-link to="/" @click="drawer = false">Home</router-link>
        <router-link to="/booking" @click="drawer = false">Boeken</router-link>
        <el-button type="primary" round @click="drawer = false; $router.push('/booking')">Afspraak maken</el-button>
      </div>
    </el-drawer>

    <main>
      <router-view />
    </main>

    <footer class="sf-footer">
      <div class="sf-container foot">
        <div class="col brand-col">
          <div class="f-brand">
            <img v-if="content?.logoUrl && !logoErr" :src="content.logoUrl" alt="" class="f-logo" />
            <strong>{{ content?.companyName }}</strong>
          </div>
          <p class="desc">{{ content?.description }}</p>
        </div>
        <div class="col" v-if="hasSocial">
          <h4>Volg ons</h4>
          <a v-if="content?.social.facebook" :href="content.social.facebook" target="_blank"><el-icon><Share /></el-icon> Facebook</a>
          <a v-if="content?.social.instagram" :href="content.social.instagram" target="_blank"><el-icon><Camera /></el-icon> Instagram</a>
          <a v-if="content?.social.x" :href="content.social.x" target="_blank"><el-icon><ChatLineRound /></el-icon> X</a>
        </div>
        <div class="col">
          <h4>Contact</h4>
          <p v-if="content?.contact.address"><el-icon><Location /></el-icon> {{ content.contact.address }}</p>
          <p v-if="content?.contact.phone"><el-icon><Phone /></el-icon> {{ content.contact.phone }}</p>
          <p v-if="content?.contact.email"><el-icon><Message /></el-icon> {{ content.contact.email }}</p>
        </div>
      </div>
      <div class="copyright">
        <span>© {{ year }} {{ content?.companyName }}</span>
        <router-link to="/admin" class="admin-link">Beheer →</router-link>
      </div>
    </footer>

    <!-- Demo helper: switch tenant to showcase white-label theming -->
    <TenantSwitcher />
  </div>
  <el-skeleton v-else :rows="8" animated style="padding: 40px" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Menu } from '@element-plus/icons-vue';
import { useSiteStore } from '@/stores/site';
import { api } from '@/api/client';
import { injectStructuredData } from '@/theme/seo';
import TenantSwitcher from '@/components/TenantSwitcher.vue';

const site = useSiteStore();
const content = computed(() => site.content);
const drawer = ref(false);
const logoErr = ref(false);
const year = new Date().getFullYear();
const hasSocial = computed(() => {
  const s = site.content?.social;
  return !!(s && (s.facebook || s.instagram || s.x || s.linkedin));
});

onMounted(async () => {
  if (!site.loaded) await site.bootstrap();
  // Inject SEO structured data once the tenant config is known.
  try {
    const [sv, rv, hr] = await Promise.all([
      api.get('/services?active=true'),
      api.get('/reviews'),
      api.get('/business-hours'),
    ]);
    injectStructuredData({
      content: site.content,
      services: sv.data,
      reviews: rv.data,
      hours: hr.data,
      currency: site.settings?.regional?.currency || 'EUR',
    });
  } catch {
    /* SEO is best-effort */
  }
});
</script>

<style scoped>
.sf-header { position: sticky; top: 0; z-index: 10; background: color-mix(in srgb, var(--app-color-bg) 88%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--el-border-color-light); }
.bar { display: flex; align-items: center; justify-content: space-between; height: 68px; }
.brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--app-color-text); }
.logo { height: 38px; width: 38px; border-radius: var(--app-radius); object-fit: cover; }
.name { font-family: var(--app-font-heading); font-weight: 700; font-size: 1.25rem; }
.nav { display: flex; align-items: center; gap: 20px; }
.nav a { text-decoration: none; color: var(--app-color-text); font-weight: 500; }
.nav a:hover { color: var(--app-color-primary); }
.burger { display: none; font-size: 22px; }
.drawer-nav { display: flex; flex-direction: column; gap: 18px; padding-top: 20px; }
.drawer-nav a { text-decoration: none; color: var(--app-color-text); font-size: 1.1rem; }
.d-brand { font-family: var(--app-font-heading); font-weight: 700; font-size: 1.2rem; margin-bottom: 8px; }
.sf-footer { background: var(--el-fill-color); border-top: 1px solid var(--el-border-color-light); padding: 56px 24px 0; margin-top: 40px; }
.foot { display: grid; grid-template-columns: 2fr 1fr 1.5fr; gap: 40px; }
.col h4 { margin: 0 0 16px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--el-text-color-secondary); }
.col a, .col p { display: flex; align-items: center; gap: 8px; color: var(--el-text-color-regular); text-decoration: none; margin: 0 0 12px; }
.col a:hover { color: var(--app-color-primary); }
.col .el-icon { color: var(--app-color-primary); }
.f-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.f-logo { height: 34px; width: 34px; border-radius: var(--app-radius); object-fit: cover; }
.f-brand strong { font-family: var(--app-font-heading); font-size: 1.2rem; }
.brand-col .desc { color: var(--el-text-color-secondary); line-height: 1.6; max-width: 340px; }
.copyright { max-width: 1100px; margin: 32px auto 0; padding: 18px 0; border-top: 1px solid var(--el-border-color-light); display: flex; justify-content: space-between; align-items: center; color: var(--el-text-color-secondary); font-size: 0.85rem; }
.admin-link { color: var(--el-text-color-secondary); text-decoration: none; }
.admin-link:hover { color: var(--app-color-primary); }
@media (max-width: 768px) {
  .foot { grid-template-columns: 1fr; gap: 28px; }
  .copyright { flex-direction: column; gap: 8px; text-align: center; }
}
@media (max-width: 768px) {
  .nav.desktop { display: none; }
  .burger { display: inline-flex; }
}
</style>
