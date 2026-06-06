<template>
  <section class="sf-section">
    <div class="sf-container">
      <h2 class="title">{{ props.title || 'Onze diensten' }}</h2>
      <el-row :gutter="20">
        <el-col
          v-for="s in services"
          :key="s.id"
          :xs="24"
          :sm="12"
          :md="Math.round(24 / (props.columns || 3))"
        >
          <el-card class="sf-card service-card" shadow="hover">
            <h3>{{ s.name }}</h3>
            <p class="desc">{{ s.description }}</p>
            <div class="meta">
              <el-tag round>{{ s.durationMin }} min</el-tag>
              <span class="price">{{ euro(s.priceCents) }}</span>
            </div>
            <el-button type="primary" plain round @click="book(s.id)">Boeken</el-button>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api/client';
import type { Service } from '@/types';

defineProps<{ props: Record<string, any> }>();
const router = useRouter();
const services = ref<Service[]>([]);

onMounted(async () => {
  const { data } = await api.get('/services?active=true');
  services.value = data;
});

const euro = (c: number) => `€ ${(c / 100).toFixed(2)}`;
function book(serviceId: string) {
  router.push({ name: 'booking', query: { service: serviceId } });
}
</script>

<style scoped>
.title { text-align: center; font-size: 2rem; margin-bottom: 36px; }
.service-card { height: 100%; }
.desc { color: var(--el-text-color-secondary); min-height: 40px; }
.meta { display: flex; align-items: center; gap: 12px; margin: 12px 0; }
.price { font-weight: 700; color: var(--app-color-secondary); }
</style>
