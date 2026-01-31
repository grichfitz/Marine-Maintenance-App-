import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

/* =======================
   TYPES
======================= */

type TaskFolder = {
  id: string;
  parent_id: string | null;
  name: string;
  position: number;
};

type Task = {
  id: string;
  description: string;
  folder_id: string | null;
  position: number;
};

type Props = {
  yachtId: string;
};

const INDENT = 20;
const DROP_HIT_HEIGHT = 18;

/* =======================
   COMPONENT
======================= */

export default function TaskTree({ yachtId }: Props) {
  const navigate = useNavigate();

  const [folders, setFolders] = useState<TaskFolder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignedTaskIds, setAssignedTaskIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // folder rename state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderNameDraft, setFolderNameDraft] = useState("");

  /* =======================
     DND
  ======================= */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* =======================
     LOAD DATA
  ======================= */

  useEffect(() => {
    const load = async () => {
      const [{ data: f }, { data: t }, { data: yt }] = await Promise.all([
        supabase.from("task_folders").select("*").order("position"),
        supabase.from("tasks").select("*").order("position"),
        supabase
          .from("yacht_tasks")
          .select("task_id")
          .eq("yacht_id", yachtId),
      ]);

      setFolders(f || []);
      setTasks(t || []);
      setAssignedTaskIds(yt?.map((r) => r.task_id) || []);
      setLoading(false);
    };

    load();
  }, [yachtId]);

  /* =======================
     HELPERS
  ======================= */

  const foldersByParent = new Map<string | null, TaskFolder[]>();
  folders.forEach((f) => {
    const k = f.parent_id ?? null;
    foldersByParent.set(k, [...(foldersByParent.get(k) || []), f]);
  });

  const tasksByFolder = new Map<string | null, Task[]>();
  tasks.forEach((t) => {
    const k = t.folder_id ?? null;
    tasksByFolder.set(k, [...(tasksByFolder.get(k) || []), t]);
  });

  /* =======================
     TASK ASSIGNMENT
  ======================= */

  const toggleTaskAssignment = async (taskId: string) => {
    const isAssigned = assignedTaskIds.includes(taskId);

    setAssignedTaskIds((prev) =>
      isAssigned ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );

    if (isAssigned) {
      await supabase
        .from("yacht_tasks")
        .delete()
        .eq("yacht_id", yachtId)
        .eq("task_id", taskId);
    } else {
      await supabase.from("yacht_tasks").insert({
        yacht_id: yachtId,
        task_id: taskId,
      });
    }
  };

  /* =======================
     FOLDER RENAME
  ======================= */

  const saveFolderName = async (folderId: string) => {
    await supabase
      .from("task_folders")
      .update({ name: folderNameDraft })
      .eq("id", folderId);

    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId ? { ...f, name: folderNameDraft } : f
      )
    );

    setEditingFolderId(null);
  };

  /* =======================
     ROW
  ======================= */

  function Row({
    depth,
    content,
    actions,
  }: {
    depth: number;
    content: React.ReactNode;
    actions: React.ReactNode;
  }) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 36,
        }}
      >
        <div
          style={{
            paddingLeft: depth * INDENT,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
          }}
        >
          {content}
        </div>

        <div style={{ display: "flex", gap: 12, paddingRight: 8 }}>
          {actions}
        </div>
      </div>
    );
  }

  /* =======================
     TASK
  ======================= */

  function DraggableTask({ task, depth }: { task: Task; depth: number }) {
    const { setNodeRef, listeners, attributes, transform } =
      useDraggable({ id: task.id });

    return (
      <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }}>
        <Row
          depth={depth}
          content={
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={assignedTaskIds.includes(task.id)}
                onChange={() => toggleTaskAssignment(task.id)}
                onClick={(e) => e.stopPropagation()}
              />
              {task.description}
            </label>
          }
          actions={
            <>
              <span
                style={{ cursor: "pointer", opacity: 0.6 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/engineering/tasks/${task.id}`);
                }}
              >
                ✏️
              </span>
              <span {...listeners} {...attributes} style={{ cursor: "grab" }}>
                ☰
              </span>
            </>
          }
        />
      </div>
    );
  }

  /* =======================
     FOLDER
  ======================= */

  function FolderNode({
    folder,
    depth,
  }: {
    folder: TaskFolder | { id: "unassigned"; name: string };
    depth: number;
  }) {
    const isCollapsed = collapsed[folder.id];
    const tasksHere =
      tasksByFolder.get(folder.id === "unassigned" ? null : folder.id) || [];

    const drag =
      folder.id !== "unassigned" && "position" in folder
        ? useDraggable({ id: folder.id })
        : ({} as any);

    return (
      <div>
        <div
          ref={drag.setNodeRef}
          style={{ transform: CSS.Translate.toString(drag.transform) }}
        >
          <Row
            depth={depth}
            content={
              editingFolderId === folder.id ? (
                <input
                  autoFocus
                  value={folderNameDraft}
                  onChange={(e) => setFolderNameDraft(e.target.value)}
                  onBlur={() => saveFolderName(folder.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveFolderName(folder.id);
                    if (e.key === "Escape") setEditingFolderId(null);
                  }}
                />
              ) : (
                <strong
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setCollapsed((p) => ({
                      ...p,
                      [folder.id]: !p[folder.id],
                    }))
                  }
                >
                  {isCollapsed ? "▶" : "▼"} 📁 {folder.name}
                </strong>
              )
            }
            actions={
              folder.id === "unassigned" ? null : (
                <>
                  <span
                    style={{ cursor: "pointer", opacity: 0.6 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFolderId(folder.id);
                      setFolderNameDraft(folder.name);
                    }}
                  >
                    ✏️
                  </span>
                  <span
                    {...drag.listeners}
                    {...drag.attributes}
                    style={{ cursor: "grab" }}
                  >
                    ☰
                  </span>
                </>
              )
            }
          />
        </div>

        {!isCollapsed &&
          (foldersByParent.get(folder.id) || []).map((child) => (
            <FolderNode key={child.id} folder={child} depth={depth + 1} />
          ))}

        {!isCollapsed &&
          tasksHere.map((task) => (
            <DraggableTask key={task.id} task={task} depth={depth + 1} />
          ))}
      </div>
    );
  }

  /* =======================
     RENDER
  ======================= */

  if (loading) return <p>Loading tasks…</p>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
    >
      {(foldersByParent.get(null) || []).map((folder) => (
        <FolderNode key={folder.id} folder={folder} depth={0} />
      ))}

      <FolderNode folder={{ id: "unassigned", name: "Unassigned" }} depth={0} />
    </DndContext>
  );
}
