<template>
  <div>
    <div class="head">
      <h2>Features</h2>
      <el-button type="primary" :loading="saving" @click="save">Opslaan</el-button>
    </div>
    <el-alert type="info" :closable="false" show-icon
      title="Feature flags bepalen welke functionaliteit zichtbaar is op je booking-website. Grijze functies zitten in een hoger abonnement." />

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col v-for="f in featureList" :key="f.key" :xs="24" :sm="12" :md="8">
        <el-card class="feat" :class="{ on: flags[f.key] && allowed(f.key), locked: !allowed(f.key) }">
          <div class="top">
            <el-icon size="22"><component :is="f.icon" /></el-icon>
            <el-switch v-if="allowed(f.key)" v-model="flags[f.key]" />
            <el-tag v-else size="small" type="warning" round>{{ requiredPlan(f.key) }}</el-tag>
          </div>
          <h3>{{ f.label }}</h3>
          <p>{{ f.desc }}</p>
          <el-tag v-if="f.stub && allowed(f.key)" size="small" type="info">demo: niet aangesloten</el-tag>
          <el-button v-if="!allowed(f.key)" size="small" text type="primary" @click="$router.push({ name: 'billing' })">Upgrade om te ontgrendelen →</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { api } from '@/api/client';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const flags = reactive<Record<string, boolean>>({ ...site.features });
const saving = ref(false);
const plans = ref<any[]>([]);
const currentPlan = ref('free');

const featureList = [
  { key: 'reviews', label: 'Reviews', icon: 'Star', desc: 'Toon klantbeoordelingen op je site.' },
  { key: 'waitlist', label: 'Wachtlijst', icon: 'Clock', desc: 'Laat klanten op de wachtlijst bij volle slots.' },
  { key: 'coupons', label: 'Kortingscodes', icon: 'Discount', desc: 'Acties en kortingscodes voor klanten.' },
  { key: 'giftcards', label: 'Cadeaubonnen', icon: 'Present', desc: 'Verkoop en verzilver cadeaubonnen.' },
  { key: 'email', label: 'E-mail notificaties', icon: 'Message', desc: 'Bevestigingen en herinneringen per e-mail.' },
  { key: 'payments', label: 'Online betalingen', icon: 'CreditCard', desc: 'Betaling bij reservering.', stub: true },
  { key: 'sms', label: 'SMS notificaties', icon: 'ChatDotRound', desc: 'Herinneringen via SMS.', stub: true },
];

onMounted(async () => {
  const { data } = await api.get('/billing');
  plans.value = data.plans;
  currentPlan.value = data.plan;
});

function allowed(key: string) {
  const plan = plans.value.find((p) => p.id === currentPlan.value);
  return plan ? plan.features.includes(key) : true;
}
function requiredPlan(key: string) {
  const p = plans.value.find((pl) => pl.features.includes(key));
  return p ? p.label : 'Pro';
}

async function save() {
  saving.value = true;
  try {
    // Only persist flags the plan allows.
    const payload: Record<string, boolean> = {};
    for (const f of featureList) if (allowed(f.key)) payload[f.key] = flags[f.key];
    await site.saveFeatures(payload);
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
.feat.locked { opacity: 0.75; }
.top { display: flex; justify-content: space-between; align-items: center; }
.feat h3 { margin: 12px 0 6px; }
.feat p { color: var(--el-text-color-secondary); font-size: 0.9rem; margin: 0 0 8px; }
</style>
