# 教材ING 智能教材查询与管理平台 - 设计规范文档（DESIGN-SPEC）

| 项目 | 内容 |
| --- | --- |
| 文档版本 | v1.0 |
| 适用版本 | V12.0.0（重建版） |
| 设计风格 | 现代简洁 SaaS 风格，蓝色科技感 |
| 文档负责人 | 产品 / 设计 |
| 更新日期 | 2026-07-01 |

---

## 目录

1. [设计原则](#1-设计原则)
2. [色彩系统](#2-色彩系统)
3. [字体规范](#3-字体规范)
4. [间距系统](#4-间距系统)
5. [圆角规范](#5-圆角规范)
6. [阴影规范](#6-阴影规范)
7. [组件设计规范](#7-组件设计规范)
8. [页面布局规范](#8-页面布局规范)
9. [响应式断点](#9-响应式断点)
10. [交互动效规范](#10-交互动效规范)
11. [图标使用规范](#11-图标使用规范)

---

## 1. 设计原则

### 1.1 核心理念

- **清晰 Clear**：信息层次分明，用户一眼找到目标。
- **高效 Efficient**：减少操作步骤，查询即结果。
- **信任 Trustworthy**：通过数据准确与权威视觉建立信赖。
- **现代 Modern**：跟随主流 SaaS 视觉趋势，体现科技感。

### 1.2 设计准则

1. **一致性优先**：同类组件在所有页面表现一致。
2. **内容驱动**：视觉服务于内容，避免装饰性干扰。
3. **反馈即时**：所有可交互元素提供 hover / active / loading 反馈。
4. **无障碍**：文字对比度符合 WCAG AA 标准（≥ 4.5:1）。
5. **移动优先**：以移动端体验为基准向上适配。

### 1.3 视觉关键词

`科技蓝` `留白` `卡片化` `圆角` `柔和阴影` `渐变点缀`

---

## 2. 色彩系统

### 2.1 主色（Primary）- 蓝色系

主色基于 `#3B82F6`（Tailwind blue-500），代表科技、专业、可信。

| 名称 | 色值 | 用途 | Tailwind 类 |
| --- | --- | --- | --- |
| Primary-50 | `#EFF6FF` | 浅底色 / 选中态背景 | `blue-50` |
| Primary-100 | `#DBEAFE` | 悬浮态背景 / 标签底色 | `blue-100` |
| Primary-200 | `#BFDBFE` | 边框 / 分隔强调 | `blue-200` |
| Primary-300 | `#93C5FD` | 次级强调 | `blue-300` |
| Primary-400 | `#60A5FA` | 悬浮态主色 | `blue-400` |
| Primary-500 | `#3B82F6` | **主色** - 按钮 / 链接 / 主操作 | `blue-500` |
| Primary-600 | `#2563EB` | 按下态主色 / 标题强调 | `blue-600` |
| Primary-700 | `#1D4ED8` | 深色背景上的主色 | `blue-700` |
| Primary-800 | `#1E40AF` | 深色区域文字 | `blue-800` |
| Primary-900 | `#1E3A8A` | 极深强调 | `blue-900` |

### 2.2 辅色（Secondary）- 靛蓝/紫色

用于次级强调、图标点缀、渐变组合。

| 名称 | 色值 | 用途 | Tailwind 类 |
| --- | --- | --- | --- |
| Secondary-500 | `#6366F1` | 渐变终点色 / 次级图标 | `indigo-500` |
| Secondary-600 | `#4F46E5` | 渐变按下态 | `indigo-600` |

**主渐变**：`bg-gradient-to-r from-blue-500 to-indigo-500`（Hero / CTA / Logo）

### 2.3 语义色（Semantic）

| 语义 | 色值 | 用途 | Tailwind 类 |
| --- | --- | --- | --- |
| Success | `#10B981` | 成功提示 / 在线状态 / 验证通过 | `emerald-500` |
| Success-bg | `#ECFDF5` | 成功背景 | `emerald-50` |
| Warning | `#F59E0B` | 警告提示 / 待处理 | `amber-500` |
| Warning-bg | `#FFFBEB` | 警告背景 | `amber-50` |
| Error | `#EF4444` | 错误提示 / 必填校验失败 | `red-500` |
| Error-bg | `#FEF2F2` | 错误背景 | `red-50` |
| Info | `#3B82F6` | 信息提示（同主色） | `blue-500` |
| Info-bg | `#EFF6FF` | 信息背景 | `blue-50` |

### 2.4 中性色阶（Neutral）

文字、背景、边框统一使用 Slate 灰阶（带蓝调，与主色协调）。

| 名称 | 色值 | 用途 | Tailwind 类 |
| --- | --- | --- | --- |
| Neutral-50 | `#F8FAFC` | 页面背景 | `slate-50` |
| Neutral-100 | `#F1F5F9` | 卡片次级背景 / 分隔线 | `slate-100` |
| Neutral-200 | `#E2E8F0` | 边框 / 禁用态 | `slate-200` |
| Neutral-300 | `#CBD5E1` | 次级边框 / 占位符 | `slate-300` |
| Neutral-400 | `#94A3B8` | 次要文字 / 图标默认 | `slate-400` |
| Neutral-500 | `#64748B` | 辅助文字 | `slate-500` |
| Neutral-600 | `#475569` | 正文次要 | `slate-600` |
| Neutral-700 | `#334155` | 正文 | `slate-700` |
| Neutral-800 | `#1E293B` | 标题 | `slate-800` |
| Neutral-900 | `#0F172A` | 主标题 / 深色背景 | `slate-900` |

### 2.5 渐变规范

| 名称 | 值 | 用途 |
| --- | --- | --- |
| Primary Gradient | `linear-gradient(90deg, #3B82F6 0%, #6366F1 100%)` | Hero 背景、主 CTA、Logo |
| Subtle Gradient | `linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)` | 页面浅色背景 |
| Hero Overlay | `linear-gradient(180deg, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.3) 100%)` | Hero 文字遮罩 |

### 2.6 文字对比度要求

| 场景 | 前景 / 背景 | 对比度 |
| --- | --- | --- |
| 正文 | Neutral-700 / 白 | ≥ 7:1（AAA） |
| 辅助文字 | Neutral-500 / 白 | ≥ 4.5:1（AA） |
| 按钮文字 | 白 / Primary-500 | 4.6:1（AA） |
| 占位符 | Neutral-400 / 白 | ≥ 3:1 |

---

## 3. 字体规范

### 3.1 字体族

```css
font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
font-family-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

| 用途 | 字体栈 | 说明 |
| --- | --- | --- |
| 中文正文 | `'PingFang SC', 'Microsoft YaHei'` | macOS / Windows 系统中文 |
| 英文 / 数字 | `'Helvetica Neue', Helvetica, Arial` | 系统无衬线 |
| 等宽（代码 / ISBN） | `'JetBrains Mono', 'Consolas'` | 等宽展示 |

### 3.2 字号层级

基于 Tailwind 默认字号体系，4px 基准。

| 层级 | Tailwind 类 | 大小 | 行高 | 字重 | 用途 |
| --- | --- | --- | --- | --- | --- |
| Display | `text-5xl` | 48px | 1.1 | 800 | 首页 Hero 主标题 |
| H1 | `text-4xl` | 36px | 1.2 | 700 | 页面主标题 |
| H2 | `text-3xl` | 30px | 1.25 | 700 | 区块标题 |
| H3 | `text-2xl` | 24px | 1.3 | 600 | 卡片标题 / 次级区块 |
| H4 | `text-xl` | 20px | 1.4 | 600 | 卡片次级标题 |
| H5 | `text-lg` | 18px | 1.5 | 500 | 强调正文 |
| Body | `text-base` | 16px | 1.6 | 400 | 默认正文 |
| Body-sm | `text-sm` | 14px | 1.6 | 400 | 辅助正文 / 表单 |
| Caption | `text-xs` | 12px | 1.5 | 400 | 标签 / 说明 / 版权 |

### 3.3 字重规范

| 字重 | 数值 | 用途 |
| --- | --- | --- |
| Thin | 100 | 不使用 |
| Light | 300 | 大号次要标题 |
| Normal | 400 | 正文 |
| Medium | 500 | 强调正文 / 按钮文字 |
| Semibold | 600 | 卡片标题 / 次级标题 |
| Bold | 700 | 页面标题 / H1-H2 |
| Extrabold | 800 | Hero 主标题 |

### 3.4 行高规范

| 用途 | 行高值 | Tailwind |
| --- | --- | --- |
| 标题（紧凑） | 1.1 - 1.3 | `leading-tight` |
| 正文（舒适） | 1.6 | `leading-relaxed` |
| 长文阅读（新闻正文） | 1.75 | `leading-loose` |

### 3.5 移动端字号适配

- 移动端 Hero 由 `text-5xl` 降为 `text-3xl`。
- 移动端 H1 由 `text-4xl` 降为 `text-2xl`。
- 正文保持 `text-base`，最小可读字号 14px。

---

## 4. 间距系统

### 4.1 基准与刻度

基于 **4px 基准**，采用 Tailwind 默认间距刻度。

| 名称 | 值 | Tailwind | 用途 |
| --- | --- | --- | --- |
| space-0 | 0 | `0` | 紧贴 |
| space-1 | 4px | `p-1` | 图标与文字间隙 |
| space-2 | 8px | `p-2` | 标签内边距 / 紧凑元素 |
| space-3 | 12px | `p-3` | 表单项间距 |
| space-4 | 16px | `p-4` | 卡片内边距 / 列表项间距 |
| space-5 | 20px | `p-5` | 按钮组间距 |
| space-6 | 24px | `p-6` | 卡片大内边距 / 区块内间距 |
| space-8 | 32px | `p-8` | 区块间距 |
| space-10 | 40px | `p-10` | 大区块间距 |
| space-12 | 48px | `p-12` | 页面区块垂直间距 |
| space-16 | 64px | `p-16` | 大留白 |
| space-20 | 80px | `p-20` | 首页区块垂直间距 |
| space-24 | 96px | `p-24` | Hero 区高度 |

### 4.2 应用规范

| 场景 | 推荐间距 |
| --- | --- |
| 表单 label 与 input 之间 | `space-y-1`（4px） |
| 表单字段之间垂直 | `space-y-4`（16px） |
| 卡片内部 padding | `p-6`（24px），移动端 `p-4` |
| 卡片之间间距 | `gap-6`（24px） |
| 区块之间垂直 | `py-12` 或 `py-20` |
| 按钮内边距（小） | `px-3 py-1.5` |
| 按钮内边距（中） | `px-4 py-2` |
| 按钮内边距（大） | `px-6 py-3` |
| 页面左右边距（桌面） | `px-8` 或容器 `max-w-7xl mx-auto` |
| 页面左右边距（移动） | `px-4` |

### 4.3 容器宽度

| 名称 | 最大宽度 | 用途 | Tailwind |
| --- | --- | --- | --- |
| Container-narrow | 640px | 登录 / 注册 / 忘记密码表单 | `max-w-xl` |
| Container-base | 1024px | 新闻详情正文 | `max-w-3xl` |
| Container-wide | 1280px | 首页 / 列表页 | `max-w-7xl` |
| Container-full | 100% | 全宽 Hero | `w-full` |

---

## 5. 圆角规范

| 名称 | 值 | Tailwind | 用途 |
| --- | --- | --- | --- |
| Radius-none | 0 | `rounded-none` | 表格 / 全宽图片 |
| Radius-sm | 2px | `rounded-sm` | 标签 / 小图标 |
| Radius | 4px | `rounded` | 输入框 / 小按钮 |
| Radius-md | 6px | `rounded-md` | 次级按钮 / 小卡片 |
| Radius-lg | 8px | `rounded-lg` | **默认** - 卡片 / 按钮 / 输入框 |
| Radius-xl | 12px | `rounded-xl` | 大卡片 / 模态框 |
| Radius-2xl | 16px | `rounded-2xl` | Hero 卡片 / 特色卡片 |
| Radius-full | 9999px | `rounded-full` | 头像 / 标签 / 圆形按钮 |

**默认圆角**：组件默认使用 `rounded-lg`（8px），保持柔和现代感。

---

## 6. 阴影规范

采用柔和、有层次的阴影，避免生硬。

| 名称 | 值 | Tailwind | 用途 |
| --- | --- | --- | --- |
| Shadow-xs | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-xs` | 输入框聚焦 / 细微层次 |
| Shadow-sm | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | `shadow-sm` | 卡片默认 |
| Shadow-md | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` | `shadow-md` | 卡片悬浮 / 下拉菜单 |
| Shadow-lg | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | `shadow-lg` | 模态框 / 弹层 |
| Shadow-xl | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` | `shadow-xl` | Hero 卡片 / 重要浮层 |
| Shadow-2xl | `0 25px 50px -12px rgba(0,0,0,0.25)` | `shadow-2xl` | 全屏遮罩弹窗 |
| Shadow-primary | `0 4px 14px 0 rgba(59,130,246,0.39)` | 自定义 | 主按钮按下 / 主 CTA |

**蓝色光晕**：主按钮悬浮使用 `shadow-primary` 形成蓝色光晕，增强品牌感。

---

## 7. 组件设计规范

### 7.1 按钮（Button）

#### 类型

| 类型 | 样式 | 用途 |
| --- | --- | --- |
| Primary | `bg-blue-500 text-white hover:bg-blue-600` | 主操作（登录、查询、提交） |
| Gradient | `bg-gradient-to-r from-blue-500 to-indigo-500 text-white` | Hero CTA |
| Secondary | `bg-white text-blue-600 border border-blue-200 hover:bg-blue-50` | 次操作 |
| Ghost | `bg-transparent text-slate-600 hover:bg-slate-100` | 取消、次级操作 |
| Danger | `bg-red-500 text-white hover:bg-red-600` | 删除 |
| Link | `bg-transparent text-blue-500 hover:underline px-0` | 文字链接 |

#### 尺寸

| 尺寸 | 高度 | padding | 字号 | 圆角 |
| --- | --- | --- | --- | --- |
| Small | 32px | `px-3 py-1.5` | `text-sm` | `rounded-md` |
| Medium（默认） | 40px | `px-4 py-2` | `text-sm` | `rounded-lg` |
| Large | 48px | `px-6 py-3` | `text-base` | `rounded-lg` |
| XLarge（Hero） | 56px | `px-8 py-3.5` | `text-lg` | `rounded-lg` |

#### 状态

- Default：基础样式
- Hover：背景加深一档 / 阴影显现
- Active：背景再加深一档 / 轻微缩放 `scale-[0.98]`
- Focus：`focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`（无障碍）
- Disabled：`opacity-50 cursor-not-allowed`
- Loading：显示 spinner，文字隐藏，禁用点击

#### 按钮 API 示例

```vue
<BaseButton variant="primary" size="medium" :loading="submitting" @click="onSubmit">
  提交
</BaseButton>
```

### 7.2 卡片（Card）

#### 默认卡片

```
背景：bg-white
圆角：rounded-xl
阴影：shadow-sm hover:shadow-md
边框：border border-slate-100
内边距：p-6
过渡：transition-all duration-200
```

#### 卡片类型

| 类型 | 用途 | 特殊样式 |
| --- | --- | --- |
| 基础卡片 | 通用信息容器 | 默认样式 |
| 悬浮卡片 | 教材结果、新闻列表 | hover 时 `-translate-y-1` 上浮 |
| 置顶卡片 | 置顶新闻 | 左侧 `border-l-4 border-blue-500` |
| 统计卡片 | 首页数据统计 | 渐变背景 + 大数字 |
| 特色卡片 | 首页特性展示 | 顶部图标圆形背景 |

### 7.3 表单（Form）

#### 输入框（Input）

```
高度：h-10（40px）
圆角：rounded-lg
边框：border border-slate-300
背景：bg-white
聚焦：focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
占位符：text-slate-400
禁用：bg-slate-50 text-slate-400 cursor-not-allowed
错误：border-red-500 + 下方红色提示文字
```

#### 输入框组合

- Label 在上方：`text-sm font-medium text-slate-700 mb-1.5`
- 输入框右侧图标：绝对定位 `right-3`，输入框 `pr-10`
- 错误提示：`text-xs text-red-500 mt-1`
- 帮助文字：`text-xs text-slate-500 mt-1`

#### 下拉选择（Select）

样式与输入框一致，右侧带 chevron-down 图标。

#### 复选框 / 单选

- 默认 16px，勾选后 `text-blue-500`
- Label 在右侧 `text-sm text-slate-700 ml-2`

#### 表单布局

- 单列表单：`max-w-xl mx-auto space-y-4`
- 双列表单：`grid grid-cols-2 gap-4`
- 移动端：双列降为单列

### 7.4 导航（Navigation）

#### 顶部导航栏

```
高度：h-16（64px）
背景：bg-white/80 backdrop-blur-md（毛玻璃）
边框：border-b border-slate-100
固定：sticky top-0 z-50
```

- Logo 居左，渐变文字或图标
- 导航菜单居中或居右，`text-sm font-medium`
- 当前页高亮：`text-blue-600`
- 未登录：右侧显示"登录""注册"按钮
- 已登录：右侧显示积分、头像下拉菜单
- 移动端：折叠为汉堡菜单

#### 底部页脚

```
背景：bg-slate-900
文字：text-slate-400
内边距：py-12
```

- 分栏：品牌信息 + 链接组 + 版权
- 移动端单列堆叠

#### 面包屑

```
text-sm text-slate-500
分隔符：/ 或 chevron-right 图标
当前页：text-slate-900 font-medium
```

### 7.5 表格（Table）

```
容器：bg-white rounded-xl border border-slate-100 overflow-hidden
表头：bg-slate-50 text-xs font-medium text-slate-500 uppercase
行：border-t border-slate-100 hover:bg-slate-50
单元格：px-6 py-4 text-sm text-slate-700
对齐：文字左对齐，数字右对齐，状态居中
```

- 无数据时显示空状态插画 + 文案
- 分页在表格下方右对齐

### 7.6 弹窗（Modal / Dialog）

#### 模态框

```
遮罩：bg-slate-900/50 backdrop-blur-sm
容器：bg-white rounded-xl shadow-xl max-w-lg w-full
内边距：p-6
标题：text-lg font-semibold text-slate-900
关闭按钮：右上角 X 图标
动画：fade-in + scale-in（150ms）
```

#### 确认弹窗

- 标题 + 描述 + 取消 / 确认按钮
- 危险操作确认按钮使用 Danger 样式

#### Toast 通知

```
位置：右上角 top-4 right-4
容器：固定 z-[100]
类型：success / error / warning / info
样式：圆角 + 左侧色条 + 图标 + 文字
动画：slide-in-right + fade
自动消失：3 秒
```

### 7.7 标签（Tag / Badge）

| 类型 | 样式 | 用途 |
| --- | --- | --- |
| 默认 | `bg-slate-100 text-slate-600` | 通用标签 |
| 主色 | `bg-blue-50 text-blue-600` | 分类高亮 |
| 成功 | `bg-emerald-50 text-emerald-600` | 已验证 / 在线 |
| 警告 | `bg-amber-50 text-amber-600` | 待处理 |
| 危险 | `bg-red-50 text-red-600` | 失败 / 异常 |
| 置顶 | `bg-red-500 text-white` | 置顶标识 |

样式：`text-xs px-2 py-0.5 rounded-full`，圆角全圆。

### 7.8 列表项（List Item）

- 卡片列表：每项一个卡片，`grid` 网格布局
- 紧凑列表：`divide-y divide-slate-100`
- 图文列表：左侧封面图 80x100px，右侧文字信息

### 7.9 分页（Pagination）

```
容器：flex items-center gap-1
按钮：h-9 w-9 rounded-md text-sm
当前页：bg-blue-500 text-white
其他页：text-slate-600 hover:bg-slate-100
禁用：opacity-50 cursor-not-allowed
```

### 7.10 空状态（Empty State）

- 居中展示
- 插画 / 图标 64px，`text-slate-300`
- 主标题 `text-base font-medium text-slate-700`
- 副标题 `text-sm text-slate-500`
- 可选 CTA 按钮

### 7.11 加载状态（Loading）

- 全屏加载：居中 spinner + 文字
- 区域加载：骨架屏（Skeleton）
- 按钮加载：spinner 替换文字
- 列表加载：底部 spinner + "加载中..."

骨架屏样式：`bg-slate-200 animate-pulse rounded`

### 7.12 头像（Avatar）

- 圆形 `rounded-full`
- 尺寸：24 / 32 / 40 / 48 / 64px
- 默认背景 `bg-blue-100 text-blue-600`，显示昵称首字
- 支持图片 URL

---

## 8. 页面布局规范

### 8.1 通用页面骨架

```
┌─────────────────────────────────────┐
│           顶部导航栏 (sticky)        │
├─────────────────────────────────────┤
│                                     │
│         主内容区 (max-w-7xl)         │
│              mx-auto px-8           │
│                                     │
├─────────────────────────────────────┤
│           底部页脚                   │
└─────────────────────────────────────┘
```

### 8.2 首页布局

```
[未读消息滚动栏 - 全宽]
[Hero 区 - 全宽渐变背景]
  └ 大标题 + 副标题 + 双 CTA
[特性展示 - 4 列卡片网格]
[新闻预览 - 3 列卡片]
[数据统计 - 4 列大数字]
[用户评价 - 3 列卡片]
[底部 CTA - 渐变背景]
[页脚]
```

### 8.3 登录 / 注册 / 忘记密码布局

```
┌─────────────────────────────────────┐
│         (左)品牌展示  (右)表单       │
│   渐变背景+文案     max-w-xl 表单    │
└─────────────────────────────────────┘
```

- 桌面端左右分栏，左侧 `bg-gradient` 品牌区，右侧表单
- 移动端仅显示表单，顶部 Logo

### 8.4 教材查询页布局

```
[页面标题 + 描述]
[筛选区 - 卡片]
  学院 | 专业 | 班级 | 学期 | 关键词 [查询按钮]
[热门搜索词标签组]
[结果列表 - 网格 2-3 列]
[分页]
```

### 8.5 校历查询页布局

```
[页面标题]
[筛选区 - 学期 / 专业 / 年级]
[教学周时间轴]
  周次卡片纵向排列，左侧时间轴线
```

### 8.6 新闻中心布局

```
[页面标题 + 分类导航]
[置顶推荐区 - 大卡片]
[新闻列表 - 2 列网格]
[分页]
```

### 8.7 新闻详情布局

```
[面包屑]
[文章头部 - 标题/日期/作者/阅读数]
[正文 max-w-3xl]
[评论区]
[相关文章 - 3 列]
```

### 8.8 内容栅格

| 断点 | 列数 | 间距 | 容器 |
| --- | --- | --- | --- |
| Mobile (<768px) | 1 列 | 16px | px-4 |
| Tablet (768-1024px) | 2 列 | 24px | px-6 |
| Desktop (>1024px) | 3-4 列 | 24px | max-w-7xl px-8 |

---

## 9. 响应式断点

采用 Tailwind 默认断点（移动优先）：

| 断点 | 宽度 | Tailwind 前缀 | 目标设备 |
| --- | --- | --- | --- |
| 默认 | <640px | （无） | 手机竖屏 |
| sm | ≥640px | `sm:` | 手机横屏 / 小平板 |
| md | ≥768px | `md:` | 平板竖屏 |
| lg | ≥1024px | `lg:` | 平板横屏 / 小桌面 |
| xl | ≥1280px | `xl:` | 桌面 |
| 2xl | ≥1536px | `2xl:` | 大桌面 |

### 9.1 适配策略

| 组件 | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| 顶部导航 | 汉堡菜单 | 汉堡菜单 | 完整菜单 |
| Hero | 单列、字号缩小 | 单列 | 居中或双列 |
| 特性卡片 | 1 列 | 2 列 | 4 列 |
| 新闻列表 | 1 列 | 2 列 | 3 列 |
| 教材结果 | 1 列 | 2 列 | 3 列 |
| 表单 | 单列 | 单列居中 | 单列居中 / 双列 |
| 表格 | 横向滚动 | 横向滚动 | 完整展示 |
| 分页 | 简化（仅上下页） | 完整 | 完整 |

### 9.2 安全区域

- 移动端考虑 iOS 安全区：`pb-safe`（env(safe-area-inset-bottom)）
- 顶部导航避开状态栏

---

## 10. 交互动效规范

### 10.1 动效原则

- **快**：过渡时间 150-300ms，避免拖沓。
- **自然**：使用 `ease-out` 入场、`ease-in` 出场。
- **克制**：仅在必要时使用，避免干扰阅读。
- **可关闭**：尊重 `prefers-reduced-motion`。

### 10.2 时长规范

| 类型 | 时长 | 缓动函数 |
| --- | --- | --- |
| 微交互（hover、颜色变化） | 150ms | `ease-out` |
| 小元素位移（卡片上浮） | 200ms | `ease-out` |
| 模态框入场 | 200ms | `ease-out` |
| 页面切换 | 250ms | `ease-in-out` |
| 大区域展开 / 折叠 | 300ms | `ease-in-out` |
| 滚动消息切换 | 500ms | `ease-in-out` |

### 10.3 常用动效

#### Hover 上浮

```css
transition: all 200ms ease-out;
&:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
```

Tailwind：`transition-all duration-200 hover:-translate-y-1 hover:shadow-md`

#### 按钮按下

```css
&:active { transform: scale(0.98); }
```

#### 模态框入场

- 遮罩：`opacity 0 → 1`，150ms
- 内容：`opacity 0 → 1` + `scale 0.95 → 1`，200ms

#### 页面切换

使用 Vue Transition，`fade` 模式：

```css
.fade-enter-active, .fade-leave-active { transition: opacity 250ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
```

#### 未读消息滚动栏

- 文字横向滚动（marquee 效果）或纵向轮播
- 间隔 3 秒切换下一条
- 切换：`slide-up` 500ms

#### 骨架屏脉动

```css
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

Tailwind：`animate-pulse`

#### 数字滚动（统计）

首页数据统计可使用数字递增动画，从 0 滚动到目标值，时长 1.5s。

### 10.4 加载动效

- Spinner：`animate-spin`，默认 24px，主色
- 骨架屏：列表 / 卡片加载时显示灰色占位
- 顶部进度条：路由切换时顶部蓝色进度条（可选 NProgress）

### 10.5 反馈动效

| 场景 | 动效 |
| --- | --- |
| 表单校验失败 | 输入框 `shake` 抖动一次 |
| 操作成功 | Toast slide-in 从右侧 |
| 点赞 / 收藏 | 图标 scale 弹性放大 |
| 新消息提示 | 角标 `bounce` 一次 |

---

## 11. 图标使用规范

### 11.1 图标库

统一使用 **Heroicons**（Vue3 兼容，MIT，与 Tailwind 同源）或 **Lucide Icons**。

- 风格：Outline（线性）为主，Solid 用于状态强调
- 大小默认 24x24（1.5px 描边）

### 11.2 图标尺寸

| 尺寸 | 值 | 用途 |
| --- | --- | --- |
| xs | 16px (w-4 h-4) | 标签内、紧贴文字 |
| sm | 20px (w-5 h-5) | 按钮内、表单右侧 |
| md（默认） | 24px (w-6 h-6) | 导航、列表项 |
| lg | 32px (w-8 h-8) | 卡片标题、空状态 |
| xl | 48px (w-12 h-12) | 特性卡片图标 |
| 2xl | 64px (w-16 h-16) | 空状态插画 |

### 11.3 图标颜色

- 跟随当前文字颜色：`currentColor`
- 强调图标：`text-blue-500`
- 次要图标：`text-slate-400`
- 成功 / 警告 / 错误：对应语义色

### 11.4 常用图标映射

| 功能 | 图标（Heroicons 名称） |
| --- | --- |
| 搜索 | `magnifying-glass` |
| 登录 | `arrow-right-on-rectangle` |
| 退出 | `arrow-left-on-rectangle` |
| 用户 | `user` |
| 邮箱 | `envelope` |
| 密码 | `lock-closed` |
| 书本（教材） | `book-open` |
| 日历（校历） | `calendar-days` |
| 新闻 | `newspaper` |
| 通知 / 消息 | `bell` |
| 积分 / 奖励 | `gift` / `star` |
| 首页 | `home` |
| 菜单（移动端） | `bars-3` |
| 关闭 | `x-mark` |
| 筛选 | `funnel` |
| 置顶 | `bookmark` |
| 阅读 / 眼睛 | `eye` |
| 评论 | `chat-bubble-left` |
| 时间 | `clock` |
| 检查 / 成功 | `check-circle` |
| 警告 | `exclamation-triangle` |
| 错误 | `x-circle` |
| 信息 | `information-circle` |
| 上一页 / 下一页 | `chevron-left` / `chevron-right` |
| 下拉 | `chevron-down` |

### 11.5 图标使用规范

- 图标与文字间距：`space-x-2`（8px）
- 纯图标按钮需 `aria-label` 无障碍标签
- 图标不单独使用色彩装饰，需承载语义
- 列表项图标统一在左侧
- 禁用第三方图标混用，保持视觉统一

### 11.6 图标容器

特性卡片图标使用圆形容器：

```
尺寸：w-12 h-12（48px）
圆角：rounded-xl
背景：bg-blue-50（或渐变）
图标：text-blue-500 w-6 h-6
居中：flex items-center justify-center
```

### 11.7 Logo 规范

- 由图标 + 文字组成
- 图标：书本 + 渐变背景圆角方块
- 文字：`教材ING`，渐变色 `from-blue-500 to-indigo-500`
- 尺寸：图标 32px，文字 `text-xl font-bold`
- 移动端可仅显示图标

---

## 附录：Tailwind 配置参考

```js
// tailwind.config.js 关键扩展
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#3B82F6', /* 50-900 同 blue */ },
        secondary: { DEFAULT: '#6366F1' },
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        primary: '0 4px 14px 0 rgba(59,130,246,0.39)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-in-right': 'slideInRight 250ms ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        slideInRight: { '0%': { transform: 'translateX(100%)', opacity: 0 }, '100%': { transform: 'translateX(0)', opacity: 1 } },
      },
    },
  },
}
```
