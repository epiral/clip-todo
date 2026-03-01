import { useState } from "react";
import type { Project } from "../hooks/useProjects";
import type { Task } from "../hooks/useTasks";
import TaskCard from "./TaskCard";

interface Props {
  projects: Project[];
  tasks: Task[];
  onAddProject: (name: string) => void;
  onToggleTask: (id: number) => void;
  onSelectTask: (task: Task) => void;
}

export default function ProjectList({
  projects,
  tasks,
  onAddProject,
  onToggleTask,
  onSelectTask,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const taskCountMap = new Map<number, number>();
  for (const t of tasks) {
    if (t.project_id != null && t.status !== "done") {
      taskCountMap.set(t.project_id, (taskCountMap.get(t.project_id) || 0) + 1);
    }
  }

  if (selectedProject != null) {
    const project = projects.find((p) => p.id === selectedProject);
    const projectTasks = tasks.filter(
      (t) => t.project_id === selectedProject && t.status !== "done"
    );
    return (
      <div className="project-detail-view">
        <button className="back-btn" onClick={() => setSelectedProject(null)}>
          &larr; Projects
        </button>
        <h2 className="project-detail-title">
          <span
            className="project-color-dot"
            style={{ background: project?.color || "#8b6f47" }}
          />
          {project?.name || "Project"}
        </h2>
        {projectTasks.length === 0 ? (
          <p className="empty-hint">No active tasks</p>
        ) : (
          <div className="task-list">
            {projectTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onToggle={onToggleTask}
                onSelect={onSelectTask}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="project-list-view">
      {projects.length === 0 ? (
        <p className="empty-hint">No projects yet</p>
      ) : (
        <div className="project-cards">
          {projects.map((p) => (
            <button
              key={p.id}
              className="project-card"
              onClick={() => setSelectedProject(p.id)}
            >
              <span
                className="project-color-dot"
                style={{ background: p.color }}
              />
              <span className="project-card-name">{p.name}</span>
              <span className="project-card-count">
                {taskCountMap.get(p.id) || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {adding ? (
        <div className="project-add-form">
          <input
            className="project-add-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                onAddProject(newName);
                setNewName("");
                setAdding(false);
              }
              if (e.key === "Escape") {
                setNewName("");
                setAdding(false);
              }
            }}
          />
        </div>
      ) : (
        <button className="project-add-btn" onClick={() => setAdding(true)}>
          + New Project
        </button>
      )}
    </div>
  );
}
