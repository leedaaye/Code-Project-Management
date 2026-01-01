# Code Project Manager

本地代码项目管理工具（Web 版），用于集中管理和快速访问本地代码项目。

## 功能特性

- **项目扫描**：自动扫描指定目录下的代码项目
- **Git 集成**：显示分支、未提交更改、ahead/behind 状态
- **快速操作**：一键在 VSCode、终端、资源管理器中打开项目
- **项目分类**：按状态（进行中/暂停/已完成/归档）和类别筛选
- **搜索过滤**：按项目名称、路径、框架快速搜索
- **项目置顶**：重要项目可置顶显示

## 技术栈

- **后端**：Express.js + TypeScript
- **前端**：Vue 3 + Vite + TypeScript
- **Git 操作**：simple-git

## 项目结构

```
src/
├── server/                 # 后端服务
│   ├── index.ts           # Express 入口
│   └── services/
│       ├── database-service.ts   # JSON 数据持久化
│       └── project-service.ts    # 项目扫描与管理
├── renderer/              # 前端界面
│   ├── App.vue           # 主组件
│   ├── components/       # UI 组件
│   └── styles/           # 样式文件
└── shared/               # 共享类型定义
    └── types.ts
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（前后端同时启动）
npm run dev

# 分别启动
npm run dev:server   # 后端 http://localhost:3000
npm run dev:client   # 前端 http://localhost:5173
```

## 构建

```bash
npm run build
```

构建产物：
- `dist/server/` - 后端编译输出
- `dist/renderer/` - 前端静态文件

## Linux 服务器部署

### 1. 环境准备

```bash
# 安装 Node.js (推荐 v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Git（项目扫描需要）
sudo apt-get install -y git

# 验证安装
node -v
npm -v
git --version
```

### 2. 部署项目

```bash
# 克隆或上传项目
cd /opt
git clone <your-repo-url> code-project-manager
cd code-project-manager

# 安装依赖
npm install --production

# 构建
npm run build
```

### 3. 配置环境变量（可选）

```bash
# 创建环境配置
cat > .env << EOF
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
EOF
```

### 4. 启动服务

```bash
# 直接启动
npm start

# 或使用 node
node dist/server/index.js
```

## 持久化运行

### 方式一：PM2（推荐）

```bash
# 安装 PM2
sudo npm install -g pm2

# 启动服务
pm2 start dist/server/index.js --name "code-project-manager"

# 设置开机自启
pm2 startup
pm2 save

# 常用命令
pm2 status              # 查看状态
pm2 logs                # 查看日志
pm2 restart code-project-manager   # 重启
pm2 stop code-project-manager      # 停止
pm2 delete code-project-manager    # 删除
```

### 方式二：Systemd

```bash
# 创建服务文件
sudo cat > /etc/systemd/system/code-project-manager.service << EOF
[Unit]
Description=Code Project Manager
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/code-project-manager
ExecStart=/usr/bin/node dist/server/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable code-project-manager
sudo systemctl start code-project-manager

# 常用命令
sudo systemctl status code-project-manager   # 查看状态
sudo systemctl restart code-project-manager  # 重启
sudo systemctl stop code-project-manager     # 停止
journalctl -u code-project-manager -f        # 查看日志
```

### 方式三：Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000
CMD ["node", "dist/server/index.js"]
```

```bash
# 构建镜像
docker build -t code-project-manager .

# 运行容器
docker run -d \
  --name code-project-manager \
  -p 3000:3000 \
  -v ~/.code-project-manager:/root/.code-project-manager \
  --restart unless-stopped \
  code-project-manager
```

## Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 数据存储

应用数据存储在用户目录：`~/.code-project-manager/data.json`

包含：
- 项目列表及元信息
- 扫描路径配置
- 标签和分类设置

## License

MIT
