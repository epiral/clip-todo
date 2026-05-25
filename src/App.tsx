import { useState, useMemo } from 'react';
import { useTasks } from './hooks/useTasks';
import { useProjects } from './hooks/useProjects';
import { useContexts } from './hooks/useContexts';
import TabBar, { type TabId } from './components/TabBar';
import TaskCard from './components/TaskCard';
import TaskDetail from './components/TaskDetail';
import ProjectList from './components/ProjectList';
import Logbook from './components/Logbook';
import type { Task } from './types';
import type { KeyboardEvent } from 'react';

function contextLabel(ctx: string): string {
  return ctx || 'Other';
}

export default function App() {
  const { tasks, add, update, complete, uncomplete, remove } = useTasks();
  const { projects, add: addProject } = useProjects();
  const { contexts } = useContexts();
  const [tab, setTab] = useState<TabId>('inbox');
  const [selected, setSelected] = useState<Task | null>(null);
  const [inboxInput, setInboxInput] = useState('');

  const inboxTasks = useMemo(
    () => tasks.filter((t) => t.status === 'inbox'),
    [tasks],
  );

  const todayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return tasks
      .filter((t) =>
        t.status !== 'done' &&
        (t.priority === 0 || t.due_date === todayStr)
      )
      .sort((a, b) => a.priority - b.priority);
  }, [tasks]);

  const nextTasks = useMemo(
    () => tasks.filter((t) => t.status === 'next'),
    [tasks],
  );

  const somedayTasks = useMemo(
    () => tasks.filter((t) => t.status === 'someday'),
    [tasks],
  );

  const nextByContext = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const ctx of contexts) groups.set(ctx, []);
    groups.set('', []);
    for (const t of nextTasks) {
      const ctx = t.context || '';
      if (!groups.has(ctx)) groups.set(ctx, []);
      groups.get(ctx)!.push(t);
    }
    return groups;
  }, [nextTasks, contexts]);

  const [collapsedCtx, setCollapsedCtx] = useState<Set<string>>(new Set());
  const toggleCtx = (ctx: string) => {
    setCollapsedCtx((prev) => {
      const next = new Set(prev);
      if (next.has(ctx)) next.delete(ctx);
      else next.add(ctx);
      return next;
    });
  };

  const badges: Partial<Record<TabId, number>> = {
    inbox: inboxTasks.length || undefined,
    today: todayTasks.length || undefined,
  };

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === 'done') uncomplete(id);
    else complete(id);
  };

  const handleSelect = (task: Task) => setSelected(task);

  const handleUpdate = (id: string, fields: Partial<Omit<Task, 'id' | 'created_at'>>) => {
    update(id, fields);
    setSelected((prev) => (prev && prev.id === id ? { ...prev, ...fields } : prev));
  };

  const handleInboxKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && inboxInput.trim()) {
      add(inboxInput);
      setInboxInput('');
    }
  };

  return (
    <div className="flex flex-col h-dvh max-w-[480px] mx-auto border-x border-border bg-background pt-[var(--sat)]">
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {tab === 'inbox' && (
          <div className="pt-6">
            <h1 className="text-4xl font-serif font-bold mb-6 tracking-tight">Inbox</h1>
            <div className="flex gap-0 mb-6 border border-border">
              <input
                className="flex-1 px-3 py-2 text-sm bg-transparent text-foreground outline-none placeholder:text-muted/60"
                placeholder="Capture anything..."
                value={inboxInput}
                onChange={(e) => setInboxInput(e.target.value)}
                onKeyDown={handleInboxKey}
                autoFocus
              />
              <button
                className="px-4 py-2 bg-foreground text-background font-bold text-xs uppercase tracking-widest cursor-pointer hover:bg-foreground/90 transition-colors disabled:opacity-40"
                disabled={!inboxInput.trim()}
                onClick={() => { add(inboxInput); setInboxInput(''); }}
              >
                Add
              </button>
            </div>
            {inboxTasks.length === 0 ? (
              <div className="border-t border-border pt-8 text-center">
                <p className="text-muted/60 text-sm italic">Inbox Zero!</p>
              </div>
            ) : (
              <div className="border-t border-border">
                {inboxTasks.map((t) => (
                  <TaskCard key={t.id} task={t} onToggle={handleToggle} onSelect={handleSelect} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'today' && (
          <div className="pt-6">
            <h1 className="text-4xl font-serif font-bold mb-6 tracking-tight">Today</h1>
            {todayTasks.length === 0 ? (
              <div className="border-t border-border pt-8 text-center">
                <p className="text-muted/60 text-sm italic">Nothing urgent today</p>
              </div>
            ) : (
              <div className="border-t border-border">
                {todayTasks.map((t) => (
                  <TaskCard key={t.id} task={t} onToggle={handleToggle} onSelect={handleSelect} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'next' && (
          <div className="pt-6">
            <h1 className="text-4xl font-serif font-bold mb-6 tracking-tight">Next</h1>
            {nextTasks.length === 0 ? (
              <div className="border-t border-border pt-8 text-center">
                <p className="text-muted/60 text-sm italic">No next actions</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {Array.from(nextByContext.entries()).map(([ctx, ctxTasks]) => {
                  if (ctxTasks.length === 0) return null;
                  const collapsed = collapsedCtx.has(ctx);
                  return (
                    <div key={ctx} className="group">
                      <button
                        className="flex items-center justify-between w-full bg-transparent border-none text-foreground cursor-pointer p-0 mb-2 group-hover:text-accent transition-colors"
                        onClick={() => toggleCtx(ctx)}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] transition-transform ${collapsed ? '-rotate-90' : ''}`}>
                            ▼
                          </span>
                          <span className="text-xs font-bold uppercase tracking-[0.2em]">{contextLabel(ctx)}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted/60">{ctxTasks.length} ITEMS</span>
                      </button>
                      {!collapsed && (
                        <div className="border-t border-border">
                          {ctxTasks.map((t) => (
                            <TaskCard key={t.id} task={t} onToggle={handleToggle} onSelect={handleSelect} />
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

        {tab === 'projects' && (
          <div className="pt-6">
            <h1 className="text-4xl font-serif font-bold mb-6 tracking-tight">Projects</h1>
            <ProjectList
              projects={projects}
              tasks={tasks}
              somedayTasks={somedayTasks}
              onAddProject={addProject}
              onToggleTask={handleToggle}
              onSelectTask={handleSelect}
            />
          </div>
        )}

        {tab === 'logbook' && (
          <Logbook onSelectTab={setTab} />
        )}
      </div>

      <TabBar active={tab} onChange={setTab} badges={badges} />

      {selected && (
        <TaskDetail
          task={selected}
          projects={projects}
          contexts={contexts}
          onUpdate={handleUpdate}
          onRemove={remove}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
