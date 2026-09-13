# pic-tool → EdgeOne Pages 部署教程

> 仓库：`talunte50/pic-tool`（GitHub）
> 目标：静态构建 + 环境变量控制百度联盟广告 + 部署到腾讯 EdgeOne Pages
> 更新日期：2026-09-13
> 依赖：Node 20.x（`package.json` 的 `engines.node`）

本教程给两条部署路径，**推荐路径 A（GitHub 直连，自动 CI/CD）**：以后每次 push 自动重新构建上线。

---

## 0. 前置检查（GitHub 侧）

1. 确认 `talunte50/pic-tool` 仓库已推送成功，`main` 分支有完整源码（398 文件，含 `astro.config.mjs`、`package.json`、`public/`、`src/`）。
2. 确认仓库里**没有** `node_modules/`、`dist/`、`store/`、`.env`（这些已被排除）。
3. 确认 `package.json` 构建命令可用：
   ```
   build: "astro check && astro build"
   ```
4. 构建前需要装依赖 + 装 Playwright 浏览器（冒烟测试用；若只部署可跳过测试，见下）。

---

## 路径 A：GitHub 仓库直连 EdgeOne（推荐，CI/CD）

### A-1 创建 EdgeOne Pages 项目
1. 登录 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone) → 左侧「边缘安全加速 / 开发服务」→ **Pages**。
2. 点「**创建项目**」→ 选「**通过 Git 仓库创建**」→「GitHub」。
3. 首次需授权 GitHub（OAuth 弹授权页，同意）→ 选择账号 `talunte50` 的仓库 **`pic-tool`** → 分支选 **`main`**。
4. 配置构建参数（见下表）→ 点「**开始部署**」。

### A-2 构建参数

| 参数 | 值 | 说明 |
|---|---|---|
| 框架 | 手动填写（或选 Astro） | |
| 安装命令 | `npm install --no-audit --no-fund` | 装依赖（仓库含 `pnpm-lock.yaml`，但 EdgeOne 用 npm 装即可，依赖可复现） |
| 构建命令 | `npm run build` | = `astro check && astro build` |
| 输出目录 | `dist` | Astro 静态产物 |
| Node 版本 | **20.x** | 与 `engines` 一致，选 18 会报版本不匹配 |
| 包管理器 | npm | 仓库带 `pnpm-lock.yaml`，但 EdgeOne 用 npm 装依赖可正常复现 |

> ⚠️ 依赖里含 `@playwright/test`。EdgeOne 构建只跑 `npm run build`，**不会**跑 `npm test`，所以 Playwright 浏览器不必安装，不影响部署。若想跳过类型检查加快速度，可把构建命令改成 `npm install && npx astro build`（去掉 `astro check`）。

### A-3 配置环境变量（关键）
EdgeOne 控制台 → 项目 → 「**项目设置**」→「**环境变量**」，填入：

```
PUBLIC_ENABLE_ADS = true
PUBLIC_Baidu_Pid = 你的百度联盟渠道ID
PUBLIC_Baidu_AdsWidth = 750
PUBLIC_Baidu_AdsHeight = 90
```

可选（按需）：

```
PUBLIC_ENABLE_INTERSTITIALS = false
PUBLIC_ENABLE_INFEED = false
PUBLIC_REMOVE_BG_MODEL = Xenova/modnet
```

> **重要**：Astro 只在**构建时**读取 `PUBLIC_*` 前缀变量，必须配在 EdgeOne 控制台的环境变量里，CI 构建时会自动注入到 `import.meta.env`。不配 `PUBLIC_Baidu_Pid` 时广告静默隐藏。

### A-4 部署完成
- 部署成功后分配默认域名 `pic-tool-xxxx.edgeone.site`（或你起的名字）。
- ⚠️ 默认域名只有**短期预览**，生产必须绑自定义域名（见「路径 C」）。

---

## 路径 B：本地构建 + ZIP 上传（快速验证）

适合先跑通、不接 CI 的场景：

```bash
cd shot-easy/shot-easy-website-main
npm install
# 创建 .env（参考 .env.example），填广告变量
cp .env.example .env
# 构建
npm run build
# 产物在 dist/，压缩
# Windows:  右键 dist → 压缩为 dist.zip
# 命令行:    powershell Compress-Zip -Path dist -DestinationPath dist.zip
```

1. EdgeOne 控制台 → Pages →「创建项目」→「**直接上传 ZIP**」。
2. 上传 `dist.zip` → 点「**部署**」。
3. 环境变量（广告变量）同样在「项目设置 → 环境变量」里配——**但 ZIP 直传是静态产物，环境变量在构建时注入，ZIP 里已是编译结果**。
   - 因此 ZIP 路径下，广告变量必须**在本地 `.env` 配好再构建**，ZIP 上传后改控制台环境变量不会重新编译。
   - 需要频繁改广告配置 → 走路径 A（CI/CD 会重新构建注入）。

---

## 路径 C：绑定自定义域名（生产必须）

1. 前提：域名已在腾讯云或支持 CNAME 的 DNS 服务商处，中国大陆可用区需已备案。
2. EdgeOne 控制台 → 你的项目 →「**项目设置**」→「**域名管理**」→「**添加自定义域名**」。
3. 输入如 `tool.pic-tool.fun`，按提示在 DNS 服务商处加解析：
   ```
   记录类型：CNAME
   主机记录：tool
   记录值：pic-tool-xxxx.edgeone.site   （EdgeOne 分配的默认域名）
   ```
4. DNS 生效（5–30 分钟）后回 EdgeOne「**验证域名**」，状态变「已部署」。
5. 自动 HTTPS：EdgeOne 自动签发免费证书，无需手动配 SSL。

---

## 路径 D：（可选）重定向 & 缓存规则

### 重定向（原 `middleware.js` 的 301）
EdgeOne 静态托管下在「**边缘规则**」→「重写/重定向」手动加：
```
/in/*   →  /en-in/$1   (301)
/pt-br  →  /pt-br/     (301)
```
具体规则参考 `src/middleware.js` 逻辑。

### 缓存（WASM / 静态资源）
「**缓存配置**」加规则：
```
匹配路径：/assets/* 、 *.wasm 、 /ffmpeg-worker.js 、 /public/libarchive.js/*
策略：强缓存 1 年（Cache-Control: max-age=31536000, immutable）
```
项目有大量 `*.wasm`（avif/png/gif/ocr）与 ffmpeg worker，缓存可显著降低首载。

---

## 验证清单

- [ ] `dist/index.html` 里能搜到 `baidu.com/dsp/js/libs/dsp.js`（广告脚本已注入，仅当 `PUBLIC_ENABLE_ADS=true` 且配了 Pid）
- [ ] 搜不到 `googletagmanager` / `adsbygoogle`（Google 广告已删）
- [ ] 控制台无 404（`remove-bg.js` 已删，背景去除走浏览器本地 ModNet）
- [ ] 首页能看到新 Indigo logo（`/pic-tool-logo.svg`）
- [ ] PWA：手机浏览器可「添加到主屏幕」，断网可回退首页（`public/sw.js`）

---

## 广告控制速查

| 场景 | 操作 |
|---|---|
| 完全关广告 | 环境变量 `PUBLIC_ENABLE_ADS=false`，重新部署 |
| 启用百度联盟 | `PUBLIC_ENABLE_ADS=true` + `PUBLIC_Baidu_Pid=你的ID`，重新部署 |
| 换广告尺寸 | 改 `PUBLIC_Baidu_AdsWidth` / `PUBLIC_Baidu_AdsHeight` |
| 启用结果插层广告 | `PUBLIC_ENABLE_INTERSTITIALS=true` |
| 启用原生信息流 | `PUBLIC_ENABLE_INFEED=true` |
| 按页面关广告 | 编辑 `src/layouts/Layout.astro` 删 `<AdSlot />` 行，重新 push 构建 |

> 所有改动需 **重新 push 触发 CI 构建**（路径 A）或 **本地重新 build + 上传**（路径 B）才生效。

---

## 常见问题

**Q：构建报 Node 版本错误**
A：EdgeOne 构建参数 Node 版本改 20.x（`engines.node = "20.x"`）。

**Q：广告不显示**
A：查三处——① `PUBLIC_ENABLE_ADS=true`；② `PUBLIC_Baidu_Pid` 非空；③ 已重新部署（变量是构建时注入）。控制台搜 `dsp.js` 确认脚本存在。

**Q：构建超时 / OOM**
A：`@playwright/test` 仅 devDependency，不影响 build。若仍慢，构建命令改 `npm install && npx astro build` 跳过 `astro check`。

**Q：中文路径 / 文件编码**
A：源码全 ASCII/UTF-8，无 CJK 路径问题。Git 仓库走的是 GitHub，无中文目录名。
