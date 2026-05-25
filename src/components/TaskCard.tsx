import { Check } from 'lucide-react';
import type { Task } from '../types';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onSelect: (task: Task) => void;
}

const PRIORITY_COLORS: Record<number, string> = {
  0: 'bg-p0',
  1: 'bg-p1',
  2: 'bg-p2',
  3: 'bg-p3',
};

export default function TaskCard({ task, onToggle, onSelect }: Props) {
  const isDone = task.status === 'done';
  const isOverdue = task.due_date != null && task.due_date < new Date().toISOString().slice(0, 10) && !isDone;

  return (
    <div
      className="flex items-stretch border-b border-border last:border-b-0 cursor-pointer hover:bg-surface-hover active:bg-surface-hover transition-colors"
      onClick={() => onSelect(task)}
    >
      {/* Priority bar */}
      {task.priority <= 2 && (
        <div className="shrink-0 flex items-center">
          <div className={`w-[3px] h-[60%] ${PRIORITY_COLORS[task.priority]}`} />
        </div>
      )}

      <div className="flex items-start gap-3 px-3 py-2.5 flex-1 min-w-0">
        <button
          className={`w-4 h-4 mt-1 border flex-shrink-0 flex items-center justify-center transition-all p-0 ${
            isDone
              ? 'border-foreground bg-foreground'
              : 'border-checkbox-border bg-transparent hover:border-foreground'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
        >
          {isDone && <Check size={10} className="text-background" strokeWidth={5} />}
        </button>

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className={`text-sm leading-tight break-words ${isDone ? 'line-through text-muted font-normal' : 'text-foreground font-normal'}`}>
            {task.title}
          </span>
          <div className="flex items-center gap-2 flex-wrap min-h-[16px]">
            {task.due_date != null && (
              <span className={`text-[11px] font-mono ${isOverdue ? 'text-p0 font-bold' : 'text-muted'}`}>
                {task.due_date}
              </span>
            )}
            {task.context && (
              <span className="text-[10px] font-semibold px-1 py-0 border bg-ctx-bg text-ctx-fg border-transparent">
                {task.context}
              </span>
            )}
            {task.status === 'waiting' && task.waiting_for && (
              <span className="text-[10px] text-muted italic flex items-center gap-0.5">
                <span className="opacity-60 text-[8px]">WAITING:</span> {task.waiting_for}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
