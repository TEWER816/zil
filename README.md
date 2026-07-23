【前言】
我是一个很普通的学生，这个项目是我在TRAE AI创造力大赛的参赛项目，只可惜落选了，但是我想继续把这个项目做下去！欢迎各位大佬！交流群:860535049
# Zil

> 一款帮助你养成习惯、专注当下、记录心情的桌面应用。

Zil 是一个基于 React + TypeScript + Electron 开发的跨平台桌面应用。它把习惯打卡、专注计时、日历回顾、心情记录和成长陪伴整合在一起，希望让你的每一天都更有条理、更有趣。

---

## ✨ 主要功能

| 功能 | 说明 |
|------|------|
| 📝 习惯管理 | 创建日常习惯，支持打卡、进度追踪和优先级排序 |
| 🎯 专注模式 | 番茄钟专注计时，完成任务获得正向反馈 |
| 📅 日历视图 | 在日历上查看打卡记录，回顾自己的坚持轨迹 |
| 😊 心情打卡 | 每日记录心情，用简单的情绪标签留下当天的感受 |
| 🌳 成长树 | 随着习惯坚持和专注完成，树苗会逐渐成长 |
| 🐱 Zil 小猫 | 桌面陪伴小伙伴，会根据你的行为给出鼓励和提醒 |
| 🤖 智能建议 | 基于你的使用数据，推荐接下来适合专注或养成的习惯 |
| ⚙️ 个性化设置 | 主题、提醒、同步等选项，按需定制 |

---

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 18 或更高版本
- npm（Node.js 自带）

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
# 启动前端开发服务器
npm run dev

# 如果需要本地后端服务（数据同步）
npm run server:install
npm run server:dev
```

### 以桌面应用方式运行

```bash
# 开发模式启动 Electron
npm run electron

# 或者先构建再运行
npm run desktop
```

---

## 🛠 技术栈

- **前端框架：** React 18 + TypeScript
- **构建工具：** Vite 6
- **桌面壳：** Electron
- **样式方案：** Tailwind CSS
- **状态管理：** Zustand
- **动画效果：** Framer Motion
- **图标库：** Lucide React
- **后端服务：** Node.js + Express（可选，用于数据同步）

---

## 📦 打包发布

```bash
# 构建并打包为安装程序（Windows NSIS）
npm run dist
```

打包产物会输出到 `release3` 目录。

---

## 📁 项目结构

```
zilu/
├── electron/           # Electron 主进程与预加载脚本
├── public/             # 静态资源
├── server/             # 可选的本地同步后端
├── src/
│   ├── components/     # React 组件
│   ├── pages/          # 页面级组件
│   ├── store/          # Zustand 状态仓库
│   ├── lib/            # 工具函数与智能推荐逻辑
│   └── assets/         # 图片、图标等资源
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 📄 许可证

本项目采用 [Apache License 2.0](LICENSE) 开源许可证。

你可以自由使用、修改和分发本软件，但请保留原始许可证和版权声明。

---

## 💬 说明

Zil 是个人学习与练手项目，功能会持续迭代。如果你有任何建议或发现 bug，欢迎通过 GitHub Issues 交流。

祝你用得开心，坚持有所成！🌱
