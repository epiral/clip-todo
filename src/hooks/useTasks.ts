import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke, isBridge } from '../lib/bridge';
import type { Task, RawTask, TaskStatus, TaskPriority } from '../types';

const LS_KEY = 'gtd-tasks';

function lsRead(): Task[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function lsWrite(tasks: Task[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}

let nextId = Date.now();

function parseRaw(r: RawTask): Task {
  return {
    ...r,
    context: r.context || '',
    priority: (r.priority ?? 1) as TaskPriority,
    status: (r.status || 'inbox') as TaskStatus,
    waiting_for: r.waiting_for || '',
    notes: r.notes || '',
  };
}

/** Unix timestamp → "YYYY-MM-DD" (local time) for command stdin */
function tsToDateStr(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const useBridgeRef = useRef(false);

  const load = useCallback(async () => {
    if (useBridgeRef.current) {
      try {
        const rows = await invoke<RawTask[]>('task-list', { include_done: true });
        setTasks(rows.map(parseRaw));
      } catch (e) {
        console.error('[tasks] query failed:', e);
        setTasks(lsRead());
      }
    } else {
      setTasks(lsRead());
    }
  }, []);

  useEffect(() => {
    if (isBridge()) useBridgeRef.current = true;
    load();
  }, [load]);

  const add = useCallback(async (title: string) => {
    const t = title.trim();
    if (!t) return;
    if (useBridgeRef.current) {
      await invoke('task-create', { title: t });
    } else {
      const now = Math.floor(Date.now() / 1000);
      const list = lsRead();
      list.unshift({
        id: nextId++, project_id: null, title: t, notes: '', context: '',
        priority: 1, due_date: null, status: 'inbox', waiting_for: '',
        completed_at: null, created_at: now,
      });
      lsWrite(list);
    }
    await load();
  }, [load]);

  const update = useCallback(async (id: number, fields: Partial<Omit<Task, 'id' | 'created_at'>>) => {
    if (useBridgeRef.current) {
      const payload: Record<string, unknown> = { id };
      for (const [key, val] of Object.entries(fields)) {
        if (val !== undefined) {
          if (key === 'due_date' && typeof val === 'number') {
            payload[key] = tsToDateStr(val);
          } else {
            payload[key] = val;
          }
        }
      }
      await invoke('task-update', payload);
    } else {
      const list = lsRead().map((t) => t.id === id ? { ...t, ...fields } : t);
      lsWrite(list);
    }
    await load();
  }, [load]);

  const complete = useCallback(async (id: number) => {
    if (useBridgeRef.current) {
      await invoke('task-done', { id });
    } else {
      const now = Math.floor(Date.now() / 1000);
      const list = lsRead().map((t) =>
        t.id === id ? { ...t, status: 'done' as TaskStatus, completed_at: now } : t
      );
      lsWrite(list);
    }
    await load();
  }, [load]);

  const uncomplete = useCallback(async (id: number) => {
    if (useBridgeRef.current) {
      await invoke('task-undone', { id });
    } else {
      const list = lsRead().map((t) =>
        t.id === id ? { ...t, status: 'inbox' as TaskStatus, completed_at: null } : t
      );
      lsWrite(list);
    }
    await load();
  }, [load]);

  const remove = useCallback(async (id: number) => {
    if (useBridgeRef.current) {
      await invoke('task-delete', { id });
    } else {
      lsWrite(lsRead().filter((t) => t.id !== id));
    }
    await load();
  }, [load]);

  return { tasks, add, update, complete, uncomplete, remove, reload: load };
}
