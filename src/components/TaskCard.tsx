import type { Task } from "../hooks/useTasks";

interface Props {
  task: Task;
  onToggle: (id: number) => void;
  onSelect: (task: Task) => void;
}

// 今日零点 timestamp (seconds)
function todayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

export default function TaskCard({ task, onToggle, onSelect }: Props) {
  const isDone = task.status === "done";
  const isOverdue = task.due_date != null && task.due_date < todayStart() && !isDone;

  const formatDate = (ts: number) => {
    const d = new Date(ts * 1000);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="task-card" onClick={() => onSelect(task)}>
      <button
        className={`checkbox ${isDone ? "checked" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
      />
      <div className="task-card-body">
        <span className={`task-title ${isDone ? "done" : ""}`}>
          {task.title}
        </span>
        {task.due_date != null && (
          <span className={`task-due ${isOverdue ? "overdue" : ""}`}>
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
      <div className="task-card-meta">
        {task.priority === 0 && <span className="priority-dot p0" />}
        {task.priority === 1 && <span className="priority-dot p1" />}
        {task.context && <span className="context-tag">{task.context}</span>}
      </div>
    </div>
  );
}
