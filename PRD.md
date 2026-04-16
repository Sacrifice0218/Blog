# 产品需求文档（PRD）& 技术架构说明

## 1. 项目信息
- **项目名称**：从零实现转行后端开发 · 个人技术博客（本地预览版）
- **版本**：v0.1.0（Day1 里程碑）
- **目标**：搭建一个本地可运行的博客原型，实现右侧日历 + 左侧日志内容，支持点击日期自动滚动定位到当天的详细记录。

## 2. 产品概述
一个用于记录“转行后端开发”学习过程的个人博客。初期仅本地运行，界面简洁清晰，突出每日所学内容的层级结构。

**Day1 核心功能**：
- 右侧显示月历，展示当前月份的所有日期。
- 左侧为日志内容区，每天的内容包含一级标题、二级标题、三级标题及对应正文。
- 点击日历上的某一天，页面平滑滚动到该天的内容区块，并高亮显示当前选中日期。

## 3. 功能需求（User Stories）

### 3.1 日历组件
- **展示**：以网格形式显示当前月份（默认为 2026 年 4 月）的所有日期。
- **可点击**：每个日期格子均可点击。
- **选中状态**：点击后该日期背景色变化，表示当前激活日期。
- **今日标识**：若当天为真实“今日”，可加特殊边框或标记（可选，Day1 暂不强求）。

### 3.2 日志内容展示
- **组织方式**：按日期分组，每个日期对应一个独立的 `<section>`，拥有唯一 `id`（例如 `day-2026-04-16`）。
- **层级结构**：
    - 一级标题（`h2` 级别视觉）
    - 二级标题（`h3` 级别视觉）
    - 三级标题（`h4` 级别视觉）
- **正文**：每个标题下方跟随一段或多段正文（`<p>`）。
- **示例结构**：
  ```
  ## 1. 后端基础巩固
  今天重点复习了 HTTP 协议与 RESTful 设计规范。
  ### 1.1 Spring Boot 环境搭建
  完成了 IDEA 项目初始化并跑通第一个接口。
  #### 1.1.1 依赖注入理解
  通过 `@Autowired` 和 `@Component` 的实践加深了 IoC 的理解。
  ```
- **数据驱动**：内容由前端静态数据对象渲染，方便后续替换为 Markdown 或 API。

### 3.3 交互行为
- **点击日历 → 滚动定位**：
    - 获取被点击日期对应的日期字符串（`YYYY-MM-DD`）。
    - 拼接内容区目标 `id`，执行 `document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' })`。
- **更新选中样式**：同时更新日历组件的内部选中状态。

### 3.4 布局要求
- **响应式**：桌面优先，最小宽度 1024px。
- **固定右侧日历**：使用 Flex 或 Grid，右侧宽度约 320px，滚动时日历保持可见（`position: sticky`）。
- **左侧内容**：占据剩余宽度，内边距舒适，字体使用系统默认无衬线字体。

## 4. 非功能需求
- **性能**：初次加载与点击响应在 100ms 内完成。
- **可维护性**：组件化设计，日历与内容区域解耦。
- **本地运行**：无需后端服务，直接通过 `npm run dev` 或打开 `index.html` 即可预览（推荐使用 Vite）。

## 5. 界面原型描述（UI Layout）
```
+-------------------------------------------------------+
|  Header: 从零实现转行后端开发 · 每日日志               |
+---------------------------+---------------------------+
|                           |       [ April 2026 ]      |
|   [Day 16 内容区块]        |   Mo Tu We Th Fr Sa Su    |
|   ## 一级标题              |   1  2  3  4  5  6  7     |
|   正文...                  |   8  9 10 11 12 13 14     |
|   ### 二级标题             |  15 16 17 18 19 20 21     |
|   正文...                  |  22 23 24 25 26 27 28     |
|   #### 三级标题            |  29 30                    |
|   正文...                  |                           |
|                           |   (点击日期高亮)           |
|   [Day 17 内容区块]        |                           |
|   ...                      |                           |
+---------------------------+---------------------------+
```
- 左侧内容区域可滚动，右侧日历 sticky 定位。

## 6. 数据结构设计

### 6.1 每日日志条目（TypeScript 类型描述）
```typescript
interface Section {
  level: 1 | 2 | 3;      // 标题层级
  heading: string;       // 标题文本
  content: string;       // 正文（支持纯文本，后续可扩展 HTML）
}

interface DailyLog {
  date: string;          // "YYYY-MM-DD"
  title?: string;        // 例如 "Day 16"
  sections: Section[];
}
```

### 6.2 示例数据（Mock）
```javascript
const mockLogs: DailyLog[] = [
  {
    date: "2026-04-16",
    title: "Day 16 · 依赖注入与测试",
    sections: [
      { level: 1, heading: "Spring 核心概念", content: "深入学习了 IoC 容器和 Bean 生命周期。" },
      { level: 2, heading: "依赖注入方式", content: "对比了字段注入、构造器注入和 Setter 注入的优劣。" },
      { level: 3, heading: "单元测试实践", content: "使用 JUnit 5 和 Mockito 对 Service 层进行了测试。" }
    ]
  },
  // 可增加 4 月 17 日、18 日等样例数据...
];
```

## 7. 技术架构与选型

| 层级         | 选型                      | 理由                                                                 |
|--------------|---------------------------|----------------------------------------------------------------------|
| 前端框架     | React 18 + TypeScript     | 组件化开发便捷，Codex 熟悉度高，生态丰富。                           |
| 构建工具     | Vite                      | 启动快，HMR 优秀，配置简单。                                          |
| 样式方案     | Tailwind CSS              | 快速实现布局与交互状态，减少手写 CSS。                                |
| 日历组件     | 自定义（基于 date-fns）   | 避免引入重型库，展示对日期逻辑的掌控。可选用 `react-calendar` 作为备选。 |
| 状态管理     | React Hooks (useState)    | 功能简单，无需引入 Redux 等。                                         |
| 代码规范     | ESLint + Prettier         | 保持代码整洁。                                                        |

**备选方案**：若希望更轻量，可直接采用 HTML + Vanilla JS + Tailwind CDN，但考虑到 Codex 执行效率，React 方案更结构化。

## 8. 项目目录结构（建议）
```
project-root/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── Calendar.tsx
│   │   ├── DailyContent.tsx
│   │   └── Layout.tsx
│   ├── data/
│   │   └── mockLogs.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── index.css (Tailwind 指令)
└── public/
```

## 9. 核心实现要点（供 Codex 参考）

### 9.1 日历生成逻辑
- 使用 `date-fns` 获取当前月份的第一天、总天数及起始星期。
- 生成 6 行 × 7 列的日期数组，空白格子填充 `null`。
- 每个日期按钮绑定 `onDateClick(dateStr)`。

### 9.2 滚动定位
```tsx
const handleDateClick = (dateStr: string) => {
  setSelectedDate(dateStr);
  const element = document.getElementById(`day-${dateStr}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
```

### 9.3 内容渲染
- 遍历 `mockLogs`，为每个日志生成 `<section id="day-YYYY-MM-DD">`。
- 内部根据 `sections` 数组渲染对应标题标签（h2/h3/h4）及 `<p>`。

### 9.4 选中状态样式
- 日历组件接收 `selectedDate` prop，为匹配的日期格子添加 `bg-blue-500 text-white` 等 Tailwind 类。

## 10. 验收标准 (Day1)
- [ ] 页面正常渲染，右侧显示 2026 年 4 月日历。
- [ ] 左侧至少展示 3 天以上的示例日志（包含一、二、三级标题及正文）。
- [ ] 点击日历上任意有效日期，页面平滑滚动至对应日志区块。
- [ ] 被点击日期在日历上有明显的高亮样式。
- [ ] 布局符合设计：右侧日历固定，左侧内容区域可滚动。
- [ ] 无控制台报错。

## 11. 后续迭代方向（不在 Day1 范围内）
- 支持切换月份 / 年份。
- 接入 Markdown 解析器，从本地文件系统读取 `.md` 日志。
- 增加暗色模式。
- 添加搜索 / 标签功能。

## 12. 开发与运行命令
```bash
# 初始化项目（Vite + React + TypeScript）
npm create vite@latest blog-demo -- --template react-ts

# 安装依赖
cd blog-demo
npm install
npm install -D tailwindcss postcss autoprefixer date-fns
npx tailwindcss init -p

# 配置 Tailwind (content 路径包含 ./src/**/*.{ts,tsx})
# 启动开发服务器
npm run dev
```

---

*文档版本：1.0*  
*编写日期：2026-04-16*  
*适用执行者：Codex / AI 编码助手*