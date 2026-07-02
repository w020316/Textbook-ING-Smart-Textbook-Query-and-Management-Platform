# 教材ING 智能教材查询与管理平台 · 全面优化与完善设计

> **版本**: v1.0
> **日期**: 2026-07-02
> **作者**: 产品经理（AI 驱动）
> **状态**: 已批准，待实施
> **生产环境**: https://textbook-ing.vercel.app
> **仓库**: https://github.com/w020316/Textbook-ING-Smart-Textbook-Query-and-Management-Platform

---

## 1. 背景与目标

### 1.1 项目现状

教材ING 是面向高校师生的智能教材查询与管理平台，已完成首期开发并部署上线。技术栈为 Vue 3.5 + TypeScript + Vite + TailwindCSS + Pinia + Prisma + Neon PostgreSQL + Vercel Serverless。

当前已交付：10 个用户端页面、25 个 API 接口、15 个数据模型、Neon 数据库初始化（8 学院/18 专业/108 班级/45 课程/45 教材等种子数据）、Vercel 生产部署（8/8 验证通过）。

### 1.2 问题与目标

经全面审查识别出三类核心问题：

- **功能缺陷**：管理后台完全缺失（PRD F-ADMIN 模块）、个人中心/教材详情页/邮件服务未实现、多处死链、安全加固不足
- **性能不达标**：首页首次加载预计 >2 秒、登录响应冷启动时可能 >500ms，未达既定指标
- **技术债务**：单文件 API（585 行）、无 API 限流、无缓存层、无测试代码、hash 路由不利 SEO

本次优化的目标是：**交付功能完善、性能达标、用户体验优良、测试覆盖充分的项目成果**，符合公司开发标准。

### 1.3 性能指标

| 指标 | 目标 |
|------|------|
| 首页首次加载（LCP） | ≤2 秒（Fast 3G 节流） |
| 登录响应（P95） | ≤500ms |
| CLS（累积布局偏移） | ≤0.1 |
| 首屏 chunk gzip | ≤200KB |
| 测试覆盖率 | ≥70% |

### 1.4 范围界定

经产品经理与用户确认：

- **工作范围**：全范围交付（管理后台 + 性能优化 + 缺陷修复 + 测试方案）
- **"后端页面系统"定位**：管理后台前端页面，复用现有 Vue 项目，路由隔离在 `/admin` 下，配套后端管理 API

---

## 2. 方案选型

### 2.1 候选方案

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| A. 渐进式增强（推荐） | 在现有架构上增量增强，同应用 `/admin` 路由分支 + API 拆分 + 预渲染 | 交付快、风险低、复用现有成果、部署不变 | 管理代码随主应用部署 |
| B. 全面重构 | 管理后台独立子应用 + Hono 中间件 + Nuxt SSR | 架构更清晰、SEO 最优 | 工作量 3-5 倍、风险高、偏离技术栈 |
| C. 最小可行 | 仅管理后台基础 CRUD + 关键性能优化 | 最快交付 | 性能难达标、技术债未清 |

### 2.2 选定方案

**采用方案 A（渐进式增强）**。理由：

1. 全范围交付且性能达标，方案 A 能在合理工作量内满足
2. 复用现有 Vue 项目，部署不变
3. 预渲染 + 缓存能切实达成 ≤2 秒指标，无需 SSR 重写
4. API 拆分解决单文件 585 行债务，但不必引入新框架

---

## 3. 管理后台系统设计

### 3.1 架构

管理后台与用户端同应用，路由分支隔离，懒加载独立 bundle：

```
src/
├── views/              # 用户端页面（现有）
├── admin/              # 管理后台（新增）
│   ├── layouts/
│   │   └── AdminLayout.vue      # 侧边栏+顶栏布局
│   └── views/
│       ├── DashboardView.vue    # 数据概览（统计图表）
│       ├── TextbookManage.vue   # 教材CRUD+搜索+分页
│       ├── NewsManage.vue       # 新闻CRUD+富文本编辑
│       ├── UserManage.vue       # 用户列表+积分管理+角色
│       ├── CalendarManage.vue   # 学期/教学周管理
│       └── CollegeManage.vue    # 学院/专业/班级树形管理
└── router/index.ts     # 新增 /admin 分支 + 管理员守卫
```

### 3.2 路由与权限

- `/admin/*` 独立路由分支，使用 `AdminLayout`
- 全局守卫：访问 `/admin/*` 时校验 `user.role === 'ADMIN'`，非管理员跳转 403 页
- 管理后台与用户端共享认证（同一 JWT），但 UI 完全隔离
- 管理员入口：用户端头部菜单（仅管理员可见）+ 直达 `/admin`
- 管理后台 chunk 独立，用户端 bundle 不含管理代码

### 3.3 后端管理 API（新增）

拆分 `api/index.ts` 为模块化结构：

```
api/
├── index.ts            # 入口：路由分发
├── _lib.ts             # 共享工具（现有）
├── auth.ts             # 认证相关
├── textbook.ts         # 教材查询（用户端）
├── news.ts             # 新闻查询（用户端）
├── public.ts           # 公开接口（stats/semesters/calendar）
├── user.ts             # 用户端（profile/messages/points）
└── admin/              # 管理API（新增，需ADMIN角色）
    ├── textbooks.ts    # 教材CRUD
    ├── news.ts         # 新闻CRUD
    ├── users.ts        # 用户管理
    ├── calendar.ts     # 校历管理
    └── stats.ts        # 统计聚合
```

每个管理 API 统一经过 `requireAdmin` 中间件校验。

### 3.4 管理后台功能清单

| 模块 | 路由 | 功能 |
|------|------|------|
| 仪表盘 | `/admin` | 数据卡片（用户/教材/新闻/学院数）+ 近期注册趋势 + 热门教材 Top10 |
| 教材管理 | `/admin/textbooks` | 列表(筛选/搜索/分页) + 新增 + 编辑 + 删除 + 批量导入 |
| 新闻管理 | `/admin/news` | 列表 + 新增/编辑(富文本) + 置顶/取消 + 删除 |
| 用户管理 | `/admin/users` | 列表(搜索/筛选角色) + 修改积分 + 修改角色 + 禁用 |
| 校历管理 | `/admin/calendar` | 学期 CRUD + 教学周批量生成 + 特殊事项标注 |
| 学院管理 | `/admin/colleges` | 学院/专业/班级树形 CRUD |

### 3.5 富文本编辑器

新闻管理采用 **wangEditor 5**（`@wangeditor/editor` + `@wangeditor/editor-for-vue@5`），理由：Vue 3 原生支持、中文文档完善、体积适中（~150KB gzip）。功能要求：

- 标题/段落/列表/引用/代码块
- 加粗/斜体/下划线/链接
- 图片上传（base64 内联，避免额外存储服务）
- 输出 HTML 入库前经 DOMPurify 清洗防 XSS
- 编辑器懒加载，仅 `/admin/news` 编辑页引入，不影响其他页面 bundle

---

## 4. 性能优化专项

### 4.1 性能指标与现状

| 指标 | 目标 | 现状（推断） | 根因 |
|------|------|------|------|
| 首页首次加载 | ≤2 秒 | ~2.5-4 秒（冷启动） | SPA 无预渲染 + JS 包 175KB gzip + 无 HTTP 缓存头 |
| 登录响应 | ≤500ms | ~600-1500ms（冷启动） | Serverless 冷启动 + Prisma 连接建立 + bcrypt(10 轮) |

### 4.2 前端优化（达成 ≤2 秒）

1. **路由懒加载分块**：确认所有路由组件使用 `() => import()`；管理后台 `/admin/*` 独立 chunk；Vite manualChunks 拆分 vendor（vue/router/pinia/axios/prisma 独立块）
2. **静态资源 CDN 缓存头**：`vercel.json` 配置 `headers`，`/assets/*` 设置 `Cache-Control: public, max-age=31536000, immutable`；HTML 入口 `no-cache`；字体/图片 `max-age=86400`
3. **首屏关键资源内联**：Vite `build.assetsInlineLimit: 4096`（小图标内联 base64）
4. **移除未用依赖**：检查 `package.json`，移除未引用包
5. **图片优化**：懒加载 `loading="lazy"` + 占位图避免 CLS

### 4.3 后端优化（达成 ≤500ms 登录）

1. **数据库索引补全**：

```prisma
@@index([email])           // User：登录查询
@@index([createdAt])       // User/News/Textbook：列表排序
@@index([collegeId])       // Major/Textbook：按学院筛选
@@index([categoryId])      // News：按分类筛选
@@index([userId, createdAt]) // Message：用户消息时间线
```

2. **API 响应缓存**（内存 LRU，TTL 分级）：

| 接口 | TTL | 策略 |
|------|-----|------|
| `/api/semesters` | 1 小时 | 全量缓存 |
| `/api/stats` | 5 分钟 | 全量缓存 |
| `/api/news/categories` | 1 小时 | 全量缓存 |
| `/api/news?page=1` | 2 分钟 | 按 query 缓存 |
| `/api/textbooks?page=1` | 2 分钟 | 按 query 缓存 |
| 登录/注册/验证码 | 不缓存 | — |

写入操作触发对应缓存失效。

3. **冷启动优化**：Prisma Client 全局单例（已有）+ 减小函数依赖体积
4. **bcrypt 策略**：保持 10 轮（~80ms），JWT 有效期 7 天减少重复登录
5. **HTTP 缓存头**：公开 GET 接口 `Cache-Control: public, max-age=120`；私有接口 `private, no-cache`

### 4.4 性能验证方案

| 验证项 | 工具 | 方法 |
|--------|------|------|
| 首页首次加载 | Lighthouse | 隐身模式 + Fast 3G 节流 + 记录 FCP/LCP |
| 登录响应 | 浏览器 Network | 冷启动 + 温热各测 5 次取中位数 |
| 路由切换 | Performance API | `router.afterEach` 记录耗时 |
| Bundle 分析 | `vite-bundle-visualizer` | 生成依赖图 |

### 4.5 性能基线文档

在 `docs/PERFORMANCE.md` 记录优化前基线、优化后数据、不达标项的根因分析与后续计划。

---

## 5. 缺陷修复与功能完善

### 5.1 缺陷修复清单

| ID | 类型 | 问题 | 修复方案 |
|----|------|------|----------|
| D-01 | 死链 | AppHeader `/profile` 无对应页面 | 新增 `ProfileView` + 路由 `/profile` |
| D-02 | 死链 | 退出登录调用 `/auth/logout` 不存在 | 后端补 logout 接口 + 前端兜底清理 |
| D-03 | 缺失 | 教材详情页前端未实现 | 新增 `TextbookDetailView` + 路由 `/search/:id` |
| D-04 | 安全 | 验证码直接返回 | 邮件服务接入（Resend） |
| D-05 | UX | 新闻阅读数每次刷新 +1 | 同 IP + 新闻 ID 1 小时去重 |
| D-06 | 性能 | vite.config proxy 指向自己 | 修正为 `http://localhost:5173` 或移除 |
| D-07 | UX | hash 路由带 # | 切换 `createWebHistory` + vercel.json rewrite |
| D-08 | 安全 | 无 API 限流 | IP + 接口路径限流中间件（内存滑动窗口） |
| D-09 | 安全 | 密码无强度校验 | 校验长度 ≥8 + 含字母数字 |
| D-10 | 安全 | 评论/富文本无 XSS 过滤 | 入库前 DOMPurify 清洗 |
| D-11 | UX | 无加载骨架屏 | 新增 `Skeleton` 组件 |
| D-12 | UX | 无全局错误边界 | Vue `errorHandler` + 404/500 页 |
| D-13 | UX | 无面包屑导航 | 新增 `Breadcrumb` 组件 |
| D-14 | 安全 | JWT 无 refresh 机制 | access 7 天 + refresh 30 天 |
| D-15 | 完整性 | 签到功能无前端入口 | ProfileView 加签到 + 积分明细 |
| D-16 | 完整性 | 邮箱验证流程不完整 | 注册后发验证邮件 + `/verify-email` 页 |
| D-17 | UX | 移动端无个人中心入口 | AppHeader 移动端菜单加头像下拉 |

### 5.2 功能完善清单

| ID | 功能 | 说明 | 优先级 |
|----|------|------|--------|
| F-01 | 个人中心页 | 用户信息 + 积分明细 + 消息中心 + 签到 + 我的评论 | 高 |
| F-02 | 教材详情页 | 封面 + 基本信息 + 目录 + 评论列表 + 相关推荐 | 高 |
| F-03 | 邮件服务 | Resend 接入，验证码/通知邮件 | 高 |
| F-04 | 邮箱验证页 | token 校验 + 成功/失败提示 | 中 |
| F-05 | 全局搜索 | 顶栏搜索框，跨教材/新闻搜索 | 中 |
| F-06 | 消息中心 | 系统通知列表 + 已读/未读 + 全部已读 | 中 |
| F-07 | 收藏功能 | 教材收藏 + 收藏列表 | 低 |

### 5.3 邮件服务

采用 **Resend 免费版**（100 封/天，足够开发验证）：

- 注册账号获取 API Key
- `.env` 新增 `RESEND_API_KEY`、`MAIL_FROM`
- 新建 `api/_email.ts` 封装发送逻辑
- 验证码邮件 + 注册欢迎邮件 + 邮箱验证邮件
- 免费版发信域默认 `onboarding@resend.dev`（仅供测试，正式需绑定自有域名）
- 超限或 API 异常时降级为 console 输出（开发环境不阻断流程）
- 生产环境若需正式发信域，后续可绑定项目域名（如 `noreply@mail.textbook-ing.com`）

### 5.4 路由切换兼容性

hash → history 切换关键点：

```json
// vercel.json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

前端 `createWebHistory()` 替换 `createWebHashHistory()`，所有 `router-link` 的 `to` 属性无需改动。

---

## 6. 测试方案

### 6.1 测试分层

```
测试金字塔
┌──────────────┐
│   E2E (5%)   │  关键用户路径
├──────────────┤
│ 集成 (15%)   │  API接口测试（含数据库交互）
├──────────────┤
│ 单元 (80%)   │  工具函数/组件/Store逻辑
└──────────────┘
```

### 6.2 功能测试

**单元测试（Vitest + @vue/test-utils）**

| 模块 | 范围 | 用例数 |
|------|------|--------|
| 工具函数 | request 拦截器、format 格式化、validators 校验 | ~25 |
| Store | auth 登录/登出、toast 通知 | ~15 |
| 组件 | Skeleton、Breadcrumb、AppHeader 权限渲染 | ~20 |
| API 工具 | 密码哈希、JWT、限流、缓存 | ~30 |

**集成测试（Vitest + 内存 SQLite）**

| 接口 | 场景 |
|------|------|
| 认证 | 注册/重复邮箱/密码强度/登录/验证码 |
| 教材 | 分页/筛选/搜索/详情/权限 |
| 新闻 | 分页/分类/阅读数去重/缓存 |
| 公开 | 学期/校历/统计缓存 |
| 管理后台 | 权限拒绝/教材 CRUD/新闻 CRUD/用户管理/统计 |

**E2E 测试（Playwright）**

| 路径 | 步骤 |
|------|------|
| E1 访客浏览 | 首页→新闻→校历→教材查询(触发登录引导) |
| E2 用户登录 | 登录→首页→教材详情→收藏 |
| E3 个人中心 | 登录→个人中心→签到→消息→改密 |
| E4 管理后台 | 管理员登录→仪表盘→教材新增→新闻编辑→用户管理 |
| E5 异常流 | 404→未登录访问受保护页→登录回跳 |

### 6.3 性能测试

**前端（Lighthouse CI）**

| 指标 | 目标 |
|------|------|
| FCP | ≤1.0 秒 |
| LCP | ≤2.0 秒 |
| TTI | ≤2.5 秒 |
| CLS | ≤0.1 |
| Bundle gzip | ≤200KB |

**后端（自建压测脚本 `tests/perf/api-bench.cjs`）**

| 接口 | 目标 P95 |
|------|---------|
| `POST /api/auth/login` | ≤500ms |
| `GET /api/textbooks?page=1` | ≤300ms |
| `GET /api/news?page=1` | ≤300ms |
| `GET /api/semesters` | ≤200ms |

### 6.4 兼容性测试

| 平台 | 范围 |
|------|------|
| 浏览器 | Chrome 120+/Edge 120+/Firefox 121+/Safari 17+ |
| 设备 | 桌面(1920/1440/1280) + 平板(768) + 手机(375/414) |
| 系统 | Windows 11/macOS 14/Android 13/iOS 17 |

Playwright 配置多浏览器 + 视口跑 E2E。

### 6.5 用户体验测试

**可用性检查清单（Nielsen 启发式）**：可见性、一致性、防错、错误恢复、效率、帮助。

**真实用户场景走查（5 个）**：新生、教师、管理员、访客、移动端用户。

### 6.6 测试基础设施

```
tests/
├── unit/                 # Vitest单元
├── integration/          # Vitest集成（SQLite内存库）
├── e2e/                  # Playwright
├── perf/                 # 性能压测
└── fixtures/             # 测试数据
```

### 6.7 CI 集成

`.github/workflows/test.yml`：

| 阶段 | 触发 | 任务 |
|------|------|------|
| test | push/PR | 单元 + 集成 |
| e2e | 部署后 | Playwright 5 路径 |
| perf | 每日定时 | Lighthouse + API 压测 |

---

## 7. 实施计划

### 7.1 阶段划分

```
阶段1: 基础设施 + 缺陷修复（D-01~D-17）
  ↓ 依赖
阶段2: 管理后台系统（前端页面 + 后端管理API）
  ↓ 并行
阶段3: 性能优化专项（前端≤2s + 后端≤500ms）
  ↓ 依赖
阶段4: 测试体系建设 + 文档更新 + 部署验证
```

### 7.2 阶段1：基础设施 + 缺陷修复

| 任务 | 产出 |
|------|------|
| API 拆分 | 模块化 API 结构 |
| 路由切换 hash→history | URL 无 #，刷新不 404 |
| 新增页面 | ProfileView/TextbookDetailView/VerifyEmailView/ServerErrorView |
| 共享组件 | Skeleton/Breadcrumb/ErrorBoundary |
| 安全加固 | 限流/密码强度/XSS 过滤/JWT refresh |
| 邮件服务 | Resend 接入 + _email.ts |
| vite.config 修复 | 开发环境正常 |
| 新闻阅读数去重 | 防刷量 |
| AppHeader 移动端完善 | 移动端入口完整 |

**验收**：所有死链修复、安全加固完成、邮件可发送、路由刷新不 404。

### 7.3 阶段2：管理后台系统

| 任务 | 产出 |
|------|------|
| AdminLayout + 侧边栏 | 后台布局 |
| 管理员路由守卫 | 权限隔离 |
| 仪表盘 | `/admin` |
| 教材管理 | `/admin/textbooks` |
| 新闻管理 | `/admin/news` |
| 用户管理 | `/admin/users` |
| 校历管理 | `/admin/calendar` |
| 学院管理 | `/admin/colleges` |
| 后端管理 API | admin/* 模块 |

**验收**：管理员可完成各模块 CRUD，非管理员无法访问。

### 7.4 阶段3：性能优化专项

| 任务 | 产出 |
|------|------|
| Prisma schema 索引补全 | 查询性能提升 |
| API 响应缓存层 | 公开接口缓存命中 |
| Vite manualChunks | 首屏 chunk 优化 |
| 静态资源 CDN 缓存头 | 资源复用 |
| 图片懒加载 + 占位 | CLS 降低 |
| 首页预渲染（SSG） | FCP/LCP 降低 |
| 移除未用依赖 | bundle 减小 |
| bcrypt + JWT 优化 | 登录响应优化 |
| 性能基线文档 | 优化前后对比 |

**验收**：Lighthouse LCP ≤2 秒、登录 P95 ≤500ms、有性能基线文档。

### 7.5 阶段4：测试 + 文档 + 部署

| 任务 | 产出 |
|------|------|
| 单元测试（~90 用例） | tests/unit/ |
| 集成测试（~40 用例） | tests/integration/ |
| E2E 测试（5 路径） | tests/e2e/ |
| 性能压测脚本 | tests/perf/ |
| Lighthouse CI | .lighthouserc.json |
| GitHub Actions CI | .github/workflows/test.yml |
| 文档更新 | PRD/测试/部署/管理手册 |
| 生产部署 + 验证 | 最终交付 |

**验收**：覆盖率 ≥70%、E2E 全通过、CI 绿灯、生产验证通过。

---

## 8. 交付物与质量标准

### 8.1 交付物清单

| 类别 | 产出 |
|------|------|
| 源代码 | 前端页面 + 管理后台 + 后端 API + 测试代码 |
| 文档 | PRD 更新、PERFORMANCE.md、ADMIN-GUIDE.md、测试报告 |
| 部署 | Vercel 生产环境 + Neon 数据库 |
| 测试 | 单元/集成/E2E/性能代码与报告 |
| CI | GitHub Actions 流水线 |

### 8.2 质量标准

| 维度 | 标准 |
|------|------|
| 功能完整性 | PRD 所有功能点实现，无死链、无 404、无未实现接口 |
| 性能 | LCP ≤2 秒、登录 P95 ≤500ms、CLS ≤0.1 |
| 安全 | 限流、密码强度、XSS 防护、JWT refresh、无硬编码密钥 |
| 代码规范 | TypeScript 严格模式、ESLint 通过、模块化结构 |
| 测试 | 覆盖率 ≥70%、E2E 全通过、性能基线达标 |
| 文档 | PRD/部署/管理手册/性能报告齐全 |
| 版本控制 | 语义化 commit、每阶段独立提交、推送到 GitHub |

### 8.3 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 预渲染与 Vercel SPA 冲突 | 中 | 中 | vercel.json rewrite 兜底，必要时改用 vite-plugin-ssr |
| Resend 免费额度超限 | 低 | 低 | 100 封/天足够开发验证，超限降级 console |
| Neon 免费版计算休眠 | 高 | 中 | 首次请求慢，加缓存层 + 客户端 loading 兜底 |
| Playwright 浏览器安装失败 | 低 | 低 | CI 用官方 action，本地可选跑 |
| SQLite 与 PostgreSQL 差异 | 低 | 低 | 仅用于集成测试逻辑验证，生产仍用 PostgreSQL |

---

## 9. 附录

### 9.1 现有项目结构

```
教材ING智能教材查询与管理平台/
├── api/                    # Vercel Serverless API
│   ├── index.ts            # 路由分发（待拆分）
│   └── _lib.ts             # 共享工具
├── src/
│   ├── views/              # 10个用户端页面
│   ├── components/         # AppHeader等组件
│   ├── stores/             # Pinia stores
│   ├── router/             # Vue Router
│   ├── utils/              # request.ts等工具
│   └── types/              # TypeScript类型
├── prisma/
│   ├── schema.prisma       # 15个数据模型
│   └── seed.ts             # 种子数据
├── docs/                   # PRD/测试计划等文档
├── vercel.json             # 部署配置
└── package.json            # v12.0.0
```

### 9.2 生产环境信息

- **生产 URL**: https://textbook-ing.vercel.app
- **管理员账号**: admin@textbook-ing.com / admin123
- **GitHub 仓库**: https://github.com/w020316/Textbook-ING-Smart-Textbook-Query-and-Management-Platform
- **Neon 项目**: muddy-cell-12686688 (ap-southeast-1)

### 9.3 术语表

| 术语 | 含义 |
|------|------|
| LCP | Largest Contentful Paint，最大内容绘制时间 |
| FCP | First Contentful Paint，首次内容绘制时间 |
| CLS | Cumulative Layout Shift，累积布局偏移 |
| TTI | Time to Interactive，可交互时间 |
| SSG | Static Site Generation，静态站点生成 |
| LRU | Least Recently Used，最近最少使用缓存策略 |
| CRUD | Create/Read/Update/Delete，增删改查 |
