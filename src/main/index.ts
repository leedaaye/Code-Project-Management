const { app, BrowserWindow, ipcMain, shell } = require('electron')
import * as path from 'path'
import { ProjectService } from './services/project-service'
import { DatabaseService } from './services/database-service'

let mainWindow: typeof BrowserWindow | null = null
let projectService: ProjectService
let dbService: DatabaseService

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function setupIPC() {
  // Window controls
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.close())

  // Project operations
  ipcMain.handle('projects:getAll', async () => {
    return projectService.getAllProjects()
  })

  ipcMain.handle('projects:scan', async (_, dirPath: string) => {
    return projectService.scanDirectory(dirPath)
  })

  ipcMain.handle('projects:add', async (_, projectPath: string) => {
    return projectService.addProject(projectPath)
  })

  ipcMain.handle('projects:remove', async (_, projectId: string) => {
    return projectService.removeProject(projectId)
  })

  ipcMain.handle('projects:update', async (_, projectId: string, updates: any) => {
    return projectService.updateProject(projectId, updates)
  })

  ipcMain.handle('projects:refresh', async (_, projectId: string) => {
    return projectService.refreshProject(projectId)
  })

  // Tags
  ipcMain.handle('tags:getAll', async () => {
    return dbService.getAllTags()
  })

  ipcMain.handle('tags:create', async (_, tag: any) => {
    return dbService.createTag(tag)
  })

  ipcMain.handle('tags:delete', async (_, tagId: string) => {
    return dbService.deleteTag(tagId)
  })

  // Categories
  ipcMain.handle('categories:getAll', async () => {
    return dbService.getAllCategories()
  })

  ipcMain.handle('categories:create', async (_, category: any) => {
    return dbService.createCategory(category)
  })

  // Open externally
  ipcMain.handle('shell:openInVSCode', async (_, projectPath: string) => {
    return shell.openPath(projectPath).then(() => {
      require('child_process').exec(`code "${projectPath}"`)
    })
  })

  ipcMain.handle('shell:openInTerminal', async (_, projectPath: string) => {
    const { exec } = require('child_process')
    if (process.platform === 'win32') {
      exec(`start cmd /K "cd /d ${projectPath}"`)
    } else if (process.platform === 'darwin') {
      exec(`open -a Terminal "${projectPath}"`)
    } else {
      exec(`gnome-terminal --working-directory="${projectPath}"`)
    }
  })

  ipcMain.handle('shell:openInExplorer', async (_, projectPath: string) => {
    shell.showItemInFolder(projectPath)
  })

  // Settings
  ipcMain.handle('settings:get', async () => {
    return dbService.getSettings()
  })

  ipcMain.handle('settings:set', async (_, settings: any) => {
    return dbService.saveSettings(settings)
  })
}

app.whenReady().then(async () => {
  dbService = new DatabaseService()
  projectService = new ProjectService(dbService)

  setupIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
