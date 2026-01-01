import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { exec, spawn } from 'child_process'
import { ProjectService } from './services/project-service'
import { DatabaseService } from './services/database-service'
import type { Project } from '../shared/types'

function isValidProjectPath(p: string): boolean {
  try {
    const resolved = path.resolve(p)
    return fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()
  } catch {
    return false
  }
}

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '127.0.0.1'

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // In production, allow same-origin requests (origin will be undefined or match the server)
    if (process.env.NODE_ENV === 'production') {
      callback(null, true)
      return
    }
    // In development, only allow specific origins
    const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', `http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`]
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS not allowed'))
    }
  },
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())

// Initialize services
const dbService = new DatabaseService()
const projectService = new ProjectService(dbService)

// API Routes

// Projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await projectService.getAllProjects()
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get projects' })
  }
})

app.post('/api/projects/scan', async (req, res) => {
  try {
    const { path: dirPath } = req.body
    if (!dirPath) {
      return res.status(400).json({ error: '请输入目录路径' })
    }
    const projects = await projectService.scanDirectory(dirPath)
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: 'Failed to scan directory' })
  }
})

app.post('/api/projects/sync', async (req, res) => {
  try {
    const settings = dbService.getSettings()
    const scanPaths = settings.scanPaths || []
    const seen = new Set<string>()
    const allProjects: Project[] = []
    for (const scanPath of scanPaths) {
      try {
        const projects = await projectService.scanDirectory(scanPath)
        for (const project of projects) {
          if (!seen.has(project.path)) {
            seen.add(project.path)
            allProjects.push(project)
          }
        }
      } catch {
        // Skip failed paths, continue with others
      }
    }
    res.json(allProjects)
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync projects' })
  }
})

app.post('/api/projects', async (req, res) => {
  try {
    const { path: projectPath } = req.body
    if (!projectPath) {
      return res.status(400).json({ error: '请输入项目路径' })
    }
    const project = await projectService.addProject(projectPath)
    if (!project) {
      return res.status(400).json({ error: '路径不存在或不是有效的项目目录' })
    }
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: 'Failed to add project' })
  }
})

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const success = await projectService.removeProject(req.params.id)
    res.json({ success })
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove project' })
  }
})

const ALLOWED_PROJECT_UPDATE_FIELDS = ['name', 'status', 'category', 'tags', 'pinned', 'notes']

app.patch('/api/projects/:id', async (req, res) => {
  try {
    const sanitizedUpdates: Record<string, unknown> = {}
    for (const key of ALLOWED_PROJECT_UPDATE_FIELDS) {
      if (key in req.body) {
        sanitizedUpdates[key] = req.body[key]
      }
    }
    if (Object.keys(sanitizedUpdates).length === 0) {
      return res.status(400).json({ error: '没有有效的更新字段' })
    }
    const project = await projectService.updateProject(req.params.id, sanitizedUpdates)
    if (!project) {
      return res.status(404).json({ error: '项目不存在' })
    }
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' })
  }
})

app.post('/api/projects/:id/refresh', async (req, res) => {
  try {
    const project = await projectService.refreshProject(req.params.id)
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh project' })
  }
})

// Tags
app.get('/api/tags', (req, res) => {
  try {
    const tags = dbService.getAllTags()
    res.json(tags)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tags' })
  }
})

app.post('/api/tags', (req, res) => {
  try {
    dbService.createTag(req.body)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tag' })
  }
})

app.delete('/api/tags/:id', (req, res) => {
  try {
    const success = dbService.deleteTag(req.params.id)
    res.json({ success })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' })
  }
})

// Categories
app.get('/api/categories', (req, res) => {
  try {
    const categories = dbService.getAllCategories()
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories' })
  }
})

app.post('/api/categories', (req, res) => {
  try {
    dbService.createCategory(req.body)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// Shell operations
app.get('/api/dialog/select-folder', (req, res) => {
  if (process.platform === 'win32') {
    const ps = [
      '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
      'Add-Type -AssemblyName System.Windows.Forms',
      '$f = New-Object System.Windows.Forms.FolderBrowserDialog',
      "$f.Description = '选择项目目录'",
      "if ($f.ShowDialog() -eq 'OK') { $f.SelectedPath } else { '' }"
    ].join('; ')

    exec(
      `powershell -NoProfile -NonInteractive -STA -Command "${ps}"`,
      { encoding: 'utf8', windowsHide: true },
      (error, stdout) => {
        if (error) {
          return res.json({ path: null })
        }
        const selected = stdout.trim()
        res.json({ path: selected || null })
      }
    )
  } else if (process.platform === 'darwin') {
    exec(`osascript -e 'POSIX path of (choose folder with prompt "选择项目目录")'`, (error, stdout) => {
      res.json({ path: error ? null : stdout.trim() })
    })
  } else {
    exec(`zenity --file-selection --directory --title="选择项目目录"`, (error, stdout) => {
      res.json({ path: error ? null : stdout.trim() })
    })
  }
})

app.post('/api/shell/vscode', (req, res) => {
  const { path: projectPath } = req.body
  if (!projectPath || !isValidProjectPath(projectPath)) {
    return res.status(400).json({ error: '无效的项目路径' })
  }
  const resolved = path.resolve(projectPath)
  const child = spawn('code', [resolved], { shell: true, detached: true, stdio: 'ignore' })
  child.unref()
  child.on('error', () => {
    res.status(500).json({ error: 'Failed to open VSCode' })
  })
  res.json({ success: true })
})

app.post('/api/shell/terminal', (req, res) => {
  const { path: projectPath } = req.body
  if (!projectPath || !isValidProjectPath(projectPath)) {
    return res.status(400).json({ error: '无效的项目路径' })
  }
  const resolved = path.resolve(projectPath)
  let child
  if (process.platform === 'win32') {
    child = spawn('cmd', ['/K', `cd /d "${resolved}"`], { shell: true, detached: true, stdio: 'ignore' })
  } else if (process.platform === 'darwin') {
    child = spawn('open', ['-a', 'Terminal', resolved], { detached: true, stdio: 'ignore' })
  } else {
    child = spawn('gnome-terminal', ['--working-directory', resolved], { detached: true, stdio: 'ignore' })
  }
  child.unref()
  res.json({ success: true })
})

app.post('/api/shell/explorer', (req, res) => {
  const { path: projectPath } = req.body
  if (!projectPath || !isValidProjectPath(projectPath)) {
    return res.status(400).json({ error: '无效的项目路径' })
  }
  const resolved = path.resolve(projectPath)
  let child
  if (process.platform === 'win32') {
    child = spawn('explorer', [resolved], { detached: true, stdio: 'ignore' })
  } else if (process.platform === 'darwin') {
    child = spawn('open', [resolved], { detached: true, stdio: 'ignore' })
  } else {
    child = spawn('xdg-open', [resolved], { detached: true, stdio: 'ignore' })
  }
  child.unref()
  res.json({ success: true })
})

// Settings
app.get('/api/settings', (req, res) => {
  try {
    const settings = dbService.getSettings()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get settings' })
  }
})

app.post('/api/settings', (req, res) => {
  try {
    dbService.saveSettings(req.body)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

app.post('/api/settings/scan-paths', (req, res) => {
  try {
    const { path: newPath } = req.body
    if (!newPath) {
      return res.status(400).json({ error: '请输入目录路径' })
    }
    const settings = dbService.getSettings()
    if (!settings.scanPaths) {
      settings.scanPaths = []
    }
    if (!settings.scanPaths.includes(newPath)) {
      settings.scanPaths.push(newPath)
      dbService.saveSettings(settings)
    }
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Failed to add scan path' })
  }
})

app.delete('/api/settings/scan-paths', (req, res) => {
  try {
    const { path: pathToRemove } = req.body
    if (!pathToRemove) {
      return res.status(400).json({ error: '请输入目录路径' })
    }
    const settings = dbService.getSettings()
    settings.scanPaths = (settings.scanPaths || []).filter(p => p !== pathToRemove)
    dbService.saveSettings(settings)
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove scan path' })
  }
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../renderer')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../renderer/index.html'))
  })
}

app.listen(Number(PORT), HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`)
})
