import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";

/* ---------- Types ---------- */

interface Task {
  id: string;
  description: string;
  position: number | null;
}

interface TaskView {
  task: Task;
  categoryId: string;
  completed: boolean;
}

interface CategoryNode {
  id: string;
  name: string;
  parent_id: string | null;
  position: number;
}

interface FolderNode {
  id: string;
  name: string;
  children: FolderNode[];
  tasks: TaskView[];
}

/* ---------- Component ---------- */

export default function TaskTree() {
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [unassigned, setUnassigned] = useState<Task[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    /* ---------- Categories ---------- */
    const { data: categories } = await supabase
      .from("task_category_nodes")
      .select("id, name, parent_id, position")
      .order("position");

    /* ---------- Tasks + links ---------- */
    const { data: tasks } = await supabase
      .from("tasks")
      .select(`
        id,
        description,
        position,
        task_category_links (
          category_id,
          completed
        )
      `)
      .order("position");

    if (!categories || !tasks) return;

    const normalizedTasks = tasks.map((t: any) => ({
      task: {
        id: t.id,
        description: t.description,
        position: t.position,
      },
      links: t.task_category_links ?? [],
    }));

    const { tree, unassigned } = buildTree(
      categories,
      normalizedTasks
    );

    setTree(tree);
    setUnassigned(unassigned);
  }

  /* ---------- Build Nested Tree ---------- */

  function buildTree(
    categories: CategoryNode[],
    tasks: {
      task: Task;
      links: { category_id: string; completed: boolean }[];
    }[]
  ): { tree: FolderNode[]; unassigned: Task[] } {
    const nodeMap = new Map<string, FolderNode>();

    categories.forEach((c) => {
      nodeMap.set(c.id, {
        id: c.id,
        name: c.name,
        children: [],
        tasks: [],
      });
    });

    const roots: FolderNode[] = [];

    categories.forEach((c) => {
      const node = nodeMap.get(c.id)!;
      if (c.parent_id) {
        nodeMap.get(c.parent_id)?.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const unassigned: Task[] = [];

    tasks.forEach(({ task, links }) => {
      if (!links.length) {
        unassigned.push(task);
        return;
      }

      links.forEach((link) => {
        nodeMap.get(link.category_id)?.tasks.push({
          task,
          categoryId: link.category_id,
          completed: link.completed,
        });
      });
    });

    return { tree: roots, unassigned };
  }

  /* ---------- Actions ---------- */

  async function toggleTask(view: TaskView) {
    await supabase
      .from("task_category_links")
      .update({ completed: !view.completed })
      .eq("task_id", view.task.id)
      .eq("category_id", view.categoryId);

    loadData();
  }

  function toggleFolder(id: string) {
    setCollapsed((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  /* ---------- Render ---------- */

  return (
    <div>
      {tree.map((node) => (
        <FolderNodeView
          key={node.id}
          node={node}
          collapsed={collapsed}
          onToggleFolder={toggleFolder}
          onToggleTask={toggleTask}
          onEditTask={(id) =>
            navigate(`/engineering/tasks/${id}`)
          }
        />
      ))}

      {/* ---------- Unassigned ---------- */}
      {unassigned.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 600 }}>Unassigned</div>
          <div style={{ marginLeft: 20 }}>
            {unassigned.map((task) => (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  margin: "4px 0",
                }}
              >
                <input type="checkbox" disabled />
                <span style={{ flex: 1 }}>{task.description}</span>
                <Pencil
                  size={14}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/engineering/tasks/${task.id}`)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Folder Node ---------- */

function FolderNodeView({
  node,
  collapsed,
  onToggleFolder,
  onToggleTask,
  onEditTask,
}: {
  node: FolderNode;
  collapsed: Record<string, boolean>;
  onToggleFolder: (id: string) => void;
  onToggleTask: (view: TaskView) => void;
  onEditTask: (id: string) => void;
}) {
  const isCollapsed = collapsed[node.id];

  return (
    <div style={{ marginLeft: 12, marginTop: 6 }}>
      <div
        style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
        onClick={() => onToggleFolder(node.id)}
      >
        {isCollapsed ? (
          <ChevronRight size={16} />
        ) : (
          <ChevronDown size={16} />
        )}
        <span style={{ fontWeight: 600, marginLeft: 4 }}>
          {node.name}
        </span>
      </div>

      {!isCollapsed && (
        <div style={{ marginLeft: 20 }}>
          {node.tasks.map((view) => (
            <TaskRow
              key={`${view.categoryId}-${view.task.id}`}
              view={view}
              onToggle={() => onToggleTask(view)}
              onEdit={() => onEditTask(view.task.id)}
            />
          ))}

          {node.children.map((child) => (
            <FolderNodeView
              key={child.id}
              node={child}
              collapsed={collapsed}
              onToggleFolder={onToggleFolder}
              onToggleTask={onToggleTask}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Task Row ---------- */

function TaskRow({
  view,
  onToggle,
  onEdit,
}: {
  view: TaskView;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "4px 0",
      }}
    >
      <input
        type="checkbox"
        checked={view.completed}
        onChange={onToggle}
      />
      <span style={{ flex: 1 }}>{view.task.description}</span>
      <Pencil size={14} style={{ cursor: "pointer" }} onClick={onEdit} />
    </div>
  );
}
