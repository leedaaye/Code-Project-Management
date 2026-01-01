<script setup lang="ts">
import type { Project } from '../../shared/types'
import { getStatusLabel, getStatusColor } from '../../shared/constants'
import Icons from './Icons.vue'

interface Props {
  projects: Project[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'context-menu': [event: MouseEvent, project: Project]
  'open': [project: Project]
}>()

function formatDate(date: Date | string | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function formatPath(path: string): string {
  const maxLen = 40
  if (path.length <= maxLen) return path
  return '...' + path.slice(-maxLen)
}
</script>

<template>
  <div class="projects-container">
    <div v-if="projects.length === 0" class="empty-state">
      <div class="empty-icon"><Icons name="folder-open" /></div>
      <div class="empty-title">暂无项目</div>
      <div class="empty-desc">点击"添加项目"按钮开始管理你的代码项目</div>
    </div>

    <div v-else class="projects-grid">
      <div
        v-for="project in projects"
        :key="project.id"
        class="project-card"
        :class="{ pinned: project.pinned }"
        @contextmenu="emit('context-menu', $event, project)"
        @dblclick="emit('open', project)"
      >
        <div class="project-header">
          <div class="project-name">
            <Icons v-if="project.pinned" name="pin" class="pin-icon" />
            {{ project.name }}
          </div>
          <div class="project-actions">
            <button
              class="action-btn"
              title="用 VSCode 打开"
              @click.stop="emit('open', project)"
            >
              <Icons name="vscode" />
            </button>
          </div>
        </div>

        <div class="project-path" :title="project.path">
          {{ formatPath(project.path) }}
        </div>

        <div class="project-meta">
          <span class="meta-item" v-if="project.git">
            <Icons name="git-branch" /> {{ project.git.currentBranch }}
          </span>
          <span class="meta-item git-status" v-if="project.git">
            <span v-if="project.git.hasUncommitted" class="git-dirty" title="有未提交的更改">●</span>
            <span v-if="project.git.ahead > 0" class="git-ahead" title="领先远程">↑{{ project.git.ahead }}</span>
            <span v-if="project.git.behind > 0" class="git-behind" title="落后远程">↓{{ project.git.behind }}</span>
          </span>
          <span class="meta-item">
            <Icons name="calendar" /> {{ formatDate(project.meta.lastOpened) }}
          </span>
        </div>

        <div class="project-tags">
          <span
            class="tag status"
            :style="{
              background: `${getStatusColor(project.status)}20`,
              color: getStatusColor(project.status)
            }"
          >
            {{ getStatusLabel(project.status) }}
          </span>
          <span
            v-if="project.meta.framework"
            class="tag framework"
          >
            {{ project.meta.framework }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
