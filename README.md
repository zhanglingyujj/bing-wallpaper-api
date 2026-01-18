# Bing Wallpaper D1 Worker 🌄

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=flat-square&logo=cloudflare)
![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1-blue?style=flat-square&logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

一个基于 **Cloudflare Workers** 和 **D1 数据库** 构建的 Bing 每日壁纸 API 服务。
它能够自动抓取 Bing 每日美图，将其归档到数据库，并提供强大的 API 接口，支持随机回顾和历史归档查询。

---

## ✨ 功能特性

- **🤖 自动抓取**：利用 Cron Triggers 每日定时自动拉取 Bing 最新壁纸。
- **💾 数据持久化**：使用 Cloudflare D1 (SQLite) 数据库永久保存壁纸元数据。
- **⚡ 高性能**：部署在 Cloudflare 边缘网络，全球低延迟访问。
- **🔌 丰富接口**：
    - 📅 **每日壁纸**：获取最新壁纸，支持 JSON 数据或直接图片重定向。
    - 🎲 **随机回顾**：从历史库中随机返回一张壁纸。
    - 📂 **历史归档**：分页查询所有历史壁纸数据。

## 目录

- [快速开始](#-快速开始)
- [部署指南](#-部署指南)
- [API 文档](#-api-文档)
- [本地开发](#-本地开发)
- [项目结构](#-项目结构)

---

## 🚀 快速开始

### 前置要求
- [Node.js](https://nodejs.org/) (v16+)
- Cloudflare 账号

### 1. 安装依赖
```bash
npm install
```

### 2. 登录 Cloudflare
```bash
npx wrangler login
```

---

## ☁️ 部署指南

### 1. 创建 D1 数据库
```bash
npx wrangler d1 create bing-wallpapers
```
> ⚠️ **注意**：执行后请复制控制台输出的 `database_id`。

### 2. 配置项目
打开 `wrangler.toml` 文件，修改 `database_id`：
```toml
[[d1_databases]]
binding = "DB"
database_name = "bing-wallpapers"
database_id = "你的-DATABASE-ID-粘贴在这里" # <--- 替换此处
```

### 3. 初始化数据库
**这是最关键的一步！** 必须创建表结构才能正常运行。

**线上环境 (Deploy):**
```bash
npx wrangler d1 execute bing-wallpapers --remote --file=./schema.sql
```

**本地环境 (Dev):**
```bash
npx wrangler d1 execute bing-wallpapers --local --file=./schema.sql
```
> 如果遇到 `no such table: wallpapers` 错误，就是因为漏掉了这一步。

### 4. 发布上线
```bash
npx wrangler deploy
```
部署成功后，你将获得一个形如 `https://bing-wallpaper.<你的子域名>.workers.dev` 的访问地址。

---

## 🔌 API 文档

基础 URL: `https://你的域名.workers.dev`

### 1. 每日壁纸

| 接口 | 方法 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `/` 或 `/latest` | `GET` | **重定向**到今日壁纸图片 URL (适合 `<img>` 标签) | `<img src="https://.../latest" />` |
| `/api/today` | `GET` | 返回今日壁纸的 **JSON 元数据** | [查看响应](#json-响应示例) |

### 2. 随机壁纸

| 接口 | 方法 | 说明 |
| :--- | :--- | :--- |
| `/random` | `GET` | **重定向**到数据库中随机一张历史壁纸图片 URL |
| `/api/random` | `GET` | 返回随机一张壁纸的 **JSON 元数据** |

### 3. 历史归档

| 接口 | 方法 | 参数 | 说明 |
| :--- | :--- | :--- | :--- |
| `/api/archive` | `GET` | `page` (默认1), `limit` (默认10) | 分页获取历史壁纸列表 |

#### JSON 响应示例
`/api/today` 或 `/api/random` 的返回格式：
```json
{
  "date": "20231027",
  "title": "Autumn in the Mountains",
  "copyright": "© Photographer/Agency",
  "url": "/th?id=OHR.Example_1920x1080.jpg",
  "json": "{...raw_bing_data...}",
  "created_at": "2023-10-27T08:00:00Z"
}
```

---

## 🛠️ 本地开发

启动本地开发服务器进行调试：
```bash
npm run dev
```
本地服务通常运行在 `http://localhost:8787`。

> **提示**：首次运行时，请确保已执行过 `--local` 的数据库初始化命令。

## ⏰ 定时任务
项目配置了 **Cron Trigger**，将于每天 **UTC 08:00** 自动触发抓取任务。
```toml
[triggers]
crons = ["0 8 * * *"]
```

## 📂 项目结构
```text
.
├── src/
│   └── index.js      # Worker 核心逻辑
├── schema.sql        # 数据库表结构
├── wrangler.toml     # Cloudflare 配置文件
├── package.json      # 依赖管理
└── README.md         # 说明文档
```

---
*Built with ❤️ using Cloudflare Workers & D1*
