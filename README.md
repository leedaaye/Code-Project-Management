# Code Project Manager

一个简洁的本地代码项目管理工具，帮助你快速浏览和管理所有代码项目。

## 功能

- 自动扫描指定目录下的代码项目
- 显示项目的 Git 状态（分支、未提交更改等）
- 自动识别项目框架（React、Vue、Go、Python 等）
- 快速用 VSCode 打开项目
- 在终端或文件管理器中打开项目
- 项目置顶、状态标记

## 下载使用

### Windows 用户

1. 从 [Releases](https://github.com/leedaaye/Code-Project-Management/releases) 下载最新的 `CodeProjectManager.exe`
2. 双击运行即可

### 从源码构建

#### 前置要求

- [Go](https://go.dev/dl/) 1.21+
- [Node.js](https://nodejs.org/) 18+
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

```bash
# 安装 Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

#### 构建步骤

```bash
# 克隆项目
git clone https://github.com/leedaaye/Code-Project-Management.git
cd Code-Project-Management

# 安装前端依赖
cd frontend && npm install && cd ..

# 构建
wails build
```

构建完成后，可执行文件位于 `build/bin/CodeProjectManager.exe`

## 使用说明

1. **添加项目目录**：点击"添加项目"按钮，选择存放代码项目的文件夹（如 `D:\Projects`）
2. **自动扫描**：程序会自动扫描该目录下的所有代码项目
3. **打开项目**：双击项目卡片用 VSCode 打开，或右键查看更多选项
4. **刷新**：点击"刷新"按钮重新扫描项目

## 数据存储

项目数据保存在用户目录下：
- Windows: `C:\Users\<用户名>\.code-project-manager\data.json`
- macOS: `~/.code-project-manager/data.json`

## 技术栈

- 后端：Go + Wails
- 前端：Vue 3 + TypeScript
- Git 操作：go-git

## License

MIT
