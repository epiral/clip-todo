import { Clip, command, commandGroup, handler, data, z } from "@pinixai/core";

// ── Data model ──

const TaskStatus = z.enum(["inbox", "next", "someday", "waiting", "done"]);
const TaskPriority = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

const TaskSchema = z.object({
  id: z.string().describe("Unique task ID"),
  title: z.string().describe("Task title"),
  status: TaskStatus.describe("Task status"),
  priority: TaskPriority.describe("Priority: 0=urgent, 1=high, 2=medium, 3=low"),
  context: z.string().describe("Context tag for grouping").default(""),
  project: z.string().describe("Project name").default(""),
  notes: z.string().describe("Additional notes").default(""),
  waiting_for: z.string().describe("What this task is waiting for").default(""),
  due_date: z.string().nullable().describe("Due date in YYYY-MM-DD format").default(null),
  source: z.string().describe("Who created this task (agent name, user, etc)").default(""),
  created_at: z.number().describe("Creation timestamp (Unix seconds)"),
  completed_at: z.number().nullable().describe("Completion timestamp (Unix seconds)").default(null),
});

const TaskSummary = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatus,
  priority: TaskPriority,
  context: z.string(),
  project: z.string(),
  due_date: z.string().nullable(),
  source: z.string(),
  waiting_for: z.string(),
  created_at: z.number(),
  completed_at: z.number().nullable(),
});

const ProjectSchema = z.object({
  id: z.string().describe("Unique project ID"),
  name: z.string().describe("Project name"),
  color: z.string().describe("Display color").default("#6366f1"),
  archived: z.boolean().describe("Whether project is archived").default(false),
  created_at: z.number().describe("Creation timestamp (Unix seconds)"),
});

type Task = z.infer<typeof TaskSchema>;
type Project = z.infer<typeof ProjectSchema>;

// ── Storage helpers ──

const TASKS_FILE = "tasks.json";
const PROJECTS_FILE = "projects.json";

async function loadTasks(): Promise<Task[]> {
  try {
    const buf = await data.read(TASKS_FILE);
    return JSON.parse(buf.toString("utf-8")) as Task[];
  } catch {
    return [];
  }
}

async function saveTasks(tasks: Task[]): Promise<void> {
  await data.write(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

async function loadProjects(): Promise<Project[]> {
  try {
    const buf = await data.read(PROJECTS_FILE);
    return JSON.parse(buf.toString("utf-8")) as Project[];
  } catch {
    return [];
  }
}

async function saveProjects(projects: Project[]): Promise<void> {
  await data.write(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

// ── Clip ──

class TodoClip extends Clip {
  name = "todo";
  domain = "Task management for humans and agents. Any agent can create, track, and complete tasks through a shared todo list.";
  patterns = [
    "add → list (create task then verify)",
    "list → done (review tasks then complete)",
    "list --status next → done (work through next actions)",
    "add → update (create then refine priority/context/project)",
  ];

  entities = {
    Task: TaskSchema.describe("A task with status, priority, context, and project"),
    Project: ProjectSchema.describe("A named project grouping tasks"),
  };

  idleTimeout = 60_000;

  // ── Core commands ──

  @command("Create a new task")
  add = handler(
    z.object({
      title: z.string().describe("Task title"),
      status: TaskStatus.optional().default("inbox").describe("Initial status"),
      priority: TaskPriority.optional().default(1).describe("Priority: 0=urgent, 1=high, 2=medium, 3=low"),
      context: z.string().optional().default("").describe("Context tag"),
      project: z.string().optional().default("").describe("Project name"),
      notes: z.string().optional().default("").describe("Additional notes"),
      due_date: z.string().nullable().optional().default(null).describe("Due date YYYY-MM-DD"),
      waiting_for: z.string().optional().default("").describe("What this task waits for"),
      source: z.string().optional().default("").describe("Creator identity (agent name, user, etc)"),
    }),
    TaskSchema,
    async (input) => {
      const tasks = await loadTasks();
      const now = nowSec();
      const task: Task = {
        id: genId(),
        title: input.title,
        status: input.status,
        priority: input.priority,
        context: input.context,
        project: input.project,
        notes: input.notes,
        due_date: input.due_date,
        waiting_for: input.waiting_for,
        source: input.source,
        created_at: now,
        completed_at: input.status === "done" ? now : null,
      };
      tasks.unshift(task);
      await saveTasks(tasks);
      return task;
    },
  );

  @command("List tasks with optional filters")
  list = handler(
    z.object({
      status: TaskStatus.optional().describe("Filter by status"),
      project: z.string().optional().describe("Filter by project name"),
      context: z.string().optional().describe("Filter by context tag"),
      include_done: z.boolean().optional().default(false).describe("Include completed tasks"),
      today: z.boolean().optional().default(false).describe("Show today's urgent + due tasks"),
    }),
    z.array(TaskSummary),
    async (input) => {
      let tasks = await loadTasks();

      if (input.today) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dayStart = Math.floor(now.getTime() / 1000);
        const dayEnd = dayStart + 86400;
        const todayStr = now.toISOString().slice(0, 10);
        tasks = tasks.filter(
          (t) =>
            t.status !== "done" &&
            (t.priority === 0 || t.due_date === todayStr ||
              (t.due_date != null && (() => {
                const d = new Date(t.due_date + "T00:00:00");
                const ts = Math.floor(d.getTime() / 1000);
                return ts >= dayStart && ts < dayEnd;
              })())),
        );
      } else {
        if (input.status) {
          tasks = tasks.filter((t) => t.status === input.status);
        } else if (!input.include_done) {
          tasks = tasks.filter((t) => t.status !== "done");
        }
      }

      if (input.project) {
        tasks = tasks.filter((t) => t.project === input.project);
      }
      if (input.context) {
        tasks = tasks.filter((t) => t.context === input.context);
      }

      // Sort by priority ASC, then created_at DESC
      tasks.sort((a, b) => a.priority - b.priority || b.created_at - a.created_at);

      return tasks;
    },
  );

  @command("Get task details by ID")
  get = handler(
    z.object({
      id: z.string().describe("Task ID"),
    }),
    TaskSchema,
    async ({ id }) => {
      const tasks = await loadTasks();
      const task = tasks.find((t) => t.id === id);
      if (!task) throw new Error(`Task not found: ${id}`);
      return task;
    },
  );

  @command("Mark a task as done")
  done = handler(
    z.object({
      id: z.string().describe("Task ID"),
    }),
    TaskSchema,
    async ({ id }) => {
      const tasks = await loadTasks();
      const task = tasks.find((t) => t.id === id);
      if (!task) throw new Error(`Task not found: ${id}`);
      task.status = "done";
      task.completed_at = nowSec();
      await saveTasks(tasks);
      return task;
    },
  );

  @command("Update task fields")
  update = handler(
    z.object({
      id: z.string().describe("Task ID"),
      title: z.string().optional().describe("New title"),
      status: TaskStatus.optional().describe("New status"),
      priority: TaskPriority.optional().describe("New priority"),
      context: z.string().optional().describe("New context tag"),
      project: z.string().optional().describe("New project name"),
      notes: z.string().optional().describe("New notes"),
      due_date: z.string().nullable().optional().describe("New due date YYYY-MM-DD or null to clear"),
      waiting_for: z.string().optional().describe("New waiting-for info"),
    }),
    TaskSchema,
    async (input) => {
      const tasks = await loadTasks();
      const task = tasks.find((t) => t.id === input.id);
      if (!task) throw new Error(`Task not found: ${input.id}`);

      if (input.title !== undefined) task.title = input.title;
      if (input.status !== undefined) {
        task.status = input.status;
        if (input.status === "done" && !task.completed_at) {
          task.completed_at = nowSec();
        } else if (input.status !== "done") {
          task.completed_at = null;
        }
      }
      if (input.priority !== undefined) task.priority = input.priority;
      if (input.context !== undefined) task.context = input.context;
      if (input.project !== undefined) task.project = input.project;
      if (input.notes !== undefined) task.notes = input.notes;
      if (input.due_date !== undefined) task.due_date = input.due_date;
      if (input.waiting_for !== undefined) task.waiting_for = input.waiting_for;

      await saveTasks(tasks);
      return task;
    },
  );

  @command("Remove a task permanently")
  remove = handler(
    z.object({
      id: z.string().describe("Task ID"),
    }),
    z.object({ deleted: z.boolean(), id: z.string() }),
    async ({ id }) => {
      const tasks = await loadTasks();
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error(`Task not found: ${id}`);
      tasks.splice(idx, 1);
      await saveTasks(tasks);
      return { deleted: true, id };
    },
  );

  @command("Get task statistics")
  stats = handler(
    z.object({}),
    z.object({
      total: z.number(),
      inbox: z.number(),
      active: z.number(),
      done: z.number(),
      by_project: z.array(z.object({ project: z.string(), count: z.number() })),
      by_context: z.array(z.object({ context: z.string(), count: z.number() })),
    }),
    async () => {
      const tasks = await loadTasks();
      const active = tasks.filter((t) => t.status !== "done" && t.status !== "inbox");
      const projectCounts = new Map<string, number>();
      const contextCounts = new Map<string, number>();

      for (const t of tasks.filter((t) => t.status !== "done")) {
        if (t.project) projectCounts.set(t.project, (projectCounts.get(t.project) || 0) + 1);
        if (t.context) contextCounts.set(t.context, (contextCounts.get(t.context) || 0) + 1);
      }

      return {
        total: tasks.length,
        inbox: tasks.filter((t) => t.status === "inbox").length,
        active: active.length,
        done: tasks.filter((t) => t.status === "done").length,
        by_project: Array.from(projectCounts.entries())
          .map(([project, count]) => ({ project, count }))
          .sort((a, b) => b.count - a.count),
        by_context: Array.from(contextCounts.entries())
          .map(([context, count]) => ({ context, count }))
          .sort((a, b) => b.count - a.count),
      };
    },
  );

  // ── Project sub-commands ──

  @command()
  project = commandGroup("Project management", {
    list: ["List all projects", handler(
      z.object({
        include_archived: z.boolean().optional().default(false).describe("Include archived projects"),
      }),
      z.array(ProjectSchema.extend({ task_count: z.number() })),
      async ({ include_archived }) => {
        let projects = await loadProjects();
        if (!include_archived) projects = projects.filter((p) => !p.archived);
        const tasks = await loadTasks();
        return projects.map((p) => ({
          ...p,
          task_count: tasks.filter((t) => t.project === p.name && t.status !== "done").length,
        }));
      },
    )],
    create: ["Create a new project", handler(
      z.object({
        name: z.string().describe("Project name"),
        color: z.string().optional().default("#6366f1").describe("Display color"),
      }),
      ProjectSchema,
      async ({ name, color }) => {
        const projects = await loadProjects();
        const project: Project = {
          id: genId(),
          name,
          color,
          archived: false,
          created_at: nowSec(),
        };
        projects.unshift(project);
        await saveProjects(projects);
        return project;
      },
    )],
    archive: ["Archive a project", handler(
      z.object({
        id: z.string().describe("Project ID"),
      }),
      ProjectSchema,
      async ({ id }) => {
        const projects = await loadProjects();
        const project = projects.find((p) => p.id === id);
        if (!project) throw new Error(`Project not found: ${id}`);
        project.archived = true;
        await saveProjects(projects);
        return project;
      },
    )],
  });

  // ── History (for Logbook view) ──

  @command("Get completed task history grouped by date")
  history = handler(
    z.object({
      days: z.number().optional().default(30).describe("Number of days to look back"),
    }),
    z.array(z.object({
      date: z.string(),
      label: z.string(),
      tasks: z.array(z.object({
        id: z.string(),
        title: z.string(),
        context: z.string(),
        completed_at: z.number(),
        project: z.string(),
      })),
    })),
    async ({ days }) => {
      const tasks = await loadTasks();
      const now = nowSec();
      const cutoff = now - days * 86400;

      const doneTasks = tasks
        .filter((t) => t.status === "done" && t.completed_at != null && t.completed_at >= cutoff)
        .sort((a, b) => (b.completed_at ?? 0) - (a.completed_at ?? 0));

      // Group by date
      const groups = new Map<string, { date: string; label: string; tasks: typeof doneTasks }>();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().slice(0, 10);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      for (const t of doneTasks) {
        const d = new Date((t.completed_at ?? 0) * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        let label = dateStr;
        if (dateStr === todayStr) label = "Today";
        else if (dateStr === yesterdayStr) label = "Yesterday";
        else {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          label = `${months[d.getMonth()]} ${d.getDate()}`;
        }

        if (!groups.has(dateStr)) {
          groups.set(dateStr, { date: dateStr, label, tasks: [] });
        }
        groups.get(dateStr)!.tasks.push({
          id: t.id,
          title: t.title,
          context: t.context,
          completed_at: t.completed_at!,
          project: t.project,
        });
      }

      return Array.from(groups.values());
    },
  );

  // ── Context helpers ──

  @command("List all unique context tags in use")
  contexts = handler(
    z.object({}),
    z.array(z.string()),
    async () => {
      const tasks = await loadTasks();
      const ctxSet = new Set<string>();
      for (const t of tasks) {
        if (t.context) ctxSet.add(t.context);
      }
      return Array.from(ctxSet).sort();
    },
  );
}

if (import.meta.main) {
  await new TodoClip().start();
}
