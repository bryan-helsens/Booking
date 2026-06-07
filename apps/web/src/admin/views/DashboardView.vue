<template>
  <div>
    <h2>Dashboard</h2>

    <el-row :gutter="20">
      <el-col :xs="12" :sm="6">
        <el-card class="stat"><div class="s-ico" style="background: var(--el-color-primary-light-9)"><el-icon><Tickets /></el-icon></div>
          <el-statistic title="Reserveringen" :value="stats.bookings" /></el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat"><div class="s-ico" style="background: var(--el-color-success-light-9)"><el-icon><Calendar /></el-icon></div>
          <el-statistic title="Komend" :value="stats.upcoming" /></el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat"><div class="s-ico" style="background: var(--el-color-warning-light-9)"><el-icon><List /></el-icon></div>
          <el-statistic title="Diensten" :value="stats.services" /></el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat"><div class="s-ico" style="background: var(--el-color-danger-light-9)"><el-icon><Switch /></el-icon></div>
          <el-statistic title="Actieve features" :value="stats.features" /></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :md="14">
        <el-card header="Reserveringen per dienst">
          <div v-if="chart.length" class="chart">
            <div v-for="c in chart" :key="c.name" class="bar-row">
              <span class="bar-label">{{ c.name }}</span>
              <div class="bar-track"><div class="bar-fill" :style="{ width: pct(c.count) + '%' }">{{ c.count }}</div></div>
            </div>
          </div>
          <el-empty v-else description="Nog geen reserveringen" :image-size="70" />
        </el-card>
      </el-col>
      <el-col :md="10">
        <el-card header="Snel aan de slag">
          <el-space direction="vertical" alignment="stretch" style="width: 100%">
            <el-button @click="$router.push({ name: 'branding' })" :icon="Brush">Pas je thema aan</el-button>
            <el-button @click="$router.push({ name: 'builder' })" :icon="Grid">Bouw je homepage</el-button>
            <el-button @click="$router.push({ name: 'services' })" :icon="List">Beheer diensten</el-button>
          </el-space>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>Vandaag <el-tag size="small" round>{{ today.length }}</el-tag></template>
      <el-table :data="today" v-if="today.length">
        <el-table-column label="Tijd" width="90"><template #default="{ row }">{{ time(row.startsAt) }}</template></el-table-column>
        <el-table-column label="Klant" prop="customerName" />
        <el-table-column label="Dienst"><template #default="{ row }">{{ row.service?.name }}</template></el-table-column>
        <el-table-column label="Medewerker"><template #default="{ row }">{{ row.staff?.name || '—' }}</template></el-table-column>
      </el-table>
      <el-empty v-else description="Geen afspraken vandaag" :image-size="70" />
    </el-card>

    <el-card header="Recente reserveringen" style="margin-top: 20px">
      <el-table :data="recent" v-if="recent.length">
        <el-table-column label="Klant" prop="customerName" />
        <el-table-column label="Dienst"><template #default="{ row }">{{ row.service?.name }}</template></el-table-column>
        <el-table-column label="Wanneer"><template #default="{ row }">{{ dt(row.startsAt) }}</template></el-table-column>
        <el-table-column label="Status" width="130"><template #default="{ row }">
          <el-tag :type="row.status === 'confirmed' ? 'success' : row.status === 'cancelled' ? 'danger' : 'warning'">{{ row.status }}</el-tag>
        </template></el-table-column>
      </el-table>
      <el-empty v-else description="Nog geen reserveringen" :image-size="70" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Brush, Grid, List } from '@element-plus/icons-vue';
import { api } from '@/api/client';
import { useSiteStore } from '@/stores/site';
import type { Booking } from '@/types';

const site = useSiteStore();
const stats = reactive({ bookings: 0, upcoming: 0, services: 0, features: 0 });
const bookings = ref<Booking[]>([]);
const chart = ref<Array<{ name: string; count: number }>>([]);

onMounted(async () => {
  const [b, s] = await Promise.all([api.get('/bookings'), api.get('/services')]);
  bookings.value = b.data;
  const now = Date.now();
  stats.bookings = b.data.length;
  stats.upcoming = b.data.filter((x: Booking) => new Date(x.startsAt).getTime() > now && x.status !== 'cancelled').length;
  stats.services = s.data.length;
  stats.features = Object.values(site.features).filter(Boolean).length;

  const counts: Record<string, number> = {};
  for (const bk of b.data) {
    const n = bk.service?.name || '—';
    counts[n] = (counts[n] || 0) + 1;
  }
  chart.value = Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b2) => b2.count - a.count);
});

const recent = computed(() => bookings.value.slice(0, 6));
const today = computed(() => {
  const key = new Date().toISOString().slice(0, 10);
  return bookings.value
    .filter((b: any) => b.status !== 'cancelled' && new Date(b.startsAt).toISOString().slice(0, 10) === key)
    .sort((a: any, b: any) => +new Date(a.startsAt) - +new Date(b.startsAt));
});
const max = computed(() => Math.max(1, ...chart.value.map((c) => c.count)));
const pct = (n: number) => Math.round((n / max.value) * 100);
const dt = (iso: string) => new Date(iso).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
const time = (iso: string) => new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
</script>

<style scoped>
.stat { display: flex; align-items: center; gap: 14px; }
.stat :deep(.el-card__body) { display: flex; align-items: center; gap: 14px; width: 100%; }
.s-ico { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--el-color-primary); }
.chart { display: flex; flex-direction: column; gap: 14px; }
.bar-row { display: flex; align-items: center; gap: 12px; }
.bar-label { width: 150px; font-size: 0.9rem; text-align: right; color: var(--el-text-color-secondary); }
.bar-track { flex: 1; background: var(--el-fill-color); border-radius: 8px; overflow: hidden; }
.bar-fill { background: linear-gradient(90deg, var(--app-color-primary), var(--app-color-accent)); color: #fff; padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; text-align: right; min-width: 28px; transition: width 0.6s ease; }
</style>
