<template>
  <section class="sf-section">
    <div class="sf-container">
      <h1 class="title">Maak een afspraak</h1>
      <el-steps :active="step" align-center finish-status="success" style="margin-bottom: 32px">
        <el-step title="Dienst" />
        <el-step title="Tijdstip" />
        <el-step title="Gegevens" />
        <el-step title="Bevestiging" />
      </el-steps>

      <!-- Step 0: choose service -->
      <div v-if="step === 0">
        <el-row :gutter="20">
          <el-col v-for="s in services" :key="s.id" :xs="24" :sm="12" :md="8">
            <el-card class="sf-card svc" :class="{ active: form.serviceId === s.id }" shadow="hover" @click="selectService(s.id)">
              <h3>{{ s.name }}</h3>
              <p class="desc">{{ s.description }}</p>
              <el-tag round>{{ s.durationMin }} min</el-tag>
              <span class="price">{{ euro(s.priceCents) }}</span>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- Step 1: pick date + slot -->
      <div v-else-if="step === 1" class="slots">
        <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" :clearable="false" @change="loadSlots" />
        <el-empty v-if="loadedSlots && slots.length === 0" description="Gesloten of geen beschikbaarheid op deze dag" />
        <div class="slot-grid" v-else>
          <el-button
            v-for="slot in slots"
            :key="slot.startsAt"
            :disabled="!slot.available"
            :type="form.startsAt === slot.startsAt ? 'primary' : 'default'"
            round
            @click="form.startsAt = slot.startsAt"
          >
            {{ time(slot.startsAt) }}
          </el-button>
        </div>
      </div>

      <!-- Step 2: details -->
      <div v-else-if="step === 2">
        <el-form label-position="top" style="max-width: 480px; margin: 0 auto">
          <el-form-item label="Naam"><el-input v-model="form.customerName" /></el-form-item>
          <el-form-item label="E-mail"><el-input v-model="form.customerEmail" /></el-form-item>
          <el-form-item label="Opmerking"><el-input v-model="form.notes" type="textarea" /></el-form-item>
        </el-form>
      </div>

      <!-- Step 3: confirmation -->
      <div v-else class="done">
        <el-result icon="success" title="Afspraak bevestigd!" :sub-title="`We hebben je boeking voor ${time(form.startsAt)} ontvangen.`">
          <template #extra>
            <el-button type="primary" @click="reset">Nieuwe afspraak</el-button>
          </template>
        </el-result>
      </div>

      <div class="actions" v-if="step < 3">
        <el-button v-if="step > 0" @click="step--">Terug</el-button>
        <el-button type="primary" :disabled="!canNext" :loading="submitting" @click="next">
          {{ step === 2 ? 'Bevestigen' : 'Volgende' }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { api } from '@/api/client';
import type { Service, Slot } from '@/types';

const route = useRoute();
const services = ref<Service[]>([]);
const slots = ref<Slot[]>([]);
const loadedSlots = ref(false);
const step = ref(0);
const submitting = ref(false);
const date = ref(new Date().toISOString().slice(0, 10));
const form = ref({ serviceId: '', startsAt: '', customerName: '', customerEmail: '', notes: '' });

onMounted(async () => {
  const { data } = await api.get('/services?active=true');
  services.value = data;
  if (route.query.service) selectService(String(route.query.service));
});

const canNext = computed(() => {
  if (step.value === 0) return !!form.value.serviceId;
  if (step.value === 1) return !!form.value.startsAt;
  if (step.value === 2) return !!form.value.customerName && /.+@.+/.test(form.value.customerEmail);
  return true;
});

function selectService(id: string) {
  form.value.serviceId = id;
}

async function loadSlots() {
  loadedSlots.value = false;
  const { data } = await api.get('/availability', { params: { serviceId: form.value.serviceId, date: date.value } });
  slots.value = data.slots;
  loadedSlots.value = true;
}

async function next() {
  if (step.value === 0) {
    step.value = 1;
    await loadSlots();
    return;
  }
  if (step.value === 1) {
    step.value = 2;
    return;
  }
  if (step.value === 2) {
    submitting.value = true;
    try {
      await api.post('/bookings', form.value);
      step.value = 3;
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.message || 'Boeking mislukt');
    } finally {
      submitting.value = false;
    }
  }
}

function reset() {
  step.value = 0;
  form.value = { serviceId: '', startsAt: '', customerName: '', customerEmail: '', notes: '' };
  slots.value = [];
  loadedSlots.value = false;
}

const euro = (c: number) => `€ ${(c / 100).toFixed(2)}`;
const time = (iso: string) => (iso ? new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }) : '');
</script>

<style scoped>
.title { text-align: center; font-size: 2rem; margin-bottom: 24px; }
.svc { cursor: pointer; height: 100%; }
.svc.active { outline: 2px solid var(--app-color-primary); }
.desc { color: var(--el-text-color-secondary); min-height: 36px; }
.price { font-weight: 700; margin-left: 10px; color: var(--app-color-secondary); }
.slots { text-align: center; }
.slot-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 24px; }
.actions { display: flex; justify-content: center; gap: 12px; margin-top: 32px; }
</style>
