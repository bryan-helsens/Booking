<template>
  <section class="sf-section">
    <div class="sf-container">
      <h2 class="sf-heading">{{ props.block.title || 'Onze diensten' }}</h2>
      <div class="sf-accent-bar" />
      <el-row :gutter="24">
        <el-col
          v-for="s in services"
          :key="s.id"
          :xs="24"
          :sm="12"
          :md="Math.round(24 / (props.block.columns || 3))"
        >
          <el-card class="sf-card service-card" shadow="hover" :body-style="{ padding: '0' }">
            <div class="thumb" :style="thumb(s)">
              <span v-if="!s.imageUrl" class="thumb-icon"><el-icon :size="40"><Star /></el-icon></span>
            </div>
            <div class="body">
              <h3>{{ s.name }}</h3>
              <p class="desc">{{ s.description }}</p>
              <div class="meta">
                <el-tag round effect="plain"><el-icon><Clock /></el-icon> {{ s.durationMin }} min</el-tag>
                <span class="price">vanaf {{ euro(s.priceCents) }}</span>
              </div>
              <el-button type="primary" round class="cta" @click="book(s.id)">Boek deze dienst</el-button>
            </div>
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
import { useSiteStore } from '@/stores/site';
import type { Service } from '@/types';

const props = defineProps<{ block: Record<string, any> }>();
const router = useRouter();
const site = useSiteStore();
const services = ref<Service[]>([]);

onMounted(async () => {
  const { data } = await api.get('/services?active=true');
  services.value = data;
});

const euro = (c: number) => site.formatMoney(c);
function book(serviceId: string) {
  router.push({ name: 'booking', query: { service: serviceId } });
}
function thumb(s: Service) {
  return s.imageUrl
    ? { backgroundImage: `url(${s.imageUrl})` }
    : { background: 'linear-gradient(135deg, var(--app-color-primary), var(--app-color-accent))' };
}
</script>

<style scoped>
.service-card { height: 100%; transition: transform 0.25s ease, box-shadow 0.25s ease; }
.service-card:hover { transform: translateY(-6px); }
.thumb { height: 170px; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.85); }
.body { padding: 20px; }
.body h3 { margin: 0 0 6px; }
.desc { color: var(--el-text-color-secondary); min-height: 42px; margin: 0 0 14px; }
.meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.meta .el-tag { display: inline-flex; align-items: center; gap: 4px; }
.price { font-weight: 700; color: var(--app-color-secondary); }
.cta { width: 100%; }
</style>
