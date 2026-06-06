<template>
  <div class="builder">
    <div class="head">
      <h2>Page Builder <el-tag v-if="builder.dirty" type="warning" size="small">niet opgeslagen</el-tag></h2>
      <div>
        <el-button @click="builder.saveDraft()" :icon="DocumentAdd">Concept opslaan</el-button>
        <el-button type="primary" @click="publish" :icon="Upload">Publiceren</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="grid">
      <!-- Left: palette + section list -->
      <el-col :span="7">
        <el-card header="Componenten toevoegen" class="panel">
          <el-space wrap>
            <el-button v-for="c in builder.components" :key="c.type" size="small" plain @click="builder.addSection(c.type)">
              <el-icon><component :is="c.icon" /></el-icon>&nbsp;{{ c.label }}
            </el-button>
          </el-space>
        </el-card>

        <el-card header="Secties (sleep om te ordenen)" class="panel" style="margin-top: 12px">
          <draggable v-model="builder.config.sections" item-key="id" handle=".drag" @change="builder.markDirty()">
            <template #item="{ element }">
              <div class="row" :class="{ active: element.id === builder.selectedId }" @click="builder.selectedId = element.id">
                <el-icon class="drag"><Rank /></el-icon>
                <span class="type">{{ label(element.type) }}</span>
                <el-icon class="act" @click.stop="builder.toggleVisible(element.id)">
                  <component :is="element.visible ? 'View' : 'Hide'" />
                </el-icon>
                <el-icon class="act danger" @click.stop="builder.removeSection(element.id)"><Delete /></el-icon>
              </div>
            </template>
          </draggable>
          <el-empty v-if="!builder.config.sections.length" description="Nog geen secties" :image-size="60" />
        </el-card>
      </el-col>

      <!-- Center: live preview -->
      <el-col :span="11">
        <el-card header="Live preview" class="panel preview-card" body-style="padding:0">
          <div class="preview">
            <DynamicRenderer :config="builder.config" />
          </div>
        </el-card>
      </el-col>

      <!-- Right: prop editor (generated from the component's schema) -->
      <el-col :span="6">
        <el-card header="Instellingen" class="panel">
          <div v-if="selected">
            <el-tag round style="margin-bottom: 14px">{{ label(selected.type) }}</el-tag>
            <el-form label-position="top">
              <el-form-item v-for="(field, key) in schema" :key="key" :label="field.label">
                <el-input v-if="field.type === 'string'" v-model="selected.props[key]" @input="builder.markDirty()" />
                <el-input v-else-if="field.type === 'textarea'" v-model="selected.props[key]" type="textarea" :rows="4" @input="builder.markDirty()" />
                <el-input-number v-else-if="field.type === 'number'" v-model="selected.props[key]" :min="1" @change="builder.markDirty()" />
                <el-select v-else-if="field.type === 'select'" v-model="selected.props[key]" @change="builder.markDirty()">
                  <el-option v-for="o in field.options" :key="o" :label="o" :value="o" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
          <el-empty v-else description="Selecteer een sectie" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import draggable from 'vuedraggable';
import { ElMessage } from 'element-plus';
import { DocumentAdd, Upload } from '@element-plus/icons-vue';
import DynamicRenderer from '@/storefront/DynamicRenderer.vue';
import { useBuilderStore } from '@/stores/builder';

const builder = useBuilderStore();

onMounted(() => builder.loadPage('home'));

const selected = computed(() => builder.selected());
const schema = computed(() => (selected.value ? builder.defFor(selected.value.type)?.propsSchema || {} : {}));
const label = (type: string) => builder.defFor(type)?.label || type;

async function publish() {
  await builder.publish();
  ElMessage.success('Pagina gepubliceerd');
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.grid { align-items: flex-start; }
.panel { height: 100%; }
.preview-card .preview { height: 70vh; overflow: auto; border-radius: var(--app-radius); }
.row {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px; margin-bottom: 6px;
  border: 1px solid var(--el-border-color-light); border-radius: 8px; cursor: pointer; background: var(--el-bg-color);
}
.row.active { border-color: var(--el-color-primary); }
.row .type { flex: 1; }
.row .drag { cursor: grab; color: var(--el-text-color-secondary); }
.row .act { cursor: pointer; }
.row .act.danger:hover { color: var(--el-color-danger); }
</style>
