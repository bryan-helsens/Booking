<template>
  <div class="nf">
    <el-result icon="warning" title="404" sub-title="Deze pagina bestaat niet (meer).">
      <template #extra>
        <el-button type="primary" round @click="$router.push('/')">Terug naar home</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.nf { min-height: 70vh; display: flex; align-items: center; justify-content: center; }
</style>
