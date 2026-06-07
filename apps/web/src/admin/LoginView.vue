<template>
  <div class="login">
    <el-card class="box">
      <h1>Admin login</h1>
      <p class="sub">Beheer je booking-website</p>

      <el-select v-model="tenant" style="width: 100%; margin-bottom: 16px" @change="onTenant" placeholder="Kies je bedrijf">
        <el-option v-for="t in tenants" :key="t.slug" :label="t.name" :value="t.slug" />
      </el-select>

      <el-form @submit.prevent="submit">
        <el-form-item>
          <el-input v-model="email" placeholder="E-mail" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="password" type="password" placeholder="Wachtwoord" show-password />
        </el-form-item>
        <el-button type="primary" style="width: 100%" :loading="loading" @click="submit">Inloggen</el-button>
      </el-form>
      <p class="forgot"><router-link to="/forgot">Wachtwoord vergeten?</router-link></p>

      <el-divider>of</el-divider>
      <el-button style="width: 100%" @click="oauth('google')">Inloggen met Google (OAuth)</el-button>
      <p class="signup">Nog geen site? <router-link to="/get-started">Maak je eigen boekingssite →</router-link></p>
      <el-alert v-if="demoMode" class="hint" type="info" :closable="false" show-icon
        title="Demo login" description="admin@acme.nl / admin@studio.nl — wachtwoord: demo1234" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { api, setTenant, getTenant } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
// Demo conveniences (prefilled creds + hint) are hidden in production.
const demoMode = import.meta.env.VITE_DEMO_MODE !== 'false';
const tenant = ref(getTenant());
const email = ref(demoMode ? 'admin@acme.nl' : '');
const password = ref(demoMode ? 'demo1234' : '');
const loading = ref(false);
const tenants = ref<Array<{ slug: string; name: string }>>([]);

onMounted(async () => {
  const { data } = await api.get('/tenants');
  tenants.value = data;
});

function onTenant(slug: string) {
  setTenant(slug);
  // Demo convenience: prefill the seeded admin email for demo tenants.
  if (demoMode && (slug === 'acme' || slug === 'studio')) email.value = `admin@${slug}.nl`;
}

async function submit() {
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push((route.query.redirect as string) || '/admin');
  } catch {
    ElMessage.error('Inloggen mislukt');
  } finally {
    loading.value = false;
  }
}

async function oauth(provider: string) {
  try {
    await auth.oauth(provider);
    router.push('/admin');
  } catch {
    ElMessage.error('OAuth mislukt');
  }
}
</script>

<style scoped>
.login { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--el-fill-color-light); }
.box { width: 380px; }
h1 { margin: 0; }
.sub { color: var(--el-text-color-secondary); margin: 4px 0 20px; }
.hint { margin-top: 16px; }
.signup { text-align: center; margin: 14px 0 0; color: var(--el-text-color-secondary); }
.signup a { color: var(--el-color-primary); text-decoration: none; }
.forgot { text-align: center; margin: 12px 0 0; }
.forgot a { color: var(--el-text-color-secondary); text-decoration: none; font-size: 0.9rem; }
</style>
