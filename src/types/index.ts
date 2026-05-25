export type TaskStatus = 'inbox' | 'next' | 'someday' | 'waiting' | 'done';
export type TaskPriority = 0 | 1 | 2 | 3;

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  context: string;
  project: string;
  notes: string;
  waiting_for: string;
  due_date: string | null;
  source: string;
  created_at: number;
  completed_at: number | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  created_at: number;
  task_count?: number;
}
