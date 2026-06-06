<template>
  <section class="sf-section">
    <div class="sf-container">
      <h1 class="sf-heading">Maak een afspraak</h1>
      <div class="sf-accent-bar" />
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
            <el-card class="sf-card svc" :class="{ active: form.serviceId === s.id }" shadow="hover" @click="selectService(s.id)" :body-style="{ padding: 0 }">
              <div class="svc-thumb" :style="thumb(s)" />
              <div class="svc-body">
                <h3>{{ s.name }}</h3>
                <p class="desc">{{ s.description }}</p>
                <div class="row"><el-tag round effect="plain">{{ s.durationMin }} min</el-tag><span class="price">{{ euro(s.priceCents) }}</span></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- Step 1: pick date + slot -->
      <div v-else-if="step === 1" class="slots">
        <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" :clearable="false" :disabled-date="past" @change="loadSlots" />
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
      <div v-else-if="step === 2" class="details">
        <el-form label-position="top" class="form">
          <el-form-item label="Naam"><el-input v-model="form.customerName" /></el-form-item>
          <el-form-item label="E-mail"><el-input v-model="form.customerEmail" /></el-form-item>
          <el-form-item label="Opmerking"><el-input v-model="form.notes" type="textarea" /></el-form-item>
          <!-- Tenant-defined custom fields -->
          <el-form-item v-for="f in formFields" :key="f.key" :label="f.label + (f.required ? ' *' : '')">
            <el-input v-if="f.type === 'text'" v-model="customAnswers[f.key]" />
            <el-input v-else-if="f.type === 'textarea'" v-model="customAnswers[f.key]" type="textarea" />
            <el-select v-else-if="f.type === 'select'" v-model="customAnswers[f.key]" style="width: 100%">
              <el-option v-for="o in f.options || []" :key="o" :label="o" :value="o" />
            </el-select>
            <el-checkbox v-else-if="f.type === 'checkbox'" v-model="customAnswers[f.key]">Ja</el-checkbox>
          </el-form-item>
          <el-form-item v-if="couponsEnabled" label="Kortingscode">
            <el-input v-model="couponCode" placeholder="bijv. WELKOM10">
              <template #append><el-button @click="applyCoupon">Toepassen</el-button></template>
            </el-input>
          </el-form-item>
        </el-form>

        <el-card class="summary sf-card">
          <h4>Samenvatting</h4>
          <div class="line"><span>{{ selectedService?.name }}</span><span>{{ euro(selectedService?.priceCents || 0) }}</span></div>
          <div class="line muted"><span>{{ time(form.startsAt) }}</span><span>{{ selectedService?.durationMin }} min</span></div>
          <div class="line discount" v-if="discount > 0"><span>Korting ({{ couponPct }}%)</span><span>- {{ euro(discount) }}</span></div>
          <el-divider />
          <div class="line total"><span>Totaal</span><span>{{ euro(total) }}</span></div>
        </el-card>
      </div>

      <!-- Step 3: confirmation -->
      <div v-else class="done">
        <el-result icon="success" title="Afspraak bevestigd!" :sub-title="`Bedankt ${form.customerName}, we verwachten je op ${time(form.startsAt)}.`">
          <template #extra><el-button type="primary" @click="reset">Nieuwe afspraak</el-button></template>
        </el-result>

        <el-card v-if="emailEnabled" class="email sf-card">
          <div class="email-head"><el-icon><Message /></el-icon> Bevestigingsmail verzonden naar {{ form.customerEmail }}</div>
          <div class="email-body">
            <strong>{{ site.content?.companyName }}</strong>
            <p>Hoi {{ form.customerName }},</p>
            <p>Je afspraak voor <b>{{ selectedService?.name }}</b> is bevestigd op <b>{{ time(form.startsAt) }}</b>.</p>
            <p v-if="discount > 0">Toegepaste korting: {{ couponPct }}% — totaal {{ euro(total) }}.</p>
            <p class="muted">Tot snel!</p>
          </div>
        </el-card>
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
import { useSiteStore } from '@/stores/site';
import type { Service, Slot } from '@/types';

const route = useRoute();
const site = useSiteStore();
const services = ref<Service[]>([]);
const slots = ref<Slot[]>([]);
const loadedSlots = ref(false);
const step = ref(0);
const submitting = ref(false);
const date = ref(new Date().toISOString().slice(0, 10));
const form = ref({ serviceId: '', startsAt: '', customerName: '', customerEmail: '', notes: '' });
const couponCode = ref('');
const couponPct = ref(0);
const customAnswers = ref<Record<string, any>>({});

const couponsEnabled = computed(() => site.isEnabled('coupons'));
const emailEnabled = computed(() => site.isEnabled('email'));
const formFields = computed<any[]>(() => site.settings?.formFields || []);
const maxDaysAhead = computed(() => Number(site.settings?.bookingRules?.maxDaysAhead) || 60);

onMounted(async () => {
  const { data } = await api.get('/services?active=true');
  services.value = data;
  if (route.query.service) selectService(String(route.query.service));
});

const selectedService = computed(() => services.value.find((s) => s.id === form.value.serviceId) || null);
const discount = computed(() => Math.round(((selectedService.value?.priceCents || 0) * couponPct.value) / 100));
const total = computed(() => (selectedService.value?.priceCents || 0) - discount.value);

const canNext = computed(() => {
  if (step.value === 0) return !!form.value.serviceId;
  if (step.value === 1) return !!form.value.startsAt;
  if (step.value === 2) {
    const baseOk = !!form.value.customerName && /.+@.+/.test(form.value.customerEmail);
    const customOk = formFields.value.every((f) => !f.required || !!customAnswers.value[f.key]);
    return baseOk && customOk;
  }
  return true;
});

function selectService(id: string) {
  form.value.serviceId = id;
}

async function applyCoupon() {
  const { data } = await api.get('/coupons/validate', { params: { code: couponCode.value } });
  if (data.valid) {
    couponPct.value = data.percentOff;
    ElMessage.success(`Code toegepast: ${data.percentOff}% korting`);
  } else {
    couponPct.value = 0;
    ElMessage.warning('Ongeldige of verlopen code');
  }
}

async function loadSlots() {
  loadedSlots.value = false;
  const { data } = await api.get('/availability', { params: { serviceId: form.value.serviceId, date: date.value } });
  slots.value = data.slots;
  loadedSlots.value = true;
}

async function next() {
  if (step.value === 0) { step.value = 1; await loadSlots(); return; }
  if (step.value === 1) { step.value = 2; return; }
  if (step.value === 2) {
    submitting.value = true;
    try {
      // Fold custom field answers into the booking notes.
      const extra = formFields.value
        .map((f) => (customAnswers.value[f.key] != null && customAnswers.value[f.key] !== '' ? `${f.label}: ${customAnswers.value[f.key]}` : ''))
        .filter(Boolean)
        .join('\n');
      const notes = [form.value.notes, extra].filter(Boolean).join('\n');
      await api.post('/bookings', { ...form.value, notes });
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
  couponCode.value = '';
  couponPct.value = 0;
}

const euro = (c: number) => site.formatMoney(c);
const time = (iso: string) => (iso ? new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }) : '');
// Disable past dates and dates beyond the tenant's "max days ahead" rule.
const past = (d: Date) => {
  const max = new Date();
  max.setHours(0, 0, 0, 0);
  max.setDate(max.getDate() + maxDaysAhead.value);
  return d.getTime() < Date.now() - 86400000 || d.getTime() > max.getTime();
};
function thumb(s: Service) {
  return s.imageUrl ? { backgroundImage: `url(${s.imageUrl})` } : { background: 'linear-gradient(135deg, var(--app-color-primary), var(--app-color-accent))' };
}
</script>

<style scoped>
.svc { cursor: pointer; height: 100%; transition: transform 0.2s; }
.svc:hover { transform: translateY(-4px); }
.svc.active { outline: 2px solid var(--app-color-primary); }
.svc-thumb { height: 130px; background-size: cover; background-position: center; }
.svc-body { padding: 16px; }
.svc-body .row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.desc { color: var(--el-text-color-secondary); min-height: 36px; }
.price { font-weight: 700; color: var(--app-color-secondary); }
.slots { text-align: center; }
.slot-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 24px; }
.details { display: flex; gap: 24px; flex-wrap: wrap; }
.form { flex: 1; min-width: 300px; }
.summary { width: 320px; height: fit-content; }
.summary h4 { margin: 0 0 14px; }
.line { display: flex; justify-content: space-between; margin: 8px 0; }
.line.muted { color: var(--el-text-color-secondary); font-size: 0.9rem; }
.line.discount { color: var(--el-color-success); }
.line.total { font-weight: 700; font-size: 1.15rem; }
.actions { display: flex; justify-content: center; gap: 12px; margin-top: 32px; }
.done { max-width: 600px; margin: 0 auto; }
.email { margin-top: 8px; }
.email-head { display: flex; align-items: center; gap: 8px; font-weight: 600; padding-bottom: 12px; border-bottom: 1px solid var(--el-border-color-lighter); margin-bottom: 12px; }
.email-body p { margin: 6px 0; }
.email-body .muted { color: var(--el-text-color-secondary); }
</style>
