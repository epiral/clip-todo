export type TaskStatus = 'inbox' | 'next' | 'someday' | 'waiting' | 'done';
export type TaskPriority = 0 | 1 | 2 | 3;
export type TaskContext = string;

export interface Task {
  id: number;
  project_id: number | null;
  title: string;
  notes: string;
  context: TaskContext;
  priority: TaskPriority;
  due_date: number | null;
  status: TaskStatus;
  waiting_for: string;
  completed_at: number | null;
  created_at: number;
}

export interface RawTask {
  id: number;
  project_id: number | null;
  title: string;
  notes: string;
  context: string;
  priority: number;
  due_date: number | null;
  status: string;
  waiting_for: string;
  completed_at: number | null;
  created_at: number;
}

export interface Project {
  id: number;
  name: string;
  color: string;
  area: string;
  archived: boolean;
  created_at: number;
}

export interface RawProject {
  id: number;
  name: string;
  color: string;
  area: string;
  archived: number;
  created_at: number;
}
