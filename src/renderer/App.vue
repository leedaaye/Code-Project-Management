<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Toolbar from './components/Toolbar.vue'
import ProjectGrid from './components/ProjectGrid.vue'
import AddProjectModal from './components/AddProjectModal.vue'
import ContextMenu from './components/ContextMenu.vue'
import type { Project, Settings, Tag } from '../shared/types'

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'

// API helper
async function api<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

const projects = ref<Project[]>([])
const scanPaths = ref<string[]>([])
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedStatus = ref('')
const showAddModal = ref(false)
const addModalError = ref('')
const tags = ref<Tag[]>([])
const contextMenu = ref<{ show: boolean; x: number; y: number; project: Project | null }>({
  show: false,
  x: 0,
  y: 0,
  project: null
})

const filteredProjects = computed(() => {
  let result = projects.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.path.toLowerCase().includes(query) ||
      (p.meta.framework && p.meta.framework.toLowerCase().includes(query))
    )
  }

  if (selectedStatus.value) {
    result = result.filter(p => p.status === selectedStatus.value)
  }

  if (selectedCategory.value !== 'all') {
    result = result.filter(p => p.category === selectedCategory.value)
  }

  // Sort: pinned first, then by last opened (use spread to avoid mutating)
  return [...result].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.meta.lastOpened).getTime() - new Date(a.meta.lastOpened).getTime()
  })
})

const projectStats = computed(() => ({
  total: projects.value.length,
  active: projects.value.filter(p => p.status === 'active').length,
  byCategory: projects.value.reduce((acc, p) => {
    const cat = p.category || 'uncategorized'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>),
  byStatus: projects.value.reduce((acc, p) => {
    const status = p.status || 'active'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}))

async function loadData() {
  try {
    const [projectsData, settings, tagsData] = await Promise.all([
      api<Project[]>('/projects/sync', { method: 'POST' }),
      api<Settings>('/settings'),
      api<Tag[]>('/tags')
    ])
    projects.value = projectsData
    scanPaths.value = settings.scanPaths || []
    tags.value = tagsData
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

async function handleAddPath(path: string) {
  addModalError.value = ''
  try {
    const settings = await api<Settings>('/settings/scan-paths', {
      method: 'POST',
      body: JSON.stringify({ path })
    })
    scanPaths.value = settings.scanPaths || []
    // Sync projects after adding path
    projects.value = await api<Project[]>('/projects/sync', { method: 'POST' })
  } catch (error) {
    addModalError.value = error instanceof Error ? error.message : '添加目录失败'
  }
}

async function handleRemovePath(path: string) {
  addModalError.value = ''
  try {
    const settings = await api<Settings>('/settings/scan-paths', {
      method: 'DELETE',
      body: JSON.stringify({ path })
    })
    scanPaths.value = settings.scanPaths || []
    // Sync projects after removing path
    projects.value = await api<Project[]>('/projects/sync', { method: 'POST' })
  } catch (error) {
    addModalError.value = error instanceof Error ? error.message : '移除目录失败'
  }
}

const selectingFolder = ref(false)

async function handleSelectFolder() {
  selectingFolder.value = true
  try {
    const { path } = await api<{ path: string | null }>('/dialog/select-folder')
    if (path) {
      await handleAddPath(path)
    }
  } finally {
    selectingFolder.value = false
  }
}

async function handleRemoveProject(id: string) {
  await api(`/projects/${id}`, { method: 'DELETE' })
  projects.value = projects.value.filter(p => p.id !== id)
  contextMenu.value.show = false
}

async function handleTogglePin(project: Project) {
  const updated = await api<Project>(`/projects/${project.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ pinned: !project.pinned })
  })
  if (updated) {
    const index = projects.value.findIndex(p => p.id === project.id)
    if (index !== -1) {
      projects.value[index] = updated
    }
  }
  contextMenu.value.show = false
}

async function handleChangeStatus(project: Project, status: string) {
  const updated = await api<Project>(`/projects/${project.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
  if (updated) {
    const index = projects.value.findIndex(p => p.id === project.id)
    if (index !== -1) {
      projects.value[index] = updated
    }
  }
  contextMenu.value.show = false
}

function handleOpenInVSCode(project: Project) {
  api('/shell/vscode', {
    method: 'POST',
    body: JSON.stringify({ path: project.path })
  })
  contextMenu.value.show = false
}

function handleOpenInTerminal(project: Project) {
  api('/shell/terminal', {
    method: 'POST',
    body: JSON.stringify({ path: project.path })
  })
  contextMenu.value.show = false
}

function handleOpenInExplorer(project: Project) {
  api('/shell/explorer', {
    method: 'POST',
    body: JSON.stringify({ path: project.path })
  })
  contextMenu.value.show = false
}

function handleContextMenu(event: MouseEvent, project: Project) {
  event.preventDefault()
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    project
  }
}

function closeContextMenu() {
  contextMenu.value.show = false
}

onMounted(() => {
  loadData()
  document.addEventListener('click', closeContextMenu)
})
</script>

<template>
  <div class="app">
    <header class="web-header">
      <svg class="header-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.8"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h1>Code Project Manager</h1>
    </header>

    <div class="main-container">
      <Sidebar
        :stats="projectStats"
        :selected-category="selectedCategory"
        :selected-status="selectedStatus"
        @select-category="selectedCategory = $event"
        @select-status="selectedStatus = $event"
      />

      <div class="content">
        <Toolbar
          v-model:search="searchQuery"
          @add="showAddModal = true"
          @refresh="loadData"
        />

        <ProjectGrid
          :projects="filteredProjects"
          @context-menu="handleContextMenu"
          @open="handleOpenInVSCode"
        />
      </div>
    </div>

    <AddProjectModal
      v-if="showAddModal"
      :scan-paths="scanPaths"
      :error="addModalError"
      :loading="selectingFolder"
      @close="showAddModal = false; addModalError = ''"
      @add-path="handleAddPath"
      @remove-path="handleRemovePath"
      @select-folder="handleSelectFolder"
    />

    <ContextMenu
      v-if="contextMenu.show && contextMenu.project"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :project="contextMenu.project"
      @open-vscode="handleOpenInVSCode(contextMenu.project!)"
      @open-terminal="handleOpenInTerminal(contextMenu.project!)"
      @open-explorer="handleOpenInExplorer(contextMenu.project!)"
      @toggle-pin="handleTogglePin(contextMenu.project!)"
      @change-status="handleChangeStatus(contextMenu.project!, $event)"
      @remove="handleRemoveProject(contextMenu.project!.id)"
    />
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.web-header {
  height: 48px;
  background: var(--bg-glass);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
}

.header-logo {
  width: 22px;
  height: 22px;
  color: var(--accent-blue, #3b82f6);
}

.web-header h1 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
</style>
