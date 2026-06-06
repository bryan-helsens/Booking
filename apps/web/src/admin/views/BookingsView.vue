<template>
  <div>
    <div class="head">
      <h2>Reserveringen</h2>
      <el-radio-group v-model="filter" @change="() => {}">
        <el-radio-button value="upcoming">Komend ({{ counts.upcoming }})</el-radio-button>
        <el-radio-button value="past">Verleden ({{ counts.past }})</el-radio-button>
        <el-radio-button value="cancelled">Geannuleerd ({{ counts.cancelled }})</el-radio-button>
        <el-radio-button value="all">Alle ({{ bookings.length }})</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="filtered" stripe>
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="detail">
            <p><strong>E-mail:</strong> {{ row.customerEmail }}</p>
            <p><strong>Duur:</strong> {{ dt(row.startsAt) }} – {{ time(row.endsAt) }}</p>
            <p v-if="row.notes"><strong>Notities / antwoorden:</strong></p>
            <pre v-if="row.notes" class="notes">{{ row.notes }}</pre>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Klant"><template #default="{ row }">{{ row.customerName }}<br /><small>{{ row.customerEmail }}</small></template></el-table-column>
      <el-table-column label="Dienst"><template #default="{ row }">{{ row.service?.name }}</template></el-table-column>
      <el-table-column label="Medewerker"><template #default="{ row }">{{ row.staff?.name || '—' }}</template></el-table-column>
      <el-table-column label="Wanneer"><template #default="{ row }">{{ dt(row.startsAt) }}</template></el-table-column>
      <el-table-column label="Status" width="130">
        <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column label="" width="160">
        <template #default="{ row }">
          <el-button v-if="row.status !== 'cancelled'" size="small" type="danger" plain @click="cancel(row)">Annuleren</el-button>
          <el-button v-if="row.status === 'pending'" size="small" type="success" plain @click="confirm(row)">Bevestigen</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!filtered.length" description="Geen reserveringen in deze weergave" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api/client';
import type { Booking } from '@/types';

const bookings = ref<Booking[]>([]);
const filter = ref<'upcoming' | 'past' | 'cancelled' | 'all'>('upcoming');

async function load() {
  const { data } = await api.get('/bookings');
  bookings.value = data;
}
onMounted(load);

const now = () => Date.now();
const counts = computed(() => ({
  upcoming: bookings.value.filter((b) => b.status !== 'cancelled' && new Date(b.startsAt).getTime() >= now()).length,
  past: bookings.value.filter((b) => b.status !== 'cancelled' && new Date(b.startsAt).getTime() < now()).length,
  cancelled: bookings.value.filter((b) => b.status === 'cancelled').length,
}));

const filtered = computed(() => {
  const t = now();
  return bookings.value.filter((b) => {
    if (filter.value === 'all') return true;
    if (filter.value === 'cancelled') return b.status === 'cancelled';
    if (b.status === 'cancelled') return false;
    const future = new Date(b.startsAt).getTime() >= t;
    return filter.value === 'upcoming' ? future : !future;
  });
});

async function setStatus(row: Booking, status: string) {
  await api.patch(`/bookings/${row.id}`, { status });
  await load();
}
const cancel = (r: Booking) => setStatus(r, 'cancelled');
const confirm = (r: Booking) => setStatus(r, 'confirmed');

const dt = (iso: string) => new Date(iso).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
const time = (iso: string) => new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
const statusType = (s: string) => (s === 'confirmed' ? 'success' : s === 'cancelled' ? 'danger' : 'warning');
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px; }
.detail { padding: 6px 12px; }
.detail p { margin: 4px 0; }
.notes { background: var(--el-fill-color); padding: 10px; border-radius: 8px; white-space: pre-wrap; font-family: inherit; margin: 4px 0 0; }
</style>
