<template>
  <section class="sf-section">
    <div class="sf-container narrow">
      <h1 class="sf-heading">Afspraak beheren</h1>
      <div class="sf-accent-bar" />

      <el-card v-if="!booking" class="sf-card">
        <el-form label-position="top" @submit.prevent="lookup">
          <el-form-item label="Referentie">
            <el-input v-model="id" placeholder="je boekingsreferentie" />
          </el-form-item>
          <el-form-item label="E-mailadres">
            <el-input v-model="email" placeholder="waarmee je geboekt hebt" />
          </el-form-item>
          <el-button type="primary" :loading="loading" :disabled="!id || !email" @click="lookup">Zoek afspraak</el-button>
        </el-form>
      </el-card>

      <el-card v-else class="sf-card detail">
        <el-result
          :icon="booking.status === 'cancelled' ? 'warning' : 'success'"
          :title="booking.status === 'cancelled' ? 'Geannuleerd' : 'Afspraak gevonden'"
        >
          <template #extra>
            <div class="info">
              <p><strong>{{ booking.service?.name }}</strong></p>
              <p>{{ dt(booking.startsAt) }}</p>
              <p class="muted">Status: {{ booking.status }}</p>
            </div>
            <el-button
              v-if="booking.status !== 'cancelled'"
              type="danger"
              :loading="cancelling"
              @click="cancel"
            >Afspraak annuleren</el-button>
            <el-button @click="reset">Andere afspraak</el-button>
          </template>
        </el-result>
      </el-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { api } from '@/api/client';

const id = ref('');
const email = ref('');
const loading = ref(false);
const cancelling = ref(false);
const booking = ref<any>(null);

async function lookup() {
  loading.value = true;
  try {
    const { data } = await api.get(`/my-booking/${id.value.trim()}`, { params: { email: email.value.trim() } });
    booking.value = data;
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Geen afspraak gevonden');
  } finally {
    loading.value = false;
  }
}

async function cancel() {
  cancelling.value = true;
  try {
    const { data } = await api.post(`/my-booking/${id.value.trim()}/cancel`, { email: email.value.trim() });
    booking.value = { ...booking.value, status: data.status };
    ElMessage.success('Je afspraak is geannuleerd.');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Annuleren mislukt');
  } finally {
    cancelling.value = false;
  }
}

function reset() {
  booking.value = null;
  id.value = '';
  email.value = '';
}

const dt = (iso: string) => new Date(iso).toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short' });
</script>

<style scoped>
.narrow { max-width: 520px; }
.detail .info { margin-bottom: 16px; }
.detail .info p { margin: 4px 0; }
.muted { color: var(--el-text-color-secondary); }
</style>
