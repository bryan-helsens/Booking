<template>
  <div class="menu-wrap">
    <div class="logo">
      <el-icon size="22"><Calendar /></el-icon>
      <span>Booking Admin</span>
    </div>
    <el-menu :default-active="route.name as string" router class="menu" @select="$emit('navigate')">
      <el-menu-item index="dashboard" :route="{ name: 'dashboard' }"><el-icon><Odometer /></el-icon>Dashboard</el-menu-item>
      <el-menu-item-group title="Vormgeving">
        <el-menu-item index="branding" :route="{ name: 'branding' }"><el-icon><Brush /></el-icon>Branding & Thema</el-menu-item>
        <el-menu-item index="builder" :route="{ name: 'builder' }"><el-icon><Grid /></el-icon>Page Builder</el-menu-item>
        <el-menu-item index="content" :route="{ name: 'content' }"><el-icon><Document /></el-icon>Content & SEO</el-menu-item>
      </el-menu-item-group>
      <el-menu-item-group title="Boekingen">
        <el-menu-item index="services" :route="{ name: 'services' }"><el-icon><List /></el-icon>Diensten</el-menu-item>
        <el-menu-item index="hours" :route="{ name: 'hours' }"><el-icon><Clock /></el-icon>Openingstijden</el-menu-item>
        <el-menu-item index="bookings" :route="{ name: 'bookings' }"><el-icon><Tickets /></el-icon>Reserveringen</el-menu-item>
      </el-menu-item-group>
      <el-menu-item index="features" :route="{ name: 'features' }"><el-icon><Switch /></el-icon>Features</el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
defineEmits<{ (e: 'navigate'): void }>();
const route = useRoute();
</script>

<style scoped>
.menu-wrap { height: 100%; background: var(--el-bg-color); }
.logo { display: flex; align-items: center; gap: 8px; font-weight: 700; padding: 18px 20px; font-size: 1.05rem; }
.menu { border-right: none; }
</style>
