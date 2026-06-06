<template>
  <div>
    <div class="head">
      <h2>Features</h2>
      <el-button type="primary" :loading="saving" @click="save">Opslaan</el-button>
    </div>
    <el-alert type="info" :closable="false" show-icon
      title="Feature flags bepalen welke functionaliteit zichtbaar is op je booking-website." />

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col v-for="f in featureList" :key="f.key" :xs="24" :sm="12" :md="8">
        <el-card class="feat" :class="{ on: flags[f.key] }">
          <div class="top">
            <el-icon size="22"><component :is="f.icon" /></el-icon>
            <el-switch v-model="flags[f.key]" />
          </div>
          <h3>{{ f.label }}</h3>
          <p>{{ f.desc }}</p>
          <el-tag v-if="f.stub" size="small" type="info">demo: niet aangesloten</el-tag>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const flags = reactive<Record<string, boolean>>({ ...site.features });
const saving = ref(false);

const featureList = [
  { key: 'reviews', label: 'Reviews', icon: 'Star', desc: 'Toon klantbeoordelingen op je site.' },
  { key: 'waitlist', label: 'Wachtlijst', icon: 'Clock', desc: 'Laat klanten op de wachtlijst bij volle slots.' },
  { key: 'coupons', label: 'Kortingscodes', icon: 'Discount', desc: 'Acties en kortingscodes voor klanten.' },
  { key: 'giftcards', label: 'Cadeaubonnen', icon: 'Present', desc: 'Verkoop en verzilver cadeaubonnen.' },
  { key: 'email', label: 'E-mail notificaties', icon: 'Message', desc: 'Bevestigingen en herinneringen per e-mail.' },
  { key: 'payments', label: 'Online betalingen', icon: 'CreditCard', desc: 'Betaling bij reservering.', stub: true },
  { key: 'sms', label: 'SMS notificaties', icon: 'ChatDotRound', desc: 'Herinneringen via SMS.', stub: true },
];

async function save() {
  saving.value = true;
  try {
    await site.saveFeatures({ ...flags });
    ElMessage.success('Features opgeslagen');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.feat { height: 100%; margin-bottom: 16px; transition: border-color 0.2s; }
.feat.on { border-color: var(--el-color-primary); }
.top { display: flex; justify-content: space-between; align-items: center; }
.feat h3 { margin: 12px 0 6px; }
.feat p { color: var(--el-text-color-secondary); font-size: 0.9rem; margin: 0 0 8px; }
</style>
