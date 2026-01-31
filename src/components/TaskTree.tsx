import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

/* =======================
   TYPES
======================= */

type TaskFolder = {
  id: string;
  parent_id: string | null;
  name: string;
};

type Task = {
  id: string;
  description: string;
  folder_id: string | null;
};

type Props = {
  yachtId: string;
};

/* =======================
   CONSTANTS
======================= */

const INDENT = 20;
const HANDLE_WIDTH = 18;
const DROP_ZONE_HEIGHT = 28;

/* =======================
   COMPONENT
======================= */

export default function TaskTree({ yachtId }: Props) {
  const [folders, setFolders] = useState<TaskFolder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignedTaskIds, setAssignedTaskIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);

  /* =======================
     DND SENSORS
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
        supabase.from("task_folders").select("*").order("name"),
        supabase.from("tasks").select("id, description, folder_id"),
        supabase.from("yacht_tasks").select("task_id").eq("yacht_id", yachtId),
      ]);

      setFolders(f || []);
      setTasks(t || []);
      setAssignedTaskIds(yt?.map((r) => r.task_id) || []);
      setLoading(false);
    };

    load();
  }, [yachtId]);

  /* =======================
     TASK ASSIGNMENT
  ======================= */

  const toggleTaskAssignment = async (taskId: string) => {
    const isAssigned = assignedTaskIds.includes(taskId);

    if (isAssigned) {
      await supabase
        .from("yacht_tasks")
        .delete()
        .eq("yacht_id", yachtId)
        .eq("task_id", taskId);

      setAssignedTaskIds((p) => p.filter((t) => t !== taskId));
    } else {
      const { error } = await supabase.from("yacht_tasks").insert({
        yacht_id: yachtId,
        task_id: taskId,
      });

      if (!error) setAssignedTaskIds((p) => [...p, taskId]);
    }
  };

  /* =======================
     DRAG END
  ======================= */

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const targetFolderId =
      over.id === "root" ? null : (over.id as string);

    if (tasks.some((t) => t.id === draggedId)) {
      await supabase
        .from("tasks")
        .update({ folder_id: targetFolderId })
        .eq("id", draggedId);

      setTasks((p) =>
        p.map((t) =>
          t.id === draggedId ? { ...t, folder_id: targetFolderId } : t
        )
      );
    }

    if (folders.some((f) => f.id === draggedId)) {
      await supabase
        .from("task_folders")
        .update({ parent_id: targetFolderId })
        .eq("id", draggedId);

      setFolders((p) =>
        p.map((f) =>
          f.id === draggedId ? { ...f, parent_id: targetFolderId } : f
        )
      );
    }
  };

  /* =======================
     TREE HELPERS
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
     ROW
  ======================= */

  function Row({
    depth,
    handle,
    children,
  }: {
    depth: number;
    handle?: React.ReactNode;
    children: React.ReactNode;
  }) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingLeft: depth * INDENT,
        }}
      >
        <div style={{ width: HANDLE_WIDTH }}>{handle}</div>
        {children}
      </div>
    );
  }

  /* =======================
     DRAGGABLE TASK
  ======================= */

  function DraggableTask({ task, depth }: { task: Task; depth: number }) {
    const { setNodeRef, listeners, attributes, transform } =
      useDraggable({ id: task.id });

    return (
      <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }}>
        <Row
          depth={depth}
          handle={
            <span
              {...listeners}
              {...attributes}
              style={{ cursor: "grab", color: "#888" }}
            >
              ☰
            </span>
          }
        >
          <label>
            <input
              type="checkbox"
              checked={assignedTaskIds.includes(task.id)}
              onChange={() => toggleTaskAssignment(task.id)}
            />{" "}
            {task.description}
          </label>
        </Row>
      </div>
    );
  }

  /* =======================
     DRAGGABLE FOLDER (ROW ONLY)
  ======================= */

  function DraggableFolderRow({
    folder,
    depth,
  }: {
    folder: TaskFolder;
    depth: number;
  }) {
    const { setNodeRef, listeners, attributes, transform } =
      useDraggable({ id: folder.id });

    return (
      <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }}>
        <Row
          depth={depth}
          handle={
            <span
              {...listeners}
              {...attributes}
              style={{ cursor: "grab", color: "#888" }}
            >
              ☰
            </span>
          }
        >
          {renamingFolderId === folder.id ? (
            <input
              autoFocus
              defaultValue={folder.name}
              onBlur={(e) => renameFolder(folder.id, e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                renameFolder(
                  folder.id,
                  (e.target as HTMLInputElement).value
                )
              }
            />
          ) : (
            <strong
              onDoubleClick={() => setRenamingFolderId(folder.id)}
              style={{ cursor: "text" }}
            >
              📁 {folder.name}
            </strong>
          )}
        </Row>
      </div>
    );
  }

  /* =======================
     RENAME
  ======================= */

  const renameFolder = async (folderId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setRenamingFolderId(null);
      return;
    }

    await supabase
      .from("task_folders")
      .update({ name: trimmed })
      .eq("id", folderId);

    setFolders((p) =>
      p.map((f) =>
        f.id === folderId ? { ...f, name: trimmed } : f
      )
    );

    setRenamingFolderId(null);
  };

  /* =======================
     FOLDER CONTENTS (DROP ZONE)
  ======================= */

  function FolderContents({
    folderId,
    depth,
  }: {
    folderId: string | null;
    depth: number;
  }) {
    const droppableId = folderId ?? "root";
    const { setNodeRef, isOver } = useDroppable({ id: droppableId });

    const hasChildren =
      (foldersByParent.get(folderId)?.length ?? 0) +
        (tasksByFolder.get(folderId)?.length ?? 0) >
      0;

    return (
      <div ref={setNodeRef}>
        {hasChildren ? (
          <>
            {(foldersByParent.get(folderId) || []).map((folder) => (
              <div key={folder.id}>
                <DraggableFolderRow folder={folder} depth={depth} />
                <FolderContents
                  folderId={folder.id}
                  depth={depth + 1}
                />
              </div>
            ))}

            {(tasksByFolder.get(folderId) || []).map((task) => (
              <DraggableTask key={task.id} task={task} depth={depth} />
            ))}
          </>
        ) : (
          <div
            style={{
              marginLeft: depth * INDENT + HANDLE_WIDTH,
              height: DROP_ZONE_HEIGHT,
              border: isOver
                ? "2px dashed #2563eb"
                : "2px dashed transparent",
              borderRadius: 4,
              color: "#64748b",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              paddingLeft: 6,
            }}
          >
            Drop items here
          </div>
        )}
      </div>
    );
  }

  /* =======================
     RENDER
  ======================= */

  if (loading) return <p>Loading tasks…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={handleDragEnd}
    >
      <FolderContents folderId={null} depth={0} />
    </DndContext>
  );
}
