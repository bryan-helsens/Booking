<template>
  <section class="sf-section hours">
    <div class="sf-container narrow">
      <h2 class="sf-heading">{{ props.block.title || 'Openingstijden' }}</h2>
      <div class="sf-accent-bar" />
      <el-card class="sf-card">
        <ul class="list">
          <li v-for="h in hours" :key="h.weekday" :class="{ today: h.weekday === today }">
            <span class="day">{{ days[h.weekday] }} <el-tag v-if="h.weekday === today" size="small" round>vandaag</el-tag></span>
            <span v-if="h.isClosed" class="closed">Gesloten</span>
            <span v-else class="time">{{ fmt(h.openMin) }} – {{ fmt(h.closeMin) }}</span>
          </li>
        </ul>
      </el-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api/client';

const props = defineProps<{ block: Record<string, any> }>();
const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const today = new Date().getDay();
const hours = ref<any[]>([]);

onMounted(async () => {
  const { data } = await api.get('/business-hours');
  hours.value = data;
});

const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
</script>

<style scoped>
.hours { background: var(--el-fill-color-light); }
.narrow { max-width: 560px; }
.list { list-style: none; margin: 0; padding: 0; }
.list li { display: flex; justify-content: space-between; align-items: center; padding: 14px 6px; border-bottom: 1px solid var(--el-border-color-lighter); }
.list li:last-child { border-bottom: none; }
.day { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.closed { color: var(--el-text-color-secondary); }
.time { color: var(--app-color-primary); font-weight: 600; }
.today { background: var(--el-color-primary-light-9); border-radius: var(--app-radius); }
</style>
