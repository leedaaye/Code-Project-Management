<script setup lang="ts">
import Icons from './Icons.vue'

defineProps<{
  scanPaths: string[]
  error?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  'add-path': [path: string]
  'remove-path': [path: string]
  'select-folder': []
}>()
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-title">目录管理</div>

      <p class="modal-hint">配置要监控的项目目录，刷新时将自动同步这些目录中的项目</p>

      <div class="path-list">
        <div v-if="scanPaths.length === 0" class="empty-hint">
          暂无监控目录，点击下方按钮添加
        </div>
        <div v-for="path in scanPaths" :key="path" class="path-item">
          <span class="path-text" :title="path">{{ path }}</span>
          <button class="remove-btn" @click="emit('remove-path', path)" title="移除">×</button>
        </div>
      </div>

      <button class="add-btn" @click="emit('select-folder')" :disabled="loading">
        <Icons name="folder-open" /> {{ loading ? '选择中...' : '选择目录' }}
      </button>

      <p v-if="error" class="modal-error">{{ error }}</p>

      <div class="modal-actions">
        <button class="toolbar-btn primary" @click="emit('close')">完成</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.modal-error {
  font-size: 12px;
  color: var(--accent-red);
  margin-top: 12px;
}

.path-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.empty-hint {
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
  padding: 20px;
}

.path-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-glass-medium);
  border-radius: 6px;
  margin-bottom: 6px;
}

.path-text {
  flex: 1;
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: var(--accent-red);
  color: white;
}

.add-btn {
  width: 100%;
  padding: 10px;
  background: var(--bg-glass-medium);
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.add-btn:hover {
  background: var(--bg-glass-hover);
  border-color: var(--border-light);
  color: white;
}
</style>
