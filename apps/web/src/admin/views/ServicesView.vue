<template>
  <div>
    <div class="head">
      <div class="title">
        <h2>Diensten</h2>
        <el-tag v-if="limit" :type="atLimit ? 'danger' : 'info'" round>{{ services.length }} / {{ limit }}</el-tag>
      </div>
      <el-tooltip :disabled="!atLimit" content="Limiet bereikt — upgrade je abonnement">
        <span>
          <el-button type="primary" :icon="Plus" :disabled="atLimit" @click="openNew">Nieuwe dienst</el-button>
        </span>
      </el-tooltip>
    </div>
    <el-alert v-if="atLimit" type="warning" :closable="false" show-icon style="margin-bottom: 12px"
      title="Je hebt het maximum aantal diensten voor je abonnement bereikt.">
      <el-button size="small" type="primary" text @click="$router.push({ name: 'billing' })">Upgrade om meer toe te voegen →</el-button>
    </el-alert>

    <el-table :data="services" stripe>
      <el-table-column label="" width="70">
        <template #default="{ row }">
          <el-avatar v-if="row.imageUrl" :src="row.imageUrl" shape="square" :size="40" />
          <el-avatar v-else shape="square" :size="40"><el-icon><Star /></el-icon></el-avatar>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="Naam" />
      <el-table-column label="Duur" width="100"><template #default="{ row }">{{ row.durationMin }} min</template></el-table-column>
      <el-table-column label="Prijs" width="100"><template #default="{ row }">{{ euro(row.priceCents) }}</template></el-table-column>
      <el-table-column prop="capacity" label="Cap." width="80" />
      <el-table-column label="Geboekt" width="100"><template #default="{ row }">{{ stats[row.id]?.count || 0 }}</template></el-table-column>
      <el-table-column label="Omzet" width="110"><template #default="{ row }">{{ euro(stats[row.id]?.revenueCents || 0) }}</template></el-table-column>
      <el-table-column label="Actief" width="90"><template #default="{ row }"><el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? 'Ja' : 'Nee' }}</el-tag></template></el-table-column>
      <el-table-column label="" width="120">
        <template #default="{ row }">
          <el-button size="small" :icon="Edit" @click="openEdit(row)" />
          <el-button size="small" type="danger" :icon="Delete" @click="remove(row)" />
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" :title="form.id ? 'Dienst bewerken' : 'Nieuwe dienst'" width="min(520px, 94vw)">
      <el-form label-position="top">
        <el-form-item label="Naam"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="Beschrijving"><el-input v-model="form.description" type="textarea" /></el-form-item>
        <el-form-item label="Afbeelding"><ImageUploader v-model="form.imageUrl" /></el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="Duur (min)"><el-input-number v-model="form.durationMin" :min="5" :step="5" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Prijs (€)"><el-input-number v-model="priceEuro" :min="0" :step="0.5" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="Capaciteit"><el-input-number v-model="form.capacity" :min="1" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="Buffer voor"><el-input-number v-model="form.bufferBefore" :min="0" :step="5" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="Buffer na"><el-input-number v-model="form.bufferAfter" :min="0" :step="5" /></el-form-item></el-col>
        </el-row>
        <el-form-item><el-switch v-model="form.isActive" active-text="Actief" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">Annuleren</el-button>
        <el-button type="primary" :loading="saving" @click="save">Opslaan</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { api } from '@/api/client';
import { useSiteStore } from '@/stores/site';
import ImageUploader from '@/components/ImageUploader.vue';
import type { Service } from '@/types';

const site = useSiteStore();

const services = ref<Service[]>([]);
const stats = ref<Record<string, { count: number; revenueCents: number }>>({});
const limit = ref(0);
const atLimit = computed(() => limit.value > 0 && services.value.length >= limit.value);
const dialog = ref(false);
const saving = ref(false);
const blank = () => ({ id: '', name: '', description: '', imageUrl: '', durationMin: 60, priceCents: 0, capacity: 1, bufferBefore: 0, bufferAfter: 0, isActive: true });
const form = ref<any>(blank());

const priceEuro = computed({
  get: () => form.value.priceCents / 100,
  set: (v: number) => (form.value.priceCents = Math.round(v * 100)),
});

async function load() {
  const [sv, an, bl] = await Promise.all([api.get('/services'), api.get('/analytics'), api.get('/billing')]);
  services.value = sv.data;
  stats.value = Object.fromEntries((an.data.perService || []).map((s: any) => [s.id, { count: s.count, revenueCents: s.revenueCents }]));
  const plan = bl.data.plans.find((p: any) => p.id === bl.data.plan);
  limit.value = plan?.limits?.services || 0;
}
onMounted(load);

function openNew() { form.value = blank(); dialog.value = true; }
function openEdit(row: Service) { form.value = { ...row }; dialog.value = true; }

async function save() {
  saving.value = true;
  try {
    if (form.value.id) await api.put(`/services/${form.value.id}`, form.value);
    else await api.post('/services', form.value);
    dialog.value = false;
    await load();
    ElMessage.success('Opgeslagen');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || 'Opslaan mislukt');
  } finally {
    saving.value = false;
  }
}

async function remove(row: Service) {
  await ElMessageBox.confirm(`"${row.name}" verwijderen?`, 'Bevestigen', { type: 'warning' });
  await api.delete(`/services/${row.id}`);
  await load();
}

const euro = (c: number) => site.formatMoney(c);
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.title { display: flex; align-items: center; gap: 12px; }
</style>
