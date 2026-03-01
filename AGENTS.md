# Todo Clip — AGENTS.md

## 项目定位
基于 Agent Playground 架构的 Todo 管理 Clip，运行在 WKWebView 中，通过 `window.AgentBridge` 与 Native 通信。

## 技术栈
- Vite + React + TypeScript
- pnpm

## 构建
```bash
pnpm build
```
产物在 `dist/` 目录。

## 部署
将 `dist/` 内容上传到云端 `/var/www/html/playground/todo/`：
```bash
rsync -avz dist/ ubuntu@182.254.168.117:/var/www/html/playground/todo/
```

## 数据存储
- 使用 `AgentBridge.db`（SQLite）存储 Todo 数据
- 备用：`AgentBridge.webdav` 读写 WebDAV 文件

## AgentBridge 类型
见 `src/types/bridge.d.ts`

## 开发注意
- 打包 base 路径为 `/playground/todo/`，本地开发时资源路径可能有差异，以部署后为准
- `window.AgentBridge` 在纯浏览器环境下为 `undefined`，需要做降级 fallback
