<template>
  <div>
    <div class="head">
      <h2>Instellingen</h2>
      <el-button type="primary" :loading="saving" @click="save">Opslaan</el-button>
    </div>

    <el-tabs>
      <!-- Booking rules -->
      <el-tab-pane label="Boekingsregels">
        <el-card>
          <el-form label-width="240px">
            <el-form-item label="Max. dagen vooruit boeken">
              <el-input-number v-model="bookingRules.maxDaysAhead" :min="1" :max="365" />
            </el-form-item>
            <el-form-item label="Minimale aankondiging (minuten)">
              <el-input-number v-model="bookingRules.leadTimeMinutes" :min="0" :step="15" />
              <span class="hint">bv. 120 = niet binnen 2 uur boekbaar</span>
            </el-form-item>
            <el-form-item label="Slot-interval (minuten)">
              <el-input-number v-model="bookingRules.slotIntervalMin" :min="0" :step="5" />
              <span class="hint">0 = automatisch (duur + buffers van de dienst)</span>
            </el-form-item>
            <el-form-item label="Gratis annuleren tot (uren vooraf)">
              <el-input-number v-model="bookingRules.cancellationHours" :min="0" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- Regional -->
      <el-tab-pane label="Regionaal">
        <el-card>
          <el-form label-width="240px">
            <el-form-item label="Valuta">
              <el-select v-model="regional.currency" style="width: 220px">
                <el-option v-for="c in currencies" :key="c.code" :label="`${c.label} (${c.code})`" :value="c.code" />
              </el-select>
              <span class="hint">Voorbeeld: {{ preview }}</span>
            </el-form-item>
            <el-form-item label="Taal / notatie">
              <el-select v-model="regional.locale" style="width: 220px">
                <el-option label="Nederlands (nl-NL)" value="nl-NL" />
                <el-option label="English (en-US)" value="en-US" />
                <el-option label="English UK (en-GB)" value="en-GB" />
                <el-option label="Deutsch (de-DE)" value="de-DE" />
                <el-option label="Français (fr-FR)" value="fr-FR" />
              </el-select>
            </el-form-item>
            <el-form-item label="Tijdzone">
              <el-select v-model="regional.timezone" style="width: 260px" filterable>
                <el-option v-for="tz in timezones" :key="tz" :label="tz" :value="tz" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- Custom form fields -->
      <el-tab-pane label="Formuliervelden">
        <el-card>
          <el-alert type="info" :closable="false" show-icon
            title="Extra velden die klanten invullen bij het boeken (naast naam en e-mail)." style="margin-bottom: 16px" />
          <div v-for="(f, i) in formFields" :key="i" class="field-row">
            <el-input v-model="f.label" placeholder="Label (bv. Telefoon)" style="width: 200px" />
            <el-select v-model="f.type" style="width: 130px">
              <el-option label="Tekst" value="text" />
              <el-option label="Tekstvak" value="textarea" />
              <el-option label="Keuze" value="select" />
              <el-option label="Vinkje" value="checkbox" />
            </el-select>
            <el-input v-if="f.type === 'select'" v-model="f.optionsText" placeholder="opties, komma-gescheiden" style="flex: 1" />
            <el-checkbox v-model="f.required">Verplicht</el-checkbox>
            <el-button :icon="Delete" circle type="danger" plain @click="formFields.splice(i, 1)" />
          </div>
          <el-button :icon="Plus" @click="addField">Veld toevoegen</el-button>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const s = site.settings || {};
const saving = ref(false);

const bookingRules = reactive({ maxDaysAhead: 60, leadTimeMinutes: 120, slotIntervalMin: 0, cancellationHours: 24, ...(s.bookingRules || {}) });
const regional = reactive({ currency: 'EUR', locale: 'nl-NL', timezone: 'Europe/Amsterdam', ...(s.regional || {}) });
const formFields = reactive<any[]>(
  (s.formFields || []).map((f: any) => ({ ...f, optionsText: (f.options || []).join(', ') })),
);

const currencies = [
  { code: 'EUR', label: 'Euro' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'GBP', label: 'Pound' },
  { code: 'CHF', label: 'Swiss Franc' },
  { code: 'SEK', label: 'Swedish Krona' },
];
const timezones = ['Europe/Amsterdam', 'Europe/Brussels', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles'];

const preview = computed(() => {
  try {
    return new Intl.NumberFormat(regional.locale, { style: 'currency', currency: regional.currency }).format(75);
  } catch {
    return '—';
  }
});

function addField() {
  formFields.push({ label: '', type: 'text', required: false, optionsText: '' });
}

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'veld';

async function save() {
  saving.value = true;
  try {
    const fields = formFields
      .filter((f) => f.label.trim())
      .map((f) => ({
        key: f.key || slugify(f.label),
        label: f.label.trim(),
        type: f.type,
        required: !!f.required,
        options: f.type === 'select' ? String(f.optionsText || '').split(',').map((o: string) => o.trim()).filter(Boolean) : undefined,
      }));
    await site.saveSettings({ bookingRules: { ...bookingRules }, regional: { ...regional }, formFields: fields });
    ElMessage.success('Instellingen opgeslagen');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.hint { color: var(--el-text-color-secondary); font-size: 0.85rem; margin-left: 12px; }
.field-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
</style>
