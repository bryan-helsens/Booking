<template>
  <div v-if="data">
    <h2>Statistieken</h2>

    <el-row :gutter="20">
      <el-col :xs="12" :sm="6">
        <el-card class="stat"><span class="s-label">Omzet (geboekt)</span><span class="s-val">{{ site.formatMoney(data.revenueCents) }}</span></el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat"><span class="s-label">Reserveringen</span><span class="s-val">{{ data.totalBookings }}</span></el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat"><span class="s-label">Komend</span><span class="s-val">{{ data.upcoming }}</span></el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat"><span class="s-label">Annuleringsratio</span><span class="s-val">{{ data.cancelRate }}%</span></el-card>
      </el-col>
    </el-row>

    <el-card header="Reserveringen — afgelopen 14 dagen" style="margin-top: 20px">
      <div class="spark">
        <div v-for="d in data.last14Days" :key="d.date" class="col">
          <div class="bar" :style="{ height: barH(d.count) }" :title="`${d.date}: ${d.count}`" />
          <span class="day">{{ d.date.slice(8) }}</span>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :md="12">
        <el-card header="Populairste diensten">
          <Ranking :rows="data.perService" empty="Nog geen reserveringen" />
        </el-card>
      </el-col>
      <el-col :md="12">
        <el-card header="Bezetting per medewerker">
          <Ranking :rows="data.perStaff" empty="Geen medewerker-data" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { h } from 'vue';
import { api } from '@/api/client';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const data = ref<any>(null);

onMounted(async () => {
  const res = await api.get('/analytics');
  data.value = res.data;
});

const maxDay = computed(() => Math.max(1, ...(data.value?.last14Days || []).map((d: any) => d.count)));
const barH = (n: number) => `${Math.max(4, Math.round((n / maxDay.value) * 100))}%`;

// Tiny inline ranking list component.
const Ranking = (props: { rows: { name: string; count: number }[]; empty: string }) => {
  if (!props.rows?.length) return h('div', { class: 'empty' }, props.empty);
  const max = Math.max(...props.rows.map((r) => r.count));
  return h(
    'div',
    { class: 'rank' },
    props.rows.map((r) =>
      h('div', { class: 'rrow', key: r.name }, [
        h('span', { class: 'rname' }, r.name),
        h('div', { class: 'rtrack' }, [h('div', { class: 'rfill', style: { width: `${Math.round((r.count / max) * 100)}%` } }, String(r.count))]),
      ]),
    ),
  );
};
</script>

<style scoped>
.stat { text-align: center; }
.stat :deep(.el-card__body) { display: flex; flex-direction: column; gap: 4px; }
.s-label { color: var(--el-text-color-secondary); font-size: 0.85rem; }
.s-val { font-size: 1.6rem; font-weight: 700; }
.spark { display: flex; align-items: flex-end; gap: 6px; height: 160px; }
.spark .col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
.spark .bar { width: 100%; background: linear-gradient(180deg, var(--app-color-primary), var(--app-color-accent)); border-radius: 6px 6px 0 0; min-height: 4px; }
.spark .day { font-size: 0.7rem; color: var(--el-text-color-secondary); }
:deep(.rank) { display: flex; flex-direction: column; gap: 10px; }
:deep(.rrow) { display: flex; align-items: center; gap: 12px; }
:deep(.rname) { width: 140px; text-align: right; color: var(--el-text-color-secondary); font-size: 0.9rem; }
:deep(.rtrack) { flex: 1; background: var(--el-fill-color); border-radius: 6px; overflow: hidden; }
:deep(.rfill) { background: var(--app-color-primary); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; text-align: right; min-width: 24px; }
:deep(.empty) { color: var(--el-text-color-secondary); text-align: center; padding: 20px; }
</style>
