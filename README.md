# 科晟智慧学习系统 (Korson Academy)

基于 AI 驱动的现代化金融考研学习管理系统，集成了深度学术咨询、艾宾浩斯智能测试及实时共学社区。

## 核心功能

### 1. AI 学术助教矩阵
- **多模型支持**：集成 DeepSeek-Chat / Reasoner，支持深度逻辑推理。
- **自定义机器人**：管理员可自由部署具有不同性格和专业背景的 AI 助教。
- **LaTeX 渲染**：完美支持数学公式、经济学模型的渲染与展示。
- **Prompt 钩稽**：后端模板文件与数据库实时同步，确保指令集精准执行。

### 2. 学术天梯 (ELO 测试系统)
- **智能抽题**：基于艾宾浩斯记忆曲线，优先抽取用户遗忘节点题目。
- **AI 自动评分**：主观题（名词解释、简答、论述）由 AI 依据得分点自动精准判分。
- **ELO 积分体系**：动态量化学习能力，实时全站学术排名。
- **结构化知识点**：题目关联后端结构化数据（公式库、定义集），实现知识共享。

### 3. 沉浸式自习室
- **番茄钟专注**：可视化的任务目标与时长管理。
- **动态广播**：实时同步全站学友的专注状态（可配置隐私保护）。
- **实时讨论区**：学术交流与共学陪伴。

## 技术栈

- **前端**：React 18 + TypeScript + TailwindCSS + Lucide Icons + Shadcn UI
- **后端**：Django 4.2 + Django REST Framework + PostgreSQL
- **AI 引擎**：DeepSeek API
- **部署**：支持 Docker 化部署，具备完整的环境隔离。

## 快速开始

### 后端配置
1. 安装依赖：`pip install -r requirements.txt`
2. 配置 `.env`：填入 `DEEPSEEK_API_KEY` 及数据库信息。
3. 执行迁移：`python manage.py migrate`
4. 启动：`python manage.py runserver`

### 前端配置
1. 安装依赖：`npm install`
2. 启动开发环境：`npm run dev`

## 管理员指南
- **机器人管理**：在“维护中心”部署新机器人，定义其 System Prompt。
- **题目入库**：支持批量入库及结构化知识点挂载，AI 将自动为缺失答案的题目生成解析。
- **资源审计**：全权管理课程媒体与学术文章。

## 开发与同步指南

系统通过 GitHub 进行代码托管与同步。

### 1. 本地推送到服务器 (开发完成)
在本地执行：
\`\`\`bash
git add .
git commit -m "feat: 新功能描述"
git push origin main
\`\`\`

### 2. 服务器更新 (部署更新)
SSH 登录服务器后执行：
\`\`\`bash
cd /opt/korson-ai-web
git pull origin main
# 后端有变更时：
# backend/venv/bin/python backend/manage.py migrate
# systemctl restart korson-ai-web
# 前端有变更时：
# cd frontend && VITE_API_URL=https://www.korsonedu.com/api VITE_GIPHY_API_KEY=9pr9qW2ISY8cIz1AGhgyB7SE7xLuDafc npx vite build
\`\`\`

---
*知行网校 - 让每一分钟的努力都清晰可见*
