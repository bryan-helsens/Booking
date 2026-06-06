<template>
  <div class="login">
    <el-card class="box">
      <h1>Admin login</h1>
      <p class="sub">Beheer je booking-website</p>

      <el-select v-model="tenant" style="width: 100%; margin-bottom: 16px" @change="onTenant">
        <el-option label="Acme Wellness Spa" value="acme" />
        <el-option label="Studio Noir Barber" value="studio" />
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

      <el-divider>of</el-divider>
      <el-button style="width: 100%" @click="oauth('google')">Inloggen met Google (OAuth)</el-button>
      <el-alert class="hint" type="info" :closable="false" show-icon
        title="Demo login" description="admin@acme.nl / admin@studio.nl — wachtwoord: demo1234" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { setTenant, getTenant } from '@/api/client';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const tenant = ref(getTenant());
const email = ref('admin@acme.nl');
const password = ref('demo1234');
const loading = ref(false);

function onTenant(slug: string) {
  setTenant(slug);
  email.value = `admin@${slug}.nl`;
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
</style>
