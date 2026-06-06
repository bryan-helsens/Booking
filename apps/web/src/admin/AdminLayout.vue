<template>
  <el-container class="admin">
    <!-- Desktop: persistent sidebar -->
    <el-aside v-if="!isMobile" width="230px" class="aside">
      <AdminMenu />
    </el-aside>

    <!-- Mobile: off-canvas drawer -->
    <el-drawer v-else v-model="menuOpen" direction="ltr" size="240px" :with-header="false">
      <AdminMenu @navigate="menuOpen = false" />
    </el-drawer>

    <el-container>
      <el-header class="header">
        <div class="left">
          <el-button v-if="isMobile" text :icon="Menu" class="burger" @click="menuOpen = true" />
          <strong class="company">{{ site.content?.companyName || 'Laden...' }}</strong>
          <el-tag size="small" round>{{ site.currentTenant() }}</el-tag>
        </div>
        <div class="right">
          <el-button text @click="toggleMode">
            <el-icon><component :is="isDark ? 'Sunny' : 'Moon'" /></el-icon>
          </el-button>
          <el-button text tag="a" href="/" target="_blank" class="view-site">
            Bekijk site <el-icon class="el-icon--right"><TopRight /></el-icon>
          </el-button>
          <el-dropdown @command="onCommand">
            <span class="user">{{ userInitial }} <el-icon><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="site">Bekijk site</el-dropdown-item>
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Menu } from '@element-plus/icons-vue';
import { useSiteStore } from '@/stores/site';
import { useAuthStore } from '@/stores/auth';
import AdminMenu from './AdminMenu.vue';

const route = useRoute();
const router = useRouter();
const site = useSiteStore();
const auth = useAuthStore();
const isDark = ref(false);
const isMobile = ref(false);
const menuOpen = ref(false);

const userInitial = computed(() => auth.user?.name || 'Admin');

function onResize() {
  isMobile.value = window.innerWidth < 768;
}

onMounted(async () => {
  onResize();
  window.addEventListener('resize', onResize);
  if (!site.loaded) await site.bootstrap();
  isDark.value = site.theme?.mode === 'dark';
});
onUnmounted(() => window.removeEventListener('resize', onResize));

// Close the mobile menu on navigation.
watch(() => route.name, () => (menuOpen.value = false));

function toggleMode() {
  isDark.value = !isDark.value;
  const tokens = site.theme?.draft || site.theme?.tokens;
  if (tokens) site.saveTheme(tokens, isDark.value ? 'dark' : 'light');
}

function onCommand(cmd: string) {
  if (cmd === 'logout') {
    auth.logout();
    router.push({ name: 'login' });
  } else if (cmd === 'site') {
    window.open('/', '_blank');
  }
}
</script>

<style scoped>
.admin { height: 100vh; }
.aside { border-right: 1px solid var(--el-border-color-light); }
.header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--el-border-color-light); padding: 0 12px; }
.left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.company { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 45vw; }
.right { display: flex; align-items: center; gap: 4px; }
.user { cursor: pointer; display: flex; align-items: center; gap: 4px; }
.main { background: var(--el-fill-color-light); padding: 16px; }
@media (max-width: 768px) {
  .view-site { display: none; }
}
</style>
