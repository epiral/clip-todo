import { useState, useEffect, useCallback } from 'react';
import { invoke, isLocalStorageMode } from '../lib/bridge';

export function useContexts() {
  const [contexts, setContexts] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (isLocalStorageMode()) return;
    try {
      const list = await invoke<string[]>('contexts', {});
      setContexts(list);
    } catch (e) {
      console.error('[contexts] load failed:', e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { contexts, reload: load };
}
