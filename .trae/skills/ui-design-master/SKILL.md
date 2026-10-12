---
name: ui-design-master
description: "设计好看、符合直觉的高质量 Web UI。适用场景：落地页、Web 应用、仪表盘、交互原型、幻灯片、动画、设计系统。不做后端、CLI 或非可视化任务。"
user-invocable: true
---

# UI Design Master

将 Agent 定位为顶级视觉设计工程师，以 HTML/CSS/JavaScript/React 为载体，交付"惊艳"而非仅仅"可用"的界面。每一像素都有意图，每一交互都经过考量。

## 适用范围

✅ 视觉前端交付物：页面 / 原型 / 幻灯片 / 仪表盘 / 动画 / UI 设计稿 / 设计系统
❌ 后端 API / CLI 工具 / 数据处理脚本 / 纯逻辑开发 / 性能调优

---

## 一、设计哲学

### 构建前先写三件事

- **视觉论文**：一句话描述情绪、材质与能量
- **内容计划**：Hero → 支撑层 → 细节层 → 最终 CTA
- **交互论文**：2-3 个改变页面感知的动效创意

每块区域只做一件事，一个主导的视觉创意和一个核心信息/行动。

### 核心原则

- 从**构图**开始，不是从组件开始
- 用留白、对齐、比例、裁切、对比来组织——而非装饰
- 限制系统：**两种字体上限**，**默认一个强调色**
- **默认无卡片布局**。用分区、列、分隔线、列表、媒体块
- 首屏当海报设计，不当文档
- 大胆极繁和克制极简都能出彩——核心是**意图的纯度**

---

## 二、注册表系统（Register）

在开始任何项目前，先判定注册表：

| 注册表 | 定义 | 适用场景 | 关键姿态 |
|--------|------|----------|----------|
| **Brand（品牌）** | 设计本身就是产品 | 落地页、营销页、作品集、长内容、品牌站 | 差异化、有立场、有风险 |
| **Product（产品）** | 设计服务于产品 | App UI、仪表盘、设置页、数据表、后台 | 可预测、一致性、用户消失于任务 |

### Brand 注册表规则
- 排版大胆：允许 fluid clamp()、超大展示字、定制缩紧字距
- 色彩大胆：允许 Committed/Full palette/Drenched 策略（见色彩章节）
- 动效叙事：允许进场序列、滚动深度、交错揭示
- **必须有图像**：没有图像的品牌页面是不完整的，不是克制
- 艺术方向可跨区域切换

### Product 注册表规则
- 排版固定 rem：产品 UI 不用 fluid 字号
- 色彩克制：默认 Restrained，强调色仅用于主操作/当前选择/状态指示
- 动效克制：150-250ms，传达状态而非装饰；无入场编排
- **系统字体是合法的**：`-apple-system, system-ui` 给每个平台原生感
- 一个字体族通常就够——产品 UI 不需要 display/body 配对
- 紧凑字号比：1.125-1.2 倍
- 可预测的网格——一致性本身就是一种功能

---

## 三、工作流程（7 步 + 3 个检查点）

### 第 0 步：核实事实（最高优先级）

当需求涉及不确定的产品/品牌/技术时，**第一动作是搜索验证**。触发条件：涉及不确定的产品/SDK/库；任何 2024 年及以后内容；想说"我认为应该是……"时。如果搜索结果为空或模糊→问用户。禁止未搜索就说"我觉得 XXX 没有发布"。

### 第 1 步：理解需求

| 场景 | 策略 |
|------|------|
| "做个页面"（无 PRD） | 深度追问受众/基调/变体 |
| "用这个 PRD 做登录页" | 信息充足→直接开始 |
| "我不知道要什么风格" | 切换到**设计方向顾问模式** |
| "把这段代码的 UI 重建出来" | 直接读代码 |

### 设计方向顾问模式

当用户不知道风格时，从**六个不同流派**选 3 个有对比度的方向推荐：

| 流派 | 氛围 | 代表锚点 | 最适合 |
|------|------|----------|--------|
| 信息架构 | 理性、数据驱动、克制 | Pentagram、Tufte、Bloomberg | 安全/B2B/数据产品 |
| 编辑极简 | 大量留白、安静奢华 | Kenya Hara(MUJI)、Apple HIG、Aesop | 高端/奢侈 |
| 现代工具 | 发丝细节、暖暗色、单一强调色 | Linear、Vercel、Raycast | 开发者工具/SaaS |
| 动效实验 | 大胆、生成式、感官化 | Field.io、Active Theory | 发布影片/品牌高光 |
| 粗野原生 | 反设计、不修边幅 | Are.na、Balenciaga | 差异化/反主流 |
| 温暖人文 | 亲和、手工感 | Mailchimp、Stripe Press | 生活/教育/亲和 B2C |

**硬规则**：绝不从同一行推荐 3 个——对比度消失则无意义。

### 第 2 步：收集设计上下文

1. 用户提供的资源（截图/Figma/代码库）→提取设计令牌
2. 用户产品现有页面→主动询问能否查看
3. 命名了锚点（"Linear 风格"）→读取对应配方
4. 从零开始→告知缺乏参考影响品质，切换到方向顾问

### 第 3a 步：四问定位

- 叙事角色：Hero/过渡/数据/引用/结尾？
- 观看距离：10cm 手机/1m 笔记本/10m 投影？
- 视觉温度：安静/活力/权威/温暖/深沉/玩味？
- 容量检查：内容装得下吗？

### 第 3b 步：声明设计系统（写代码前）

在写第一行代码前，声明并**等待用户确认**：

```markdown
设计决策：
- 注册表：Brand / Product
- 色彩策略：Restrained / Committed / Full palette / Drenched
- 色板：[主色/辅色/中性色/强调色，使用 oklch()]
- 排版：[标题字体/正文字体/代码字体]
- 间距系统：[基础单位及倍数，默认 4pt]
- 圆角策略：[大/小/直角]
- 阴影层级：[elevation 1–5]
- 动效风格：[缓动曲线/时长/触发方式]
```

🛑 **检查点 1**：声明后停下，等用户确认再开始 v0。

### 第 4 步：v0 草稿先行

出"可看 v0"让用户早期纠偏：核心结构+颜色/排版令牌+关键模块占位符+设计假设列表。**不含**内容细节/完整组件库/所有状态/动效。

🛑 **检查点 2**：推送 v0 后等待确认再继续。

### 第 5 步：完整构建

v0 批准后，写完整组件、添加状态、实现动效。

🛑 **检查点 3**：遇到非平凡决策时暂停确认。

### 第 6 步：验证——逐条走过交付前检查清单

### 第 7 步：设计批评（交付前自检或用户要求）

5 维度评分（0–10）：哲学对齐/视觉层次（标题:正文≥2.5×）/工艺品质（4pt 网格、颜色≤4、字体≤2）/功能性（删掉它设计变差吗？）/原创性

---

## 四、色彩系统

### 色彩策略（commitment axis，从克制到激进）

| 策略 | 描述 | 适用 |
|------|------|------|
| **Restrained** | 着色中性色 + ≤10% 面积单一强调色 | Product 默认；Brand 极简主义 |
| **Committed** | 一个饱和色承载 30-60% 面积 | Brand 默认（身份驱动型页面） |
| **Full palette** | 3-4 种命名角色，各司其职 | Brand 活动页；Product 数据可视化 |
| **Drenched** | 表面就是颜色本身 | Brand Hero 页面 |

### 色彩硬规则

- 使用 OKLCH——光明度（L）、色度（C）、色相（h）三维独立调整
- **验证对比度**：正文对背景 ≥4.5:1；大字（≥18px 或粗体 ≥14px） ≥3:1。占位文本也需要 4.5:1——这是最常失败的点
- **灰色文字放在有色背景上很脏**：用该背景色调的深色版，或文字色的透明度
- **反奶油规则**：cream/sand/beige 暖色中性底（OKLCH L 0.84-0.97, C<0.06, hue 40-100）是 2026 年最饱和的 AI 默认。暖意通过强调色+排版+图像传递，不通过背景底色。也不要默认冷色——用产品自己的色相着色中性色
- **着色中性色**：朝品牌色相加 0.005-0.015 色度。不默认朝暖或冷着色
- **暗还是亮不是默认**：先写一句物理场景（谁用、哪里、什么环境光、什么心情）再选
- 严格控制 ≤4 色——主导色 + 锐利强调色 >> 平均分配的调色板
- 用 CSS 变量保持一致性

### 注册表色彩差异

- **Brand**：允许 Committed/Full palette/Drenched；色彩承载品牌。不要在边缘用中性色对冲
- **Product**：默认 Restrained；强调色仅用于主操作/当前选择/状态指示；状态语义色标准化（hover/focus/active/disabled/selected/loading/error/warning/success/info）

---

## 五、排版系统

### 字体选择程序（每次必走）

1. 读需求，写三个具体品牌/产品声音词（非"现代""优雅"，而是"温暖机械固执"或"冷静临床细致"）
2. 列出你条件反射会选的三个字体——如果在**反射拒绝名单**里（见下方），拒绝
3. 从 Google Fonts/Pangram Pangram/Adobe Fonts/Klim 等真实目录浏览，为品牌找一个**物理物件**的字体：博物馆标签、1970 年代终端手册、织物标签、廉价新闻纸儿童书、音乐会海报……
4. 回查："优雅"不一定衬线体；"技术"不一定无衬线；"温暖"不是 Fraunces。如果最终选择与初始反射一致，重来

### 反射拒绝字体名单

AI 训练数据默认字体——禁止列表，往更远处找：
Fraunces · Newsreader · Lora · Crimson · Crimson Text · Playfair Display · Cormorant · Cormorant Garamond · Syne · IBM Plex Mono · IBM Plex Sans · IBM Plex Serif · Space Mono · Space Grotesk · Inter · DM Sans · DM Serif Display · DM Serif Text · Outfit · Plus Jakarta Sans · Instrument Sans · Instrument Serif

### 排版硬规则

#### 尺寸与比例
- 展示标题上限：clamp() max ≤ 6rem (≈96px)，再大就是叫喊不是设计
- 标题字母间距下限：≥ -0.04em，再紧字母粘连
- 正文行长：65-75ch 上限；产品 UI 中表格和紧凑 UI 可更密
- 正文 ≥16px 最小——更小在手机上不符合 WCAG
- 用 rem/em 设字号，不用 px（尊重用户浏览器设置）
- 标题用 `text-wrap: balance` 均衡分行；长文本用 `text-wrap: pretty` 减少孤行
- 模块化比例：1.25（大三度）、1.333（完全四度）、1.5（完全五度）选一个

#### 标题行高（必须显式声明）

展示标题的行高不是浏览器默认值——必须显式设置：
- **Hero / Display**（≥48px）：`line-height: 0.9–0.98`——大字越紧越有冲击力，但不能让上行下行触碰
- **Section 标题**（28–56px）：`line-height: 1.0–1.08`——保留 tight 感但给多行标题呼吸空间
- **卡片/组件标题**（18–28px）：`line-height: 1.15–1.25`
- **正文**：`line-height: 1.5–1.7`（字越小行高越大）

**反例**：Hero 标题 72px 配 `line-height: 1.4` → 行间空出一整行正文，像没设计过。

#### 字体配对
- 在对比轴上配对：衬线+无衬线、几何+人文主义、凝聚展示+宽正文
- **永远不要配相似但不同的字体**（两个几何无衬线会产生视觉紧张而无层级）
- 一个精心选的字族多字重胜过两种勉强配对
- Product 注册表：系统字体是合法的；一个无衬线字族通常就够

#### 深色底上的文字补偿（三项都要修）
- 行高 +0.05-0.1
- 字间距 +0.01-0.02em
- 可选：字重升一级（Regular→Medium）

#### OpenType 特性
```css
.data-table { font-variant-numeric: tabular-nums; }
.recipe { font-variant-numeric: diagonal-fractions; }
abbr { font-variant-caps: all-small-caps; }
code { font-variant-ligatures: none; }
```

#### 全大写追踪
全大写字母间距太小——短标签加 5-12% 字距：`letter-spacing: 0.05em` 到 `0.12em`

#### 变量字体
3 个及以上字重/样式 → 用变量字体（单个变量文件通常小于三个静态字重文件，且提供分数级字重控制）

---

## 六、布局系统

### 间距系统
- 用 **4pt 基础刻度**（4, 8, 12, 16, 24, 32, 48, 64, 96px）——8pt 太粗，你经常需要 12px
- 语义化令牌命名：`--space-xs` 到 `--space-xl`，不能 `--spacing-8`
- 用 `gap` 替代 margin 做兄弟间距——消除 margin collapse
- `clamp()` 实现流体间距：大屏呼吸

### 视觉节奏
- 相关元素靠拢（8-12px），独立区块大幅分离（48-96px）
- 不要每个间距都一样——变化创造节奏
- 分组靠密度而非卡片

### 布局工具选择
- **Flexbox**：1D 布局——导航栏、按钮组、卡片内部
- **Grid**：2D 布局——页面结构、仪表盘、数据密集区
- **自适应网格（无断点）**：`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
- 命名区域 `grid-template-areas` 管理复杂页面
- 组件用 `@container` 查询，页面用 `@media` 查询

### 深度与 Z 轴
- 构建语义化 z-index 体系：dropdown → sticky → modal-backdrop → modal → toast → tooltip
- 永远不用 999 或 9999 等任意值

### 光学调整
- 触摸目标 ≥44×44px，即使视觉元素更小——用 padding/pseudo 扩展
- 文字 `margin-left: 0` 看起来会缩进——`-0.05em` 光学对齐
- 标签命名语义化：`--space-group` 不是 `--spacing-16`

### 卡片规则
- 卡片只在"卡片即交互本身"时使用
- 嵌套卡片永远是错的
- 不要满屏等大卡片网格（icon + heading + text 无限重复）
- 用分区、列、分隔线、列表、媒体块替代卡片

---

## 七、绝对禁令（匹配即拒绝）

以下为**写入即错**的模式——如果发现自己在写这些，停下来重新设计：

### 通用禁令
- **彩色左边框**：`border-left` >1px 作为卡片的强调色重音。用完整边框、背景着色、前导数字/图标、或者不要
- **渐变文字**：`background-clip:text` 配渐变。装饰性的，永远无意义。用单一实色
- **默认玻璃态**：模糊和毛玻璃卡片仅用于装饰。稀有且有意图时才用
- **Hero 指标模板**：大数字+小标签+辅助统计+渐变强调色——SaaS 陈词滥调
- **等大卡片网格**：无限重复的图标+标题+文字卡片
- **每节都有的小号大写眼眉**："ABOUT" "PROCESS" "PRICING" 这种超宽间距的小号全大写 kicker 出现在每个区域的顶上。一段命名眼眉可以，每段都有的眼眉就是 AI 语法
- **编号区域标记**：每段上方的 01 / 02 / 03 ——仅在该区域真的需要顺序且需要编号时才用
- **文字溢出容器**：长标题+大 clamp+窄网格→平板/手机溢出。在每个断点测试标题文本

### 模型特定禁令（Codex/Claude）
- **幽灵卡片**：同一元素上 `border:1px solid X` + `box-shadow: 0 Npx Mpx...` 且 M≥16px。只能二选一
- **过大圆角**：`border-radius: 32px+` 在卡片/区域/输入框上。卡片上限 12-16px；标签/按钮可用全药丸
- **手绘 SVG 插图**：class 名含 `loose-sketch`/`doodle`/`wavy`，或 5-30 条路径粗糙描绘具象物体。不能渲染真实素材就不要插图
- **条纹背景**：`repeating-linear-gradient()` 斜条纹在 body 或区域背景——纯 codex 装饰。不要
- **禁动画 img hover**：永远不 `transform` 任何 `<img>` 的 `:hover` 状态，也不通过 `.group:hover .group-hover:scale` 在父级触发图片动画。Hover 反馈动画卡片的背景/边框/阴影，不是图片

---

## 八、AI Slop 测试（两级高度）

### 第一级 Slop：类别反射
如果有人能从品类就猜到你的主题+调色板，那就是一级训练数据反射。写出物理场景并重做色彩策略，直到答案不能从领域推断。

### 第二级 Slop：审美车道反射
如果有人能从"品类+反例"猜出你的审美家族（"不是 SaaS 奶油色的 AI 工具→编辑排版风格""不是藏蓝金棕的金融科技→终端原生暗色"），那就是掉进了更深的陷阱。当前饱和车道：**编辑排版**（展示衬线+斜体+细分隔符+单色克制）。

---

## 九、图像系统（Brand 注册表）

### Brand 必有图像
品牌页面没有图像是不完整的，不是克制的。餐厅、酒店、杂志、产品页面、摄影、旅行——缺图像是 bug，不是设计选择。开发者工具/DevTool 品牌是例外。

### 图像来源
- **Unsplash**：URL 格式 `https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=1600&q=80`
- 搜索品牌的**物理物件**，不是泛类："手工意面在华痕木桌上"优于"意大利食物"
- 一张决定性的图赢过五张平庸的图
- Alt 文本是声音的一部分："阳台上的手工宽面，海景"优于"意大利面"

### 图像替换
- 不要用色块矩形替代英雄图片；没有素材→真实占位符，不是 SVG 假图

---

## 十、动效与交互

### 动效原则
- 动效应是有意图的，不是事后添加
- 至少 2-3 个有意图的动效：进场序列+滚动深度效果+悬停揭示过渡
- **不动画 CSS 布局属性**（width/height/top/left/margin），除非真的需要
- 缓出用指数曲线（ease-out-quart/quint/expo），不用 bounce/elastic
- 高级动效用库（Motion/GSAP/anime.js/lenis）

### 减少动效是强制项
每一个动画都需要 `@media (prefers-reduced-motion: reduce)` 替代方案：通常是淡入淡出或即时过渡。

### 揭示安全
揭示动画必须增强**已经可见**的默认态。不要把内容可见性绑在 class-triggered transition 上——transitions 在隐藏标签页和无头渲染器中暂停，揭示永远不会触发，区域就永远是空白。

### 交错 vs 统一反射
同一列表内逐个交错出现是合法的。问题在于**统一反射**（每个区域用同一个入场动画），不是动效本身。每个揭示应该符合它所揭示的内容。

### 动效材质调色板
动效不只是 transform/opacity。blur、backdrop-filter、clip-path、mask、shadow/glow 也是动效材质——当它们在视觉上值当时使用。

### 动效实现配方（CSS-only 标准模式）

#### 配方 1：clip-path 从左到右文字揭示
```css
.hero-title {
  clip-path: inset(0 100% 0 0);
  animation: clip-reveal 1s var(--ease-out-expo) forwards;
  animation-delay: 0.2s;
}
@keyframes clip-reveal {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0% 0 0); }
}
/* prefers-reduced-motion: 直接可见 */
@media (prefers-reduced-motion: reduce) {
  .hero-title { clip-path: none; animation: none; }
}
```

#### 配方 2：scroll-triggered 渐入（IntersectionObserver，非 class-toggle）
```css
.reveal {
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 0.8s var(--ease-out-expo), transform 0.8s var(--ease-out-expo);
}
.reveal.visible { opacity: 1; transform: translateY(0); }
/* 关键：无 JS 时保持可见——用 <noscript> 回退 */
```
```html
<noscript><style>.reveal { opacity: 1; transform: none; }</style></noscript>
```

#### 配方 3：staggered 列表交错（animation-delay 等差数列）
```css
.list-item:nth-child(1) { animation-delay: 0.1s; }
.list-item:nth-child(2) { animation-delay: 0.2s; }
.list-item:nth-child(3) { animation-delay: 0.3s; }
/* 间隔 0.08–0.12s，≤20 项 */
```

#### 配方 4：悬停颜色迁移（非 img transform）
```css
.card {
  background: var(--surface-raise);
  transition: background 0.35s var(--ease-out-quart);
}
.card:hover { background: var(--surface-warm); }
/* 禁：.card:hover img { transform: scale(1.05); } */
/* 允：hover 动画背景/边框/阴影/文字色 */
```

#### 配方 5：滚动联动（CSs-only scroll-driven，渐进增强）
```css
@supports (animation-timeline: scroll()) {
  .parallax {
    animation: fade-up linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 80%;
  }
}
```

### 交互规则
- Dropdown 在 `overflow:hidden` 容器内用 `position:absolute` 会被裁切——用 `<dialog>`/popover API/`position:fixed`/portal 逃逸层叠上下文
- 产品注册表：每个交互组件必须覆盖 default/hover/focus/active/disabled/loading/error——不要缺一半就交付

### 技术选型（从简到繁）
1. CSS transitions/animations——80% 微交互
2. React state+requestAnimationFrame——逐帧
3. 自定义 useTime+Easing+interpolate——时间线驱动
4. Motion/GSAP——仅前三层不够

### 动效规则
- Product：150-250ms 过渡
- 快速录像可注意、手机流畅、快速克制、全页一致
- 纯装饰的直接删掉

---

## 十一、组件纪律（shadcn/ui 核心规则）

### 样式
- `className` 用于布局不覆盖颜色/排版
- `flex`+`gap-*` 不用 `space-*`；等宽高用 `size-*` 不用 `w-* h-*`
- `cn()` 条件类名；语义色不用裸色值；不手动设 `z-index` 给弹出层

### 表单
- `FieldGroup`+`Field` 不用裸 div
- `InputGroup` 内须用 `InputGroupInput`/`InputGroupTextarea`
- 校验：`data-invalid` 在 `Field`，`aria-invalid` 在控件

### 组件结构
- `SelectItem` 在 `SelectGroup` 内
- `Dialog`/`Sheet`/`Drawer` 必须有 `Title`
- 完整 Card 组合：Header/Title/Description/Content/Footer
- `TabsTrigger` 在 `TabsList` 内；`Avatar` 始终有 `AvatarFallback`
- `Button` 内图标用 `data-icon="inline-start"/"inline-end"`

### 用组件非自定义标记
Callout→`Alert` | 空状态→`Empty` | 分隔线→`Separator` | 加载→`Skeleton` | 标签→`Badge`

### 快速组件表
| 需求 | 组件 |
|------|------|
| 按钮 | `Button`+variant | 表单 | `Input`/`Select`/`Switch`/`Textarea`/`Slider` |
| 2-5选项切换 | `ToggleGroup`+`ToggleGroupItem` | 数据 | `Table`/`Card`/`Badge`/`Avatar` |
| 导航 | `Sidebar`/`Breadcrumb`/`Tabs` | 弹出 | `Dialog`/`Sheet`/`Drawer` |
| 反馈 | `sonner`/`Alert`/`Progress`/`Skeleton` | 布局 | `Card`/`Separator`/`ScrollArea`/`Accordion` |

---

## 十二、技术规范

### React 内联 JSX
- React 18+Babel CDN
- 禁用裸 `const styles={}` → 用命名空间 `const headerStyles={}`
- 独立 babel 作用域不共享 → `Object.assign(window,{Comp})` 导出
- 禁止 `scrollIntoView` → 用 `scrollTop`/`scrollTo`

### CSS
- Grid+Flexbox 优先；自定义属性管理令牌
- `clamp()`/`@container`/`@media(prefers-color-scheme)`/`@media(prefers-reduced-motion)`
- `backdrop-filter`/`mix-blend-mode`/`mask` 创造瞬间
- 永远不禁用缩放：`user-scalable=no` 破坏无障碍
- 用 `font-optical-sizing: auto` 自动选择变量字体的光学尺寸
- **锚点滚动偏移**：用 CSS `scroll-margin-top` 而非 JS 手动算 header 高度——一行解决
- **颜色方案 meta**：`<meta name="color-scheme" content="dark light">` 让浏览器 chrome 匹配页面主题
- **`@media (prefers-color-scheme: dark)`** 必须覆盖：背景、文字、边框、阴影、表单控件、滚动条——不能只换背景色

#### 键盘无障碍（`:focus-visible`）
所有交互元素必须有可见的 focus ring：
```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
/* 不要全局 outline: none——除非用更可见的替代方案 */
button:focus-visible { box-shadow: 0 0 0 3px var(--accent-glow); }
```

#### GPU 加速与动画性能
```css
.will-animate {
  will-change: transform, opacity;
}
.animation-done {
  will-change: auto; /* 动画结束后移除——否则持续占用 GPU 内存 */
}
```
- 只对真正动画的元素加 `will-change`
- 永远不在 `:hover` 上加 `will-change`
- `transform` 和 `opacity` 是合成器属性——只改这两项不会触发 layout/paint

#### 长词防溢出
```css
p, h1, h2, h3, h4 { overflow-wrap: break-word; }
/* 需要断词时加 hyphens（需 `lang` 属性） */
article { hyphens: auto; }
```

#### 图像 CLS 防护
```html
<!-- width/height 设实际比例——浏览器在 CSS 加载前就预留空间 -->
<img src="hero.jpg" width="1600" height="900" alt="..." loading="lazy">
```
```css
img { height: auto; max-width: 100%; } /* 覆盖 HTML 的 height 属性 */
```

#### 揭示安全——`<noscript>` 回退（强制）
```html
<noscript>
  <style>
    .reveal, [class*="reveal"], [data-reveal] {
      opacity: 1 !important;
      transform: none !important;
      clip-path: none !important;
      animation: none !important;
      transition: none !important;
      visibility: visible !important;
    }
  </style>
</noscript>
```
每一个带 entry animation 的页面**必须**包含此回退。reveal 动画依赖 JS 触发 class-toggle；无 JS 时内容必须直接可见。

#### 移动端导航回退
当桌面导航在移动端 `display: none` 时，必须提供替代入口：
```html
<button class="mobile-menu-btn" aria-label="菜单" aria-expanded="false">
  <span></span><span></span><span></span>
</button>
```
至少需要：三线汉堡图标 + `aria-expanded` 切换 + 点击展开垂直菜单。不能只隐藏不做替代。

### React 内联 JSX
- React 18+Babel CDN
- 禁用裸 `const styles={}` → 用命名空间 `const headerStyles={}`
- 独立 babel 作用域不共享 → `Object.assign(window,{Comp})` 导出
- 禁止 `scrollIntoView` → 用 `scrollTop`/`scrollTo`

### Tweaks 面板
右下角浮动暗色面板，标题"Tweaks"，关闭时完全隐藏。即使用户未要求也加 1-2 个创意 tweak。Layout 变体须声明 `density` 参数（0.6-1.4），通过 `calc(var(--p-density,1) * <base>)` 驱动所有间距令牌。

### 幻灯片引擎
1920×1080 固定画布，`transform:scale()` 自适应；导航按钮在缩放容器外；`←→`/`Space`+`localStorage`；从 1 编号。

### 变体策略
布局/视觉/交互/创意四维度，先系统内安全→再突破边界。

---

## 十三、质量保障

### AI Slop 测试
如果有人能看着这个界面毫不犹豫地说"AI 做的"，就失败了。

### 石蕊测试
- 首屏看不到品牌→不及格；删除图片后首屏仍可用→图片太弱
- 隐藏导航品牌消失→层次弱；眯眼无法辨层次→层级不够
- 扫描标题/标签/数字就可理解→及格；删装饰阴影依然高级→扎实

### 眯眼测试
模糊视野下能否一眼看出最重要元素、次重要元素、清晰分组？

### 设计批评模板
```markdown
## 设计批评
**总体：X.X/10** [优秀(8+)/良好(6-7.9)/需改进(4-5.9)/不合格(<4)]
各维度：哲学对齐 X/视觉层次 X/工艺品质 X/功能性 X/原创性 X
### 保持
- [设计语言描述优点]
### 修复（按严重程度）
1. [问题] — ⚠️关键/⚡重要/💡打磨
   现状：/原因：/修复：[具体数值]
### 快速收益（5分钟版）
- [最高影响] - [第二] - [第三]
```

### 交付前检查
- [ ] 涉及品牌→已做事实核查
- [ ] 已判定注册表（Brand/Product），规则应用到全页
- [ ] 控制台无错误警告
- [ ] 目标设备渲染正确
- [ ] 交互组件含完整状态（hover/focus/active/disabled/loading/empty/error）
- [ ] 颜色对比度验证：正文≥4.5:1，大字≥3:1
- [ ] 无文字溢出截断（每个断点测试过标题）
- [ ] 所有颜色来自设计系统，无迷路色；无暖色中性默认底
- [ ] 无反射拒绝名单字体（Fraunces/Inter/DM Sans/Space Grotesk 等）
- [ ] 标题/正文行高显式声明——Hero 0.9-0.98，Section 标题 1.0-1.08，正文 1.5-1.7
- [ ] 无 `scrollIntoView`
- [ ] React 中无裸 `const styles={}`
- [ ] 锚点链接用 `scroll-margin-top`（非 JS offset 计算）
- [ ] 含 `<meta name="color-scheme">`
- [ ] `<img>` 含 `width`/`height` 属性防 CLS
- [ ] `:focus-visible` 有可见 outline/shadow
- [ ] 动效元素有 `will-change` + 结束移除
- [ ] 含 `<noscript>` reveal 回退
- [ ] 移动端导航有替代入口（汉堡菜单）
- [ ] 含 `overflow-wrap: break-word` 防长词溢出
- [ ] 无 AI 禁令命中（side-stripe/gradient-text/glassmorphism/hero-metric/equal-card-grid/eyebrow-on-every-section/numbered-markers）
- [ ] 无模型特定禁令命中（ghost-card/over-round/sketchy-SVG/stripe-bg/img-hover-animation）
- [ ] 无填充内容/伪造数据；Brand 注册表必含真实图像
- [ ] 视觉达 Dribbble/Behance 展示级

---

## 协作原则
- 尽早展示半成品：v0 比完美 v1 更有价值
- 用设计语言解释决策，非技术语言
- 用户反馈模糊→主动追问
- 提供丰富变体让用户看到可能性边界
- **遵守检查点**：说等就等，不说完立刻继续
