import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke, isLocalStorageMode } from '../lib/bridge';
import type { Project } from '../types';

const LS_KEY = 'todo-projects';

function lsRead(): Project[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function lsWrite(projects: Project[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(projects));
}

let nextId = Date.now();

function genId(): string {
  return (nextId++).toString(36) + Math.random().toString(36).slice(2, 6);
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const useLS = useRef(false);

  const load = useCallback(async () => {
    if (!useLS.current) {
      try {
        const rows = await invoke<Project[]>('project/list', {});
        setProjects(rows);
      } catch {
        useLS.current = true;
        setProjects(lsRead().filter((p) => !p.archived));
      }
    } else {
      setProjects(lsRead().filter((p) => !p.archived));
    }
  }, []);

  useEffect(() => {
    if (isLocalStorageMode()) useLS.current = true;
    load();
  }, [load]);

  const add = useCallback(async (name: string, color = '#6366f1') => {
    const n = name.trim();
    if (!n) return;
    if (!useLS.current) {
      await invoke('project/create', { name: n, color });
    } else {
      const list = lsRead();
      list.unshift({
        id: genId(), name: n, color, archived: false,
        created_at: Math.floor(Date.now() / 1000),
      });
      lsWrite(list);
    }
    await load();
  }, [load]);

  const archive = useCallback(async (id: string) => {
    if (!useLS.current) {
      await invoke('project/archive', { id });
    } else {
      const list = lsRead().map((p) => p.id === id ? { ...p, archived: true } : p);
      lsWrite(list);
    }
    await load();
  }, [load]);

  return { projects, add, archive, reload: load };
}
