<template>
  <section class="sf-section btn-sec" :style="{ textAlign: props.block.align || 'center' }">
    <div class="sf-container">
      <el-button
        :type="props.block.variant === 'outline' ? 'default' : 'primary'"
        :plain="props.block.variant === 'outline'"
        size="large"
        round
        @click="go"
      >{{ props.block.label || 'Knop' }}</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const props = defineProps<{ block: Record<string, any> }>();
const router = useRouter();
function go() {
  const link = String(props.block.link || '/booking');
  if (/^https?:\/\//.test(link)) window.open(link, '_blank');
  else router.push(link);
}
</script>

<style scoped>
.btn-sec { padding-top: 28px; padding-bottom: 28px; }
</style>
