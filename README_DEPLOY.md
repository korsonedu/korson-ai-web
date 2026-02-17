# 知行网校 (Scholarly School System) 正式部署手册

本手册旨在指导教研与技术团队将系统顺利部署至云服务器（腾讯云/阿里云/华为云等，推荐 Ubuntu 22.04+）。

---

## 1. 系统架构概览
*   **前端**: React + Vite + TailwindCSS (静态部署)
*   **后端**: Django 5.0 + Django REST Framework + Channels (ASGI)
*   **数据库**: PostgreSQL (生产推荐) 或 SQLite (小型快速起步)
*   **缓存/消息队列**: Redis (用于 WebSocket 和 异步任务状态)
*   **AI 引擎**: DeepSeek-Chat / DeepSeek-Reasoning

---

## 2. 环境准备 (云服务器)

### 2.1 安装基础依赖
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx redis-server git
```

### 2.2 启动 Redis
```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

---

## 3. 后端部署 (Django ASGI)

### 3.1 环境变量配置
在 `backend/` 目录下创建 `.env` 文件：
```env
DEEPSEEK_API_KEY=您的API密钥
DEBUG=False
ALLOWED_HOSTS=您的域名,服务器IP
DATABASE_URL=postgres://user:password@localhost:5432/dbname (若用PG)
REDIS_URL=redis://127.0.0.1:63700/0
```

### 3.2 初始化环境
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

### 3.3 使用 Daphne 启动 ASGI 服务 (支持 WebSocket)
```bash
pip install daphne
daphne -b 0.0.0.0 -p 8000 school_system.asgi:application
```
*(生产环境建议使用 Gunicorn + Uvicorn 或是 Systemd 守护进程运行)*

---

## 4. 前端部署 (Vite)

### 4.1 编译静态文件
在本地或服务器执行：
```bash
cd frontend
npm install
npm run build
```
编译产物位于 `frontend/dist` 目录下。

---

## 5. Nginx 核心配置 (关键)

配置 Nginx 以支持静态文件、API 代理及 **WebSocket 升级连接**：

```nginx
server {
    listen 80;
    server_name your_domain.com;

    # 1. 前端静态页面
    location / {
        root /path/to/your/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 2. 媒体文件 (上传的视频、头像)
    location /media/ {
        alias /path/to/your/backend/media/;
    }

    # 3. 后端 API 接口
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 4. WebSocket 转发 (自习室/实时通知)
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 6. AI 提示词调优 (物理文件)
本系统支持物理提示词钩稽。部署后，您可以在以下目录直接修改 `.txt` 文件实时生效：
*   `backend/quizzes/templates/*.txt` (题库逻辑)
*   `backend/ai_assistant/templates/bots/bot_*.txt` (具体机器人人格)

---

## 7. 故障排查 (FAQ)
*   **500 错误**: 检查 `.env` 中的 AI 密钥是否正确，以及 Redis 是否启动。
*   **WebSocket 连接失败**: 检查 Nginx 是否配置了 `Upgrade` 头部，以及后端是否由 Daphne/Uvicorn 启动。
*   **上传大文件超时**: 修改 Nginx `client_max_body_size 100M;` 和后端超时设置。

---
知行网校 - 技术委员会 2026.02
