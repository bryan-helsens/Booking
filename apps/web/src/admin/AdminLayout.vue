<template>
  <el-container class="admin" :class="{ dark: isDark }">
    <el-aside width="230px" class="aside">
      <div class="logo">
        <el-icon size="22"><Calendar /></el-icon>
        <span>Booking Admin</span>
      </div>
      <el-menu :default-active="route.name as string" router :collapse="false" class="menu">
        <el-menu-item index="dashboard" :route="{ name: 'dashboard' }"><el-icon><Odometer /></el-icon>Dashboard</el-menu-item>
        <el-menu-item-group title="Vormgeving">
          <el-menu-item index="branding" :route="{ name: 'branding' }"><el-icon><Brush /></el-icon>Branding & Thema</el-menu-item>
          <el-menu-item index="builder" :route="{ name: 'builder' }"><el-icon><Grid /></el-icon>Page Builder</el-menu-item>
          <el-menu-item index="content" :route="{ name: 'content' }"><el-icon><Document /></el-icon>Content & SEO</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="Boekingen">
          <el-menu-item index="services" :route="{ name: 'services' }"><el-icon><List /></el-icon>Diensten</el-menu-item>
          <el-menu-item index="hours" :route="{ name: 'hours' }"><el-icon><Clock /></el-icon>Openingstijden</el-menu-item>
          <el-menu-item index="bookings" :route="{ name: 'bookings' }"><el-icon><Tickets /></el-icon>Reserveringen</el-menu-item>
        </el-menu-item-group>
        <el-menu-item index="features" :route="{ name: 'features' }"><el-icon><Switch /></el-icon>Features</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="left">
          <strong>{{ site.content?.companyName || 'Laden...' }}</strong>
          <el-tag size="small" round>{{ site.currentTenant() }}</el-tag>
        </div>
        <div class="right">
          <el-button text @click="toggleMode">
            <el-icon><component :is="isDark ? 'Sunny' : 'Moon'" /></el-icon>
          </el-button>
          <el-button text tag="a" href="/" target="_blank">Bekijk site <el-icon class="el-icon--right"><TopRight /></el-icon></el-button>
          <el-dropdown @command="onCommand">
            <span class="user">{{ auth.user?.name || 'Admin' }} <el-icon><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">Uitloggen</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-if="site.loaded" />
        <el-skeleton v-else :rows="6" animated />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSiteStore } from '@/stores/site';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const site = useSiteStore();
const auth = useAuthStore();
const isDark = ref(false);

onMounted(async () => {
  if (!site.loaded) await site.bootstrap();
  isDark.value = site.theme?.mode === 'dark';
});

const _ = computed(() => site.theme?.mode);

function toggleMode() {
  isDark.value = !isDark.value;
  const tokens = site.theme?.draft || site.theme?.tokens;
  if (tokens) site.saveTheme(tokens, isDark.value ? 'dark' : 'light');
}

function onCommand(cmd: string) {
  if (cmd === 'logout') {
    auth.logout();
    router.push({ name: 'login' });
  }
}
</script>

<style scoped>
.admin { height: 100vh; }
.aside { background: var(--el-bg-color); border-right: 1px solid var(--el-border-color-light); }
.logo { display: flex; align-items: center; gap: 8px; font-weight: 700; padding: 18px 20px; font-size: 1.05rem; }
.menu { border-right: none; }
.header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--el-border-color-light); }
.left { display: flex; align-items: center; gap: 10px; }
.right { display: flex; align-items: center; gap: 8px; }
.user { cursor: pointer; display: flex; align-items: center; gap: 4px; }
.main { background: var(--el-fill-color-light); }
</style>
