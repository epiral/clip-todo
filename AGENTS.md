# @pinix/todo — Agent Interface

A GTD-based task manager that works for both humans and AI agents.
Any agent can create, track, and complete tasks through CLI, MCP, or Web UI.

## Commands

### add
Create a new task. Defaults to inbox status, priority 1.
```json
{"title": "Task title", "status?": "inbox", "priority?": 1, "context?": "", "project?": "", "notes?": "", "due_date?": "2025-03-15", "waiting_for?": "", "source?": "agent-name"}
```
Returns: Task object

### list
List tasks with optional filters.
```json
{"status?": "inbox|next|someday|waiting|done", "project?": "project-name", "context?": "@dev", "include_done?": false, "today?": false}
```
Returns: Task[] (sorted by priority ASC, created_at DESC)

### get
Get a single task by ID.
```json
{"id": "abc123"}
```
Returns: Task object

### done
Mark a task as completed. Sets completed_at automatically.
```json
{"id": "abc123"}
```
Returns: Task object (status="done", completed_at set)

### update
Update task fields. Only provided fields are changed.
```json
{"id": "abc123", "title?": "New title", "status?": "next", "priority?": 0, "context?": "@dev", "project?": "my-project", "notes?": "...", "due_date?": "2025-03-15", "waiting_for?": "..."}
```
Returns: Task object

### remove
Permanently delete a task.
```json
{"id": "abc123"}
```
Returns: `{"deleted": true, "id": "abc123"}`

### stats
Get task statistics.
```json
{}
```
Returns: `{"total": N, "inbox": N, "active": N, "done": N, "by_project": [...], "by_context": [...]}`

### history
Get completed task history grouped by date.
```json
{"days?": 30}
```
Returns: Array of date groups with completed tasks

### contexts
List all context tags in use.
```json
{}
```
Returns: `["@dev", "@review", ...]`

### project list
List projects with active task counts.
```json
{"include_archived?": false}
```

### project create
Create a new project.
```json
{"name": "Project name", "color?": "#6366f1"}
```

### project archive
Archive a project.
```json
{"id": "abc123"}
```

## Data Model

### Task
| Field | Type | Description |
|---|---|---|
| id | string | Unique ID |
| title | string | Task title |
| status | enum | inbox, next, someday, waiting, done |
| priority | 0-3 | 0=urgent (shows in Today), 1=high, 2=medium, 3=low |
| context | string | Grouping tag (e.g. @dev, @review) |
| project | string | Project name |
| notes | string | Additional notes |
| waiting_for | string | What this task is waiting for |
| due_date | string? | ISO date YYYY-MM-DD |
| source | string | Creator identity (agent name, user, etc) |
| created_at | number | Unix timestamp |
| completed_at | number? | Unix timestamp |

### GTD Views
- **Inbox** — `list {"status": "inbox"}`
- **Today** — `list {"today": true}` (priority 0 + due today)
- **Next** — `list {"status": "next"}` (grouped by context in Web UI)
- **Someday** — `list {"status": "someday"}`
- **Waiting** — `list {"status": "waiting"}`

## Usage Conventions

1. Use `done` command to complete tasks, not `update` with status=done — `done` sets completed_at automatically
2. New tasks default to inbox — specify status only when needed
3. Use `contexts` to discover existing tags before creating new ones
4. Set `source` when creating tasks so the Web UI shows which agent created what
5. Use `waiting` status with `waiting_for` to track blocked tasks
