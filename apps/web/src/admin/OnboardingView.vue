<template>
  <div class="onb">
    <el-card class="box">
      <div class="brand"><el-icon size="26"><Calendar /></el-icon><span>Booking Platform</span></div>
      <h1>Maak je eigen boekingssite</h1>
      <p class="sub">In één minuut een complete site met je eigen thema, diensten en boekingspagina.</p>

      <el-steps :active="step" finish-status="success" align-center style="margin: 24px 0">
        <el-step title="Bedrijf" />
        <el-step title="Stijl" />
        <el-step title="Account" />
      </el-steps>

      <!-- Step 0 -->
      <div v-show="step === 0">
        <el-form label-position="top">
          <el-form-item label="Bedrijfsnaam">
            <el-input v-model="form.companyName" placeholder="bijv. Bella's Kapsalon" size="large" />
          </el-form-item>
          <el-form-item label="Korte omschrijving (optioneel)">
            <el-input v-model="form.description" type="textarea" :rows="2" placeholder="Waar staat je bedrijf voor?" />
          </el-form-item>
        </el-form>
      </div>

      <!-- Step 1: theme -->
      <div v-show="step === 1" class="themes">
        <div
          v-for="t in themes"
          :key="t.key"
          class="theme-card"
          :class="{ active: form.theme === t.key }"
          @click="form.theme = t.key"
          :style="{ background: t.bg }"
        >
          <div class="swatches">
            <span :style="{ background: t.p }" />
            <span :style="{ background: t.s }" />
            <span :style="{ background: t.a }" />
          </div>
          <strong :style="{ color: t.text, fontFamily: t.font }">{{ t.label }}</strong>
          <el-icon v-if="form.theme === t.key" class="check" :style="{ color: t.p }"><CircleCheckFilled /></el-icon>
        </div>
      </div>

      <!-- Step 2: account -->
      <div v-show="step === 2">
        <el-form label-position="top">
          <el-form-item label="E-mailadres (waarmee je inlogt)">
            <el-input v-model="form.email" placeholder="jij@bedrijf.nl" size="large" />
          </el-form-item>
          <el-form-item label="Wachtwoord">
            <el-input v-model="form.password" type="password" show-password placeholder="minstens 6 tekens" size="large" />
          </el-form-item>
        </el-form>
      </div>

      <div class="actions">
        <el-button v-if="step > 0" @click="step--">Terug</el-button>
        <el-button v-if="step < 2" type="primary" :disabled="!canNext" @click="step++">Volgende</el-button>
        <el-button v-else type="primary" :loading="loading" :disabled="!canNext" @click="submit">Site aanmaken 🚀</el-button>
      </div>

      <el-divider />
      <p class="foot">Al een site? <router-link to="/login">Inloggen</router-link></p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { api, setTenant } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useSiteStore } from '@/stores/site';

const router = useRouter();
const auth = useAuthStore();
const site = useSiteStore();
const step = ref(0);
const loading = ref(false);
const form = ref({ companyName: '', description: '', email: '', password: '', theme: 'fresh' });

const themes = [
  { key: 'fresh', label: 'Fresh', bg: '#ffffff', text: '#1f2937', p: '#0ea5a4', s: '#f59e0b', a: '#ec4899', font: "'Poppins', sans-serif" },
  { key: 'bold', label: 'Bold', bg: '#0f172a', text: '#e2e8f0', p: '#eab308', s: '#64748b', a: '#ef4444', font: "'Oswald', sans-serif" },
  { key: 'elegant', label: 'Elegant', bg: '#faf5ff', text: '#1e1b4b', p: '#7c3aed', s: '#0ea5e9', a: '#f43f5e', font: "'Playfair Display', serif" },
];

const canNext = computed(() => {
  if (step.value === 0) return form.value.companyName.trim().length >= 2;
  if (step.value === 1) return !!form.value.theme;
  return /.+@.+\..+/.test(form.value.email) && form.value.password.length >= 6;
});

async function submit() {
  loading.value = true;
  try {
    const { data } = await api.post('/tenants', form.value);
    setTenant(data.tenant.slug);
    auth.applySession(data.token, data.user);
    await site.switchTenant(data.tenant.slug);
    ElMessage.success(`${data.tenant.name} is aangemaakt!`);
    router.push('/admin');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Aanmaken mislukt');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.onb { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0ea5a4, #7c3aed); padding: 20px; }
.box { width: 540px; max-width: 100%; }
.brand { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--el-color-primary); }
h1 { margin: 12px 0 4px; font-size: 1.6rem; }
.sub { color: var(--el-text-color-secondary); margin: 0; }
.themes { display: flex; gap: 14px; flex-wrap: wrap; }
.theme-card { position: relative; flex: 1; min-width: 140px; border: 2px solid var(--el-border-color); border-radius: 12px; padding: 18px; cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
.theme-card.active { border-color: var(--el-color-primary); transform: translateY(-3px); }
.swatches { display: flex; gap: 6px; margin-bottom: 12px; }
.swatches span { width: 22px; height: 22px; border-radius: 50%; display: inline-block; box-shadow: 0 0 0 1px rgba(0,0,0,0.08); }
.check { position: absolute; top: 10px; right: 10px; font-size: 20px; }
.actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.foot { text-align: center; color: var(--el-text-color-secondary); margin: 0; }
.foot a { color: var(--el-color-primary); text-decoration: none; }
</style>
