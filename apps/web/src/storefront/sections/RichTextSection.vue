<template>
  <section class="sf-section richtext">
    <div class="sf-container">
      <h2>{{ props.heading }}</h2>
      <p class="body">{{ props.body }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ props: Record<string, any> }>();
</script>

<style scoped>
.richtext { text-align: center; }
.body { max-width: 720px; margin: 16px auto 0; font-size: 1.1rem; line-height: 1.7; color: var(--el-text-color-secondary); }
</style>
