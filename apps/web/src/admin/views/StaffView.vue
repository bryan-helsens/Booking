<template>
  <div>
    <div class="head">
      <h2>Personeel</h2>
      <el-button type="primary" :icon="Plus" @click="openNew">Nieuwe medewerker</el-button>
    </div>

    <el-table :data="staff" stripe>
      <el-table-column label="" width="70">
        <template #default="{ row }">
          <el-avatar :src="row.imageUrl" :size="40">{{ row.name?.[0] }}</el-avatar>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="Naam" />
      <el-table-column prop="title" label="Functie" />
      <el-table-column label="Diensten">
        <template #default="{ row }">{{ (row.services || []).length }}</template>
      </el-table-column>
      <el-table-column label="Actief" width="90">
        <template #default="{ row }"><el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? 'Ja' : 'Nee' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="" width="120">
        <template #default="{ row }">
          <el-button size="small" :icon="Edit" @click="openEdit(row)" />
          <el-button size="small" type="danger" :icon="Delete" @click="remove(row)" />
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!staff.length" description="Nog geen medewerkers — voeg je team toe" />

    <el-dialog v-model="dialog" :title="form.id ? 'Medewerker bewerken' : 'Nieuwe medewerker'" width="min(520px, 94vw)">
      <el-form label-position="top">
        <el-form-item label="Naam"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="Functie"><el-input v-model="form.title" placeholder="bv. Kapper, Therapeut" /></el-form-item>
        <el-form-item label="Foto"><ImageUploader v-model="form.imageUrl" /></el-form-item>
        <el-form-item label="Voert diensten uit">
          <el-select v-model="form.serviceIds" multiple style="width: 100%" placeholder="Kies diensten">
            <el-option v-for="s in services" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
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
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { api } from '@/api/client';
import ImageUploader from '@/components/ImageUploader.vue';

const staff = ref<any[]>([]);
const services = ref<any[]>([]);
const dialog = ref(false);
const saving = ref(false);
const blank = () => ({ id: '', name: '', title: '', imageUrl: '', serviceIds: [] as string[], isActive: true });
const form = ref<any>(blank());

async function load() {
  const [st, sv] = await Promise.all([api.get('/staff'), api.get('/services')]);
  staff.value = st.data;
  services.value = sv.data;
}
onMounted(load);

function openNew() { form.value = blank(); dialog.value = true; }
function openEdit(row: any) {
  form.value = { id: row.id, name: row.name, title: row.title, imageUrl: row.imageUrl, isActive: row.isActive, serviceIds: (row.services || []).map((s: any) => s.id) };
  dialog.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (form.value.id) await api.put(`/staff/${form.value.id}`, form.value);
    else await api.post('/staff', form.value);
    dialog.value = false;
    await load();
    ElMessage.success('Opgeslagen');
  } finally {
    saving.value = false;
  }
}

async function remove(row: any) {
  await ElMessageBox.confirm(`"${row.name}" verwijderen?`, 'Bevestigen', { type: 'warning' });
  await api.delete(`/staff/${row.id}`);
  await load();
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
</style>
