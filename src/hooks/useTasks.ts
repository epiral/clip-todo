import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke, isLocalStorageMode } from '../lib/bridge';
import type { Task, TaskStatus, TaskPriority } from '../types';

const LS_KEY = 'todo-tasks';

function lsRead(): Task[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function lsWrite(tasks: Task[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}

let nextId = Date.now();

function genId(): string {
  return (nextId++).toString(36) + Math.random().toString(36).slice(2, 6);
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const useLS = useRef(false);

  const load = useCallback(async () => {
    if (!useLS.current) {
      try {
        const rows = await invoke<Task[]>('list', { include_done: true });
        setTasks(rows);
      } catch {
        // Backend not available, fall back to localStorage
        useLS.current = true;
        setTasks(lsRead());
      }
    } else {
      setTasks(lsRead());
    }
  }, []);

  useEffect(() => {
    if (isLocalStorageMode()) useLS.current = true;
    load();
  }, [load]);

  const add = useCallback(async (title: string) => {
    const t = title.trim();
    if (!t) return;
    if (!useLS.current) {
      await invoke('add', { title: t });
    } else {
      const list = lsRead();
      list.unshift({
        id: genId(), title: t, status: 'inbox' as TaskStatus, priority: 1 as TaskPriority,
        context: '', project: '', notes: '', waiting_for: '', due_date: null,
        source: 'user', created_at: nowSec(), completed_at: null,
      });
      lsWrite(list);
    }
    await load();
  }, [load]);

  const update = useCallback(async (id: string, fields: Partial<Omit<Task, 'id' | 'created_at'>>) => {
    if (!useLS.current) {
      const payload: Record<string, unknown> = { id };
      for (const [key, val] of Object.entries(fields)) {
        if (val !== undefined) payload[key] = val;
      }
      await invoke('update', payload);
    } else {
      const list = lsRead().map((t) => t.id === id ? { ...t, ...fields } : t);
      lsWrite(list);
    }
    await load();
  }, [load]);

  const complete = useCallback(async (id: string) => {
    if (!useLS.current) {
      await invoke('done', { id });
    } else {
      const list = lsRead().map((t) =>
        t.id === id ? { ...t, status: 'done' as TaskStatus, completed_at: nowSec() } : t
      );
      lsWrite(list);
    }
    await load();
  }, [load]);

  const uncomplete = useCallback(async (id: string) => {
    if (!useLS.current) {
      await invoke('update', { id, status: 'inbox' as TaskStatus, completed_at: null });
    } else {
      const list = lsRead().map((t) =>
        t.id === id ? { ...t, status: 'inbox' as TaskStatus, completed_at: null } : t
      );
      lsWrite(list);
    }
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    if (!useLS.current) {
      await invoke('remove', { id });
    } else {
      lsWrite(lsRead().filter((t) => t.id !== id));
    }
    await load();
  }, [load]);

  return { tasks, add, update, complete, uncomplete, remove, reload: load };
}
