<template>
  <div>
    <h2>Reserveringen</h2>
    <el-table :data="bookings" stripe>
      <el-table-column label="Klant"><template #default="{ row }">{{ row.customerName }}<br /><small>{{ row.customerEmail }}</small></template></el-table-column>
      <el-table-column label="Dienst"><template #default="{ row }">{{ row.service?.name }}</template></el-table-column>
      <el-table-column label="Medewerker"><template #default="{ row }">{{ row.staff?.name || '—' }}</template></el-table-column>
      <el-table-column label="Wanneer"><template #default="{ row }">{{ dt(row.startsAt) }}</template></el-table-column>
      <el-table-column label="Status" width="140">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="" width="160">
        <template #default="{ row }">
          <el-button v-if="row.status !== 'cancelled'" size="small" type="danger" plain @click="cancel(row)">Annuleren</el-button>
          <el-button v-if="row.status === 'pending'" size="small" type="success" plain @click="confirm(row)">Bevestigen</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!bookings.length" description="Nog geen reserveringen" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api/client';
import type { Booking } from '@/types';

const bookings = ref<Booking[]>([]);

async function load() {
  const { data } = await api.get('/bookings');
  bookings.value = data;
}
onMounted(load);

async function setStatus(row: Booking, status: string) {
  await api.patch(`/bookings/${row.id}`, { status });
  await load();
}
const cancel = (r: Booking) => setStatus(r, 'cancelled');
const confirm = (r: Booking) => setStatus(r, 'confirmed');

const dt = (iso: string) => new Date(iso).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
const statusType = (s: string) => (s === 'confirmed' ? 'success' : s === 'cancelled' ? 'danger' : 'warning');
</script>
