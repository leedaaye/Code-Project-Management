import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { Project, Tag, Category, Settings } from '../../shared/types'

interface DatabaseData {
  projects: Project[]
  tags: Tag[]
  categories: Category[]
  settings: Settings
}

export class DatabaseService {
  private dataPath: string
  private data: DatabaseData

  constructor() {
    const userDataPath = app.getPath('userData')
    this.dataPath = path.join(userDataPath, 'data.json')

    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true })
    }

    this.data = this.loadData()
  }

  private loadData(): DatabaseData {
    const defaultData: DatabaseData = {
      projects: [],
      tags: [
        { id: 'tag-active', name: '进行中', color: '#22c55e' },
        { id: 'tag-refactor', name: '待重构', color: '#eab308' },
        { id: 'tag-completed', name: '已完成', color: '#3b82f6' },
        { id: 'tag-archived', name: '归档', color: '#6b7280' }
      ],
      categories: [],
      settings: {
        theme: 'dark',
        defaultEditor: 'vscode',
        scanPaths: []
      }
    }

    if (!fs.existsSync(this.dataPath)) {
      this.saveData(defaultData)
      return defaultData
    }

    try {
      const raw = fs.readFileSync(this.dataPath, 'utf-8')
      const parsed = JSON.parse(raw)
      return { ...defaultData, ...parsed }
    } catch {
      return defaultData
    }
  }

  private saveData(data?: DatabaseData): void {
    const toSave = data || this.data
    fs.writeFileSync(this.dataPath, JSON.stringify(toSave, null, 2), 'utf-8')
  }

  // Projects
  getAllProjects(): Project[] {
    return this.data.projects.sort((a, b) => {
      const dateA = new Date(a.meta.lastOpened).getTime()
      const dateB = new Date(b.meta.lastOpened).getTime()
      return dateB - dateA
    })
  }

  getProjectById(id: string): Project | null {
    return this.data.projects.find(p => p.id === id) || null
  }

  getProjectByPath(projectPath: string): Project | null {
    return this.data.projects.find(p => p.path === projectPath) || null
  }

  insertProject(project: Project): void {
    this.data.projects.push(project)
    this.saveData()
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const index = this.data.projects.findIndex(p => p.id === id)
    if (index === -1) return null

    const current = this.data.projects[index]
    const updated: Project = {
      ...current,
      ...updates,
      meta: {
        ...current.meta,
        ...(updates.meta || {}),
        lastOpened: new Date()
      }
    }

    this.data.projects[index] = updated
    this.saveData()
    return updated
  }

  deleteProject(id: string): boolean {
    const index = this.data.projects.findIndex(p => p.id === id)
    if (index === -1) return false

    this.data.projects.splice(index, 1)
    this.saveData()
    return true
  }

  // Tags
  getAllTags(): Tag[] {
    return this.data.tags
  }

  createTag(tag: Tag): void {
    if (!this.data.tags.find(t => t.id === tag.id)) {
      this.data.tags.push(tag)
      this.saveData()
    }
  }

  deleteTag(id: string): boolean {
    const index = this.data.tags.findIndex(t => t.id === id)
    if (index === -1) return false

    this.data.tags.splice(index, 1)
    this.saveData()
    return true
  }

  // Categories
  getAllCategories(): Category[] {
    return this.data.categories
  }

  createCategory(category: Category): void {
    if (!this.data.categories.find(c => c.id === category.id)) {
      this.data.categories.push(category)
      this.saveData()
    }
  }

  // Settings
  getSettings(): Settings {
    return this.data.settings
  }

  saveSettings(settings: Settings): void {
    this.data.settings = settings
    this.saveData()
  }
}
