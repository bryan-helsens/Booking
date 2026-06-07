<template>
  <div>
    <div class="head">
      <h2>Openingstijden</h2>
      <el-button type="primary" :loading="saving" @click="save">Opslaan</el-button>
    </div>

    <el-card>
      <div v-for="h in hours" :key="h.weekday" class="day">
        <span class="name">{{ days[h.weekday] }}</span>
        <el-switch v-model="h.isClosed" :active-value="false" :inactive-value="true" active-text="Open" inactive-text="Gesloten" inline-prompt />
        <template v-if="!h.isClosed">
          <el-time-select v-model="h.open" start="06:00" step="00:30" end="23:00" placeholder="Open" />
          <span>tot</span>
          <el-time-select v-model="h.close" start="06:00" step="00:30" end="23:30" placeholder="Sluit" />
        </template>
        <span v-else class="closed">Gesloten</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { api } from '@/api/client';

const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const hours = ref<any[]>([]);
const saving = ref(false);

const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

async function load() {
  const { data } = await api.get('/business-hours');
  hours.value = data.map((h: any) => ({ ...h, open: toTime(h.openMin), close: toTime(h.closeMin) }));
}
onMounted(load);

async function save() {
  saving.value = true;
  try {
    const payload = hours.value.map((h) => ({
      weekday: h.weekday,
      isClosed: h.isClosed,
      openMin: toMin(h.open || '09:00'),
      closeMin: toMin(h.close || '17:00'),
    }));
    await api.put('/business-hours', payload);
    ElMessage.success('Opgeslagen');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.day { display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.day .name { width: 110px; font-weight: 600; }
.closed { color: var(--el-text-color-secondary); }
</style>
