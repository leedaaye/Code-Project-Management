package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	goruntime "runtime"
	"sort"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx      context.Context
	dataPath string
	data     *DatabaseData
}

type GitInfo struct {
	RemoteUrl      string     `json:"remoteUrl"`
	CurrentBranch  string     `json:"currentBranch"`
	CommitCount    int        `json:"commitCount"`
	LastCommitDate *time.Time `json:"lastCommitDate,omitempty"`
	HasUncommitted bool       `json:"hasUncommitted"`
	Ahead          int        `json:"ahead"`
	Behind         int        `json:"behind"`
}

type ProjectMeta struct {
	Framework      string    `json:"framework,omitempty"`
	PackageManager string    `json:"packageManager,omitempty"`
	LastOpened     time.Time `json:"lastOpened"`
	CreatedAt      time.Time `json:"createdAt"`
}

type Project struct {
	ID       string      `json:"id"`
	Name     string      `json:"name"`
	Path     string      `json:"path"`
	Git      *GitInfo    `json:"git,omitempty"`
	Meta     ProjectMeta `json:"meta"`
	Status   string      `json:"status"`
	Category string      `json:"category"`
	Pinned   bool        `json:"pinned"`
	Notes    string      `json:"notes,omitempty"`
}

type Settings struct {
	Theme         string   `json:"theme"`
	DefaultEditor string   `json:"defaultEditor"`
	ScanPaths     []string `json:"scanPaths"`
}

type DatabaseData struct {
	Projects []Project `json:"projects"`
	Settings Settings  `json:"settings"`
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	homeDir, _ := os.UserHomeDir()
	dataDir := filepath.Join(homeDir, ".code-project-manager")
	os.MkdirAll(dataDir, 0755)
	a.dataPath = filepath.Join(dataDir, "data.json")
	a.loadData()
}

func (a *App) loadData() {
	defaultData := &DatabaseData{
		Projects: []Project{},
		Settings: Settings{
			Theme:         "dark",
			DefaultEditor: "vscode",
			ScanPaths:     []string{},
		},
	}

	data, err := os.ReadFile(a.dataPath)
	if err != nil {
		a.data = defaultData
		a.saveData()
		return
	}

	a.data = defaultData
	json.Unmarshal(data, a.data)
}

func (a *App) saveData() {
	data, _ := json.MarshalIndent(a.data, "", "  ")
	os.WriteFile(a.dataPath, data, 0644)
}

func generateID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// API Methods

func (a *App) GetProjects() []Project {
	projects := make([]Project, len(a.data.Projects))
	copy(projects, a.data.Projects)
	sort.Slice(projects, func(i, j int) bool {
		return projects[i].Meta.LastOpened.After(projects[j].Meta.LastOpened)
	})
	return projects
}

func (a *App) SyncProjects() []Project {
	for _, scanPath := range a.data.Settings.ScanPaths {
		a.scanDirectory(scanPath)
	}
	return a.GetProjects()
}

func (a *App) scanDirectory(dirPath string) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return
	}

	for _, entry := range entries {
		if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}
		fullPath := filepath.Join(dirPath, entry.Name())
		if !a.isProjectDirectory(fullPath) {
			continue
		}
		if a.getProjectByPath(fullPath) != nil {
			continue
		}
		project := a.createProjectFromPath(fullPath)
		a.data.Projects = append(a.data.Projects, project)
	}
	a.saveData()
}

func (a *App) isProjectDirectory(dirPath string) bool {
	indicators := []string{".git", "package.json", "Cargo.toml", "go.mod", "requirements.txt", "pyproject.toml", "pom.xml", "build.gradle"}
	for _, ind := range indicators {
		if _, err := os.Stat(filepath.Join(dirPath, ind)); err == nil {
			return true
		}
	}
	return false
}

func (a *App) getProjectByPath(path string) *Project {
	normalizedPath := strings.ToLower(filepath.Clean(path))
	for i := range a.data.Projects {
		if strings.ToLower(filepath.Clean(a.data.Projects[i].Path)) == normalizedPath {
			return &a.data.Projects[i]
		}
	}
	return nil
}

func (a *App) createProjectFromPath(projectPath string) Project {
	name := filepath.Base(projectPath)
	gitInfo := a.getGitInfo(projectPath)
	framework := a.detectFramework(projectPath)
	pkgManager := a.detectPackageManager(projectPath)

	info, _ := os.Stat(projectPath)
	createdAt := time.Now()
	if info != nil {
		createdAt = info.ModTime()
	}

	return Project{
		ID:   generateID(),
		Name: name,
		Path: projectPath,
		Git:  gitInfo,
		Meta: ProjectMeta{
			Framework:      framework,
			PackageManager: pkgManager,
			LastOpened:     time.Now(),
			CreatedAt:      createdAt,
		},
		Status: "active",
	}
}

func (a *App) getGitInfo(projectPath string) *GitInfo {
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return nil
	}

	head, err := repo.Head()
	if err != nil {
		return nil
	}

	info := &GitInfo{
		CurrentBranch: head.Name().Short(),
	}

	remotes, _ := repo.Remotes()
	if len(remotes) > 0 && len(remotes[0].Config().URLs) > 0 {
		info.RemoteUrl = remotes[0].Config().URLs[0]
	}

	wt, err := repo.Worktree()
	if err == nil {
		status, err := wt.Status()
		if err == nil {
			info.HasUncommitted = !status.IsClean()
		}
	}

	iter, err := repo.Log(&git.LogOptions{})
	if err == nil {
		count := 0
		iter.ForEach(func(c *object.Commit) error {
			if count == 0 {
				t := c.Author.When
				info.LastCommitDate = &t
			}
			count++
			return nil
		})
		info.CommitCount = count
	}

	return info
}

func (a *App) detectFramework(projectPath string) string {
	pkgPath := filepath.Join(projectPath, "package.json")
	if data, err := os.ReadFile(pkgPath); err == nil {
		var pkg map[string]interface{}
		if json.Unmarshal(data, &pkg) == nil {
			deps := make(map[string]bool)
			if d, ok := pkg["dependencies"].(map[string]interface{}); ok {
				for k := range d {
					deps[k] = true
				}
			}
			if d, ok := pkg["devDependencies"].(map[string]interface{}); ok {
				for k := range d {
					deps[k] = true
				}
			}
			switch {
			case deps["next"]:
				return "Next.js"
			case deps["nuxt"]:
				return "Nuxt"
			case deps["@angular/core"]:
				return "Angular"
			case deps["vue"]:
				return "Vue"
			case deps["react"]:
				return "React"
			case deps["svelte"]:
				return "Svelte"
			case deps["electron"]:
				return "Electron"
			case deps["express"]:
				return "Express"
			default:
				return "Node.js"
			}
		}
	}

	checks := map[string]string{
		"Cargo.toml":       "Rust",
		"go.mod":           "Go",
		"requirements.txt": "Python",
		"pyproject.toml":   "Python",
		"pom.xml":          "Java",
		"build.gradle":     "Java",
	}
	for file, fw := range checks {
		if _, err := os.Stat(filepath.Join(projectPath, file)); err == nil {
			return fw
		}
	}
	return ""
}

func (a *App) detectPackageManager(projectPath string) string {
	checks := map[string]string{
		"pnpm-lock.yaml":    "pnpm",
		"yarn.lock":         "yarn",
		"package-lock.json": "npm",
		"bun.lockb":         "bun",
	}
	for file, pm := range checks {
		if _, err := os.Stat(filepath.Join(projectPath, file)); err == nil {
			return pm
		}
	}
	return ""
}

func (a *App) UpdateProject(id string, updates map[string]interface{}) *Project {
	for i := range a.data.Projects {
		if a.data.Projects[i].ID == id {
			p := &a.data.Projects[i]
			if v, ok := updates["status"].(string); ok {
				p.Status = v
			}
			if v, ok := updates["category"].(string); ok {
				p.Category = v
			}
			if v, ok := updates["pinned"].(bool); ok {
				p.Pinned = v
			}
			if v, ok := updates["notes"].(string); ok {
				p.Notes = v
			}
			p.Meta.LastOpened = time.Now()
			a.saveData()
			return p
		}
	}
	return nil
}

func (a *App) DeleteProject(id string) bool {
	for i := range a.data.Projects {
		if a.data.Projects[i].ID == id {
			a.data.Projects = append(a.data.Projects[:i], a.data.Projects[i+1:]...)
			a.saveData()
			return true
		}
	}
	return false
}

func (a *App) GetSettings() Settings {
	return a.data.Settings
}

func (a *App) AddScanPath(path string) Settings {
	for _, p := range a.data.Settings.ScanPaths {
		if p == path {
			return a.data.Settings
		}
	}
	a.data.Settings.ScanPaths = append(a.data.Settings.ScanPaths, path)
	a.saveData()
	return a.data.Settings
}

func (a *App) RemoveScanPath(path string) Settings {
	paths := []string{}
	for _, p := range a.data.Settings.ScanPaths {
		if p != path {
			paths = append(paths, p)
		}
	}
	a.data.Settings.ScanPaths = paths

	projects := []Project{}
	for _, p := range a.data.Projects {
		if !strings.HasPrefix(p.Path, path) {
			projects = append(projects, p)
		}
	}
	a.data.Projects = projects

	a.saveData()
	return a.data.Settings
}

func (a *App) SelectFolder() string {
	path, _ := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "选择项目目录",
	})
	return path
}

func (a *App) OpenInEditor(projectPath string, editor string) {
	var cmd *exec.Cmd
	switch editor {
	case "cursor":
		cmd = exec.Command("cursor", projectPath)
	case "webstorm":
		cmd = exec.Command("webstorm", projectPath)
	case "sublime":
		cmd = exec.Command("subl", projectPath)
	default:
		cmd = exec.Command("code", projectPath)
	}
	cmd.Start()
}

func (a *App) OpenInExplorer(projectPath string) {
	var cmd *exec.Cmd
	switch goruntime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", projectPath)
	case "darwin":
		cmd = exec.Command("open", projectPath)
	default:
		cmd = exec.Command("xdg-open", projectPath)
	}
	cmd.Start()
}

func (a *App) OpenInTerminal(projectPath string) {
	var cmd *exec.Cmd
	switch goruntime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", "cmd", "/k", "cd", "/d", projectPath)
	case "darwin":
		cmd = exec.Command("open", "-a", "Terminal", projectPath)
	default:
		cmd = exec.Command("x-terminal-emulator", "--working-directory="+projectPath)
	}
	cmd.Start()
}

func (a *App) RefreshProject(id string) *Project {
	for i := range a.data.Projects {
		if a.data.Projects[i].ID == id {
			p := &a.data.Projects[i]
			p.Git = a.getGitInfo(p.Path)
			p.Meta.Framework = a.detectFramework(p.Path)
			a.saveData()
			return p
		}
	}
	return nil
}
