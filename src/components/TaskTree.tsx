import { useEffect, useState } from "react";
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
  const [folders, setFolders] = useState<TaskFolder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignedTaskIds, setAssignedTaskIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  /* =======================
     DND
  ======================= */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* =======================
     LOAD
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

  function isDescendant(parentId: string, childId: string): boolean {
    let current = folders.find((f) => f.id === childId);
    while (current) {
      if (current.parent_id === parentId) return true;
      current = current.parent_id
        ? folders.find((f) => f.id === current!.parent_id)
        : undefined;
    }
    return false;
  }

  /* =======================
     DRAG END
  ======================= */

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    const draggedTask = tasks.find((t) => t.id === draggedId);
    const draggedFolder = folders.find((f) => f.id === draggedId);

    /* ---------- TASK ---------- */
    if (draggedTask) {
      const targetFolderId = overId.startsWith("drop:")
        ? overId.split(":")[1] === "unassigned"
          ? null
          : overId.split(":")[1]
        : overId === "unassigned"
        ? null
        : overId;

      await supabase
        .from("tasks")
        .update({ folder_id: targetFolderId })
        .eq("id", draggedId);

      setTasks((p) =>
        p.map((t) =>
          t.id === draggedId ? { ...t, folder_id: targetFolderId } : t
        )
      );
      return;
    }

    /* ---------- FOLDER (✅ FIXED) ---------- */
    if (draggedFolder) {
      const targetParentId = overId.startsWith("drop:")
        ? overId.split(":")[1] === "unassigned"
          ? null
          : overId.split(":")[1]
        : overId === "unassigned"
        ? null
        : overId;

      if (targetParentId) {
        if (targetParentId === draggedId) return;
        if (isDescendant(draggedId, targetParentId)) return;
      }

      await supabase
        .from("task_folders")
        .update({ parent_id: targetParentId })
        .eq("id", draggedId);

      setFolders((p) =>
        p.map((f) =>
          f.id === draggedId ? { ...f, parent_id: targetParentId } : f
        )
      );
    }
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

        <div
          style={{
            display: "flex",
            gap: 12,
            paddingRight: 8,
            fontSize: 18,
          }}
        >
          {actions}
        </div>
      </div>
    );
  }

  /* =======================
     DROP LINE
  ======================= */

  function DropLine({
    folderId,
    index,
    depth,
  }: {
    folderId: string;
    index: number;
    depth: number;
  }) {
    const { setNodeRef, isOver } = useDroppable({
      id: `drop:${folderId}:${index}`,
    });

    return (
      <div
        ref={setNodeRef}
        style={{
          height: DROP_HIT_HEIGHT,
          marginTop: -DROP_HIT_HEIGHT / 2,
          marginBottom: -DROP_HIT_HEIGHT / 2,
          marginLeft: depth * INDENT,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            height: 2,
            width: "100%",
            backgroundColor: isOver ? "#2563eb" : "transparent",
          }}
        />
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
            <label>
              <input
                type="checkbox"
                checked={assignedTaskIds.includes(task.id)}
                readOnly
              />{" "}
              {task.description}
            </label>
          }
          actions={
            <>
              <span style={{ opacity: 0.5 }}>✏️</span>
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

    const { setNodeRef: dropRef } = useDroppable({ id: folder.id });

    const drag =
      folder.id !== "unassigned" && "position" in folder
        ? useDraggable({ id: folder.id })
        : ({} as any);

    return (
      <div ref={dropRef}>
        <div
          ref={drag.setNodeRef}
          style={{ transform: CSS.Translate.toString(drag.transform) }}
        >
          <Row
            depth={depth}
            content={
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
            }
            actions={
              folder.id === "unassigned" ? (
                <></>
              ) : (
                <>
                  <span style={{ opacity: 0.5 }}>✏️</span>
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
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
            />
          ))}

        {!isCollapsed &&
          tasksHere.map((task, i) => (
            <div key={task.id}>
              <DropLine
                folderId={folder.id}
                index={i}
                depth={depth + 1}
              />
              <DraggableTask task={task} depth={depth + 1} />
            </div>
          ))}

        {!isCollapsed && (
          <DropLine
            folderId={folder.id}
            index={tasksHere.length}
            depth={depth + 1}
          />
        )}
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
      onDragEnd={handleDragEnd}
    >
      {(foldersByParent.get(null) || []).map((folder) => (
        <FolderNode key={folder.id} folder={folder} depth={0} />
      ))}

      <FolderNode
        folder={{ id: "unassigned", name: "Unassigned" }}
        depth={0}
      />
    </DndContext>
  );
}
