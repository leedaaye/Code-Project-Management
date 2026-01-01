export interface GitInfo {
  remoteUrl: string
  currentBranch: string
  commitCount: number
  lastCommitDate?: Date
  hasUncommitted: boolean
  ahead: number
  behind: number
}

export interface ProjectMeta {
  framework?: string
  packageManager?: string
  lastOpened: Date
  createdAt: Date
}

export interface Project {
  id: string
  name: string
  path: string
  git?: GitInfo
  meta: ProjectMeta
  tags: string[]
  status: 'active' | 'paused' | 'completed' | 'archived' | 'refactoring'
  category: string
  pinned: boolean
  notes?: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Category {
  id: string
  name: string
  icon?: string
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  defaultEditor: 'vscode' | 'cursor' | 'webstorm' | 'sublime'
  scanPaths: string[]
}
