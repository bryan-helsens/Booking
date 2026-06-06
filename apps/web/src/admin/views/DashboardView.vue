<template>
  <div>
    <h2>Dashboard</h2>
    <el-row :gutter="20">
      <el-col :xs="24" :sm="8">
        <el-statistic title="Reserveringen" :value="stats.bookings" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-statistic title="Diensten" :value="stats.services" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-statistic title="Actieve features" :value="stats.features" />
      </el-col>
    </el-row>

    <el-card style="margin-top: 24px">
      <template #header>Snel aan de slag</template>
      <el-space wrap>
        <el-button @click="$router.push({ name: 'branding' })" :icon="Brush">Pas je thema aan</el-button>
        <el-button @click="$router.push({ name: 'builder' })" :icon="Grid">Bouw je homepage</el-button>
        <el-button @click="$router.push({ name: 'services' })" :icon="List">Beheer diensten</el-button>
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { Brush, Grid, List } from '@element-plus/icons-vue';
import { api } from '@/api/client';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const stats = reactive({ bookings: 0, services: 0, features: 0 });

onMounted(async () => {
  const [b, s] = await Promise.all([api.get('/bookings'), api.get('/services')]);
  stats.bookings = b.data.length;
  stats.services = s.data.length;
  stats.features = Object.values(site.features).filter(Boolean).length;
});
</script>
