import { useState, useEffect, useCallback, useRef } from "react";
import { pinixInvoke, hasBridge } from "./pinixInvoke";

export type TaskStatus = "inbox" | "next" | "someday" | "waiting" | "done";
export type TaskPriority = 0 | 1 | 2 | 3;
export type TaskContext = "" | "@dev" | "@mobile" | "@pi" | "@waiting";

export interface Task {
  id: number;
  project_id: number | null;
  title: string;
  notes: string;
  context: TaskContext;
  priority: TaskPriority;
  due_date: number | null;
  status: TaskStatus;
  waiting_for: string;
  completed_at: number | null;
  created_at: number;
}

// localStorage fallback
const LS_KEY = "gtd-tasks";

function lsRead(): Task[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function lsWrite(tasks: Task[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}

let nextId = Date.now();

function parseRaw(r: Record<string, unknown>): Task {
  return {
    id: r.id as number,
    project_id: (r.project_id as number | null) ?? null,
    title: r.title as string,
    notes: (r.notes as string) || "",
    context: ((r.context as string) || "") as TaskContext,
    priority: ((r.priority as number) ?? 1) as TaskPriority,
    due_date: (r.due_date as number | null) ?? null,
    status: ((r.status as string) || "inbox") as TaskStatus,
    waiting_for: (r.waiting_for as string) || "",
    completed_at: (r.completed_at as number | null) ?? null,
    created_at: r.created_at as number,
  };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const useBridge = useRef(false);

  const load = useCallback(async () => {
    if (useBridge.current) {
      try {
        const res = await pinixInvoke("list-tasks");
        const rows = JSON.parse(res.stdout) as Record<string, unknown>[];
        setTasks(rows.map(parseRaw));
      } catch (e) {
        console.error("[tasks] list-tasks failed:", e);
        setTasks(lsRead());
      }
    } else {
      setTasks(lsRead());
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (hasBridge()) {
        useBridge.current = true;
      }
      await load();
    })();
  }, [load]);

  const add = useCallback(
    async (title: string) => {
      const t = title.trim();
      if (!t) return;
      if (useBridge.current) {
        await pinixInvoke("add-task", JSON.stringify({ title: t }));
      } else {
        const now = Math.floor(Date.now() / 1000);
        const list = lsRead();
        list.unshift({
          id: nextId++,
          project_id: null,
          title: t,
          notes: "",
          context: "",
          priority: 1,
          due_date: null,
          status: "inbox",
          waiting_for: "",
          completed_at: null,
          created_at: now,
        });
        lsWrite(list);
      }
      await load();
    },
    [load]
  );

  const update = useCallback(
    async (id: number, fields: Partial<Omit<Task, "id" | "created_at">>) => {
      if (useBridge.current) {
        await pinixInvoke("update-task", JSON.stringify({ id, ...fields }));
      } else {
        const list = lsRead().map((t) =>
          t.id === id ? { ...t, ...fields } : t
        );
        lsWrite(list);
      }
      await load();
    },
    [load]
  );

  const complete = useCallback(
    async (id: number) => {
      if (useBridge.current) {
        await pinixInvoke("complete-task", JSON.stringify({ id }));
      } else {
        const now = Math.floor(Date.now() / 1000);
        const list = lsRead().map((t) =>
          t.id === id ? { ...t, status: "done" as TaskStatus, completed_at: now } : t
        );
        lsWrite(list);
      }
      await load();
    },
    [load]
  );

  const uncomplete = useCallback(
    async (id: number) => {
      if (useBridge.current) {
        await pinixInvoke("uncomplete-task", JSON.stringify({ id }));
      } else {
        const list = lsRead().map((t) =>
          t.id === id ? { ...t, status: "inbox" as TaskStatus, completed_at: null } : t
        );
        lsWrite(list);
      }
      await load();
    },
    [load]
  );

  const remove = useCallback(
    async (id: number) => {
      if (useBridge.current) {
        await pinixInvoke("delete-task", JSON.stringify({ id }));
      } else {
        lsWrite(lsRead().filter((t) => t.id !== id));
      }
      await load();
    },
    [load]
  );

  return { tasks, add, update, complete, uncomplete, remove, reload: load };
}
