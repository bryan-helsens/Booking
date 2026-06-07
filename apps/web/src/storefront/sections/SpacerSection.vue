<template>
  <div :style="{ height: (props.block.height || 40) + 'px' }" />
</template>

<script setup lang="ts">
const props = defineProps<{ block: Record<string, any> }>();
</script>
