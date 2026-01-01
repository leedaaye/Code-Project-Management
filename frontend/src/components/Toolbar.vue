<script setup lang="ts">
import Icons from './Icons.vue'
const search = defineModel<string>('search', { default: '' })

const emit = defineEmits<{
  add: []
  refresh: []
}>()
</script>

<template>
  <div class="toolbar">
    <div class="search-box">
      <span class="search-icon"><Icons name="search" /></span>
      <input
        v-model="search"
        type="text"
        class="search-input"
        placeholder="搜索项目..."
      />
    </div>

    <div style="flex: 1;"></div>

    <button class="toolbar-btn" @click="emit('refresh')" title="刷新">
      <Icons name="refresh" /> 刷新
    </button>

    <button class="toolbar-btn primary" @click="emit('add')">
      <Icons name="plus" /> 添加项目
    </button>
  </div>
</template>
