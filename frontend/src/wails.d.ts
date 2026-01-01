// Wails bindings
declare global {
  interface Window {
    go: {
      main: {
        App: {
          GetProjects(): Promise<Project[]>
          SyncProjects(): Promise<Project[]>
          UpdateProject(id: string, updates: Record<string, any>): Promise<Project | null>
          DeleteProject(id: string): Promise<boolean>
          GetSettings(): Promise<Settings>
          AddScanPath(path: string): Promise<Settings>
          RemoveScanPath(path: string): Promise<Settings>
          SelectFolder(): Promise<string>
          OpenInEditor(path: string, editor: string): Promise<void>
          OpenInExplorer(path: string): Promise<void>
          OpenInTerminal(path: string): Promise<void>
          RefreshProject(id: string): Promise<Project | null>
        }
      }
    }
  }
}

export interface GitInfo {
  remoteUrl: string
  currentBranch: string
  commitCount: number
  lastCommitDate?: string
  hasUncommitted: boolean
  ahead: number
  behind: number
}

export interface ProjectMeta {
  framework?: string
  packageManager?: string
  lastOpened: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  path: string
  git?: GitInfo
  meta: ProjectMeta
  status: 'active' | 'paused' | 'completed' | 'archived' | 'refactoring'
  category: string
  pinned: boolean
  notes?: string
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  defaultEditor: 'vscode' | 'cursor' | 'webstorm' | 'sublime'
  scanPaths: string[]
}

export const api = window.go.main.App
