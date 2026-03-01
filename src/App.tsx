import { useState, useMemo } from "react";
import { useTasks } from "./hooks/useTasks";
import { useProjects } from "./hooks/useProjects";
import TabBar, { type TabId } from "./components/TabBar";
import TaskCard from "./components/TaskCard";
import TaskDetail from "./components/TaskDetail";
import ProjectList from "./components/ProjectList";
import type { Task } from "./hooks/useTasks";
import type { KeyboardEvent } from "react";

// 今日零点 + 明日零点 (seconds)
function todayRange(): [number, number] {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const start = Math.floor(d.getTime() / 1000);
  return [start, start + 86400];
}

// context 分组顺序
const CONTEXT_ORDER = ["@dev", "@mobile", "@pi", "@waiting", ""] as const;
function contextLabel(ctx: string): string {
  if (!ctx) return "Other";
  return ctx;
}

export default function App() {
  const { tasks, add, update, complete, uncomplete, remove } = useTasks();
  const { projects, add: addProject } = useProjects();
  const [tab, setTab] = useState<TabId>("inbox");
  const [selected, setSelected] = useState<Task | null>(null);
  const [inboxInput, setInboxInput] = useState("");

  // 过滤各视图任务
  const inboxTasks = useMemo(
    () => tasks.filter((t) => t.status === "inbox"),
    [tasks]
  );

  const todayTasks = useMemo(() => {
    const [start, end] = todayRange();
    return tasks
      .filter(
        (t) =>
          t.status !== "done" &&
          (t.priority === 0 ||
            (t.due_date != null && t.due_date >= start && t.due_date < end))
      )
      .sort((a, b) => a.priority - b.priority);
  }, [tasks]);

  const nextTasks = useMemo(
    () => tasks.filter((t) => t.status === "next"),
    [tasks]
  );

  const somedayTasks = useMemo(
    () => tasks.filter((t) => t.status === "someday"),
    [tasks]
  );

  // context 分组
  const nextByContext = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const ctx of CONTEXT_ORDER) {
      groups.set(ctx, []);
    }
    for (const t of nextTasks) {
      const ctx = t.context || "";
      if (!groups.has(ctx)) groups.set(ctx, []);
      groups.get(ctx)!.push(t);
    }
    return groups;
  }, [nextTasks]);

  const [collapsedCtx, setCollapsedCtx] = useState<Set<string>>(new Set());
  const toggleCtx = (ctx: string) => {
    setCollapsedCtx((prev) => {
      const next = new Set(prev);
      if (next.has(ctx)) next.delete(ctx);
      else next.add(ctx);
      return next;
    });
  };

  // Tab badges
  const badges: Partial<Record<TabId, number>> = {
    inbox: inboxTasks.length || undefined,
    today: todayTasks.length || undefined,
  };

  const handleToggle = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === "done") {
      uncomplete(id);
    } else {
      complete(id);
    }
  };

  const handleSelect = (task: Task) => {
    setSelected(task);
  };

  const handleUpdate = (id: number, fields: Partial<Omit<Task, "id" | "created_at">>) => {
    update(id, fields);
    // 同步 selected 任务的本地状态
    setSelected((prev) => (prev && prev.id === id ? { ...prev, ...fields } : prev));
  };

  const handleInboxKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && inboxInput.trim()) {
      add(inboxInput);
      setInboxInput("");
    }
  };

  return (
    <div className="app">
      <div className="app-content">
        {tab === "inbox" && (
          <div className="view">
            <h1 className="view-title">Inbox</h1>
            <input
              className="inbox-input"
              placeholder="Capture anything..."
              value={inboxInput}
              onChange={(e) => setInboxInput(e.target.value)}
              onKeyDown={handleInboxKey}
              autoFocus
            />
            {inboxTasks.length === 0 ? (
              <p className="empty-hint">Inbox Zero!</p>
            ) : (
              <div className="task-list">
                {inboxTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onToggle={handleToggle}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "today" && (
          <div className="view">
            <h1 className="view-title">Today</h1>
            {todayTasks.length === 0 ? (
              <p className="empty-hint">Nothing urgent today</p>
            ) : (
              <div className="task-list">
                {todayTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onToggle={handleToggle}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "next" && (
          <div className="view">
            <h1 className="view-title">Next Actions</h1>
            {nextTasks.length === 0 ? (
              <p className="empty-hint">No next actions</p>
            ) : (
              <div className="context-groups">
                {Array.from(nextByContext.entries()).map(([ctx, ctxTasks]) => {
                  if (ctxTasks.length === 0) return null;
                  const collapsed = collapsedCtx.has(ctx);
                  return (
                    <div key={ctx} className="context-group">
                      <button
                        className="context-group-header"
                        onClick={() => toggleCtx(ctx)}
                      >
                        <span className={`arrow ${collapsed ? "" : "open"}`}>
                          &rsaquo;
                        </span>
                        <span className="context-group-label">
                          {contextLabel(ctx)}
                        </span>
                        <span className="context-group-count">
                          {ctxTasks.length}
                        </span>
                      </button>
                      {!collapsed && (
                        <div className="task-list">
                          {ctxTasks.map((t) => (
                            <TaskCard
                              key={t.id}
                              task={t}
                              onToggle={handleToggle}
                              onSelect={handleSelect}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "projects" && (
          <div className="view">
            <h1 className="view-title">Projects</h1>
            <ProjectList
              projects={projects}
              tasks={tasks}
              onAddProject={addProject}
              onToggleTask={handleToggle}
              onSelectTask={handleSelect}
            />
          </div>
        )}

        {tab === "someday" && (
          <div className="view">
            <h1 className="view-title">Someday / Maybe</h1>
            {somedayTasks.length === 0 ? (
              <p className="empty-hint">No someday items</p>
            ) : (
              <div className="task-list">
                {somedayTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onToggle={handleToggle}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <TabBar active={tab} onChange={setTab} badges={badges} />

      {selected && (
        <TaskDetail
          task={selected}
          projects={projects}
          onUpdate={handleUpdate}
          onRemove={remove}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
