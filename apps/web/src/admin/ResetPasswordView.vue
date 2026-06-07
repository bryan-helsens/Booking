<template>
  <div class="wrap">
    <el-card class="box">
      <h1>Nieuw wachtwoord</h1>
      <p class="sub">Stel een nieuw wachtwoord in voor {{ email }}.</p>

      <el-input v-model="password" type="password" show-password placeholder="Nieuw wachtwoord (min. 6 tekens)" style="margin-bottom: 12px" />
      <el-input v-model="confirm" type="password" show-password placeholder="Herhaal wachtwoord" style="margin-bottom: 14px" @keyup.enter="submit" />
      <el-button type="primary" style="width: 100%" :loading="loading" :disabled="!valid" @click="submit">Wachtwoord opslaan</el-button>

      <el-alert v-if="done" type="success" :closable="false" show-icon style="margin-top: 16px"
        title="Gelukt" description="Je wachtwoord is gewijzigd. Je kunt nu inloggen." />
      <p class="foot"><router-link to="/login">← Naar inloggen</router-link></p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { api, setTenant } from '@/api/client';

const route = useRoute();
const router = useRouter();
const email = ref((route.query.email as string) || '');
const token = ref((route.query.token as string) || '');
const password = ref('');
const confirm = ref('');
const loading = ref(false);
const done = ref(false);

// The reset link may target a tenant other than the current one.
if (route.query.tenant) setTenant(route.query.tenant as string);

const valid = computed(() => password.value.length >= 6 && password.value === confirm.value);

async function submit() {
  if (!valid.value) {
    ElMessage.warning('Wachtwoorden komen niet overeen of zijn te kort');
    return;
  }
  loading.value = true;
  try {
    await api.post('/auth/reset', { email: email.value, token: token.value, password: password.value });
    done.value = true;
    setTimeout(() => router.push('/login'), 1500);
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Reset mislukt');
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
