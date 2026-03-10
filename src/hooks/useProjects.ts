import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke, isBridge } from '../lib/bridge';
import type { Project, RawProject } from '../types';

const LS_KEY = 'gtd-projects';

function lsRead(): Project[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function lsWrite(projects: Project[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(projects));
}

let nextId = Date.now();

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const useBridgeRef = useRef(false);

  const load = useCallback(async () => {
    if (useBridgeRef.current) {
      const rows = await invoke<RawProject[]>('project-list', {});
      setProjects(rows.map((r) => ({ ...r, archived: !!r.archived })));
    } else {
      setProjects(lsRead().filter((p) => !p.archived));
    }
  }, []);

  useEffect(() => {
    if (isBridge()) useBridgeRef.current = true;
    load();
  }, [load]);

  const add = useCallback(async (name: string, color = 'oklch(0.6 0.1 265)', area = 'work') => {
    const n = name.trim();
    if (!n) return;
    if (useBridgeRef.current) {
      await invoke('project-create', { name: n, color, area });
    } else {
      const list = lsRead();
      list.unshift({
        id: nextId++, name: n, color, area, archived: false,
        created_at: Math.floor(Date.now() / 1000),
      });
      lsWrite(list);
    }
    await load();
  }, [load]);

  const update = useCallback(async (id: number, fields: Partial<Pick<Project, 'name' | 'color' | 'area'>>) => {
    if (useBridgeRef.current) {
      const payload: Record<string, unknown> = { id };
      if (fields.name !== undefined) payload.name = fields.name;
      if (fields.color !== undefined) payload.color = fields.color;
      if (fields.area !== undefined) payload.area = fields.area;
      await invoke('project-update', payload);
    } else {
      const list = lsRead().map((p) => p.id === id ? { ...p, ...fields } : p);
      lsWrite(list);
    }
    await load();
  }, [load]);

  const archive = useCallback(async (id: number) => {
    if (useBridgeRef.current) {
      await invoke('project-archive', { id });
    } else {
      const list = lsRead().map((p) => p.id === id ? { ...p, archived: true } : p);
      lsWrite(list);
    }
    await load();
  }, [load]);

  return { projects, add, update, archive, reload: load };
}
