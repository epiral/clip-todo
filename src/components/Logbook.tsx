import { useEffect, useState, useMemo } from 'react';
import { invoke } from '../lib/bridge';
import type { TabId } from './TabBar';

interface HistoryTask {
  id: string;
  title: string;
  context: string;
  completed_at: number;
  project: string;
}

interface HistoryGroup {
  date: string;
  label: string;
  tasks: HistoryTask[];
}

interface Props {
  onSelectTab?: (tab: TabId) => void;
}

export default function Logbook({ onSelectTab }: Props) {
  const [history, setHistory] = useState<HistoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await invoke<HistoryGroup[]>('history', { days: 30 });
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const weekTotal = useMemo(() => {
    const sevenDaysAgo = Date.now() / 1000 - 7 * 86400;
    let total = 0;
    for (const group of history) {
      for (const t of group.tasks) {
        if (t.completed_at >= sevenDaysAgo) total++;
      }
    }
    return total;
  }, [history]);

  if (loading) {
    return <div className="pt-12 text-center text-muted/60 animate-pulse font-serif italic">Loading history...</div>;
  }

  return (
    <div className="pt-6">
      <h1 className="text-4xl font-serif font-bold mb-2 tracking-tight">Logbook</h1>
      
      <div className="flex gap-4 mb-8 text-[10px] text-muted font-bold uppercase tracking-widest">
        <span>Completed this week: {weekTotal}</span>
      </div>

      {history.length === 0 ? (
        <div className="border-t border-border pt-12 text-center flex flex-col items-center gap-4">
          <p className="text-muted/60 text-sm italic">No completed tasks yet</p>
          {onSelectTab && (
            <button 
              onClick={() => onSelectTab('today')}
              className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 border border-border hover:bg-foreground hover:text-background transition-colors"
            >
              Back to Today
            </button>
          )}
        </div>
      ) : (
        <div className="relative border-l border-border ml-1 pl-6 flex flex-col gap-10 pb-12">
          {history.map((group) => (
            <div key={group.date} className="relative">
              <div className="absolute -left-[28.5px] top-1 w-2 h-2 bg-foreground" />
              
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider">{group.label}</h3>
                <span className="text-[10px] font-mono text-muted/60">{group.tasks.length} DONE</span>
              </div>

              <div className="flex flex-col gap-3">
                {group.tasks.map((t) => {
                  const date = new Date(t.completed_at * 1000);
                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                  return (
                    <div key={t.id} className="flex flex-col gap-1 group">
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm text-muted line-through decoration-muted/40 transition-colors group-hover:text-foreground/60">
                          {t.title}
                        </span>
                        <span className="text-[10px] font-mono text-muted/40">{timeStr}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {t.context && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight bg-ctx-bg text-ctx-fg">
                            {t.context}
                          </span>
                        )}
                        {t.project && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight border border-border text-muted/60">
                            {t.project}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
