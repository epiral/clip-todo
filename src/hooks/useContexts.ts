import { useState, useEffect, useCallback } from 'react';
import { invoke, isBridge } from '../lib/bridge';

export function useContexts() {
  const [contexts, setContexts] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (isBridge()) {
      try {
        const list = await invoke<string[]>('context-list', {});
        setContexts(list);
      } catch (e) {
        console.error('[contexts] load failed:', e);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { contexts, reload: load };
}
