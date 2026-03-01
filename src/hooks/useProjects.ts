import { useState, useEffect, useCallback, useRef } from "react";
import { pinixInvoke, hasBridge } from "./pinixInvoke";

export interface Project {
  id: number;
  name: string;
  color: string;
  area: string;
  archived: boolean;
  created_at: number;
}

// localStorage fallback
const LS_KEY = "gtd-projects";

function lsRead(): Project[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function lsWrite(projects: Project[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(projects));
}

let nextId = Date.now();

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const useBridge = useRef(false);

  const load = useCallback(async () => {
    if (useBridge.current) {
      try {
        const res = await pinixInvoke("list-projects");
        const rows = JSON.parse(res.stdout) as Record<string, unknown>[];
        setProjects(
          rows.map((r) => ({
            id: r.id as number,
            name: r.name as string,
            color: (r.color as string) || "#8b6f47",
            area: (r.area as string) || "work",
            archived: !!(r.archived as number),
            created_at: r.created_at as number,
          }))
        );
      } catch (e) {
        console.error("[projects] list-projects failed:", e);
        setProjects(lsRead().filter((p) => !p.archived));
      }
    } else {
      setProjects(lsRead().filter((p) => !p.archived));
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
    async (name: string, color = "#8b6f47", area = "work") => {
      const n = name.trim();
      if (!n) return;
      if (useBridge.current) {
        await pinixInvoke("add-project", JSON.stringify({ name: n, color, area }));
      } else {
        const list = lsRead();
        list.unshift({
          id: nextId++,
          name: n,
          color,
          area,
          archived: false,
          created_at: Math.floor(Date.now() / 1000),
        });
        lsWrite(list);
      }
      await load();
    },
    [load]
  );

  const update = useCallback(
    async (id: number, fields: Partial<Pick<Project, "name" | "color" | "area">>) => {
      if (useBridge.current) {
        await pinixInvoke("update-task", JSON.stringify({ id, ...fields }));
      } else {
        const list = lsRead().map((p) =>
          p.id === id ? { ...p, ...fields } : p
        );
        lsWrite(list);
      }
      await load();
    },
    [load]
  );

  const archive = useCallback(
    async (id: number) => {
      if (useBridge.current) {
        await pinixInvoke("archive-project", JSON.stringify({ id }));
      } else {
        const list = lsRead().map((p) =>
          p.id === id ? { ...p, archived: true } : p
        );
        lsWrite(list);
      }
      await load();
    },
    [load]
  );

  return { projects, add, update, archive, reload: load };
}
