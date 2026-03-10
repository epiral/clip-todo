# Todo Clip — Agent Interface

> **首次使用前必读**：先执行 `get-philosophy` 获取完整的 Orchestrator GTD 工作哲学。
> 不理解哲学直接操作 = 录入垃圾数据。

你正在操作一个基于 **Orchestrator GTD** 哲学设计的待办系统。
用户（Orchestrator）是调度者，你（Agent）是执行者。

---

## 业务模型

### 任务状态 (status)
- `inbox` — 收集箱，待处理
- `next` — 下一步行动，可执行
- `someday` — 将来也许
- `waiting` — 等待中（配合 waiting_for 字段说明等待对象）
- `done` — 已完成

### 优先级 (priority)
- `0` — 紧急（出现在 Today 视图）
- `1` — 高（默认）
- `2` — 中
- `3` — 低

### Context（心智切换标签，非物理场景）
- `@O-dispatch` — 拆解/派发给 Agent
- `@O-review` — 验收/纠偏 Agent 输出
- `@H-deep` — 深度思考/输出（不可替代）
- `@H-comm` — 沟通/对齐
- `@H-admin` — 杂务维护

**先用 `context-list` 发现已有 context，再使用。**

### GTD 视图对应关系
- **Inbox** → `task-list {"status": "inbox"}`
- **Today** → `task-list {"today": true}`
- **Next** → `task-list {"status": "next"}`（前端按 context 分组）
- **Someday** → `task-list {"status": "someday"}`
- **Waiting** → `task-list {"status": "waiting"}`

---

## Commands

### get-philosophy
stdin: `{}`
stdout: Orchestrator GTD 完整哲学文档（Markdown 格式）

### task-list
stdin: `{"status?": "inbox|next|someday|waiting|done", "project_id?": 1, "context?": "@dev", "today?": true, "include_done?": false}`
stdout: `[{id, title, status, priority, context, project_id, due_date, notes, waiting_for, completed_at, created_at}, ...]`

### task-create
stdin: `{"title": "任务标题", "project_id?": 1, "context?": "@H-deep", "priority?": 1, "due_date?": "2025-03-15", "status?": "inbox", "notes?": "", "waiting_for?": ""}`
stdout: `{task对象}`

### task-update
stdin: `{"id": 1, "title?": "新标题", "status?": "next", "priority?": 0, "context?": "@O-dispatch", "project_id?": 2, "due_date?": "2025-03-15", "notes?": "...", "waiting_for?": "..."}`
stdout: `{task对象}`

### task-done
stdin: `{"id": 1}`
stdout: `{task对象}`（status="done", completed_at 已设置）

### task-undone
stdin: `{"id": 1}`
stdout: `{task对象}`（status="inbox", completed_at=null）

### task-delete
stdin: `{"id": 1}`
stdout: `{"deleted": true, "id": 1}`

### task-history
stdin: `{"limit?": 30}`
stdout: 按日期分组的已完成任务列表

### project-list
stdin: `{"include_archived?": false, "area?": "work"}`
stdout: `[{id, name, color, area, archived, created_at, task_count}, ...]`

### project-create
stdin: `{"name": "项目名", "color?": "#8b6f47", "area?": "work|sprint|personal"}`
stdout: `{project对象}`

### project-update
stdin: `{"id": 1, "name?": "新名称", "color?": "#ff0000", "area?": "personal"}`
stdout: `{project对象}`

### project-archive
stdin: `{"id": 1}`
stdout: `{project对象}`（archived=true）

### context-list
stdin: `{}`
stdout: `["@O-dispatch", "@H-deep", ...]`

### context-rename
stdin: `{"from": "@dev", "to": "@O-dispatch"}`
stdout: `{"updated": 5}`

### context-delete
stdin: `{"context": "@dev"}`
stdout: `{"updated": 5}`

### db-query
stdin: `{"sql": "SELECT * FROM tasks WHERE status='inbox'"}`
stdout: 查询结果数组（仅 SELECT）

### db-execute
stdin: `{"sql": "UPDATE tasks SET priority=0 WHERE id=11"}`
stdout: `{"changes": 1, "lastInsertRowid": 0}`

---

## 使用约定

1. **首次操作前执行 `get-philosophy`** — 理解 O/H 模式后再录入任务
2. **完成任务用 `task-done`，不要用 `task-update` 设 status=done** — task-done 会自动设置 completed_at
3. **创建任务默认进 inbox** — 除非用户明确指定 status
4. **due_date 格式** — 传 ISO 日期字符串如 "2025-03-15"，内部转为 Unix 时间戳
5. **使用 context 前先 `context-list`** — 避免重复创建相似的 context
6. **waiting 状态配合 waiting_for** — 说明在等待什么人/事
7. **冲刺任务优先于维护任务** — 有 Deadline 的项目永远排前面
