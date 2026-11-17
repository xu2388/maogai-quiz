# 毛概马原刷题（maogai-quiz）

一套本地化运行的思政课刷题应用，题库覆盖《毛泽东思想和中国特色社会主义理论体系概论》与《马克思主义基本原理》，提供章节练习、模拟考试、错题本与答题记录等功能，数据全部存本地，不依赖服务器。

## 目录结构

1. `maogai-app/` —— 桌面版（Electron），功能最完整
2. `maogai-quiz/` —— 桌面版（Electron），早期版本
3. `maogai-quiz-mobile/` —— 安卓版（Capacitor）
4. `dataset_raw/` —— 题库原始文本（应用内 questions.json 由此解析生成）

## 功能（以 maogai-app 为例）

1. 章节练习：按章节选题练习，即时判分
2. 模拟考试：整卷作答，交卷出成绩
3. 错题本：自动收集做错的题目，针对性重练
4. 答题记录：查看历史作答与统计
5. 数据本地持久化：桌面端 electron-store，移动端 Capacitor Preferences

## 怎么跑（桌面版）

```bash
cd maogai-app
npm install
npm run dev                # 浏览器预览
npm run electron:dev       # Electron 窗口运行
npm run electron:build:win # 打包 Windows 安装包
```

## 怎么跑（安卓版）

1. `cd maogai-quiz-mobile && npm install`
2. `npm run cap:sync`
3. 用 Android Studio 打开 `android/` 目录构建安装

## 技术栈

React · TypeScript · Vite · Zustand · Recharts · Electron · Capacitor

## 数据说明

1. 应用读取的 `data/questions.json`（毛概）与 `data/questions-mayuan.json`（马原）由 `dataset_raw/` 中的原始文本解析生成
2. 原始试卷、文档等材料未入库
