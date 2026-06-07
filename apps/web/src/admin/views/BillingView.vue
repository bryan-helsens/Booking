<template>
  <div v-if="data">
    <h2>Abonnement</h2>

    <el-alert v-if="data.status === 'trialing'" type="warning" :closable="false" show-icon style="margin-bottom: 16px"
      :title="`Je zit in een gratis proefperiode${trialLeft ? ` — nog ${trialLeft} dagen` : ''}. Kies hieronder een plan om door te gaan.`" />
    <el-alert v-if="!data.stripeEnabled" type="info" :closable="false" show-icon style="margin-bottom: 16px"
      title="Demo-modus: upgrades worden direct toegepast zonder betaling. Zet STRIPE_SECRET_KEY om echte betalingen te activeren." />

    <el-row :gutter="20">
      <el-col v-for="p in data.plans" :key="p.id" :md="8">
        <el-card class="plan" :class="{ current: p.id === data.plan, highlight: p.highlight }">
          <div v-if="p.highlight" class="ribbon">Populair</div>
          <h3>{{ p.label }}</h3>
          <div class="price"><span class="amount">{{ site.formatMoney(p.priceCents) }}</span><span class="per">/maand</span></div>
          <el-tag v-if="p.id === data.plan" type="success" round style="margin-bottom: 12px">Huidig plan</el-tag>

          <ul class="feats">
            <li v-for="f in allFeatures" :key="f.key" :class="{ off: !p.features.includes(f.key) }">
              <el-icon><component :is="p.features.includes(f.key) ? 'Check' : 'Close'" /></el-icon> {{ f.label }}
            </li>
            <li><el-icon><Check /></el-icon> Tot {{ p.limits.staff }} medewerkers</li>
            <li><el-icon><Check /></el-icon> Tot {{ p.limits.services }} diensten</li>
          </ul>

          <el-button
            v-if="p.id !== data.plan"
            :type="rank(p.id) > rank(data.plan) ? 'primary' : 'default'"
            style="width: 100%"
            :loading="busy === p.id"
            @click="choose(p)"
          >
            {{ rank(p.id) > rank(data.plan) ? `Upgrade naar ${p.label}` : (p.id === 'free' ? 'Downgraden' : `Wissel naar ${p.label}`) }}
          </el-button>
          <el-button v-else disabled style="width: 100%">Actief</el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-card v-if="data.stripeEnabled" style="margin-top: 16px">
      <el-button :icon="CreditCard" @click="portal">Beheer facturatie & betaalmethode</el-button>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CreditCard } from '@element-plus/icons-vue';
import { api } from '@/api/client';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const data = ref<any>(null);
const busy = ref('');

const allFeatures = [
  { key: 'reviews', label: 'Reviews' },
  { key: 'email', label: 'E-mail notificaties' },
  { key: 'waitlist', label: 'Wachtlijst' },
  { key: 'coupons', label: 'Kortingscodes' },
  { key: 'giftcards', label: 'Cadeaubonnen' },
  { key: 'payments', label: 'Online betalingen' },
  { key: 'sms', label: 'SMS notificaties' },
];
const order: Record<string, number> = { free: 0, starter: 1, pro: 2 };
const rank = (id: string) => order[id] ?? 0;
const trialLeft = computed(() => {
  if (!data.value?.trialEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(data.value.trialEndsAt).getTime() - Date.now()) / 86400000));
});

async function load() {
  const { data: d } = await api.get('/billing');
  data.value = d;
}
onMounted(load);

async function choose(plan: any) {
  if (plan.id === 'free') {
    await ElMessageBox.confirm('Weet je zeker dat je wilt downgraden naar Free? Sommige functies worden uitgeschakeld.', 'Downgraden', { type: 'warning' });
    busy.value = plan.id;
    try { await api.post('/billing/downgrade'); await refresh(`Je zit nu op het Free plan`); } finally { busy.value = ''; }
    return;
  }
  busy.value = plan.id;
  try {
    const { data: res } = await api.post('/billing/checkout', { plan: plan.id });
    if (res.url) { window.location.href = res.url; return; }
    await refresh(`Je zit nu op het ${plan.label} plan 🎉`);
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Wijzigen mislukt');
  } finally {
    busy.value = '';
  }
}

async function refresh(msg: string) {
  await load();
  await site.bootstrap(); // refresh plan/entitlements app-wide
  ElMessage.success(msg);
}

async function portal() {
  const { data: res } = await api.post('/billing/portal');
  if (res.url) window.location.href = res.url;
  else ElMessage.info('Facturatieportaal is alleen beschikbaar met Stripe.');
}
</script>

<style scoped>
.plan { position: relative; height: 100%; }
.plan.current { border-color: var(--el-color-success); }
.plan.highlight { border-color: var(--el-color-primary); box-shadow: 0 6px 24px rgba(0,0,0,0.08); }
.ribbon { position: absolute; top: 14px; right: -2px; background: var(--app-color-primary); color: #fff; font-size: 0.72rem; padding: 3px 12px; border-radius: 6px 0 0 6px; }
h3 { margin: 0; }
.price { margin: 6px 0 14px; }
.amount { font-size: 2rem; font-weight: 800; }
.per { color: var(--el-text-color-secondary); }
.feats { list-style: none; padding: 0; margin: 0 0 18px; }
.feats li { display: flex; align-items: center; gap: 8px; padding: 5px 0; }
.feats li .el-icon { color: var(--el-color-success); }
.feats li.off { color: var(--el-text-color-placeholder); }
.feats li.off .el-icon { color: var(--el-text-color-placeholder); }
</style>
