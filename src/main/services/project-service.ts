import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { simpleGit, SimpleGit } from 'simple-git'
import { DatabaseService } from './database-service'
import { Project, GitInfo } from '../../shared/types'

function generateId(): string {
  return crypto.randomBytes(16).toString('hex')
}

export class ProjectService {
  private db: DatabaseService

  constructor(db: DatabaseService) {
    this.db = db
  }

  async getAllProjects(): Promise<Project[]> {
    return this.db.getAllProjects()
  }

  async addProject(projectPath: string): Promise<Project | null> {
    if (!fs.existsSync(projectPath)) {
      return null
    }

    const existingProject = this.db.getProjectByPath(projectPath)
    if (existingProject) {
      return existingProject
    }

    const project = await this.createProjectFromPath(projectPath)
    this.db.insertProject(project)
    return project
  }

  async scanDirectory(dirPath: string): Promise<Project[]> {
    const projects: Project[] = []

    if (!fs.existsSync(dirPath)) {
      return projects
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) {
        continue
      }

      const fullPath = path.join(dirPath, entry.name)

      if (this.isProjectDirectory(fullPath)) {
        const existingProject = this.db.getProjectByPath(fullPath)
        if (!existingProject) {
          const project = await this.createProjectFromPath(fullPath)
          this.db.insertProject(project)
          projects.push(project)
        } else {
          projects.push(existingProject)
        }
      }
    }

    return projects
  }

  async removeProject(projectId: string): Promise<boolean> {
    return this.db.deleteProject(projectId)
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    return this.db.updateProject(projectId, updates)
  }

  async refreshProject(projectId: string): Promise<Project | null> {
    const project = this.db.getProjectById(projectId)
    if (!project) return null

    const gitInfo = await this.getGitInfo(project.path)
    const framework = this.detectFramework(project.path)

    const updates: Partial<Project> = {
      git: gitInfo,
      meta: {
        ...project.meta,
        framework
      }
    }

    return this.db.updateProject(projectId, updates)
  }

  private isProjectDirectory(dirPath: string): boolean {
    const indicators = [
      '.git',
      'package.json',
      'Cargo.toml',
      'go.mod',
      'requirements.txt',
      'pyproject.toml',
      'pom.xml',
      'build.gradle',
      '.project'
    ]

    return indicators.some(indicator =>
      fs.existsSync(path.join(dirPath, indicator))
    )
  }

  private async createProjectFromPath(projectPath: string): Promise<Project> {
    const name = path.basename(projectPath)
    const gitInfo = await this.getGitInfo(projectPath)
    const framework = this.detectFramework(projectPath)
    const packageManager = this.detectPackageManager(projectPath)

    const stats = fs.statSync(projectPath)

    return {
      id: generateId(),
      name,
      path: projectPath,
      git: gitInfo,
      meta: {
        framework,
        packageManager,
        lastOpened: new Date(),
        createdAt: stats.birthtime
      },
      tags: [],
      status: 'active',
      category: '',
      pinned: false
    }
  }

  private async getGitInfo(projectPath: string): Promise<GitInfo | undefined> {
    const gitDir = path.join(projectPath, '.git')
    if (!fs.existsSync(gitDir)) {
      return undefined
    }

    try {
      const git: SimpleGit = simpleGit({
        baseDir: projectPath,
        binary: 'git',
        maxConcurrentProcesses: 1,
        trimmed: true
      })

      const [log, status, remotes, branch] = await Promise.all([
        git.log({ maxCount: 1 }).catch(() => null),
        git.status().catch(() => null),
        git.getRemotes(true).catch(() => []),
        git.branch().catch(() => null)
      ])

      const commitCount = await git.raw(['rev-list', '--count', 'HEAD']).catch(() => '0')

      return {
        remoteUrl: remotes[0]?.refs?.fetch || '',
        currentBranch: branch?.current || 'main',
        commitCount: parseInt(commitCount.trim(), 10) || 0,
        lastCommitDate: log?.latest?.date ? new Date(log.latest.date) : undefined,
        hasUncommitted: status ? !status.isClean() : false
      }
    } catch (error) {
      console.error('Error getting git info:', error)
      return undefined
    }
  }

  private detectFramework(projectPath: string): string | undefined {
    const packageJsonPath = path.join(projectPath, 'package.json')

    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
        const deps = { ...pkg.dependencies, ...pkg.devDependencies }

        if (deps['next']) return 'Next.js'
        if (deps['nuxt']) return 'Nuxt'
        if (deps['@angular/core']) return 'Angular'
        if (deps['vue']) return 'Vue'
        if (deps['react']) return 'React'
        if (deps['svelte']) return 'Svelte'
        if (deps['electron']) return 'Electron'
        if (deps['express']) return 'Express'
        if (deps['fastify']) return 'Fastify'
        if (deps['nest']) return 'NestJS'
        return 'Node.js'
      } catch {
        return 'Node.js'
      }
    }

    if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) return 'Rust'
    if (fs.existsSync(path.join(projectPath, 'go.mod'))) return 'Go'
    if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) return 'Python'
    if (fs.existsSync(path.join(projectPath, 'pyproject.toml'))) return 'Python'
    if (fs.existsSync(path.join(projectPath, 'pom.xml'))) return 'Java'
    if (fs.existsSync(path.join(projectPath, 'build.gradle'))) return 'Java'

    return undefined
  }

  private detectPackageManager(projectPath: string): string | undefined {
    if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm'
    if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) return 'yarn'
    if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) return 'npm'
    if (fs.existsSync(path.join(projectPath, 'bun.lockb'))) return 'bun'
    return undefined
  }
}
