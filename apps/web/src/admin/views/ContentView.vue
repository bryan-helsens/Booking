<template>
  <div v-if="model">
    <div class="head">
      <h2>Content & SEO</h2>
      <el-button type="primary" :loading="saving" @click="save">Opslaan</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :md="12">
        <el-card header="Bedrijfsgegevens">
          <el-form label-position="top">
            <el-form-item label="Bedrijfsnaam"><el-input v-model="model.companyName" /></el-form-item>
            <el-form-item label="Beschrijving"><el-input v-model="model.description" type="textarea" :rows="3" /></el-form-item>
            <el-form-item label="E-mail"><el-input v-model="model.contact.email" /></el-form-item>
            <el-form-item label="Telefoon"><el-input v-model="model.contact.phone" /></el-form-item>
            <el-form-item label="Adres"><el-input v-model="model.contact.address" /></el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :md="12">
        <el-card header="SEO">
          <el-form label-position="top">
            <el-form-item label="SEO titel"><el-input v-model="model.seo.title" /></el-form-item>
            <el-form-item label="Meta beschrijving"><el-input v-model="model.seo.description" type="textarea" :rows="2" /></el-form-item>
            <el-form-item label="Keywords"><el-input v-model="model.seo.keywords" /></el-form-item>
          </el-form>
        </el-card>

        <el-card header="Social media" style="margin-top: 16px">
          <el-form label-position="top">
            <el-form-item label="Facebook"><el-input v-model="model.social.facebook" /></el-form-item>
            <el-form-item label="Instagram"><el-input v-model="model.social.instagram" /></el-form-item>
            <el-form-item label="X / Twitter"><el-input v-model="model.social.x" /></el-form-item>
            <el-form-item label="LinkedIn"><el-input v-model="model.social.linkedin" /></el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useSiteStore } from '@/stores/site';
import type { SiteContent } from '@/types';

const site = useSiteStore();
const model = ref<SiteContent | null>(site.content ? JSON.parse(JSON.stringify(site.content)) : null);
const saving = ref(false);

async function save() {
  if (!model.value) return;
  saving.value = true;
  try {
    await site.saveContent(model.value);
    ElMessage.success('Content opgeslagen');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
</style>
