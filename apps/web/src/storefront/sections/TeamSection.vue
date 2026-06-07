<template>
  <section class="sf-section team" v-if="staff.length">
    <div class="sf-container">
      <h2 class="sf-heading">{{ props.block.title || 'Ons team' }}</h2>
      <div class="sf-accent-bar" />
      <el-row :gutter="24" justify="center">
        <el-col v-for="m in staff" :key="m.id" :xs="12" :sm="8" :md="Math.max(4, Math.round(24 / Math.min(staff.length, 4)))">
          <div class="member">
            <el-avatar :src="m.imageUrl" :size="96">{{ m.name?.[0] }}</el-avatar>
            <h4>{{ m.name }}</h4>
            <p>{{ m.title }}</p>
          </div>
        </el-col>
      </el-row>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api/client';

const props = defineProps<{ block: Record<string, any> }>();
const staff = ref<any[]>([]);

onMounted(async () => {
  // Live data: pulls the tenant's active staff from the database.
  const { data } = await api.get('/staff?active=true');
  staff.value = data;
});
</script>

<style scoped>
.member { text-align: center; margin-bottom: 16px; }
.member h4 { margin: 12px 0 2px; }
.member p { color: var(--el-text-color-secondary); margin: 0; }
</style>
