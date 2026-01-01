<script setup lang="ts">
import { STATUS_CONFIG, CATEGORY_CONFIG } from '../constants'
import Icons from './Icons.vue'
interface Props {
  stats: {
    total: number
    active: number
    byCategory: Record<string, number>
    byStatus: Record<string, number>
  }
  selectedCategory: string
  selectedStatus: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-category': [category: string]
  'select-status': [status: string]
}>()

const categories = Object.entries(CATEGORY_CONFIG).map(([id, config]) => ({
  id,
  name: config.name,
  icon: config.icon
}))

const statuses = [
  { id: '', name: '全部', color: '#6b7280' },
  ...Object.entries(STATUS_CONFIG).map(([id, config]) => ({
    id,
    name: config.label,
    color: config.color
  }))
]
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-title">目录</div>
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="sidebar-item"
        :class="{ active: selectedCategory === cat.id }"
        @click="emit('select-category', cat.id)"
      >
        <Icons :name="cat.icon" />
        <span>{{ cat.name }}</span>
        <span class="sidebar-item-count">
          {{ cat.id === 'all' ? stats.total : (stats.byCategory[cat.id] || 0) }}
        </span>
      </div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-title">状态</div>
      <div
        v-for="s in statuses"
        :key="s.id"
        class="sidebar-item"
        :class="{ active: selectedStatus === s.id }"
        @click="emit('select-status', s.id)"
      >
        <span class="tag-dot" :style="{ background: s.color }"></span>
        <span>{{ s.name }}</span>
        <span class="sidebar-item-count">
          {{ s.id === '' ? stats.total : (stats.byStatus[s.id] || 0) }}
        </span>
      </div>
    </div>
  </aside>
</template>
