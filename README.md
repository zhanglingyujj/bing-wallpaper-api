<div align="center">

# 🌄 Bing Wallpaper D1 Worker

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1-F38020?style=for-the-badge&logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

**一个极简、高性能的 Serverless 壁纸 API 服务**

通过 Cloudflare Workers 每日自动抓取 Bing 绝美壁纸，
利用 D1 数据库实现永久存储，提供毫秒级响应的 API 接口。

[功能特性](#-功能特性) • [部署指南](#-部署指南) • [API 文档](#-api-文档) • [本地开发](#-本地开发)

</div>

---

## ✨ 功能特性

| 功能 | 描述 |
| :--- | :--- |
| 🤖 **全自动抓取** | 配置 Cron Triggers，每日零干预自动同步 Bing 最新壁纸。 |
| 💾 **永久存储** | 基于 D1 (Serverless SQLite)，数据不再丢失，构建你的专属壁纸库。 |
| ⚡ **边缘计算** | 部署于 Cloudflare 全球网络，无论用户身在何处，访问速度都极快。 |
| 🔌 **灵活接口** | 支持 JSON 元数据返回、直接图片重定向、历史归档查询等多种模式。 |

---

## 🚀 部署指南

本项目支持 **纯网页端部署** (小白友好) 和 **命令行部署** (开发者) 两种方式。

<details open>
<summary><h3>☁️ 方式一：网页端部署 (推荐，无需环境)</h3></summary>

无需安装 Node.js 或 Git，只需通过浏览器即可完成。

#### 1. 创建 Worker
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 导航至 **Workers & Pages** > **Create application** > **Create Worker**。
3. 命名为 `bing-wallpaper`，点击 **Deploy**。
4. 点击 **Edit code**，将 `src/index.js` 的内容全选复制，粘贴覆盖在线编辑器代码。
5. 点击右上角 **Save and deploy**。

#### 2. 创建数据库
1. 左侧菜单选择 **Workers & Pages** > **D1**。
2. 点击 **Create database**，命名为 `bing-wallpapers`，点击 **Create**。
3. 进入该数据库，点击 **Console** 标签页。
4. 复制 `schema.sql` 内容并粘贴执行，看到 "Success" 即成功。

#### 3. 绑定数据库 (关键)
1. 回到 Worker (`bing-wallpaper`) 设置页面。
2. 点击 **Settings** > **Variables**。
3. 在 **D1 Database Bindings** 点击 **Add binding**：
    - **Variable name**: `DB` (必须大写)
    - **D1 database**: 选择 `bing-wallpapers`
4. 点击 **Save and deploy**。

#### 4. 设置定时任务
1. 点击 **Settings** > **Triggers** > **Add Cron Trigger**。
2. 输入 `0 8 * * *` (每日 UTC 08:00)，点击 **Add Trigger**。

</details>

<details>
<summary><h3>💻 方式二：命令行部署 (CLI)</h3></summary>

适合熟悉开发工具的用户。

**1. 环境准备**
```bash
npm install
npx wrangler login
```

**2. 创建数据库**
```bash
npx wrangler d1 create bing-wallpapers
# 复制输出的 database_id
```

**3. 修改配置**
编辑 `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "bing-wallpapers"
database_id = "你的-DATABASE-ID" # 替换此处
```

**4. 初始化 & 部署**
```bash
# 初始化表结构
npx wrangler d1 execute bing-wallpapers --remote --file=./schema.sql

# 发布
npx wrangler deploy
```

</details>

---

## 🔌 API 文档

假设你的 Worker 域名为: `https://bing.example.workers.dev`

### 1. 获取壁纸 (最新)

| 场景 | 端点 | 说明 |
| :--- | :--- | :--- |
| **网页引用** | `/` 或 `/latest` | **302 重定向** 至今日图片 URL。可以直接放入 `<img src="...">`。 |
| **数据获取** | `/api/today` | 返回包含版权、标题、URL 的 **JSON** 数据。 |

### 2. 随机回顾

| 场景 | 端点 | 说明 |
| :--- | :--- | :--- |
| **发现惊喜** | `/random` | **302 重定向** 至历史库中随机一张图片。 |
| **获取信息** | `/api/random` | 返回随机一张图片的元数据 **JSON**。 |

### 3. 历史归档

**端点**: `/api/archive`

| 参数 | 类型 | 默认 | 说明 |
| :--- | :--- | :--- | :--- |
| `page` | Number | `1` | 页码 |
| `limit` | Number | `10` | 每页数量 |

---

## 🛠️ 本地开发

如果你想在本地进行修改和调试：

```bash
# 启动本地开发服务器 (自动模拟 D1)
npm run dev
```

> **Note**: 首次运行时，需执行 `npm run db:init` (在 package.json 中定义) 或手动执行 `--local` 的 D1 初始化命令。

---

## 📂 项目结构

```text
.
├── src/
│   └── index.js      # ⚡ Worker 核心逻辑
├── schema.sql        # 🗄️ 数据库表结构
├── wrangler.toml     # ⚙️ Cloudflare 配置文件
├── package.json      # 📦 依赖管理
└── README.md         # 📖 说明文档
```

---

<div align="center">
  <sub>Built with ❤️ using Cloudflare Workers & D1</sub>
</div>
