<template>
  <div class="builder">
    <div class="head">
      <div class="title-row">
        <h2>Page Builder</h2>
        <el-select :model-value="builder.slug" size="small" style="width: 160px" @change="switchPage">
          <el-option v-for="p in builder.pages" :key="p.slug" :label="p.title" :value="p.slug" />
        </el-select>
        <el-button size="small" :icon="Plus" @click="newPage">Nieuwe pagina</el-button>
        <el-tag v-if="builder.dirty" type="warning" size="small">niet opgeslagen</el-tag>
      </div>
      <div class="actions">
        <el-button-group>
          <el-button :icon="RefreshLeft" :disabled="!builder.canUndo" @click="builder.undo()" title="Ongedaan maken" />
          <el-button :icon="RefreshRight" :disabled="!builder.canRedo" @click="builder.redo()" title="Opnieuw" />
        </el-button-group>
        <el-button @click="builder.saveDraft()" :icon="DocumentAdd">Concept opslaan</el-button>
        <el-button type="primary" @click="publish" :icon="Upload">Publiceren</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="grid">
      <!-- Left: palette + section list -->
      <el-col :xs="24" :md="7">
        <el-card header="Sleep een component naar rechts →" class="panel">
          <draggable
            :list="builder.components"
            :group="{ name: 'blocks', pull: 'clone', put: false }"
            :clone="paletteClone"
            :sort="false"
            item-key="type"
            class="palette"
          >
            <template #item="{ element }">
              <div class="chip" @click="builder.addSection(element.type)">
                <el-icon><component :is="element.icon" /></el-icon>
                <span>{{ element.label }}</span>
              </div>
            </template>
          </draggable>
        </el-card>

        <el-card header="Secties (sleep om te ordenen)" class="panel" style="margin-top: 12px">
          <draggable v-model="builder.config.sections" group="blocks" item-key="id" handle=".drag" @change="builder.markDirty()">
            <template #item="{ element }">
              <div class="row" :class="{ active: element.id === builder.selectedId }" @click="builder.selectedId = element.id">
                <el-icon class="drag"><Rank /></el-icon>
                <span class="type">{{ label(element.type) }}</span>
                <el-icon class="act" title="Omhoog" @click.stop="builder.moveSection(element.id, -1)"><Top /></el-icon>
                <el-icon class="act" title="Omlaag" @click.stop="builder.moveSection(element.id, 1)"><Bottom /></el-icon>
                <el-icon class="act" title="Dupliceren" @click.stop="builder.duplicateSection(element.id)"><CopyDocument /></el-icon>
                <el-icon class="act" :title="element.visible ? 'Verbergen' : 'Tonen'" @click.stop="builder.toggleVisible(element.id)">
                  <component :is="element.visible ? 'View' : 'Hide'" />
                </el-icon>
                <el-icon class="act danger" title="Verwijderen" @click.stop="builder.removeSection(element.id)"><Delete /></el-icon>
              </div>
            </template>
          </draggable>
          <el-empty v-if="!builder.config.sections.length" description="Sleep hierheen of klik een component" :image-size="60" />
        </el-card>
      </el-col>

      <!-- Center: live preview -->
      <el-col :xs="24" :md="11">
        <el-card class="panel preview-card" body-style="padding:0">
          <template #header>
            <div class="preview-bar">
              <span>Live preview</span>
              <el-radio-group v-model="device" size="small">
                <el-radio-button value="100%"><el-icon><Monitor /></el-icon></el-radio-button>
                <el-radio-button value="768px"><el-icon><Iphone /></el-icon> Tablet</el-radio-button>
                <el-radio-button value="390px"><el-icon><Cellphone /></el-icon> Mobiel</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="preview-stage">
            <div class="device" :style="{ width: device, maxWidth: '100%' }">
              <DynamicRenderer :config="builder.config" :respect-features="false" />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Right: prop editor (generated from the component's schema) -->
      <el-col :xs="24" :md="6">
        <el-card header="Instellingen" class="panel">
          <div v-if="selected">
            <el-tag round style="margin-bottom: 14px">{{ label(selected.type) }}</el-tag>
            <el-form label-position="top">
              <el-form-item v-for="(field, key) in schema" :key="key" :label="field.type === 'repeater' ? '' : field.label">
                <el-input v-if="field.type === 'string'" v-model="selected.props[key]" @input="builder.markDirty()" />
                <el-input v-else-if="field.type === 'textarea'" v-model="selected.props[key]" type="textarea" :rows="4" @input="builder.markDirty()" />
                <el-input-number v-else-if="field.type === 'number'" v-model="selected.props[key]" :min="0" @change="builder.markDirty()" />
                <el-select v-else-if="field.type === 'select'" v-model="selected.props[key]" @change="builder.markDirty()" style="width: 100%">
                  <el-option v-for="o in field.options" :key="o" :label="o" :value="o" />
                </el-select>
                <el-color-picker v-else-if="field.type === 'color'" v-model="selected.props[key]" @change="builder.markDirty()" />
                <el-switch v-else-if="field.type === 'boolean'" v-model="selected.props[key]" @change="builder.markDirty()" />
                <ImageUploader v-else-if="field.type === 'image'" v-model="selected.props[key]" @update:model-value="builder.markDirty()" />

                <!-- Repeater: editable list of items -->
                <div v-else-if="field.type === 'repeater'" class="repeater">
                  <label class="rep-label">{{ field.label }}</label>
                  <div v-for="(item, idx) in (selected.props[key] || [])" :key="idx" class="rep-item">
                    <div class="rep-head"><span>#{{ idx + 1 }}</span><el-icon class="del" @click="removeItem(key, idx)"><Delete /></el-icon></div>
                    <div v-for="(sub, sk) in field.itemFields" :key="sk" class="sub">
                      <label>{{ sub.label }}</label>
                      <el-select v-if="sub.type === 'select'" v-model="item[sk]" size="small" style="width: 100%" @change="builder.markDirty()">
                        <el-option v-for="o in sub.options" :key="o" :label="o" :value="o" />
                      </el-select>
                      <el-input v-else v-model="item[sk]" size="small" @input="builder.markDirty()" />
                    </div>
                  </div>
                  <el-button size="small" :icon="Plus" @click="addItem(key, field)">{{ field.addLabel || 'Toevoegen' }}</el-button>
                </div>
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
import { computed, onMounted, ref } from 'vue';
import draggable from 'vuedraggable';
import { ElMessage, ElMessageBox } from 'element-plus';
import { DocumentAdd, Upload, Plus, Delete, RefreshLeft, RefreshRight, Monitor, Iphone, Cellphone, Top, Bottom, CopyDocument } from '@element-plus/icons-vue';
import DynamicRenderer from '@/storefront/DynamicRenderer.vue';
import ImageUploader from '@/components/ImageUploader.vue';
import { useBuilderStore } from '@/stores/builder';

const builder = useBuilderStore();
const device = ref('100%');

onMounted(() => builder.loadPage('home'));

const selected = computed(() => builder.selected());
const schema = computed(() => (selected.value ? builder.defFor(selected.value.type)?.propsSchema || {} : {}));
const label = (type: string) => builder.defFor(type)?.label || type;

function addItem(key: string, field: any) {
  const sel = selected.value;
  if (!sel) return;
  if (!Array.isArray(sel.props[key])) sel.props[key] = [];
  const item: Record<string, any> = {};
  for (const sk of Object.keys(field.itemFields || {})) item[sk] = '';
  sel.props[key].push(item);
  builder.markDirty();
}
function removeItem(key: string, idx: number) {
  const sel = selected.value;
  if (!sel || !Array.isArray(sel.props[key])) return;
  sel.props[key].splice(idx, 1);
  builder.markDirty();
}

function paletteClone(def: any) {
  builder.snapshot();
  return builder.makeSection(def.type);
}

function switchPage(slug: string) {
  builder.loadPage(slug);
}

async function newPage() {
  const { value } = await ElMessageBox.prompt('Titel van de nieuwe pagina', 'Nieuwe pagina', { inputPattern: /.+/, inputErrorMessage: 'Vul een titel in' });
  await builder.createPage(value);
  ElMessage.success('Pagina aangemaakt');
}

async function publish() {
  await builder.publish();
  ElMessage.success('Pagina gepubliceerd');
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px; }
@media (max-width: 768px) {
  .grid .el-col { margin-bottom: 16px; }
  .preview-stage { height: 60vh; }
}
.title-row { display: flex; align-items: center; gap: 10px; }
.actions { display: flex; gap: 8px; }
.grid { align-items: flex-start; }
.panel { height: 100%; }
.palette { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px dashed var(--el-border-color); border-radius: 8px; cursor: grab; font-size: 0.9rem; background: var(--el-bg-color); user-select: none; }
.chip:hover { border-color: var(--el-color-primary); color: var(--el-color-primary); }
.preview-bar { display: flex; align-items: center; justify-content: space-between; }
.preview-stage { height: 72vh; overflow: auto; background: var(--el-fill-color); padding: 16px; display: flex; justify-content: center; }
.device { background: var(--app-color-bg); border-radius: var(--app-radius); overflow: hidden; box-shadow: var(--el-box-shadow-light); transition: width 0.3s ease; align-self: flex-start; }
.row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; margin-bottom: 6px; border: 1px solid var(--el-border-color-light); border-radius: 8px; cursor: pointer; background: var(--el-bg-color); }
.row.active { border-color: var(--el-color-primary); }
.row .type { flex: 1; }
.row .drag { cursor: grab; color: var(--el-text-color-secondary); }
.row .act { cursor: pointer; color: var(--el-text-color-secondary); }
.row .act:hover { color: var(--el-color-primary); }
.row .act.danger:hover { color: var(--el-color-danger); }
.repeater { width: 100%; }
.rep-label { display: block; font-size: 0.85rem; color: var(--el-text-color-regular); margin-bottom: 8px; }
.rep-item { border: 1px solid var(--el-border-color-light); border-radius: 8px; padding: 10px; margin-bottom: 10px; }
.rep-head { display: flex; justify-content: space-between; align-items: center; color: var(--el-text-color-secondary); font-size: 0.8rem; margin-bottom: 6px; }
.rep-head .del { cursor: pointer; }
.rep-head .del:hover { color: var(--el-color-danger); }
.sub { margin-bottom: 8px; }
.sub label { display: block; font-size: 0.78rem; color: var(--el-text-color-secondary); margin-bottom: 2px; }
</style>
