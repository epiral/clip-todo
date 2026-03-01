import { useState } from "react";
import type { Task, TaskStatus, TaskPriority, TaskContext } from "../hooks/useTasks";
import type { Project } from "../hooks/useProjects";

interface Props {
  task: Task;
  projects: Project[];
  onUpdate: (id: number, fields: Partial<Omit<Task, "id" | "created_at">>) => void;
  onRemove: (id: number) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "next", label: "Next" },
  { value: "someday", label: "Someday" },
  { value: "waiting", label: "Waiting" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 0, label: "P0 Urgent" },
  { value: 1, label: "P1" },
  { value: 2, label: "P2" },
  { value: 3, label: "Someday" },
];

const CONTEXT_OPTIONS: { value: TaskContext; label: string }[] = [
  { value: "", label: "None" },
  { value: "@dev", label: "@dev" },
  { value: "@mobile", label: "@mobile" },
  { value: "@pi", label: "@pi" },
  { value: "@waiting", label: "@waiting" },
];

function tsToDateStr(ts: number | null): string {
  if (ts == null) return "";
  const d = new Date(ts * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateStrToTs(s: string): number | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return Math.floor(d.getTime() / 1000);
}

export default function TaskDetail({ task, projects, onUpdate, onRemove, onClose }: Props) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);

  const save = (fields: Partial<Omit<Task, "id" | "created_at">>) => {
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
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <button className="detail-close" onClick={onClose}>Done</button>
        </div>

        <input
          className="detail-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
        />

        <div className="detail-field">
          <label>Status</label>
          <select
            value={task.status}
            onChange={(e) => {
              const status = e.target.value as TaskStatus;
              const fields: Partial<Omit<Task, "id" | "created_at">> = { status };
              if (status === "done") {
                fields.completed_at = Math.floor(Date.now() / 1000);
              } else {
                fields.completed_at = null;
              }
              save(fields);
            }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="detail-field">
          <label>Priority</label>
          <select
            value={task.priority}
            onChange={(e) => save({ priority: Number(e.target.value) as TaskPriority })}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="detail-field">
          <label>Context</label>
          <select
            value={task.context}
            onChange={(e) => save({ context: e.target.value as TaskContext })}
          >
            {CONTEXT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="detail-field">
          <label>Project</label>
          <select
            value={task.project_id ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              save({ project_id: v ? Number(v) : null });
            }}
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="detail-field">
          <label>Due Date</label>
          <input
            type="date"
            value={tsToDateStr(task.due_date)}
            onChange={(e) => save({ due_date: dateStrToTs(e.target.value) })}
          />
        </div>

        {task.status === "waiting" && (
          <div className="detail-field">
            <label>Waiting For</label>
            <input
              type="text"
              value={task.waiting_for}
              onChange={(e) => save({ waiting_for: e.target.value })}
              placeholder="Who/what are you waiting for?"
            />
          </div>
        )}

        <div className="detail-field">
          <label>Notes</label>
          <textarea
            className="detail-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add notes..."
            rows={4}
          />
        </div>

        <button className="detail-delete" onClick={() => { onRemove(task.id); onClose(); }}>
          Delete Task
        </button>
      </div>
    </div>
  );
}
