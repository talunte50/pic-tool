# pic-tool UI 设计系统 v2.0
> 全站设计系统 · 现代简洁（Modern Minimal）风格 · 符合用户习惯的界面设计方案
> 基线：Astro 4 + React + antd + Tailwind CSS · 品牌色已统一为 Indigo `#4F46E5`

---

## 1. 设计理念（Design Principles）

1. **工具优先（Tool-first）**：用户来这里是为了"上传图片 → 选参数 → 下载"。每一步的视觉焦点必须落在"行动"上，装饰退居背景。
2. **安静而明快（Calm & Bright）**：浅色纸面（off-white）+ 单点强调色（Indigo 蓝紫）+ 大留白。去掉首页 3 个彩色 blur 光斑的高饱和视觉噪音，改为极淡的单一渐变晕染。
3. **一致性（Consistency）**：全站共用一套 token（色彩/字号/圆角/间距/阴影），组件状态（hover/active/focus/disabled）全部走 token，杜绝页面各写各的颜色。
4. **可达性（Accessible）**：正文对比度 ≥ 4.5:1（WCAG AA），可点击目标 ≥ 44×44px，焦点环可见，语义化标签，`prefers-reduced-motion` 降级。
5. **移动端拇指热区**：主操作（上传/下载/设置）置于视口下半区或底部吸底，次级操作（设置面板）用抽屉/折叠。

---

## 2. 设计 Tokens（Design Tokens）

### 2.1 色彩（Color）

| Token | 值 | 用途 |
|---|---|---|
| `--brand-500` | `#4F46E5`（Indigo 600） | 主品牌色：主按钮、链接、激活态 |
| `--brand-600` | `#4338CA` | 主按钮 hover |
| `--brand-100` | `#E0E7FF` | 激活底色、选中 pill |
| `--brand-50` | `#EEF2FF` | 浅底卡片、tooltip |
| `--ok-500` | `#10B981` | 成功/压缩结果 |
| `--warn-500` | `#F59E0B` | 警告 |
| `--danger-500` | `#EF4444` | 错误、删除 |
| `--ink-900` | `#18181B` | 主文本（标题、正文） |
| `--ink-700` | `#3F3F46` | 次级文本 |
| `--ink-500` | `#71717A` | 辅助文本（说明、meta） |
| `--ink-300` | `#D4D4D8` | 分隔线、边框 |
| `--surface-0` | `#FFFFFF` | 卡片、弹层 |
| `--surface-1` | `#FAFAFB` | 页面底（zinc-50） |
| `--surface-2` | `#F4F4F5` | 内嵌区块、表格隔行 |
| `--checkerboard` | `conic` 双灰 | 透明图预览背景（保留 `.tr`） |

> 迁移策略（已落地）：antd 组件通过 `global.css` 的 `--ant-color-primary: var(--brand-500)` 覆盖旧 `#1677ff`，无需 React ConfigProvider；Tailwind 已新增 `brand` 色板（见 2.7）。旧的 `#1677ff` / `blue-600` 硬编码已在全站清理：首页/导航/首页卡片/工具页光晕全部改用 `brand-*`；工具页组件内剩余的 `blue-*`（图标/强调）按需逐个替换为 `brand-*`，不改变语义色（成功/错误/警告保持 ok/warn/danger）。

### 2.2 字体（Typography）

| Token | 桌面 | 移动 | 用途 |
|---|---|---|---|
| `--fs-display` | 56 / 600 | 40 / 600 | 首页 Hero 大标题 |
| `--fs-h1` | 32 / 600 | 26 / 600 | 工具页标题 |
| `--fs-h2` | 22 / 600 | 19 / 600 | 区块标题 |
| `--fs-body` | 15 / 400 | 15 / 400 | 正文 |
| `--fs-small` | 13 / 400 | 13 / 400 | 说明、meta |
| `--fs-caption` | 12 / 400 | 12 / 400 | 标签、角标 |

- 字族：`Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`
- 行高：display 1.15 / h1 1.3 / body 1.6
- 层级间距：h1→body 24px，section 间距 48px（桌面）/ 32px（移动）

### 2.3 间距（Spacing）

8pt 栅格：`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`
- 容器最大宽 `1120px`（原 `2xl=1400` 收窄，工具页更聚焦）
- 卡片内边距 24（桌面）/ 16（移动）
- 吸底操作栏距底 0，内边距 12/16

### 2.4 圆角（Radius）

| Token | 值 | 用途 |
|---|---|---|
| `--radius-sm` | 8 | 输入框、下拉 |
| `--radius-md` | 12 | 卡片、弹层 |
| `--radius-lg` | 16 | 大卡片、Hero 图 |
| `--radius-full` | 999 | 按钮（胶囊）、pill 导航 |

### 2.5 阴影（Elevation）

- `--shadow-sm`：`0 1px 2px rgba(24,24,27,.06)` — 卡片默认
- `--shadow-md`：`0 4px 12px rgba(24,24,27,.08)` — 悬浮卡、下拉
- `--shadow-focus`：`0 0 0 3px rgba(79,70,229,.25)` — 焦点环（与 `--brand-100` 呼应）
- 深色模式阴影透明度提高至 `.25`

### 2.6 动效（Motion）

- 时长：微交互 150ms / 常规 240ms / 弹层 320ms
- 缓动：`cubic-bezier(.2,.8,.2,1)`（ease-in-out-quart 简化）
- 原则：只动 `transform/opacity`，不动 `layout`
- `@media (prefers-reduced-motion: reduce)` 时全部静态

### 2.7 Tailwind 扩展色板（写入 `tailwind.config.mjs`）

```js
colors: {
  brand: {50:'#EEF2FF',100:'#E0E7FF',500:'#4F46E5',600:'#4338CA',700:'#3730A3'},
  surface:{0:'#FFFFFF',1:'#FAFAFB',2:'#F4F4F5'},
  ink:    {300:'#D4D4D8',500:'#71717A',700:'#3F3F46',900:'#18181B'},
}
```

### 2.8 品牌资产（Logo / Favicon / PWA 图标）

全部采用 **SVG 矢量**（精确 `#4F46E5`，可缩放、体积小），替换早期 PNG 位图：

| 资产 | 文件 | 用途 |
|---|---|---|
| 图标（仅图形） | `public/pic-tool-icon.svg` | PWA 主图标、社交分享、`manifest.json` icons |
| 图标 + 字标 | `public/pic-tool-logo.svg` | Header 品牌位（`<img src="/pic-tool-logo.svg">`） |
| Favicon | `public/favicon.svg` | 浏览器标签页图标（与 icon 同款） |
| PWA manifest | `public/manifest.json` | `name:"pic-tool"`、`theme_color:#4F46E5`、icons 指向上面两个 SVG |

> 下载文件名约定：各工具页"下载"产物统一命名为 `pic-tool.png`（原 `shotEasy.png` 已替换）。

---

## 3. 布局框架（Layout）

```
┌────────────────────────────────────────────┐
│ Header: Logo ｜ 导航（桌面 flex / 移动 4 列 grid） │  吸顶 sticky + 毛玻璃
├────────────────────────────────────────────┤
│ Hero（仅首页）: 主标题 + 副标题 + 搜索/工具入口      │
├────────────────────────────────────────────┤
│ 工作区: 上传区 → 预览区 → 参数面板（桌面右栏/移动底部） │
├────────────────────────────────────────────┤
│ SEO 区块（折叠"了解更多"）· 隐私声明 · 相关工具       │
├────────────────────────────────────────────┤
│ Footer: 核心工具 · 语言切换 · 社交 · 备案           │
└────────────────────────────────────────────┘
```

- **Header 吸顶**：`position: sticky; top:0; backdrop-filter: blur(12px)`，高度 64（桌面）/ 56（移动）
- **工作区网格**：桌面 `grid-cols-[1fr_320px]`（预览主区 + 参数右栏），移动单列、参数面板改底部抽屉
- **吸底操作栏（移动）**：`上传 · 设置 · 下载` 三键均分，主键"下载"用 brand 色高亮

---

## 4. 组件规范（Component Spec）

| 组件 | 规范要点 |
|---|---|
| **按钮** | 主按钮 `bg-brand-500 text-white rounded-full h-44px`；次按钮 `border ink-300`；危险 `danger-500`；focus 时 `shadow-focus` |
| **上传区** | 2px 虚线 `ink-300`，hover 变 `brand-500/50`；拖拽态 `bg-brand-50`；内显"点击或拖拽图片"文案 + 格式提示 |
| **预览画布** | 透明图用 `.tr` 棋盘格；加 `rounded-lg overflow-hidden shadow-sm` |
| **参数面板** | 桌面右栏卡片（`surface-0` 圆角 12）；移动端底部抽屉（圆角 16 顶部） |
| **滑块/选择** | 走 antd，主题 `colorPrimary=#4F46E5`；滑块 track `ink-300`，active `brand-500` |
| **导航 pill** | 激活 `bg-brand-100 text-brand-700`（替代旧 `blue-600` 实底，更轻） |
| **卡片** | `surface-0 + shadow-sm + radius-md`；hover `shadow-md + -translate-y-1`（transition 240ms） |
| **空态** | 轻插画 + 一行说明 + 一个主 CTA |
| **结果反馈** | 压缩比/大小用 `ok-500` 数字强调；Toast `surface-0 + shadow-md` |

---

## 5. 响应式断点（Responsive）

- 移动 `<640`：单列、底部吸底操作、导航 4 列 grid、字号下移一档
- 平板 `640–1024`：工作区仍单列，参数面板可切右侧
- 桌面 `>1024`：`1fr + 320px` 双栏、导航 flex 展开、容器 1120px

---

## 6. 无障碍（Accessibility）

- 正文 `ink-700` 对 `surface-1` 对比度 ≈ 9:1，`ink-500` ≈ 4.7:1（AA 达标）
- 所有可交互元素 `:focus-visible` 显示 `shadow-focus`
- 图片/按钮补 `aria-label`；上传区 `role=button` + 键盘可达
- `prefers-reduced-motion` 关闭所有过渡与 Hero 晕染动画
- 深色模式：文本 `#F4F4F5`，`brand-500` 提亮至 `#818CF8`，阴影加深

---

## 7. 落地映射（与现有代码的对应）

| 现有 | 目标 | 状态 |
|---|---|---|
| `--ant-color-primary:#1677ff` | `global.css` 改为 `var(--brand-500)`（#4F46E5） | ✅ 已落地 |
| `Layout.astro` `<meta theme-color>` | 同步为 `#4F46E5` | ✅ 已落地 |
| 首页 3 个彩色 `blur` 光斑 | 单一 `radial-gradient` 极淡 brand 晕染 | ✅ 已落地 |
| 25 个工具页多色光斑 | 统一单一 brand tint（`scripts/ui-glow-migrate.cjs`） | ✅ 已落地 |
| 导航激活 `blue-600` 实底 | `brand-100` 底 + `brand-700` 字 | ✅ 已落地 |
| 卡片多色 tint（绿/粉/紫） | 统一 `surface-0` + 单一 icon 色 `brand-500` | ✅ 已落地 |
| `tailwind.config` 无品牌色 | 增加 `brand/surface/ink` 色板 + radius/shadow | ✅ 已落地 |
| 旧 Logo（PNG） | SVG 矢量族（icon + wordmark + favicon），见 2.8 | ✅ 已落地 |
| 下载文件名 `shotEasy.png` | 统一 `pic-tool.png` | ✅ 已落地 |

> 交付物：本方案（文档）+ 视觉稿（`docs/ui-mockup/index.html`，可直接浏览器预览，覆盖首页 / 工具页 / 移动端三屏）。
> 品牌命名：全站产品名已统一为 **pic-tool**（原 ShotEasy/shot-easy/shoteasy 全量替换，i18n 12 语言 + 博客 + 组件 + 配置，0 残留）。
