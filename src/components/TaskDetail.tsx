import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, Project } from '../types';

interface Props {
  task: Task;
  projects: Project[];
  contexts: string[];
  onUpdate: (id: string, fields: Partial<Omit<Task, 'id' | 'created_at'>>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'next', label: 'Next' },
  { value: 'someday', label: 'Someday' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 0, label: 'P0 Urgent' },
  { value: 1, label: 'P1 High' },
  { value: 2, label: 'P2 Medium' },
  { value: 3, label: 'P3 Low' },
];

export default function TaskDetail({ task, projects, contexts, onUpdate, onRemove, onClose }: Props) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);

  const save = (fields: Partial<Omit<Task, 'id' | 'created_at'>>) => {
    onUpdate(task.id, fields);
  };

  const handleTitleBlur = () => {
    const t = title.trim();
    if (t && t !== task.title) save({ title: t });
  };

  const handleNotesBlur = () => {
    if (notes !== task.notes) save({ notes });
  };

  return (
    <div className="fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-background w-full max-w-[480px] max-h-[90dvh] overflow-y-auto border-t-4 border-foreground shadow-none p-6 pb-[max(24px,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] text-muted/60 font-mono tracking-tighter uppercase font-bold">ID // {task.id}</span>
          <button
            className="text-foreground hover:bg-surface-hover transition-colors p-1 border border-border"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <input
          className="w-full text-3xl font-serif font-bold bg-transparent border-none border-b border-foreground outline-none text-foreground pb-2 mb-8 tracking-tight"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
        />

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-8">
          <FieldGroup label="Status">
            <select
              className="w-full px-0 py-1.5 text-xs font-bold uppercase tracking-widest bg-transparent border-none border-b border-border text-foreground outline-none appearance-none cursor-pointer"
              value={task.status}
              onChange={(e) => {
                const status = e.target.value as TaskStatus;
                const fields: Partial<Omit<Task, 'id' | 'created_at'>> = { status };
                if (status === 'done') fields.completed_at = Math.floor(Date.now() / 1000);
                else fields.completed_at = null;
                save(fields);
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label.toUpperCase()}</option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Priority">
            <select
              className="w-full px-0 py-1.5 text-xs font-bold uppercase tracking-widest bg-transparent border-none border-b border-border text-foreground outline-none appearance-none cursor-pointer"
              value={task.priority}
              onChange={(e) => save({ priority: Number(e.target.value) as TaskPriority })}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label.toUpperCase()}</option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Context">
            <select
              className="w-full px-0 py-1.5 text-xs font-bold uppercase tracking-widest bg-transparent border-none border-b border-border text-foreground outline-none appearance-none cursor-pointer"
              value={task.context || ''}
              onChange={(e) => save({ context: e.target.value })}
            >
              <option value="">NONE</option>
              {contexts.map((ctx) => (
                <option key={ctx} value={ctx}>{ctx.toUpperCase()}</option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Project">
            <select
              className="w-full px-0 py-1.5 text-xs font-bold uppercase tracking-widest bg-transparent border-none border-b border-border text-foreground outline-none appearance-none cursor-pointer"
              value={task.project ?? ''}
              onChange={(e) => save({ project: e.target.value })}
            >
              <option value="">NONE</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>{p.name.toUpperCase()}</option>
              ))}
            </select>
          </FieldGroup>
        </div>

        <div className="space-y-6">
          <FieldGroup label="Due Date">
            <input
              type="date"
              className="w-full px-0 py-1.5 text-xs font-bold bg-transparent border-none border-b border-border text-foreground outline-none"
              value={task.due_date || ''}
              onChange={(e) => save({ due_date: e.target.value || null })}
            />
          </FieldGroup>

          {task.status === 'waiting' && (
            <FieldGroup label="Waiting For">
              <input
                type="text"
                className="w-full px-0 py-1.5 text-xs font-medium bg-transparent border-none border-b border-border text-foreground outline-none"
                value={task.waiting_for || ''}
                onChange={(e) => save({ waiting_for: e.target.value })}
                placeholder="Details..."
              />
            </FieldGroup>
          )}

          <FieldGroup label="Notes">
            <textarea
              className="w-full px-3 py-2 text-sm bg-surface-hover border border-border text-foreground outline-none resize-y min-h-[120px] leading-relaxed"
              value={notes || ''}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Record observations..."
              rows={4}
            />
          </FieldGroup>
        </div>

        <button
          className="w-full mt-10 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-danger border border-danger bg-transparent hover:bg-danger hover:text-background transition-colors flex items-center justify-center gap-2"
          onClick={() => { if(confirm('Permanently delete this task?')) { onRemove(task.id); onClose(); } }}
        >
          <Trash2 size={12} />
          Delete Task
        </button>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className="text-[9px] font-black text-muted uppercase tracking-[0.15em] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
