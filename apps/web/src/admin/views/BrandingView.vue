<template>
  <div>
    <div class="head">
      <h2>Branding & Thema</h2>
      <div>
        <el-button @click="restore">Herstel</el-button>
        <el-button type="primary" :loading="saving" @click="save">Opslaan & publiceren</el-button>
      </div>
    </div>
    <el-alert type="info" :closable="false" show-icon
      title="Wijzigingen zijn meteen zichtbaar als live preview. Klik op opslaan om ze te publiceren." />

    <el-row :gutter="20" style="margin-top: 16px">
      <el-col :md="12">
        <el-card header="Kleuren">
          <el-form label-width="140px">
            <el-form-item label="Primair"><el-color-picker v-model="tokens.colorPrimary" @change="preview" /></el-form-item>
            <el-form-item label="Secundair"><el-color-picker v-model="tokens.colorSecondary" @change="preview" /></el-form-item>
            <el-form-item label="Accent"><el-color-picker v-model="tokens.colorAccent" @change="preview" /></el-form-item>
            <el-form-item label="Achtergrond"><el-color-picker v-model="tokens.colorBg" @change="preview" /></el-form-item>
            <el-form-item label="Tekst"><el-color-picker v-model="tokens.colorText" @change="preview" /></el-form-item>
          </el-form>
        </el-card>

        <el-card header="Modus" style="margin-top: 16px">
          <el-segmented v-model="mode" :options="modeOptions" @change="preview" />
        </el-card>
      </el-col>

      <el-col :md="12">
        <el-card header="Typografie & vorm">
          <el-form label-width="140px">
            <el-form-item label="Lettertype tekst">
              <el-select v-model="tokens.fontBody" @change="preview">
                <el-option v-for="f in fonts" :key="f.value" :label="f.label" :value="f.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Lettertype kop">
              <el-select v-model="tokens.fontHeading" @change="preview">
                <el-option v-for="f in fonts" :key="f.value" :label="f.label" :value="f.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Border radius">
              <el-slider v-model="tokens.radius" :min="0" :max="32" show-input @input="preview" />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card header="Logo & favicon" style="margin-top: 16px">
          <el-form label-width="140px">
            <el-form-item label="Logo URL"><el-input v-model="logoUrl" placeholder="https://..." /></el-form-item>
            <el-form-item label="Favicon URL"><el-input v-model="faviconUrl" placeholder="https://..." /></el-form-item>
            <el-form-item><img v-if="logoUrl" :src="logoUrl" style="height: 48px; border-radius: 8px" /></el-form-item>
          </el-form>
          <p class="note">Upload: in productie via /media endpoint (S3). Voor de demo plak je een URL.</p>
        </el-card>
      </el-col>
    </el-row>

    <el-card header="Voorbeeld" style="margin-top: 16px">
      <div class="prev">
        <el-button type="primary">Primaire knop</el-button>
        <el-button color="var(--app-color-secondary)">Secundair</el-button>
        <el-tag :style="{ background: tokens.colorAccent, color: '#fff', border: 'none' }">Accent</el-tag>
        <el-card class="sf-card" style="width: 220px" shadow="hover">
          <h3 :style="{ fontFamily: tokens.fontHeading }">Voorbeeldkaart</h3>
          <p>Dit is hoe content eruitziet.</p>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const tokens = reactive({ ...(site.theme?.tokens as any) });
const mode = ref<'light' | 'dark'>(site.theme?.mode || 'light');
const logoUrl = ref(site.content?.logoUrl || '');
const faviconUrl = ref(site.content?.faviconUrl || '');
const saving = ref(false);

const modeOptions = [
  { label: 'Licht', value: 'light' },
  { label: 'Donker', value: 'dark' },
];
const fonts = [
  { label: 'Inter', value: "'Inter', system-ui, sans-serif" },
  { label: 'Poppins', value: "'Poppins', system-ui, sans-serif" },
  { label: 'Roboto', value: "'Roboto', system-ui, sans-serif" },
  { label: 'Oswald', value: "'Oswald', system-ui, sans-serif" },
  { label: 'Systeem', value: 'system-ui, sans-serif' },
];

function preview() {
  site.previewTokens({ ...tokens }, mode.value);
}

function restore() {
  site.restoreTheme();
  Object.assign(tokens, site.theme?.tokens);
  mode.value = site.theme?.mode || 'light';
}

async function save() {
  saving.value = true;
  try {
    await site.saveTheme({ ...tokens }, mode.value);
    if (site.content) {
      await site.saveContent({ ...site.content, logoUrl: logoUrl.value, faviconUrl: faviconUrl.value });
    }
    ElMessage.success('Thema opgeslagen');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; }
.note { color: var(--el-text-color-secondary); font-size: 0.85rem; }
.prev { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
</style>
