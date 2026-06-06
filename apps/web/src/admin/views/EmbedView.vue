<template>
  <div>
    <h2>Insluiten & delen</h2>
    <el-alert type="info" :closable="false" show-icon
      title="Plaats je boekingswidget op een bestaande website, of deel een directe boekingslink." style="margin-bottom: 16px" />

    <el-row :gutter="20">
      <el-col :md="14">
        <el-card header="Insluitcode (iframe)">
          <p class="lbl">Plak deze code op je eigen website waar de widget moet verschijnen:</p>
          <el-input type="textarea" :rows="4" :model-value="iframeCode" readonly />
          <el-button class="mt" :icon="CopyDocument" @click="copy(iframeCode)">Kopieer insluitcode</el-button>
        </el-card>

        <el-card header="Directe boekingslink" style="margin-top: 16px">
          <p class="lbl">Deel deze link via e-mail, social media of een knop:</p>
          <el-input :model-value="directLink" readonly>
            <template #append><el-button :icon="CopyDocument" @click="copy(directLink)">Kopieer</el-button></template>
          </el-input>
          <p class="lbl mt">Of een knop op je site:</p>
          <el-input :model-value="buttonCode" readonly />
          <el-button class="mt" :icon="CopyDocument" @click="copy(buttonCode)">Kopieer knopcode</el-button>
        </el-card>
      </el-col>

      <el-col :md="10">
        <el-card header="Live preview" body-style="padding:0">
          <iframe :src="embedSrc" class="preview" title="preview" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { CopyDocument } from '@element-plus/icons-vue';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const origin = window.location.origin;
const slug = computed(() => site.currentTenant());

const embedSrc = computed(() => `${origin}/embed?tenant=${slug.value}`);
const directLink = computed(() => `${origin}/embed?tenant=${slug.value}`);
const iframeCode = computed(
  () => `<iframe src="${embedSrc.value}" width="100%" height="760" style="border:0;border-radius:12px" title="Boek een afspraak"></iframe>`,
);
const buttonCode = computed(
  () => `<a href="${directLink.value}" target="_blank" style="background:${site.theme?.tokens?.colorPrimary || '#0ea5a4'};color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-family:sans-serif">Boek een afspraak</a>`,
);

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('Gekopieerd naar klembord');
  } catch {
    ElMessage.warning('Kopiëren niet mogelijk — selecteer en kopieer handmatig');
  }
}
</script>

<style scoped>
.lbl { color: var(--el-text-color-secondary); margin: 0 0 8px; }
.mt { margin-top: 10px; }
.preview { width: 100%; height: 620px; border: 0; display: block; }
</style>
