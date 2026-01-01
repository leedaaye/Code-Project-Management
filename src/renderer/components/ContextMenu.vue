<script setup lang="ts">
import type { Project } from '../../shared/types'
import Icons from './Icons.vue'

interface Props {
  x: number
  y: number
  project: Project
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'open-vscode': []
  'open-terminal': []
  'open-explorer': []
  'toggle-pin': []
  'change-status': [status: string]
  'remove': []
}>()

const statuses = [
  { id: 'active', name: '进行中' },
  { id: 'paused', name: '暂停' },
  { id: 'completed', name: '已完成' },
  { id: 'archived', name: '归档' },
  { id: 'refactoring', name: '重构中' }
]
</script>

<template>
  <div
    class="context-menu"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @click.stop
  >
    <div class="context-menu-item" @click="emit('open-vscode')">
      <Icons name="vscode" /> 用 VSCode 打开
    </div>
    <div class="context-menu-item" @click="emit('open-terminal')">
      <Icons name="terminal" /> 在终端打开
    </div>
    <div class="context-menu-item" @click="emit('open-explorer')">
      <Icons name="folder" /> 在文件管理器中显示
    </div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item" @click="emit('toggle-pin')">
      <Icons name="pin" /> {{ project.pinned ? '取消置顶' : '置顶项目' }}
    </div>
    <div class="context-menu-submenu">
      <div class="context-menu-item"><Icons name="chart" /> 设置状态 <Icons name="chevron-right" /></div>
      <div class="submenu">
        <div
          v-for="s in statuses"
          :key="s.id"
          class="context-menu-item"
          :class="{ active: project.status === s.id }"
          @click="emit('change-status', s.id)"
        >
          {{ s.name }}
        </div>
      </div>
    </div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item danger" @click="emit('remove')">
      <Icons name="trash" /> 从列表移除
    </div>
  </div>
</template>

<style scoped>
.context-menu-submenu {
  position: relative;
}

.submenu {
  display: none;
  position: absolute;
  left: 100%;
  top: 0;
  background: var(--bg-glass-medium);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 4px;
  min-width: 100px;
}

.context-menu-submenu:hover .submenu {
  display: block;
}

.context-menu-item.active {
  color: var(--accent-green);
}
</style>
