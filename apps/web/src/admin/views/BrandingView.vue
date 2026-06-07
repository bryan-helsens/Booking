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

    <el-alert v-if="contrastWarnings.length" type="warning" :closable="false" show-icon style="margin-top: 10px"
      title="Let op: kleurcontrast">
      <ul style="margin: 0; padding-left: 18px">
        <li v-for="w in contrastWarnings" :key="w">{{ w }}</li>
      </ul>
    </el-alert>

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
          <el-radio-group v-model="mode" @change="preview">
            <el-radio-button label="light">☀️ Licht</el-radio-button>
            <el-radio-button label="dark">🌙 Donker</el-radio-button>
          </el-radio-group>
        </el-card>
      </el-col>

      <el-col :md="12">
        <el-card header="Typografie & vorm">
          <el-form label-width="140px">
            <el-form-item label="Lettertype tekst">
              <el-select v-model="tokens.fontBody" @change="preview" style="width: 100%">
                <el-option v-for="f in fonts" :key="f.value" :label="f.label" :value="f.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Lettertype kop">
              <el-select v-model="tokens.fontHeading" @change="preview" style="width: 100%">
                <el-option v-for="f in fonts" :key="f.value" :label="f.label" :value="f.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Border radius">
              <el-slider v-model="tokens.radius" :min="0" :max="32" show-input @input="preview" />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card header="Logo & favicon" style="margin-top: 16px">
          <el-form label-position="top">
            <el-form-item label="Logo"><ImageUploader v-model="logoUrl" /></el-form-item>
            <el-form-item label="Favicon"><ImageUploader v-model="faviconUrl" /></el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-card header="Geavanceerd" style="margin-top: 16px">
      <el-row :gutter="20">
        <el-col :md="12">
          <el-form label-width="160px">
            <el-form-item label="Knopvorm">
              <el-radio-group v-model="tokens.buttonStyle" @change="preview">
                <el-radio-button value="round">Rond</el-radio-button>
                <el-radio-button value="square">Hoekig</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="Hero overlay">
              <el-slider v-model="tokens.heroOverlay" :min="0" :max="0.8" :step="0.05" @input="preview" />
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :md="12">
          <el-form label-position="top">
            <el-form-item label="Site-achtergrondafbeelding (optioneel)">
              <ImageUploader v-model="tokens.backgroundImage" @update:modelValue="preview" />
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
      <el-form label-position="top">
        <el-form-item label="Eigen CSS (geavanceerd)">
          <el-input v-model="tokens.customCss" type="textarea" :rows="4" placeholder=".sf-section { ... }" @input="preview" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card header="Voorbeeld" style="margin-top: 16px">
      <div class="prev">
        <el-button type="primary">Primaire knop</el-button>
        <el-button :color="tokens.colorSecondary">Secundair</el-button>
        <el-tag :style="{ background: tokens.colorAccent, color: '#fff', border: 'none' }">Accent</el-tag>
        <el-card class="sf-card" style="width: 240px" shadow="hover">
          <h3 :style="{ fontFamily: tokens.fontHeading }">Voorbeeldkaart</h3>
          <p :style="{ fontFamily: tokens.fontBody }">Zo ziet je content eruit met dit lettertype.</p>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useSiteStore } from '@/stores/site';
import { FONT_OPTIONS } from '@/theme/fonts';
import ImageUploader from '@/components/ImageUploader.vue';

const site = useSiteStore();
const tokens = reactive<any>({
  buttonStyle: 'round',
  heroOverlay: 0.45,
  backgroundImage: '',
  customCss: '',
  ...(site.theme?.tokens as any),
});
const mode = ref<'light' | 'dark'>(site.theme?.mode || 'light');
const logoUrl = ref(site.content?.logoUrl || '');
const faviconUrl = ref(site.content?.faviconUrl || '');
const saving = ref(false);
const fonts = FONT_OPTIONS;

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

// ── WCAG contrast check ──
function luminance(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return 1;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
const contrastWarnings = computed(() => {
  const w: string[] = [];
  if (ratio(tokens.colorText, tokens.colorBg) < 4.5)
    w.push('Tekst op achtergrond heeft te weinig contrast (< 4.5:1) — slecht leesbaar.');
  if (ratio(tokens.colorPrimary, '#ffffff') < 3)
    w.push('Primaire kleur met witte tekst heeft laag contrast — knoppen lastig leesbaar.');
  return w;
});
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; }
.prev { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
</style>
