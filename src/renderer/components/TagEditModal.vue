<script setup lang="ts">
import { ref } from 'vue'
import type { Project, Tag } from '../../shared/types'
import Icons from './Icons.vue'

const props = defineProps<{
  project: Project
  tags: Tag[]
}>()

const emit = defineEmits<{
  close: []
  save: [tagIds: string[]]
}>()

const selectedTags = ref<Set<string>>(new Set(props.project.tags))

function toggleTag(tagId: string) {
  if (selectedTags.value.has(tagId)) {
    selectedTags.value.delete(tagId)
  } else {
    selectedTags.value.add(tagId)
  }
  selectedTags.value = new Set(selectedTags.value)
}

function handleSave() {
  emit('save', Array.from(selectedTags.value))
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-title">设置标签 - {{ project.name }}</div>

      <div class="tag-list">
        <div
          v-for="tag in tags"
          :key="tag.id"
          class="tag-item"
          :class="{ selected: selectedTags.has(tag.id) }"
          @click="toggleTag(tag.id)"
        >
          <span class="tag-dot" :style="{ background: tag.color }"></span>
          <span>{{ tag.name }}</span>
          <Icons v-if="selectedTags.has(tag.id)" name="check" class="check" />
        </div>
      </div>

      <div class="modal-actions">
        <button class="toolbar-btn" @click="emit('close')">取消</button>
        <button class="toolbar-btn primary" @click="handleSave">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tag-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-glass);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-item:hover {
  background: var(--bg-glass-hover);
}

.tag-item.selected {
  background: var(--bg-glass-hover);
  border-color: var(--border-light);
}

.tag-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.check {
  margin-left: auto;
  color: var(--accent-green);
}
</style>
