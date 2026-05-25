import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import type { Project, Task } from '../types';
import TaskCard from './TaskCard';

interface Props {
  projects: Project[];
  tasks: Task[];
  somedayTasks?: Task[];
  onAddProject: (name: string) => void;
  onToggleTask: (id: string) => void;
  onSelectTask: (task: Task) => void;
}

export default function ProjectList({
  projects, tasks, somedayTasks = [], onAddProject, onToggleTask, onSelectTask,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const taskCountMap = new Map<string, number>();
  for (const t of tasks) {
    if (t.project && t.status !== 'done') {
      taskCountMap.set(t.project, (taskCountMap.get(t.project) || 0) + 1);
    }
  }

  if (selectedProject != null) {
    const project = projects.find((p) => p.id === selectedProject);
    const projectTasks = tasks.filter(
      (t) => t.project === project?.name && t.status !== 'done'
    );
    return (
      <div>
        <button
          className="flex items-center gap-1 text-foreground text-[10px] font-bold uppercase tracking-widest bg-transparent border border-border px-2 py-1 cursor-pointer mb-6 hover:bg-surface-hover"
          onClick={() => setSelectedProject(null)}
        >
          <ArrowLeft size={10} />
          Back to Index
        </button>
        <h2 className="text-3xl font-serif font-bold flex items-center gap-3 mb-6 tracking-tight">
          <span
            className="w-1 h-8 shrink-0"
            style={{ background: project?.color || 'var(--color-foreground)' }}
          />
          {project?.name || 'Project'}
        </h2>
        {projectTasks.length === 0 ? (
          <div className="border-t border-border pt-8 text-center">
            <p className="text-muted/60 text-sm italic">No active tasks</p>
          </div>
        ) : (
          <div className="border-t border-border">
            {projectTasks.map((t) => (
              <TaskCard key={t.id} task={t} onToggle={onToggleTask} onSelect={onSelectTask} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {projects.length === 0 ? (
        <div className="border-t border-border pt-8 text-center">
          <p className="text-muted/60 text-sm italic">No projects yet</p>
        </div>
      ) : (
        <div className="border-t border-border">
          {projects.map((p) => (
            <button
              key={p.id}
              className="flex items-center gap-3 w-full px-3 py-3.5 bg-transparent border-b border-border last:border-b-0 cursor-pointer text-left text-foreground hover:bg-surface-hover transition-colors"
              onClick={() => setSelectedProject(p.id)}
            >
              <span
                className="w-1 h-4 shrink-0"
                style={{ background: p.color }}
              />
              <span className="flex-1 font-bold text-sm uppercase tracking-wide">{p.name}</span>
              <span className="text-muted font-mono text-[10px]">{taskCountMap.get(p.name) || 0}</span>
            </button>
          ))}
        </div>
      )}

      {somedayTasks.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted/60">Someday / Maybe</h3>
            <div className="h-[1px] flex-1 bg-border" />
          </div>
          <div className="opacity-70">
            {somedayTasks.map((t) => (
              <TaskCard key={t.id} task={t} onToggle={onToggleTask} onSelect={onSelectTask} />
            ))}
          </div>
        </div>
      )}

      {adding ? (
        <div className="mt-6 border border-foreground">
          <input
            className="w-full px-3 py-3 text-sm bg-transparent text-foreground outline-none placeholder:text-muted/50"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="PROJECT NAME..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                onAddProject(newName);
                setNewName('');
                setAdding(false);
              }
              if (e.key === 'Escape') {
                setNewName('');
                setAdding(false);
              }
            }}
          />
        </div>
      ) : (
        <button
          className="w-full mt-6 py-3 text-[10px] font-bold text-foreground uppercase tracking-[0.2em] border border-border bg-transparent hover:bg-foreground hover:text-background cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          onClick={() => setAdding(true)}
        >
          <Plus size={12} />
          New Project
        </button>
      )}
    </div>
  );
}
