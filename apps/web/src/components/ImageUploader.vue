<template>
  <div class="uploader">
    <div class="preview" v-if="modelValue">
      <el-image :src="modelValue" fit="cover" />
      <el-button class="rm" circle size="small" :icon="Close" @click="emit('update:modelValue', '')" />
    </div>
    <div class="controls">
      <el-upload :show-file-list="false" :http-request="doUpload" accept="image/*">
        <el-button :icon="UploadFilled" :loading="loading">{{ modelValue ? 'Vervangen' : 'Upload' }}</el-button>
      </el-upload>
      <el-input v-model="urlInput" placeholder="of plak een afbeeldings-URL" @change="onUrl" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled, Close } from '@element-plus/icons-vue';
import { api } from '@/api/client';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const loading = ref(false);
const urlInput = ref(props.modelValue || '');
watch(() => props.modelValue, (v) => (urlInput.value = v || ''));

async function doUpload(opt: any) {
  loading.value = true;
  try {
    const fd = new FormData();
    fd.append('file', opt.file);
    const { data } = await api.post('/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    emit('update:modelValue', data.url);
    ElMessage.success('Afbeelding geüpload');
  } catch {
    ElMessage.error('Upload mislukt');
  } finally {
    loading.value = false;
  }
}

function onUrl() {
  emit('update:modelValue', urlInput.value.trim());
}
</script>

<style scoped>
.uploader { display: flex; gap: 14px; align-items: flex-start; }
.preview { position: relative; width: 96px; height: 96px; border-radius: var(--app-radius); overflow: hidden; flex-shrink: 0; }
.preview .el-image { width: 100%; height: 100%; }
.preview .rm { position: absolute; top: 4px; right: 4px; }
.controls { display: flex; flex-direction: column; gap: 8px; flex: 1; }
</style>
