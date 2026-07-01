# 教材ING - 智能教材查询与管理平台

> 校园信息服务平台，让信息查询变得简单高效

[![Version](https://img.shields.io/badge/version-12.0.0-blue.svg)](https://github.com/w020316/Textbook-ING-Smart-Textbook-Query-and-Management-Platform)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.5-42b883.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)

## 项目简介

教材ING 是面向高校师生的校园信息服务平台，核心解决教材信息查询困难、教学日历不透明、校园资讯分散三大痛点。平台提供教材多维度查询、校历教学周查看、新闻资讯浏览等功能，支持用户注册登录、积分系统、消息通知等完整用户体验。

### 核心功能

- **教材查询** — 按学院/专业/班级/学期多维度筛选，关键词搜索，热门搜索推荐
- **校历查询** — 学期教学周时间轴展示，开学/考试/假期节点高亮标注
- **新闻资讯** — 5 大分类（通知公告/活动资讯/系统更新/学习资源/校园生活），置顶推荐，评论互动
- **用户系统** — 邮箱注册登录，验证码验证，忘记密码重置，积分体系（注册赠 100 积分）
- **消息通知** — 系统消息推送，未读消息首页滚动栏提醒

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端框架 | Vue 3.5 + TypeScript 5.7 |
| 构建工具 | Vite 6.0 |
| 样式方案 | TailwindCSS 3.4 |
| 路由 | Vue Router 4.5（Hash 模式） |
| 状态管理 | Pinia 2.3 |
| HTTP 客户端 | Axios 1.7 |
| 后端 | Vercel Serverless Functions（Node.js） |
| 数据库 | Neon PostgreSQL + Prisma ORM 6.2 |
| 认证 | JWT + bcryptjs |
| 部署 | Vercel（前端 + API）+ Neon（数据库） |

## 项目结构

```
教材ING智能教材查询与管理平台/
├── api/                         # Vercel Serverless Functions
│   ├── _lib.ts                  # 共享工具库（Prisma/Auth/Response）
│   └── [...slug].ts             # 主路由（25+ API 端点）
├── docs/                        # 开发文档
│   ├── PRD.md                   # 产品需求文档
│   ├── DESIGN-SPEC.md           # 设计规范文档
│   ├── TASK-BREAKDOWN.md        # 开发任务分解
│   └── TEST-PLAN.md             # 测试计划
├── prisma/                      # 数据库
│   ├── schema.prisma            # Prisma Schema（13 个数据模型）
│   └── seed.ts                  # 种子数据
├── public/                      # 静态资源
│   └── favicon.svg              # 网站图标
├── src/                         # 前端源码
│   ├── assets/                  # 静态资源
│   ├── components/              # 公共组件
│   │   ├── AppHeader.vue        # 顶部导航
│   │   ├── AppFooter.vue        # 底部信息
│   │   ├── NewsCard.vue         # 新闻卡片
│   │   └── Pagination.vue       # 分页组件
│   ├── layouts/                 # 布局
│   │   ├── DefaultLayout.vue    # 主布局（Header + Content + Footer）
│   │   └── AuthLayout.vue       # 认证布局（居中卡片）
│   ├── router/                  # 路由配置
│   │   └── index.ts             # 路由表 + 守卫
│   ├── stores/                  # Pinia 状态管理
│   │   ├── auth.ts              # 认证状态
│   │   └── app.ts               # 应用状态（统计/消息）
│   ├── types/                   # TypeScript 类型定义
│   │   └── index.ts             # 全局类型
│   ├── utils/                   # 工具函数
│   │   └── request.ts           # Axios HTTP 封装
│   ├── views/                   # 页面视图
│   │   ├── HomeView.vue         # 首页
│   │   ├── LoginView.vue        # 登录
│   │   ├── RegisterView.vue     # 注册
│   │   ├── ForgotPasswordView.vue # 忘记密码
│   │   ├── SearchView.vue       # 教材查询
│   │   ├── CalendarView.vue     # 校历查询
│   │   ├── NewsListView.vue     # 新闻列表
│   │   ├── NewsDetailView.vue   # 新闻详情
│   │   ├── AboutView.vue        # 关于
│   │   └── NotFoundView.vue     # 404
│   ├── App.vue                  # 根组件
│   ├── main.ts                  # 应用入口
│   └── style.css                # 全局样式（TailwindCSS）
├── .env.example                 # 环境变量模板
├── .gitignore                   # Git 忽略配置
├── index.html                   # HTML 入口
├── package.json                 # 项目依赖
├── postcss.config.js            # PostCSS 配置
├── tailwind.config.js           # TailwindCSS 配置
├── tsconfig.json                # TypeScript 配置
├── tsconfig.node.json           # Node TypeScript 配置
├── vercel.json                  # Vercel 部署配置
└── vite.config.ts               # Vite 构建配置
```

## 快速开始

### 环境要求

- Node.js >= 18.0
- npm >= 9.0
- PostgreSQL 数据库（推荐 [Neon](https://neon.tech) 免费方案）

### 安装

```bash
# 1. 克隆仓库
git clone https://github.com/w020316/Textbook-ING-Smart-Textbook-Query-and-Management-Platform.git
cd Textbook-ING-Smart-Textbook-Query-and-Management-Platform

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写数据库连接字符串和 JWT 密钥

# 4. 生成 Prisma 客户端
npx prisma generate

# 5. 创建数据库表结构
npx prisma db push

# 6. 初始化种子数据
npm run db:seed

# 7. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 即可查看应用。

### 默认账号

种子数据会创建一个管理员账号：

| 字段 | 值 |
| --- | --- |
| 邮箱 | `admin@textbook-ing.com` |
| 密码 | `admin123` |

## 开发命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器（端口 3000） |
| `npm run build` | 构建生产版本（TypeScript 检查 + Vite 打包） |
| `npm run preview` | 预览生产构建 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run db:generate` | 生成 Prisma 客户端 |
| `npm run db:push` | 推送 Schema 到数据库 |
| `npm run db:seed` | 初始化种子数据 |
| `npm run db:migrate` | 创建数据库迁移 |

## 环境变量

| 变量名 | 说明 | 示例 |
| --- | --- | --- |
| `DATABASE_URL` | Neon PostgreSQL 池化连接字符串 | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | Neon PostgreSQL 直连字符串（用于迁移） | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` |
| `JWT_SECRET` | JWT 签名密钥 | `your-random-secret-key` |
| `VITE_API_BASE` | 前端 API 基础路径 | `/api` |

## API 接口

### 统一响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": 1719800000000
}
```

| code | 含义 |
| --- | --- |
| 0 | 成功 |
| 1 | 参数错误 |
| 2 | 未认证 |
| 3 | 无权限 |
| 4 | 资源不存在 |
| 5 | 服务器错误 |

### 主要端点

| 方法 | 路径 | 说明 | 认证 |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/send-code` | 发送验证码 | 否 |
| POST | `/api/auth/forgot-password` | 忘记密码 | 否 |
| POST | `/api/auth/reset-password` | 重置密码 | 否 |
| GET | `/api/auth/me` | 获取当前用户 | 是 |
| GET | `/api/textbooks` | 教材查询 | 是 |
| GET | `/api/textbooks/:id` | 教材详情 | 是 |
| GET | `/api/textbooks/hot-searches` | 热门搜索 | 是 |
| GET | `/api/colleges` | 学院列表 | 是 |
| GET | `/api/colleges/:id/majors` | 专业列表 | 是 |
| GET | `/api/majors/:id/classes` | 班级列表 | 是 |
| GET | `/api/semesters` | 学期列表 | 否 |
| GET | `/api/calendar` | 校历查询 | 否 |
| GET | `/api/news` | 新闻列表 | 否 |
| GET | `/api/news/:id` | 新闻详情 | 否 |
| GET | `/api/news/categories` | 新闻分类 | 否 |
| POST | `/api/news/:id/comments` | 发表评论 | 是 |
| GET | `/api/stats` | 平台统计 | 否 |
| GET | `/api/points/balance` | 积分余额 | 是 |
| GET | `/api/messages` | 消息列表 | 是 |

完整 API 文档详见 [docs/PRD.md](docs/PRD.md)。

## 部署指南

### 1. 创建 Neon 数据库

1. 访问 [Neon](https://neon.tech) 注册账号
2. 创建新项目，获取连接字符串
3. 复制 `DATABASE_URL`（池化）和 `DIRECT_URL`（直连）

### 2. 部署到 Vercel

1. 访问 [Vercel](https://vercel.com) 注册账号
2. 导入 GitHub 仓库 `w020316/Textbook-ING-Smart-Textbook-Query-and-Management-Platform`
3. 配置环境变量：
   - `DATABASE_URL` — Neon 池化连接
   - `DIRECT_URL` — Neon 直连
   - `JWT_SECRET` — JWT 密钥
4. 点击部署

### 3. 初始化数据库

部署成功后，在 Vercel 项目设置中添加环境变量，然后执行：

```bash
# 设置环境变量后本地执行
npx prisma db push
npm run db:seed
```

或在 Vercel 中使用 CLI：

```bash
vercel env pull .env
npx prisma db push
npm run db:seed
```

## 数据模型

数据库包含 13 个核心模型，完整 ER 关系详见 [docs/PRD.md](docs/PRD.md#7-数据模型设计)。

| 模型 | 说明 |
| --- | --- |
| User | 用户（学生/教师/管理员） |
| College / Major / Class | 学院 → 专业 → 班级 |
| Semester | 学期 |
| Course | 课程 |
| Textbook | 教材 |
| CalendarWeek | 教学周 |
| NewsCategory / News | 新闻分类 / 新闻 |
| Comment | 评论 |
| PointRecord | 积分记录 |
| Message | 消息通知 |
| HotSearch | 热门搜索 |
| VerifyToken | 验证令牌 |

## 开发文档

| 文档 | 路径 | 说明 |
| --- | --- | --- |
| 产品需求文档 | [docs/PRD.md](docs/PRD.md) | 功能需求、API 规范、数据模型 |
| 设计规范 | [docs/DESIGN-SPEC.md](docs/DESIGN-SPEC.md) | 色彩、字体、组件设计规范 |
| 任务分解 | [docs/TASK-BREAKDOWN.md](docs/TASK-BREAKDOWN.md) | 167 个开发任务、迭代规划 |
| 测试计划 | [docs/TEST-PLAN.md](docs/TEST-PLAN.md) | 99 条测试用例、性能/安全测试 |

## 浏览器兼容性

| 浏览器 | 最低版本 |
| --- | --- |
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## License

MIT License

---

> 教材ING团队 © 2026
