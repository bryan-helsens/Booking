<template>
  <section class="sf-section contact">
    <div class="sf-container">
      <h2 class="title">{{ props.block.title || 'Contact' }}</h2>
      <el-row :gutter="24" v-if="content">
        <el-col :xs="24" :md="8">
          <el-icon><Location /></el-icon>
          <p>{{ content.contact.address }}</p>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-icon><Phone /></el-icon>
          <p>{{ content.contact.phone }}</p>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-icon><Message /></el-icon>
          <p>{{ content.contact.email }}</p>
        </el-col>
      </el-row>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSiteStore } from '@/stores/site';

const props = defineProps<{ block: Record<string, any> }>();
const site = useSiteStore();
const content = computed(() => site.content);
</script>

<style scoped>
.contact { background: var(--el-fill-color-light); text-align: center; }
.title { font-size: 2rem; margin-bottom: 36px; }
.el-icon { font-size: 28px; color: var(--app-color-primary); }
</style>
