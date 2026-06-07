<template>
  <div class="wrap">
    <el-card class="box">
      <h1>Wachtwoord vergeten</h1>
      <p class="sub">Kies je bedrijf en e-mail; we sturen een herstellink.</p>

      <el-select v-model="tenant" style="width: 100%; margin-bottom: 14px" placeholder="Kies je bedrijf" @change="onTenant">
        <el-option v-for="t in tenants" :key="t.slug" :label="t.name" :value="t.slug" />
      </el-select>
      <el-input v-model="email" placeholder="E-mailadres" style="margin-bottom: 14px" />
      <el-button type="primary" style="width: 100%" :loading="loading" @click="submit">Stuur herstellink</el-button>

      <el-alert v-if="sent" type="success" :closable="false" show-icon style="margin-top: 16px"
        title="Verstuurd" description="Als dit e-mailadres bestaat, ontvang je een herstellink." />
      <el-alert v-if="devLink" type="info" :closable="false" show-icon style="margin-top: 10px" title="Demo">
        <template #default>
          Geen e-mail gekoppeld in deze demo. <router-link :to="devLink">Open de herstellink →</router-link>
        </template>
      </el-alert>

      <p class="foot"><router-link to="/login">← Terug naar inloggen</router-link></p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { api, setTenant, getTenant } from '@/api/client';

const tenant = ref(getTenant());
const email = ref('');
const loading = ref(false);
const sent = ref(false);
const devLink = ref('');
const tenants = ref<Array<{ slug: string; name: string }>>([]);

onMounted(async () => {
  const { data } = await api.get('/tenants');
  tenants.value = data;
});

function onTenant(slug: string) {
  setTenant(slug);
}

async function submit() {
  loading.value = true;
  try {
    const { data } = await api.post('/auth/forgot', { email: email.value });
    sent.value = true;
    devLink.value = data.devToken ? `/reset?email=${encodeURIComponent(email.value)}&token=${data.devToken}` : '';
  } catch {
    ElMessage.error('Er ging iets mis');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--el-fill-color-light); }
.box { width: 380px; }
h1 { margin: 0; }
.sub { color: var(--el-text-color-secondary); margin: 4px 0 20px; }
.foot { text-align: center; margin: 16px 0 0; }
.foot a { color: var(--el-color-primary); text-decoration: none; }
</style>
